'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Contact,
  FileText,
  Gauge,
  Handshake,
  HeartHandshake,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Phone,
  PhoneCall,
  Target,
  ClipboardCheck,
  Truck,
  Users,
  BarChart3,
  ScrollText,
  Wrench,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { shellTopBarClassName } from '@/lib/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { useNavigation } from '@/contexts/navigation-context';
import { useWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  name: string;
  view: string;
  icon: LucideIcon;
  params?: Record<string, string>;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [{ name: 'Dashboard', view: 'crm-dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'People',
    items: [
      { name: 'Customers', view: 'crm-customers', icon: Users },
      { name: 'Contacts', view: 'crm-contacts', icon: Contact },
      { name: 'Accounts', view: 'crm-accounts', icon: Building2 },
    ],
  },
  {
    title: 'Sales',
    items: [
      { name: 'Leads', view: 'crm-leads', icon: Target },
      { name: 'Deals', view: 'crm-opportunities', icon: Handshake },
      { name: 'Bookings', view: 'crm-bookings', icon: FileText },
      { name: 'Test Drives', view: 'crm-test-drives', icon: Gauge },
      { name: 'Delivery Readiness', view: 'crm-delivery-readiness', icon: ClipboardCheck },
      { name: 'Approvals', view: 'crm-approvals', icon: ClipboardCheck },
      { name: 'Tenders', view: 'crm-tenders', icon: FileText },
    ],
  },
  {
    title: 'Activities',
    items: [
      { name: 'Activities', view: 'crm-activities', icon: PhoneCall },
      { name: 'Calendar', view: 'crm-calendar', icon: CalendarDays },
    ],
  },
  {
    title: 'Call Center',
    items: [
      { name: 'Call Logs', view: 'crm-call-logs', icon: Phone },
      { name: 'Call Center', view: 'crm-call-center', icon: PhoneCall },
    ],
  },
  {
    title: 'Aftersales',
    items: [
      { name: 'Service Retention', view: 'crm-service-retention', icon: HeartHandshake },
      { name: 'Fleet Aftersales', view: 'crm-fleet-aftersales', icon: Truck },
      { name: 'Cases', view: 'crm-cases', icon: CircleHelp },
    ],
  },
  {
    title: 'Marketing',
    items: [
      { name: 'Campaigns', view: 'crm-campaigns', icon: Megaphone },
      { name: 'Loyalty', view: 'crm-loyalty', icon: HeartHandshake },
      { name: 'Referrals', view: 'crm-referrals', icon: Users },
    ],
  },
  {
    title: 'Reports',
    items: [
      {
        name: 'Executive CRM',
        view: 'crm-reports',
        icon: Gauge,
        params: { section: 'crm_executive', report: 'dashboard' },
      },
      {
        name: 'Sales CRM',
        view: 'crm-reports',
        icon: Handshake,
        params: { section: 'crm_sales', report: 'dashboard' },
      },
      {
        name: 'Aftersales CRM',
        view: 'crm-reports',
        icon: Wrench,
        params: { section: 'crm_aftersales', report: 'dashboard' },
      },
      {
        name: 'Call & Campaigns',
        view: 'crm-reports',
        icon: BarChart3,
        params: { section: 'crm_call_campaign', report: 'dashboard' },
      },
      {
        name: 'Staff Audit',
        view: 'crm-staff-audit',
        icon: ScrollText,
      },
    ],
  },
];

const SECTION_VIEWS: Record<string, string[]> = Object.fromEntries(
  navigation.map((section) => [section.title, section.items.map((item) => item.view)])
);

const DEFAULT_OPEN: Record<string, boolean> = {
  Overview: true,
  People: false,
  Sales: true,
  Activities: false,
  'Call Center': false,
  Aftersales: false,
  Marketing: false,
  Reports: false,
};

interface CrmSidebarProps {
  onNavigate?: () => void;
}

export function CrmSidebar({ onNavigate }: CrmSidebarProps) {
  const { user, logout } = useAuth();
  const { viewGroup, viewParams, navigate } = useNavigation();
  const { canViewStaffAudit } = useWorkspace();
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

  const sections = useMemo(() => {
    return navigation.map((section) => {
      if (section.title !== 'Reports') return section;
      return {
        ...section,
        items: section.items.filter(
          (item) => item.view !== 'crm-staff-audit' || canViewStaffAudit
        ),
      };
    });
  }, [canViewStaffAudit]);

  const isItemActive = (item: NavItem) => {
    if (viewGroup !== item.view) return false;
    if (!item.params?.section) return !viewParams.get('section');
    return viewParams.get('section') === item.params.section;
  };

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className={cn(shellTopBarClassName, 'shrink-0 border-b border-sidebar-border px-5')}>
        <div className="flex min-w-0 items-center gap-2">
          <BrandLogo size="sm" variant="default" className="min-w-0" />
          <span className="rounded-md bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-foreground">
            CRM
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain px-3 py-5">
        <nav className="space-y-4">
          {sections.map((section) => {
            const isOpen = sectionOpen[section.title] ?? false;
            return (
              <Collapsible
                key={section.title}
                open={isOpen}
                onOpenChange={(open) =>
                  setSectionOpen((prev) => ({ ...prev, [section.title]: open }))
                }
              >
                <CollapsibleTrigger className="mb-1.5 flex w-full items-center justify-between rounded-md px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 stroke-[1.5] transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = isItemActive(item);
                      return (
                        <a
                          key={`${item.view}-${item.params?.section || item.name}`}
                          href={`#${item.view}${item.params ? `?${new URLSearchParams(item.params)}` : ''}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(item.view, item.params);
                            onNavigate?.();
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-[13px] font-medium tracking-tight transition-all',
                            isActive
                              ? 'border-primary bg-transparent text-foreground'
                              : 'border-transparent text-muted-foreground hover:border-primary hover:bg-primary/10 hover:text-foreground'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-4 w-4 shrink-0 stroke-[1.75]',
                              isActive ? 'text-foreground' : 'text-muted-foreground'
                            )}
                          />
                          {item.name}
                        </a>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>
      </div>

      <Separator className="shrink-0 bg-border" />

      <div className="shrink-0 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-[13px] font-medium tracking-tight text-foreground">
              {user?.full_name || 'User'}
            </p>
            <p className="truncate text-[11px] tracking-tight text-muted-foreground">
              CRM Workspace
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <WorkspaceSwitcher onNavigate={onNavigate} variant="crm" />
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
            onClick={async () => {
              await logout();
              window.location.reload();
            }}
          >
            <LogOut className="h-4 w-4 stroke-[1.5]" />
          </Button>
        </div>
      </div>
    </div>
  );
}
