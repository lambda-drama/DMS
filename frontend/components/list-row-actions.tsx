"use client";

import type { ReactNode } from "react";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";

interface ListRowActionsProps {
  children?: ReactNode;
  doctype: string;
  docName: string;
  /** Hide the print icon (e.g. master lists that should not print). Default true. */
  showPrint?: boolean;
}

/** Row action area: optional ⋯ menu then print icon (opens Frappe print view). */
export function ListRowActions({
  children,
  doctype,
  docName,
  showPrint = true,
}: ListRowActionsProps) {
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
      {showPrint ? (
        <PrintFormatDropdown variant="icon" doctype={doctype} docName={docName} />
      ) : null}
    </div>
  );
}
