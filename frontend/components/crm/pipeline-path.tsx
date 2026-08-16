'use client';

import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type PipelinePathProps = {
  stages: string[];
  current: string;
  /** Farthest stage reached — keeps earlier steps colored even if current is moved back. */
  reached?: string;
  /** Stages completed by their underlying workflow, even if still the current deal stage. */
  checked?: string[];
  terminal?: boolean;
  onSelect?: (stage: string) => void;
  /** Always-visible action after the last stage (e.g. Log Call). */
  trailing?: ReactNode;
};

export function PipelinePath({
  stages,
  current,
  reached,
  checked = [],
  terminal = false,
  onSelect,
  trailing,
}: PipelinePathProps) {
  const currentIndex = stages.indexOf(current);
  const reachedIndex = Math.max(currentIndex, stages.indexOf(reached || current));

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max w-full items-center">
        {stages.map((stage, index) => {
          const completed = reachedIndex >= 0 && index < reachedIndex;
          const explicitlyChecked = checked.includes(stage);
          const active = stage === current && !explicitlyChecked;
          const pending = !explicitlyChecked && (reachedIndex < 0 || index > reachedIndex);
          return (
            <div key={stage} className="flex items-center">
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(stage)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                  (completed || explicitlyChecked) &&
                    'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
                  active && !terminal && 'border-primary bg-primary text-primary-foreground',
                  active && terminal && 'border-destructive bg-destructive text-destructive-foreground',
                  pending && !active && 'border-border bg-muted/40 text-muted-foreground',
                  // Reached-but-not-current (e.g. Contact Attempted while editing Assigned)
                  !active &&
                    !completed &&
                    !pending &&
                    index === reachedIndex &&
                    'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
                  onSelect && 'cursor-pointer hover:border-primary'
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full border text-[10px]',
                    (completed || explicitlyChecked || (!active && index === reachedIndex)) &&
                      'border-emerald-600 bg-emerald-600 text-white',
                    active && 'border-current',
                    pending && !active && 'border-muted-foreground/40'
                  )}
                >
                  {completed || explicitlyChecked || (!active && index === reachedIndex) ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    index + 1
                  )}
                </span>
                {stage}
              </button>
              {index < stages.length - 1 ? (
                <div
                  className={cn(
                    'h-0.5 w-5',
                    reachedIndex > index ? 'bg-emerald-500' : 'bg-border'
                  )}
                />
              ) : null}
            </div>
          );
        })}
        {trailing ? (
          <div className="ml-auto flex items-center gap-2 border-l border-border pl-3">{trailing}</div>
        ) : null}
      </div>
    </div>
  );
}
