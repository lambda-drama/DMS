'use client';

import useSWR from 'swr';
import { Loader2, Wallet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import * as paymentSvc from '@/services/paymentEntries';
import type { InvoiceAdvanceReconcileResult } from '@/types/dms';

function formatMoney(amount?: number | null, currency?: string | null) {
  const value = Number(amount || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || ''}`.trim();
  }
}

/** One-line outcome of a reconcile run — used in the success toast. */
export function describeAdvanceReconcile(
  result: Pick<
    InvoiceAdvanceReconcileResult,
    'allocated_total' | 'outstanding_before' | 'outstanding_after' | 'currency'
  >
): string {
  const currency = result.currency || undefined;
  if (result.allocated_total <= 0) {
    return 'No advances were available to apply.';
  }
  return `Advances ${formatMoney(result.allocated_total, currency)} applied · balance ${formatMoney(
    result.outstanding_after,
    currency
  )} (was ${formatMoney(result.outstanding_before, currency)})`;
}

export interface AdvanceReconcileBoxProps {
  /** Party the advances belong to — the box renders nothing without one. */
  customer?: string | null;
  company?: string | null;
  currency?: string | null;
  /** Fetch only while the hosting dialog is open. */
  enabled?: boolean;
  /** Ticked → the screens apply the advances right after creating the invoice. */
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /**
   * ERPNext only settles advances against a *submitted* invoice, so the tick is
   * disabled (with the reason) while the invoice would be left as a draft.
   */
  willSubmit: boolean;
  /** Checkbox id — must be unique in the page. */
  id: string;
  className?: string;
}

/**
 * Downpayment detection for the invoice screens: shows the customer's unallocated
 * advances (receipts not yet matched to an invoice) and lets the user apply them to
 * the invoice that is about to be created.
 */
export function AdvanceReconcileBox({
  customer,
  company,
  currency,
  enabled = true,
  checked,
  onCheckedChange,
  willSubmit,
  id,
  className,
}: AdvanceReconcileBoxProps) {
  const { data, isLoading } = useSWR(
    enabled && customer ? ['customer-advances', customer, company || ''] : null,
    () => paymentSvc.getCustomerAdvances(customer as string, company || undefined)
  );

  if (!customer) return null;

  const advances = data?.advances || [];
  const totalAvailable = data?.total_available || 0;
  const currencyCode = data?.advances?.[0]?.currency || currency;

  if (isLoading && !data) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Checking open advances…
      </p>
    );
  }

  if (!advances.length) {
    return (
      <p className="text-xs text-muted-foreground">
        No open advance (downpayment) for this customer.
      </p>
    );
  }

  return (
    <div className={cn('space-y-2 rounded-md border bg-muted/30 p-3 text-sm', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Wallet className="h-4 w-4" />
          Advance available
        </span>
        <span className="font-medium tabular-nums">
          {formatMoney(totalAvailable, currencyCode)}
        </span>
      </div>
      <ul className="space-y-1 text-xs text-muted-foreground">
        {advances.slice(0, 4).map((advance) => (
          <li key={advance.name} className="flex items-center justify-between gap-3">
            <span className="truncate">
              {[advance.name, advance.posting_date, advance.mode_of_payment]
                .filter(Boolean)
                .join(' · ')}
            </span>
            <span className="whitespace-nowrap tabular-nums">
              {formatMoney(advance.unallocated_amount, advance.currency || currencyCode)}
            </span>
          </li>
        ))}
        {advances.length > 4 ? (
          <li className="italic">+{advances.length - 4} more advance(s)</li>
        ) : null}
      </ul>
      <div className="flex items-start gap-2 border-t pt-2">
        <Checkbox
          id={id}
          checked={checked}
          disabled={!willSubmit}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label htmlFor={id} className="cursor-pointer font-normal disabled:cursor-not-allowed">
            Apply this advance to the invoice now
          </Label>
          <p className="text-xs text-muted-foreground">
            {willSubmit
              ? 'Reconciles the receipt(s) against the new invoice right after creation and shows the balance left to collect.'
              : 'Tick “Submit invoice” above — ERPNext only settles advances against a submitted invoice.'}
          </p>
        </div>
      </div>
    </div>
  );
}
