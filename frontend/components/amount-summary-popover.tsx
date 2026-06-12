"use client";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AmountSummaryLine {
  label: string;
  value: string;
  /** Emphasize (e.g. grand total) */
  highlight?: boolean;
  /** Deduction / warranty line */
  deduction?: boolean;
}

interface AmountSummaryPopoverProps {
  lines: AmountSummaryLine[];
  title?: string;
  /** Shown on button hover */
  hint?: string;
}

export function AmountSummaryPopover({
  lines,
  title = "Amounts",
  hint,
}: AmountSummaryPopoverProps) {
  const primary = lines.find((l) => l.highlight) ?? lines[lines.length - 1];

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5"
          title={hint || primary ? `${title}: ${primary?.value}` : title}
          aria-label={title}
        >
          <Banknote className="h-4 w-4" />
          <span className="hidden sm:inline text-xs text-muted-foreground max-w-[5rem] truncate">
            {primary?.value}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="px-4 py-3">
          <p className="text-sm font-medium">{title}</p>
        </div>
        <Separator />
        <div className="space-y-2 px-4 py-3">
          {lines.map((line) => (
            <div key={line.label} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-muted-foreground">{line.label}</span>
              <span
                className={cn(
                  "font-medium tabular-nums",
                  line.highlight && "text-base font-semibold text-primary",
                  line.deduction && "text-orange-600"
                )}
              >
                {line.value}
              </span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
