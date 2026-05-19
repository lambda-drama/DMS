/**
 * Service Advisor service — calls whitelisted methods in dms.api.service_advisors
 */
import { apiRequest } from './apiClient';
import type { ServiceAdvisor } from '@/types/dms';

const API = 'dms.api.service_advisors';

export interface ServiceAdvisorListItem extends ServiceAdvisor {
  first_name?: string;
  last_name?: string;
  status?: string;
  advisor_code?: string;
  workshop?: string;
  work_shift?: string;
  date_of_joining?: string;
}

export type ServiceAdvisorFull = ServiceAdvisorListItem & {
  employee_id?: string;
  user_id?: string;
  custom_lunch_start?: string;
  custom_lunch_end?: string;
};

export async function listServiceAdvisors(options?: {
  search?: string;
  status?: string;
  limit?: number;
}): Promise<ServiceAdvisorListItem[]> {
  return apiRequest<ServiceAdvisorListItem[]>(`/api/method/${API}.get_service_advisors`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      status: options?.status || null,
      limit: options?.limit || 100,
    }),
  });
}

export async function getServiceAdvisor(name: string): Promise<ServiceAdvisorFull> {
  return apiRequest<ServiceAdvisorFull>(`/api/method/${API}.get_service_advisor`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
