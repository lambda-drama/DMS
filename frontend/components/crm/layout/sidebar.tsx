'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  CircleHelp,
  Contact,
  Handshake,
  LayoutDashboard,
  LogOut,
  Megaphone,
  PhoneCall,
  Target,
  Users,
} from 'lucide-react';
import { BrandLogo } from '@/components/brand-logo';
import { WorkspaceSwitcher } from '@/components/layout/workspace-switcher';
import { shellTopBarClassName } from '@/lib/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { LucideIcon } from 'lucide-react';

type NavItem = {
  name: string;
  view: string;
  icon: LucideIcon;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const navigation: NavSection[] = [
  {
    title: 'Main Menu',
    items: [
      { name: 'Overview', view: 'crm-dashboard', icon: LayoutDashboard },
      { name: 'Customers', view: 'crm-customers', icon: Users },
      { name: 'Deals', view: 'crm-opportunities', icon: Handshake },
      { name: 'Contacts', view: 'crm-contacts', icon: Contact },
      { name: 'Leads', view: 'crm-leads', icon: Target },
      { name: 'Activities', view: 'crm-activities', icon: PhoneCall },
      { name: 'Appointments', view: 'appointments', icon: Calendar },
      { name: 'Calendar', view: 'crm-calendar', icon: CalendarDays },
      { name: 'Cases', view: 'crm-cases', icon: CircleHelp },
      { name: 'Campaigns', view: 'crm-dashboard', icon: Megaphone },
    ],
  },
];

interface CrmSidebarProps {
  onNavigate?: () => void;
}

export function CrmSidebar({ onNavigate }: CrmSidebarProps) {
  const { user, logout } = useAuth();
  const { viewGroup, navigate } = useNavigation();
  const [sectionOpen, setSectionOpen] = useState<Record<string, boolean>>({
    'Main Menu': true,
  });

  useEffect(() => {
    setSectionOpen((prev) => ({ ...prev, 'Main Menu': true }));
  }, [viewGroup]);

  const sections = useMemo(() => navigation, []);

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
        <nav className="space-y-5">
          {sections.map((section) => {
            const isOpen = sectionOpen[section.title] ?? true;
            return (
              <Collapsible
                key={section.title}
                open={isOpen}
                onOpenChange={(open) =>
                  setSectionOpen((prev) => ({ ...prev, [section.title]: open }))
                }
              >
                <CollapsibleTrigger className="mb-2 flex w-full items-center justify-between rounded-md px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground">
                  <span>{section.title}</span>
                  <ChevronDown
                    className={cn(
                      'h-3.5 w-3.5 stroke-[1.5] transition-transform',
                      isOpen && 'rotate-180'
                    )}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const isActive = viewGroup === item.view;
                      return (
                        <a
                          key={`${item.view}-${item.name}`}
                          href={`#${item.view}`}
                          onClick={(e) => {
                            e.preventDefault();
                            navigate(item.view);
                            onNavigate?.();
                          }}
                          className={cn(
                            'flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-[13px] font-medium tracking-tight transition-all',
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
