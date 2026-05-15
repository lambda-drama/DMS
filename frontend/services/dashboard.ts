/**
 * Dashboard service — aggregated home screen data from dms.api.dashboard
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.dashboard';

export interface DashboardStats {
  today_appointments: number;
  yesterday_appointments: number;
  appointments_delta: number;
  active_job_cards: number;
  in_repair: number;
  pending_qc: number;
  urgent_qc: number;
  ready_for_delivery: number;
  awaiting_payment: number;
}

export interface DashboardJobCard {
  id: string;
  customer: string;
  vehicle: string;
  status: string;
  priority: string;
  eta: string;
}

export interface DashboardAppointment {
  id: string;
  time: string;
  customer: string;
  vehicle: string;
  service: string;
  status: string;
}

export interface DashboardServiceBay {
  id: string;
  bay: string;
  status: 'available' | 'occupied' | 'maintenance';
  erp_status?: string;
  vehicle: string | null;
  progress: number;
}

export interface DashboardSummary {
  stats: DashboardStats;
  active_job_cards: DashboardJobCard[];
  today_appointments: DashboardAppointment[];
  service_bays: DashboardServiceBay[];
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(`/api/method/${API}.get_dashboard_summary`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
