'use client';

import { useEffect, useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CreditCard } from 'lucide-react';
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
  const [modes, setModes] = useState<{ name: string; type?: string }[]>([]);
  const [modeOfPayment, setModeOfPayment] = useState('');
  const [paidAmount, setPaidAmount] = useState('');
  const [referenceNo, setReferenceNo] = useState('');

  useEffect(() => {
    if (!open || !salesInvoice) return;

    let cancelled = false;
    setLoading(true);
    setInvoice(null);
    setModeOfPayment('');
    setReferenceNo('');

    invoicesSvc
      .getSalesInvoiceDetail(salesInvoice)
      .then(async (inv) => {
        if (cancelled) return;
        setInvoice(inv);
        const paymentModes = await invoicesSvc.listModesOfPayment(inv.company);
        if (cancelled) return;
        setModes(paymentModes);
        setPaidAmount(String(inv.outstanding_amount || 0));
        if (paymentModes.length > 0) {
          setModeOfPayment(paymentModes[0].name);
        }
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

  const handlePay = async () => {
    if (!invoice) return;

    if (invoice.docstatus !== 1) {
      toast.error('Submit the sales invoice in ERPNext before collecting payment');
      return;
    }

    if (!modeOfPayment) {
      toast.error('Select a mode of payment');
      return;
    }

    const amount = parseFloat(paidAmount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    setSubmitting(true);
    try {
      const result = await invoicesSvc.collectPayment({
        salesInvoice: invoice.name,
        modeOfPayment,
        paidAmount: amount,
        referenceNo: referenceNo.trim() || undefined,
      });
      toast.success(`Payment recorded (${result.payment_entry})`);
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Collect Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment against sales invoice {salesInvoice}.
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
              <>
                <div className="space-y-2">
                  <Label htmlFor="pay-amount">Amount to collect</Label>
                  <Input
                    id="pay-amount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Mode of payment *</Label>
                  <Select value={modeOfPayment} onValueChange={setModeOfPayment}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {modes.map((m) => (
                        <SelectItem key={m.name} value={m.name}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay-reference">Reference no. (optional)</Label>
                  <Input
                    id="pay-reference"
                    value={referenceNo}
                    onChange={(e) => setReferenceNo(e.target.value)}
                    placeholder="Cheque / transaction reference"
                  />
                </div>
              </>
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
