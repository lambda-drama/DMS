'use client';

import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/layout/global-search';
import { NotificationBell } from '@/components/layout/notification-bell';
import { UserMenu } from './user-menu';
import { BrandLogo } from '@/components/brand-logo';
import { shellTopBarClassName } from '@/lib/app-shell';
import { cn } from '@/lib/utils';
import { useNavigation } from '@/contexts/navigation-context';

const viewTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  appointments: 'Appointments',
  'appointment-detail': 'Appointment Details',
  'appointment-new': 'New Appointment',
  inspections: 'Vehicle Inspections',
  'inspection-detail': 'Inspection Details',
  'inspection-new': 'New Inspection',
  'service-estimates': 'Service Estimates',
  'estimate-detail': 'Service Estimate',
  'job-cards': 'Job Cards',
  'job-card-detail': 'Job Card Details',
  'job-card-new': 'New Job Card',
  deliveries: 'Vehicle Delivery',
  'delivery-new': 'New Delivery',
  invoices: 'Invoices',
  'invoice-new': 'New Invoice',
  technicians: 'Technicians',
  'technician-detail': 'Technician Details',
  'service-advisors': 'Service Advisors',
  'parts-advisors': 'Parts Advisors',
  customers: 'Customers',
  vehicles: 'Vehicles',
  'vehicle-new': 'New Vehicle',
  reports: 'Reports & Analytics',
  'stock-entry': 'Stock Entry',
  'stock-reconciliation': 'Stock Reconciliation',
  'material-request': 'Material Request',
  'pending-material-requests': 'Pending Material Requests',
  'purchase-receipt': 'Purchase Receipt',
  'spare-part-sales': 'Spare Part Sales',
  'inventory-dashboard': 'Inventory Dashboard',
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { activeView } = useNavigation();
  const title = viewTitles[activeView] || 'Dashboard';

  return (
    <header
      className={cn(
        'sticky top-0 z-30 justify-between gap-2 border-b border-border bg-card px-3 sm:px-4 lg:px-6',
        shellTopBarClassName,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={onMenuClick}
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <BrandLogo size="sm" showText={false} className="shrink-0 lg:hidden" imageClassName="h-8 w-8" />

        <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-3">
        <GlobalSearch />

        <NotificationBell />

        <UserMenu />
      </div>
    </header>
  );
}
