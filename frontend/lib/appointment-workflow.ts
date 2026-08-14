import type { ServiceAppointment } from '@/types/dms';

const TERMINAL_STATUSES = new Set(['Completed', 'Cancelled', 'No-Show']);
const ARRIVED_STATUSES = new Set([
  'Arrived',
  'In Inspection',
  'In Workshop',
  'Ready for Pickup',
  'Completed',
]);
const REMINDER_STATUSES = new Set([
  'Requested',
  'Scheduled',
  'Confirmed',
  'Booked',
  'Rescheduled',
]);

export function normalizeDocstatus(docstatus?: number | string | null): number {
  const n = Number(docstatus);
  return Number.isFinite(n) ? n : 0;
}

export function getAppointmentPhone(
  apt: Pick<ServiceAppointment, 'primary_phone' | 'mobile_no' | 'contact_phone'>,
): string {
  const fromDoc = (apt.contact_phone || apt.primary_phone || apt.mobile_no || '').trim();
  return fromDoc;
}

export function isReminderStatus(status?: string): boolean {
  return REMINDER_STATUSES.has(status || '');
}

/** True when WhatsApp reminder can be sent right now. */
export function canSendReminder(apt: ServiceAppointment): boolean {
  return sendReminderBlockReason(apt) === null;
}

/** Why reminder is blocked, or null if it can be sent. */
export function sendReminderBlockReason(apt: ServiceAppointment): string | null {
  if (!isReminderStatus(apt.status)) return null;
  if (TERMINAL_STATUSES.has(apt.status)) return null;
  if (ARRIVED_STATUSES.has(apt.status)) return null;

  if (normalizeDocstatus(apt.docstatus) !== 1) {
    return 'Confirm the appointment first';
  }
  if (!getAppointmentPhone(apt)) {
    return 'Add Mobile No on the appointment or a phone on the customer';
  }
  return null;
}

/** Show Send reminder in menus (enabled or disabled with a reason). */
export function shouldShowSendReminderAction(apt: ServiceAppointment): boolean {
  if (!isReminderStatus(apt.status)) return false;
  if (TERMINAL_STATUSES.has(apt.status)) return false;
  if (ARRIVED_STATUSES.has(apt.status)) return false;
  return normalizeDocstatus(apt.docstatus) < 2;
}

export { TERMINAL_STATUSES, ARRIVED_STATUSES, REMINDER_STATUSES };
