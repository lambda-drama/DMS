import type { JobCardQCResult } from "@/types/dms";

export type QCResultValue = "Pass" | "Fail" | "N/A";

export const QC_SECTION_ORDER = [
  "Job Card Documentation",
  "Vehicle Conditions",
  "Visual Inspection at the Lift",
  "Visual Inspection-Engine Compartment",
  "Visual Inspection During the Drive",
] as const;

export type QCGroupedSection<T = JobCardQCResult> = {
  section: string;
  items: Array<{ row: T; index: number }>;
};

export function groupQCResultsBySection<T extends { section_classification?: string }>(
  rows: T[]
): QCGroupedSection<T>[] {
  const groups = new Map<string, Array<{ row: T; index: number }>>();

  rows.forEach((row, index) => {
    const section = (row.section_classification || "").trim() || "Other";
    const items = groups.get(section);
    if (items) items.push({ row, index });
    else groups.set(section, [{ row, index }]);
  });

  const ordered: QCGroupedSection<T>[] = [];
  for (const key of QC_SECTION_ORDER) {
    const items = groups.get(key);
    if (items?.length) {
      ordered.push({ section: key, items });
      groups.delete(key);
    }
  }
  for (const [section, items] of groups) {
    ordered.push({ section, items });
  }
  return ordered;
}

export function evaluateMeasurementResult(
  row: JobCardQCResult
): QCResultValue | null {
  const needs =
    row.requires_measurement === 1 || row.requires_measurement === true;
  if (!needs) return null;
  if (row.measurement_value == null || row.measurement_value === "") return null;

  let pass = true;
  if (row.min_value != null && row.measurement_value < row.min_value) pass = false;
  if (row.max_value != null && row.measurement_value > row.max_value) pass = false;
  return pass ? "Pass" : "Fail";
}

export function isQCRowComplete(row: JobCardQCResult): boolean {
  const result = (row.result || "").trim();
  if (!result || !["Pass", "Fail", "N/A"].includes(result)) return false;

  const needsMeasurement =
    row.requires_measurement === 1 || row.requires_measurement === true;
  if (needsMeasurement && (row.measurement_value == null || row.measurement_value === "")) {
    return false;
  }

  if (result === "Fail") {
    if (!(row.notes || "").trim()) return false;
    if ((row.requires_photo === 1 || row.requires_photo === true) && !row.photo) {
      return false;
    }
  }

  return true;
}

export function isQCChecklistComplete(rows: JobCardQCResult[]): boolean {
  if (!rows.length) return false;
  return rows.every(isQCRowComplete);
}

export function hasMandatoryQCFails(rows: JobCardQCResult[]): boolean {
  return rows.some(
    (row) =>
      (row.is_mandatory === 1 || row.is_mandatory === true) && row.result === "Fail"
  );
}
