'use client';

import { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { shellTopBarClassName } from '@/lib/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const COLLAPSIBLE_SECTION_VIEWS: Record<string, string[]> = {
  Master: ['service-advisors', 'parts-advisors'],
  Inventory: [
    'inventory-dashboard',
    'stock-entry',
    'stock-reconciliation',
    'purchase-receipt',
    'spare-part-sales',
  ],
};

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
    collapsible: true,
    items: [
      { name: 'Service Advisors', view: 'service-advisors', icon: Headphones },
      { name: 'Parts Advisors', view: 'parts-advisors', icon: Users },
    ],
  },
  {
    title: 'Inventory',
    collapsible: true,
    items: [
      { name: 'Inventory Dashboard', view: 'inventory-dashboard', icon: Boxes },
      { name: 'Stock Entry', view: 'stock-entry', icon: ArrowDownUp },
      { name: 'Stock Reconciliation', view: 'stock-reconciliation', icon: ClipboardList },
      { name: 'Purchase Receipt', view: 'purchase-receipt', icon: PackageCheck },
      { name: 'Spare Part Sales', view: 'spare-part-sales', icon: ShoppingCart },
    ],
  },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { viewGroup, navigate } = useNavigation();
  const { canAccessView } = usePermissions();
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    Master: false,
    Inventory: false,
  });

  useEffect(() => {
    setSectionOpen((prev) => {
      const next = { ...prev };
      for (const [title, views] of Object.entries(COLLAPSIBLE_SECTION_VIEWS)) {
        if (views.includes(viewGroup)) {
          next[title] = true;
        }
      }
      return next;
    });
  }, [viewGroup]);

  const handleSectionOpenChange = (title: string, open: boolean) => {
    setSectionOpen((prev) => ({ ...prev, [title]: open }));
  };

  const renderNavItems = (
    items: (typeof navigation)[number]['items']
  ) => (
    <div className="space-y-1">
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
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            )}
          >
            <item.icon className="h-4 w-4" />
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
      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-4">
        <nav className="space-y-6">
          {navigation
            .map((section) => ({
              ...section,
              items: section.items.filter((item) => canAccessView(item.view)),
            }))
            .filter((section) => section.items.length > 0)
            .map((section) => (
            <div key={section.title}>
              {'collapsible' in section && section.collapsible ? (
                <Collapsible
                  open={sectionOpen[section.title] ?? false}
                  onOpenChange={(open) => handleSectionOpenChange(section.title, open)}
                >
                  <CollapsibleTrigger className="mb-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/80">
                    <span>{section.title}</span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        sectionOpen[section.title] && 'rotate-180'
                      )}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden">
                    {renderNavItems(section.items)}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <>
                  <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                    {section.title}
                  </p>
                  {renderNavItems(section.items)}
                </>
              )}
            </div>
          ))}
        </nav>
      </div>

      <Separator className="shrink-0 bg-sidebar-border" />

      {/* User Section */}
      <div className="shrink-0 p-4">
        <div className="mb-3 flex items-center gap-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-sm font-medium">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-medium">{user?.full_name || 'User'}</p>
            <p className="truncate text-xs text-sidebar-foreground/50">{user?.email || user?.name || ''}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={() => navigate('settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            onClick={async () => { await logout(); window.location.reload(); }}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
