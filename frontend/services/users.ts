import { apiRequest } from './apiClient';

const API = 'dms.api.users';

export type DmsUserRow = {
  user: string;
  email: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  enabled: number;
  user_type?: string;
  last_login?: string | null;
  creation?: string | null;
  roles: string[];
  role_profiles: string[];
  whitelisted?: boolean;
  protected?: boolean;
  must_change_password?: boolean;
};

export type UsersBootstrap = {
  can_manage: boolean;
  is_admin: boolean;
  users: DmsUserRow[];
  assignable_roles: string[];
  role_profiles: string[];
  user_types: string[];
};

export type DmsUserInput = {
  email: string;
  first_name: string;
  last_name?: string;
  user_type?: string;
  enabled?: number | boolean;
  send_welcome_email?: number | boolean;
  password?: string;
  confirm_password?: string;
  roles?: string[];
  role_profiles?: string[];
};

export type PasswordStatus = {
  user: string | null;
  must_change_password: boolean;
};

export async function getUsersBootstrap(): Promise<UsersBootstrap> {
  return apiRequest(`/api/method/${API}.get_users_bootstrap`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function createUser(data: DmsUserInput): Promise<DmsUserRow> {
  return apiRequest(`/api/method/${API}.create_user`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateUser(data: {
  user: string;
  first_name?: string;
  last_name?: string;
  enabled?: number | boolean;
  user_type?: string;
  roles?: string[];
  role_profiles?: string[];
}): Promise<DmsUserRow> {
  return apiRequest(`/api/method/${API}.update_user`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function setUserPassword(args: {
  user: string;
  new_password: string;
  confirm_password: string;
  logout_all_sessions?: number | boolean;
}): Promise<{ ok: boolean; user: string; must_change_password: boolean }> {
  return apiRequest(`/api/method/${API}.set_user_password`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

export async function changePassword(args: {
  old_password: string;
  new_password: string;
  confirm_password: string;
}): Promise<{ ok: boolean; user: string }> {
  return apiRequest(`/api/method/${API}.change_password`, {
    method: 'POST',
    body: JSON.stringify(args),
  });
}

export async function getPasswordStatus(): Promise<PasswordStatus> {
  return apiRequest(`/api/method/${API}.get_password_status`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
