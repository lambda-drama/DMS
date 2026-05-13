import { apiRequest } from './apiClient';
import type { VehicleInspection } from '@/types/dms';

const DT = 'Vehicle Inspection';

export async function listInspections(options?: {
  customer?: string;
  date?: string;
  limit?: number;
}): Promise<VehicleInspection[]> {
  const params = new URLSearchParams();
  const filters: Record<string, unknown> = {};
  if (options?.customer) filters.customer = options.customer;
  if (options?.date) filters.inspection_date = ['like', `${options.date}%`];
  if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
  params.set('order_by', 'inspection_date desc');
  params.set('limit_page_length', String(options?.limit || 50));

  return apiRequest<VehicleInspection[]>(`/api/resource/${DT}?${params}`);
}

export async function getInspection(name: string): Promise<VehicleInspection> {
  return apiRequest<VehicleInspection>(`/api/resource/${DT}/${encodeURIComponent(name)}`);
}

export async function createInspection(data: Partial<VehicleInspection>): Promise<VehicleInspection> {
  return apiRequest<VehicleInspection>(`/api/resource/${DT}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateInspection(
  name: string,
  data: Partial<VehicleInspection>
): Promise<VehicleInspection> {
  return apiRequest<VehicleInspection>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitInspection(name: string): Promise<VehicleInspection> {
  return apiRequest<VehicleInspection>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ docstatus: 1 }),
  });
}
