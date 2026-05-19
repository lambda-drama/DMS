/**
 * Resize/compress images before upload (Frappe Cloud / nginx often limit ~1MB).
 */

const SKIP_BELOW_BYTES = 400_000;
const TARGET_MAX_BYTES = 1_400_000;

export type CompressImageOptions = {
  /** Longest edge in pixels (default 1920). */
  maxSide?: number;
  /** JPEG quality 0–1 (default 0.82). Ignored for PNG output. */
  quality?: number;
  /** Skip compression when file is already this small (default 400KB). */
  skipBelowBytes?: number;
  /** Try to stay under this size after compression (default ~1.4MB). */
  targetMaxBytes?: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read image'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Image compression failed'))),
      type,
      quality
    );
  });
}

function scaledDimensions(
  naturalWidth: number,
  naturalHeight: number,
  maxSide: number
): { width: number; height: number } {
  const longest = Math.max(naturalWidth, naturalHeight);
  if (longest <= maxSide) {
    return { width: naturalWidth, height: naturalHeight };
  }
  const scale = maxSide / longest;
  return {
    width: Math.max(1, Math.round(naturalWidth * scale)),
    height: Math.max(1, Math.round(naturalHeight * scale)),
  };
}

async function renderToBlob(
  img: HTMLImageElement,
  maxSide: number,
  quality: number,
  asPng: boolean
): Promise<Blob> {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const { width, height } = scaledDimensions(w, h, maxSide);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  ctx.drawImage(img, 0, 0, width, height);

  if (asPng) {
    return canvasToBlob(canvas, 'image/png');
  }
  return canvasToBlob(canvas, 'image/jpeg', quality);
}

/**
 * Downscale and re-encode camera/gallery images so uploads stay under proxy limits.
 * Returns the original file if compression fails or is unnecessary.
 */
export async function compressImageForUpload(
  file: File,
  options?: CompressImageOptions
): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file;
  }

  const skipBelow = options?.skipBelowBytes ?? SKIP_BELOW_BYTES;
  if (file.size <= skipBelow) {
    return file;
  }

  const targetMax = options?.targetMaxBytes ?? TARGET_MAX_BYTES;
  const preservePng = file.type === 'image/png';

  try {
    const img = await loadImage(file);

    const passes: { maxSide: number; quality: number }[] = [
      { maxSide: options?.maxSide ?? 1920, quality: options?.quality ?? 0.82 },
      { maxSide: 1280, quality: 0.72 },
      { maxSide: 1024, quality: 0.65 },
    ];

    let blob: Blob | null = null;
    for (const pass of passes) {
      blob = await renderToBlob(img, pass.maxSide, pass.quality, preservePng);
      if (blob.size <= targetMax) break;
    }

    if (!blob) {
      return file;
    }

    if (blob.size >= file.size && file.size <= targetMax) {
      return file;
    }

    const ext = preservePng ? '.png' : '.jpg';
    const mime = preservePng ? 'image/png' : 'image/jpeg';
    const baseName = (file.name.replace(/\.[^.]+$/, '') || 'image').slice(0, 120);

    return new File([blob], `${baseName}${ext}`, {
      type: mime,
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
