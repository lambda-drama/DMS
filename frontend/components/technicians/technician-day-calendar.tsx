"use client";

import type { TechnicianDayCalendar } from "@/types/dms";

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 18;
const TOTAL_MINUTES = (DAY_END_HOUR - DAY_START_HOUR) * 60;

function parseMinutes(iso?: string | null): number | null {
  if (!iso) return null;
  const d = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

function topAndHeight(startMin: number, endMin: number) {
  const clampedStart = Math.max(startMin, DAY_START_HOUR * 60);
  const clampedEnd = Math.min(endMin, DAY_END_HOUR * 60);
  if (clampedEnd <= clampedStart) return null;
  const top = ((clampedStart - DAY_START_HOUR * 60) / TOTAL_MINUTES) * 100;
  const height = ((clampedEnd - clampedStart) / TOTAL_MINUTES) * 100;
  return { top: `${top}%`, height: `${Math.max(height, 4)}%` };
}

function formatHourLabel(hour: number) {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h} ${ampm}`;
}

interface TechnicianDayCalendarProps {
  calendar?: TechnicianDayCalendar;
  dateLabel?: string;
  compact?: boolean;
}

export function TechnicianDayCalendarView({
  calendar,
  dateLabel,
  compact = false,
}: TechnicianDayCalendarProps) {
  const hours = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR + 1 },
    (_, i) => DAY_START_HOUR + i
  );

  return (
    <div className="space-y-2">
      {dateLabel && (
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {dateLabel}
        </p>
      )}
      <div className={`relative rounded-lg border bg-muted/20 ${compact ? "h-48" : "h-64"}`}>
        {hours.map((hour, idx) => (
          <div
            key={hour}
            className="absolute left-0 right-0 border-t border-border/50 flex"
            style={{ top: `${(idx / (hours.length - 1)) * 100}%` }}
          >
            <span className="w-12 shrink-0 pl-1 text-[10px] text-muted-foreground -translate-y-1.5">
              {formatHourLabel(hour)}
            </span>
          </div>
        ))}
        <div className="absolute left-12 right-2 top-0 bottom-0">
          {(calendar?.free_slots || []).map((slot, i) => {
            const start = parseMinutes(slot.start);
            const end = parseMinutes(slot.end);
            if (start == null || end == null) return null;
            const pos = topAndHeight(start, end);
            if (!pos) return null;
            return (
              <div
                key={`free-${i}`}
                className="absolute left-0 right-0 rounded bg-green-500/15 border border-green-500/30"
                style={pos}
                title="Available"
              />
            );
          })}
          {(calendar?.blocks || []).map((block, i) => {
            const start = parseMinutes(block.start);
            const end = parseMinutes(block.end);
            if (start == null || end == null) return null;
            const pos = topAndHeight(start, end);
            if (!pos) return null;
            const isBusy = block.kind === "in_progress";
            return (
              <div
                key={`block-${block.job_card}-${i}`}
                className={`absolute left-0 right-0 rounded px-1 py-0.5 text-[10px] overflow-hidden border ${
                  isBusy
                    ? "bg-amber-500/25 border-amber-500/50 text-amber-950 dark:text-amber-100"
                    : "bg-primary/20 border-primary/40"
                }`}
                style={pos}
                title={`${block.job_card} — ${block.status}`}
              >
                <span className="font-medium truncate block">{block.job_card}</span>
                {!compact && block.customer_name && (
                  <span className="truncate block opacity-80">{block.customer_name}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-green-500/30 border border-green-500/50" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-primary/30 border border-primary/40" />
          Scheduled
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded bg-amber-500/30 border border-amber-500/50" />
          In progress
        </span>
      </div>
    </div>
  );
}
