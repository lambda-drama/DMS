'use client';

import { useEffect, useState } from 'react';
import { Loader2, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  buildLineDiscountPayload,
  discountModeFromBackend,
  lineDiscountAmount,
  lineDiscountBadge,
  type InvoiceDiscountMode,
} from '@/lib/invoice-discount';

export type LineDiscountValue = {
  discount_type: '' | 'Percentage' | 'Amount';
  discount_value: number;
};

interface LineDiscountButtonProps {
  /** Line description used in the dialog copy (e.g. the service or part name). */
  label?: string;
  /** Gross line amount the discount is taken from. */
  lineAmount: number;
  discountType?: string | null;
  discountValue?: number | null;
  disabled?: boolean;
  busy?: boolean;
  onApply: (discount: LineDiscountValue) => void | Promise<void>;
}

/**
 * Compact per-line discount control: a small icon button that opens a modal, so
 * labour / parts tables keep their width. Supports a percentage or a fixed amount.
 */
export function LineDiscountButton({
  label,
  lineAmount,
  discountType,
  discountValue,
  disabled = false,
  busy = false,
  onApply,
}: LineDiscountButtonProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<InvoiceDiscountMode>('none');
  const [raw, setRaw] = useState('');

  useEffect(() => {
    if (!open) return;
    setMode(discountModeFromBackend(discountType));
    setRaw(discountValue ? String(discountValue) : '');
  }, [open, discountType, discountValue]);

  const badge = lineDiscountBadge(discountType, discountValue);
  const previewAmount = lineDiscountAmount(lineAmount, mode, parseFloat(raw) || 0);
  const money = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  const handleSave = async () => {
    await onApply(buildLineDiscountPayload(mode, raw));
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant={badge ? 'secondary' : 'ghost'}
        size={badge ? 'sm' : 'icon'}
        className={cn('h-8 gap-1 px-2 text-xs', !badge && 'w-8 px-0')}
        disabled={disabled || busy}
        aria-label="Line discount"
        title={badge ? `Line discount ${badge}` : 'Add line discount'}
        onClick={() => setOpen(true)}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Percent className="h-4 w-4" />
        )}
        {badge && !busy ? <span>{badge}</span> : null}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Line discount</DialogTitle>
            <DialogDescription>
              Discount on {label ? <span className="font-medium">{label}</span> : 'this line'} —
              gross amount {money(lineAmount)}. Applied before any labour / parts discount.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <div className="space-y-1">
              <Label className="text-xs">Type</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as InvoiceDiscountMode)}>
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
              <div className="space-y-1">
                <Label className="text-xs">
                  {mode === 'percentage' ? 'Percent off this line' : 'Amount off this line'}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={mode === 'percentage' ? 100 : lineAmount || undefined}
                  step="0.01"
                  value={raw}
                  onChange={(e) => setRaw(e.target.value)}
                  placeholder={mode === 'percentage' ? 'e.g. 10' : 'e.g. 500'}
                />
              </div>
            )}

            {mode !== 'none' && previewAmount > 0 && (
              <p className="text-xs text-muted-foreground">
                −{money(previewAmount)} → net{' '}
                <span className="font-medium text-foreground">
                  {money(Math.max(lineAmount - previewAmount, 0))}
                </span>
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {badge ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                disabled={busy}
                onClick={async () => {
                  await onApply({ discount_type: '', discount_value: 0 });
                  setOpen(false);
                }}
              >
                Remove discount
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="button" disabled={busy} onClick={handleSave}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
