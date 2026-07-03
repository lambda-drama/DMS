'use client';

import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { NavigationProvider, useNavigation } from '@/contexts/navigation-context';
import { PermissionsProvider, usePermissions } from '@/contexts/permissions-context';
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
const TechniciansPage = dynamic(() => import('./(dashboard)/dashboard/technicians/page'));
const TechnicianDetailPage = dynamic(() => import('./(dashboard)/dashboard/technicians/detail/page'));
const ServiceAdvisorsPage = dynamic(() => import('./(dashboard)/dashboard/service-advisors/page'));
const PartsAdvisorsPage = dynamic(() => import('./(dashboard)/dashboard/parts-advisors/page'));
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
const InventoryDashboardPage = dynamic(() => import('./(dashboard)/dashboard/inventory/page'));
const SettingsPage = dynamic(() => import('./(dashboard)/dashboard/settings/page'));

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
  'service-advisors',
  'parts-advisors',
  'inventory-dashboard',
  'stock-entry',
  'stock-reconciliation',
  'material-request',
  'pending-material-requests',
  'purchase-receipt',
  'spare-part-sales',
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
      case 'technicians':        return <TechniciansPage />;
      case 'technician-detail':  return <TechnicianDetailPage />;
      case 'service-advisors':   return <ServiceAdvisorsPage />;
      case 'parts-advisors':     return <PartsAdvisorsPage />;
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
      case 'inventory-dashboard': return <InventoryDashboardPage />;
      case 'settings':           return <SettingsPage />;
      default:                   return <DashboardMain />;
    }
  };

  return (
    <DashboardShell>
      <RestrictedViewRedirect />
      <PermissionGate view={activeView || 'dashboard'}>{renderView()}</PermissionGate>
    </DashboardShell>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <PermissionsProvider>
          <AppContent />
        </PermissionsProvider>
      </NavigationProvider>
    </AuthProvider>
  );
}
