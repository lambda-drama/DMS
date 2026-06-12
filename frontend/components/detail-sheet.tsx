"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  badge?: { label: string; variant?: "default" | "secondary" | "destructive" | "outline" };
  isLoading?: boolean;
  onOpenInDesk?: () => void;
  footer?: React.ReactNode;
  /** "outer" scrolls the whole body; "inner" lets children manage their own scroll regions */
  contentScroll?: "outer" | "inner";
  children: React.ReactNode;
}

export function DetailSheet({
  open,
  onOpenChange,
  title,
  subtitle,
  badge,
  isLoading,
  onOpenInDesk,
  footer,
  contentScroll = "outer",
  children,
}: DetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex h-full w-full max-w-[100vw] flex-col overflow-hidden border-l-2 border-l-dms-green p-0 sm:max-w-xl md:max-w-2xl lg:max-w-3xl"
      >
        <SheetHeader className="shrink-0 bg-dms-green-light px-4 pt-4 pb-3">
          <div className="flex flex-col gap-3 pr-8 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <SheetTitle className="text-lg">{title}</SheetTitle>
                {badge && (
                  <Badge
                    variant={badge.variant || "secondary"}
                    className="bg-dms-green text-white border-dms-green"
                  >
                    {badge.label}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <SheetDescription className="mt-1">{subtitle}</SheetDescription>
              )}
            </div>
          </div>
        </SheetHeader>
        <Separator className="bg-(--dms-green)/20" />
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-dms-green" />
          </div>
        ) : (
          <>
            <div
              className={cn(
                "flex min-h-0 flex-1 flex-col px-4 pb-4",
                contentScroll === "inner" ? "overflow-hidden" : "overflow-y-auto",
              )}
            >
              {children}
            </div>
            {footer && (
              <div className="shrink-0 border-t bg-background px-4 py-3">{footer}</div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function DetailSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <h3 className="text-sm font-semibold text-dms-green uppercase tracking-wider flex items-center gap-2">
        <span className="w-1 h-4 rounded-full bg-dms-green" />
        {title}
      </h3>
      <div className="rounded-lg border border-(--dms-green)/15 bg-card p-3 space-y-3">
        {children}
      </div>
    </div>
  );
}

export function DetailRow({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right">{value || "—"}</span>
    </div>
  );
}
