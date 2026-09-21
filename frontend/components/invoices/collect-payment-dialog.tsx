'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  CollectPaymentDialog as SharedPaymentDialog,
  type CollectPaymentTarget,
  type PaymentMode,
  type PaymentRowPayload,
} from '@/components/payments/collect-payment-dialog';
import * as invoicesSvc from '@/services/invoices';
import type { SalesInvoiceDetail } from '@/types/dms';

export interface CollectPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesInvoice: string;
  onPaid?: () => void;
}

/**
 * Invoice payment — loads the invoice + modes of payment and hands them to the
 * shared multi-mode payment modal.
 */
export function CollectPaymentDialog({
  open,
  onOpenChange,
  salesInvoice,
  onPaid,
}: CollectPaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<SalesInvoiceDetail | null>(null);
  const [modes, setModes] = useState<PaymentMode[]>([]);

  useEffect(() => {
    if (!open || !salesInvoice) return;

    let cancelled = false;
    setLoading(true);
    setInvoice(null);
    setModes([]);

    invoicesSvc
      .getSalesInvoiceDetail(salesInvoice)
      .then(async (inv) => {
        if (cancelled) return;
        setInvoice(inv);
        const paymentModes = await invoicesSvc.listModesOfPayment(inv.company);
        if (!cancelled) setModes(paymentModes);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on open/invoice only
  }, [open, salesInvoice]);

  const target: CollectPaymentTarget | null = invoice
    ? {
        name: invoice.name,
        documentLabel: 'sales invoice',
        partyName: invoice.customer_name || invoice.customer,
        currency: invoice.currency,
        grandTotal: invoice.grand_total || 0,
        outstanding: invoice.outstanding_amount || 0,
        dueDate: invoice.due_date,
        docstatus: invoice.docstatus,
      }
    : null;

  return (
    <SharedPaymentDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Collect Payment"
      target={target}
      modes={modes}
      loading={loading}
      onRecord={async (payments: PaymentRowPayload[], remarks: string) =>
        invoicesSvc.collectPayment({
          salesInvoice,
          payments,
          remarks: remarks || undefined,
        })
      }
      onPaid={onPaid}
    />
  );
}
