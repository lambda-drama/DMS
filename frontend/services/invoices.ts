import { apiRequest } from './apiClient';
import type { Invoice } from '@/types/dms';

const DT = 'Sales Invoice';

export async function listInvoices(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<Invoice[]> {
  const params = new URLSearchParams();
  const filters: Record<string, unknown> = {};
  if (options?.status) filters.status = options.status;
  if (options?.search) filters.customer_name = ['like', `%${options.search}%`];
  if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
  params.set('order_by', 'creation desc');
  params.set('limit_page_length', String(options?.limit || 50));

  return apiRequest<Invoice[]>(`/api/resource/${DT}?${params}`);
}

export async function createInvoice(data: Partial<Invoice>): Promise<Invoice> {
  return apiRequest<Invoice>(`/api/resource/${DT}`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
