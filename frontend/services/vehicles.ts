/**
 * Vehicles (VIN No) service — calls whitelisted methods in dms.api.vehicles
 */
import { apiRequest } from './apiClient';
import type { VINNoListItem, VINNoFull, VehicleItem, PaginatedResponse } from '@/types/dms';

const API = 'dms.api.vehicles';

export async function listVehicles(options?: {
  customer?: string;
  search?: string;
  vehicle_status?: string;
  warranty_status?: string;
  /** Include vehicles of companies outside DMS Settings ("Show other companies"). */
  include_other_companies?: number | boolean;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<VINNoListItem>> {
  return apiRequest<PaginatedResponse<VINNoListItem>>(`/api/method/${API}.get_vehicles`, {
    method: 'POST',
    body: JSON.stringify({
      customer: options?.customer || null,
      search: options?.search || null,
      vehicle_status: options?.vehicle_status || null,
      warranty_status: options?.warranty_status || null,
      include_other_companies: options?.include_other_companies ? 1 : 0,
      limit: options?.limit || 50,
      offset: options?.offset || 0,
    }),
  });
}

export async function getVehicle(name: string): Promise<VINNoFull> {
  return apiRequest<VINNoFull>(`/api/method/${API}.get_vehicle`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createVehicle(data: Partial<VINNoFull>): Promise<{
  name: string;
  vin_number: string;
  model_name: string;
  vehicle_status: string;
}> {
  return apiRequest(`/api/method/${API}.create_vehicle`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateVehicle(
  name: string,
  data: Record<string, unknown>
): Promise<{ name: string; vehicle_status: string }> {
  return apiRequest(`/api/method/${API}.update_vehicle`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

/** Delete a VIN No. Requires delete permission; linked documents block the call. */
export async function deleteVehicle(name: string): Promise<{ name: string; vin_number?: string }> {
  return apiRequest(`/api/method/${API}.delete_vehicle`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function getVehicleItems(search?: string): Promise<VehicleItem[]> {
  return apiRequest<VehicleItem[]>(`/api/method/${API}.get_vehicle_items`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

/** Item Groups flagged as vehicles — the only groups a vehicle Item may be created in. */
export async function fetchVehicleItemGroups(): Promise<string[]> {
  return apiRequest<string[]>(`/api/method/${API}.get_vehicle_item_groups`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
