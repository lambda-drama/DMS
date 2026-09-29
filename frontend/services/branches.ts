import { apiRequest } from './apiClient';

const API = 'dms.api.branches';

export type BranchMaster = {
  name: string;
  branch: string;
  company?: string | null;
  company_name?: string | null;
};

export async function listBranches(args?: {
  search?: string;
  company?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: BranchMaster[]; total: number }> {
  return apiRequest(`/api/method/${API}.list_branches`, {
    method: 'POST',
    body: JSON.stringify({
      search: args?.search || null,
      company: args?.company || null,
      limit: args?.limit ?? 100,
      offset: args?.offset ?? 0,
    }),
  });
}

export async function createBranch(data: {
  branch: string;
  company?: string;
}): Promise<BranchMaster> {
  return apiRequest(`/api/method/${API}.create_branch`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateBranch(
  name: string,
  data: { branch?: string; company?: string | null }
): Promise<BranchMaster> {
  return apiRequest(`/api/method/${API}.update_branch`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function deleteBranch(name: string): Promise<{ ok: boolean; deleted: string }> {
  return apiRequest(`/api/method/${API}.delete_branch`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}
