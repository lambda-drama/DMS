"use client";

import { useMemo, useState } from "react";
import { useTechnicianAvailabilityCalendar } from "@/hooks/use-dms";
import { TechnicianDayCalendarView } from "@/components/technicians/technician-day-calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addDaysISO,
  firstOfMonthISO,
  formatDisplayDate,
  getAvailabilityInfo,
  getTodayISO,
} from "@/lib/technician-availability";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { TechnicianDayAvailability } from "@/types/dms";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface TechnicianAvailabilityPanelProps {
  technicianId: string;
  /** Initial selected day (YYYY-MM-DD) */
  initialDate?: string;
}

export function TechnicianAvailabilityPanel({
  technicianId,
  initialDate,
}: TechnicianAvailabilityPanelProps) {
  const [view, setView] = useState<"week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(initialDate || getTodayISO());
  const [selectedDate, setSelectedDate] = useState(initialDate || getTodayISO());

  const { data, isLoading, error } = useTechnicianAvailabilityCalendar(
    technicianId,
    anchorDate,
    view
  );

  const dayKeys = useMemo(() => {
    if (!data?.days) return [];
    return Object.keys(data.days).sort();
  }, [data]);

  const selectedDay: TechnicianDayAvailability | null =
    data?.days?.[selectedDate] ?? null;

  const selectedInfo = selectedDay ? getAvailabilityInfo(selectedDay) : null;
  const SelectedIcon = selectedInfo?.icon;

  const shiftRange = (delta: number) => {
    if (view === "week") {
      const next = addDaysISO(anchorDate, delta * 7);
      setAnchorDate(next);
      setSelectedDate(next);
      return;
    }
    const d = new Date(anchorDate + "T12:00:00");
    d.setMonth(d.getMonth() + delta);
    const next = d.toISOString().split("T")[0];
    setAnchorDate(next);
    setSelectedDate(next);
  };

  const rangeLabel = useMemo(() => {
    if (!data) return "";
    if (view === "week") {
      return `${formatDisplayDate(data.start_date)} – ${formatDisplayDate(data.end_date)}`;
    }
    const d = new Date(anchorDate + "T12:00:00");
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [data, view, anchorDate]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs
          value={view}
          onValueChange={(v) => {
            setView(v as "week" | "month");
            if (v === "month") {
              setAnchorDate(firstOfMonthISO(selectedDate));
            } else {
              setAnchorDate(selectedDate);
            }
          }}
        >
          <TabsList className="h-8">
            <TabsTrigger value="week" className="text-xs px-3">
              Week
            </TabsTrigger>
            <TabsTrigger value="month" className="text-xs px-3">
              Month
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-1">
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftRange(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => {
              const t = getTodayISO();
              setAnchorDate(t);
              setSelectedDate(t);
            }}
          >
            Today
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftRange(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">{rangeLabel}</p>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-xs font-medium text-muted-foreground shrink-0">Jump to date</label>
        <Input
          type="date"
          className="h-9"
          value={selectedDate}
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            setSelectedDate(v);
            setAnchorDate(view === "month" ? firstOfMonthISO(v) : v);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">Could not load schedule</p>
      ) : view === "week" ? (
        <div className="grid grid-cols-7 gap-1.5">
          {dayKeys.map((key) => {
            const day = data!.days[key];
            const info = getAvailabilityInfo(day);
            const isSelected = key === selectedDate;
            const isToday = key === getTodayISO();
            const dayNum = new Date(key + "T12:00:00").getDate();
            const weekday = new Date(key + "T12:00:00").toLocaleDateString("en-US", { weekday: "short" });
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(key)}
                className={`rounded-lg border p-2 text-center transition-colors ${
                  isSelected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : isToday
                    ? "border-primary/30 bg-primary/5"
                    : "hover:bg-muted/50"
                }`}
              >
                <p className="text-[10px] text-muted-foreground">{weekday}</p>
                <p className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>{dayNum}</p>
                <span className={`mx-auto mt-1 block h-2 w-2 rounded-full ${info.dot}`} />
                {day.active_job_count > 0 && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {day.active_job_count} job{day.active_job_count !== 1 ? "s" : ""}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((w) => (
              <p key={w} className="text-center text-[10px] font-medium text-muted-foreground">
                {w}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {dayKeys.map((key) => {
              const day = data!.days[key];
              const info = getAvailabilityInfo(day);
              const isSelected = key === selectedDate;
              const isToday = key === getTodayISO();
              const inMonth = day.in_month !== false;
              const dayNum = new Date(key + "T12:00:00").getDate();
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={`min-h-[52px] rounded-md border p-1 text-center transition-colors ${
                    !inMonth ? "opacity-40" : ""
                  } ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : isToday
                      ? "border-primary/30"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{dayNum}</span>
                  <span className={`mx-auto mt-0.5 block h-1.5 w-1.5 rounded-full ${info.dot}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDay && selectedInfo && (
        <div className="space-y-3 border-t pt-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{formatDisplayDate(selectedDate)}</p>
            <Badge variant="outline" className={`gap-1 ${selectedInfo.bg} ${selectedInfo.color} border-0`}>
              {SelectedIcon && <SelectedIcon className="h-3 w-3" />}
              {selectedInfo.label}
            </Badge>
            {selectedDay.active_job_count > 0 && (
              <span className="text-xs text-muted-foreground">
                {selectedDay.active_job_count} job{selectedDay.active_job_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {selectedInfo.hint && (
            <p className="text-xs text-muted-foreground">{selectedInfo.hint}</p>
          )}
          <TechnicianDayCalendarView
            calendar={selectedDay.day_calendar}
            dateLabel="8 AM – 6 PM"
            compact
          />
          {selectedDay.active_jobs && selectedDay.active_jobs.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Jobs</p>
              {selectedDay.active_jobs.map((job) => (
                <div
                  key={job.name}
                  className="flex items-center justify-between rounded-md border px-2 py-1.5 text-xs"
                >
                  <span className="font-medium truncate">{job.name}</span>
                  <span className="text-muted-foreground shrink-0 ml-2">{job.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground border-t pt-3">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" /> Available
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Busy
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-destructive" /> Not available
        </span>
      </div>
    </div>
  );
}
