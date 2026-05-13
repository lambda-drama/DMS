/**
 * Invoices service — calls whitelisted methods in dms.api.invoices
 */
import { apiRequest } from './apiClient';
import type { SalesInvoiceListItem } from '@/types/dms';

const API = 'dms.api.invoices';

export async function listInvoices(options?: {
  status?: string;
  search?: string;
  limit?: number;
}): Promise<SalesInvoiceListItem[]> {
  return apiRequest<SalesInvoiceListItem[]>(`/api/method/${API}.get_invoices`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit || 50,
    }),
  });
}
