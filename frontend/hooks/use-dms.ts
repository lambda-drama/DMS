import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import * as appointmentsSvc from '@/services/appointments';
import * as inspectionsSvc from '@/services/inspections';
import * as jobCardsSvc from '@/services/jobCards';
import * as deliveriesSvc from '@/services/deliveries';
import * as invoicesSvc from '@/services/invoices';
import * as commonSvc from '@/services/common';
import * as techniciansSvc from '@/services/technicians';
import * as vehiclesSvc from '@/services/vehicles';
import type {
  ServiceAppointment,
  VehicleInspection,
  DMSJobCard,
  Delivery,
  SalesInvoiceListItem,
  PaginatedResponse,
  Customer,
  VINNo,
  VINNoListItem,
  VINNoFull,
  VehicleItem,
  ServiceAdvisor,
  Technician,
  ServiceBay,
  TechnicianListItem,
  TechnicianFull,
  TechnicianAvailability,
  TechnicianScheduleJob,
} from '@/types/dms';

// ============ APPOINTMENTS ============

export function useAppointments(options?: {
  status?: string;
  date?: string;
  limit?: number;
  offset?: number;
}) {
  return useSWR<PaginatedResponse<ServiceAppointment>>(
    ['appointments', options],
    () => appointmentsSvc.listAppointments(options),
    { refreshInterval: 30000 }
  );
}

export function useAppointment(name: string | null) {
  return useSWR(
    name ? ['appointment', name] : null,
    () => appointmentsSvc.getAppointment(name!)
  );
}

export function useCreateAppointment() {
  return useSWRMutation(
    'appointments',
    (_, { arg }: { arg: Partial<ServiceAppointment> }) =>
      appointmentsSvc.createAppointment(arg)
  );
}

export function useUpdateAppointment(name: string) {
  return useSWRMutation(
    ['appointment', name],
    (_, { arg }: { arg: Partial<ServiceAppointment> }) =>
      appointmentsSvc.updateAppointment(name, arg)
  );
}

export function useMarkAppointmentArrived(name: string) {
  return useSWRMutation(['appointment', name], () =>
    appointmentsSvc.markArrived(name)
  );
}

// ============ INSPECTIONS ============

export function useInspections(options?: {
  customer?: string;
  date?: string;
  limit?: number;
  offset?: number;
}) {

  console.log('useInspections options:', options); // Debug log to check options
  console.log("Customer", options?.customer);
  return useSWR<PaginatedResponse<VehicleInspection>>(
    ['inspections', options],
    () => inspectionsSvc.listInspections(options),
    { refreshInterval: 30000 }
  );
}

export function useInspection(name: string | null) {
  return useSWR(
    name ? ['inspection', name] : null,
    () => inspectionsSvc.getInspection(name!)
  );
}

export function useCreateInspection() {
  return useSWRMutation(
    'inspections',
    (_, { arg }: { arg: Partial<VehicleInspection> }) =>
      inspectionsSvc.createInspection(arg)
  );
}

export function useUpdateInspection(name: string) {
  return useSWRMutation(
    ['inspection', name],
    (_, { arg }: { arg: Partial<VehicleInspection> }) =>
      inspectionsSvc.updateInspection(name, arg)
  );
}

export function useSubmitInspection(name: string) {
  return useSWRMutation(['inspection', name], () =>
    inspectionsSvc.submitInspection(name)
  );
}

// ============ JOB CARDS ============

export function useJobCards(options?: {
  status?: string;
  customer?: string;
  limit?: number;
  offset?: number;
}) {
  return useSWR<PaginatedResponse<DMSJobCard>>(
    ['jobcards', options],
    () => jobCardsSvc.listJobCards(options),
    { refreshInterval: 15000 }
  );
}

export function useJobCard(name: string | null) {
  return useSWR(
    name ? ['jobcard', name] : null,
    () => jobCardsSvc.getJobCard(name!),
    { refreshInterval: 10000 }
  );
}

export function useCreateJobCard() {
  return useSWRMutation(
    'jobcards',
    (_, { arg }: { arg: Partial<DMSJobCard> }) =>
      jobCardsSvc.createJobCard(arg)
  );
}

export function useUpdateJobCard(name: string) {
  return useSWRMutation(
    ['jobcard', name],
    (_, { arg }: { arg: Record<string, unknown> }) =>
      jobCardsSvc.updateJobCard(name, arg)
  );
}

// ============ DELIVERIES ============

export function useDeliveries(options?: { search?: string }) {
  return useSWR(
    ['deliveries', options],
    () => deliveriesSvc.listDeliveries(options),
    { refreshInterval: 30000 }
  );
}

export function useCreateDelivery() {
  return useSWRMutation(
    'deliveries',
    (_, { arg }: { arg: Partial<Delivery> }) =>
      deliveriesSvc.createDeliveryUI(arg)
  );
}

// ============ INVOICES ============

export function useInvoices(options?: { status?: string; search?: string }) {
  return useSWR<SalesInvoiceListItem[]>(
    ['invoices', options],
    () => invoicesSvc.listInvoices(options),
    { refreshInterval: 30000 }
  );
}


// ============ LOOKUPS ============

export function useCustomers(search?: string) {
  return useSWR<Customer[]>(
    ['customers', search],
    async () => {
      const res = await commonSvc.fetchCustomers(search);
      return res.data;
    },
    { dedupingInterval: 5000 }
  );
}

export function useCustomersPaginated(options?: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  return useSWR<PaginatedResponse<Customer>>(
    ['customers-paginated', options],
    () => commonSvc.fetchCustomers(options?.search, options?.limit, options?.offset),
    { refreshInterval: 30000 }
  );
}

export function useVINs(customer?: string, search?: string) {
  return useSWR<VINNo[]>(
    ['vins', customer, search],
    () => commonSvc.fetchVINs(customer, search),
    { dedupingInterval: 5000 }
  );
}

export function useServiceAdvisors() {
  return useSWR<ServiceAdvisor[]>(
    'service-advisors',
    () => commonSvc.fetchServiceAdvisors(),
    { dedupingInterval: 60000 }
  );
}

export function useTechnicians() {
  return useSWR<Technician[]>(
    'technicians',
    () => commonSvc.fetchTechnicians(),
    { dedupingInterval: 60000 }
  );
}

export function useServiceBays(status?: 'Available' | 'Occupied') {
  return useSWR<ServiceBay[]>(
    ['service-bays', status],
    () => commonSvc.fetchServiceBays(status),
    { refreshInterval: 30000 }
  );
}

export function useSpareParts(search?: string) {
  return useSWR(
    ['spare-parts', search],
    () => commonSvc.fetchSpareParts(search),
    { dedupingInterval: 5000 }
  );
}

export function useVehicleServiceItems(search?: string) {
  return useSWR(
    ['vehicle-service-items', search],
    () => commonSvc.fetchVehicleServiceItems(search),
    { dedupingInterval: 5000 }
  );
}

export function useWorkshops(search?: string) {
  return useSWR(
    ['workshops', search],
    () => commonSvc.fetchWorkshops(search),
    { dedupingInterval: 10000 }
  );
}

export function useWarehouses(search?: string, company?: string) {
  return useSWR(
    ['warehouses', search, company],
    () => commonSvc.fetchWarehouses(search, company),
    { dedupingInterval: 10000 }
  );
}

export function useCompanies(search?: string) {
  return useSWR(
    ['companies', search],
    () => commonSvc.fetchCompanies(search),
    { dedupingInterval: 30000 }
  );
}

// ============ TECHNICIANS ============

export function useTechniciansList(options?: {
  status?: string;
  skill_level?: string;
  search?: string;
}) {
  return useSWR<TechnicianListItem[]>(
    ['technicians-list', options],
    () => techniciansSvc.listTechnicians(options),
    { refreshInterval: 30000 }
  );
}

export function useTechnicianDetail(name: string | null) {
  return useSWR<TechnicianFull>(
    name ? ['technician', name] : null,
    () => techniciansSvc.getTechnician(name!),
    { refreshInterval: 30000 }
  );
}

export function useTechnicianSchedule(name: string | null, date?: string) {
  return useSWR<TechnicianScheduleJob[]>(
    name ? ['technician-schedule', name, date] : null,
    () => techniciansSvc.getTechnicianSchedule(name!, date),
    { refreshInterval: 15000 }
  );
}

export function useTechnicianWeeklySchedule(name: string | null, startDate?: string) {
  return useSWR<Record<string, TechnicianScheduleJob[]>>(
    name ? ['technician-weekly-schedule', name, startDate] : null,
    () => techniciansSvc.getTechnicianWeeklySchedule(name!, startDate),
    { refreshInterval: 30000 }
  );
}

export function useTechniciansAvailability(date?: string) {
  return useSWR<TechnicianAvailability[]>(
    ['technicians-availability', date],
    () => techniciansSvc.getAllTechniciansAvailability(date),
    { refreshInterval: 15000 }
  );
}

// ============ VEHICLES (VIN No) ============

export function useVehicles(options?: {
  customer?: string;
  search?: string;
  vehicle_status?: string;
  warranty_status?: string;
  limit?: number;
  offset?: number;
}) {
  return useSWR<PaginatedResponse<VINNoListItem>>(
    ['vehicles', options],
    () => vehiclesSvc.listVehicles(options),
    { refreshInterval: 30000 }
  );
}

export function useVehicle(name: string | null) {
  return useSWR<VINNoFull>(
    name ? ['vehicle', name] : null,
    () => vehiclesSvc.getVehicle(name!),
    { refreshInterval: 30000 }
  );
}

export function useVehicleItems(search?: string) {
  return useSWR<VehicleItem[]>(
    ['vehicle-items', search],
    () => vehiclesSvc.getVehicleItems(search),
    { dedupingInterval: 5000 }
  );
}
