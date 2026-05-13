'use client';

import { AuthProvider, useAuth } from '@/contexts/auth-context';
import { NavigationProvider, useNavigation } from '@/contexts/navigation-context';
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
const JobCardsPage = dynamic(() => import('./(dashboard)/dashboard/job-cards/page'));
const JobCardDetailPage = dynamic(() => import('./(dashboard)/dashboard/job-cards/detail/page'));
const JobCardNewPage = dynamic(() => import('./(dashboard)/dashboard/job-cards/new/page'));
const DeliveriesPage = dynamic(() => import('./(dashboard)/dashboard/deliveries/page'));
const DeliveryNewPage = dynamic(() => import('./(dashboard)/dashboard/deliveries/new/page'));
const InvoicesPage = dynamic(() => import('./(dashboard)/dashboard/invoices/page'));
const InvoiceNewPage = dynamic(() => import('./(dashboard)/dashboard/invoices/new/page'));
const TechniciansPage = dynamic(() => import('./(dashboard)/dashboard/technicians/page'));
const TechnicianDetailPage = dynamic(() => import('./(dashboard)/dashboard/technicians/detail/page'));
const CustomersPage = dynamic(() => import('./(dashboard)/dashboard/customers/page'));
const VehiclesPage = dynamic(() => import('./(dashboard)/dashboard/vehicles/page'));
const VehicleNewPage = dynamic(() => import('./(dashboard)/dashboard/vehicles/new/page'));

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
      case 'job-cards':          return <JobCardsPage />;
      case 'job-card-detail':    return <JobCardDetailPage />;
      case 'job-card-new':       return <JobCardNewPage />;
      case 'deliveries':         return <DeliveriesPage />;
      case 'delivery-new':       return <DeliveryNewPage />;
      case 'invoices':           return <InvoicesPage />;
      case 'invoice-new':        return <InvoiceNewPage />;
      case 'technicians':        return <TechniciansPage />;
      case 'technician-detail':  return <TechnicianDetailPage />;
      case 'customers':          return <CustomersPage />;
      case 'vehicles':           return <VehiclesPage />;
      case 'vehicle-new':        return <VehicleNewPage />;
      default:                   return <DashboardMain />;
    }
  };

  return (
    <DashboardShell>
      {renderView()}
    </DashboardShell>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <NavigationProvider>
        <AppContent />
      </NavigationProvider>
    </AuthProvider>
  );
}
