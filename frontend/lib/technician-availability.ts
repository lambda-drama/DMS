import type { TechnicianAvailability, TechnicianAvailabilityStatus } from "@/types/dms";
import { UserCheck, UserX, Wrench, type LucideIcon } from "lucide-react";

export function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

export function addDaysISO(dateStr: string, days: number) {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

export function firstOfMonthISO(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function formatDisplayDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getAvailabilityInfo(tech: {
  availability_status?: TechnicianAvailabilityStatus;
  currently_working?: boolean;
  is_available?: boolean;
  unavailable_reason?: string | null;
}) {
  const status = tech.availability_status;
  if (status === "busy" || tech.currently_working) {
    return {
      label: "Busy",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-100 dark:bg-amber-900/30",
      ring: "ring-amber-500/40",
      dot: "bg-amber-500",
      icon: Wrench as LucideIcon,
      hint: tech.unavailable_reason,
    };
  }
  if (status === "available" || tech.is_available) {
    return {
      label: "Available",
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-100 dark:bg-green-900/30",
      ring: "ring-green-500/40",
      dot: "bg-green-500",
      icon: UserCheck as LucideIcon,
    };
  }
  return {
    label: "Not Available",
    color: "text-destructive",
    bg: "bg-destructive/10",
    ring: "ring-destructive/40",
    dot: "bg-destructive",
    icon: UserX as LucideIcon,
    hint: tech.unavailable_reason || "Schedule conflict or absent",
  };
}

export type AvailabilityInfo = ReturnType<typeof getAvailabilityInfo>;

export function availabilityFromListItem(tech: TechnicianAvailability) {
  return getAvailabilityInfo(tech);
}
