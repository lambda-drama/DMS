'use client';

import { useEffect, useState } from 'react';
import {
  CollectPaymentDialog as SharedPaymentDialog,
  type CollectPaymentTarget,
  type PaymentMode,
  type PaymentRowPayload,
} from '@/components/payments/collect-payment-dialog';
import * as invoicesSvc from '@/services/invoices';
import * as ordersSvc from '@/services/orders';
import type { DmsOrderPaymentSource } from '@/services/orders';

export interface RecordOrderPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Works with a list row or the full order detail. */
  order: DmsOrderPaymentSource | null;
  onPaid?: () => void;
}

/**
 * Order payment — same modal as invoice collection (split across modes of payment),
 * recorded against the Sales Order so it counts as the order's advance.
 */
export function RecordOrderPaymentDialog({
  open,
  onOpenChange,
  order,
  onPaid,
}: RecordOrderPaymentDialogProps) {
  const [modes, setModes] = useState<PaymentMode[]>([]);

  useEffect(() => {
    if (!open || !order) return;
    setModes([]);
    invoicesSvc
      .listModesOfPayment(order.company)
      .then((rows) => setModes(rows || []))
      .catch(() => setModes([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload on open/order only
  }, [open, order?.name]);

  const target: CollectPaymentTarget | null = order
    ? {
        name: order.name,
        documentLabel: 'order',
        partyName: order.customer_name || order.customer,
        currency: order.currency,
        grandTotal: order.grand_total || 0,
        outstanding: order.balance || 0,
        grandTotalLabel: 'Order total',
        outstandingLabel: 'Order balance',
        dueDate: order.delivery_date,
        docstatus: order.docstatus,
      }
    : null;

  return (
    <SharedPaymentDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Record Payment"
      target={target}
      modes={modes}
      onRecord={async (payments: PaymentRowPayload[], remarks: string) =>
        ordersSvc.recordDmsOrderPayment(order?.name || '', { payments, remarks })
      }
      onPaid={onPaid}
    />
  );
}
