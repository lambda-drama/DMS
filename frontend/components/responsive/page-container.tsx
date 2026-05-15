'use client';

import { cn } from '@/lib/utils';

/** Constrains page content to viewport width and prevents horizontal bleed. */
export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto w-full min-w-0 max-w-[1600px] space-y-4 sm:space-y-6', className)}>
      {children}
    </div>
  );
}
