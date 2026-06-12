"use client";

import { cn } from "@/lib/utils";
import {
  PARTS_REQUEST_FLOW_STEPS,
  partsRequestFlowProgress,
} from "@/lib/parts-request-flow";

interface PartsRequestFlowProgressProps {
  status: string;
  onOpen?: () => void;
  compact?: boolean;
}

export function PartsRequestFlowProgress({
  status,
  onOpen,
  compact = false,
}: PartsRequestFlowProgressProps) {
  if (status === "Cancelled") {
    if (!onOpen) {
      return <span className="text-sm text-muted-foreground">Cancelled</span>;
    }
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-sm text-muted-foreground hover:text-primary hover:underline"
      >
        Cancelled
      </button>
    );
  }

  const { completedThrough, current } = partsRequestFlowProgress(status);

  const bar = (
    <div
      className={cn("flex items-center gap-0.5", compact ? "min-w-[160px]" : "min-w-[200px]")}
      title={status}
    >
      {PARTS_REQUEST_FLOW_STEPS.map((step, index) => (
        <div key={step.key} className="flex flex-col items-center">
          <div
            className={cn(
              "rounded-full transition-colors",
              compact ? "h-1.5 w-4" : "h-1.5 w-5",
              index <= completedThrough
                ? index === current
                  ? "bg-primary"
                  : "bg-primary/60"
                : "bg-muted"
            )}
          />
          <span
            className={cn(
              "leading-tight mt-0.5",
              compact ? "text-[8px]" : "text-[9px]",
              index === current
                ? "text-primary font-semibold"
                : index < completedThrough
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  );

  if (!onOpen) return bar;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-md p-1 -m-1 text-left transition-colors hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      title="Open parts requisition to continue workflow"
    >
      {bar}
    </button>
  );
}
