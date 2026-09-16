'use client';

import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ClearDateFiltersButtonProps = {
  /** Resets the date filters to their empty/default values. */
  onClear: () => void;
  /** Disables the action when no date filter is currently applied. */
  disabled?: boolean;
  /** Text shown next to the icon from the `sm` breakpoint up. */
  label?: string;
  className?: string;
};

/**
 * Clear button for date filters.
 *
 * Small screens only get the icon so the filter row stays compact; from the
 * `sm` breakpoint up the label is shown next to the icon.
 */
export function ClearDateFiltersButton({
  onClear,
  disabled = false,
  label = 'Clear filters',
  className,
}: ClearDateFiltersButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClear}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn('h-9 shrink-0 gap-1.5 text-muted-foreground', className)}
    >
      <X aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
}
