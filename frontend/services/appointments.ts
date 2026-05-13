import { apiRequest } from './apiClient';
import type { ServiceAppointment } from '@/types/dms';

const DT = 'Service Appointment';

export async function listAppointments(options?: {
  status?: string;
  date?: string;
  limit?: number;
}): Promise<ServiceAppointment[]> {
  const params = new URLSearchParams();
  const filters: Record<string, unknown> = {};
  if (options?.status) filters.appointment_status = options.status;
  if (options?.date) filters.appointment_date_time = ['like', `${options.date}%`];
  if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
  params.set('order_by', 'appointment_date_time desc');
  params.set('limit_page_length', String(options?.limit || 50));

  return apiRequest<ServiceAppointment[]>(`/api/resource/${DT}?${params}`);
}

export async function getAppointment(name: string): Promise<ServiceAppointment> {
  return apiRequest<ServiceAppointment>(`/api/resource/${DT}/${encodeURIComponent(name)}`);
}

export async function createAppointment(data: Partial<ServiceAppointment>): Promise<ServiceAppointment> {
  return apiRequest<ServiceAppointment>(`/api/resource/${DT}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateAppointment(
  name: string,
  data: Partial<ServiceAppointment>
): Promise<ServiceAppointment> {
  return apiRequest<ServiceAppointment>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitAppointment(name: string): Promise<ServiceAppointment> {
  return apiRequest<ServiceAppointment>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ docstatus: 1 }),
  });
}

export async function markArrived(name: string): Promise<ServiceAppointment> {
  return apiRequest<ServiceAppointment>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({
      appointment_status: 'Arrived',
      arrived_date_time: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }),
  });
}
