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
  inspection_from?: string;
  inspection_to?: string;
  completed_from?: string;
  completed_to?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<VehicleInspection>> {
  return apiRequest<PaginatedResponse<VehicleInspection>>(`/api/method/${API}.get_inspections`, {
    method: 'POST',
    body: JSON.stringify({
      customer: options?.customer || null,
      date: options?.date || null,
      search: options?.search || null,
      inspection_from: options?.inspection_from || null,
      inspection_to: options?.inspection_to || null,
      completed_from: options?.completed_from || null,
      completed_to: options?.completed_to || null,
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

export async function getCurrentServiceAdvisor(): Promise<{
  name: string;
  full_name?: string;
} | null> {
  return apiRequest(`/api/method/${API}.get_current_service_advisor`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Form-only keys the DMS inspection screen posts that are not stored on the
 * Vehicle Inspection doctype itself.
 */
export type InspectionFormExtras = {
  as_draft?: boolean | number;
  /**
   * Phone / email typed in the customer contact card. The backend writes real
   * changes onto the Customer's primary Contact; blank values are ignored.
   */
  customer_mobile_no?: string;
  customer_email_id?: string;
};

export async function createInspection(
  data: Partial<VehicleInspection> & InspectionFormExtras
): Promise<{
  name: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  inspection_date: string;
  as_draft?: number;
}> {
  return apiRequest(`/api/method/${API}.create_inspection`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateInspection(
  name: string,
  data: Partial<VehicleInspection> & InspectionFormExtras
): Promise<{
  name: string;
  docstatus?: number;
  as_draft?: number;
}> {
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
