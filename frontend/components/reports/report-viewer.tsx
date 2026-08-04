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
import { StarRating, isStarRatingField } from '@/components/reports/star-rating';
import {
  ReportStatusChip,
  isReportStatusField,
} from '@/components/reports/report-status-chip';
import { useNavigation } from '@/contexts/navigation-context';

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

/** Report tabs: table only. KPIs / charts live on Overview. */
export function ReportViewer({ data }: { data: ReportResult }) {
  const { navigate } = useNavigation();
  const columns = data.columns || [];
  const rows = data.rows || [];

  const drill = (row: Record<string, unknown>) => {
    const d = row._drill as { view?: string; params?: Record<string, string> } | undefined;
    if (d?.view) navigate(d.view, d.params);
  };

  return (
    <div className="overflow-hidden rounded-lg border border-border/80">
      <div className="flex items-center justify-between border-b border-border/80 bg-muted/20 px-3 py-2">
        <p className="text-[13px] font-semibold tracking-tight">{data.title}</p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {rows.length.toLocaleString()} row{rows.length === 1 ? '' : 's'}
        </p>
      </div>
      <div className="dms-table-panel max-h-[min(65vh,760px)] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key} className="whitespace-nowrap text-xs font-semibold">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={Math.max(columns.length, 1)}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  No rows for this period
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow
                  key={idx}
                  className={row._drill ? 'cursor-pointer hover:bg-muted/40' : undefined}
                  onClick={() => drill(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className="text-[13px]">
                      {isStarRatingField(col.key) ? (
                        <StarRating value={row[col.key] ?? row.rating_stars} size="sm" />
                      ) : isReportStatusField(col.key) ? (
                        <ReportStatusChip fieldKey={col.key} value={row[col.key]} />
                      ) : col.key === 'name' && row._drill ? (
                        <span className="font-medium text-primary underline-offset-2 hover:underline">
                          {formatCell(row[col.key])}
                        </span>
                      ) : (
                        formatCell(row[col.key])
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
