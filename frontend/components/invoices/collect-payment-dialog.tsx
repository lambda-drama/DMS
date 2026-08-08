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
import { Input } from '@/components/ui/input';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CreditCard, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import * as invoicesSvc from '@/services/invoices';
import type { SalesInvoiceDetail } from '@/types/dms';

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

type PaymentRow = {
  id: string;
  mode_of_payment: string;
  amount: number;
  reference_no: string;
};

function newPaymentRow(mode = '', amount = 0): PaymentRow {
  return {
    id: crypto.randomUUID(),
    mode_of_payment: mode,
    amount,
    reference_no: '',
  };
}

interface CollectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesInvoice: string;
  onPaid?: () => void;
}

export function CollectPaymentDialog({
  open,
  onOpenChange,
  salesInvoice,
  onPaid,
}: CollectPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [invoice, setInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [modes, setModes] = useState<
    { name: string; type?: string; account?: string | null; account_name?: string | null }[]
  >([]);
  const [rows, setRows] = useState<PaymentRow[]>([newPaymentRow()]);

  useEffect(() => {
    if (!open || !salesInvoice) return;

    let cancelled = false;
    setLoading(true);
    setInvoice(null);
    setRows([newPaymentRow()]);

    invoicesSvc
      .getSalesInvoiceDetail(salesInvoice)
      .then(async (inv) => {
        if (cancelled) return;
        setInvoice(inv);
        const paymentModes = await invoicesSvc.listModesOfPayment(inv.company);
        if (cancelled) return;
        setModes(paymentModes);
        const defaultMode = paymentModes[0]?.name || '';
        setRows([newPaymentRow(defaultMode, inv.outstanding_amount || 0)]);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          toast.error(err.message || 'Failed to load invoice');
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, salesInvoice, onOpenChange]);

  const outstanding = invoice?.outstanding_amount || 0;
  const totalPaid = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows]
  );
  const remaining = Math.round((outstanding - totalPaid) * 100) / 100;

  const updateRow = (id: string, patch: Partial<PaymentRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    const nextMode =
      modes.find((m) => !rows.some((r) => r.mode_of_payment === m.name))?.name ||
      modes[0]?.name ||
      '';
    setRows((prev) => [...prev, newPaymentRow(nextMode, Math.max(remaining, 0))]);
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const handlePay = async () => {
    if (!invoice) return;

    if (invoice.docstatus !== 1) {
      toast.error('Submit the sales invoice in ERPNext before collecting payment');
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

    if (payments.some((p) => !p.mode_of_payment)) {
      toast.error('Select a mode of payment for each row');
      return;
    }

    if (totalPaid <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    if (totalPaid > outstanding + 0.01) {
      toast.error(
        `Payment total (${formatMoney(totalPaid, invoice.currency)}) exceeds outstanding (${formatMoney(outstanding, invoice.currency)})`
      );
      return;
    }

    setSubmitting(true);
    try {
      const result = await invoicesSvc.collectPayment({
        salesInvoice: invoice.name,
        payments,
      });
      const peLabel =
        result.payment_entries && result.payment_entries.length > 1
          ? result.payment_entries.join(', ')
          : result.payment_entry;
      toast.success(`Payment recorded (${peLabel})`);
      onPaid?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  const currency = invoice?.currency;
  const canPay =
    invoice &&
    invoice.docstatus === 1 &&
    (invoice.outstanding_amount || 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Collect Payment
          </DialogTitle>
          <DialogDescription>
            Record payment against sales invoice {salesInvoice}. Split across as many modes as needed.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : invoice ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Customer: </span>
                {invoice.customer_name || invoice.customer}
              </p>
              <p>
                <span className="text-muted-foreground">Grand total: </span>
                <span className="font-medium">
                  {formatMoney(invoice.grand_total || 0, currency)}
                </span>
              </p>
              <p>
                <span className="text-muted-foreground">Outstanding: </span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">
                  {formatMoney(invoice.outstanding_amount || 0, currency)}
                </span>
              </p>
              {invoice.due_date && (
                <p>
                  <span className="text-muted-foreground">Due date: </span>
                  {new Date(invoice.due_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {invoice.docstatus !== 1 && (
              <p className="text-sm text-destructive">
                This invoice is still a draft. Submit it before collecting payment.
              </p>
            )}

            {canPay && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Label>Modes of payment *</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addRow}>
                    <Plus className="mr-1 h-4 w-4" />
                    Add mode
                  </Button>
                </div>

                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    className="space-y-3 rounded-lg border p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Payment {index + 1}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        disabled={rows.length <= 1}
                        onClick={() => removeRow(row.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Mode *</Label>
                        <Select
                          value={row.mode_of_payment || undefined}
                          onValueChange={(mode_of_payment) =>
                            updateRow(row.id, { mode_of_payment })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {modes.map((m) => {
                              const accountLabel =
                                m.account_name && m.account && m.account_name !== m.account
                                  ? `${m.account_name} (${m.account})`
                                  : m.account_name || m.account;
                              return (
                                <SelectItem key={m.name} value={m.name}>
                                  {accountLabel ? `${m.name} — ${accountLabel}` : m.name}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Amount *</Label>
                        <DecimalInput
                          min={0}
                          blankWhenZero={false}
                          value={row.amount}
                          onValueChange={(amount) => updateRow(row.id, { amount })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Reference no. (optional)</Label>
                      <Input
                        value={row.reference_no}
                        onChange={(e) =>
                          updateRow(row.id, { reference_no: e.target.value })
                        }
                        placeholder="Cheque / transaction reference"
                      />
                    </div>
                  </div>
                ))}

                <div className="rounded-lg border bg-muted/20 px-3 py-2 text-sm space-y-1">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Total collecting</span>
                    <span className="font-medium">{formatMoney(totalPaid, currency)}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Still outstanding</span>
                    <span
                      className={
                        remaining < -0.01
                          ? 'font-medium text-destructive'
                          : 'font-medium'
                      }
                    >
                      {formatMoney(Math.max(remaining, 0), currency)}
                      {remaining < -0.01 ? ' (over)' : ''}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {(invoice.outstanding_amount || 0) <= 0 && invoice.docstatus === 1 && (
              <p className="text-sm text-muted-foreground">This invoice is fully paid.</p>
            )}
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handlePay} disabled={loading || submitting || !canPay}>
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
