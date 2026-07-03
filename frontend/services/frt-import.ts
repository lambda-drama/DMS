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

export async function importFrtSheet(fileUrl: string, brand = 'JETOUR'): Promise<FrtImportResult> {
  return apiRequest<FrtImportResult>(`/api/method/${API}.import_frt_sheet`, {
    method: 'POST',
    body: JSON.stringify({ file_url: fileUrl, brand }),
  });
}
