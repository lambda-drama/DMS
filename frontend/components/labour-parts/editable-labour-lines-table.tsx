'use client';

import { Button } from '@/components/ui/button';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Trash2 } from 'lucide-react';

export type EditableLabourLine = {
  vehicle_service_item: string;
  vehicle_service_item_name?: string;
  estimated_hours: number;
  rate_per_hour: number;
  technician?: string;
  technician_name?: string;
};

type EditableLabourLinesTableProps<T extends EditableLabourLine> = {
  rows: T[];
  editable?: boolean;
  showTechnician?: boolean;
  onUpdateRow: (index: number, patch: Partial<T>) => void;
  onRemoveRow: (index: number) => void;
  subtotal?: number;
  subtotalLabel?: string;
  minWidthClassName?: string;
};

function formatAmount(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

export function EditableLabourLinesTable<T extends EditableLabourLine>({
  rows,
  editable = true,
  showTechnician = false,
  onUpdateRow,
  onRemoveRow,
  subtotal,
  subtotalLabel = 'Labour subtotal',
  minWidthClassName = 'min-w-[40rem]',
}: EditableLabourLinesTableProps<T>) {
  if (rows.length === 0) return null;

  const labelColSpan = showTechnician ? 3 : 2;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className={minWidthClassName ? `w-full text-sm ${minWidthClassName}` : 'w-full text-sm'}>
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left">Service Item</th>
            {showTechnician ? <th className="p-3 text-left">Technician</th> : null}
            <th className="p-3 text-right">Hours</th>
            <th className="p-3 text-right">Rate/Hr</th>
            <th className="p-3 text-right">Amount</th>
            {editable ? <th className="w-10 p-3" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const amount = (row.estimated_hours || 0) * (row.rate_per_hour || 0);
            return (
              <tr key={`${row.vehicle_service_item}-${idx}`} className="border-t">
                <td className="p-3">
                  {row.vehicle_service_item_name || row.vehicle_service_item}
                </td>
                {showTechnician ? (
                  <td className="p-3">{row.technician_name || row.technician || '—'}</td>
                ) : null}
                <td className="p-3 text-right">
                  {editable ? (
                    <DecimalInput
                      min={0}
                      className="ml-auto h-8 w-24 text-right"
                      value={row.estimated_hours}
                      onValueChange={(estimated_hours) =>
                        onUpdateRow(idx, { estimated_hours } as Partial<T>)
                      }
                    />
                  ) : (
                    row.estimated_hours
                  )}
                </td>
                <td className="p-3 text-right">
                  {editable ? (
                    <DecimalInput
                      min={0}
                      className="ml-auto h-8 w-28 text-right"
                      value={row.rate_per_hour}
                      onValueChange={(rate_per_hour) =>
                        onUpdateRow(idx, { rate_per_hour } as Partial<T>)
                      }
                    />
                  ) : (
                    formatAmount(row.rate_per_hour || 0)
                  )}
                </td>
                <td className="p-3 text-right font-medium">{formatAmount(amount)}</td>
                {editable ? (
                  <td className="p-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveRow(idx)}
                      className="h-8 w-8 text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                ) : null}
              </tr>
            );
          })}
        </tbody>
        {subtotal != null ? (
          <tfoot>
            <tr className="border-t bg-muted/40">
              <td className="p-3 text-right font-medium" colSpan={labelColSpan}>
                {subtotalLabel}
              </td>
              <td className="p-3 text-right font-semibold" colSpan={editable ? 3 : 2}>
                {formatAmount(subtotal)}
              </td>
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
