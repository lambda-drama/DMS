"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";
import type { DMSJobCard } from "@/types/dms";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/** Parse Frappe datetime strings reliably across browsers. */
export function parseFrappeDatetime(value?: string): number {
  if (!value) return NaN;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  return new Date(normalized).getTime();
}

function getActiveRepairSeconds(timeLogs: DMSJobCard["time_logs"]): number {
  const openLogs = (timeLogs || []).filter((l) => l.start_time && !l.end_time);
  if (openLogs.length === 0) return 0;

  const now = Date.now();
  return openLogs.reduce((total, log) => {
    const start = parseFrappeDatetime(log.start_time);
    if (Number.isNaN(start)) return total;
    return total + Math.max(0, Math.floor((now - start) / 1000));
  }, 0);
}

export function RepairTimer({ jobCard }: { jobCard: DMSJobCard }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (jobCard.status !== "Repair In Progress") {
      setElapsed(0);
      return;
    }

    const tick = () => setElapsed(getActiveRepairSeconds(jobCard.time_logs));
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [jobCard.status, jobCard.time_logs]);

  if (jobCard.status !== "Repair In Progress") return null;

  const openCount = (jobCard.time_logs || []).filter((l) => l.start_time && !l.end_time).length;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10 animate-pulse">
          <Timer className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Repair Timer</p>
          <p className="text-2xl font-mono font-bold text-primary">{formatDuration(elapsed)}</p>
          {openCount === 0 && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              No active time log — start or resume repair to begin timing.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
