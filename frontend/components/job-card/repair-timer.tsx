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

function isActiveEndTime(endTime?: string | null): boolean {
  if (!endTime) return false;
  if (endTime.startsWith("0000-00-00")) return false;
  return true;
}

export function isOpenTimeLog(log: NonNullable<DMSJobCard["time_logs"]>[number]): boolean {
  return Boolean(log.start_time) && !isActiveEndTime(log.end_time);
}

export type RepairTimerState = {
  offsetSeconds: number;
  startedAtMs: number | null;
};

function timerStorageKey(jobCardId: string): string {
  return `dms-repair-timer-${jobCardId}`;
}

export function saveRepairTimerState(jobCardId: string, state: RepairTimerState): void {
  try {
    sessionStorage.setItem(timerStorageKey(jobCardId), JSON.stringify(state));
  } catch {
    // ignore quota / private mode
  }
}

export function loadRepairTimerState(jobCardId: string): RepairTimerState | null {
  try {
    const raw = sessionStorage.getItem(timerStorageKey(jobCardId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RepairTimerState;
    if (typeof parsed.offsetSeconds !== "number") return null;
    if (parsed.startedAtMs !== null && typeof parsed.startedAtMs !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearRepairTimerState(jobCardId: string): void {
  try {
    sessionStorage.removeItem(timerStorageKey(jobCardId));
  } catch {
    // ignore
  }
}

type RepairTimerProps = {
  /** True while status is Repair In Progress */
  running: boolean;
  /** Epoch ms when the user clicked Start Repair (or resumed) — client only */
  startedAtMs: number | null;
  /** Seconds accumulated before the current running segment (e.g. after pause) */
  offsetSeconds?: number;
};

/** Live repair clock — counts only from client Start Repair / resume clicks. */
export function RepairTimer({
  running,
  startedAtMs,
  offsetSeconds = 0,
}: RepairTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!running || startedAtMs === null) {
      setElapsed(0);
      return;
    }

    const tick = () => {
      const segment = Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
      setElapsed(offsetSeconds + segment);
    };

    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [running, startedAtMs, offsetSeconds]);

  if (!running || startedAtMs === null) return null;

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="p-4 flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10 animate-pulse">
          <Timer className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Repair Timer</p>
          <p className="text-2xl font-mono font-bold text-primary">{formatDuration(elapsed)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
