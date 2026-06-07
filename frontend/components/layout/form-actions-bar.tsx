'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

interface FormActionsBarProps {
  children: React.ReactNode;
  className?: string;
  /** Space buttons apart (e.g. Previous left, Submit right). Default: end-aligned. */
  align?: 'end' | 'between';
}

/**
 * Fixed footer for form Cancel / Create / Submit actions.
 * Pair with `dms-form-page` on the scrollable page wrapper so content is not hidden.
 */
export function FormActionsBar({ children, className, align = 'end' }: FormActionsBarProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const bar = (
    <div
      role="toolbar"
      aria-label="Form actions"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 shadow-[0_-4px_24px_rgba(15,61,94,0.08)] backdrop-blur-md supports-[backdrop-filter]:bg-card/90',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3',
        'lg:left-64',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto w-full max-w-[1600px] px-3 sm:px-4 lg:px-6',
          align === 'between'
            ? 'grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3'
            : 'flex flex-wrap items-center justify-end gap-2 sm:gap-3',
        )}
      >
        {children}
      </div>
    </div>
  );

  if (!mounted) {
    return null;
  }

  return createPortal(bar, document.body);
}
