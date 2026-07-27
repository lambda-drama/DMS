/**
 * Maps DMS hash routes to permission module keys returned by get_dms_ui_permissions.
 */

export type DmsPermissionModule =
  | 'dashboard'
  | 'appointments'
  | 'inspections'
  | 'service-estimates'
  | 'job-cards'
  | 'parts-requisitions'
  | 'technicians'
  | 'service-advisors'
  | 'parts-advisors'
  | 'deliveries'
  | 'customers'
  | 'vehicles'
  | 'invoices'
  | 'follow-ups'
  | 'stock-entry'
  | 'stock-reconciliation'
  | 'material-request'
  | 'pending-material-requests'
  | 'purchase-receipt'
  | 'spare-part-sales'
  | 'proforma-invoices'
  | 'inventory-dashboard'
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
  'parts-requisitions': 'parts-requisitions',
  'parts-requisition-detail': 'parts-requisitions',
  technicians: 'technicians',
  'technician-detail': 'technicians',
  'service-advisors': 'service-advisors',
  'parts-advisors': 'parts-advisors',
  deliveries: 'deliveries',
  'delivery-new': 'deliveries',
  customers: 'customers',
  vehicles: 'vehicles',
  'vehicle-new': 'vehicles',
  invoices: 'invoices',
  'invoice-new': 'invoices',
  'follow-ups': 'follow-ups',
  'follow-up-new': 'follow-ups',
  'stock-entry': 'stock-entry',
  'stock-reconciliation': 'stock-reconciliation',
  'material-request': 'material-request',
  'pending-material-requests': 'material-request',
  'purchase-receipt': 'purchase-receipt',
  'spare-part-sales': 'spare-part-sales',
  'proforma-invoices': 'proforma-invoices',
  'proforma-invoice-new': 'proforma-invoices',
  'inventory-dashboard': 'inventory-dashboard',
  reports: 'reports',
  settings: 'settings',
};

export function permissionModuleForView(view: string): DmsPermissionModule | null {
  return VIEW_TO_PERMISSION_MODULE[view] ?? null;
}

export function truthy(v: number | boolean | undefined): boolean {
  return Boolean(v);
}
