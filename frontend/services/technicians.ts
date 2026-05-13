/**
 * Technician service — calls whitelisted methods in dms.api.technicians
 */
import { apiRequest } from './apiClient';
import type {
  TechnicianListItem,
  TechnicianFull,
  TechnicianAvailability,
  TechnicianScheduleJob,
} from '@/types/dms';

const API = 'dms.api.technicians';

export async function listTechnicians(options?: {
  status?: string;
  skill_level?: string;
  search?: string;
}): Promise<TechnicianListItem[]> {
  return apiRequest<TechnicianListItem[]>(`/api/method/${API}.get_technicians`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      skill_level: options?.skill_level || null,
      search: options?.search || null,
    }),
  });
}

export async function getTechnician(name: string): Promise<TechnicianFull> {
  return apiRequest<TechnicianFull>(`/api/method/${API}.get_technician`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function getTechnicianSchedule(
  name: string,
  date?: string
): Promise<TechnicianScheduleJob[]> {
  return apiRequest<TechnicianScheduleJob[]>(`/api/method/${API}.get_technician_schedule`, {
    method: 'POST',
    body: JSON.stringify({ name, date: date || null }),
  });
}

export async function getTechnicianWeeklySchedule(
  name: string,
  startDate?: string
): Promise<Record<string, TechnicianScheduleJob[]>> {
  return apiRequest<Record<string, TechnicianScheduleJob[]>>(
    `/api/method/${API}.get_technician_weekly_schedule`,
    {
      method: 'POST',
      body: JSON.stringify({ name, start_date: startDate || null }),
    }
  );
}

export async function getAllTechniciansAvailability(
  date?: string
): Promise<TechnicianAvailability[]> {
  return apiRequest<TechnicianAvailability[]>(
    `/api/method/${API}.get_all_technicians_availability`,
    {
      method: 'POST',
      body: JSON.stringify({ date: date || null }),
    }
  );
}

export async function clockIn(name: string): Promise<{ clock_in_time: string }> {
  return apiRequest<{ clock_in_time: string }>(`/api/method/${API}.clock_in`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function clockOut(name: string): Promise<{ clock_out_time: string }> {
  return apiRequest<{ clock_out_time: string }>(`/api/method/${API}.clock_out`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
