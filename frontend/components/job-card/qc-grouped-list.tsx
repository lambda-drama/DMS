"use client";

import { Badge } from "@/components/ui/badge";
import type { JobCardQCResult } from "@/types/dms";
import { groupQCResultsBySection } from "./qc-utils";

export function QCSectionHeader({
  title,
  count,
}: {
  title: string;
  count?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-primary/25 bg-primary/10 px-3 py-1.5 dark:border-sky-400/40 dark:bg-sky-400/20">
      <h4 className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary dark:text-sky-300">
        {title}
      </h4>
      {count ? (
        <span className="text-[11px] tabular-nums text-primary/70 dark:text-sky-300/70">
          {count}
        </span>
      ) : null}
    </div>
  );
}

function resultBadgeVariant(result?: string) {
  if (result === "Pass") return "default" as const;
  if (result === "Fail") return "destructive" as const;
  return "secondary" as const;
}

function resultLabel(result?: string) {
  if (result === "Pass") return "OK";
  if (result === "Fail") return "NOT OK";
  return result || "—";
}

interface QCResultsGroupedListProps {
  rows: JobCardQCResult[];
}

export function QCResultsGroupedList({ rows }: QCResultsGroupedListProps) {
  const groups = groupQCResultsBySection(rows);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <div key={group.section} className="overflow-hidden rounded-lg border">
          <QCSectionHeader title={group.section} />
          <div className="divide-y divide-border/60">
            {group.items.map(({ row, index }) => (
              <div
                key={row.name || `qc-${index}`}
                className="flex items-start justify-between gap-3 px-3 py-1.5"
              >
                <p className="text-[13px] font-normal leading-snug text-muted-foreground">
                  {row.check_item_text || "—"}
                </p>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge variant={resultBadgeVariant(row.result)}>
                    {resultLabel(row.result)}
                  </Badge>
                  {row.notes ? (
                    <p className="max-w-[180px] text-right text-xs text-muted-foreground">
                      {row.notes}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
