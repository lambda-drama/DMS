/**
 * DMS Service Estimate — diagnosis → estimation → customer approval workflow
 */
import { apiRequest } from './apiClient';
import type { DMSServiceEstimate, PaginatedResponse } from '@/types/dms';

const API = 'dms.api.service_estimates';
const DT = 'dms.dealer_management_system.doctype.dms_service_estimate.dms_service_estimate';

export async function listServiceEstimates(options?: {
  status?: string;
  customer?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<DMSServiceEstimate>> {
  return apiRequest<PaginatedResponse<DMSServiceEstimate>>(
    `/api/method/${API}.get_service_estimates`,
    {
      method: 'POST',
      body: JSON.stringify({
        status: options?.status || null,
        customer: options?.customer || null,
        search: options?.search || null,
        limit: options?.limit || 50,
        offset: options?.offset || 0,
      }),
    }
  );
}

export async function getServiceEstimate(name: string): Promise<DMSServiceEstimate> {
  return apiRequest<DMSServiceEstimate>(`/api/method/${API}.get_service_estimate`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateServiceEstimate(
  name: string,
  data: Partial<DMSServiceEstimate>
): Promise<DMSServiceEstimate> {
  return apiRequest<DMSServiceEstimate>(`/api/method/${API}.update_service_estimate`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function getEstimateSettings(): Promise<{
  default_diagnostic_fee: number;
  default_vat_rate: number;
  diagnostic_fee_item?: string;
}> {
  return apiRequest(`/api/method/${API}.get_dms_estimate_settings`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function makeFromInspection(inspection: string): Promise<string> {
  return apiRequest<string>(`/api/method/${DT}.make_service_estimate_from_inspection`, {
    method: 'POST',
    body: JSON.stringify({ source_name: inspection }),
  });
}

export async function completeDiagnosis(
  estimateName: string,
  payload: { diagnosis_findings?: string; recommended_repairs?: string }
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${DT}.complete_diagnosis`, {
    method: 'POST',
    body: JSON.stringify({
      estimate_name: estimateName,
      diagnosis_findings: payload.diagnosis_findings ?? null,
      recommended_repairs: payload.recommended_repairs ?? null,
    }),
  });
}

export async function startEstimation(estimateName: string): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${DT}.start_estimation`, {
    method: 'POST',
    body: JSON.stringify({ estimate_name: estimateName }),
  });
}

export async function submitForCustomerApproval(estimateName: string): Promise<{
  name: string;
  status: string;
  total_before_vat: number;
  grand_total: number;
}> {
  return apiRequest(`/api/method/${DT}.submit_for_customer_approval`, {
    method: 'POST',
    body: JSON.stringify({ estimate_name: estimateName }),
  });
}

export async function acceptEstimate(
  estimateName: string,
  payload: {
    customer_signature: string;
    lead_technician?: string;
    assigned_bay?: string;
    start_repair?: boolean;
  }
): Promise<{ name: string; status: string; job_card: string }> {
  return apiRequest(`/api/method/${DT}.accept_estimate`, {
    method: 'POST',
    body: JSON.stringify({
      estimate_name: estimateName,
      customer_signature: payload.customer_signature,
      lead_technician: payload.lead_technician || null,
      assigned_bay: payload.assigned_bay || null,
      start_repair: payload.start_repair ? 1 : 0,
    }),
  });
}

export async function rejectEstimate(
  estimateName: string,
  rejectionSignature: string
): Promise<{ name: string; status: string; diagnostic_invoice: string }> {
  return apiRequest(`/api/method/${DT}.reject_estimate`, {
    method: 'POST',
    body: JSON.stringify({
      estimate_name: estimateName,
      rejection_signature: rejectionSignature,
    }),
  });
}
