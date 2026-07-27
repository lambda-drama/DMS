/**
 * Customer Follow Up service — dms.api.follow_ups
 */
import { apiRequest } from './apiClient';
import type { PaginatedResponse } from '@/types/dms';

const API = 'dms.api.follow_ups';

export type FollowUpContactStatus =
  | 'Pending'
  | 'Reached'
  | 'Not Reached'
  | 'Wrong Number'
  | 'Callback Requested'
  | 'Customer Not Interested'
  | 'Number Disconnected'
  | '';

export type FollowUpCaseStatus =
  | 'Pending'
  | 'Open'
  | 'In Progress'
  | 'Resolved'
  | 'Closed'
  | 'Escalated';

export interface CustomerFollowUp {
  name: string;
  job_card?: string;
  delivery?: string;
  customer: string;
  customer_name?: string;
  vehicle_vin?: string;
  license_plate?: string;
  vehicle_model?: string;
  follow_up_due_date?: string;
  follow_up_completed_date?: string;
  assigned_to?: string;
  contact_method?: string;
  contact_status?: FollowUpContactStatus | string;
  case_status?: FollowUpCaseStatus | string;
  contact_notes?: string;
  follow_up_attempts?: number;
  next_attempt_date?: string;
  contact_person_name?: string;
  contact_phone_used?: string;
  customer_rating?: string;
  customer_rating_score?: number;
  issue_resolved?: string;
  is_overdue?: boolean;
  creation?: string;
  modified?: string;
}

export interface CreateFollowUpPayload {
  customer?: string;
  vehicle_vin?: string;
  job_card?: string;
  delivery?: string;
  follow_up_due_date?: string;
  assigned_to?: string;
  contact_method?: string;
  contact_status?: string;
  case_status?: string;
  issue_resolved?: string;
  contact_notes?: string;
  notes?: string;
  contact_person_name?: string;
  contact_phone_used?: string;
  next_attempt_date?: string;
  follow_up_attempts?: number;
}

export async function listFollowUps(options?: {
  status?: string;
  filter?: 'pending' | 'overdue' | 'due_today' | 'completed' | string;
  customer?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<PaginatedResponse<CustomerFollowUp>> {
  return apiRequest(`/api/method/${API}.get_follow_ups`, {
    method: 'POST',
    body: JSON.stringify({
      status: options?.status || null,
      filter: options?.filter || null,
      customer: options?.customer || null,
      search: options?.search || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getFollowUp(name: string): Promise<CustomerFollowUp> {
  return apiRequest(`/api/method/${API}.get_follow_up`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createFollowUp(
  data: CreateFollowUpPayload
): Promise<{
  name: string;
  customer: string;
  customer_name?: string;
  follow_up_due_date?: string;
  contact_status?: string;
  case_status?: string;
}> {
  return apiRequest(`/api/method/${API}.create_follow_up`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateFollowUp(
  name: string,
  data: Partial<CreateFollowUpPayload> & Record<string, unknown>
): Promise<CustomerFollowUp> {
  return apiRequest(`/api/method/${API}.update_follow_up`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

export async function scheduleFollowUp(
  name: string,
  options: {
    follow_up_due_date?: string;
    next_attempt_date?: string;
    contact_notes?: string;
  }
): Promise<CustomerFollowUp> {
  return apiRequest(`/api/method/${API}.schedule_follow_up`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      follow_up_due_date: options.follow_up_due_date || null,
      next_attempt_date: options.next_attempt_date || null,
      contact_notes: options.contact_notes || null,
    }),
  });
}
