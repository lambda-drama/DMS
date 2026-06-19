import type { JobCardStatus } from '@/types/dms';

/** Statuses where repair work has started — assignment fields are locked. */
const ASSIGNMENT_LOCKED_STATUSES: ReadonlySet<JobCardStatus | string> = new Set([
  'Repair In Progress',
  'Repair Completed',
  'Waiting Parts',
  'Road Test In Progress',
  'Road Test Completed',
  'QC In Progress',
  'QC Failed',
  'Rework',
  'Completed',
  'Delivered',
  'Cancelled',
]);

export function canEditJobCardAssignment(status: string): boolean {
  return !ASSIGNMENT_LOCKED_STATUSES.has(status);
}

/** Legacy: Assigned used to overwrite workflow status. Map to a real workflow step for display. */
export function resolveJobCardWorkflowStatus(
  status: JobCardStatus | string,
  docstatus?: number
): JobCardStatus {
  if (status !== 'Assigned') return status as JobCardStatus;
  return (docstatus ?? 0) >= 1 ? 'Estimation Approved' : 'Open';
}

/** Workshop assignment is derived from technician + bay, not from status. */
export function isJobCardWorkshopAssigned(jobCard: {
  lead_technician?: string | null;
  assigned_bay?: string | null;
  workshop_assigned?: boolean;
}): boolean {
  if (typeof jobCard.workshop_assigned === 'boolean') return jobCard.workshop_assigned;
  return Boolean(jobCard.lead_technician?.trim() && jobCard.assigned_bay?.trim());
}

/** Statuses where repair can be started (after estimate / open internal jobs). */
export function canStartRepairFromWorkflow(status: JobCardStatus | string): boolean {
  const workflow = resolveJobCardWorkflowStatus(status);
  return workflow === 'Estimation Approved' || workflow === 'Open';
}
