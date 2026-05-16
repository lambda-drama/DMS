'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReportResult } from '@/services/reports';

function formatCell(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? String(value)
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function formatMoney(value: unknown): string {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? ''));
  if (!Number.isFinite(n)) return '—';
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/** Service revenue buckets: { labour, parts, discount, net, count } */
function isRevenueBucket(value: unknown): value is Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const o = value as Record<string, unknown>;
  return 'net' in o || 'labour' in o || 'parts' in o || 'count' in o;
}

function formatRevenueBucket(bucket: Record<string, unknown>): string {
  const parts: string[] = [];
  if (bucket.net != null) parts.push(`Net ${formatMoney(bucket.net)}`);
  if (bucket.labour != null && Number(bucket.labour) !== 0) {
    parts.push(`Labour ${formatMoney(bucket.labour)}`);
  }
  if (bucket.parts != null && Number(bucket.parts) !== 0) {
    parts.push(`Parts ${formatMoney(bucket.parts)}`);
  }
  if (bucket.discount != null && Number(bucket.discount) !== 0) {
    parts.push(`Disc ${formatMoney(bucket.discount)}`);
  }
  if (bucket.count != null) {
    const n = Number(bucket.count);
    parts.push(`${n} job${n === 1 ? '' : 's'}`);
  }
  return parts.join(' · ') || '—';
}

function formatBreakdownValue(value: unknown): string {
  if (value == null) return '—';
  if (typeof value === 'number' || typeof value === 'boolean') return formatCell(value);
  if (typeof value === 'string') return value;
  if (isRevenueBucket(value)) return formatRevenueBucket(value as Record<string, unknown>);
  if (typeof value === 'object' && !Array.isArray(value)) {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 1 && (typeof entries[0][1] === 'number' || typeof entries[0][1] === 'string')) {
      return formatCell(entries[0][1]);
    }
    return entries.map(([k, v]) => `${k}: ${formatBreakdownValue(v)}`).join(', ');
  }
  return formatCell(value);
}

const SKIP_SUMMARY_KEYS = new Set([
  'by_status', 'by_advisor', 'by_technician', 'by_bay', 'by_month', 'by_model',
  'by_reason', 'by_age_bucket', 'by_vin',
]);

export function ReportViewer({ data }: { data: ReportResult }) {
  const scalarSummary = Object.entries(data.summary || {}).filter(
    ([k, v]) => !SKIP_SUMMARY_KEYS.has(k) && typeof v !== 'object'
  );

  const breakdownSummary = Object.entries(data.summary || {}).filter(
    ([k, v]) => SKIP_SUMMARY_KEYS.has(k) || (typeof v === 'object' && v !== null && !Array.isArray(v))
  );

  return (
    <div className="flex flex-col gap-4 min-h-0">
      {scalarSummary.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {scalarSummary.map(([key, value]) => (
            <div
              key={key}
              className="shrink-0 rounded-lg border bg-muted/20 px-4 py-3 min-w-[8rem]"
            >
              <p className="text-xs font-medium capitalize text-muted-foreground">{key.replace(/_/g, " ")}</p>
              <p className="text-xl font-bold mt-1">{formatCell(value)}</p>
            </div>
          ))}
        </div>
      )}

      {breakdownSummary.length > 0 && (
        <div className="space-y-2">
          {breakdownSummary.map(([key, value]) => (
            <div key={key}>
              <p className="text-xs font-medium capitalize text-muted-foreground mb-1.5">{key.replace(/_/g, " ")}</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(value as Record<string, unknown>).map(([label, entry]) => (
                  <span
                    key={label}
                    className="rounded-md border bg-muted/40 px-2.5 py-1.5 text-xs max-w-full"
                  >
                    <span className="font-medium">{label}</span>
                    {': '}
                    <strong className="font-normal text-foreground">{formatBreakdownValue(entry)}</strong>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border overflow-hidden flex flex-col min-h-[200px]">
        <div className="border-b bg-muted/30 px-3 py-2 text-sm font-medium shrink-0">
          Detail ({data.rows.length} rows)
        </div>
        <div className="dms-table-panel overflow-auto flex-1 max-h-[min(60vh,720px)]">

            <Table>
              <TableHeader>
                <TableRow>
                  {data.columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={data.columns.length} className="text-center text-muted-foreground">
                      No rows for this period
                    </TableCell>
                  </TableRow>
                ) : (
                  data.rows.map((row, idx) => (
                    <TableRow key={idx}>
                      {data.columns.map((col) => (
                        <TableCell key={col.key}>{formatCell(row[col.key])}</TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}