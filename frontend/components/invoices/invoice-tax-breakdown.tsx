'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InvoiceTaxPreview } from '@/services/invoices';

function formatMoney(value?: number | null, currency?: string | null) {
  const amount = Number(value || 0);
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'ETB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency || ''}`.trim();
  }
}

export interface InvoiceTaxBreakdownProps {
  /** Discounted subtotal — the net total the taxes are calculated on. */
  subtotal: number;
  currency?: string | null;
  applyTaxes: boolean;
  applyTaxWithholding: boolean;
  preview: InvoiceTaxPreview | null;
  isLoading?: boolean;
  /**
   * Overrides the final amount. The order screen uses it to show the order's own
   * grand total (withholding is deducted on the invoice, not on the order).
   */
  totalOverride?: number | null;
  /** Label for the final row. Defaults to "Total payable (incl. VAT)". */
  totalLabel?: string;
  className?: string;
}

/**
 * Subtotal → VAT → tax withholding (TCS) → total payable for an invoice that has
 * not been created yet. The amounts come from `get_invoice_tax_preview`, which runs
 * ERPNext's own totals on an unsaved invoice, so they match the saved invoice.
 */
export function InvoiceTaxBreakdown({
  subtotal,
  currency,
  applyTaxes,
  applyTaxWithholding,
  preview,
  isLoading,
  totalOverride,
  totalLabel,
  className,
}: InvoiceTaxBreakdownProps) {
  const vat = preview?.vat_amount || 0;
  const withholding = preview?.withholding_amount || 0;
  const grandTotal =
    totalOverride != null ? totalOverride : preview ? preview.grand_total : subtotal;
  const finalLabel = totalLabel || `Total payable${applyTaxes ? ' (incl. VAT)' : ''}`;
  const currencyCode = preview?.currency || currency || undefined;
  const showVatRow = applyTaxes;
  const showWithholdingRow = applyTaxWithholding;

  return (
    <div className={cn('space-y-1.5 rounded-md border bg-muted/30 p-3 text-sm', className)}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground">Net total (excl. tax)</span>
        <span className="font-medium tabular-nums">
          {formatMoney(subtotal, currencyCode)}
        </span>
      </div>

      {showVatRow ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            VAT
            {preview?.tax_template ? (
              <span className="ml-1 text-xs">({preview.tax_template})</span>
            ) : null}
          </span>
          <span className="font-medium tabular-nums">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              formatMoney(vat, currencyCode)
            )}
          </span>
        </div>
      ) : null}

      {showWithholdingRow ? (
        <div className="flex items-center justify-between gap-3">
          <span className="text-muted-foreground">
            Tax withholding (TCS)
            {preview?.withholding_category ? (
              <span className="ml-1 text-xs">({preview.withholding_category})</span>
            ) : null}
          </span>
          <span className="font-medium tabular-nums text-destructive">
            {isLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            ) : (
              formatMoney(withholding, currencyCode)
            )}
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3 border-t pt-1.5">
        <span className="font-medium">{finalLabel}</span>
        <span className="font-semibold tabular-nums">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            formatMoney(grandTotal, currencyCode)
          )}
        </span>
      </div>

      {preview?.message ? (
        <p className="pt-1 text-xs text-destructive">{preview.message}</p>
      ) : null}
      {isLoading && !preview ? (
        <p className="pt-1 text-xs text-muted-foreground">Calculating taxes…</p>
      ) : null}
    </div>
  );
}
