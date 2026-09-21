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
import * as ordersSvc from '@/services/orders';
import type { DmsOrderPaymentSource } from '@/services/orders';

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

  const currency = order?.currency || 'ETB';

  useEffect(() => {
    if (!open || !order) return;
    setSaving(false);
    const today = new Date().toISOString().slice(0, 10);
    setPostingDate(today);
    setDueDate(today);
    setSubmit(true);
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
      toast.success(
        `Invoice ${res.name} created — ${formatMoney(res.grand_total, currency)}${
          res.docstatus === 0 ? ' (draft)' : ''
        }`
      );
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
