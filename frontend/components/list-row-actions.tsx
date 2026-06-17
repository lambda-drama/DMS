"use client";

import type { ReactNode } from "react";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";

interface ListRowActionsProps {
  children?: ReactNode;
  doctype: string;
  docName: string;
}

/** Row action area: print icon then optional ⋯ menu (opens Frappe print view). */
export function ListRowActions({ children, doctype, docName }: ListRowActionsProps) {
  return (
    <div
      className="flex items-center justify-end gap-0.5"
      onClick={(e) => e.stopPropagation()}
    >
      <PrintFormatDropdown variant="icon" doctype={doctype} docName={docName} />
      {children}
    </div>
  );
}
