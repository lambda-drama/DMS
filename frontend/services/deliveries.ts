/**
 * Vehicle Delivery service — calls whitelisted methods in dms.api.deliveries
 */
import { apiRequest } from './apiClient';
import type { VehicleDelivery, Delivery } from '@/types/dms';

const API = 'dms.api.deliveries';

export async function listDeliveries(options?: {
  search?: string;
  limit?: number;
}): Promise<Delivery[]> {
  return apiRequest<Delivery[]>(`/api/method/${API}.get_deliveries`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit || 50,
    }),
  });
}

export async function getDelivery(name: string): Promise<VehicleDelivery> {
  return apiRequest<VehicleDelivery>(`/api/method/${API}.get_delivery`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createDelivery(data: Partial<VehicleDelivery>): Promise<{ name: string; job_card: string; customer: string; customer_name: string; status: string }> {
  return apiRequest(`/api/method/${API}.create_delivery`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function createDeliveryUI(data: Partial<Delivery>): Promise<{ name: string; job_card: string; customer: string; customer_name: string; status: string }> {
  return apiRequest(`/api/method/${API}.create_delivery`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateDelivery(
  name: string,
  data: Partial<VehicleDelivery>
): Promise<{ name: string; status: string }> {
  return apiRequest(`/api/method/${API}.update_delivery`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function submitDelivery(name: string): Promise<{ name: string; docstatus: number }> {
  return apiRequest(`/api/method/${API}.submit_delivery`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export interface DeliveryChecklistTemplateOption {
  name: string;
  template_name: string;
  is_default?: number | boolean;
  description?: string;
  version?: string;
}

export async function fetchDeliveryChecklistTemplates(): Promise<DeliveryChecklistTemplateOption[]> {
  return apiRequest(`/api/method/${API}.get_delivery_checklist_templates`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchDeliveryChecklistTemplateItems(template?: string): Promise<{
  template: string | null;
  template_name?: string | null;
  items: string[];
}> {
  return apiRequest(`/api/method/${API}.get_delivery_checklist_template_items`, {
    method: 'POST',
    body: JSON.stringify({ template: template || null }),
  });
}
