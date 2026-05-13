/**
 * DMS Job Card service — calls whitelisted Python methods directly,
 * following the healthcare app pattern.
 */
import { apiRequest, ensureCSRF } from './apiClient';
import type { DMSJobCard } from '@/types/dms';

const DT = 'DMS Job Card';
const DT_PATH = 'dms.dealer_management_system.doctype.dms_job_card.dms_job_card';

// ─── List & Get ──────────────────────────────────────────────

export async function listJobCards(options?: {
  status?: string;
  customer?: string;
  limit?: number;
}): Promise<DMSJobCard[]> {
  const params = new URLSearchParams();
  const filters: Record<string, unknown> = {};
  if (options?.status) filters.status = options.status;
  if (options?.customer) filters.customer = options.customer;
  if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
  params.set('order_by', 'creation desc');
  params.set('limit_page_length', String(options?.limit || 50));

  const qs = params.toString();
  return apiRequest<DMSJobCard[]>(`/api/resource/${DT}?${qs}`);
}

export async function getJobCard(name: string): Promise<DMSJobCard> {
  return apiRequest<DMSJobCard>(`/api/resource/${DT}/${encodeURIComponent(name)}`);
}

// ─── Create & Update ─────────────────────────────────────────

export async function createJobCard(data: Partial<DMSJobCard>): Promise<DMSJobCard> {
  return apiRequest<DMSJobCard>(`/api/resource/${DT}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateJobCard(
  name: string,
  data: Record<string, unknown>
): Promise<DMSJobCard> {
  return apiRequest<DMSJobCard>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ─── Submit (docstatus 0→1) ──────────────────────────────────

export async function submitJobCard(name: string): Promise<DMSJobCard> {
  return apiRequest<DMSJobCard>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ docstatus: 1 }),
  });
}

// ─── Field-level update on submitted doc ─────────────────────
// Mirrors the desk save_submitted_doc pattern: uses frappe.client.set_value

export async function setFieldValue(
  name: string,
  fieldname: string,
  value: unknown
): Promise<void> {
  await apiRequest('/api/method/frappe.client.set_value', {
    method: 'POST',
    body: JSON.stringify({ doctype: DT, name, fieldname, value }),
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

/** Submit for Estimation: Draft → Estimation Pending (docstatus=1) */
export async function submitForEstimation(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'Estimation Pending');
}

/** Mark Customer Approved: Estimation Pending → Estimation Approved (docstatus=0) */
export async function markCustomerApproved(
  name: string,
  approvalReference: string,
  approvedAmount?: number
): Promise<void> {
  const fields: Record<string, unknown> = {
    customer_approval_status: 'Approved',
    approval_reference: approvalReference,
    status: 'Estimation Approved',
  };
  if (approvedAmount !== undefined) fields.approved_amount = approvedAmount;
  await updateJobCard(name, fields);
}

/** Start Repair: calls the whitelisted start_repair method */
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

/** Pause Repair: calls the whitelisted pause_repair method */
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

/** Complete Repair: calls the whitelisted stop_repair method */
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

/** Parts Arrived: Waiting Parts → Repair In Progress */
export async function partsArrived(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'Repair In Progress');
}

/** Customer Approved (during repair): Waiting Customer Approval → Repair In Progress */
export async function customerApprovedDuringRepair(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'Repair In Progress');
}

/** Start Road Test: Repair Completed → Road Test In Progress */
export async function startRoadTest(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'Road Test In Progress');
}

/** Pass Road Test */
export async function passRoadTest(name: string, notes?: string): Promise<void> {
  await setMultipleFields(name, {
    rt_result: 'Pass',
    road_test_note: notes || '',
    status: 'Road Test Completed',
  });
}

/** Fail Road Test */
export async function failRoadTest(name: string, reason: string): Promise<void> {
  await setMultipleFields(name, {
    rt_result: 'Fail',
    road_test_note: reason,
    rework_required: 1,
    status: 'Rework',
  });
}

/** Start QC Check: Road Test Completed → QC In Progress */
export async function startQC(name: string): Promise<void> {
  await setFieldValue(name, 'status', 'QC In Progress');
}

/** Pass QC */
export async function passQC(name: string): Promise<void> {
  await setMultipleFields(name, {
    qc_result: 'Pass',
    qc_checked_date: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: 'Completed',
  });
}

/** Fail QC */
export async function failQC(name: string, failReason: string): Promise<void> {
  await setMultipleFields(name, {
    qc_result: 'Fail',
    qc_fail_reason: failReason,
    rework_required: 1,
    status: 'Rework',
  });
}

/** Rework Completed: Rework → Repair Completed */
export async function reworkCompleted(name: string): Promise<void> {
  await setMultipleFields(name, {
    rework_required: 0,
    status: 'Repair Completed',
  });
}

// ─── Actions (Invoice & Delivery) ────────────────────────────

/** Create Sales Invoice from Job Card (whitelisted method) */
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

/** Get part stock availability (whitelisted method) */
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

/** Get part unit price (whitelisted method) */
export async function getPartUnitPrice(sparePart: string): Promise<number> {
  const response = await fetch(
    `/api/method/${DT_PATH}.get_job_card_part_unit_price?spare_part=${encodeURIComponent(sparePart)}`,
    { credentials: 'include', headers: { Accept: 'application/json' } }
  );
  const resData = await response.json();
  return resData?.message ?? 0;
}
