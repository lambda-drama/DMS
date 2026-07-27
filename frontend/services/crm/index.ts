/**
 * CRM frontend services — call dms.crm_api.* only (never dms.api.*).
 */

import { apiRequest } from '@/services/apiClient';

const DASH = 'dms.crm_api.dashboard';
const LEADS = 'dms.crm_api.leads';
const OPP = 'dms.crm_api.opportunities';
const ACT = 'dms.crm_api.activities';
const CASES = 'dms.crm_api.cases';
const CONTACTS = 'dms.crm_api.contacts';

export interface CrmDashboardData {
  stats: {
    leads_total: number;
    leads_open: number;
    leads_hot: number;
    leads_new_7d: number;
    opportunities_open: number;
    opportunities_won: number;
    pipeline_value: number;
    activities_open: number;
    activities_overdue: number;
    cases_open: number;
    contacts: number;
    customers: number;
    lead_target: number;
    leads_this_month: number;
    lead_target_remaining: number;
  };
  my_leads: Array<{
    name: string;
    lead_name: string;
    status: string;
    source?: string;
    organization_name?: string;
    lead_owner?: string;
    owner_name?: string;
    next_action_due?: string;
  }>;
  stage_pipeline: Array<{ stage: string; count: number }>;
  user: { name: string; full_name: string };
}

export async function fetchCrmDashboard(): Promise<CrmDashboardData> {
  return apiRequest(`/api/method/${DASH}.get_dashboard`);
}

export async function listLeads(options?: {
  status?: string;
  priority?: string;
  source?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${LEADS}.get_leads`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      priority: options?.priority || null,
      source: options?.source || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function createLead(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${LEADS}.create_lead`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function listOpportunities(options?: {
  status?: string;
  stage?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${OPP}.get_opportunities`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      stage: options?.stage || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function createOpportunity(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${OPP}.create_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function listActivities(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${ACT}.get_activities`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function listCases(options?: {
  status?: string;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${CASES}.get_cases`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      priority: options?.priority || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function listContacts(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${CONTACTS}.get_contacts`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function listCustomers(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest<{
    data: Record<string, unknown>[];
    total: number;
    customer_groups?: string[];
    message?: string;
  }>(`/api/method/${CONTACTS}.get_customers`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}
