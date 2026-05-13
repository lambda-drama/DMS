/**
 * Vehicle Inspection service — calls whitelisted methods in dms.api.inspections
 */
import { apiRequest } from './apiClient';
import type { VehicleInspection, PaginatedResponse } from '@/types/dms';

const API = 'dms.api.inspections';

export async function listInspections(options?: {
  customer?: string;
  date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<VehicleInspection>> {
  return apiRequest<PaginatedResponse<VehicleInspection>>(`/api/method/${API}.get_inspections`, {
    method: 'POST',
    body: JSON.stringify({
      customer: options?.customer || null,
      date: options?.date || null,
      search: options?.search || null,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    }),
  });
}

export async function getInspection(name: string): Promise<VehicleInspection> {
  return apiRequest<VehicleInspection>(`/api/method/${API}.get_inspection`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createInspection(data: Partial<VehicleInspection>): Promise<{ name: string; customer: string; customer_name: string; inspection_date: string }> {
  return apiRequest(`/api/method/${API}.create_inspection`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateInspection(
  name: string,
  data: Partial<VehicleInspection>
): Promise<{ name: string }> {
  return apiRequest(`/api/method/${API}.update_inspection`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function submitInspection(name: string): Promise<{ name: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.submit_inspection`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
