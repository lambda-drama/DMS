import { apiRequest, ensureCSRF } from './apiClient';

const API = 'dms.api.frt_import';

export interface FrtImportSheetResult {
  sheet: string;
  vehicle_model: string;
  model_code: string;
  model_name: string;
  models_created: number;
  models_updated: number;
  services_created: number;
  services_updated: number;
  services_skipped: number;
}

export interface FrtImportResult {
  models_created: number;
  models_updated: number;
  services_created: number;
  services_updated: number;
  services_skipped: number;
  sheets_processed: number;
  errors: { sheet: string; error: string }[];
  details: FrtImportSheetResult[];
}

export async function uploadFrtWorkbook(file: File): Promise<string> {
  await ensureCSRF();
  const csrf = (typeof window !== 'undefined' && (window as Record<string, unknown>).csrf_token) as
    | string
    | undefined;
  const form = new FormData();
  form.append('file', file);
  form.append('is_private', '0');
  form.append('folder', 'Home/Attachments');
  if (csrf) form.append('csrf_token', csrf);

  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const res = await fetch(`${base}/api/method/upload_file`, {
    method: 'POST',
    headers: csrf ? { 'X-Frappe-CSRF-Token': csrf } : {},
    body: form,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.exc) {
    throw new Error(data?.message || 'Upload failed');
  }

  const message = data.message || data;
  const fileUrl = message?.file_url || message?.file_name;
  if (!fileUrl) {
    throw new Error('Upload did not return a file URL');
  }
  return fileUrl as string;
}

export async function queueFrtImport(
  fileUrl: string,
  brand = 'JETOUR'
): Promise<{ queued?: number; job_id?: string } & Partial<FrtImportResult>> {
  return apiRequest(`/api/method/${API}.import_frt_sheet`, {
    method: 'POST',
    body: JSON.stringify({ file_url: fileUrl, brand }),
  });
}

export async function getFrtImportStatus(jobId: string): Promise<{
  status: string;
  result?: FrtImportResult;
  error?: string;
}> {
  return apiRequest(`/api/method/${API}.get_frt_import_status`, {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  });
}

export async function importFrtSheet(fileUrl: string, brand = 'JETOUR'): Promise<FrtImportResult> {
  const queued = await queueFrtImport(fileUrl, brand);
  if (queued.sheets_processed != null || queued.details) {
    return queued as FrtImportResult;
  }
  if (!queued.job_id) {
    throw new Error('Import did not start');
  }
  return pollFrtImport(queued.job_id);
}

async function pollFrtImport(jobId: string, timeoutMs = 60 * 60 * 1000): Promise<FrtImportResult> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const status = await getFrtImportStatus(jobId);
    if (status.status === 'finished' && status.result) {
      return status.result;
    }
    if (status.status === 'failed') {
      throw new Error(status.error || 'Import failed');
    }
    await new Promise((resolve) => setTimeout(resolve, 2500));
  }
  throw new Error('Import is still running in the background. Check Error Log if it does not finish.');
}
