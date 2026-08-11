/**
 * Parts Advisor service — dms.api.parts_advisors
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.parts_advisors';

export interface PartsAdvisorListItem {
  name: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  advisor_code?: string;
  internal_employee?: string;
  employee_id?: string;
  date_of_joining?: string;
}

export type PartsAdvisorFull = PartsAdvisorListItem & {
  user_id?: string;
};

export async function listPartsAdvisors(options?: {
  search?: string;
  status?: string;
  limit?: number;
}): Promise<PartsAdvisorListItem[]> {
  return apiRequest<PartsAdvisorListItem[]>(`/api/method/${API}.get_parts_advisors`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      status: options?.status || null,
      limit: options?.limit || 100,
    }),
  });
}

export async function getPartsAdvisor(name: string): Promise<PartsAdvisorFull> {
  return apiRequest<PartsAdvisorFull>(`/api/method/${API}.get_parts_advisor`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updatePartsAdvisor(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; full_name?: string; status?: string }> {
  return apiRequest(`/api/method/${API}.update_parts_advisor`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}
