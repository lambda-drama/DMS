/**
 * Payment Entries service — customer advances / downpayments and the DMS
 * Payment Entry listing (dms.api.payment_entries).
 */
import { apiRequest } from './apiClient';
import type {
  CustomerAdvancesSummary,
  PaymentEntryDetail,
  PaymentEntryListItem,
  PaginatedResponse,
  ReconciliationOverview,
  ReconciliationPlan,
  ReconciliationResult,
} from '@/types/dms';

const API = 'dms.api.payment_entries';

export interface AdvancePaymentRow {
  mode_of_payment?: string;
  amount: number;
  reference_no?: string;
}

export interface AdvancePaymentInput {
  customer: string;
  company: string;
  /** Single-row shorthand — use `payments` to split a downpayment across modes. */
  amount?: number;
  mode_of_payment?: string;
  reference_no?: string;
  /** Multi-mode rows (e.g. part cash, part bank). One Payment Entry per row. */
  payments?: AdvancePaymentRow[];
  reference_date?: string;
  posting_date?: string;
  remarks?: string;
  job_card?: string;
  service_estimate?: string;
  /** Cancelled Payment Entry this advance replaces (editable amend). */
  amended_from?: string;
}

export async function listPaymentEntries(options?: {
  status?: string;
  search?: string;
  party?: string;
  advance_only?: boolean;
  limit?: number;
  offset?: number;
  posting_from?: string;
  posting_to?: string;
}): Promise<PaginatedResponse<PaymentEntryListItem>> {
  return apiRequest<PaginatedResponse<PaymentEntryListItem>>(
    `/api/method/${API}.get_payment_entries`,
    {
      method: 'POST',
      body: JSON.stringify({
        status: options?.status || null,
        search: options?.search || null,
        party: options?.party || null,
        advance_only: options?.advance_only ? 1 : 0,
        limit: options?.limit || 30,
        offset: options?.offset || 0,
        include_total: 1,
        posting_from: options?.posting_from || null,
        posting_to: options?.posting_to || null,
      }),
    }
  );
}

export async function getPaymentEntryDetail(name: string): Promise<PaymentEntryDetail> {
  return apiRequest<PaymentEntryDetail>(`/api/method/${API}.get_payment_entry_detail`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createAdvancePayment(
  data: AdvancePaymentInput
): Promise<{
  name: string;
  payment_entry: string;
  payment_entries: string[];
  count: number;
  docstatus: number;
  paid_amount: number;
  unallocated_amount: number;
  customer: string;
  customer_name?: string;
  amended_from?: string | null;
}> {
  return apiRequest(`/api/method/${API}.create_advance_payment`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function getCustomerAdvances(
  customer: string,
  company?: string
): Promise<CustomerAdvancesSummary> {
  return apiRequest<CustomerAdvancesSummary>(
    `/api/method/${API}.get_customer_advances`,
    {
      method: 'POST',
      body: JSON.stringify({ customer, company: company || null }),
    }
  );
}

export async function cancelPaymentEntry(
  name: string
): Promise<{ name: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.cancel_payment_entry`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/** Amend a cancelled entry — creates (and by default submits) a corrected copy. */
export async function amendPaymentEntry(
  name: string,
  submit = true
): Promise<{
  name: string;
  docstatus: number;
  amended_from: string;
  paid_amount: number;
  unallocated_amount: number;
}> {
  return apiRequest(`/api/method/${API}.amend_payment_entry`, {
    method: 'POST',
    body: JSON.stringify({ name, submit: submit ? 1 : 0 }),
  });
}

export async function deleteDraftPaymentEntry(name: string): Promise<{ deleted: string }> {
  return apiRequest(`/api/method/${API}.delete_draft_payment_entry`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/**
 * Reconciliation Hub — dms.api.reconciliation
 */
const RECON_API = 'dms.api.reconciliation';

export async function getReconciliationOverview(
  customer: string,
  company?: string
): Promise<ReconciliationOverview> {
  return apiRequest<ReconciliationOverview>(
    `/api/method/${RECON_API}.get_reconciliation_overview`,
    {
      method: 'POST',
      body: JSON.stringify({ customer, company: company || null }),
    }
  );
}

export async function previewAllocation(
  customer: string,
  company: string,
  invoiceKeys: string[],
  paymentKeys: string[]
): Promise<ReconciliationPlan> {
  return apiRequest<ReconciliationPlan>(
    `/api/method/${RECON_API}.preview_allocation`,
    {
      method: 'POST',
      body: JSON.stringify({ customer, company, invoice_keys: invoiceKeys, payment_keys: paymentKeys }),
    }
  );
}

export async function reconcilePayments(
  customer: string,
  company: string,
  invoiceKeys: string[],
  paymentKeys: string[]
): Promise<ReconciliationResult> {
  return apiRequest<ReconciliationResult>(
    `/api/method/${RECON_API}.reconcile_payments`,
    {
      method: 'POST',
      body: JSON.stringify({ customer, company, invoice_keys: invoiceKeys, payment_keys: paymentKeys }),
    }
  );
}
