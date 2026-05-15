/**
 * DMS Job Card service — calls whitelisted Python methods in dms.api.job_cards
 * and dms_job_card.py for workflow actions.
 */
import { apiRequest, ensureCSRF } from './apiClient';
import type { DMSJobCard, JobCardQCResult, PaginatedResponse, RoadTestItemResult } from '@/types/dms';

const API = 'dms.api.job_cards';
const DT_PATH = 'dms.dealer_management_system.doctype.dms_job_card.dms_job_card';

// ─── List & Get ──────────────────────────────────────────────

export async function listJobCards(options?: {
  status?: string;
  customer?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<DMSJobCard>> {
  return apiRequest<PaginatedResponse<DMSJobCard>>(`/api/method/${API}.get_job_cards`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      customer: options?.customer || null,
      search: options?.search || null,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    }),
  });
}

export async function getJobCard(name: string): Promise<DMSJobCard> {
  return apiRequest<DMSJobCard>(`/api/method/${API}.get_job_card`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// ─── Create & Update ─────────────────────────────────────────

export async function createJobCard(data: Partial<DMSJobCard>): Promise<{ name: string; status: string; customer: string; customer_name: string }> {
  return apiRequest(`/api/method/${API}.create_job_card`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateJobCard(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.update_job_card`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

// ─── Submit (docstatus 0→1) ──────────────────────────────────

export async function submitJobCard(name: string): Promise<{ name: string; status: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.submit_job_card`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

// ─── Field-level update on submitted doc ─────────────────────

export async function setFieldValue(
  name: string,
  fieldname: string,
  value: unknown
): Promise<void> {
  await apiRequest('/api/method/frappe.client.set_value', {
    method: 'POST',
    body: JSON.stringify({ doctype: 'DMS Job Card', name, fieldname, value }),
  });
}

export async function setMultipleFields(
  name: string,
  fields: Record<string, unknown>
): Promise<void> {
  for (const [fieldname, value] of Object.entries(fields)) {
    await setFieldValue(name, fieldname, value);
  }
}

// ─── Workflow Transitions (whitelisted methods) ──────────────

export async function submitForEstimation(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'Estimation Pending');
}

export async function markCustomerApproved(
  name: string,
  approvalReference: string,
  approvedAmount?: number,
  customerSignature?: string
): Promise<void> {
  const fields: Record<string, unknown> = {
    customer_approval_status: 'Approved',
    approval_reference: approvalReference,
    status: 'Estimation Approved',
  };
  if (approvedAmount !== undefined) fields.approved_amount = approvedAmount;
  if (customerSignature) fields.customer_signature = customerSignature;

  await setMultipleFields(name, fields);
}

export interface ApproveAndSubmitPayload {
  approval_reference: string;
  approved_amount?: number;
  customer_signature?: string;
  schedule_start_time: string;
  schedule_end_time: string;
  lead_technician: string;
  assistant_technicians?: Array<{ technician: string; role?: string }>;
}

export async function approveAndSubmitJobCard(
  name: string,
  payload: ApproveAndSubmitPayload
): Promise<{ name: string; status: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.approve_and_submit_job_card`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      approval_reference: payload.approval_reference,
      approved_amount: payload.approved_amount ?? null,
      customer_signature: payload.customer_signature ?? null,
      schedule_start_time: payload.schedule_start_time,
      schedule_end_time: payload.schedule_end_time,
      lead_technician: payload.lead_technician,
      assistant_technicians: payload.assistant_technicians
        ? JSON.stringify(payload.assistant_technicians)
        : null,
    }),
  });
}

export async function saveCustomerSignature(name: string, fileUrl: string): Promise<void> {
  await setFieldValue(name, 'customer_signature', fileUrl);
}

export async function startRepair(
  name: string,
  timeLogs?: Array<{ technician: string; technician_name: string; start_time: string }>
): Promise<string> {
  return apiRequest<string>(`/api/method/${DT_PATH}.start_repair`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: name,
      time_logs: timeLogs ? JSON.stringify(timeLogs) : undefined,
    }),
  });
}

export async function pauseRepair(
  name: string,
  newStatus: 'Waiting Parts' | 'Waiting Customer Approval',
  openLogs?: Array<{ name: string; end_time: string; duration_hours: number; pause_reason?: string }>
): Promise<string> {
  return apiRequest<string>(`/api/method/${DT_PATH}.pause_repair`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: name,
      new_status: newStatus,
      open_logs: openLogs ? JSON.stringify(openLogs) : undefined,
    }),
  });
}

export async function completeRepair(
  name: string,
  openLogs?: Array<{ name: string; end_time: string; duration_hours: number }>,
  completedDateTime?: string
): Promise<string> {
  return apiRequest<string>(`/api/method/${DT_PATH}.stop_repair`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: name,
      open_logs: openLogs ? JSON.stringify(openLogs) : undefined,
      completed_date_time: completedDateTime || new Date().toISOString().replace('T', ' ').slice(0, 19),
    }),
  });
}

export async function resumeRepair(name: string): Promise<string> {
  return apiRequest<string>(`/api/method/${DT_PATH}.resume_repair`, {
    method: 'POST',
    body: JSON.stringify({ job_card: name }),
  });
}

export async function partsArrived(name: string): Promise<void> {
  await resumeRepair(name);
}

export async function customerApprovedDuringRepair(name: string): Promise<void> {
  await resumeRepair(name);
}

export async function startRoadTest(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'Road Test In Progress');
}

export interface RoadTestTemplateOption {
  name: string;
  template_name: string;
  template_type?: string;
}

export async function fetchRoadTestTemplates(): Promise<RoadTestTemplateOption[]> {
  return apiRequest<RoadTestTemplateOption[]>(`/api/method/${API}.get_road_test_templates`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function applyRoadTestTemplate(
  name: string,
  template: string,
  force = false
): Promise<{ road_test_template?: string; road_test_results?: RoadTestItemResult[] }> {
  return apiRequest(`/api/method/${API}.apply_road_test_template`, {
    method: 'POST',
    body: JSON.stringify({ name, template, force: force ? 1 : 0 }),
  });
}

export async function saveRoadTestResults(
  name: string,
  roadTestTemplate: string | undefined,
  results: Array<Partial<RoadTestItemResult>>
): Promise<{ road_test_template?: string; road_test_results?: RoadTestItemResult[] }> {
  return apiRequest(`/api/method/${API}.save_road_test_results`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      road_test_template: roadTestTemplate || null,
      results: JSON.stringify(results),
    }),
  });
}

export async function passRoadTest(name: string, notes?: string): Promise<void> {
  await setMultipleFields(name, {
    rt_result: 'Pass',
    road_test_note: notes || '',
    status: 'Road Test Completed',
  });
}

export async function failRoadTest(name: string, reason: string): Promise<void> {
  await setMultipleFields(name, {
    rt_result: 'Fail',
    road_test_note: reason,
    rework_required: 1,
    status: 'Rework',
  });
}

export async function startQC(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'QC In Progress');
}

export interface QCChecklistTemplateOption {
  name: string;
  checklist_name: string;
  checklist_type?: string;
}

export async function fetchQCChecklistTemplates(): Promise<QCChecklistTemplateOption[]> {
  return apiRequest<QCChecklistTemplateOption[]>(
    `/api/method/${API}.get_qc_checklist_templates`,
    {
      method: 'POST',
      body: JSON.stringify({}),
    }
  );
}

export async function applyQCChecklistTemplate(
  name: string,
  template: string,
  force = false
): Promise<{ qc_checklist_template?: string; qc_results?: JobCardQCResult[] }> {
  return apiRequest(`/api/method/${API}.apply_qc_checklist_template`, {
    method: 'POST',
    body: JSON.stringify({ name, template, force: force ? 1 : 0 }),
  });
}

export async function saveQCResults(
  name: string,
  qcChecklistTemplate: string | undefined,
  results: Array<Partial<JobCardQCResult>>
): Promise<{ qc_checklist_template?: string; qc_results?: JobCardQCResult[] }> {
  return apiRequest(`/api/method/${API}.save_qc_results`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      qc_checklist_template: qcChecklistTemplate || null,
      results: JSON.stringify(results),
    }),
  });
}

export async function passQC(name: string): Promise<void> {
  await setMultipleFields(name, {
    qc_result: 'Pass',
    qc_checked_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: 'Completed',
  });
}

export async function failQC(name: string, failReason: string): Promise<void> {
  await setMultipleFields(name, {
    qc_result: 'Fail',
    qc_fail_reason: failReason,
    rework_required: 1,
    status: 'Rework',
  });
}

export async function reworkCompleted(name: string): Promise<void> {
  await setMultipleFields(name, {
    rework_required: 0,
    status: 'Repair Completed',
  });
}

// ─── Actions (Invoice & Delivery) ────────────────────────────

export async function makeSalesInvoice(name: string): Promise<string> {
  await ensureCSRF();
  const csrf = (window as Record<string, unknown>).csrf_token as string;
  const response = await fetch(`/api/method/${DT_PATH}.make_sales_invoice_from_job_card`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(csrf ? { 'X-Frappe-CSRF-Token': csrf } : {}),
    },
    body: JSON.stringify({ job_card: name }),
  });
  const resData = await response.json();
  if (resData?.message) return resData.message as string;
  throw new Error(resData?.exc || 'Failed to create sales invoice');
}

export async function getPartStockAvailable(
  sparePart: string,
  warehouse?: string
): Promise<number> {
  const params = new URLSearchParams({ spare_part: sparePart });
  if (warehouse) params.set('warehouse', warehouse);
  const response = await fetch(
    `/api/method/${DT_PATH}.get_job_card_part_stock_available?${params}`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  );
  const resData = await response.json();
  return resData?.message ?? 0;
}

export async function getPartUnitPrice(sparePart: string): Promise<number> {
  const response = await fetch(
    `/api/method/${DT_PATH}.get_job_card_part_unit_price?spare_part=${encodeURIComponent(sparePart)}`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  );
  const resData = await response.json();
  return resData?.message ?? 0;
}
