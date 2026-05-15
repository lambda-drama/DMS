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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as invoicesSvc from '@/services/invoices';
import type { InvoicePreview } from '@/types/dms';

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobCardId: string;
  onCreated: (invoiceName: string) => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  jobCardId,
  onCreated,
}: CreateInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [submitInvoice, setSubmitInvoice] = useState(true);

  useEffect(() => {
    if (!open || !jobCardId) return;

    let cancelled = false;
    setLoading(true);
    setPreview(null);
    setDueDate(defaultDueDate());
    setSubmitInvoice(true);

    invoicesSvc
      .getInvoicePreviewFromJobCard(jobCardId)
      .then((data) => {
        if (!cancelled) setPreview(data);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          toast.error(err.message || 'Failed to load invoice preview');
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, jobCardId, onOpenChange]);

  const handleCreate = async () => {
    if (!preview) return;

    if (preview.has_labour && !dueDate) {
      toast.error('Due date is required when labour items are on the invoice');
      return;
    }

    setSubmitting(true);
    try {
      const invoiceName = await invoicesSvc.createInvoiceFromJobCard(jobCardId, {
        dueDate: preview.has_labour ? dueDate : dueDate || undefined,
        submit: submitInvoice,
      });
      toast.success(
        submitInvoice
          ? 'Sales invoice created and submitted'
          : 'Sales invoice created as draft'
      );
      onCreated(invoiceName);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const currency = preview?.currency;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Sales Invoice</DialogTitle>
          <DialogDescription>
            Review billable items from job card {jobCardId} before creating the invoice.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <p>
                <span className="text-muted-foreground">Customer: </span>
                <span className="font-medium">{preview.customer_name}</span>
              </p>
            </div>

            <div className="dms-table-panel rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.lines.map((line, idx) => (
                    <TableRow key={`${line.item_code}-${idx}`}>
                      <TableCell>
                        <Badge variant="outline">{line.line_type}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={line.description}>
                        {line.description}
                      </TableCell>
                      <TableCell className="text-right">{line.qty}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(line.rate, currency)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(line.amount, currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between sm:block">
                <span className="text-muted-foreground">Labour</span>
                <span className="font-medium sm:ml-2">
                  {formatMoney(preview.labour_total, currency)}
                </span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-muted-foreground">Parts</span>
                <span className="font-medium sm:ml-2">
                  {formatMoney(preview.parts_total, currency)}
                </span>
              </div>
              {preview.discount_amount > 0 && (
                <div className="flex justify-between sm:block">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium text-destructive sm:ml-2">
                    −{formatMoney(preview.discount_amount, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 sm:col-span-2 sm:block">
                <span className="text-muted-foreground">Estimated subtotal (excl. tax)</span>
                <span className="font-semibold sm:ml-2">
                  {formatMoney(preview.estimated_total, currency)}
                </span>
              </div>
            </div>

            {preview.has_labour && (
              <div className="space-y-2">
                <Label htmlFor="invoice-due-date">Due payment date *</Label>
                <Input
                  id="invoice-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Required when the invoice includes labour items.
                </p>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="submit-invoice"
                checked={submitInvoice}
                onCheckedChange={(v) => setSubmitInvoice(!!v)}
              />
              <Label htmlFor="submit-invoice" className="cursor-pointer font-normal">
                Submit invoice immediately (required to collect payment)
              </Label>
            </div>
          </div>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={loading || submitting || !preview}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
