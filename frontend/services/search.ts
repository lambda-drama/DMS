/**
 * Global search — cross-doctype lookup for the DMS header (ERPNext-style).
 */
import { apiRequest } from './apiClient';

const API = 'dms.api.search';

export interface GlobalSearchResultItem {
  name: string;
  title: string;
  subtitle: string;
  doctype: string;
  view: string;
  params: Record<string, string>;
}

export interface GlobalSearchGroup {
  label: string;
  items: GlobalSearchResultItem[];
}

export interface GlobalSearchResponse {
  query: string;
  groups: GlobalSearchGroup[];
}

export async function globalSearch(
  query: string,
  limit = 6,
): Promise<GlobalSearchResponse> {
  return apiRequest<GlobalSearchResponse>(`/api/method/${API}.global_search`, {
    method: 'POST',
    body: JSON.stringify({ query, limit }),
  });
}
