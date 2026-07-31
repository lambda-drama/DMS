'use client';

import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CrmFeedbackState = {
  error: string;
  success: string;
  showError: (message: unknown, fallback?: string) => string;
  showSuccess: (message: string) => void;
  clear: () => void;
};

function toMessage(value: unknown, fallback: string): string {
  const raw =
    value instanceof Error ? value.message : typeof value === 'string' ? value : '';
  const text = raw
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
  return text || fallback;
}

/** The app shell scrolls inside <main>, so bring that container back to the banner. */
function scrollShellToTop() {
  if (typeof document === 'undefined') return;
  document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Single feedback channel for CRM forms: an inline banner pinned to the top of the
 * page plus a toast, so failures stay visible no matter where the page is scrolled.
 */
export function useCrmFeedback(): CrmFeedbackState {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const showError = useCallback((message: unknown, fallback = 'Something went wrong.') => {
    const text = toMessage(message, fallback);
    setSuccess('');
    setError(text);
    toast.error(text, { duration: 8000 });
    scrollShellToTop();
    return text;
  }, []);

  const showSuccess = useCallback((message: string) => {
    setError('');
    setSuccess(message);
    toast.success(message);
  }, []);

  const clear = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  return { error, success, showError, showSuccess, clear };
}

type CrmFeedbackProps = {
  error?: string;
  success?: string;
  onDismiss?: () => void;
  className?: string;
};

export function CrmFeedback({ error, success, onDismiss, className }: CrmFeedbackProps) {
  if (!error && !success) return null;
  const isError = Boolean(error);

  return (
    <div className={cn('sticky top-0 z-40 -mx-1 px-1 pt-1', className)}>
      <div
        role={isError ? 'alert' : 'status'}
        aria-live={isError ? 'assertive' : 'polite'}
        className={cn(
          'flex items-start gap-2 rounded-xl border p-3 text-sm shadow-sm backdrop-blur',
          isError
            ? 'border-destructive/40 bg-destructive/10 text-destructive'
            : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700'
        )}
      >
        {isError ? (
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <p className="flex-1 whitespace-pre-wrap break-words">{error || success}</p>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
