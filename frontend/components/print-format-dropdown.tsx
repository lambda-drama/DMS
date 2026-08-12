"use client";

import { useEffect, useState } from "react";
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
  const [formats, setFormats] = useState<string[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!doctype) {
      setFormats(["Standard"]);
      return;
    }
    let cancelled = false;
    fetchPrintFormats(doctype)
      .then((list) => {
        if (!cancelled) setFormats(list.length ? list : ["Standard"]);
      })
      .catch(() => {
        if (!cancelled) setFormats(["Standard"]);
      });
    return () => {
      cancelled = true;
    };
  }, [doctype]);

  const printWith = (format: string) => {
    if (!doctype || !docName) return;
    openDocumentPrintView(doctype, docName, format, { noLetterhead, triggerPrint });
  };

  const handlePrintClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading || !doctype || !docName) return;
    setLoading(true);
    try {
      let list = formats;
      if (!list) {
        const fetched = await fetchPrintFormats(doctype);
        list = fetched.length ? fetched : ["Standard"];
        setFormats(list);
      }
      if (list.length <= 1) {
        printWith(list[0] || "Standard");
        return;
      }
      setMenuOpen(true);
    } catch {
      printWith("Standard");
    } finally {
      setLoading(false);
    }
  };

  const isIcon = variant === "icon";
  const buttonProps = {
    type: "button" as const,
    variant: (isIcon ? "ghost" : "outline") as "ghost" | "outline",
    size: (isIcon ? "icon" : "sm") as "icon" | "sm",
    className,
    "aria-label": "Print",
    title: "Print",
    disabled: loading,
  };

  // Multiple formats: show a dropdown. One format: the button prints that format directly.
  if (formats && formats.length > 1) {
    return (
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <Button {...buttonProps} onClick={(e) => e.stopPropagation()}>
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
          {formats.map((format) => (
            <DropdownMenuItem
              key={format}
              onSelect={() => {
                printWith(format);
                setMenuOpen(false);
              }}
            >
              {format}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button {...buttonProps} onClick={handlePrintClick}>
      <Printer className={isIcon ? "h-4 w-4" : "h-4 w-4 mr-2"} />
      {!isIcon && "Print"}
    </Button>
  );
}
