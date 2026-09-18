'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Loader2, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import * as invoicesSvc from '@/services/invoices';
import type { CreditNotePreview } from '@/types/dms';

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function todayIsoDate() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

type EditableLine = {
  /** Original Sales Invoice Item row name (override key). */
  name: string;
  item_code: string;
  item_name?: string;
  description?: string;
  originalQty: number;
  returnedQty: number;
  maxQty: number;
  rate: number;
  originalRate: number;
  qty: number;
  include: boolean;
};

interface CreditNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Submitted invoice the credit note is raised against. */
  salesInvoice: string;
  /** Fired after the credit note is created / submitted. */
  onCreated?: (creditNoteName: string) => void;
}

export function CreditNoteDialog({
  open,
  onOpenChange,
  salesInvoice,
  onCreated,
}: CreditNoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<CreditNotePreview | null>(null);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [postingDate, setPostingDate] = useState('');
  const [reason, setReason] = useState('');
  const [reverseTaxes, setReverseTaxes] = useState(true);
  const [submitAfterCreate, setSubmitAfterCreate] = useState(true);

  useEffect(() => {
    if (!open || !salesInvoice) return;

    let cancelled = false;
    setLoading(true);
    setPreview(null);
    setLines([]);
    setPostingDate('');
    setReason('');
    setReverseTaxes(true);
    setSubmitAfterCreate(true);

    (async () => {
      try {
        const data = await invoicesSvc.getCreditNotePreview(salesInvoice);
        if (cancelled) return;

        setPreview(data);
        setPostingDate(data.posting_date || todayIsoDate());
        setReverseTaxes((Number(data.total_taxes_and_charges) || 0) > 0);
        setLines(
          (data.lines || []).map((line) => ({
            name: line.name,
            item_code: line.item_code,
            item_name: line.item_name,
            description: line.description,
            originalQty: Number(line.qty) || 0,
            returnedQty: Number(line.returned_qty) || 0,
            maxQty: Number(line.returnable_qty) || 0,
            rate: Number(line.rate) || 0,
            originalRate: Number(line.rate) || 0,
            qty: Number(line.returnable_qty) || 0,
            include: (Number(line.returnable_qty) || 0) > 0,
          }))
        );
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Failed to load credit note data');
          onOpenChange(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per open/invoice
  }, [open, salesInvoice]);

  const updateLine = (idx: number, patch: Partial<EditableLine>) => {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const removeLine = (idx: number) => {
    updateLine(idx, { include: false, qty: 0 });
  };

  const restoreLine = (idx: number) => {
    setLines((prev) =>
      prev.map((row, i) =>
        i === idx ? { ...row, include: true, qty: row.maxQty, rate: row.originalRate } : row
      )
    );
  };

  const resetAll = () => {
    setLines((prev) =>
      prev.map((row) => ({
        ...row,
        include: row.maxQty > 0,
        qty: row.maxQty,
        rate: row.originalRate,
      }))
    );
  };

  const includedLines = useMemo(
    () => lines.filter((row) => row.include && Number(row.qty) > 0),
    [lines]
  );

  const creditSubtotal = useMemo(
    () =>
      includedLines.reduce(
        (sum, row) => sum + (Number(row.qty) || 0) * (Number(row.rate) || 0),
        0
      ),
    [includedLines]
  );

  const creditedCount = lines.filter((row) => row.returnedQty > 0).length;

  const handleCreate = async () => {
    if (!preview) return;

    const overQty = includedLines.find((row) => row.qty > row.maxQty + 0.0001);
    if (overQty) {
      toast.error(
        `Quantity for ${overQty.item_code} cannot exceed ${overQty.maxQty} (returnable).`
      );
      return;
    }
    if (!includedLines.length) {
      toast.error('Select at least one line with a quantity to credit.');
      return;
    }
    if (postingDate && preview.posting_date && postingDate < preview.posting_date) {
      toast.error(`Credit note date cannot be before the invoice date ${preview.posting_date}.`);
      return;
    }

    setSaving(true);
    try {
      const result = await invoicesSvc.createCreditNote({
        salesInvoice: preview.name,
        postingDate: postingDate || undefined,
        remarks: reason || undefined,
        // true → inherit the original invoice taxes (default ERPNext return behaviour).
        applyTaxes: reverseTaxes ? undefined : false,
        submit: submitAfterCreate,
        lines: lines.map((row) => ({
          name: row.name,
          qty: row.qty,
          rate: row.rate,
          include: row.include && row.qty > 0,
        })),
      });

      const creditNoteName = result.credit_note?.name || result.name;
      toast.success(
        submitAfterCreate
          ? `Credit note ${creditNoteName} submitted`
          : `Credit note draft ${creditNoteName} created`
      );
      onOpenChange(false);
      onCreated?.(creditNoteName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create credit note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" />
            Credit note
          </DialogTitle>
          <DialogDescription>
            Adjust quantities, change rates, or remove lines to raise a credit note against this
            invoice. Taxes and inventory are reversed the same way ERPNext returns work.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading credit note data…
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{preview.name}</span>
                <span className="text-muted-foreground">
                  {preview.customer_name || preview.customer}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Invoice total {formatMoney(Number(preview.grand_total) || 0, preview.currency)}
                {creditedCount > 0 ? ` · ${creditedCount} line(s) already credited` : ''}
              </p>
            </div>

            {!preview.has_returnable_lines ? (
              <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Every line on this invoice has already been fully credited. There is nothing left
                  to credit.
                </span>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium">Lines to credit</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={resetAll}
                  >
                    <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                    Reset to full credit
                  </Button>
                </div>

                <div className="space-y-3">
                  {lines.map((row, idx) => {
                    const disabled = row.maxQty <= 0;
                    return (
                      <div
                        key={row.name || `${row.item_code}-${idx}`}
                        className={`grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end ${
                          row.include ? '' : 'opacity-60'
                        }`}
                      >
                        <div className="sm:col-span-5">
                          <Label className="text-xs">Item</Label>
                          <p className="truncate text-sm font-medium" title={row.item_code}>
                            {row.item_code}
                          </p>
                          {(row.item_name || row.description) &&
                          (row.item_name || row.description) !== row.item_code ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {row.item_name || row.description}
                            </p>
                          ) : null}
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            Invoiced {row.originalQty}
                            {row.returnedQty > 0 ? ` · Credited ${row.returnedQty}` : ''}
                            {` · Returnable ${row.maxQty}`}
                          </p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                          <Label className="text-xs">Credit qty</Label>
                          <DecimalInput
                            value={row.qty}
                            disabled={disabled || !row.include}
                            onValueChange={(v) => updateLine(idx, { qty: v })}
                          />
                        </div>
                        <div className="space-y-1 sm:col-span-3">
                          <Label className="text-xs">Rate</Label>
                          <DecimalInput
                            value={row.rate}
                            disabled={disabled || !row.include}
                            onValueChange={(v) => updateLine(idx, { rate: v })}
                          />
                        </div>
                        <div className="sm:col-span-2 sm:text-right">
                          <Label className="text-xs">Amount</Label>
                          <p className="text-sm font-medium">
                            {formatMoney(
                              (Number(row.qty) || 0) * (Number(row.rate) || 0),
                              preview.currency
                            )}
                          </p>
                        </div>
                        <div className="sm:col-span-12 sm:flex sm:justify-end">
                          {row.include ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                              disabled={disabled}
                              onClick={() => removeLine(idx)}
                            >
                              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                              Remove line
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs"
                              disabled={disabled}
                              onClick={() => restoreLine(idx)}
                            >
                              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                              Keep line
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-1.5 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex justify-between gap-4 font-medium">
                    <span>Credit subtotal (excl. tax)</span>
                    <span>{formatMoney(creditSubtotal, preview.currency)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Taxes and grand total are recalculated in ERPNext when the credit note is saved.
                  </p>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="credit_note_date">Credit note date</Label>
                <Input
                  id="credit_note_date"
                  type="date"
                  value={postingDate}
                  min={preview.posting_date || undefined}
                  onChange={(e) => setPostingDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Original invoice date</Label>
                <p className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm text-muted-foreground">
                  {preview.posting_date || '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="credit_note_reason">Reason / remarks</Label>
              <Textarea
                id="credit_note_reason"
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Price correction, returned part, warranty adjustment"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="credit_note_reverse_taxes"
                  checked={reverseTaxes}
                  onCheckedChange={(c) => setReverseTaxes(Boolean(c))}
                />
                <Label htmlFor="credit_note_reverse_taxes" className="cursor-pointer font-normal">
                  Reverse taxes / charges from the original invoice
                </Label>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Uncheck to raise the credit note without reversing taxes.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="credit_note_submit"
                checked={submitAfterCreate}
                onCheckedChange={(c) => setSubmitAfterCreate(Boolean(c))}
              />
              <Label htmlFor="credit_note_submit" className="cursor-pointer font-normal">
                Submit credit note in ERPNext
              </Label>
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Close
          </Button>
          <Button
            type="button"
            onClick={() => void handleCreate()}
            disabled={
              loading ||
              saving ||
              !preview ||
              !preview.has_returnable_lines ||
              !includedLines.length
            }
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : submitAfterCreate ? (
              'Create & submit credit note'
            ) : (
              'Create draft credit note'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

