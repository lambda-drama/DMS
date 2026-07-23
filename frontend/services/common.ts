/**
 * Common lookup service — calls whitelisted methods in dms.api.common
 */
import { compressImageForUpload } from '@/lib/compress-image';
import { apiRequest, ensureCSRF } from './apiClient';
import type { Customer, VINNo, VehicleModelOption, VehicleServiceType, ServiceAdvisor, Technician, ServiceBay, PaginatedResponse } from '@/types/dms';

const API = 'dms.api.common';

export interface SparePart {
  name: string;
  item_name: string;
  item_code?: string;
  spare_part_item?: string;
  part_category?: string;
  oem_part_number?: string;
  bin_location?: string;
  stock_available?: number;
}

export interface VehicleServiceItem {
  name: string;
  service_item?: string;
  custom_erpnext_item?: string;
  custom_item_name?: string;
  custom_service_code?: string;
  custom_rate?: number;
  custom_estimated_timehours?: string | number;
  estimated_hours?: number;
}

export interface VehicleServiceItemLineDefaults {
  rate_per_hour: number;
  estimated_hours: number;
  service_name?: string;
  service_code?: string;
}

export function formatSparePartLabel(part?: Pick<SparePart, 'name' | 'item_name' | 'item_code' | 'oem_part_number'>): string {
  const code = String(part?.oem_part_number || part?.item_code || part?.name || '').trim();
  const name = String(part?.item_name || part?.name || code).trim();
  if (code && name && code !== name) return `${code}: ${name}`;
  return name || code;
}

function formatStockQty(qty: number): string {
  if (!Number.isFinite(qty)) return '0';
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(2);
}

/** Secondary line for spare-part SearchableSelect options (category, bin, stock). */
export function formatSparePartSelectDescription(
  part?: Pick<
    SparePart,
    'name' | 'item_code' | 'spare_part_item' | 'part_category' | 'bin_location' | 'stock_available'
  >
): string | undefined {
  const bits: string[] = [];
  const code = String(part?.item_code || part?.spare_part_item || '').trim();
  if (code && code !== part?.name) bits.push(code);
  if (part?.part_category) bits.push(part.part_category);
  if (part?.bin_location) bits.push(`Bin: ${part.bin_location}`);
  if (part?.stock_available != null && Number.isFinite(Number(part.stock_available))) {
    bits.push(`Stock: ${formatStockQty(Number(part.stock_available))}`);
  }
  return bits.length ? bits.join(' · ') : undefined;
}

export function sparePartToSelectOption(part: SparePart): {
  value: string;
  label: string;
  description?: string;
} {
  return {
    value: part.name,
    label: formatSparePartLabel(part),
    description: formatSparePartSelectDescription(part),
  };
}

export function formatVehicleServiceItemLabel(
  item?: Pick<VehicleServiceItem, 'name' | 'service_item' | 'custom_item_name' | 'custom_service_code'>
): string {
  const code = String(item?.custom_service_code || '').trim();
  const name = String(item?.custom_item_name || item?.service_item || item?.name || code).trim();
  if (code && name && code !== name) return `${code}: ${name}`;
  return name || code;
}

/** Hours from VSI custom_estimated_timehours (or precomputed estimated_hours from API). */
export function vehicleServiceItemEstimatedHours(
  item?: Pick<VehicleServiceItem, 'custom_estimated_timehours' | 'estimated_hours'>
): number {
  if (item?.estimated_hours != null && Number(item.estimated_hours) > 0) {
    return Math.round(Number(item.estimated_hours) * 10) / 10;
  }
  const hours = parseFloat(String(item?.custom_estimated_timehours ?? ''));
  if (Number.isFinite(hours) && hours > 0) {
    return Math.round(hours * 10) / 10;
  }
  return 0;
}

function parseApiNumber(raw: unknown): number {
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  return Number.isFinite(n) ? n : 0;
}

/** Fetch rate + hours from server when a service item is selected. */
export async function fetchVehicleServiceItemLineDefaults(
  vehicleServiceItem: string
): Promise<VehicleServiceItemLineDefaults> {
  const raw = await apiRequest<VehicleServiceItemLineDefaults>(
    `/api/method/${API}.get_vehicle_service_item_line_defaults`,
    {
      method: 'POST',
      body: JSON.stringify({ vehicle_service_item: vehicleServiceItem }),
    }
  );
  return {
    rate_per_hour: parseApiNumber(raw?.rate_per_hour),
    estimated_hours: parseApiNumber(raw?.estimated_hours),
    service_name: raw?.service_name,
    service_code: raw?.service_code,
  };
}

export interface CompanyOption {
  name: string;
  company_name?: string;
  default_currency?: string;
}

export interface BranchOption {
  name: string;
  branch?: string;
  company?: string;
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

export interface CustomerContact {
  name: string;
  mobile_no: string;
  email_id: string;
}

export async function fetchCustomerContact(customer: string): Promise<CustomerContact> {
  return apiRequest<CustomerContact>(`/api/method/${API}.get_customer_contact`, {
    method: 'POST',
    body: JSON.stringify({ customer }),
  });
}

export async function updateCustomerContact(
  customer: string,
  data: { mobile_no?: string; email_id?: string }
): Promise<CustomerContact> {
  return apiRequest<CustomerContact>(`/api/method/${API}.update_customer_contact`, {
    method: 'POST',
    body: JSON.stringify({ customer, data }),
  });
}

export async function fetchVehicleCustomerGroups(): Promise<string[]> {
  const result = await fetchVehicleCustomerGroupOptions();
  return result.groups;
}

export interface VehicleCustomerGroupOptions {
  groups: string[];
  default_customer_group: string | null;
}

export async function fetchVehicleCustomerGroupOptions(): Promise<VehicleCustomerGroupOptions> {
  return apiRequest<VehicleCustomerGroupOptions>(`/api/method/${API}.get_vehicle_customer_group_options`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export interface DmsCustomerDefaults {
  default_customer: string | null;
  customer_name: string | null;
  mobile_no: string | null;
}

export async function fetchDmsCustomerDefaults(): Promise<DmsCustomerDefaults> {
  return apiRequest<DmsCustomerDefaults>(`/api/method/${API}.get_dms_customer_defaults`, {
    method: 'POST',
    body: JSON.stringify({}),
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

export async function fetchVehicleModels(
  search?: string,
  brand?: string,
  limit?: number
): Promise<VehicleModelOption[]> {
  return apiRequest<VehicleModelOption[]>(`/api/method/${API}.get_vehicle_models`, {
    method: 'POST',
    body: JSON.stringify({
      search: search || null,
      brand: brand || null,
      limit: limit ?? 30,
    }),
  });
}

export interface ColorOption {
  name: string;
  label?: string;
}

export async function fetchColors(search?: string, limit?: number): Promise<ColorOption[]> {
  return apiRequest<ColorOption[]>(`/api/method/${API}.get_colors`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, limit: limit ?? 40 }),
  });
}

export async function fetchVehicleServiceTypes(search?: string): Promise<VehicleServiceType[]> {
  return apiRequest<VehicleServiceType[]>(`/api/method/${API}.get_vehicle_service_types`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
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

export async function fetchSpareParts(
  search?: string,
  warehouse?: string,
  company?: string,
  vehicleModel?: string,
  vin?: string,
  vehicleBrand?: string
): Promise<SparePart[]> {
  return apiRequest<SparePart[]>(`/api/method/${API}.get_spare_parts`, {
    method: 'POST',
    body: JSON.stringify({
      search: search || null,
      warehouse: warehouse || null,
      company: company || null,
      vehicle_model: vehicleModel || null,
      vin: vin || null,
      vehicle_brand: vehicleBrand || null,
    }),
  });
}

export async function fetchVehicleServiceItems(
  search?: string,
  vehicleModel?: string,
  vin?: string,
  limit = 50
): Promise<VehicleServiceItem[]> {
  return apiRequest<VehicleServiceItem[]>(`/api/method/${API}.get_vehicle_service_items`, {
    method: 'POST',
    body: JSON.stringify({
      search: search || null,
      vehicle_model: vehicleModel || null,
      vin: vin || null,
      limit,
    }),
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

export async function fetchBranches(search?: string, company?: string): Promise<BranchOption[]> {
  return apiRequest<BranchOption[]>(`/api/method/${API}.get_branches`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, company: company || null }),
  });
}

export async function fetchCurrencies(): Promise<string[]> {
  return apiRequest<string[]>(`/api/method/${API}.get_currencies`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/** Same pricing as ERPNext Job Card form — `dms.api.common.get_spare_part_price` → `spare_part_default_selling_price`. */
export async function fetchSparePartPrice(sparePart: string): Promise<number> {
  const raw = await apiRequest<unknown>(`/api/method/${API}.get_spare_part_price`, {
    method: 'POST',
    body: JSON.stringify({ spare_part: sparePart }),
  });

  console.log('Fetched price for', sparePart, ':', raw);
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? ''));
  return Number.isFinite(n) ? n : 0;
}

export async function fetchLabourRate(vehicleServiceItem: string): Promise<number> {
  return apiRequest<number>(`/api/method/${API}.get_labour_rate`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_service_item: vehicleServiceItem }),
  });
}

export async function fetchServiceBayDetail(bayName: string): Promise<{
  branch?: string;
  workshop?: string;
  warehouse?: string;
  bay_number?: string;
  bay_name?: string;
}> {
  return apiRequest<{
    branch?: string;
    workshop?: string;
    warehouse?: string;
    bay_number?: string;
    bay_name?: string;
  }>(`/api/method/${API}.get_service_bay_detail`, {
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
  const fileToUpload = await compressImageForUpload(file);

  await ensureCSRF();
  const csrf = (typeof window !== 'undefined' && (window as Record<string, unknown>).csrf_token) as string | undefined;
  const form = new FormData();
  form.append('file', fileToUpload);
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

export async function fetchCustomerTermsAndConditions(): Promise<{
  english: {
    name: string;
    terms_title?: string;
    language?: string;
    more_details?: string;
  } | null;
  arabic: {
    name: string;
    terms_title?: string;
    language?: string;
    more_details?: string;
  } | null;
}> {
  return apiRequest(`/api/method/${API}.get_customer_terms_and_conditions`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
