'use client';

import { cn } from '@/lib/utils';

/** Search + filters row — stacks on phones, inline on larger screens. */
export function ListToolbar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center', className)}>
      {children}
    </div>
  );
}

export function ListToolbarSearch({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn('relative w-full min-w-0 flex-1 sm:min-w-[200px]', className)}>{children}</div>;
}

export function ListToolbarFilters({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex w-full flex-col gap-2 sm:flex-row sm:w-auto sm:flex-wrap', className)}>
      {children}
    </div>
  );
}
