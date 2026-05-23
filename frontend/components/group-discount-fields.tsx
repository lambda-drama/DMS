'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from '@/lib/invoice-discount';

export function GroupDiscountFields({
  label,
  mode,
  onModeChange,
  value,
  onValueChange,
  subtotal,
}: {
  label: string;
  mode: InvoiceDiscountMode;
  onModeChange: (m: InvoiceDiscountMode) => void;
  value: string;
  onValueChange: (v: string) => void;
  subtotal: number;
}) {
  const discountVal = parseDiscountValue(mode, value);
  const discountAmt = groupDiscountAmount(subtotal, mode, discountVal);

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <p className="text-sm font-medium">{label} discount</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs">Type</Label>
          <Select
            value={mode}
            onValueChange={(v) => onModeChange(v as InvoiceDiscountMode)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No discount</SelectItem>
              <SelectItem value="percentage">Percentage (%)</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {mode !== 'none' && (
          <div className="space-y-2">
            <Label className="text-xs">
              {mode === 'percentage'
                ? `Percent off ${label.toLowerCase()} total`
                : `Amount off ${label.toLowerCase()} total`}
            </Label>
            <Input
              type="number"
              min={0}
              max={mode === 'percentage' ? 100 : subtotal || undefined}
              step={0.01}
              value={value}
              onChange={(e) => onValueChange(e.target.value)}
              placeholder={mode === 'percentage' ? 'e.g. 15' : 'e.g. 500'}
            />
          </div>
        )}
      </div>
      {mode !== 'none' && discountAmt > 0 && (
        <p className="text-xs text-muted-foreground">
          {mode === 'percentage'
            ? `−${discountAmt.toLocaleString()} (${discountVal}%) off ${label.toLowerCase()}`
            : `−${discountAmt.toLocaleString()} off ${label.toLowerCase()}`}
        </p>
      )}
    </div>
  );
}
