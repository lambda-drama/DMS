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
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, FilePenLine } from 'lucide-react';
import { toast } from 'sonner';
import { GroupDiscountFields } from '@/components/group-discount-fields';
import {
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from '@/lib/invoice-discount';
import * as invoicesSvc from '@/services/invoices';
import type { SalesInvoiceDetail } from '@/types/dms';

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

type EditableLine = {
  name: string;
  item_code: string;
  item_name?: string;
  description?: string;
  qty: number;
  rate: number;
};

interface AmendInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Cancelled invoice to amend, or an existing draft to edit. */
  salesInvoice: string;
  /** Fired when a new amended draft is created (list refresh only — keep sheet closed). */
  onAmended?: (draftName: string) => void;
  /** Fired after save/submit when the modal is closing. */
  onSaved?: (invoiceName: string) => void;
}

export function AmendInvoiceDialog({
  open,
  onOpenChange,
  salesInvoice,
  onAmended,
  onSaved,
}: AmendInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [invoice, setInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [lines, setLines] = useState<EditableLine[]>([]);
  const [remarks, setRemarks] = useState('');
  const [discountMode, setDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [discountInput, setDiscountInput] = useState('');
  const [submitAfterSave, setSubmitAfterSave] = useState(false);

  useEffect(() => {
    if (!open || !salesInvoice) return;

    let cancelled = false;
    setLoading(true);
    setInvoice(null);
    setIsEditMode(false);
    setLines([]);
    setRemarks('');
    setDiscountMode('none');
    setDiscountInput('');
    setSubmitAfterSave(false);

    (async () => {
      try {
        let detail = await invoicesSvc.getSalesInvoiceDetail(salesInvoice);
        if (cancelled) return;

        if (detail.docstatus === 2) {
          detail = await invoicesSvc.amendSalesInvoice(salesInvoice);
          if (cancelled) return;
          toast.success(`Amended draft ${detail.name} created`);
          // Refresh list id only — do not open the detail sheet behind this modal.
          onAmended?.(detail.name);
          setIsEditMode(false);
        } else if (detail.docstatus === 0) {
          setIsEditMode(true);
        } else {
          toast.error('Only cancelled or draft invoices can be amended/edited');
          onOpenChange(false);
          return;
        }

        setInvoice(detail);
        setLines(
          (detail.items || []).map((row) => ({
            name: row.name || '',
            item_code: row.item_code,
            item_name: row.item_name,
            description: row.description,
            qty: Number(row.qty) || 0,
            rate: Number(row.rate) || 0,
          }))
        );
        setRemarks(detail.remarks || '');

        const pct = Number(detail.additional_discount_percentage) || 0;
        const amt = Number(detail.discount_amount) || 0;
        if (pct > 0) {
          setDiscountMode('percentage');
          setDiscountInput(String(pct));
        } else if (amt > 0) {
          setDiscountMode('amount');
          setDiscountInput(String(amt));
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Failed to open editor');
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

  const linesSubtotal = useMemo(
    () => lines.reduce((sum, row) => sum + (Number(row.qty) || 0) * (Number(row.rate) || 0), 0),
    [lines]
  );
  const discountValue = parseDiscountValue(discountMode, discountInput);
  const discountTotal = groupDiscountAmount(linesSubtotal, discountMode, discountValue);
  const estimatedNet = Math.max(linesSubtotal - discountTotal, 0);

  const updateLine = (idx: number, patch: Partial<EditableLine>) => {
    setLines((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const handleSave = async () => {
    if (!invoice?.name) return;
    if (!lines.length) {
      toast.error('Invoice has no lines');
      return;
    }
    if (lines.some((r) => !(Number(r.qty) > 0))) {
      toast.error('Each line needs a quantity greater than zero');
      return;
    }
    if (discountMode === 'percentage' && discountValue > 100) {
      toast.error('Discount percentage cannot exceed 100');
      return;
    }
    if (discountMode === 'amount' && discountValue > linesSubtotal && linesSubtotal > 0) {
      toast.error('Discount amount cannot exceed line subtotal');
      return;
    }

    setSaving(true);
    try {
      const updated = await invoicesSvc.updateDraftSalesInvoice({
        name: invoice.name,
        remarks: remarks || undefined,
        items: lines.map((row) => ({
          name: row.name,
          qty: Number(row.qty) || 0,
          rate: Number(row.rate) || 0,
        })),
        discount_mode: discountMode,
        discount:
          discountMode === 'none'
            ? undefined
            : {
                type: discountMode,
                value: discountValue,
              },
        apply_discount_on: 'Net Total',
        submit: submitAfterSave,
      });
      toast.success(
        submitAfterSave
          ? `Invoice ${updated.name} submitted`
          : `Draft ${updated.name} saved`
      );
      onOpenChange(false);
      onSaved?.(updated.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePenLine className="h-5 w-5" />
            {isEditMode ? 'Edit invoice' : 'Amend invoice'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? 'Update quantities, rates, and discounts, then save the draft or submit when ready.'
              : 'A draft amendment is created first. Edit quantities, rates, and discounts, then save or submit when ready.'}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            {isEditMode ? 'Loading draft…' : 'Preparing amended draft…'}
          </div>
        ) : invoice ? (
          <div className="space-y-4">
            <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <span className="font-medium">{invoice.name}</span>
                <span className="text-muted-foreground">
                  {invoice.customer_name || invoice.customer}
                </span>
              </div>
              {invoice.amended_from ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Amended from {invoice.amended_from}
                </p>
              ) : null}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">Lines</p>
              {lines.map((row, idx) => (
                <div
                  key={row.name || `${row.item_code}-${idx}`}
                  className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end"
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
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Qty</Label>
                    <DecimalInput
                      value={row.qty}
                      onValueChange={(v) => updateLine(idx, { qty: v })}
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">Rate</Label>
                    <DecimalInput
                      value={row.rate}
                      onValueChange={(v) => updateLine(idx, { rate: v })}
                    />
                  </div>
                  <div className="sm:col-span-2 sm:text-right">
                    <Label className="text-xs">Amount</Label>
                    <p className="text-sm font-medium">
                      {formatMoney((Number(row.qty) || 0) * (Number(row.rate) || 0), invoice.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <GroupDiscountFields
              label="Invoice"
              mode={discountMode}
              onModeChange={setDiscountMode}
              value={discountInput}
              onValueChange={setDiscountInput}
              subtotal={linesSubtotal}
            />

            <div className="space-y-2 rounded-md border bg-muted/30 px-3 py-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Lines subtotal</span>
                <span>{formatMoney(linesSubtotal, invoice.currency)}</span>
              </div>
              {discountTotal > 0 ? (
                <div className="flex justify-between gap-4 text-amber-700 dark:text-amber-400">
                  <span>Discount</span>
                  <span>−{formatMoney(discountTotal, invoice.currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between gap-4 border-t pt-1.5 font-medium">
                <span>Estimated net (excl. tax)</span>
                <span>{formatMoney(estimatedNet, invoice.currency)}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tax and grand total are recalculated in ERPNext on save.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional remarks"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="amend_submit"
                checked={submitAfterSave}
                onCheckedChange={(c) => setSubmitAfterSave(Boolean(c))}
              />
              <Label htmlFor="amend_submit" className="cursor-pointer font-normal">
                {isEditMode
                  ? 'Submit invoice in ERPNext'
                  : 'Submit amended invoice in ERPNext'}
              </Label>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Close
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={loading || saving || !invoice}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : submitAfterSave ? (
              'Save & submit'
            ) : (
              'Save draft'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
