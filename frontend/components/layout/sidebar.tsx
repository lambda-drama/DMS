'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  Car,
  ChevronDown,
  ClipboardCheck,
  FileSpreadsheet,
  FileText,
  HardHat,
  Headphones,
  LayoutDashboard,
  LogOut,
  Settings,
  Truck,
  Users,
  Wrench,
  Package,
  ArrowDownUp,
  ClipboardList,
  PackageCheck,
  ShoppingCart,
  Boxes,
  Clock,
  PackagePlus,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { shellTopBarClassName } from '@/lib/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const navigation = [
  {
    title: 'Overview',
    items: [
      { name: 'Dashboard', view: 'dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Workshop',
    items: [
      { name: 'Appointments', view: 'appointments', icon: Calendar },
      { name: 'Inspections', view: 'inspections', icon: ClipboardCheck },
      { name: 'Service Estimates', view: 'service-estimates', icon: FileSpreadsheet },
      { name: 'Job Cards', view: 'job-cards', icon: Wrench },
      { name: 'Parts Requisition', view: 'parts-requisitions', icon: Package },
      { name: 'Technicians', view: 'technicians', icon: HardHat },
      { name: 'Delivery', view: 'deliveries', icon: Truck },
    ],
  },
  {
    title: 'Management',
    items: [
      { name: 'Customers', view: 'customers', icon: Users },
      { name: 'Vehicles', view: 'vehicles', icon: Car },
      { name: 'Invoices', view: 'invoices', icon: FileText },
      { name: 'Reports', view: 'reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Master',
    items: [
      { name: 'Service Advisors', view: 'service-advisors', icon: Headphones },
      { name: 'Parts Advisors', view: 'parts-advisors', icon: Users },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { name: 'Inventory Dashboard', view: 'inventory-dashboard', icon: Boxes },
      { name: 'Stock Entry', view: 'stock-entry', icon: ArrowDownUp },
      { name: 'Stock Reconciliation', view: 'stock-reconciliation', icon: ClipboardList },
      { name: 'Material Request', view: 'material-request', icon: PackagePlus },
      { name: 'Pending Requests', view: 'pending-material-requests', icon: Clock },
      { name: 'Purchase Receipt', view: 'purchase-receipt', icon: PackageCheck },
      { name: 'Spare Part Sales', view: 'spare-part-sales', icon: ShoppingCart },
      { name: 'Proforma Invoices', view: 'proforma-invoices', icon: FileText },
    ],
  },
];

const SECTION_VIEWS: Record<string, string[]> = Object.fromEntries(
  navigation.map((section) => [section.title, section.items.map((item) => item.view)])
);

const DEFAULT_OPEN: Record<string, boolean> = {
  Overview: true,
  Workshop: true,
  Management: true,
  Master: false,
  Inventory: false,
};

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { viewGroup, navigate } = useNavigation();
  const { canAccessView } = usePermissions();
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>(DEFAULT_OPEN);

  useEffect(() => {
    setSectionOpen((prev) => {
      const next = { ...prev };
      for (const [title, views] of Object.entries(SECTION_VIEWS)) {
        if (views.includes(viewGroup)) {
          next[title] = true;
        }
      }
      return next;
    });
  }, [viewGroup]);

  const visibleSections = useMemo(
    () =>
      navigation
        .map((section) => ({
          ...section,
          items: section.items.filter((item) => canAccessView(item.view)),
        }))
        .filter((section) => section.items.length > 0),
    [canAccessView]
  );

  const handleSectionOpenChange = (title: string, open: boolean) => {
    setSectionOpen((prev) => ({ ...prev, [title]: open }));
  };

  const renderNavItems = (
    items: (typeof navigation)[number]['items']
  ) => (
    <div className="space-y-0.5">
      {items.map((item) => {
        const isActive = viewGroup === item.view;
        return (
          <a
            key={item.name}
            href={`#${item.view}`}
            onClick={(e) => {
              e.preventDefault();
              navigate(item.view);
              onNavigate?.();
            }}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-[13px] font-medium tracking-tight transition-all',
              isActive
                ? 'border-dms-gold bg-sidebar-accent text-sidebar-accent-foreground'
                : 'border-transparent text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <item.icon
              className={cn(
                'h-4 w-4 shrink-0 stroke-[1.5]',
                isActive ? 'text-dms-gold' : 'opacity-65'
              )}
            />
            {item.name}
          </a>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Logo — same height as top navbar */}
      <div className={cn(shellTopBarClassName, 'shrink-0 border-b border-sidebar-border px-6')}>
        <BrandLogo size="sm" variant="sidebar" className="min-w-0" />
      </div>

      {/* Navigation — scrolls independently; logo and user footer stay pinned */}
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-5">
        <nav className="space-y-5">
          {visibleSections.map((section) => {
            const isOpen = sectionOpen[section.title] ?? false;
            return (
              <Collapsible
                key={section.title}
                open={isOpen}
                onOpenChange={(open) => handleSectionOpenChange(section.title, open)}
              >
                <CollapsibleTrigger className="mb-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-sidebar-foreground/45 hover:text-sidebar-foreground/70">
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 stroke-[1.5] transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
                  {renderNavItems(section.items)}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </div>

      <Separator className="shrink-0 bg-sidebar-border" />

      {/* User Section */}
      <div className="shrink-0 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium tracking-tight">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-[13px] font-medium tracking-tight">{user?.full_name || 'User'}</p>
            <p className="truncate text-[11px] tracking-tight text-sidebar-foreground/45">
              {user?.email || user?.name || ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canAccessView('settings') ? (
            <Button
              variant="ghost"
              size="sm"
              className="flex-1 justify-start text-[13px] font-medium tracking-tight text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              onClick={() => navigate('settings')}
            >
              <Settings className="mr-2 h-4 w-4 stroke-[1.5]" />
              Settings
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={async () => { await logout(); window.location.reload(); }}
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
