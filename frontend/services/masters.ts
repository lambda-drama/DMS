/**
 * Masters service — spare parts, vehicle service items, item prices.
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.masters';

export type SparePartMaster = {
  name: string;
  spare_part_item?: string;
  item_code?: string;
  item_name?: string;
  oem_part_number?: string;
  manufacturer_part_number?: string;
  part_category?: string;
  part_type?: string;
  bin_location?: string;
  selling_price?: number;
  wholesale_price?: number;
  markup_percentage?: number;
  minimum_stock_level?: number;
  reorder_quantity?: number;
  discontinued?: number;
  barcode?: string;
  internal_notes?: string;
  item?: {
    name?: string;
    item_code?: string;
    item_name?: string;
    item_group?: string;
    stock_uom?: string;
    description?: string;
    standard_rate?: number;
    valuation_rate?: number;
    disabled?: number;
  } | null;
  item_price?: {
    name?: string;
    price_list?: string;
    price_list_rate?: number;
    uom?: string;
    currency?: string;
    valid_from?: string;
    valid_upto?: string;
  } | null;
  default_price_list?: string | null;
};

export type VehicleServiceItemMaster = {
  name: string;
  service_item?: string;
  custom_erpnext_item?: string;
  custom_item_name?: string;
  custom_service_code?: string;
  custom_vehicle_model?: string;
  custom_category?: string;
  custom_frt?: string;
  custom_cat_code?: string;
  custom_sub_code?: string;
  custom_estimated_timehours?: number | string;
  custom_rate?: number;
  custom_description?: string;
  disabled?: number;
  item_price?: {
    name?: string;
    price_list?: string;
    price_list_rate?: number;
    uom?: string;
    currency?: string;
  } | null;
};

export type ItemPriceMaster = {
  name: string;
  item_code?: string;
  item_name?: string;
  price_list?: string;
  price_list_rate?: number;
  currency?: string;
  uom?: string;
  selling?: number;
  buying?: number;
  valid_from?: string;
  valid_upto?: string;
};

export type Paginated<T> = {
  data: T[];
  total: number;
  default_price_list?: string | null;
};

export async function listSpareParts(options?: {
  search?: string;
  include_discontinued?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Paginated<SparePartMaster>> {
  return apiRequest(`/api/method/${API}.list_spare_parts`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      include_discontinued: options?.include_discontinued ? 1 : 0,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getSparePart(name: string): Promise<SparePartMaster> {
  return apiRequest(`/api/method/${API}.get_spare_part`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateSparePart(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; item_code?: string; item_name?: string; selling_price?: number }> {
  return apiRequest(`/api/method/${API}.update_spare_part`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function listVehicleServiceItems(options?: {
  search?: string;
  vehicle_model?: string;
  limit?: number;
  offset?: number;
}): Promise<Paginated<VehicleServiceItemMaster>> {
  return apiRequest(`/api/method/${API}.list_vehicle_service_items`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      vehicle_model: options?.vehicle_model || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getVehicleServiceItem(name: string): Promise<VehicleServiceItemMaster> {
  return apiRequest(`/api/method/${API}.get_vehicle_service_item`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateVehicleServiceItem(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; service_item?: string; custom_rate?: number }> {
  return apiRequest(`/api/method/${API}.update_vehicle_service_item`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function listItemPrices(options?: {
  search?: string;
  price_list?: string;
  selling?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Paginated<ItemPriceMaster>> {
  return apiRequest(`/api/method/${API}.list_item_prices`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      price_list: options?.price_list || null,
      selling: options?.selling === false ? 0 : 1,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getItemPrice(name: string): Promise<ItemPriceMaster> {
  return apiRequest(`/api/method/${API}.get_item_price`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateItemPrice(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; item_code?: string; price_list_rate?: number }> {
  return apiRequest(`/api/method/${API}.update_item_price`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function createItemPrice(
  data: Record<string, unknown>
): Promise<{ name: string; item_code?: string; price_list_rate?: number }> {
  return apiRequest(`/api/method/${API}.create_item_price`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export type JobCardTermsMaster = {
  name: string;
  title: string;
  default?: number | boolean;
  terms_and_conditions?: string;
};

export async function listJobCardTerms(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Paginated<JobCardTermsMaster>> {
  return apiRequest(`/api/method/${API}.list_job_card_terms`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 100,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function createJobCardTerms(
  data: Record<string, unknown>
): Promise<{ name: string; title: string }> {
  return apiRequest(`/api/method/${API}.create_job_card_terms`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateJobCardTerms(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; title: string }> {
  return apiRequest(`/api/method/${API}.update_job_card_terms`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function deleteJobCardTerms(name: string): Promise<{ name: string }> {
  return apiRequest(`/api/method/${API}.delete_job_card_terms`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export type SalesInvoiceTcMaster = {
  name: string;
  title: string;
  default?: number | boolean;
  terms_and_conditions?: string;
};

export async function listSalesInvoiceTc(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Paginated<SalesInvoiceTcMaster>> {
  return apiRequest(`/api/method/${API}.list_sales_invoice_tc`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 100,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function createSalesInvoiceTc(
  data: Record<string, unknown>
): Promise<{ name: string; title: string }> {
  return apiRequest(`/api/method/${API}.create_sales_invoice_tc`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateSalesInvoiceTc(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; title: string }> {
  return apiRequest(`/api/method/${API}.update_sales_invoice_tc`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function deleteSalesInvoiceTc(name: string): Promise<{ name: string }> {
  return apiRequest(`/api/method/${API}.delete_sales_invoice_tc`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function getMastersOptions(): Promise<{
  price_lists: { name: string; currency?: string }[];
  default_price_list?: string | null;
  item_groups: string[];
}> {
  return apiRequest(`/api/method/${API}.get_masters_options`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
