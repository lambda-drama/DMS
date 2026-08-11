'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

type AddLineButtonProps = {
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
};

/** Frappe-style child-table control: always sits on the next line below items. */
export function AddLineButton({
  onClick,
  label = 'Add',
  className,
  disabled,
}: AddLineButtonProps) {
  return (
    <div className={cn('pt-1', className)}>
      <Button type="button" onClick={onClick} disabled={disabled}>
        <Plus className="h-4 w-4 mr-1" />
        {label}
      </Button>
    </div>
  );
}
