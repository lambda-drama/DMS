"use client";

import { Badge } from "@/components/ui/badge";
import {
  Clock,
  FileText,
  ClipboardList,
  AlertCircle,
  Calendar,
  Wrench,
  Car,
  Settings2,
  XCircle,
  CheckCircle2,
  Truck,
  Package,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import type { JobCardStatus } from "@/types/dms";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType; bgColor: string }
> = {
  Draft: { label: "Draft", color: "text-muted-foreground", icon: FileText, bgColor: "bg-muted" },
  Open: { label: "Open", color: "text-[#1E88E5]", icon: Clock, bgColor: "bg-[#1E88E5]/10" },
  "Estimation Pending": { label: "Estimation Pending", color: "text-[#F9A825]", icon: ClipboardList, bgColor: "bg-[#F9A825]/10" },
  "Estimation Approved": { label: "Estimation Approved", color: "text-[#2E7D32]", icon: ClipboardList, bgColor: "bg-[#2E7D32]/10" },
  "Waiting Customer Approval": { label: "Awaiting Approval", color: "text-[#F9A825]", icon: AlertCircle, bgColor: "bg-[#F9A825]/10" },
  Assigned: { label: "Assigned", color: "text-[#1E88E5]", icon: Wrench, bgColor: "bg-[#1E88E5]/10" },
  Scheduled: { label: "Scheduled", color: "text-[#1E88E5]", icon: Calendar, bgColor: "bg-[#1E88E5]/10" },
  "Repair In Progress": { label: "Repair In Progress", color: "text-[#1E88E5]", icon: Wrench, bgColor: "bg-[#1E88E5]/10" },
  "Repair Completed": { label: "Repair Completed", color: "text-teal-800", icon: Wrench, bgColor: "bg-teal-100" },
  "Waiting Parts": { label: "Waiting Parts", color: "text-[#F9A825]", icon: Package, bgColor: "bg-[#F9A825]/10" },
  "Road Test In Progress": { label: "Road Test", color: "text-[#0F3D5E]", icon: Car, bgColor: "bg-[#0F3D5E]/10" },
  "Road Test Completed": { label: "Road Test Done", color: "text-cyan-800", icon: Car, bgColor: "bg-cyan-100" },
  "QC In Progress": { label: "QC In Progress", color: "text-indigo-800", icon: Settings2, bgColor: "bg-indigo-100" },
  "QC Failed": { label: "QC Failed", color: "text-destructive", icon: XCircle, bgColor: "bg-destructive/10" },
  Rework: { label: "Rework", color: "text-[#F9A825]", icon: Wrench, bgColor: "bg-[#F9A825]/10" },
  Completed: { label: "Completed", color: "text-emerald-800", icon: CheckCircle2, bgColor: "bg-emerald-100" },
  Delivered: { label: "Delivered", color: "text-violet-800", icon: Truck, bgColor: "bg-violet-100" },
  Cancelled: { label: "Cancelled", color: "text-destructive", icon: AlertCircle, bgColor: "bg-destructive/10" },
};

export function StatusBadge({ status }: { status: JobCardStatus }) {
  const config = statusConfig[status] || statusConfig.Draft;
  const Icon = config.icon;
  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 gap-1.5`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

/** Sticker for comeback / linked repeat job cards (not a workflow status). */
export function RepeatJobBadge({
  reference,
  className,
}: {
  reference?: string | null;
  className?: string;
}) {
  return (
    <Badge
      variant="outline"
      className={`border-0 gap-1.5 bg-orange-100 text-orange-900 font-medium ${className || ""}`}
      title={reference ? `Linked to ${reference}` : "Repeat / comeback job"}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      Repeat Job
      {reference ? <span className="opacity-80 font-normal">· {reference}</span> : null}
    </Badge>
  );
}

/**
 * Job Card payment status (synced from the linked Sales Invoice).
 * Mirrors the invoice status chips: Paid / Partially Paid / Unpaid.
 */
const paymentStatusConfig: Record<
  string,
  { label: string; color: string; bgColor: string; icon: React.ElementType }
> = {
  Paid: { label: "Paid", color: "text-[#2E7D32]", bgColor: "bg-[#2E7D32]/10", icon: CheckCircle2 },
  "Partially Paid": {
    label: "Partially Paid",
    color: "text-[#F9A825]",
    bgColor: "bg-[#F9A825]/10",
    icon: AlertCircle,
  },
  Unpaid: { label: "Unpaid", color: "text-[#1E88E5]", bgColor: "bg-[#1E88E5]/10", icon: Clock },
  Credit: { label: "Credit", color: "text-violet-800", bgColor: "bg-violet-100", icon: FileText },
  Warranty: {
    label: "Warranty",
    color: "text-teal-800",
    bgColor: "bg-teal-100",
    icon: ShieldCheck,
  },
  Internal: {
    label: "Internal",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    icon: Settings2,
  },
};

/**
 * Shows the billing payment status for a job card that has an invoice,
 * and a dash when no invoice has been created yet.
 */
export function PaymentStatusBadge({
  paymentStatus,
  hasInvoice,
}: {
  paymentStatus?: string | null;
  hasInvoice: boolean;
}) {
  if (!hasInvoice) {
    return <span className="text-sm text-muted-foreground">–</span>;
  }

  const key = (paymentStatus || "").trim() || "Unpaid";
  const config =
    paymentStatusConfig[key] ||
    // ERPNext calls it "Partly Paid"; DMS stores "Partially Paid".
    paymentStatusConfig[key.replace("Partly", "Partially")] || {
      label: key,
      color: "text-muted-foreground",
      bgColor: "bg-muted",
      icon: Clock,
    };
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.bgColor} ${config.color} border-0 gap-1.5`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  );
}

export { statusConfig, paymentStatusConfig };
