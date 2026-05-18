import type { JobCardStatus } from "@/types/dms";

/** Statuses where repair work has started — assignment fields are locked. */
const ASSIGNMENT_LOCKED_STATUSES: ReadonlySet<JobCardStatus | string> = new Set([
  "Repair In Progress",
  "Repair Completed",
  "Waiting Parts",
  "Road Test In Progress",
  "Road Test Completed",
  "QC In Progress",
  "QC Failed",
  "Rework",
  "Completed",
  "Delivered",
  "Cancelled",
]);

export function canEditJobCardAssignment(status: string): boolean {
  return !ASSIGNMENT_LOCKED_STATUSES.has(status);
}
