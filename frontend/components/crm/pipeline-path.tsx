'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type PipelinePathProps = {
  stages: string[];
  current: string;
  terminal?: boolean;
  onSelect?: (stage: string) => void;
};

export function PipelinePath({ stages, current, terminal = false, onSelect }: PipelinePathProps) {
  const currentIndex = stages.indexOf(current);

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-center">
        {stages.map((stage, index) => {
          const completed = currentIndex >= 0 && index < currentIndex;
          const active = stage === current;
          const pending = currentIndex < 0 || index > currentIndex;
          return (
            <div key={stage} className="flex items-center">
              <button
                type="button"
                disabled={!onSelect}
                onClick={() => onSelect?.(stage)}
                className={cn(
                  'flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition-colors',
                  completed && 'border-emerald-500/40 bg-emerald-500/15 text-emerald-700',
                  active && !terminal && 'border-primary bg-primary text-primary-foreground',
                  active && terminal && 'border-destructive bg-destructive text-destructive-foreground',
                  pending && 'border-border bg-muted/40 text-muted-foreground',
                  onSelect && 'cursor-pointer hover:border-primary'
                )}
              >
                <span
                  className={cn(
                    'grid h-5 w-5 place-items-center rounded-full border text-[10px]',
                    completed && 'border-emerald-600 bg-emerald-600 text-white',
                    active && 'border-current',
                    pending && 'border-muted-foreground/40'
                  )}
                >
                  {completed ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                {stage}
              </button>
              {index < stages.length - 1 ? (
                <div
                  className={cn(
                    'h-0.5 w-5',
                    currentIndex > index ? 'bg-emerald-500' : 'bg-border'
                  )}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
