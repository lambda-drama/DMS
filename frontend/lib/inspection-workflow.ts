import type { VehicleInspection } from '@/types/dms';

export function normalizeInspectionDocstatus(docstatus?: number | string | null): number {
  const n = Number(docstatus);
  return Number.isFinite(n) ? n : 0;
}

/** Submitted inspection with no estimate or job card yet — ready for diagnosis. */
export function canStartDiagnosis(insp: Pick<VehicleInspection, 'docstatus' | 'job_card' | 'service_estimate'>): boolean {
  return (
    normalizeInspectionDocstatus(insp.docstatus) === 1 &&
    !insp.job_card &&
    !insp.service_estimate
  );
}
