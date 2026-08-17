import { apiRequest } from './apiClient';

const API = 'dms.api.user_permissions';

export type UserPermissionRow = {
  name: string;
  user: string;
  full_name?: string;
  access_limited_to?: string;
  can_edit_price?: number;
  can_view_dms_dashboard?: number;
  can_view_dms_report?: number;
  lead_sales_person?: number;
  view_executive_report?: number;
  view_workshop?: number;
  view_service_advisor_report?: number;
  view_technician_report?: number;
  view_parts_and_inventory?: number;
  view_warranty?: number;
  view_quality_control?: number;
  view_customer_and_crm?: number;
  view_finance?: number;
  view_compliance?: number;
};

export async function getUserPermissionSettings(): Promise<{
  permission_rows: UserPermissionRow[];
  whitelisted_users: { user: string; full_name?: string }[];
}> {
  return apiRequest(`/api/method/${API}.get_user_permission_settings`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function saveUserPermission(data: Record<string, unknown>): Promise<{ ok: boolean; name: string; user: string }> {
  return apiRequest(`/api/method/${API}.save_user_permission`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function deleteUserPermission(name: string): Promise<{ ok: boolean }> {
  return apiRequest(`/api/method/${API}.delete_user_permission`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}