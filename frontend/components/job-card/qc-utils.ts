import type { JobCardQCResult } from "@/types/dms";

export type QCResultValue = "Pass" | "Fail" | "N/A";

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
