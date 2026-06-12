import { apiRequest } from './apiClient';
import type { PaginatedResponse } from '@/types/dms';

const API = 'dms.api.parts_requests';
const AWR_API = 'dms.api.additional_work';

export interface PartsRequestSummary {
  name: string;
  status: string;
  posting_date?: string;
  pick_slip?: string;
  stock_entry?: string;
  requested_by?: string;
  issued_date?: string;
  received_date?: string;
}

export interface PartsRequestListItem extends PartsRequestSummary {
  job_card?: string;
  customer?: string;
  customer_name?: string;
  license_plate?: string;
  vehicle_vin?: string;
  item_count?: number;
  modified?: string;
}

export interface PartsRequestDetail extends PartsRequestSummary {
  customer?: string;
  license_plate?: string;
  vehicle_vin?: string;
  items?: Array<{
    name: string;
    job_card_part_row?: string;
    item_code: string;
    part_name?: string;
    quantity_requested: number;
    quantity_issued?: number;
    stock_available?: number;
    bin_location?: string;
    line_status?: string;
  }>;
  job_card?: string;
  picker_signature?: string;
  parts_staff_signature?: string;
  received_by_signature?: string;
}

export async function listAllPartsRequests(options?: {
  status?: string;
  filter?: 'active' | 'pending_approval' | 'ready_for_issue';
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<PartsRequestListItem>> {
  return apiRequest(`/api/method/${API}.list_parts_requests`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      filter: options?.filter || null,
      search: options?.search || null,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    }),
  });
}

export async function listPartsRequests(jobCard: string): Promise<PartsRequestSummary[]> {
  return apiRequest(`/api/method/${API}.list_parts_requests_for_job_card`, {
    method: 'POST',
    body: JSON.stringify({ job_card: jobCard }),
  });
}

export async function getPartsRequest(name: string): Promise<PartsRequestDetail> {
  return apiRequest(`/api/method/${API}.get_parts_request`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createPartsRequest(
  jobCard: string,
  requestedBy?: string,
  partRowNames?: string[]
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.create_parts_request_from_job_card`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: jobCard,
      requested_by: requestedBy || null,
      part_row_names: partRowNames?.length ? partRowNames : null,
    }),
  });
}

export async function addPartLineToJobCard(
  jobCard: string,
  payload: {
    item_code: string;
    quantity_requested?: number;
    unit_price?: number;
    notes?: string;
    request_immediately?: boolean;
    requested_by?: string;
  }
): Promise<{
  job_card: string;
  part_row: string;
  item_code: string;
  parts_request?: string;
  parts_request_status?: string;
}> {
  return apiRequest(`/api/method/${API}.add_part_line_to_job_card`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: jobCard,
      item_code: payload.item_code,
      quantity_requested: payload.quantity_requested ?? 1,
      unit_price: payload.unit_price ?? null,
      notes: payload.notes || null,
      request_immediately: payload.request_immediately ? 1 : 0,
      requested_by: payload.requested_by || null,
    }),
  });
}

export async function cancelPartsRequest(name: string): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.cancel_parts_request`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function approvePartsRequest(name: string): Promise<{
  name: string;
  status: string;
  pick_slip?: string;
}> {
  return apiRequest(`/api/method/${API}.approve_parts_request`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function markPickSlipPicked(name: string): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.mark_pick_slip_picked`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function issuePartsRequest(
  name: string,
  pickerSignature: string,
  partsStaffSignature: string
): Promise<{ name: string; status: string; stock_entry?: string }> {
  return apiRequest(`/api/method/${API}.issue_parts_request`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      picker_signature: pickerSignature,
      parts_staff_signature: partsStaffSignature,
    }),
  });
}

export async function receivePartsRequest(
  name: string,
  receivedBySignature: string
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.receive_parts_request`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      received_by_signature: receivedBySignature,
    }),
  });
}

export async function assignJobCardWorkshop(
  jobCard: string,
  leadTechnician: string,
  assignedBay?: string
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.assign_job_card_workshop`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: jobCard,
      lead_technician: leadTechnician,
      assigned_bay: assignedBay || null,
    }),
  });
}

export interface AdditionalWorkRequestSummary {
  name: string;
  status: string;
  posting_date?: string;
  description?: string;
  reason?: string;
  raised_by?: string;
  supplementary_estimate?: string;
}

export async function listAdditionalWorkRequests(
  jobCard: string
): Promise<AdditionalWorkRequestSummary[]> {
  return apiRequest(`/api/method/${AWR_API}.list_additional_work_requests_for_job_card`, {
    method: 'POST',
    body: JSON.stringify({ job_card: jobCard }),
  });
}

export async function createAdditionalWorkRequest(
  jobCard: string,
  payload: { description: string; reason?: string; raised_by?: string }
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${AWR_API}.create_additional_work_request`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: jobCard,
      description: payload.description,
      reason: payload.reason || null,
      raised_by: payload.raised_by || null,
    }),
  });
}

export async function createSupplementaryEstimate(
  awrName: string
): Promise<{ name: string; additional_work_request: string }> {
  return apiRequest(`/api/method/${AWR_API}.create_supplementary_estimate_from_awr`, {
    method: 'POST',
    body: JSON.stringify({ awr_name: awrName }),
  });
}
