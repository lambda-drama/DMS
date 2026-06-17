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
  customer: string;
  company: string;
  warehouse: string;
  parts: SparePartSaleLine[];
  currency?: string;
  posting_date?: string;
  due_date?: string;
  remarks?: string;
  submit?: boolean;
  parts_discount?: StandaloneInvoiceGroupDiscount;
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
