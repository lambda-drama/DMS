/**
 * Maps DMS hash routes to permission module keys returned by get_dms_ui_permissions.
 */

export type DmsPermissionModule =
  | 'dashboard'
  | 'appointments'
  | 'inspections'
  | 'service-estimates'
  | 'job-cards'
  | 'technicians'
  | 'service-advisors'
  | 'deliveries'
  | 'customers'
  | 'vehicles'
  | 'invoices'
  | 'reports'
  | 'settings';

export interface DmsModulePermissions {
  doctype?: string | null;
  visible?: number | boolean;
  select?: number | boolean;
  read?: number | boolean;
  write?: number | boolean;
  create?: number | boolean;
  delete?: number | boolean;
  submit?: number | boolean;
  cancel?: number | boolean;
  report?: number | boolean;
  export?: number | boolean;
}

export type DmsPermissionsMap = Partial<Record<DmsPermissionModule, DmsModulePermissions>>;

/** Hash view -> permission module (detail/new routes inherit parent module). */
export const VIEW_TO_PERMISSION_MODULE: Record<string, DmsPermissionModule> = {
  dashboard: 'dashboard',
  appointments: 'appointments',
  'appointment-detail': 'appointments',
  'appointment-new': 'appointments',
  inspections: 'inspections',
  'inspection-detail': 'inspections',
  'inspection-new': 'inspections',
  'service-estimates': 'service-estimates',
  'estimate-detail': 'service-estimates',
  'job-cards': 'job-cards',
  'job-card-detail': 'job-cards',
  'job-card-new': 'job-cards',
  technicians: 'technicians',
  'technician-detail': 'technicians',
  'service-advisors': 'service-advisors',
  deliveries: 'deliveries',
  'delivery-new': 'deliveries',
  customers: 'customers',
  vehicles: 'vehicles',
  'vehicle-new': 'vehicles',
  invoices: 'invoices',
  'invoice-new': 'invoices',
  reports: 'reports',
  settings: 'settings',
};

export function permissionModuleForView(view: string): DmsPermissionModule | null {
  return VIEW_TO_PERMISSION_MODULE[view] ?? null;
}

export function truthy(v: number | boolean | undefined): boolean {
  return Boolean(v);
}
