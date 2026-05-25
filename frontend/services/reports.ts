/**
 * BRD §20 management reports — dms.api.reports
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.reports';

export interface ReportMeta {
  id: string;
  title: string;
  description: string;
  /** When "stock", UI shows company / warehouse / spare part filters instead of date range. */
  filter_type?: 'default' | 'stock';
}

export interface ReportColumn {
  key: string;
  label: string;
}

export interface ReportResult {
  report_id: string;
  title: string;
  filters?: Record<string, string>;
  summary: Record<string, unknown>;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
}

export interface BrdDashboardKpis {
  from_date?: string;
  to_date?: string;
  open_job_cards?: number;
  overdue_promised?: number;
  net_revenue?: number;
  labour_revenue?: number;
  parts_revenue?: number;
  appointment_arrival_rate?: number;
  qc_fail_rate_pct?: number;
  parts_fill_rate_pct?: number;
  warranty_jobs?: number;
}

export interface ReportFilters {
  from_date?: string;
  to_date?: string;
  company?: string;
  /** Partial VIN / chassis number search (legacy) */
  vehicle_vin?: string;
  /** VIN No document name from searchable dropdown */
  vin_no?: string;
  warehouse?: string;
  spare_part?: string;
  below_minimum_only?: boolean | number;
  include_zero_stock?: boolean | number;
}

export const STOCK_REPORT_ID = 'spare_parts_stock';

export function isStockReportId(reportId: string | undefined): boolean {
  return reportId === STOCK_REPORT_ID;
}

export async function listReports(): Promise<ReportMeta[]> {
  return apiRequest<ReportMeta[]>(`/api/method/${API}.list_reports`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getReport(
  reportId: string,
  filters?: ReportFilters
): Promise<ReportResult> {
  return apiRequest<ReportResult>(`/api/method/${API}.get_report`, {
    method: 'POST',
    body: JSON.stringify({
      report_id: reportId,
      filters: filters || {},
    }),
  });
}

export const PRINTABLE_DOCUMENTS = [
  { doctype: 'Service Appointment', label: 'Appointment confirmation', view: 'appointments' },
  { doctype: 'Vehicle Inspection', label: 'Vehicle receiving / inspection sheet', view: 'inspections' },
  { doctype: 'DMS Job Card', label: 'Job card (complaint–cause–correction)', view: 'job-cards' },
  { doctype: 'DMS Job Card', label: 'Estimate / quotation approval', view: 'job-cards' },
  { doctype: 'DMS Job Card', label: 'Parts request / issue slip', view: 'job-cards' },
  { doctype: 'DMS Job Card', label: 'Warranty claim report', view: 'job-cards' },
  { doctype: 'DMS Job Card', label: 'QC checklist', view: 'job-cards' },
  { doctype: 'Sales Invoice', label: 'Final invoice', view: 'invoices' },
  { doctype: 'Vehicle Delivery Note', label: 'Vehicle delivery note', view: 'deliveries' },
  { doctype: 'Customer Follow Up', label: 'Customer service history / follow-up', view: 'customers' },
  { doctype: 'DMS Job Card', label: 'Management daily WIP report', view: 'reports', reportId: 'daily_wip' },
] as const;
