/**
 * Spare part counter sales — dms.api.spare_part_sales
 */
import { apiRequest } from './apiClient';
import type { InvoiceTaxPreview, StandaloneInvoiceGroupDiscount } from './invoices';
import type { DmsWarehouseOption } from './stockOperations';

const API = 'dms.api.spare_part_sales';

export interface SparePartSalesDefaults {
  company: string;
  default_warehouse?: string | null;
  warehouses: DmsWarehouseOption[];
  companies: string[];
  default_customer?: string | null;
  default_customer_name?: string | null;
}

export interface SparePartForSale {
  name: string;
  item_name?: string;
  item_code?: string;
  part_category?: string;
  oem_part_number?: string;
  unit_price?: number;
  qty_on_hand?: number | null;
  erp_item?: string | null;
}

export interface SparePartSaleLine {
  spare_part: string;
  qty: number;
  unit_price?: number;
}

export interface ProformaLabourLine {
  vehicle_service_item: string;
  hours?: number;
  estimated_hours?: number;
  rate_per_hour?: number;
  rate?: number;
  description?: string;
}

export async function fetchSparePartSalesDefaults(
  company?: string
): Promise<SparePartSalesDefaults> {
  return apiRequest<SparePartSalesDefaults>(
    `/api/method/${API}.get_spare_part_sales_defaults`,
    {
      method: 'POST',
      body: JSON.stringify({ company: company || null }),
    }
  );
}

export async function searchSparePartsForSale(options?: {
  search?: string;
  warehouse?: string;
  limit?: number;
  inStockOnly?: boolean;
}): Promise<SparePartForSale[]> {
  return apiRequest<SparePartForSale[]>(
    `/api/method/${API}.search_spare_parts_for_sale`,
    {
      method: 'POST',
      body: JSON.stringify({
        search: options?.search || null,
        warehouse: options?.warehouse || null,
        limit: options?.limit || 25,
        in_stock_only: options?.inStockOnly ? 1 : 0,
      }),
    }
  );
}

export async function createSparePartSale(data: {
  customer?: string;
  company: string;
  /** Mandatory branch — defaults to the user's branch, scoped to the company. */
  branch?: string;
  warehouse: string;
  parts: SparePartSaleLine[];
  currency?: string;
  posting_date?: string;
  due_date?: string;
  remarks?: string;
  submit?: boolean;
  parts_discount?: StandaloneInvoiceGroupDiscount;
  vehicle_vin?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_model_label?: string;
}): Promise<{
  name: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  grand_total: number;
  status?: string;
}> {
  return apiRequest(`/api/method/${API}.create_spare_part_sale`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export interface SparePartProformaListItem {
  name: string;
  sales_order: string;
  customer: string;
  customer_name?: string;
  company?: string;
  /** Branch the proforma was raised in (row-level isolation for branch users). */
  branch?: string;
  transaction_date?: string;
  delivery_date?: string;
  grand_total?: number;
  currency?: string;
  status?: string;
  docstatus?: number;
  per_billed?: number;
  converted?: boolean;
  already_amended?: number | boolean;
  amended_as?: string;
  amended_from?: string;
  modified?: string;
}

export interface SparePartProformaDetail extends SparePartProformaListItem {
  remarks?: string;
  warehouse?: string;
  vehicle_vin?: string;
  apply_taxes?: number | boolean;
  apply_tax_withholding?: number | boolean;
  items?: Array<{
    spare_part?: string;
    item_code?: string;
    item_name?: string;
    qty?: number;
    rate?: number;
    amount?: number;
    warehouse?: string;
  }>;
  labour?: Array<{
    vehicle_service_item?: string;
    vehicle_service_item_name?: string;
    hours?: number;
    rate_per_hour?: number;
    amount?: number;
  }>;
  parts?: Array<{
    spare_part?: string;
    item_code?: string;
    item_name?: string;
    qty?: number;
    rate?: number;
    amount?: number;
    warehouse?: string;
  }>;
  sales_invoices?: string[];
}

export async function listSparePartProformas(options?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
  from_date?: string;
  to_date?: string;
}): Promise<{ data: SparePartProformaListItem[]; total: number }> {
  return apiRequest(`/api/method/${API}.list_spare_part_proformas`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      status: options?.status || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
      from_date: options?.from_date || null,
      to_date: options?.to_date || null,
    }),
  });
}

export async function getSparePartProforma(name: string): Promise<SparePartProformaDetail> {
  return apiRequest(`/api/method/${API}.get_spare_part_proforma`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createSparePartProforma(data: {
  customer?: string;
  company: string;
  /** Mandatory branch — defaults to the user's branch, scoped to the company. */
  branch?: string;
  warehouse?: string;
  labour?: ProformaLabourLine[];
  parts?: SparePartSaleLine[];
  currency?: string;
  posting_date?: string;
  due_date?: string;
  remarks?: string;
  submit?: boolean;
  labour_discount?: StandaloneInvoiceGroupDiscount;
  parts_discount?: StandaloneInvoiceGroupDiscount;
  vehicle_vin?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  apply_taxes?: boolean;
  apply_tax_withholding?: boolean;
}): Promise<{
  name: string;
  sales_order: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  grand_total: number;
  status?: string;
}> {
  return apiRequest(`/api/method/${API}.create_spare_part_proforma`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateSparePartProforma(data: {
  name: string;
  customer?: string;
  company: string;
  /** Kept in sync with the company; never silently cleared. */
  branch?: string;
  warehouse?: string;
  labour?: ProformaLabourLine[];
  parts?: SparePartSaleLine[];
  currency?: string;
  posting_date?: string;
  due_date?: string;
  remarks?: string;
  submit?: boolean;
  labour_discount?: StandaloneInvoiceGroupDiscount;
  parts_discount?: StandaloneInvoiceGroupDiscount;
  vehicle_vin?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  apply_taxes?: boolean;
  apply_tax_withholding?: boolean;
}): Promise<{
  name: string;
  sales_order: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  grand_total: number;
  status?: string;
}> {
  return apiRequest(`/api/method/${API}.update_spare_part_proforma`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function convertProformaToSalesInvoice(
  name: string,
  data?: {
    warehouse?: string;
    posting_date?: string;
    due_date?: string;
    submit?: boolean;
  }
): Promise<{
  name: string;
  docstatus: number;
  customer: string;
  customer_name: string;
  grand_total: number;
  status?: string;
  sales_order: string;
}> {
  return apiRequest(`/api/method/${API}.convert_proforma_to_sales_invoice`, {
    method: 'POST',
    body: JSON.stringify({ name, data: data || {} }),
  });
}

export async function cancelSparePartProforma(name: string): Promise<{
  name: string;
  sales_order: string;
  docstatus: number;
  status?: string;
}> {
  return apiRequest(`/api/method/${API}.cancel_spare_part_proforma`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteDraftSparePartProforma(
  name: string
): Promise<{ deleted: string }> {
  return apiRequest(`/api/method/${API}.delete_draft_spare_part_proforma`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function amendSparePartProforma(name: string): Promise<SparePartProformaDetail> {
  return apiRequest(`/api/method/${API}.amend_spare_part_proforma`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export type ProformaTaxPreview = InvoiceTaxPreview & {
  order_net_total?: number;
  order_total_taxes_and_charges?: number;
  order_grand_total?: number;
};

export async function getSparePartProformaTaxPreview(params: {
  customer?: string | null;
  company?: string | null;
  warehouse?: string | null;
  currency?: string | null;
  posting_date?: string | null;
  due_date?: string | null;
  apply_taxes?: boolean | number;
  apply_tax_withholding?: boolean | number;
  parts?: SparePartSaleLine[];
  labour?: ProformaLabourLine[];
  labour_discount?: StandaloneInvoiceGroupDiscount | null;
  parts_discount?: StandaloneInvoiceGroupDiscount | null;
}): Promise<ProformaTaxPreview> {
  return apiRequest<ProformaTaxPreview>(`/api/method/${API}.get_spare_part_proforma_tax_preview`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        customer: params.customer || null,
        company: params.company || null,
        warehouse: params.warehouse || null,
        currency: params.currency || null,
        posting_date: params.posting_date || null,
        due_date: params.due_date || null,
        apply_taxes: params.apply_taxes ? 1 : 0,
        apply_tax_withholding: params.apply_tax_withholding ? 1 : 0,
        parts: params.parts?.length ? params.parts : null,
        labour: params.labour?.length ? params.labour : null,
        labour_discount: params.labour_discount || null,
        parts_discount: params.parts_discount || null,
      },
    }),
  });
}
