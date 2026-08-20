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

export type RateOverrides = Record<string, number>;

export async function getInvoicePreviewFromJobCard(
  jobCard: string,
  options?: {
    warrantyApplicationType?: string;
    discountAmount?: number;
    labourDiscount?: StandaloneInvoiceGroupDiscount;
    partsDiscount?: StandaloneInvoiceGroupDiscount;
    rateOverrides?: RateOverrides;
    excludeRows?: string[];
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
        labour_discount: options?.labourDiscount ?? null,
        parts_discount: options?.partsDiscount ?? null,
        rate_overrides: options?.rateOverrides ?? null,
        exclude_rows: options?.excludeRows?.length ? options.excludeRows : null,
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

export type StandaloneInvoiceGroupDiscount = {
  type: 'percentage' | 'amount';
  value: number;
};

export async function createStandaloneInvoice(data: {
  customer: string;
  company: string;
  warehouse?: string;
  currency?: string;
  labour?: StandaloneInvoiceLabourLine[];
  parts?: StandaloneInvoicePartLine[];
  labour_discount?: StandaloneInvoiceGroupDiscount;
  parts_discount?: StandaloneInvoiceGroupDiscount;
  due_date?: string;
  posting_date?: string;
  remarks?: string;
  submit?: boolean;
  is_dms_invoice?: boolean;
  vehicle_vin?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  current_odometer?: number;
  apply_taxes?: boolean;
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
    postingDate?: string;
    submit?: boolean;
    warrantyApplicationType?: string;
    discountAmount?: number;
    labourDiscount?: StandaloneInvoiceGroupDiscount;
    partsDiscount?: StandaloneInvoiceGroupDiscount;
    rateOverrides?: RateOverrides;
    /** When true, apply DMS Settings Default Taxes and Charges Template. Default: false (blank). */
    applyTaxes?: boolean;
    excludeRows?: string[];
  }
): Promise<string> {
  return apiRequest<string>(`/api/method/${JC_API}.make_sales_invoice_from_job_card`, {
    method: 'POST',
    body: JSON.stringify({
      job_card: jobCard,
      due_date: options?.dueDate || null,
      posting_date: options?.postingDate || null,
      submit: options?.submit ? 1 : 0,
      warranty_application_type: options?.warrantyApplicationType ?? null,
      discount_amount: options?.discountAmount ?? null,
      labour_discount: options?.labourDiscount ?? null,
      parts_discount: options?.partsDiscount ?? null,
      rate_overrides: options?.rateOverrides ?? null,
      apply_taxes: options?.applyTaxes ? 1 : 0,
      exclude_rows: options?.excludeRows?.length ? options.excludeRows : null,
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

export async function cancelSalesInvoice(salesInvoice: string): Promise<{
  name: string;
  docstatus: number;
  status: string;
  outstanding_amount: number;
}> {
  return apiRequest(`/api/method/${API}.cancel_sales_invoice`, {
    method: 'POST',
    body: JSON.stringify({ sales_invoice: salesInvoice }),
  });
}

export async function amendSalesInvoice(salesInvoice: string): Promise<SalesInvoiceDetail> {
  return apiRequest<SalesInvoiceDetail>(`/api/method/${API}.amend_sales_invoice`, {
    method: 'POST',
    body: JSON.stringify({ sales_invoice: salesInvoice }),
  });
}

export async function updateDraftSalesInvoice(data: {
  name: string;
  remarks?: string;
  posting_date?: string;
  due_date?: string;
  items?: Array<{
    name: string;
    qty?: number;
    rate?: number;
    dms_discount?: number;
  }>;
  discount_mode?: 'none' | 'percentage' | 'amount';
  discount?: StandaloneInvoiceGroupDiscount;
  additional_discount_percentage?: number;
  discount_amount?: number;
  apply_discount_on?: string;
  submit?: boolean;
}): Promise<SalesInvoiceDetail> {
  return apiRequest<SalesInvoiceDetail>(`/api/method/${API}.update_draft_sales_invoice`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function collectPayment(params: {
  salesInvoice: string;
  modeOfPayment?: string;
  paidAmount?: number;
  referenceNo?: string;
  payments?: Array<{
    mode_of_payment: string;
    amount: number;
    reference_no?: string;
  }>;
}): Promise<{
  payment_entry: string;
  payment_entries?: string[];
  paid_amount: number;
  outstanding_amount: number;
  status: string;
}> {
  return apiRequest(`/api/method/${API}.collect_payment`, {
    method: 'POST',
    body: JSON.stringify({
      sales_invoice: params.salesInvoice,
      mode_of_payment: params.modeOfPayment || null,
      paid_amount: params.paidAmount ?? null,
      reference_no: params.referenceNo || null,
      payments: params.payments || null,
    }),
  });
}
