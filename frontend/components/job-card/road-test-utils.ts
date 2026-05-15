import type { RoadTestItemResult } from "@/types/dms";

export type RoadTestResultValue = "Pass" | "Fail" | "N/A";

export function isRoadTestRowComplete(row: RoadTestItemResult): boolean {
  const result = (row.result || "").trim();
  if (!result || !["Pass", "Fail", "N/A"].includes(result)) return false;
  if (result === "Fail" && !(row.observations || "").trim()) return false;
  return true;
}

export function isRoadTestChecklistComplete(rows: RoadTestItemResult[]): boolean {
  if (!rows.length) return false;
  return rows.every(isRoadTestRowComplete);
}

export function hasCriticalRoadTestFails(rows: RoadTestItemResult[]): boolean {
  return rows.some(
    (row) =>
      (row.is_critical === 1 || row.is_critical === true) && row.result === "Fail"
  );
}
