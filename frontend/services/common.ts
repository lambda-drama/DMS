import { apiRequest } from './apiClient';
import type { Customer, VINNo, ServiceAdvisor, Technician, ServiceBay } from '@/types/dms';

export async function fetchCustomers(search?: string): Promise<Customer[]> {
  const params = new URLSearchParams();
  if (search) params.set('filters', JSON.stringify({ customer_name: ['like', `%${search}%`] }));
  params.set('fields', JSON.stringify(['name', 'customer_name', 'mobile_no', 'email_id']));
  params.set('limit_page_length', '20');

  return apiRequest<Customer[]>(`/api/resource/Customer?${params}`);
}

export async function fetchVINs(customer?: string, search?: string): Promise<VINNo[]> {
  const params = new URLSearchParams();
  const filters: Record<string, unknown> = {};
  if (customer) filters.current_customer = customer;
  if (search) filters.vin_number = ['like', `%${search}%`];
  if (Object.keys(filters).length) params.set('filters', JSON.stringify(filters));
  params.set('limit_page_length', '20');

  return apiRequest<VINNo[]>(`/api/resource/VIN No?${params}`);
}

export async function fetchServiceAdvisors(): Promise<ServiceAdvisor[]> {
  const params = new URLSearchParams();
  params.set('fields', JSON.stringify(['name', 'full_name', 'email', 'phone']));
  params.set('limit_page_length', '50');

  return apiRequest<ServiceAdvisor[]>(`/api/resource/Service Advisor?${params}`);
}

export async function fetchTechnicians(): Promise<Technician[]> {
  const params = new URLSearchParams();
  params.set('fields', JSON.stringify(['name', 'full_name', 'specialization']));
  params.set('limit_page_length', '50');

  return apiRequest<Technician[]>(`/api/resource/Technician?${params}`);
}

export async function fetchServiceBays(status?: 'Available' | 'Occupied'): Promise<ServiceBay[]> {
  const params = new URLSearchParams();
  if (status) params.set('filters', JSON.stringify({ status }));
  params.set('limit_page_length', '50');

  return apiRequest<ServiceBay[]>(`/api/resource/Service Bay?${params}`);
}
