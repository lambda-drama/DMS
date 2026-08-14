'use client';

import { Badge } from '@/components/ui/badge';
import { statusConfig } from '@/components/job-card/status-badge';
import { cn } from '@/lib/utils';

type ChipStyle = { color: string; bg: string; label?: string };

/** Bay utilization + other non–job-card status values used in reports. */
const BAY_AND_GENERIC: Record<string, ChipStyle> = {
  Available: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  Occupied: { color: 'text-sky-800', bg: 'bg-sky-100' },
  Maintenance: { color: 'text-amber-800', bg: 'bg-amber-100' },
  Reserved: { color: 'text-violet-800', bg: 'bg-violet-100' },
  Cleaning: { color: 'text-cyan-800', bg: 'bg-cyan-100' },
  Blocked: { color: 'text-red-800', bg: 'bg-red-100' },
  Idle: { color: 'text-slate-700', bg: 'bg-slate-100' },
  Active: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  Inactive: { color: 'text-slate-600', bg: 'bg-slate-100' },
  Upcoming: { color: 'text-sky-800', bg: 'bg-sky-100' },
  Due: { color: 'text-amber-800', bg: 'bg-amber-100' },
  Overdue: { color: 'text-orange-800', bg: 'bg-orange-100' },
  'Severely Overdue': { color: 'text-red-800', bg: 'bg-red-100' },
  Lapsed: { color: 'text-red-800', bg: 'bg-red-100' },
  Recovered: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  'Vehicle Sold': { color: 'text-slate-700', bg: 'bg-slate-100' },
  Unreachable: { color: 'text-rose-800', bg: 'bg-rose-100' },
  Requested: { color: 'text-sky-800', bg: 'bg-sky-100' },
  Scheduled: { color: 'text-sky-800', bg: 'bg-sky-100' },
  Confirmed: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  Draft: { color: 'text-muted-foreground', bg: 'bg-muted' },
  Submitted: { color: 'text-sky-800', bg: 'bg-sky-100' },
  Cancelled: { color: 'text-red-800', bg: 'bg-red-100' },
  Open: { color: 'text-sky-800', bg: 'bg-sky-100' },
  Closed: { color: 'text-slate-700', bg: 'bg-slate-100' },
  Pending: { color: 'text-amber-800', bg: 'bg-amber-100' },
  Yes: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  No: { color: 'text-slate-600', bg: 'bg-slate-100' },
};

const PAYMENT_COLORS: Record<string, ChipStyle> = {
  Unpaid: { color: 'text-amber-800', bg: 'bg-amber-100' },
  'Partially Paid': { color: 'text-orange-800', bg: 'bg-orange-100' },
  Paid: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  Internal: { color: 'text-slate-700', bg: 'bg-slate-100' },
};

const ALERT_COLORS: Record<string, ChipStyle> = {
  normal: { color: 'text-emerald-800', bg: 'bg-emerald-100', label: 'Normal' },
  approaching: { color: 'text-amber-800', bg: 'bg-amber-100', label: 'Approaching' },
  delayed: { color: 'text-orange-800', bg: 'bg-orange-100', label: 'Delayed' },
  critically_delayed: { color: 'text-red-800', bg: 'bg-red-100', label: 'Critical' },
};

const PARTS_COLORS: Record<string, ChipStyle> = {
  None: { color: 'text-muted-foreground', bg: 'bg-muted' },
  Requested: { color: 'text-sky-800', bg: 'bg-sky-100' },
  Reserved: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  Short: { color: 'text-amber-800', bg: 'bg-amber-100' },
  Backordered: { color: 'text-red-800', bg: 'bg-red-100' },
};

const APPROVAL_COLORS: Record<string, ChipStyle> = {
  Pending: { color: 'text-amber-800', bg: 'bg-amber-100' },
  Approved: { color: 'text-emerald-800', bg: 'bg-emerald-100' },
  Rejected: { color: 'text-red-800', bg: 'bg-red-100' },
  'Not Required': { color: 'text-slate-700', bg: 'bg-slate-100' },
};

/** Column keys that should render as colored status chips in report tables. */
export function isReportStatusField(key: string): boolean {
  const k = key.toLowerCase();
  return (
    k === 'status' ||
    k === 'job_status' ||
    k === 'alert' ||
    k === 'payment_status' ||
    k === 'parts_status' ||
    k === 'customer_approval_status' ||
    k === 'customer_notified' ||
    k === 'classification' ||
    k === 'delay_department' ||
    k.endsWith('_status') ||
    k.endsWith('_result')
  );
}

function chipClass(color: string, bg: string) {
  return cn(
    'inline-flex max-w-full items-center truncate rounded-md border-0 px-2 py-0.5 text-[11px] font-medium',
    color,
    bg
  );
}

function resolveStyle(fieldKey: string, text: string): ChipStyle {
  const key = fieldKey.toLowerCase();

  if (key === 'alert' && ALERT_COLORS[text]) return ALERT_COLORS[text];
  if (key === 'payment_status' && PAYMENT_COLORS[text]) return PAYMENT_COLORS[text];
  if (key === 'parts_status' && PARTS_COLORS[text]) return PARTS_COLORS[text];
  if (key === 'customer_approval_status' && APPROVAL_COLORS[text]) return APPROVAL_COLORS[text];

  const jc = statusConfig[text];
  if (jc) return { color: jc.color, bg: jc.bgColor, label: jc.label };

  if (BAY_AND_GENERIC[text]) return BAY_AND_GENERIC[text];
  if (PAYMENT_COLORS[text]) return PAYMENT_COLORS[text];
  if (PARTS_COLORS[text]) return PARTS_COLORS[text];
  if (APPROVAL_COLORS[text]) return APPROVAL_COLORS[text];
  if (ALERT_COLORS[text]) return ALERT_COLORS[text];

  // Soft hash color for unknown statuses so they never look plain gray-on-gray
  const palette: ChipStyle[] = [
    { color: 'text-sky-800', bg: 'bg-sky-100' },
    { color: 'text-teal-800', bg: 'bg-teal-100' },
    { color: 'text-indigo-800', bg: 'bg-indigo-100' },
    { color: 'text-fuchsia-800', bg: 'bg-fuchsia-100' },
    { color: 'text-rose-800', bg: 'bg-rose-100' },
    { color: 'text-lime-800', bg: 'bg-lime-100' },
  ];
  let hash = 0;
  for (let i = 0; i < text.length; i++) hash = (hash + text.charCodeAt(i) * (i + 1)) % 997;
  return palette[hash % palette.length];
}

export function ReportStatusChip({
  fieldKey,
  value,
}: {
  fieldKey: string;
  value: unknown;
}) {
  if (value == null || value === '' || value === '—') {
    return <span className="text-muted-foreground">—</span>;
  }
  const text = String(value);
  const cfg = resolveStyle(fieldKey, text);
  return <Badge className={chipClass(cfg.color, cfg.bg)}>{cfg.label || text}</Badge>;
}
