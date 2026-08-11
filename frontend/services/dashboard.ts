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

export interface BrdDashboardKpis {
  from_date?: string;
  to_date?: string;
  open_job_cards?: number;
  overdue_promised?: number;
  net_revenue?: number;
  revenue_currency?: string;
  labour_revenue?: number;
  parts_revenue?: number;
  appointment_arrival_rate?: number;
  qc_fail_rate_pct?: number;
  parts_fill_rate_pct?: number;
  warranty_jobs?: number;
  hide_net_revenue?: number | boolean;
}

export interface DashboardSummary {
  stats: DashboardStats;
  brd_kpis?: BrdDashboardKpis;
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
