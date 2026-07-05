/**
 * Inventory dashboard — dms.api.inventory
 */
import { apiRequest } from './apiClient';
import type { DmsWarehouseOption } from './stockOperations';

const API = 'dms.api.inventory';

export interface InventoryDefaults {
  company: string;
  default_warehouse?: string | null;
  warehouses: DmsWarehouseOption[];
  companies: string[];
  item_groups: string[];
  as_on_date: string;
}

export interface StockBalanceRow {
  spare_part: string;
  item_code: string;
  item_name: string;
  item_group?: string;
  stock_uom?: string;
  oem_part_number?: string;
  bin_location?: string;
  minimum_stock_level: number;
  qty: number;
  is_low_stock: boolean;
  warehouse?: string | null;
}

export interface StockBalanceReport {
  rows: StockBalanceRow[];
  summary: {
    item_count: number;
    total_qty: number;
    low_stock_count: number;
    warehouse_count: number;
    as_on_date: string;
  };
}

export interface StockLedgerRow {
  posting_date: string;
  posting_time?: string;
  item_code: string;
  item_name: string;
  warehouse?: string;
  actual_qty: number;
  qty_after_transaction: number;
  voucher_type?: string;
  voucher_no?: string;
  stock_uom?: string;
}

export interface StockLedgerReport {
  rows: StockLedgerRow[];
  summary: {
    from_date: string;
    to_date: string;
    entry_count: number;
  };
}

export interface InventoryInsightsReport {
  low_stock: StockBalanceRow[];
  most_consumed: { item_code: string; item_name: string; consumed_qty: number }[];
  summary: {
    low_stock_count: number;
    from_date: string;
    to_date: string;
  };
}

export async function fetchInventoryDefaults(company?: string): Promise<InventoryDefaults> {
  return apiRequest<InventoryDefaults>(`/api/method/${API}.get_inventory_defaults`, {
    method: 'POST',
    body: JSON.stringify({ company: company || null }),
  });
}

export async function fetchStockBalanceReport(params: {
  company?: string;
  warehouse?: string;
  item_code?: string;
  item_group?: string;
  search?: string;
  as_on_date?: string;
  sort_order?: 'asc' | 'desc';
  limit?: number;
}): Promise<StockBalanceReport> {
  return apiRequest<StockBalanceReport>(`/api/method/${API}.get_stock_balance_report`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function fetchStockLedgerReport(params: {
  company?: string;
  warehouse?: string;
  item_code?: string;
  item_group?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}): Promise<StockLedgerReport> {
  return apiRequest<StockLedgerReport>(`/api/method/${API}.get_stock_ledger_report`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function fetchInventoryInsights(params: {
  company?: string;
  warehouse?: string;
  from_date?: string;
  to_date?: string;
  low_stock_limit?: number;
  consumed_limit?: number;
}): Promise<InventoryInsightsReport> {
  return apiRequest<InventoryInsightsReport>(`/api/method/${API}.get_inventory_insights_report`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}
