'use client';

import { cn } from '@/lib/utils';

/**
 * Shows a scrollable table on md+ and card list on smaller screens.
 */
export function ResponsiveDataView({
  table,
  mobile,
  className,
  empty,
  isLoading,
}: {
  table: React.ReactNode;
  mobile: React.ReactNode;
  className?: string;
  empty?: React.ReactNode;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (empty) {
    return <>{empty}</>;
  }

  return (
    <div className={cn('min-w-0', className)}>
      <div className="md:hidden space-y-3">{mobile}</div>
      <div className="hidden md:block dms-table-panel">{table}</div>
    </div>
  );
}
