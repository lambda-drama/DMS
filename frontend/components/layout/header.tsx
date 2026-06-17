'use client';

import { Bell, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/layout/global-search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from './user-menu';
import { BrandLogo } from '@/components/brand-logo';
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
  'purchase-receipt': 'Purchase Receipt',
  'spare-part-sales': 'Spare Part Sales',
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { activeView } = useNavigation();
  const title = viewTitles[activeView] || 'Dashboard';

  return (
    <header className="sticky top-0 z-30 flex min-h-[calc(3.5rem+env(safe-area-inset-top,0px))] shrink-0 items-center justify-between gap-2 border-b border-border bg-card px-3 pt-[env(safe-area-inset-top,0px)] sm:min-h-[calc(4rem+env(safe-area-inset-top,0px))] sm:px-4 lg:px-6">
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

        <UserMenu />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative hidden sm:inline-flex">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">New Appointment</span>
              <span className="text-sm text-muted-foreground">
                Customer John Doe booked an appointment for tomorrow
              </span>
              <span className="text-xs text-muted-foreground">2 minutes ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Job Card Completed</span>
              <span className="text-sm text-muted-foreground">
                JC-2026-00045 is ready for QC
              </span>
              <span className="text-xs text-muted-foreground">15 minutes ago</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3">
              <span className="font-medium">Parts Arrived</span>
              <span className="text-sm text-muted-foreground">
                Parts for JC-2026-00042 have been received
              </span>
              <span className="text-xs text-muted-foreground">1 hour ago</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="justify-center text-primary">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
