/**
 * CRM Reports — dms.crm_api.reports (§17)
 */
import { apiRequest } from '../apiClient';
import type {
  ReportCatalog,
  ReportFilters as BaseFilters,
  ReportResult,
  SectionDashboard,
} from '../reports';

const API = 'dms.crm_api.reports';

export type CrmReportFilters = BaseFilters & {
  country?: string;
  brand?: string;
  team?: string;
  owner?: string;
  model?: string;
  source?: string;
  campaign?: string;
};

export type CrmReportResult = ReportResult & {
  help_text?: string;
  definitions?: Record<string, string>;
};

export async function listCrmReports(): Promise<ReportCatalog> {
  return apiRequest(`/api/method/${API}.list_reports`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function getCrmSectionDashboard(
  sectionId: string,
  filters: CrmReportFilters = {}
): Promise<SectionDashboard> {
  return apiRequest(`/api/method/${API}.get_section_dashboard`, {
    method: 'POST',
    body: JSON.stringify({ section_id: sectionId, filters }),
  });
}

export async function getCrmReport(
  reportId: string,
  filters: CrmReportFilters = {}
): Promise<CrmReportResult> {
  return apiRequest(`/api/method/${API}.get_report`, {
    method: 'POST',
    body: JSON.stringify({ report_id: reportId, filters }),
  });
}

export async function logCrmReportExport(payload: {
  report_id: string;
  format: string;
  row_count?: number;
  filters?: CrmReportFilters;
}) {
  return apiRequest(`/api/method/${API}.log_report_export`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getCrmReportSnapshots(sectionId?: string, limit = 30) {
  return apiRequest<{ data: Record<string, unknown>[] }>(
    `/api/method/${API}.get_report_snapshots`,
    {
      method: 'POST',
      body: JSON.stringify({ section_id: sectionId || null, limit }),
    }
  );
}

export async function saveCrmPipelineSnapshot(filters: CrmReportFilters = {}) {
  return apiRequest(`/api/method/${API}.save_pipeline_snapshot`, {
    method: 'POST',
    body: JSON.stringify({ filters }),
  });
}
