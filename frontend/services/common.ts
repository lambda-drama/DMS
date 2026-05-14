/**
 * Common lookup service — calls whitelisted methods in dms.api.common
 */
import { apiRequest } from './apiClient';
import type { Customer, VINNo, ServiceAdvisor, Technician, ServiceBay, PaginatedResponse } from '@/types/dms';

const API = 'dms.api.common';

export interface SparePart {
  name: string;
  item_name: string;
  item_code?: string;
  part_category?: string;
  oem_part_number?: string;
}

export interface VehicleServiceItem {
  name: string;
  service_item?: string;
  custom_erpnext_item?: string;
  custom_item_name?: string;
  custom_rate?: number;
  custom_estimated_timemin?: string;
}

export interface CompanyOption {
  name: string;
  company_name?: string;
  default_currency?: string;
}

export interface Workshop {
  name: string;
  company?: string;
}

export interface Warehouse {
  name: string;
  warehouse_name?: string;
  company?: string;
}

export async function fetchCustomers(search?: string, limit?: number, offset?: number): Promise<PaginatedResponse<Customer>> {
  return apiRequest<PaginatedResponse<Customer>>(`/api/method/${API}.get_customers`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, limit: limit || 50, offset: offset || 0 }),
  });
}

export async function fetchVINs(customer?: string, search?: string): Promise<VINNo[]> {
  return apiRequest<VINNo[]>(`/api/method/${API}.get_vins`, {
    method: 'POST',
    body: JSON.stringify({
      customer: customer || null,
      search: search || null,
    }),
  });
}

export async function fetchServiceAdvisors(): Promise<ServiceAdvisor[]> {
  return apiRequest<ServiceAdvisor[]>(`/api/method/${API}.get_service_advisors`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchTechnicians(): Promise<Technician[]> {
  return apiRequest<Technician[]>(`/api/method/${API}.get_technicians`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function fetchServiceBays(status?: 'Available' | 'Occupied'): Promise<ServiceBay[]> {
  return apiRequest<ServiceBay[]>(`/api/method/${API}.get_service_bays`, {
    method: 'POST',
    body: JSON.stringify({ status: status || null }),
  });
}

export async function fetchSpareParts(search?: string): Promise<SparePart[]> {
  return apiRequest<SparePart[]>(`/api/method/${API}.get_spare_parts`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchVehicleServiceItems(search?: string): Promise<VehicleServiceItem[]> {
  return apiRequest<VehicleServiceItem[]>(`/api/method/${API}.get_vehicle_service_items`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchWorkshops(search?: string): Promise<Workshop[]> {
  return apiRequest<Workshop[]>(`/api/method/${API}.get_workshops`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchWarehouses(search?: string, company?: string): Promise<Warehouse[]> {
  return apiRequest<Warehouse[]>(`/api/method/${API}.get_warehouses`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null, company: company || null }),
  });
}

export async function fetchCompanies(search?: string): Promise<CompanyOption[]> {
  return apiRequest<CompanyOption[]>(`/api/method/${API}.get_companies`, {
    method: 'POST',
    body: JSON.stringify({ search: search || null }),
  });
}

export async function fetchSparePartPrice(sparePart: string): Promise<number> {
  return apiRequest<number>(
    `/api/method/dms.dealer_management_system.doctype.dms_job_card.dms_job_card.get_job_card_part_unit_price`,
    {
      method: 'POST',
      body: JSON.stringify({ spare_part: sparePart }),
    }
  );
}

export async function fetchLabourRate(vehicleServiceItem: string): Promise<number> {
  return apiRequest<number>(`/api/method/${API}.get_labour_rate`, {
    method: 'POST',
    body: JSON.stringify({ vehicle_service_item: vehicleServiceItem }),
  });
}

export async function fetchServiceBayDetail(bayName: string): Promise<{ branch?: string; bay_number?: string; bay_name?: string }> {
  return apiRequest<{ branch?: string; bay_number?: string; bay_name?: string }>(`/api/method/${API}.get_service_bay_detail`, {
    method: 'POST',
    body: JSON.stringify({ bay_name: bayName }),
  });
}
