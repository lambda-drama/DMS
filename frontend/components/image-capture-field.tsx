'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadFile } from '@/services/common';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function resolveImageSrc(url: string) {
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

interface ImageCaptureFieldProps {
  label?: string;
  value?: string;
  onChange: (url: string | undefined) => void;
  className?: string;
  disabled?: boolean;
  /** Smaller layout for checklist rows */
  compact?: boolean;
}

/** Opens device camera or photo gallery (Photos / Google Photos on Android) when tapped. */
export function ImageCaptureField({
  label,
  value,
  onChange,
  className,
  disabled,
  compact = false,
}: ImageCaptureFieldProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadFile(file);
      onChange(url);
      toast.success('Photo saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to upload photo');
    } finally {
      setUploading(false);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      {label ? <p className="text-sm font-medium leading-none">{label}</p> : null}

      {/* Camera: mobile opens lens directly */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />
      {/* Gallery: Photos / Google Photos / file picker */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-lg border bg-muted/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={resolveImageSrc(value)}
            alt={label || 'Captured photo'}
            className="max-h-52 w-full object-contain"
          />
          <div className="absolute right-2 top-2 flex gap-1">
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="h-8 w-8"
              disabled={disabled || uploading}
              onClick={() => onChange(undefined)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2 border-t bg-background/90 p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={disabled || uploading}
              onClick={() => cameraInputRef.current?.click()}
            >
              Retake
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="flex-1"
              disabled={disabled || uploading}
              onClick={() => galleryInputRef.current?.click()}
            >
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-24 flex-1 flex-col gap-2 py-4"
            disabled={disabled || uploading}
            onClick={() => cameraInputRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : (
              <Camera className="h-6 w-6" />
            )}
            <span className="text-sm font-normal">
              {uploading ? 'Uploading…' : 'Take photo'}
            </span>
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-auto min-h-24 flex-1 flex-col gap-2 py-4"
            disabled={disabled || uploading}
            onClick={() => galleryInputRef.current?.click()}
          >
            Choose from gallery
          </Button>
        </div>
      )}
    </div>
  );
}

