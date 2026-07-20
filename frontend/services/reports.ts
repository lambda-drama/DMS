/**
 * Aftersales management reports — dms.api.reports
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.reports';

export interface ReportMeta {
  id: string;
  title: string;
  description: string;
  filter_type?: 'default' | 'stock';
  section_id?: string;
  section_title?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  description: string;
  icon?: string;
  reports: ReportMeta[];
}

export interface ReportCatalog {
  sections: ReportSection[];
  reports: ReportMeta[];
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

export interface SectionDashboard {
  section_id: string;
  title: string;
  filters?: Record<string, string>;
  summary: Record<string, unknown>;
}

export interface ReportFilters {
  from_date?: string;
  to_date?: string;
  /** daily | weekly | monthly | quarterly | yearly — overrides from/to on the server */
  period?: string;
  company?: string;
  branch?: string;
  service_advisor?: string;
  technician?: string;
  vehicle_model?: string;
  vehicle_model_label?: string;
  job_card_type?: string;
  vehicle_vin?: string;
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

export async function listReports(): Promise<ReportCatalog> {
  const data = await apiRequest<ReportCatalog | ReportMeta[]>(`/api/method/${API}.list_reports`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
  // Backward-compatible if API still returns a flat array
  if (Array.isArray(data)) {
    return {
      sections: [
        {
          id: 'all',
          title: 'Reports',
          description: 'All reports',
          reports: data,
        },
      ],
      reports: data,
    };
  }
  return data;
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

export async function getSectionDashboard(
  sectionId: string,
  filters?: ReportFilters
): Promise<SectionDashboard> {
  return apiRequest<SectionDashboard>(`/api/method/${API}.get_section_dashboard`, {
    method: 'POST',
    body: JSON.stringify({
      section_id: sectionId,
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
