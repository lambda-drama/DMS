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
const CUSTOMERS = 'dms.crm_api.customers';

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

export interface Customer360Data {
  customer: {
    name: string;
    customer_name: string;
    customer_type?: string;
    customer_group?: string;
    territory?: string;
    mobile_no?: string;
    email_id?: string;
    disabled?: number;
    creation?: string;
    modified?: string;
    owner?: string;
    modified_by?: string;
    customer_primary_address?: string;
    primary_address?: string;
    website?: string;
    tax_id?: string;
    language?: string;
    industry?: string;
    market_segment?: string;
    [key: string]: unknown;
  };
  summary: {
    vehicles: number;
    vehicles_history?: number;
    contacts: number;
    organizations?: number;
    leads_total: number;
    leads_open: number;
    opportunities_total: number;
    opportunities_open: number;
    activities_total: number;
    activities_open: number;
    cases_total: number;
    cases_open: number;
    appointments: number;
    job_cards?: number;
    follow_ups?: number;
    deliveries?: number;
    campaigns?: number;
    pipeline_value: number;
    outstanding?: number;
    lifetime_value?: number;
    loyalty_tier?: string;
    retention_status?: string;
    next_service_due_date?: string | null;
  };
  contacts: Record<string, unknown>[];
  organizations: Record<string, unknown>[];
  vehicles: Record<string, unknown>[];
  vehicle_history: Record<string, unknown>[];
  leads: Record<string, unknown>[];
  opportunities: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  cases: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
  job_cards: Record<string, unknown>[];
  estimates: Record<string, unknown>[];
  follow_ups: Record<string, unknown>[];
  deliveries: Record<string, unknown>[];
  communications: Record<string, unknown>[];
  campaigns: Record<string, unknown>[];
  finance: {
    invoices: Record<string, unknown>[];
    payments: Record<string, unknown>[];
    outstanding: number;
    invoiced_total: number;
    paid_total: number;
    overdue_count: number;
    credit_limit: number;
    payment_terms?: string | null;
  };
  loyalty: {
    lifetime_value: number;
    sales_revenue: number;
    aftersales_revenue: number;
    loyalty_tier: string;
    points: number;
    referrals: Record<string, unknown>[];
    referral_count: number;
    won_deals: number;
    service_visits: number;
    avg_nps?: number | null;
    repurchase_potential: string;
    source?: string;
  };
  retention: {
    status: string;
    next_service_due_date?: string | null;
    open_follow_ups: number;
    job_cards: number;
  };
  audit: Record<string, unknown>[];
  phases?: Record<string, boolean>;
}

export async function fetchCustomer360(customer: string): Promise<Customer360Data> {
  return apiRequest(`/api/method/${CUSTOMERS}.get_customer_360`, {
    method: 'POST',
    body: JSON.stringify({ customer }),
  });
}

export async function findCustomerDuplicates(customer: string): Promise<{
  customer: string;
  duplicates: Record<string, unknown>[];
  count: number;
}> {
  return apiRequest(`/api/method/${CUSTOMERS}.find_customer_duplicates`, {
    method: 'POST',
    body: JSON.stringify({ customer }),
  });
}

export async function fetchCustomerCreateOptions(): Promise<{
  customer_groups: string[];
  territories: string[];
  customer_types: string[];
  default_customer_group?: string | null;
}> {
  return apiRequest(`/api/method/${CUSTOMERS}.get_customer_create_options`);
}

export async function createCustomer(
  data: Record<string, unknown>,
  force = false
): Promise<{
  ok?: boolean;
  name?: string;
  customer_name?: string;
  customer_group?: string;
  error?: string;
  message?: string;
  duplicates?: Record<string, unknown>[];
}> {
  return apiRequest(`/api/method/${CUSTOMERS}.create_customer`, {
    method: 'POST',
    body: JSON.stringify({ data, force: force ? 1 : 0 }),
  });
}
