/**
 * Spare part counter sales — dms.api.spare_part_sales
 */
import { apiRequest } from './apiClient';
import type { StandaloneInvoiceGroupDiscount } from './invoices';
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
  transaction_date?: string;
  delivery_date?: string;
  grand_total?: number;
  currency?: string;
  status?: string;
  docstatus?: number;
  per_billed?: number;
  converted?: boolean;
  modified?: string;
}

export interface SparePartProformaDetail extends SparePartProformaListItem {
  remarks?: string;
  items?: Array<{
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
}): Promise<{ data: SparePartProformaListItem[]; total: number }> {
  return apiRequest(`/api/method/${API}.list_spare_part_proformas`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      status: options?.status || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
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
