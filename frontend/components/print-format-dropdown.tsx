"use client";

import { useState, useEffect } from "react";
import { Printer } from "lucide-react";
import { fetchPrintFormats } from "@/services/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function openDocumentPrintView(
  doctype: string,
  docName: string,
  format = "Standard",
  options?: { noLetterhead?: number; triggerPrint?: number }
) {
  const params = new URLSearchParams();
  params.set("doctype", doctype);
  params.set("name", docName);
  params.set("format", format);
  params.set("trigger_print", String(options?.triggerPrint ?? 0));
  params.set("no_letterhead", String(options?.noLetterhead ?? 0));
  const base = typeof window !== "undefined" ? window.location.origin : "";
  window.open(`${base}/printview?${params.toString()}`, "_blank", "noopener,noreferrer");
}

interface PrintFormatDropdownProps {
  doctype: string;
  docName: string;
  noLetterhead?: number;
  /** 0 = preview first (default), 1 = open browser print dialog immediately */
  triggerPrint?: number;
  className?: string;
  /** `icon` — compact printer icon for list/detail rows (after ⋯ menu) */
  variant?: "default" | "icon";
}

export function PrintFormatDropdown({
  doctype,
  docName,
  noLetterhead = 0,
  triggerPrint = 0,
  className,
  variant = "default",
}: PrintFormatDropdownProps) {
  const [open, setOpen] = useState(false);
  const [formats, setFormats] = useState<string[]>(["Standard"]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !doctype) return;
    setLoading(true);
    fetchPrintFormats(doctype)
      .then(setFormats)
      .catch(() => setFormats(["Standard"]))
      .finally(() => setLoading(false));
  }, [open, doctype]);

  const handleSelectFormat = (format: string) => {
    openDocumentPrintView(doctype, docName, format, { noLetterhead, triggerPrint });
    setOpen(false);
  };

  const isIcon = variant === "icon";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={isIcon ? "ghost" : "outline"}
          size={isIcon ? "icon" : "sm"}
          className={className}
          aria-label="Print"
          title="Print"
          onClick={(e) => e.stopPropagation()}
        >
          <Printer className={isIcon ? "h-4 w-4" : "h-4 w-4 mr-2"} />
          {!isIcon && "Print"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={4}
        collisionPadding={8}
        className="min-w-[180px] z-[9999]"
        onClick={(e) => e.stopPropagation()}
      >
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Print format
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {loading ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading…</div>
        ) : (
          formats.map((format) => (
            <DropdownMenuItem
              key={format}
              onSelect={() => handleSelectFormat(format)}
            >
              {format}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
