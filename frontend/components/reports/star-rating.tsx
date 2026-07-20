'use client';

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Parse "4 - Satisfied", 4.2, "Happy", etc. → 0–5. */
export function parseStarRating(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.min(5, value));
  }
  const s = String(value).trim().toLowerCase();
  if (s === 'happy') return 5;
  if (s === 'neutral') return 3;
  if (s === 'unhappy') return 1;
  const m = s.match(/(\d+(?:\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isFinite(n)) return null;
  return Math.max(0, Math.min(5, n));
}

export function isStarRatingField(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k === 'customer_rating_score' ||
    k === 'customer_satisfaction_score' ||
    k === 'csat_score' ||
    k === 'avg_rating' ||
    k === 'csat_actual' ||
    k === 'csat_target' ||
    k === 'csat' ||
    (k.includes('satisfaction') && (k.includes('score') || k.includes('rating')))
  );
}

export function scoreToDeliveryLabel(score: number): 'Happy' | 'Neutral' | 'Unhappy' {
  if (score >= 4) return 'Happy';
  if (score >= 3) return 'Neutral';
  return 'Unhappy';
}

export function StarRating({
  value,
  max = 5,
  size = 'md',
  showValue = true,
  className,
  interactive = false,
  onChange,
}: {
  value: unknown;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  /** Clickable 1–max stars for forms */
  interactive?: boolean;
  onChange?: (score: number) => void;
}) {
  const rating = parseStarRating(value);
  const sizeClass = size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-6 w-6' : 'h-4 w-4';

  if (!interactive && rating == null) {
    return <span className="text-muted-foreground">—</span>;
  }

  const display = rating ?? 0;

  return (
    <span
      className={cn('inline-flex items-center gap-2', className)}
      title={display ? `${display.toFixed(display % 1 ? 1 : 0)} / ${max}` : undefined}
      aria-label={
        interactive
          ? `Select rating out of ${max} stars`
          : `${display.toFixed(1)} out of ${max} stars`
      }
    >
      <span className="inline-flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => {
          const starValue = i + 1;
          const fill = Math.max(0, Math.min(1, display - i));
          const filled = fill > 0;
          if (interactive && onChange) {
            return (
              <button
                key={i}
                type="button"
                className={cn(
                  'rounded p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dms-gold/40',
                  filled ? 'text-dms-gold' : 'text-muted-foreground/40 hover:text-dms-gold/70'
                )}
                aria-label={`${starValue} star${starValue === 1 ? '' : 's'}`}
                aria-pressed={display >= starValue}
                onClick={() => onChange(starValue)}
              >
                <Star
                  className={cn(sizeClass, filled && 'fill-dms-gold')}
                  strokeWidth={1.5}
                />
              </button>
            );
          }
          return (
            <span key={i} className="relative inline-flex">
              <Star className={cn(sizeClass, 'text-muted-foreground/35')} strokeWidth={1.5} />
              {fill > 0 && (
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: `${fill * 100}%` }}
                >
                  <Star
                    className={cn(sizeClass, 'fill-dms-gold text-dms-gold')}
                    strokeWidth={1.5}
                  />
                </span>
              )}
            </span>
          );
        })}
      </span>
      {showValue && (
        <span className="tabular-nums text-sm font-semibold text-foreground">
          {display ? (display % 1 === 0 ? display.toFixed(0) : display.toFixed(1)) : '—'}
          <span className="font-normal text-muted-foreground"> / {max}</span>
        </span>
      )}
    </span>
  );
}
