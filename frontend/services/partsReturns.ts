import { apiRequest } from './apiClient';

const API = 'dms.api.parts_returns';

export interface PartsReturnSummary {
  name: string;
  status: string;
  posting_date?: string;
  stock_entry?: string;
  raised_by?: string;
}

export interface PartsReturnLineInput {
  job_card_part_row: string;
  quantity_returned: number;
}

export async function listPartsReturns(jobCard: string): Promise<PartsReturnSummary[]> {
  return apiRequest(`/api/method/${API}.list_parts_returns_for_job_card`, {
    method: 'POST',
    body: JSON.stringify({ job_card: jobCard }),
  });
}

export async function createPartsReturn(
  jobCard: string,
  items: PartsReturnLineInput[],
  raisedBy?: string,
  remarks?: string
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.create_parts_return_from_job_card`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: jobCard,
      items,
      raised_by: raisedBy || null,
      remarks: remarks || null,
    }),
  });
}

export async function submitPartsReturn(name: string): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.submit_parts_return`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function approvePartsReturn(
  name: string
): Promise<{ name: string; status: string; stock_entry?: string }> {
  return apiRequest(`/api/method/${API}.approve_parts_return`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
