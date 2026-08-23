/**
 * CRM frontend services — call dms.crm_api.* only (never dms.api.*).
 */

import { apiRequest } from '@/services/apiClient';

const DASH = 'dms.crm_api.dashboard';
const LEADS = 'dms.crm_api.leads';
const OPP = 'dms.crm_api.opportunities';
const ACT = 'dms.crm_api.activities';
const CASES = 'dms.crm_api.cases';
const CAMPAIGNS = 'dms.crm_api.campaigns';
const CONTACTS = 'dms.crm_api.contacts';
const CUSTOMERS = 'dms.crm_api.customers';
const VEHICLES = 'dms.crm_api.vehicles';
const SALES_APT = 'dms.crm_api.sales_appointments';

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
    appendix_b?: Record<string, number>;
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

export async function disqualifyLead(name: string, lostReason: string) {
  return apiRequest(`/api/method/${LEADS}.disqualify_lead`, {
    method: 'POST',
    body: JSON.stringify({ name, lost_reason: lostReason }),
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

export async function fetchCrmTerritories(search?: string, isGroup: 0 | 1 | 'all' = 0) {
  return apiRequest<Array<{ name: string; label?: string; parent_territory?: string }>>(
    '/api/method/dms.crm_api.common.get_territories',
    {
      method: 'POST',
      body: JSON.stringify({ search: search || null, limit: 50, is_group: isGroup }),
    }
  );
}

export async function quickCreateTerritory(territoryName: string, parentTerritory?: string) {
  return apiRequest<{ name: string; label?: string }>(
    '/api/method/dms.crm_api.common.quick_create_territory',
    {
      method: 'POST',
      body: JSON.stringify({
        territory_name: territoryName,
        parent_territory: parentTerritory || null,
      }),
    }
  );
}

export async function quickCreateBrand(brand: string) {
  return apiRequest<{ name: string; label?: string }>(
    '/api/method/dms.crm_api.common.quick_create_brand',
    {
      method: 'POST',
      body: JSON.stringify({ brand }),
    }
  );
}

export async function quickCreateItem(data: {
  item_code?: string;
  item_name?: string;
  brand?: string;
  standard_rate?: number;
  bin_location?: string;
}) {
  return apiRequest<{ name: string; label?: string }>(
    '/api/method/dms.crm_api.common.quick_create_item',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function quickCreateVehicleModel(data: {
  model_name: string;
  brand?: string;
  model_code?: string;
  fuel_type?: string;
  transmission?: string;
  variant?: string;
}) {
  return apiRequest<{ name: string; label?: string }>(
    '/api/method/dms.crm_api.common.quick_create_vehicle_model',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
}

export async function quickCreateContact(data: {
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  email_id?: string;
  company_name?: string;
}) {
  return apiRequest<{ name: string; label?: string; mobile?: string }>(
    '/api/method/dms.crm_api.contacts.quick_create_contact',
    {
      method: 'POST',
      body: JSON.stringify(data),
    }
  );
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

export async function createQuotationFromOpportunity(
  name: string,
  markWon = false,
  applyTaxes = false
) {
  return apiRequest<{
    quotation: string;
    opportunity?: Record<string, unknown>;
    already_exists?: boolean;
  }>(`/api/method/${OPP}.create_quotation_from_opportunity`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      mark_won: markWon ? 1 : 0,
      apply_taxes: applyTaxes ? 1 : 0,
    }),
  });
}

export async function getQuotationPreview(name: string, applyTaxes = false) {
  return apiRequest<{
    currency?: string;
    source: string;
    vin?: { name: string; vin_number: string; model_name?: string; linked_item: string } | null;
    items: Array<{
      item_code: string;
      item_name?: string;
      qty: number;
      rate: number;
      discount_percentage?: number;
      net_amount: number;
    }>;
    net_total: number;
    total_taxes_and_charges?: number;
    grand_total?: number;
    taxes_and_charges?: string | null;
    dms_taxes_and_charges_template?: string;
    tax_error?: string | null;
    taxes?: Array<{ description?: string; rate?: number; tax_amount?: number }>;
    apply_taxes?: number;
  }>(`/api/method/${OPP}.get_quotation_preview`, {
    method: 'POST',
    body: JSON.stringify({ name, apply_taxes: applyTaxes ? 1 : 0 }),
  });
}

const QUOTATIONS = 'dms.crm_api.quotations';

export async function listQuotations(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest<{
    data: Array<Record<string, unknown>>;
    total: number;
  }>(`/api/method/${QUOTATIONS}.get_quotations`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getQuotation(name: string) {
  return apiRequest<Record<string, unknown>>(`/api/method/${QUOTATIONS}.get_quotation`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function submitQuotation(name: string) {
  return apiRequest<Record<string, unknown>>(`/api/method/${QUOTATIONS}.submit_quotation`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateQuotationItems(name: string, data: Record<string, unknown>) {
  return apiRequest<Record<string, unknown>>(`/api/method/${QUOTATIONS}.update_quotation_items`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
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

export async function listSalesAppointments(options?: {
  status?: string;
  search?: string;
  customer?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${SALES_APT}.get_appointments`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      customer: options?.customer || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getSalesAppointment(name: string) {
  return apiRequest(`/api/method/${SALES_APT}.get_appointment`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fetchSalesAppointmentFormOptions() {
  return apiRequest(`/api/method/${SALES_APT}.get_form_options`, { method: 'POST' });
}

export async function createStandaloneSalesAppointment(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${SALES_APT}.create_appointment`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateStandaloneSalesAppointment(
  name: string,
  data: Record<string, unknown>
) {
  return apiRequest(`/api/method/${SALES_APT}.update_appointment`, {
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

export async function recordExperienceScore(
  opportunity: string,
  score: number,
  notes?: string
) {
  return apiRequest(`/api/method/dms.crm_api.ownership_journey.record_experience_score`, {
    method: 'POST',
    body: JSON.stringify({ opportunity, score, notes: notes || null }),
  });
}

const DELIVERY = 'dms.crm_api.delivery_readiness';

export async function completeHandover(
  name: string,
  data?: {
    satisfaction_score?: number;
    handover_on?: string;
    handover_photos?: string;
    notes?: string;
  }
) {
  return apiRequest(`/api/method/${DELIVERY}.complete_handover`, {
    method: 'POST',
    body: JSON.stringify({ name, ...(data || {}) }),
  });
}

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
  assigned_to?: string;
  activity_type?: string;
  overdue_only?: boolean;
  mine?: boolean;
  campaign?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${ACT}.get_activities`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      assigned_to: options?.assigned_to || null,
      activity_type: options?.activity_type || null,
      overdue_only: options?.overdue_only ? 1 : 0,
      mine: options?.mine ? 1 : 0,
      campaign: options?.campaign || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getActivity(name: string) {
  return apiRequest(`/api/method/${ACT}.get_activity`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createActivity(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${ACT}.create_activity`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateActivity(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${ACT}.update_activity`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function completeActivity(
  name: string,
  disposition?: string,
  outcome_notes?: string
) {
  return apiRequest(`/api/method/${ACT}.complete_activity`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      disposition: disposition || null,
      outcome_notes: outcome_notes || null,
    }),
  });
}

export async function reassignActivity(name: string, assigned_to: string, reason?: string) {
  return apiRequest(`/api/method/${ACT}.reassign_activity`, {
    method: 'POST',
    body: JSON.stringify({ name, assigned_to, reason: reason || null }),
  });
}

export async function fetchActivityFormOptions(): Promise<{
  activity_types: string[];
  statuses: string[];
  priorities: string[];
  dispositions: string[];
  recurrence_frequencies: string[];
}> {
  return apiRequest(`/api/method/${ACT}.get_activity_form_options`);
}

export async function getOverdueBoard(scope: 'mine' | 'team' = 'mine') {
  return apiRequest(`/api/method/${ACT}.get_overdue_board`, {
    method: 'POST',
    body: JSON.stringify({ scope }),
  });
}

const APPROVALS = 'dms.crm_api.approvals';

export async function listApprovals(options?: {
  status?: string;
  approval_type?: string;
  search?: string;
  limit?: number;
}) {
  return apiRequest(`/api/method/${APPROVALS}.get_approvals`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      approval_type: options?.approval_type || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
    }),
  });
}

export async function createApproval(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${APPROVALS}.create_approval`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function decideApproval(
  name: string,
  decision: 'Approved' | 'Rejected',
  decision_notes?: string
) {
  return apiRequest(`/api/method/${APPROVALS}.decide_approval`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      decision,
      decision_notes: decision_notes || null,
    }),
  });
}

export async function fetchApprovalFormOptions(): Promise<{
  approval_types: string[];
  statuses: string[];
  can_approve: boolean;
}> {
  return apiRequest(`/api/method/${APPROVALS}.get_approval_form_options`);
}

const LOYALTY = 'dms.crm_api.loyalty';

export async function getCustomerLoyalty(customer: string) {
  return apiRequest(`/api/method/${LOYALTY}.get_customer_loyalty`, {
    method: 'POST',
    body: JSON.stringify({ customer }),
  });
}

export async function getLoyaltySettings() {
  return apiRequest(`/api/method/${LOYALTY}.get_loyalty_settings`);
}

export async function updateLoyaltySettings(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${LOYALTY}.update_loyalty_settings`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function createLoyaltyAdjustment(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${LOYALTY}.create_loyalty_adjustment`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function decideLoyaltyAdjustment(
  name: string,
  decision: 'Approved' | 'Rejected'
) {
  return apiRequest(`/api/method/${LOYALTY}.decide_loyalty_adjustment`, {
    method: 'POST',
    body: JSON.stringify({ name, decision }),
  });
}

export async function getLoyaltyAdjustments(options?: {
  status?: string;
  customer?: string;
  limit?: number;
}) {
  return apiRequest(`/api/method/${LOYALTY}.get_loyalty_adjustments`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      customer: options?.customer || null,
      limit: options?.limit ?? 50,
    }),
  });
}

export async function getLoyaltySetupStatus() {
  return apiRequest(`/api/method/${LOYALTY}.get_loyalty_setup_status`);
}

export async function setupLoyaltyPrograms(options?: {
  company?: string;
  create_pricing_rules?: number;
}) {
  return apiRequest(`/api/method/${LOYALTY}.setup_loyalty_programs`, {
    method: 'POST',
    body: JSON.stringify({
      company: options?.company || null,
      create_pricing_rules: options?.create_pricing_rules ?? 1,
    }),
  });
}

export async function enrollCustomerInLoyalty(
  customer: string,
  options?: { program?: string; sync_tier?: number }
) {
  return apiRequest(`/api/method/${LOYALTY}.enroll_customer_in_loyalty`, {
    method: 'POST',
    body: JSON.stringify({
      customer,
      program: options?.program || null,
      sync_tier: options?.sync_tier ?? 1,
    }),
  });
}

export async function enrollCustomersBulk(options?: {
  limit?: number;
  only_unenrolled?: number;
}) {
  return apiRequest(`/api/method/${LOYALTY}.enroll_customers_bulk`, {
    method: 'POST',
    body: JSON.stringify({
      limit: options?.limit ?? 200,
      only_unenrolled: options?.only_unenrolled ?? 1,
    }),
  });
}

export async function syncLoyaltyTiers(options?: {
  limit?: number;
  customer?: string;
}) {
  return apiRequest(`/api/method/${LOYALTY}.sync_loyalty_tiers`, {
    method: 'POST',
    body: JSON.stringify({
      limit: options?.limit ?? 200,
      customer: options?.customer || null,
    }),
  });
}

export async function listReferrals(options?: {
  status?: string;
  search?: string;
  limit?: number;
}) {
  return apiRequest(`/api/method/${LOYALTY}.get_referrals`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
    }),
  });
}

export async function getReferral(name: string) {
  return apiRequest(`/api/method/${LOYALTY}.get_referral`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createReferral(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${LOYALTY}.create_referral`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateReferral(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${LOYALTY}.update_referral`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function markReferralEvent(name: string, event: string) {
  return apiRequest(`/api/method/${LOYALTY}.mark_referral_event`, {
    method: 'POST',
    body: JSON.stringify({ name, event }),
  });
}

export async function listCases(options?: {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${CASES}.get_cases`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      priority: options?.priority || null,
      category: options?.category || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getCase(name: string) {
  return apiRequest(`/api/method/${CASES}.get_case`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createCase(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CASES}.create_case`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateCase(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CASES}.update_case`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function escalateCase(name: string, level?: string, notes?: string) {
  return apiRequest(`/api/method/${CASES}.escalate_case`, {
    method: 'POST',
    body: JSON.stringify({ name, level: level || null, notes: notes || null }),
  });
}

export async function fetchCaseFormOptions(): Promise<{
  categories: string[];
  priorities: string[];
  statuses: string[];
  sources: string[];
  departments: string[];
  escalation_levels: string[];
  closure_codes: string[];
  satisfaction: string[];
}> {
  return apiRequest(`/api/method/${CASES}.get_case_form_options`);
}

// ─── Campaigns & Segments (§13) ─────────────────────────────────────────────

export async function listCampaigns(options?: {
  status?: string;
  campaign_type?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${CAMPAIGNS}.get_campaigns`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      campaign_type: options?.campaign_type || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getCampaign(name: string) {
  return apiRequest(`/api/method/${CAMPAIGNS}.get_campaign`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createCampaign(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CAMPAIGNS}.create_campaign`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateCampaign(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CAMPAIGNS}.update_campaign`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function approveCampaign(name: string) {
  return apiRequest(`/api/method/${CAMPAIGNS}.approve_campaign`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function buildCampaignAudience(name: string, replaceExisting = false) {
  return apiRequest(`/api/method/${CAMPAIGNS}.build_campaign_audience`, {
    method: 'POST',
    body: JSON.stringify({ name, replace_existing: replaceExisting ? 1 : 0 }),
  });
}

export async function refreshCampaignMetrics(name: string) {
  return apiRequest(`/api/method/${CAMPAIGNS}.refresh_metrics`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateCampaignMember(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CAMPAIGNS}.update_campaign_member`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function fetchCampaignFormOptions(): Promise<{
  campaign_types: string[];
  statuses: string[];
  channels: string[];
  member_statuses: string[];
}> {
  return apiRequest(`/api/method/${CAMPAIGNS}.get_campaign_form_options`);
}

export async function listSegments(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${CAMPAIGNS}.get_segments`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getSegment(name: string) {
  return apiRequest(`/api/method/${CAMPAIGNS}.get_segment`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createSegment(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CAMPAIGNS}.create_segment`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateSegment(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CAMPAIGNS}.update_segment`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function previewSegment(options: { name?: string; data?: Record<string, unknown> }) {
  return apiRequest(`/api/method/${CAMPAIGNS}.preview_segment`, {
    method: 'POST',
    body: JSON.stringify({
      name: options.name || null,
      data: options.data || null,
    }),
  });
}

export async function fetchSegmentFormOptions(): Promise<{
  statuses: string[];
  customer_types: string[];
  loyalty_tiers: string[];
  warranty_statuses: string[];
  sales_statuses: string[];
  retention_categories: string[];
  channels: string[];
}> {
  return apiRequest(`/api/method/${CAMPAIGNS}.get_segment_form_options`);
}

export async function listSuppressionLists(options?: { limit?: number; offset?: number }) {
  return apiRequest(`/api/method/${CAMPAIGNS}.get_suppression_lists`, {
    method: 'POST',
    body: JSON.stringify({
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function createSuppressionList(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CAMPAIGNS}.create_suppression_list`, {
    method: 'POST',
    body: JSON.stringify({ data }),
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
  sales_appointments: Record<string, unknown>[];
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

export interface Vehicle360Data {
  vehicle: {
    name: string;
    vin_number?: string;
    plate_number?: string;
    brand?: string;
    brand_label?: string;
    model?: string;
    model_name?: string;
    model_year?: string | number;
    engine_number?: string;
    fuel_type?: string;
    transmission?: string;
    exterior_color?: string;
    current_customer?: string;
    customer_name?: string;
    owner_mobile?: string;
    owner_email?: string;
    current_odometer?: number;
    odometer_unit?: string;
    warranty_status?: string;
    warranty_end_date?: string;
    vehicle_status?: string;
    next_service_due_date?: string;
    next_service_due_km?: number;
    last_service_date?: string;
    delivery_date?: string;
    is_fleet_vehicle?: number;
    fleet_company?: string;
    company?: string;
    [key: string]: unknown;
  };
  owner: {
    name: string;
    customer_name?: string;
    mobile_no?: string;
    email_id?: string;
    tax_id?: string;
    customer_group?: string;
    territory?: string;
    customer_type?: string;
  } | null;
  ownership_history: Record<string, unknown>[];
  warranty: Record<string, unknown>;
  summary: {
    buyer?: string;
    vehicle_status?: string;
    warranty_status?: string;
    odometer?: number;
    next_service_due_date?: string | null;
    owners: number;
    opportunities_total: number;
    opportunities_open: number;
    pipeline_value: number;
    sales_appointments: number;
    test_drives: number;
    bookings: number;
    appointments: number;
    job_cards: number;
    inspections: number;
    estimates: number;
    follow_ups: number;
    service_dues: number;
    deliveries: number;
    cases_total: number;
    cases_open: number;
    activities_open: number;
    outstanding: number;
    aftersales_revenue: number;
    retention_status?: string;
    open_follow_ups: number;
  };
  opportunities: Record<string, unknown>[];
  bookings: Record<string, unknown>[];
  test_drives: Record<string, unknown>[];
  delivery_readiness: Record<string, unknown>[];
  sales_appointments: Record<string, unknown>[];
  appointments: Record<string, unknown>[];
  job_cards: Record<string, unknown>[];
  estimates: Record<string, unknown>[];
  follow_ups: Record<string, unknown>[];
  deliveries: Record<string, unknown>[];
  inspections: Record<string, unknown>[];
  service_dues: Record<string, unknown>[];
  cases: Record<string, unknown>[];
  activities: Record<string, unknown>[];
  finance: {
    invoices: Record<string, unknown>[];
    outstanding: number;
    invoiced_total: number;
    paid_total: number;
    overdue_count: number;
  };
}

export async function listCrmVehicles(options?: {
  search?: string;
  customer?: string;
  vehicle_status?: string;
  warranty_status?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest<{ data: Record<string, unknown>[]; total: number }>(
    `/api/method/${VEHICLES}.get_vehicles`,
    {
      method: 'POST',
      body: JSON.stringify({
        search: options?.search || null,
        customer: options?.customer || null,
        vehicle_status: options?.vehicle_status || null,
        warranty_status: options?.warranty_status || null,
        limit: options?.limit ?? 50,
        offset: options?.offset ?? 0,
      }),
    }
  );
}

export async function fetchVehicle360(vin: string): Promise<Vehicle360Data> {
  return apiRequest(`/api/method/${VEHICLES}.get_vehicle_360`, {
    method: 'POST',
    body: JSON.stringify({ vin }),
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

export async function mergeCustomers(
  master: string,
  duplicate: string,
  opts?: { fieldOverrides?: Record<string, unknown>; confirmDifferentVehicles?: boolean }
): Promise<{
  master: string;
  duplicate: string;
  moved_count: number;
  copied_fields: string[];
  message: string;
}> {
  return apiRequest(`/api/method/${CUSTOMERS}.merge_customers`, {
    method: 'POST',
    body: JSON.stringify({
      master,
      duplicate,
      field_overrides: opts?.fieldOverrides || {},
      confirm_different_vehicles: opts?.confirmDifferentVehicles ? 1 : 0,
    }),
  });
}

const BOOKINGS = 'dms.crm_api.bookings';

export async function listBookings(params?: {
  search?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${BOOKINGS}.get_bookings`, {
    method: 'POST',
    body: JSON.stringify(params || {}),
  });
}

export async function getBooking(name: string) {
  return apiRequest(`/api/method/${BOOKINGS}.get_booking`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function fetchCustomerCreateOptions(): Promise<{
  customer_groups: string[];
  territories: string[];
  customer_types: string[];
  default_customer_group?: string | null;
  countries?: string[];
  default_country?: string | null;
  address_types?: string[];
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

export async function updateCustomer(
  name: string,
  data: Record<string, unknown>
): Promise<{
  ok?: boolean;
  name?: string;
  customer_name?: string;
  customer_group?: string;
  mobile_no?: string;
  email_id?: string;
}> {
  return apiRequest(`/api/method/${CUSTOMERS}.update_customer`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
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
  _lead_label?: string;
  _contact?: string;
  _contact_label?: string;
  _deal?: string;
  _deal_label?: string;
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
  leads: Array<{ value: string; label: string; description?: string; mobile?: string }>;
}> {
  return apiRequest(`/api/method/${CALL_LOGS}.get_call_log_form_options`);
}

/* ── Fleet / Corporate Accounts (§9) ─────────────────────────────── */

const ACCOUNTS = 'dms.crm_api.accounts';
const TENDERS = 'dms.crm_api.tenders';
const FLEET = 'dms.crm_api.fleet';

export async function listAccounts(options?: {
  account_type?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${ACCOUNTS}.get_accounts`, {
    method: 'POST',
    body: JSON.stringify({
      account_type: options?.account_type || null,
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getAccount(name: string) {
  return apiRequest(`/api/method/${ACCOUNTS}.get_account`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createAccount(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${ACCOUNTS}.create_account`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateAccount(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${ACCOUNTS}.update_account`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function fetchAccountFormOptions(): Promise<{
  account_types: string[];
  statuses: string[];
  payment_behaviors: string[];
  growth_potentials: string[];
  relationship_health: string[];
  stakeholder_roles: string[];
  territories: string[];
}> {
  return apiRequest(`/api/method/${ACCOUNTS}.get_account_form_options`);
}

export async function listTenders(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${TENDERS}.get_tenders`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getTender(name: string) {
  return apiRequest(`/api/method/${TENDERS}.get_tender`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createTender(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${TENDERS}.create_tender`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateTender(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${TENDERS}.update_tender`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function listFrameworkAgreements(options?: {
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${TENDERS}.get_framework_agreements`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getFrameworkAgreement(name: string) {
  return apiRequest(`/api/method/${TENDERS}.get_framework_agreement`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createFrameworkAgreement(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${TENDERS}.create_framework_agreement`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateFrameworkAgreement(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${TENDERS}.update_framework_agreement`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function fetchTenderFormOptions(): Promise<{
  categories: string[];
  statuses: string[];
  financing_methods: string[];
  agreement_statuses: string[];
}> {
  return apiRequest(`/api/method/${TENDERS}.get_tender_form_options`);
}

export async function getFleetAftersales(options: {
  customer?: string;
  account?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${FLEET}.get_fleet_aftersales`, {
    method: 'POST',
    body: JSON.stringify({
      customer: options.customer || null,
      account: options.account || null,
      search: options.search || null,
      limit: options.limit ?? 100,
      offset: options.offset ?? 0,
    }),
  });
}

export async function getFleetHealthReport(options: {
  customer?: string;
  account?: string;
}) {
  return apiRequest(`/api/method/${FLEET}.get_fleet_health_report`, {
    method: 'POST',
    body: JSON.stringify({
      customer: options.customer || null,
      account: options.account || null,
    }),
  });
}

/* ── Service Retention (§10) ─────────────────────────────────────── */

const RETENTION = 'dms.crm_api.service_retention';

export async function listServiceDue(options?: {
  classification?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${RETENTION}.get_service_due_list`, {
    method: 'POST',
    body: JSON.stringify({
      classification: options?.classification || null,
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getServiceDue(name: string) {
  return apiRequest(`/api/method/${RETENTION}.get_service_due`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function syncServiceDue(limit = 200) {
  return apiRequest(`/api/method/${RETENTION}.sync_service_due`, {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}

export async function adjustServiceDue(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${RETENTION}.adjust_service_due`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function runReminderSequence(limit = 200) {
  return apiRequest(`/api/method/${RETENTION}.run_reminder_sequence`, {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}

export async function listDeferredWork(options?: {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${RETENTION}.get_deferred_work`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      category: options?.category || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function createDeferredWork(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${RETENTION}.create_deferred_work`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateDeferredWork(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${RETENTION}.update_deferred_work`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function fetchRetentionSettings() {
  return apiRequest(`/api/method/${RETENTION}.get_retention_settings`);
}

export async function listReminderLogs(options?: {
  service_due?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${RETENTION}.get_reminder_logs`, {
    method: 'POST',
    body: JSON.stringify({
      service_due: options?.service_due || null,
      status: options?.status || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

/* ── Call Center (§11) ───────────────────────────────────────────── */

const CALL_CENTER = 'dms.crm_api.call_center';

export async function getCallCenterQueues() {
  return apiRequest(`/api/method/${CALL_CENTER}.get_call_center_queues`);
}

export async function getQueueCalls(options?: {
  queue?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return apiRequest(`/api/method/${CALL_CENTER}.get_queue_calls`, {
    method: 'POST',
    body: JSON.stringify({
      queue: options?.queue || null,
      status: options?.status || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function lookupCustomerByPhone(phone: string) {
  return apiRequest(`/api/method/${CALL_CENTER}.lookup_customer_by_phone`, {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export async function setCallDisposition(name: string, data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CALL_CENTER}.set_call_disposition`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function listCallScripts(options?: {
  purpose?: string;
  language?: string;
  queue?: string;
}) {
  return apiRequest(`/api/method/${CALL_CENTER}.get_call_scripts`, {
    method: 'POST',
    body: JSON.stringify({
      purpose: options?.purpose || null,
      language: options?.language || null,
      queue: options?.queue || null,
    }),
  });
}

export async function getCallScript(name: string) {
  return apiRequest(`/api/method/${CALL_CENTER}.get_call_script`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createQualityScore(data: Record<string, unknown>) {
  return apiRequest(`/api/method/${CALL_CENTER}.create_quality_score`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function clickToCall(options: {
  phone: string;
  customer?: string;
  queue?: string;
}) {
  return apiRequest(`/api/method/${CALL_CENTER}.click_to_call`, {
    method: 'POST',
    body: JSON.stringify({
      phone: options.phone,
      customer: options.customer || null,
      queue: options.queue || null,
    }),
  });
}
