/**
 * Stock Entry & Stock Reconciliation — dms.api.stock_operations
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.stock_operations';

export interface DmsWarehouseOption {
  name: string;
  warehouse_name?: string;
  company?: string;
  workshop?: string;
  workshop_name?: string;
}

export function formatDmsWarehouseLabel(w: DmsWarehouseOption): string {
  const wh = w.warehouse_name || w.name;
  if (w.workshop_name && w.workshop_name !== wh) {
    return `${w.workshop_name} — ${wh}`;
  }
  return wh;
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
  material_request_types?: { value: string; label: string }[];
  companies?: string[];
  default_item_group?: string | null;
  auto_create_spare_parts?: boolean;
}

export interface PurchaseReceiptDefaults {
  company: string;
  default_warehouse?: string | null;
  default_supplier?: string | null;
  default_supplier_group?: string | null;
  default_currency?: string | null;
  default_price_list?: string | null;
  price_lists?: Array<{ name: string; currency?: string | null }>;
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
  valuation_rate?: number;
  standard_rate?: number;
  item_price?: string | null;
  price_list?: string | null;
  spare_part?: string | null;
  item_group?: string;
  stock_uom?: string;
  bin_location?: string | null;
}

export interface StockItemCreateDefaults {
  default_item_group?: string | null;
  auto_create_spare_parts?: boolean;
  default_stock_uom?: string | null;
  uoms?: Array<{ value: string; label: string }>;
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
  currency?: string;
  buying_price_list?: string;
  remarks?: string;
  items: PurchaseReceiptDetailItem[];
}

export interface ItemUomOption {
  value: string;
  label: string;
}

export interface ItemUomDefaults {
  stock_uom?: string | null;
  uoms: ItemUomOption[];
}

export interface StockItemSearchRow {
  item_code: string;
  item_name: string;
  spare_part?: string;
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

export interface MaterialRequestListRow {
  name: string;
  material_request_type?: string;
  company?: string;
  transaction_date?: string;
  schedule_date?: string;
  docstatus?: number;
  status?: string;
  set_warehouse?: string;
  set_from_warehouse?: string;
  has_pending?: boolean;
  actions?: MaterialRequestFulfillmentAction[];
}

export interface MaterialRequestFulfillmentAction {
  action: 'stock_entry' | 'purchase_receipt';
  label: string;
}

export interface PendingMaterialRequestRow extends MaterialRequestListRow {
  warehouse?: string;
  from_warehouse?: string;
  pending_lines?: number;
  pending_qty?: number;
  actions?: MaterialRequestFulfillmentAction[];
}

export interface MaterialRequestDetailItem {
  name: string;
  item_code: string;
  item_name?: string;
  qty?: number;
  stock_qty?: number;
  ordered_qty?: number;
  received_qty?: number;
  pending_qty?: number;
  uom?: string;
  warehouse?: string;
  from_warehouse?: string;
}

export interface MaterialRequestDetail {
  name: string;
  material_request_type?: string;
  company?: string;
  transaction_date?: string;
  schedule_date?: string;
  status?: string;
  docstatus?: number;
  set_warehouse?: string;
  set_from_warehouse?: string;
  items: MaterialRequestDetailItem[];
  actions?: MaterialRequestFulfillmentAction[];
}

export interface FulfillmentResult {
  name: string;
  docstatus: number;
  material_request?: string;
  doctype?: string;
  supplier?: string;
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

export interface StockEntryDetailItem {
  item_code: string;
  item_name?: string;
  qty?: number;
  uom?: string;
  s_warehouse?: string;
  t_warehouse?: string;
  basic_rate?: number;
  amount?: number;
}

export interface StockEntryDetail {
  name: string;
  stock_entry_type?: string;
  company?: string;
  posting_date?: string;
  docstatus?: number;
  total_outgoing_value?: number;
  total_incoming_value?: number;
  remarks?: string;
  items: StockEntryDetailItem[];
}

export async function fetchStockEntryDetail(name: string): Promise<StockEntryDetail> {
  return apiRequest(`/api/method/${API}.get_stock_entry_detail`, {
    method: 'POST',
    body: JSON.stringify({ name }),
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

export async function fetchMaterialRequestDefaults(company?: string): Promise<StockOperationDefaults> {
  return apiRequest(`/api/method/${API}.get_material_request_defaults_api`, {
    method: 'POST',
    body: JSON.stringify({ company: company || null }),
  });
}

export async function listMaterialRequests(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<MaterialRequestListRow[]> {
  return apiRequest(`/api/method/${API}.get_material_requests`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 30,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function fetchItemUoms(itemCode: string): Promise<ItemUomDefaults> {
  return apiRequest(`/api/method/${API}.get_item_uoms_for_ui_api`, {
    method: 'POST',
    body: JSON.stringify({ item_code: itemCode }),
  });
}

export async function createMaterialRequest(data: {
  company: string;
  material_request_type: string;
  transaction_date?: string;
  schedule_date?: string;
  set_warehouse?: string;
  set_from_warehouse?: string;
  s_warehouse?: string;
  t_warehouse?: string;
  submit?: boolean;
  items: Array<{ item_code: string; qty: number; uom?: string }>;
}): Promise<{ name: string; docstatus: number; status?: string }> {
  return apiRequest(`/api/method/${API}.create_material_request`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function listPendingMaterialRequests(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PendingMaterialRequestRow[]> {
  return apiRequest(`/api/method/${API}.get_pending_material_requests`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function fetchMaterialRequestDetail(name: string): Promise<MaterialRequestDetail> {
  return apiRequest(`/api/method/${API}.get_material_request_detail`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fulfillMaterialRequestStockEntry(
  name: string,
  submit = true
): Promise<FulfillmentResult> {
  return apiRequest(`/api/method/${API}.create_stock_entry_from_material_request`, {
    method: 'POST',
    body: JSON.stringify({ name, submit: submit ? 1 : 0 }),
  });
}

export async function fulfillMaterialRequestPurchaseReceipt(
  name: string,
  options?: { supplier?: string; submit?: boolean }
): Promise<FulfillmentResult> {
  return apiRequest(`/api/method/${API}.create_purchase_receipt_from_material_request`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      supplier: options?.supplier || null,
      submit: options?.submit === false ? 0 : 1,
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
  currency?: string;
  price_list?: string;
  buying_price_list?: string;
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

export async function fetchItemPriceListRate(
  itemCode: string,
  priceList: string
): Promise<number> {
  const result = await apiRequest<{ rate?: number }>(
    `/api/method/${API}.get_item_price_list_rate_api`,
    {
      method: 'POST',
      body: JSON.stringify({ item_code: itemCode, price_list: priceList }),
    }
  );
  return Number(result?.rate || 0);
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
  valuation_rate?: number;
  standard_rate?: number;
  selling_price?: number;
  item_group?: string;
  stock_uom?: string;
  bin_location?: string;
}): Promise<StockItemCreateResult> {
  return apiRequest(`/api/method/${API}.create_stock_item`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}
