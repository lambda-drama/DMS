'use client';

import { Plus } from 'lucide-react';
import { usePermissions } from '@/contexts/permissions-context';
import type { DmsPermissionModule } from '@/lib/dms-permissions';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PermittedCreateButtonProps extends ButtonProps {
  module: DmsPermissionModule;
  /** Shown from `sm` up; mobile shows + only (with aria-label). */
  label: string;
}

/** Create button hidden without DocPerm create; + only on small screens. */
export function PermittedCreateButton({
  module,
  label,
  className,
  ...props
}: PermittedCreateButtonProps) {
  const { canCreate } = usePermissions();
  if (!canCreate(module)) return null;

  return (
    <Button
      aria-label={label}
      title={label}
      className={cn(
        'h-9 w-9 shrink-0 p-0 sm:h-10 sm:w-auto sm:px-4 sm:py-2',
        className
      )}
      {...props}
    >
      <Plus className="h-4 w-4 shrink-0" />
      <span className="hidden sm:inline sm:ml-2">{label}</span>
    </Button>
  );
}
