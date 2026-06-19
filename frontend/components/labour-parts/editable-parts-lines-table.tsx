'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';

export type EditablePartLine = {
  item_code: string;
  item_name?: string;
  unit_price: number;
  quantity?: number;
  quantity_requested?: number;
};

type EditablePartsLinesTableProps<T extends EditablePartLine> = {
  rows: T[];
  editable?: boolean;
  quantityField?: 'quantity' | 'quantity_requested';
  onUpdateRow: (index: number, patch: Partial<T>) => void;
  onRemoveRow: (index: number) => void;
  subtotal?: number;
  subtotalLabel?: string;
  minWidthClassName?: string;
};

function formatAmount(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function getQuantity(row: EditablePartLine, field: 'quantity' | 'quantity_requested') {
  return field === 'quantity_requested'
    ? row.quantity_requested ?? row.quantity ?? 0
    : row.quantity ?? row.quantity_requested ?? 0;
}

export function EditablePartsLinesTable<T extends EditablePartLine>({
  rows,
  editable = true,
  quantityField = 'quantity_requested',
  onUpdateRow,
  onRemoveRow,
  subtotal,
  subtotalLabel = 'Parts subtotal',
  minWidthClassName = 'min-w-[36rem]',
}: EditablePartsLinesTableProps<T>) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className={minWidthClassName ? `w-full text-sm ${minWidthClassName}` : 'w-full text-sm'}>
        <thead className="bg-muted">
          <tr>
            <th className="p-3 text-left">Part</th>
            <th className="p-3 text-right">Qty</th>
            <th className="p-3 text-right">Unit Price</th>
            <th className="p-3 text-right">Total</th>
            {editable ? <th className="w-10 p-3" /> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => {
            const qty = getQuantity(row, quantityField);
            const amount = qty * (row.unit_price || 0);
            return (
              <tr key={`${row.item_code}-${idx}`} className="border-t">
                <td className="p-3">{row.item_name || row.item_code}</td>
                <td className="p-3 text-right">
                  {editable ? (
                    <Input
                      type="number"
                      min={1}
                      step="1"
                      className="ml-auto h-8 w-20 text-right"
                      value={qty || ''}
                      onChange={(e) =>
                        onUpdateRow(idx, {
                          [quantityField]: parseInt(e.target.value, 10) || 1,
                        } as Partial<T>)
                      }
                    />
                  ) : (
                    qty
                  )}
                </td>
                <td className="p-3 text-right">
                  {editable ? (
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      className="ml-auto h-8 w-28 text-right"
                      value={row.unit_price || ''}
                      onChange={(e) =>
                        onUpdateRow(idx, {
                          unit_price: parseFloat(e.target.value) || 0,
                        } as Partial<T>)
                      }
                    />
                  ) : (
                    formatAmount(row.unit_price || 0)
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
              <td colSpan={3} className="p-3 text-right font-medium">
                {subtotalLabel}
              </td>
              <td className="p-3 text-right font-semibold">{formatAmount(subtotal)}</td>
              {editable ? <td /> : null}
            </tr>
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}
