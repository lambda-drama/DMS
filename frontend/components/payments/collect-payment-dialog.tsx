'use client';

import { formatDate } from '@/lib/date-format';

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
import { AddLineButton } from '@/components/ui/add-line-button';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export type PaymentMode = {
  name: string;
  type?: string;
  account?: string | null;
  account_name?: string | null;
};

export type PaymentRow = {
  id: string;
  mode_of_payment: string;
  amount: number;
  reference_no: string;
};

export type PaymentRowPayload = {
  mode_of_payment: string;
  amount: number;
  reference_no?: string;
  remarks?: string;
};

export function newPaymentRow(mode = '', amount = 0): PaymentRow {
  return { id: crypto.randomUUID(), mode_of_payment: mode, amount, reference_no: '' };
}

/** Document a payment is recorded against — a Sales Invoice or a Sales Order. */
export type CollectPaymentTarget = {
  name: string;
  documentLabel: string;
  partyName?: string;
  currency?: string;
  grandTotal?: number;
  /** Amount still to collect (invoice outstanding / order balance). */
  outstanding?: number;
  grandTotalLabel?: string;
  outstandingLabel?: string;
  dueDate?: string | null;
  /** 1 = submitted; anything else blocks payment. */
  docstatus?: number;
};

export interface CollectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: CollectPaymentTarget | null;
  modes: PaymentMode[];
  loading?: boolean;
  title?: string;
  closeOnRecord?: boolean;
  onRecord: (
    payments: PaymentRowPayload[],
    remarks: string
  ) => Promise<{ payment_entry?: string; payment_entries?: string[] }>;
  onPaid?: () => void;
}

/** Shared multi-mode payment modal — one row per mode of payment. */
export function CollectPaymentDialog({
  open,
  onOpenChange,
  target,
  modes,
  loading = false,
  title = 'Collect Payment',
  closeOnRecord = true,
  onRecord,
  onPaid,
}: CollectPaymentDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [rows, setRows] = useState<PaymentRow[]>([newPaymentRow()]);
  const [remarks, setRemarks] = useState('');

  const outstanding = target?.outstanding || 0;
  const currency = target?.currency;

  useEffect(() => {
    if (!open || !target) return;
    setSubmitting(false);
    setRows([newPaymentRow(modes[0]?.name || '', outstanding)]);
    setRemarks('');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on open/target only
  }, [open, target?.name]);

  // Modes load asynchronously — give the first row a default once they arrive.
  useEffect(() => {
    if (!open || !modes.length) return;
    setRows((prev) =>
      prev.map((row) => (row.mode_of_payment ? row : { ...row, mode_of_payment: modes[0].name }))
    );
  }, [open, modes]);

  const totalPaid = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows]
  );
  const remaining = Math.round((outstanding - totalPaid) * 100) / 100;

  const updateRow = (id: string, patch: Partial<PaymentRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((prev) => {
      const paid = prev.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);
      const rem = Math.round((outstanding - paid) * 100) / 100;
      const nextMode =
        modes.find((mode) => !prev.some((row) => row.mode_of_payment === mode.name))?.name ||
        modes[0]?.name ||
        '';
      return [...prev, newPaymentRow(nextMode, Math.max(rem, 0))];
    });
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const handleRecord = async () => {
    if (!target) return;

    if (target.docstatus !== undefined && target.docstatus !== 1) {
      toast.error(`Submit the ${target.documentLabel} before recording a payment`);
      return;
    }

    const payments = rows
      .filter((row) => row.mode_of_payment && Number(row.amount) > 0)
      .map((row) => ({
        mode_of_payment: row.mode_of_payment,
        amount: Number(row.amount),
        reference_no: row.reference_no.trim() || undefined,
      }));

    if (!payments.length) {
      toast.error('Add at least one mode of payment with an amount');
      return;
    }
    if (totalPaid <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const result = await onRecord(payments, remarks.trim());
      const label =
        result.payment_entries && result.payment_entries.length > 1
          ? result.payment_entries.join(', ')
          : result.payment_entry || '';
      toast.success(`Payment recorded${label ? ` (${label})` : ''}`);
      onPaid?.();
      if (closeOnRecord) onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const canPay = Boolean(target) && target!.docstatus === 1 && (target!.outstanding || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full flex-col gap-4 overflow-hidden sm:max-w-3xl">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {target
              ? `Record payment against ${target.documentLabel} ${target.name}. Split across as many modes as needed.`
              : 'Record a payment'}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : target ? (
            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Customer: </span>
                  {target.partyName || '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {target.grandTotalLabel || 'Grand total'}:{' '}
                  </span>
                  <span className="font-medium">
                    {formatMoney(target.grandTotal || 0, currency)}
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">
                    {target.outstandingLabel || 'Outstanding'}:{' '}
                  </span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">
                    {formatMoney(target.outstanding || 0, currency)}
                  </span>
                </p>
                {target.dueDate ? (
                  <p>
                    <span className="text-muted-foreground">Due date: </span>
                    {formatDate(target.dueDate)}
                  </p>
                ) : null}
              </div>

              {target.docstatus !== 1 ? (
                <p className="text-sm text-destructive">
                  This {target.documentLabel} is still a draft. Submit it before recording a payment.
                </p>
              ) : null}

              {canPay ? (
                <div className="space-y-3">
                  <div className="hidden items-center gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(0,1fr)_2.25rem]">
                    <span>Mode *</span>
                    <span>Amount *</span>
                    <span>Reference (optional)</span>
                    <span className="sr-only">Remove</span>
                  </div>

                  <Label className="sm:hidden">Modes of payment *</Label>

                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className="grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(0,1fr)_2.25rem] sm:border-0 sm:p-0"
                    >
                      <div className="space-y-1 sm:space-y-0">
                        <Label className="text-xs sm:hidden">Mode *</Label>
                        <Select
                          value={row.mode_of_payment || undefined}
                          onValueChange={(mode_of_payment) => updateRow(row.id, { mode_of_payment })}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {modes.map((mode) => {
                              const accountLabel =
                                mode.account_name &&
                                mode.account &&
                                mode.account_name !== mode.account
                                  ? `${mode.account_name} (${mode.account})`
                                  : mode.account_name || mode.account;
                              return (
                                <SelectItem key={mode.name} value={mode.name}>
                                  {accountLabel ? `${mode.name} — ${accountLabel}` : mode.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 sm:space-y-0">
                        <Label className="text-xs sm:hidden">Amount *</Label>
                        <DecimalInput
                          min={0}
                          blankWhenZero={false}
                          value={row.amount}
                          onValueChange={(amount) => updateRow(row.id, { amount })}
                        />
                      </div>

                      <div className="space-y-1 sm:space-y-0">
                        <Label className="text-xs sm:hidden">Reference</Label>
                        <Input
                          value={row.reference_no}
                          onChange={(e) => updateRow(row.id, { reference_no: e.target.value })}
                          placeholder="Cheque / txn ref"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 justify-self-end text-destructive sm:justify-self-center"
                        disabled={rows.length <= 1}
                        onClick={() => removeRow(row.id)}
                        aria-label="Remove payment mode"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  <AddLineButton onClick={addRow} label="Add mode" />

                  <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm space-y-1">
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">Total collecting</span>
                      <span className="font-medium">{formatMoney(totalPaid, currency)}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-muted-foreground">
                        {remaining < -0.01 ? 'Change / advance' : 'Still outstanding'}
                      </span>
                      <span className="font-medium">
                        {formatMoney(
                          remaining < -0.01 ? Math.abs(remaining) : Math.max(remaining, 0),
                          currency
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="collect-payment-remarks">Remarks</Label>
                    <Textarea
                      id="collect-payment-remarks"
                      rows={2}
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Optional note — saved on the payment as DMS remarks"
                    />
                  </div>
                </div>
              ) : null}

              {(target.outstanding || 0) <= 0 && target.docstatus === 1 ? (
                <p className="text-sm text-muted-foreground">
                  This {target.documentLabel} is fully paid.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t pt-4 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleRecord()} disabled={loading || submitting || !canPay}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing…
              </>
            ) : (
              'Record Payment'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
