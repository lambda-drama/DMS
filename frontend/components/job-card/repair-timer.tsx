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

export function RepairTimer({ jobCard }: { jobCard: DMSJobCard }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (jobCard.status !== "Repair In Progress") return;

    const openLogs = (jobCard.time_logs || []).filter((l) => l.start_time && !l.end_time);
    if (openLogs.length === 0) return;

    const earliest = openLogs.reduce((min, l) => {
      const t = new Date(l.start_time).getTime();
      return t < min ? t : min;
    }, Infinity);

    const tick = () => {
      setElapsed(Math.floor((Date.now() - earliest) / 1000));
    };
    tick();

    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [jobCard.status, jobCard.time_logs]);

  if (jobCard.status !== "Repair In Progress") return null;

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
