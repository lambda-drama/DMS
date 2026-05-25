'use client';

import { Shield, ShieldOff, Gauge } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { VehicleWarrantySummary } from '@/types/dms';

function statusVariant(summary: VehicleWarrantySummary) {
  if (summary.warranty_active) {
    return 'default' as const;
  }
  if (summary.warranty_status === 'Expired by Mileage') {
    return 'destructive' as const;
  }
  return 'secondary' as const;
}

export function WarrantyStatusBanner({
  summary,
  className = '',
}: {
  summary?: VehicleWarrantySummary | null;
  className?: string;
}) {
  if (!summary) return null;

  const active = summary.warranty_active;
  const Icon = active ? Shield : summary.warranty_status === 'Expired by Mileage' ? Gauge : ShieldOff;

  return (
    <div
      className={`rounded-lg border p-4 space-y-2 ${
        active
          ? 'border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/30'
          : 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30'
      } ${className}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Icon
          className={`h-5 w-5 shrink-0 ${active ? 'text-green-700 dark:text-green-400' : 'text-amber-700 dark:text-amber-400'}`}
        />
        <span className="font-medium text-sm">
          Vehicle warranty: {active ? 'Active' : 'Inactive'}
        </span>
        <Badge variant={statusVariant(summary)}>{summary.warranty_status}</Badge>
      </div>
      {summary.warranty_reason && (
        <p className="text-sm text-muted-foreground">{summary.warranty_reason}</p>
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {summary.sale_date && <span>Sale date: {summary.sale_date}</span>}
        {summary.warranty_end_date && (
          <span>Ends: {summary.warranty_end_date}</span>
        )}
        {summary.warranty_km_limit != null && summary.warranty_km_limit > 0 && (
          <span>Limit: {summary.warranty_km_limit.toLocaleString()} km</span>
        )}
        {summary.current_odometer != null && (
          <span>Odometer: {summary.current_odometer.toLocaleString()} km</span>
        )}
        {active && summary.days_remaining != null && (
          <span>{summary.days_remaining} days left</span>
        )}
        {active && summary.km_remaining != null && summary.warranty_km_limit != null && (
          <span>{summary.km_remaining.toLocaleString()} km left</span>
        )}
      </div>
    </div>
  );
}
