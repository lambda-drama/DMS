'use client';

import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { NavigationProvider, useNavigation, isCrmView } from '@/contexts/navigation-context';
import { PermissionsProvider, usePermissions } from '@/contexts/permissions-context';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { PermissionGate } from '@/components/permission-gate';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const LoginPage = dynamic(() => import('./(auth)/login/page'));
const DashboardShell = dynamic(() => import('./(dashboard)/dashboard-shell'));

const DashboardMain = dynamic(() => import('./(dashboard)/dashboard/page'));
const AppointmentsPage = dynamic(() => import('./(dashboard)/dashboard/appointments/page'));
const AppointmentDetailPage = dynamic(() => import('./(dashboard)/dashboard/appointments/detail/page'));
const AppointmentNewPage = dynamic(() => import('./(dashboard)/dashboard/appointments/new/page'));
const InspectionsPage = dynamic(() => import('./(dashboard)/dashboard/inspections/page'));
const InspectionDetailPage = dynamic(() => import('./(dashboard)/dashboard/inspections/detail/page'));
const InspectionNewPage = dynamic(() => import('./(dashboard)/dashboard/inspections/new/page'));
const ServiceEstimatesPage = dynamic(() => import('./(dashboard)/dashboard/service-estimates/page'));
const ServiceEstimateDetailPage = dynamic(() => import('./(dashboard)/dashboard/service-estimates/detail/page'));
const JobCardsPage = dynamic(() => import('./(dashboard)/dashboard/job-cards/page'));
const JobCardDetailPage = dynamic(() => import('./(dashboard)/dashboard/job-cards/detail/page'));
const JobCardNewPage = dynamic(() => import('./(dashboard)/dashboard/job-cards/new/page'));
const PartsRequisitionsPage = dynamic(() => import('./(dashboard)/dashboard/parts-requisitions/page'));
const PartsRequisitionDetailPage = dynamic(() => import('./(dashboard)/dashboard/parts-requisitions/detail/page'));
const DeliveriesPage = dynamic(() => import('./(dashboard)/dashboard/deliveries/page'));
const DeliveryNewPage = dynamic(() => import('./(dashboard)/dashboard/deliveries/new/page'));
const InvoicesPage = dynamic(() => import('./(dashboard)/dashboard/invoices/page'));
const InvoiceNewPage = dynamic(() => import('./(dashboard)/dashboard/invoices/new/page'));
const FollowUpsPage = dynamic(() => import('./(dashboard)/dashboard/follow-ups/page'));
const FollowUpNewPage = dynamic(() => import('./(dashboard)/dashboard/follow-ups/new/page'));
const TechniciansPage = dynamic(() => import('./(dashboard)/dashboard/technicians/page'));
const TechnicianDetailPage = dynamic(() => import('./(dashboard)/dashboard/technicians/detail/page'));
const ServiceAdvisorsPage = dynamic(() => import('./(dashboard)/dashboard/service-advisors/page'));
const PartsAdvisorsPage = dynamic(() => import('./(dashboard)/dashboard/parts-advisors/page'));
const SparePartsPage = dynamic(() => import('./(dashboard)/dashboard/spare-parts/page'));
const VehicleServicesPage = dynamic(() => import('./(dashboard)/dashboard/vehicle-services/page'));
const ItemPricesPage = dynamic(() => import('./(dashboard)/dashboard/item-prices/page'));
const JobCardTermsPage = dynamic(() => import('./(dashboard)/dashboard/job-card-terms/page'));
const SalesInvoiceTcPage = dynamic(() => import('./(dashboard)/dashboard/sales-invoice-tc/page'));
const UserPermissionsPage = dynamic(() => import('./(dashboard)/dashboard/user-permissions/page'));
const CustomersPage = dynamic(() => import('./(dashboard)/dashboard/customers/page'));
const VehiclesPage = dynamic(() => import('./(dashboard)/dashboard/vehicles/page'));
const VehicleNewPage = dynamic(() => import('./(dashboard)/dashboard/vehicles/new/page'));
const ReportsPage = dynamic(() => import('./(dashboard)/dashboard/reports/page'));
const StockEntryPage = dynamic(() => import('./(dashboard)/dashboard/stock-entry/page'));
const StockReconciliationPage = dynamic(() => import('./(dashboard)/dashboard/stock-reconciliation/page'));
const MaterialRequestPage = dynamic(() => import('./(dashboard)/dashboard/material-request/page'));
const PendingMaterialRequestsPage = dynamic(() => import('./(dashboard)/dashboard/pending-material-requests/page'));
const PurchaseReceiptPage = dynamic(() => import('./(dashboard)/dashboard/purchase-receipt/page'));
const SparePartSalesPage = dynamic(() => import('./(dashboard)/dashboard/spare-part-sales/page'));
const ProformaInvoicesPage = dynamic(() => import('./(dashboard)/dashboard/proforma-invoices/page'));
const ProformaInvoiceNewPage = dynamic(() => import('./(dashboard)/dashboard/proforma-invoices/new/page'));
const InventoryDashboardPage = dynamic(() => import('./(dashboard)/dashboard/inventory/page'));
const SettingsPage = dynamic(() => import('./(dashboard)/dashboard/settings/page'));

const CrmDashboardPage = dynamic(() => import('./(dashboard)/crm/dashboard/page'));
const CrmLeadsPage = dynamic(() => import('./(dashboard)/crm/leads/page'));
const CrmLeadNewPage = dynamic(() => import('./(dashboard)/crm/leads/new/page'));
const CrmLeadDetailPage = dynamic(() => import('./(dashboard)/crm/leads/detail/page'));
const CrmOpportunitiesPage = dynamic(() => import('./(dashboard)/crm/opportunities/page'));
const CrmOpportunityNewPage = dynamic(() => import('./(dashboard)/crm/opportunities/new/page'));
const CrmOpportunityDetailPage = dynamic(() => import('./(dashboard)/crm/opportunities/detail/page'));
const CrmSalesAppointmentsPage = dynamic(() => import('./(dashboard)/crm/appointments/page'));
const CrmSalesAppointmentNewPage = dynamic(() => import('./(dashboard)/crm/appointments/new/page'));
const CrmSalesAppointmentDetailPage = dynamic(
  () => import('./(dashboard)/crm/appointments/detail/page')
);
const CrmContactsPage = dynamic(() => import('./(dashboard)/crm/contacts/page'));
const CrmCustomersPage = dynamic(() => import('./(dashboard)/crm/customers/page'));
const CrmCustomerNewPage = dynamic(() => import('./(dashboard)/crm/customers/new/page'));
const CrmCustomerDetailPage = dynamic(() => import('./(dashboard)/crm/customers/detail/page'));
const CrmVehiclesPage = dynamic(() => import('./(dashboard)/crm/vehicles/page'));
const CrmVehicleDetailPage = dynamic(() => import('./(dashboard)/crm/vehicles/detail/page'));
const CrmActivitiesPage = dynamic(() => import('./(dashboard)/crm/activities/page'));
const CrmActivityNewPage = dynamic(() => import('./(dashboard)/crm/activities/new/page'));
const CrmActivityDetailPage = dynamic(
  () => import('./(dashboard)/crm/activities/detail/page')
);
const CrmApprovalsPage = dynamic(() => import('./(dashboard)/crm/approvals/page'));
const CrmCallLogsPage = dynamic(() => import('./(dashboard)/crm/call-logs/page'));
const CrmCallLogNewPage = dynamic(() => import('./(dashboard)/crm/call-logs/new/page'));
const CrmCallLogDetailPage = dynamic(() => import('./(dashboard)/crm/call-logs/detail/page'));
const CrmCallCenterPage = dynamic(() => import('./(dashboard)/crm/call-center/page'));
const CrmTestDrivesPage = dynamic(() => import('./(dashboard)/crm/test-drives/page'));
const CrmTestDriveDetailPage = dynamic(() => import('./(dashboard)/crm/test-drives/detail/page'));
const CrmDeliveryReadinessPage = dynamic(() => import('./(dashboard)/crm/delivery-readiness/page'));
const CrmDeliveryReadinessDetailPage = dynamic(
  () => import('./(dashboard)/crm/delivery-readiness/detail/page')
);
const CrmBookingsPage = dynamic(() => import('./(dashboard)/crm/bookings/page'));
const CrmQuotationsPage = dynamic(() => import('./(dashboard)/crm/quotations/page'));
const CrmQuotationDetailPage = dynamic(() => import('./(dashboard)/crm/quotations/detail/page'));
const CrmAccountsPage = dynamic(() => import('./(dashboard)/crm/accounts/page'));
const CrmAccountNewPage = dynamic(() => import('./(dashboard)/crm/accounts/new/page'));
const CrmAccountDetailPage = dynamic(() => import('./(dashboard)/crm/accounts/detail/page'));
const CrmTendersPage = dynamic(() => import('./(dashboard)/crm/tenders/page'));
const CrmTenderNewPage = dynamic(() => import('./(dashboard)/crm/tenders/new/page'));
const CrmTenderDetailPage = dynamic(() => import('./(dashboard)/crm/tenders/detail/page'));
const CrmFleetAftersalesPage = dynamic(() => import('./(dashboard)/crm/fleet-aftersales/page'));
const CrmServiceRetentionPage = dynamic(
  () => import('./(dashboard)/crm/service-retention/page')
);
const CrmCalendarPage = dynamic(() => import('./(dashboard)/crm/calendar/page'));
const CrmCasesPage = dynamic(() => import('./(dashboard)/crm/cases/page'));
const CrmCaseNewPage = dynamic(() => import('./(dashboard)/crm/cases/new/page'));
const CrmCaseDetailPage = dynamic(() => import('./(dashboard)/crm/cases/detail/page'));
const CrmCampaignsPage = dynamic(() => import('./(dashboard)/crm/campaigns/page'));
const CrmCampaignNewPage = dynamic(() => import('./(dashboard)/crm/campaigns/new/page'));
const CrmCampaignDetailPage = dynamic(
  () => import('./(dashboard)/crm/campaigns/detail/page')
);
const CrmSegmentNewPage = dynamic(() => import('./(dashboard)/crm/segments/new/page'));
const CrmSegmentDetailPage = dynamic(() => import('./(dashboard)/crm/segments/detail/page'));
const CrmLoyaltyPage = dynamic(() => import('./(dashboard)/crm/loyalty/page'));
const CrmReferralsPage = dynamic(() => import('./(dashboard)/crm/referrals/page'));
const CrmReferralDetailPage = dynamic(
  () => import('./(dashboard)/crm/referrals/detail/page')
);
const CrmReportsPage = dynamic(() => import('./(dashboard)/crm/reports/page'));
const CrmStaffAuditPage = dynamic(() => import('./(dashboard)/crm/staff-audit/page'));

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

const RESTRICTED_VIEWS = new Set(['dashboard', 'reports', 'settings']);

const FALLBACK_VIEWS = [
  'appointments',
  'inspections',
  'service-estimates',
  'job-cards',
  'parts-requisitions',
  'technicians',
  'deliveries',
  'customers',
  'vehicles',
  'invoices',
  'follow-ups',
  'service-advisors',
  'parts-advisors',
  'spare-parts',
  'vehicle-services',
  'item-prices',
  'job-card-terms',
  'sales-invoice-tc',
  'user-permissions',
  'inventory-dashboard',
  'stock-entry',
  'stock-reconciliation',
  'material-request',
  'pending-material-requests',
  'purchase-receipt',
  'spare-part-sales',
  'proforma-invoices',
];

function RestrictedViewRedirect() {
  const { activeView, navigate } = useNavigation();
  const { canAccessView, isLoading } = usePermissions();

  useEffect(() => {
    if (isLoading) return;

    const view = activeView || 'dashboard';
    if (!RESTRICTED_VIEWS.has(view) || canAccessView(view)) return;

    const fallback = FALLBACK_VIEWS.find((v) => canAccessView(v));
    if (fallback) navigate(fallback);
  }, [activeView, canAccessView, isLoading, navigate]);

  return null;
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeView } = useNavigation();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) return <LoginPage />;

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':          return <DashboardMain />;
      case 'appointments':       return <AppointmentsPage />;
      case 'appointment-detail': return <AppointmentDetailPage />;
      case 'appointment-new':    return <AppointmentNewPage />;
      case 'inspections':        return <InspectionsPage />;
      case 'inspection-detail':  return <InspectionDetailPage />;
      case 'inspection-new':     return <InspectionNewPage />;
      case 'service-estimates':  return <ServiceEstimatesPage />;
      case 'estimate-detail':    return <ServiceEstimateDetailPage />;
      case 'job-cards':          return <JobCardsPage />;
      case 'job-card-detail':    return <JobCardDetailPage />;
      case 'job-card-new':       return <JobCardNewPage />;
      case 'parts-requisitions': return <PartsRequisitionsPage />;
      case 'parts-requisition-detail': return <PartsRequisitionDetailPage />;
      case 'deliveries':         return <DeliveriesPage />;
      case 'delivery-new':       return <DeliveryNewPage />;
      case 'invoices':           return <InvoicesPage />;
      case 'invoice-new':        return <InvoiceNewPage />;
      case 'follow-ups':         return <FollowUpsPage />;
      case 'follow-up-new':      return <FollowUpNewPage />;
      case 'technicians':        return <TechniciansPage />;
      case 'technician-detail':  return <TechnicianDetailPage />;
      case 'service-advisors':   return <ServiceAdvisorsPage />;
      case 'parts-advisors':     return <PartsAdvisorsPage />;
      case 'spare-parts':        return <SparePartsPage />;
      case 'vehicle-services':   return <VehicleServicesPage />;
      case 'item-prices':        return <ItemPricesPage />;
      case 'job-card-terms':     return <JobCardTermsPage />;
      case 'sales-invoice-tc':   return <SalesInvoiceTcPage />;
      case 'user-permissions':   return <UserPermissionsPage />;
      case 'customers':          return <CustomersPage />;
      case 'vehicles':           return <VehiclesPage />;
      case 'vehicle-new':        return <VehicleNewPage />;
      case 'reports':            return <ReportsPage />;
      case 'stock-entry':        return <StockEntryPage />;
      case 'stock-reconciliation': return <StockReconciliationPage />;
      case 'material-request':   return <MaterialRequestPage />;
      case 'pending-material-requests': return <PendingMaterialRequestsPage />;
      case 'purchase-receipt':   return <PurchaseReceiptPage />;
      case 'spare-part-sales':   return <SparePartSalesPage />;
      case 'proforma-invoices':  return <ProformaInvoicesPage />;
      case 'proforma-invoice-new': return <ProformaInvoiceNewPage />;
      case 'inventory-dashboard': return <InventoryDashboardPage />;
      case 'settings':           return <SettingsPage />;
      case 'crm-dashboard':      return <CrmDashboardPage />;
      case 'crm-leads':          return <CrmLeadsPage />;
      case 'crm-lead-new':       return <CrmLeadNewPage />;
      case 'crm-lead-detail':    return <CrmLeadDetailPage />;
      case 'crm-opportunities':  return <CrmOpportunitiesPage />;
      case 'crm-opportunity-new': return <CrmOpportunityNewPage />;
      case 'crm-opportunity-detail': return <CrmOpportunityDetailPage />;
      case 'crm-sales-appointments': return <CrmSalesAppointmentsPage />;
      case 'crm-sales-appointment-new': return <CrmSalesAppointmentNewPage />;
      case 'crm-sales-appointment-detail': return <CrmSalesAppointmentDetailPage />;
      case 'crm-contacts':       return <CrmContactsPage />;
      case 'crm-customers':      return <CrmCustomersPage />;
      case 'crm-customer-new':   return <CrmCustomerNewPage />;
      case 'crm-customer-detail': return <CrmCustomerDetailPage />;
      case 'crm-vehicles': return <CrmVehiclesPage />;
      case 'crm-vehicle-detail': return <CrmVehicleDetailPage />;
      case 'crm-activities':     return <CrmActivitiesPage />;
      case 'crm-activity-new':   return <CrmActivityNewPage />;
      case 'crm-activity-detail': return <CrmActivityDetailPage />;
      case 'crm-approvals':      return <CrmApprovalsPage />;
      case 'crm-call-logs':      return <CrmCallLogsPage />;
      case 'crm-call-log-new':   return <CrmCallLogNewPage />;
      case 'crm-call-log-detail': return <CrmCallLogDetailPage />;
      case 'crm-call-center':    return <CrmCallCenterPage />;
      case 'crm-test-drives':     return <CrmTestDrivesPage />;
      case 'crm-test-drive-detail': return <CrmTestDriveDetailPage />;
      case 'crm-delivery-readiness': return <CrmDeliveryReadinessPage />;
      case 'crm-delivery-readiness-detail': return <CrmDeliveryReadinessDetailPage />;
      case 'crm-bookings': return <CrmBookingsPage />;
      case 'crm-quotations': return <CrmQuotationsPage />;
      case 'crm-quotation-detail': return <CrmQuotationDetailPage />;
      case 'crm-accounts':       return <CrmAccountsPage />;
      case 'crm-account-new':    return <CrmAccountNewPage />;
      case 'crm-account-detail': return <CrmAccountDetailPage />;
      case 'crm-tenders':        return <CrmTendersPage />;
      case 'crm-tender-new':     return <CrmTenderNewPage />;
      case 'crm-tender-detail':  return <CrmTenderDetailPage />;
      case 'crm-fleet-aftersales': return <CrmFleetAftersalesPage />;
      case 'crm-service-retention': return <CrmServiceRetentionPage />;
      case 'crm-calendar':       return <CrmCalendarPage />;
      case 'crm-cases':          return <CrmCasesPage />;
      case 'crm-case-new':       return <CrmCaseNewPage />;
      case 'crm-case-detail':    return <CrmCaseDetailPage />;
      case 'crm-campaigns':      return <CrmCampaignsPage />;
      case 'crm-campaign-new':   return <CrmCampaignNewPage />;
      case 'crm-campaign-detail': return <CrmCampaignDetailPage />;
      case 'crm-segment-new':    return <CrmSegmentNewPage />;
      case 'crm-segment-detail': return <CrmSegmentDetailPage />;
      case 'crm-loyalty':        return <CrmLoyaltyPage />;
      case 'crm-referrals':      return <CrmReferralsPage />;
      case 'crm-referral-detail': return <CrmReferralDetailPage />;
      case 'crm-reports':        return <CrmReportsPage />;
      case 'crm-staff-audit':    return <CrmStaffAuditPage />;
      default:                   return <DashboardMain />;
    }
  };

  const content = isCrmView(activeView || 'dashboard') ? (
    renderView()
  ) : (
    <>
      <RestrictedViewRedirect />
      <PermissionGate view={activeView || 'dashboard'}>{renderView()}</PermissionGate>
    </>
  );

  return <DashboardShell>{content}</DashboardShell>;
}

export default function Home() {
  return (
    <AuthProvider>
      <WorkspaceProvider>
        <NavigationProvider>
          <PermissionsProvider>
            <AppContent />
          </PermissionsProvider>
        </NavigationProvider>
      </WorkspaceProvider>
    </AuthProvider>
  );
}
