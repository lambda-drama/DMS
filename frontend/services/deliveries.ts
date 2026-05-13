import { apiRequest } from './apiClient';
import type { VehicleDelivery, Delivery } from '@/types/dms';

const DT = 'Vehicle Delivery Note';

export async function listDeliveries(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<Delivery[]> {
  const params = new URLSearchParams();
  const filters: Record<string, unknown> = {};
  if (options?.status) filters.status = options.status;
  if (options?.search) filters.customer_name = ['like', `%${options.search}%`];
  if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
  params.set('order_by', 'creation desc');
  params.set('limit_page_length', String(options?.limit || 50));

  return apiRequest<Delivery[]>(`/api/resource/${DT}?${params}`);
}

export async function getDelivery(name: string): Promise<VehicleDelivery> {
  return apiRequest<VehicleDelivery>(`/api/resource/${DT}/${encodeURIComponent(name)}`);
}

export async function createDelivery(data: Partial<VehicleDelivery>): Promise<VehicleDelivery> {
  return apiRequest<VehicleDelivery>(`/api/resource/${DT}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function createDeliveryUI(data: Partial<Delivery>): Promise<Delivery> {
  return apiRequest<Delivery>(`/api/resource/${DT}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDelivery(
  name: string,
  data: Partial<VehicleDelivery>
): Promise<VehicleDelivery> {
  return apiRequest<VehicleDelivery>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function submitDelivery(name: string): Promise<VehicleDelivery> {
  return apiRequest<VehicleDelivery>(`/api/resource/${DT}/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify({ docstatus: 1 }),
  });
}
