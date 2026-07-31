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

export async function getLead(name: string) {
  return apiRequest(`/api/method/${LEADS}.get_lead`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateLead(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${LEADS}.update_lead`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function addLeadNote(name: string, content: string) {
  return apiRequest(`/api/method/${LEADS}.add_lead_note`, {
    method: 'POST',
    body: JSON.stringify({ name, content }),
  });
}

export async function convertLeadToOpportunity(name: string, data?: Record<string, unknown>) {
  return apiRequest(`/api/method/${LEADS}.convert_lead_to_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ name, data: data || {} }),
  });
}

export async function acceptLead(name: string) {
  return apiRequest(`/api/method/${LEADS}.accept_lead`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export interface LeadFormOptions {
  sources: string[];
  priorities: string[];
  statuses: string[];
  customer_types: string[];
  teams: string[];
  finance_methods: string[];
  timeframes: string[];
  contact_methods: string[];
  urgencies: string[];
  new_or_used: string[];
  branches: string[];
  countries: string[];
  companies: string[];
  default_company?: string | null;
  currency?: string | null;
  currency_symbol?: string | null;
  users: Array<{ value: string; label: string }>;
}

export async function fetchLeadFormOptions(): Promise<LeadFormOptions> {
  return apiRequest(`/api/method/${LEADS}.get_lead_form_options`);
}

export async function fetchCrmBranches(company?: string): Promise<Array<{ name: string; branch?: string }>> {
  return apiRequest('/api/method/dms.crm_api.common.get_branches', {
    method: 'POST',
    body: JSON.stringify({ company: company || null, limit: 500 }),
  });
}

export async function fetchCrmBrands(search?: string) {
  return apiRequest<Array<{ name: string; label?: string }>>('/api/method/dms.crm_api.common.get_brands', {
    method: 'POST',
    body: JSON.stringify({ search: search || null, limit: 40 }),
  });
}

export async function fetchCrmVehicleModels(search?: string, brand?: string) {
  return apiRequest<
    Array<{
      name: string;
      model_name?: string;
      model_code?: string;
      brand?: string;
      variant?: string;
      brand_label?: string;
    }>
  >('/api/method/dms.crm_api.common.get_vehicle_models', {
    method: 'POST',
    body: JSON.stringify({
      search: search || null,
      brand: brand || null,
      limit: 30,
    }),
  });
}

export async function fetchCrmColors(search?: string) {
  return apiRequest<Array<{ name: string; label?: string }>>('/api/method/dms.crm_api.common.get_colors', {
    method: 'POST',
    body: JSON.stringify({ search: search || null, limit: 40 }),
  });
}

export async function fetchCrmCompanyCurrency(company?: string) {
  return apiRequest<{ company?: string | null; currency?: string | null; symbol?: string | null }>(
    '/api/method/dms.crm_api.common.get_company_currency',
    {
      method: 'POST',
      body: JSON.stringify({ company: company || null }),
    },
  );
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

export async function getOpportunity(name: string) {
  return apiRequest(`/api/method/${OPP}.get_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createOpportunity(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${OPP}.create_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateOpportunity(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${OPP}.update_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function createQuotationFromOpportunity(name: string, markWon = false) {
  return apiRequest<{
    quotation: string;
    opportunity?: Record<string, unknown>;
    already_exists?: boolean;
  }>(`/api/method/${OPP}.create_quotation_from_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ name, mark_won: markWon ? 1 : 0 }),
  });
}

export async function updateQuotationTracking(
  name: string,
  status: 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired',
  rejectionReason = ''
) {
  return apiRequest(`/api/method/${OPP}.update_quotation_tracking`, {
    method: 'POST',
    body: JSON.stringify({ name, status, rejection_reason: rejectionReason }),
  });
}

export async function reissueQuotation(name: string, validTill?: string) {
  return apiRequest(`/api/method/${OPP}.reissue_quotation`, {
    method: 'POST',
    body: JSON.stringify({ name, valid_till: validTill || null }),
  });
}

export async function createSalesAppointment(
  name: string,
  data: Record<string, unknown>
) {
  return apiRequest(`/api/method/${OPP}.create_sales_appointment`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function updateSalesAppointment(
  name: string,
  data: Record<string, unknown>
) {
  return apiRequest(`/api/method/${OPP}.update_sales_appointment`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function createSalesOrderFromOpportunity(
  name: string,
  bookingData: Record<string, unknown> = {}
) {
  return apiRequest(`/api/method/${OPP}.create_sales_order_from_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ name, booking_data: bookingData }),
  });
}

export async function createSalesInvoiceFromOpportunity(name: string) {
  return apiRequest(`/api/method/${OPP}.create_sales_invoice_from_opportunity`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function markOpportunityWon(name: string) {
  return apiRequest(`/api/method/${OPP}.mark_opportunity_won`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

const ALLOCATION = 'dms.crm_api.allocation';

export async function searchAllocatableVins(options?: {
  search?: string;
  company?: string;
  model?: string;
  preferred_color?: string;
}) {
  return apiRequest(`/api/method/${ALLOCATION}.search_allocatable_vins`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      company: options?.company || null,
      model: options?.model || null,
      preferred_color: options?.preferred_color || null,
      limit: 50,
    }),
  });
}

export async function getAllocationSnapshot(booking: string) {
  return apiRequest(`/api/method/${ALLOCATION}.get_allocation_snapshot`, {
    method: 'POST',
    body: JSON.stringify({ booking }),
  });
}

export async function allocateVin(
  booking: string,
  data: { vehicle_vin?: string; factory_order_reference?: string; notes?: string }
) {
  return apiRequest(`/api/method/${ALLOCATION}.allocate_vin`, {
    method: 'POST',
    body: JSON.stringify({ booking, ...data }),
  });
}

export async function requestAllocationSwitch(
  booking: string,
  reason: string,
  newVin?: string
) {
  return apiRequest(`/api/method/${ALLOCATION}.request_allocation_switch`, {
    method: 'POST',
    body: JSON.stringify({ booking, reason, new_vin: newVin || null }),
  });
}

export async function approveAllocationSwitch(
  booking: string,
  approve = true,
  newVin?: string,
  notes?: string
) {
  return apiRequest(`/api/method/${ALLOCATION}.approve_allocation_switch`, {
    method: 'POST',
    body: JSON.stringify({
      booking,
      approve: approve ? 1 : 0,
      new_vin: newVin || null,
      notes: notes || null,
    }),
  });
}

export async function releaseVin(booking: string, reason?: string) {
  return apiRequest(`/api/method/${ALLOCATION}.release_vin`, {
    method: 'POST',
    body: JSON.stringify({ booking, reason: reason || null }),
  });
}

const DELIVERY = 'dms.crm_api.delivery_readiness';

export async function listDeliveryReadiness(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${DELIVERY}.get_delivery_readiness_list`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getDeliveryReadiness(name: string) {
  return apiRequest(`/api/method/${DELIVERY}.get_delivery_readiness`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createDeliveryReadiness(opportunity: string) {
  return apiRequest(`/api/method/${DELIVERY}.create_delivery_readiness`, {
    method: 'POST',
    body: JSON.stringify({ opportunity }),
  });
}

export async function updateDeliveryReadiness(
  name: string,
  data: Record<string, unknown>
) {
  return apiRequest(`/api/method/${DELIVERY}.update_delivery_readiness`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function markDeliveryReady(name: string) {
  return apiRequest(`/api/method/${DELIVERY}.mark_delivery_ready`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

const TEST_DRIVES = 'dms.crm_api.test_drives';

export async function fetchTestVehicleOptions(search = '', company?: string) {
  return apiRequest(`/api/method/${TEST_DRIVES}.get_test_vehicle_options`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, company: company || null, limit: 50 }),
  });
}

export async function listTestDrives(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${TEST_DRIVES}.get_test_drives`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getTestDrive(name: string) {
  return apiRequest(`/api/method/${TEST_DRIVES}.get_test_drive`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createTestDrive(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${TEST_DRIVES}.create_test_drive`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateTestDrive(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${TEST_DRIVES}.update_test_drive`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export interface OpportunityFormOptions {
  stages: string[];
  statuses: string[];
  opportunity_types: string[];
  companies: string[];
  default_company?: string | null;
  branches: string[];
  currency?: string | null;
  currency_symbol?: string | null;
  users: Array<{ value: string; label: string }>;
}

export async function fetchOpportunityFormOptions(): Promise<OpportunityFormOptions> {
  return apiRequest(`/api/method/${OPP}.get_opportunity_form_options`);
}

export async function fetchCrmItems(search?: string) {
  return apiRequest<
    Array<{
      name: string;
      item_code?: string;
      item_name?: string;
      uom?: string;
      brand?: string;
      description?: string;
      rate?: number;
      label?: string;
    }>
  >('/api/method/dms.crm_api.common.get_items', {
    method: 'POST',
    body: JSON.stringify({ search: search || null, limit: 30 }),
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

const CALL_LOGS = 'dms.crm_api.call_logs';

export type CallLogRow = {
  name: string;
  id?: string;
  from?: string;
  to?: string;
  type?: string;
  status?: string;
  status_label?: string;
  status_color?: string;
  duration?: number;
  _duration?: string;
  telephony_medium?: string;
  start_time?: string;
  end_time?: string;
  caller?: string;
  receiver?: string;
  caller_name?: string;
  receiver_name?: string;
  recording_url?: string;
  recording_url_path?: string;
  note?: string;
  reference_doctype?: string;
  reference_docname?: string;
  creation?: string;
  _caller?: { label?: string; image?: string };
  _receiver?: { label?: string; image?: string };
  _lead?: string;
  _deal?: string;
  _notes?: Array<Record<string, unknown>>;
  _tasks?: Array<Record<string, unknown>>;
};

export async function listCallLogs(options?: {
  status?: string;
  type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${CALL_LOGS}.get_call_logs`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      type: options?.type || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getCallLog(name: string): Promise<CallLogRow> {
  return apiRequest(`/api/method/${CALL_LOGS}.get_call_log`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createCallLog(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CALL_LOGS}.create_call_log`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateCallLog(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CALL_LOGS}.update_call_log`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function createLeadFromCallLog(
  callLog: string | Record<string, unknown>,
  leadDetails?: Record<string, unknown>
) {
  return apiRequest(`/api/method/${CALL_LOGS}.create_lead_from_call_log`, {
    method: 'POST',
    body: JSON.stringify({ call_log: callLog, lead_details: leadDetails || {} }),
  });
}

export async function addNoteToCallLog(
  callLog: string,
  note: { name?: string; title?: string; content?: string }
) {
  return apiRequest(`/api/method/${CALL_LOGS}.add_note_to_call_log`, {
    method: 'POST',
    body: JSON.stringify({ call_log: callLog, note }),
  });
}

export async function addTaskToCallLog(
  callLog: string,
  task: Record<string, unknown>
) {
  return apiRequest(`/api/method/${CALL_LOGS}.add_task_to_call_log`, {
    method: 'POST',
    body: JSON.stringify({ call_log: callLog, task }),
  });
}

export async function fetchCallLogFormOptions(): Promise<{
  statuses: string[];
  types: string[];
  telephony_mediums: string[];
  users: Array<{ value: string; label: string }>;
  reference_doctypes: string[];
}> {
  return apiRequest(`/api/method/${CALL_LOGS}.get_call_log_form_options`);
}
