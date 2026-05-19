/**
 * Invoices service — calls whitelisted methods in dms.api.invoices
 */
import { apiRequest } from './apiClient';
import type {
  InvoicePreview,
  ModeOfPayment,
  SalesInvoiceDetail,
  SalesInvoiceListItem,
} from '@/types/dms';

const API = 'dms.api.invoices';
const JC_API = 'dms.dealer_management_system.doctype.dms_job_card.dms_job_card';

export async function listInvoices(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<SalesInvoiceListItem[]> {
  return apiRequest<SalesInvoiceListItem[]>(`/api/method/${API}.get_invoices`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit || 50,
    }),
  });
}

export async function getInvoicePreviewFromJobCard(
  jobCard: string,
  options?: {
    warrantyApplicationType?: string;
    discountAmount?: number;
  }
): Promise<InvoicePreview> {
  return apiRequest<InvoicePreview>(
    `/api/method/${API}.get_invoice_preview_from_job_card`,
    {
      method: 'POST',
      body: JSON.stringify({
        job_card: jobCard,
        warranty_application_type: options?.warrantyApplicationType ?? null,
        discount_amount: options?.discountAmount ?? null,
      }),
    }
  );
}

export type StandaloneInvoiceLabourLine = {
  vehicle_service_item: string;
  hours?: number;
  estimated_hours?: number;
  rate_per_hour?: number;
  description?: string;
};

export type StandaloneInvoicePartLine = {
  spare_part: string;
  qty?: number;
  quantity?: number;
  unit_price?: number;
};

export async function createStandaloneInvoice(data: {
  customer: string;
  company: string;
  warehouse?: string;
  currency?: string;
  labour?: StandaloneInvoiceLabourLine[];
  parts?: StandaloneInvoicePartLine[];
  due_date?: string;
  posting_date?: string;
  remarks?: string;
  submit?: boolean;
}): Promise<{
  name: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  grand_total: number;
}> {
  return apiRequest(`/api/method/${API}.create_standalone_invoice`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function createInvoiceFromJobCard(
  jobCard: string,
  options?: {
    dueDate?: string;
    submit?: boolean;
    warrantyApplicationType?: string;
    discountAmount?: number;
  }
): Promise<string> {
  return apiRequest<string>(`/api/method/${JC_API}.make_sales_invoice_from_job_card`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: jobCard,
      due_date: options?.dueDate || null,
      submit: options?.submit ? 1 : 0,
      warranty_application_type: options?.warrantyApplicationType ?? null,
      discount_amount: options?.discountAmount ?? null,
    }),
  });
}

export async function getSalesInvoiceDetail(
  salesInvoice: string
): Promise<SalesInvoiceDetail> {
  return apiRequest<SalesInvoiceDetail>(
    `/api/method/${API}.get_sales_invoice_detail`,
    {
      method: 'POST',
      body: JSON.stringify({ sales_invoice: salesInvoice }),
    }
  );
}

export async function listModesOfPayment(company?: string): Promise<ModeOfPayment[]> {
  return apiRequest<ModeOfPayment[]>(`/api/method/${API}.list_modes_of_payment`, {
    method: 'POST',
    body: JSON.stringify({ company: company || null }),
  });
}

export async function collectPayment(params: {
  salesInvoice: string;
  modeOfPayment: string;
  paidAmount?: number;
  referenceNo?: string;
}): Promise<{
  payment_entry: string;
  paid_amount: number;
  outstanding_amount: number;
  status: string;
}> {
  return apiRequest(`/api/method/${API}.collect_payment`, {
    method: 'POST',
    body: JSON.stringify({
      sales_invoice: params.salesInvoice,
      mode_of_payment: params.modeOfPayment,
      paid_amount: params.paidAmount ?? null,
      reference_no: params.referenceNo || null,
    }),
  });
}
