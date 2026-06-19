import type { JobCardPartItem } from '@/types/dms';

/** Part line is eligible for a new parts request (not already on an active request). */
export function isPartLineRequestable(part: JobCardPartItem): boolean {
  const status = (part.line_status || part.status || 'Requested').trim();
  if (status !== 'Requested') return false;

  if (part.parts_request?.trim()) return false;

  const requested = part.quantity_requested ?? part.quantity ?? 0;
  const issued = part.quantity_issued ?? 0;
  return requested > issued;
}

export function hasRequestableParts(parts?: JobCardPartItem[]): boolean {
  return !!parts?.some(isPartLineRequestable);
}
