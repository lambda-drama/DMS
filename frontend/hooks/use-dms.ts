import useSWR from 'swr';
import useSWRMutation from 'swr/mutation';
import * as appointmentsSvc from '@/services/appointments';
import * as inspectionsSvc from '@/services/inspections';
import * as jobCardsSvc from '@/services/jobCards';
import * as deliveriesSvc from '@/services/deliveries';
import * as invoicesSvc from '@/services/invoices';
import * as commonSvc from '@/services/common';
import type {
  ServiceAppointment,
  VehicleInspection,
  DMSJobCard,
  Delivery,
  Invoice,
  Customer,
  VINNo,
  ServiceAdvisor,
  Technician,
  ServiceBay,
} from '@/types/dms';

// ============ APPOINTMENTS ============

export function useAppointments(options?: { status?: string; date?: string }) {
  return useSWR(
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

export function useInspections(options?: { customer?: string; date?: string }) {
  return useSWR(
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

export function useJobCards(options?: { status?: string; customer?: string }) {
  return useSWR(
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

export function useDeliveries(options?: { status?: string; search?: string }) {
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
  return useSWR(
    ['invoices', options],
    () => invoicesSvc.listInvoices(options),
    { refreshInterval: 30000 }
  );
}

export function useCreateInvoice() {
  return useSWRMutation(
    'invoices',
    (_, { arg }: { arg: Partial<Invoice> }) =>
      invoicesSvc.createInvoice(arg)
  );
}

// ============ LOOKUPS ============

export function useCustomers(search?: string) {
  return useSWR<Customer[]>(
    ['customers', search],
    () => commonSvc.fetchCustomers(search),
    { dedupingInterval: 5000 }
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
