import { apiRequest } from './apiClient';

const API = 'dms.api.advanced_permissions';

export type AdvancedDoctype = {
  name: string;
  module: string;
  is_submittable: number;
};

export type PermRow = {
  parent: string;
  role: string;
  permlevel: number;
  if_owner?: number;
  is_submittable?: number;
  select?: number;
  read?: number;
  write?: number;
  create?: number;
  delete?: number;
  submit?: number;
  cancel?: number;
  amend?: number;
  print?: number;
  email?: number;
  report?: number;
  import?: number;
  export?: number;
  share?: number;
};

export type AdvancedBootstrap = {
  can_manage: boolean;
  selected_roles?: string[];
  selected_role_profiles?: string[];
  all_roles?: string[];
  all_role_profiles?: string[];
  doctypes?: AdvancedDoctype[];
  whitelisted_users?: { user: string; full_name?: string }[];
  rights?: string[];
};

export type UserRolesPayload = {
  user: string;
  full_name?: string;
  roles: string[];
  role_profiles: string[];
};

export async function getAdvancedPermissionBootstrap(): Promise<AdvancedBootstrap> {
  return apiRequest(`/api/method/${API}.get_advanced_permission_bootstrap`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function saveDisplayRoles(data: {
  roles: string[];
  role_profiles: string[];
}): Promise<{ ok: boolean; selected_roles: string[]; selected_role_profiles: string[] }> {
  return apiRequest(`/api/method/${API}.save_display_roles`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function createRole(role_name: string, desk_access = 1): Promise<{
  ok: boolean;
  name: string;
  selected_roles: string[];
  selected_role_profiles: string[];
}> {
  return apiRequest(`/api/method/${API}.create_role`, {
    method: 'POST',
    body: JSON.stringify({ role_name, desk_access }),
  });
}

export async function createRoleProfile(data: {
  role_profile: string;
  roles?: string[];
}): Promise<{
  ok: boolean;
  name: string;
  selected_roles: string[];
  selected_role_profiles: string[];
}> {
  return apiRequest(`/api/method/${API}.create_role_profile`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function getRoleProfile(name: string): Promise<{ name: string; roles: string[] }> {
  return apiRequest(`/api/method/${API}.get_role_profile`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function removeRoleFromProfile(
  role_profile: string,
  role: string
): Promise<{ name: string; roles: string[] }> {
  return apiRequest(`/api/method/${API}.remove_role_from_profile`, {
    method: 'POST',
    body: JSON.stringify({ role_profile, role }),
  });
}

export async function addRoleToProfile(
  role_profile: string,
  role: string
): Promise<{ name: string; roles: string[] }> {
  return apiRequest(`/api/method/${API}.add_role_to_profile`, {
    method: 'POST',
    body: JSON.stringify({ role_profile, role }),
  });
}

export async function getRolePermissions(doctype?: string, role?: string): Promise<PermRow[]> {
  return apiRequest(`/api/method/${API}.get_role_permissions`, {
    method: 'POST',
    body: JSON.stringify({ doctype: doctype || '', role: role || '' }),
  });
}

export async function addRolePermission(doctype: string, role: string, permlevel = 0) {
  return apiRequest(`/api/method/${API}.add_role_permission`, {
    method: 'POST',
    body: JSON.stringify({ doctype, role, permlevel }),
  });
}

export async function updateRolePermission(args: {
  doctype: string;
  role: string;
  permlevel: number;
  ptype: string;
  value: number;
  if_owner?: number;
}) {
  return apiRequest(`/api/method/${API}.update_role_permission`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

export async function removeRolePermission(
  doctype: string,
  role: string,
  permlevel: number,
  if_owner = 0
) {
  return apiRequest(`/api/method/${API}.remove_role_permission`, {
    method: 'POST',
    body: JSON.stringify({ doctype, role, permlevel, if_owner }),
  });
}

export async function resetRolePermissions(doctype: string) {
  return apiRequest(`/api/method/${API}.reset_role_permissions`, {
    method: 'POST',
    body: JSON.stringify({ doctype }),
  });
}

export async function getUserRoles(user: string): Promise<UserRolesPayload> {
  return apiRequest(`/api/method/${API}.get_user_roles`, {
    method: 'POST',
    body: JSON.stringify({ user }),
  });
}

export async function saveUserRoles(data: {
  user: string;
  roles: string[];
  role_profiles: string[];
}): Promise<UserRolesPayload> {
  return apiRequest(`/api/method/${API}.save_user_roles`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}
