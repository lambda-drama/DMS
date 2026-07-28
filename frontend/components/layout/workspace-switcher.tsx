'use client';

import { Check, ChevronUp, LayoutGrid, Target, Wrench } from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';
import { useWorkspace, type AppWorkspace } from '@/contexts/workspace-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Props = {
  onNavigate?: () => void;
  className?: string;
  /** Visual variant for DMS vs CRM sidebar chrome */
  variant?: 'dms' | 'crm';
};

const WORKSPACES: Array<{
  id: AppWorkspace;
  label: string;
  description: string;
  icon: typeof Wrench;
  view: string;
}> = [
  {
    id: 'dms',
    label: 'DMS',
    description: 'Workshop & aftersales',
    icon: Wrench,
    view: 'dashboard',
  },
  {
    id: 'crm',
    label: 'DMS CRM',
    description: 'Sales & customer care',
    icon: Target,
    view: 'crm-dashboard',
  },
];

/**
 * Parent “DMS” app switcher — pick DMS or DMS CRM workspace.
 */
export function WorkspaceSwitcher({ onNavigate, className, variant = 'dms' }: Props) {
  const { workspace, setWorkspace } = useWorkspace();
  const { navigate } = useNavigation();

  const active = WORKSPACES.find((w) => w.id === workspace) || WORKSPACES[0];

  const go = (ws: AppWorkspace, view: string) => {
    setWorkspace(ws);
    navigate(view);
    onNavigate?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === 'crm' ? 'outline' : 'ghost'}
          size="sm"
          className={cn(
            'flex-1 justify-between text-[13px] font-medium tracking-tight',
            variant === 'dms' &&
              'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground',
            className
          )}
        >
          <span className="flex min-w-0 items-center gap-2">
            <LayoutGrid className="h-4 w-4 shrink-0 stroke-[1.5]" />
            <span className="truncate">DMS</span>
          </span>
          <ChevronUp className="ml-2 h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-56"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          Switch workspace
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {WORKSPACES.map((item) => {
          const Icon = item.icon;
          const isActive = workspace === item.id;
          return (
            <DropdownMenuItem
              key={item.id}
              className="cursor-pointer gap-2 py-2"
              onClick={() => go(item.id, item.view)}
            >
              <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-sm font-medium leading-tight">{item.label}</span>
                <span className="text-[11px] text-muted-foreground">{item.description}</span>
              </span>
              {isActive ? <Check className="h-4 w-4 shrink-0 text-primary" /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[11px] text-muted-foreground">
          Current: {active.label}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
