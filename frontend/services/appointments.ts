/**
 * Service Appointment service — calls whitelisted methods in dms.api.appointments
 */
import { apiRequest } from './apiClient';
import type { ServiceAppointment, PaginatedResponse } from '@/types/dms';

const API = 'dms.api.appointments';

export async function listAppointments(options?: {
  status?: string;
  date?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<ServiceAppointment>> {
  return apiRequest<PaginatedResponse<ServiceAppointment>>(`/api/method/${API}.get_appointments`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      date: options?.date || null,
      search: options?.search || null,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    }),
  });
}

export async function getAppointment(name: string): Promise<ServiceAppointment> {
  return apiRequest<ServiceAppointment>(`/api/method/${API}.get_appointment`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createAppointment(data: Partial<ServiceAppointment>): Promise<{ name: string; customer: string; customer_name: string; appointment_date_time: string; appointment_status: string }> {
  return apiRequest(`/api/method/${API}.create_appointment`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateAppointment(
  name: string,
  data: Partial<ServiceAppointment>
): Promise<{ name: string; appointment_status: string }> {
  return apiRequest(`/api/method/${API}.update_appointment`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function submitAppointment(name: string): Promise<{ name: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.submit_appointment`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function markArrived(name: string): Promise<{ name: string; appointment_status: string; arrived_date_time: string }> {
  return apiRequest(`/api/method/${API}.mark_arrived`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
