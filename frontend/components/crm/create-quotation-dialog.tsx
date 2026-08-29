'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  createQuotationFromOpportunity,
  getQuotationPreview,
  updateOpportunity,
} from '@/services/crm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2 } from 'lucide-react';

type CreateQuotationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunityId: string;
  onCreated: (quotation: string) => void;
  onError?: (error: unknown, fallback: string) => void;
  /** Save deal form before creating quotation (deal page). */
  dealPayload?: Record<string, unknown>;
};

function formatMoney(amount: number, currency?: string, symbol?: string) {
  const code = currency || 'USD';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${symbol || code} ${amount.toLocaleString()}`;
  }
}

export function CreateQuotationDialog({
  open,
  onOpenChange,
  opportunityId,
  onCreated,
  onError,
  dealPayload,
}: CreateQuotationDialogProps) {
  const [applyTaxes, setApplyTaxes] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const { data: preview, isLoading, mutate, error: previewError } = useSWR(
    open && opportunityId ? ['crm-quotation-preview', opportunityId, applyTaxes] : null,
    () => getQuotationPreview(opportunityId, applyTaxes)
  );

  useEffect(() => {
    if (!open) {
      setApplyTaxes(true);
      setSubmitting(false);
    }
  }, [open]);

  useEffect(() => {
    if (open && opportunityId) void mutate();
  }, [open, opportunityId, applyTaxes, mutate]);

  const vinLabels =
    preview?.vin_labels?.length
      ? preview.vin_labels
      : preview?.vin
        ? [preview.vin.vin_number]
        : [];

  const money = (amount: number) =>
    formatMoney(amount, preview?.currency, preview?.currency_symbol);

  const onConfirm = async () => {
    setSubmitting(true);
    try {
      if (dealPayload) {
        await updateOpportunity(opportunityId, dealPayload);
      }
      const result = await createQuotationFromOpportunity(opportunityId, false, applyTaxes);
      const quotation = String(result?.quotation || '');
      onOpenChange(false);
      if (quotation) onCreated(quotation);
    } catch (e: unknown) {
      onError?.(e, 'Failed to create quotation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quotation</DialogTitle>
          <DialogDescription>
            Review the items that will be added to the quotation. After you create it, it
            appears in Quotations — no ERPNext redirect.
            {preview?.source ? ` Source: ${preview.source.toLowerCase()}.` : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : previewError ? (
          <p className="text-sm text-destructive">Unable to load quotation preview.</p>
        ) : preview ? (
          <div className="space-y-3">
            {vinLabels.length ? (
              <div className="rounded-md border border-border/70 bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">
                  Vehicle VIN{vinLabels.length !== 1 ? 's' : ''}:{' '}
                </span>
                {vinLabels.join(', ')}
                {preview.vin?.model_name && !preview.vin_labels?.length
                  ? ` · ${preview.vin.model_name}`
                  : ''}
              </div>
            ) : null}

            <div className="overflow-hidden rounded-lg border border-border/70">
              <div className="space-y-2 p-3 text-sm">
                {preview.items.length ? (
                  preview.items.map((item, index) => (
                    <div
                      key={`${item.item_code}-${index}`}
                      className="grid gap-1 border-b border-border/50 pb-2 last:border-0 last:pb-0 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:gap-4"
                    >
                      <div>
                        <div className="font-medium">{item.item_name || item.item_code}</div>
                        <div className="text-xs text-muted-foreground">
                          {item.item_code}
                          {item.line_source === 'vehicle' ? ' · Vehicle' : ''}
                        </div>
                      </div>
                      <div className="text-muted-foreground">
                        {item.qty} × {money(Number(item.rate || 0))}
                      </div>
                      <div className="font-medium">{money(Number(item.net_amount || 0))}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No items found for this deal.</p>
                )}
              </div>
              <div className="space-y-1 border-t border-border/70 bg-muted/30 px-3 py-2 text-sm">
                <div className="flex justify-between">
                  <span>Net total</span>
                  <span>{money(Number(preview.net_total || 0))}</span>
                </div>
                {applyTaxes ? (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes / VAT</span>
                    <span>{money(Number(preview.total_taxes_and_charges || 0))}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-semibold">
                  <span>Estimated total</span>
                  <span>{money(Number(preview.grand_total ?? preview.net_total ?? 0))}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={applyTaxes}
                  onChange={(event) => setApplyTaxes(event.target.checked)}
                />
                Include taxes / tax withholding
              </label>
              <p className="pl-6 text-xs text-muted-foreground">
                Applies the Default Taxes and Charges Template from DMS Settings
                {preview.dms_taxes_and_charges_template
                  ? ` (${preview.dms_taxes_and_charges_template})`
                  : ''}
                . Uncheck only if you want a draft quotation without taxes.
              </p>
              {!applyTaxes && preview.dms_taxes_and_charges_template ? (
                <p className="pl-6 text-xs text-muted-foreground">
                  Template ready: {preview.dms_taxes_and_charges_template}
                </p>
              ) : null}
              {applyTaxes && preview.tax_error ? (
                <p className="pl-6 text-xs text-destructive">{preview.tax_error}</p>
              ) : null}
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={() => void onConfirm()}
            disabled={
              submitting ||
              isLoading ||
              Boolean(previewError) ||
              !preview?.items?.length ||
              (applyTaxes && Boolean(preview?.tax_error))
            }
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Quotation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
