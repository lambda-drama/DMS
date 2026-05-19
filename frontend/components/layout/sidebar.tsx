'use client';

import { cn } from '@/lib/utils';
import {
  BarChart3,
  Calendar,
  Car,
  ClipboardCheck,
  FileText,
  HardHat,
  Headphones,
  LayoutDashboard,
  LogOut,
  Settings,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

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
      { name: 'Job Cards', view: 'job-cards', icon: Wrench },
      { name: 'Technicians', view: 'technicians', icon: HardHat },
      { name: 'Service Advisors', view: 'service-advisors', icon: Headphones },
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
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth();
  const { viewGroup, navigate } = useNavigation();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar text-sidebar-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Car className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">AutoService</span>
          <span className="text-xs text-sidebar-foreground/70">DMS</span>
        </div>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-6">
          {navigation.map((section) => (
            <div key={section.title}>
              <p className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => {
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
            </div>
          ))}
        </nav>
      </ScrollArea>

      <Separator className="bg-sidebar-border" />

      {/* User Section */}
      <div className="p-4">
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
