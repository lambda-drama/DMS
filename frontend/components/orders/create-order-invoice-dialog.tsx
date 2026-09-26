'use client';

import { useEffect, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSWRConfig } from 'swr';
import {
  AdvanceReconcileBox,
  describeAdvanceReconcile,
} from '@/components/invoices/advance-reconcile-box';
import * as ordersSvc from '@/services/orders';
import type { DmsOrderPaymentSource } from '@/services/orders';
import * as paymentSvc from '@/services/paymentEntries';

/** SWR key prefix of the shared advance box — invalidated after an advance is applied. */
const ADVANCES_KEY = 'customer-advances';

function formatMoney(amount?: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'ETB',
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

export interface CreateOrderInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Works with a list row or the full order detail. */
  order: DmsOrderPaymentSource | null;
  onCreated?: (invoice: string) => void;
}

/** Raise the Sales Invoice for an order — stock is checked by the server here. */
export function CreateOrderInvoiceDialog({
  open,
  onOpenChange,
  order,
  onCreated,
}: CreateOrderInvoiceDialogProps) {
  const [saving, setSaving] = useState(false);
  const [postingDate, setPostingDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [submit, setSubmit] = useState(true);
  const [reconcileAdvances, setReconcileAdvances] = useState(false);
  const { mutate } = useSWRConfig();

  const currency = order?.currency || 'ETB';

  useEffect(() => {
    if (!open || !order) return;
    setSaving(false);
    const today = new Date().toISOString().slice(0, 10);
    setPostingDate(today);
    setDueDate(today);
    setSubmit(true);
    setReconcileAdvances(false);
  }, [open, order]);

  const handleSubmit = async () => {
    if (!order) return;
    setSaving(true);
    try {
      const res = await ordersSvc.createDmsOrderInvoice(order.name, {
        posting_date: postingDate || null,
        due_date: dueDate || null,
        submit: submit ? 1 : 0,
      });
      const createdMessage = `Invoice ${res.name} created — ${formatMoney(
        res.grand_total,
        currency
      )}${res.docstatus === 0 ? ' (draft)' : ''}`;

      if (reconcileAdvances && submit) {
        // Optional second step: settle the customer's advance against the new
        // invoice and report the balance left to collect.
        try {
          const reconciled = await paymentSvc.reconcileInvoiceAdvances(res.name, order.company);
          void mutate(
            (key) => Array.isArray(key) && key[0] === ADVANCES_KEY,
            undefined,
            { revalidate: true }
          ).catch(() => undefined);
          toast.success(createdMessage, { description: describeAdvanceReconcile(reconciled) });
        } catch (reconcileError) {
          toast.error(createdMessage, {
            description:
              reconcileError instanceof Error
                ? `The advance could not be applied: ${reconcileError.message}`
                : 'The advance could not be applied — reconcile it from the Reconciliation Hub.',
          });
        }
      } else if (reconcileAdvances) {
        toast.warning(createdMessage, {
          description:
            'ERPNext settles advances only against submitted invoices — submit the invoice, then apply the advance.',
        });
      } else {
        toast.success(createdMessage);
      }

      onCreated?.(res.name);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create the invoice');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Sales Invoice</DialogTitle>
          <DialogDescription>
            {order
              ? `Invoices the remaining quantity of order ${order.name}. Stock is verified — the invoice only goes through when the parts are available.`
              : 'Create the invoice for this order.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            Order total {formatMoney(order?.grand_total, currency)} · paid{' '}
            {formatMoney(order?.advance_paid, currency)} · balance{' '}
            {formatMoney(order?.balance, currency)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Posting date</Label>
              <Input
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="order_invoice_submit"
              checked={submit}
              onCheckedChange={(checked) => setSubmit(Boolean(checked))}
            />
            <Label htmlFor="order_invoice_submit" className="cursor-pointer font-normal">
              Submit the invoice
            </Label>
          </div>

          <AdvanceReconcileBox
            id="order_invoice_reconcile_advance"
            customer={order?.customer}
            company={order?.company}
            currency={currency}
            enabled={open}
            checked={reconcileAdvances}
            onCheckedChange={setReconcileAdvances}
            willSubmit={submit}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving || !order}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Create Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
