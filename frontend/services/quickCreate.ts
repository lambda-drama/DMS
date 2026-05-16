/**
 * Whitelisted quick-create in dms.api.quick_create (Customer, Color, Service Advisor, etc.)
 */
import { apiRequest } from './apiClient';

export type QuickCreateDocType =
  | 'Customer'
  | 'Color'
  | 'Service Advisor'
  | 'Vehicle Service Type'
  | 'Technician';

function parseQuickCreateMessage(raw: unknown): { name: string; label?: string } {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Unexpected response from server');
  }
  const o = raw as Record<string, unknown>;
  const name = o.name;
  if (typeof name !== 'string' || !name.trim()) {
    throw new Error('Unexpected response from server');
  }
  const label = o.label;
  return {
    name: name.trim(),
    label: typeof label === 'string' && label.trim() ? label.trim() : undefined,
  };
}

export async function quickCreateDoc(
  doctype: QuickCreateDocType,
  values: Record<string, unknown>
): Promise<{ name: string; label?: string }> {
  const raw = await apiRequest<unknown>('/api/method/dms.api.quick_create.quick_create_doc', {
    method: 'POST',
    body: JSON.stringify({ doctype, values }),
  });
  return parseQuickCreateMessage(raw);
}
