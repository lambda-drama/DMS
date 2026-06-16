/**
 * Stock Entry & Stock Reconciliation — dms.api.stock_operations
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.stock_operations';

export interface DmsWarehouseOption {
  name: string;
  warehouse_name?: string;
  company?: string;
}

export interface StockOperationDefaults {
  company: string;
  default_warehouse?: string | null;
  stock_adjustment_account?: string | null;
  cost_center?: string | null;
  branch?: string | null;
  project?: string | null;
  warehouses: DmsWarehouseOption[];
  stock_entry_types: { value: string; label: string }[];
  companies?: string[];
  default_item_group?: string | null;
  auto_create_spare_parts?: boolean;
}

export interface PurchaseReceiptDefaults {
  company: string;
  default_warehouse?: string | null;
  default_supplier?: string | null;
  default_supplier_group?: string | null;
  cost_center?: string | null;
  branch?: string | null;
  project?: string | null;
  warehouses: DmsWarehouseOption[];
  companies: string[];
  default_item_group?: string | null;
  auto_create_spare_parts?: boolean;
}

export interface StockItemCreateResult {
  name: string;
  label?: string;
  item_code: string;
  item_name: string;
  standard_rate?: number;
  spare_part?: string | null;
  item_group?: string;
}

export interface StockItemCreateDefaults {
  default_item_group?: string | null;
  auto_create_spare_parts?: boolean;
}

export interface SupplierSearchRow {
  name: string;
  supplier_name?: string;
}

export interface PurchaseReceiptListRow {
  name: string;
  supplier?: string;
  company?: string;
  posting_date?: string;
  docstatus?: number;
  grand_total?: number;
}

export interface PurchaseReceiptDetailItem {
  item_code: string;
  item_name?: string;
  qty?: number;
  rate?: number;
  amount?: number;
  warehouse?: string;
  uom?: string;
}

export interface PurchaseReceiptDetail {
  name: string;
  supplier?: string;
  company?: string;
  posting_date?: string;
  docstatus?: number;
  grand_total?: number;
  remarks?: string;
  items: PurchaseReceiptDetailItem[];
}

export interface StockItemSearchRow {
  item_code: string;
  item_name: string;
  stock_uom?: string;
  valuation_rate?: number;
  qty_on_hand?: number;
}

export interface StockEntryListRow {
  name: string;
  stock_entry_type?: string;
  company?: string;
  posting_date?: string;
  docstatus?: number;
  total_outgoing_value?: number;
  total_incoming_value?: number;
  remarks?: string;
}

export interface StockReconciliationListRow {
  name: string;
  company?: string;
  posting_date?: string;
  docstatus?: number;
  purpose?: string;
  remarks?: string;
}

export interface StockEntryLineInput {
  item_code: string;
  qty: number;
  s_warehouse?: string;
  t_warehouse?: string;
  basic_rate?: number;
  valuation_rate?: number;
}

export async function fetchStockOperationDefaults(company?: string): Promise<StockOperationDefaults> {
  return apiRequest(`/api/method/${API}.get_stock_operation_defaults_api`, {
    method: 'POST',
    body: JSON.stringify({ company: company || null }),
  });
}

export async function fetchDmsStockWarehouses(company?: string): Promise<DmsWarehouseOption[]> {
  return apiRequest(`/api/method/${API}.get_dms_stock_warehouses`, {
    method: 'POST',
    body: JSON.stringify({ company: company || null }),
  });
}

export async function searchStockItems(
  search?: string,
  warehouse?: string,
  limit = 20
): Promise<StockItemSearchRow[]> {
  return apiRequest(`/api/method/${API}.search_stock_items_for_ui`, {
    method: 'POST',
    body: JSON.stringify({
      search: search || null,
      warehouse: warehouse || null,
      limit,
    }),
  });
}

export async function listStockEntries(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<StockEntryListRow[]> {
  return apiRequest(`/api/method/${API}.get_stock_entries`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 30,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function listStockReconciliations(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<StockReconciliationListRow[]> {
  return apiRequest(`/api/method/${API}.get_stock_reconciliations`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 30,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function createStockEntry(data: {
  company: string;
  stock_entry_type: string;
  posting_date?: string;
  s_warehouse?: string;
  t_warehouse?: string;
  expense_account?: string;
  remarks?: string;
  submit?: boolean;
  items: StockEntryLineInput[];
}): Promise<{ name: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.create_stock_entry`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function createStockReconciliation(data: {
  company: string;
  warehouse: string;
  posting_date?: string;
  expense_account?: string;
  remarks?: string;
  submit?: boolean;
  items: Array<{ item_code: string; qty: number; valuation_rate?: number }>;
}): Promise<{ name: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.create_stock_reconciliation`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function fetchPurchaseReceiptDefaults(company?: string): Promise<PurchaseReceiptDefaults> {
  return apiRequest(`/api/method/${API}.get_purchase_receipt_defaults_api`, {
    method: 'POST',
    body: JSON.stringify({ company: company || null }),
  });
}

export async function searchSuppliers(search?: string, limit = 20): Promise<SupplierSearchRow[]> {
  return apiRequest(`/api/method/${API}.search_suppliers_for_ui`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, limit }),
  });
}

export interface SupplierCreateResult {
  name: string;
  label?: string;
  supplier_name: string;
}

export async function createSupplier(data: {
  supplier_name: string;
  supplier_type?: string;
  mobile_no?: string;
  email_id?: string;
}): Promise<SupplierCreateResult> {
  return apiRequest(`/api/method/${API}.create_supplier`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function listPurchaseReceipts(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PurchaseReceiptListRow[]> {
  return apiRequest(`/api/method/${API}.get_purchase_receipts`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 30,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function fetchPurchaseReceiptDetail(name: string): Promise<PurchaseReceiptDetail> {
  return apiRequest(`/api/method/${API}.get_purchase_receipt_detail`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createPurchaseReceipt(data: {
  company?: string;
  supplier?: string;
  warehouse?: string;
  posting_date?: string;
  remarks?: string;
  submit?: boolean;
  items: Array<{ item_code: string; qty: number; rate: number; warehouse?: string }>;
}): Promise<{ name: string; docstatus: number; supplier?: string }> {
  return apiRequest(`/api/method/${API}.create_purchase_receipt`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function fetchStockItemCreateDefaults(): Promise<StockItemCreateDefaults> {
  return apiRequest(`/api/method/${API}.get_stock_item_create_defaults_api`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function createStockItem(data: {
  item_code: string;
  item_name?: string;
  standard_rate?: number;
  item_group?: string;
}): Promise<StockItemCreateResult> {
  return apiRequest(`/api/method/${API}.create_stock_item`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}
