/**
 * Common lookup service — calls whitelisted methods in dms.api.common
 */
import { apiRequest, ensureCSRF } from './apiClient';
import type { Customer, VINNo, ServiceAdvisor, Technician, ServiceBay, PaginatedResponse } from '@/types/dms';

const API = 'dms.api.common';

export interface SparePart {
  name: string;
  item_name: string;
  item_code?: string;
  part_category?: string;
  oem_part_number?: string;
}

export interface VehicleServiceItem {
  name: string;
  service_item?: string;
  custom_erpnext_item?: string;
  custom_item_name?: string;
  custom_rate?: number;
  custom_estimated_timemin?: string;
}

export interface CompanyOption {
  name: string;
  company_name?: string;
  default_currency?: string;
}

export interface Workshop {
  name: string;
  company?: string;
}

export interface Warehouse {
  name: string;
  warehouse_name?: string;
  company?: string;
}

export async function fetchCustomers(search?: string, limit?: number, offset?: number): Promise<PaginatedResponse<Customer>> {
  return apiRequest<PaginatedResponse<Customer>>(`/api/method/${API}.get_customers`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, limit: limit || 50, offset: offset || 0 }),
  });
}

export async function fetchVINs(customer?: string, search?: string): Promise<VINNo[]> {
  return apiRequest<VINNo[]>(`/api/method/${API}.get_vins`, {
    method: 'POST',
    body: JSON.stringify({
      customer: customer || null,
      search: search || null,
    }),
  });
}

export async function fetchServiceAdvisors(): Promise<ServiceAdvisor[]> {
  return apiRequest<ServiceAdvisor[]>(`/api/method/${API}.get_service_advisors`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchTechnicians(): Promise<Technician[]> {
  return apiRequest<Technician[]>(`/api/method/${API}.get_technicians`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchServiceBays(status?: 'Available' | 'Occupied'): Promise<ServiceBay[]> {
  return apiRequest<ServiceBay[]>(`/api/method/${API}.get_service_bays`, {
    method: 'POST',
    body: JSON.stringify({ status: status || null }),
  });
}

export async function fetchSpareParts(search?: string): Promise<SparePart[]> {
  return apiRequest<SparePart[]>(`/api/method/${API}.get_spare_parts`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchVehicleServiceItems(search?: string): Promise<VehicleServiceItem[]> {
  return apiRequest<VehicleServiceItem[]>(`/api/method/${API}.get_vehicle_service_items`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchWorkshops(search?: string): Promise<Workshop[]> {
  return apiRequest<Workshop[]>(`/api/method/${API}.get_workshops`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchWarehouses(search?: string, company?: string): Promise<Warehouse[]> {
  return apiRequest<Warehouse[]>(`/api/method/${API}.get_warehouses`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, company: company || null }),
  });
}

export async function fetchCompanies(search?: string): Promise<CompanyOption[]> {
  return apiRequest<CompanyOption[]>(`/api/method/${API}.get_companies`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchSparePartPrice(sparePart: string): Promise<number> {
  return apiRequest<number>(
    `/api/method/dms.dealer_management_system.doctype.dms_job_card.dms_job_card.get_job_card_part_unit_price`,
    {
      method: 'POST',
      body: JSON.stringify({ spare_part: sparePart }),
    }
  );
}

export async function fetchLabourRate(vehicleServiceItem: string): Promise<number> {
  return apiRequest<number>(`/api/method/${API}.get_labour_rate`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_service_item: vehicleServiceItem }),
  });
}

export async function fetchServiceBayDetail(bayName: string): Promise<{ branch?: string; bay_number?: string; bay_name?: string }> {
  return apiRequest<{ branch?: string; bay_number?: string; bay_name?: string }>(`/api/method/${API}.get_service_bay_detail`, {
    method: 'POST',
    body: JSON.stringify({ bay_name: bayName }),
  });
}

export async function fetchPrintFormats(doctype: string): Promise<string[]> {
  if (!doctype) return ['Standard'];
  const formats = await apiRequest<string[]>(`/api/method/${API}.get_print_formats`, {
    method: 'POST',
    body: JSON.stringify({ doctype }),
  });
  return Array.isArray(formats) && formats.length ? formats : ['Standard'];
}

/** Upload a file to Frappe (returns file_url for Attach / Attach Image fields). */
export async function uploadFile(file: File): Promise<string> {
  await ensureCSRF();
  const csrf = (typeof window !== 'undefined' && (window as Record<string, unknown>).csrf_token) as string | undefined;
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
  if (data?.exc) {
    let reason = 'Upload failed';
    try {
      const msgs = JSON.parse(data._server_messages || '[]');
      const first = JSON.parse(msgs[0] || '{}');
      reason = first?.message || data?.message || reason;
    } catch {
      reason = data?.message || reason;
    }
    throw new Error(reason);
  }
  if (!res.ok) throw new Error(`Upload failed: HTTP ${res.status}`);

  const doc = data?.message;
  if (doc && typeof doc === 'object' && doc.file_url) return doc.file_url as string;
  if (typeof doc === 'string' && doc.startsWith('/')) return doc;
  throw new Error('Upload failed: no file URL in response');
}
