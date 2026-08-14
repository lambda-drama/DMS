'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { getQuotation, submitQuotation, updateQuotationItems } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft, Loader2 } from 'lucide-react';

type QuoteItem = {
  item_code: string;
  item_name?: string;
  qty: number;
  rate: number;
  uom?: string;
  discount_percentage?: number;
  amount?: number;
  net_amount?: number;
  description?: string;
};

export default function CrmQuotationDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data, isLoading, mutate } = useSWR(id ? ['crm-quotation', id] : null, () =>
    getQuotation(id)
  );
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [validTill, setValidTill] = useState('');
  const [busy, setBusy] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();

  useEffect(() => {
    if (!data) return;
    setItems(
      ((data.items as QuoteItem[]) || []).map((row) => ({
        ...row,
        qty: Number(row.qty || 1),
        rate: Number(row.rate || 0),
        discount_percentage: Number(row.discount_percentage || 0),
      }))
    );
    setValidTill(String(data.valid_till || '').slice(0, 10));
  }, [data]);

  if (!id) return <p className="text-sm text-muted-foreground">Missing quotation id.</p>;
  if (isLoading || !data) return <Skeleton className="h-80" />;

  const isDraft = Number(data.docstatus) === 0;
  const currency = String(data.currency || '');
  const estimated = items.reduce((sum, row) => {
    const amount = Number(row.qty || 0) * Number(row.rate || 0);
    const discount = (amount * Number(row.discount_percentage || 0)) / 100;
    return sum + amount - discount;
  }, 0);

  const updateRow = (index: number, patch: Partial<QuoteItem>) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const onSave = async () => {
    if (!isDraft) return;
    setBusy(true);
    clear();
    try {
      await updateQuotationItems(id, { items, valid_till: validTill || null });
      await mutate();
      showSuccess('Quotation saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save quotation.');
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async () => {
    if (!isDraft) return;
    if (!window.confirm('Submit this quotation? It cannot be edited after submit.')) return;
    setBusy(true);
    clear();
    try {
      if (items.length) {
        await updateQuotationItems(id, { items, valid_till: validTill || null });
      }
      await submitQuotation(id);
      await mutate();
      showSuccess('Quotation submitted.');
    } catch (e: unknown) {
      showError(e, 'Failed to submit quotation.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('crm-quotations')} disabled={busy}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quotations
        </Button>
        <div className="flex flex-wrap gap-2">
          {data.opportunity ? (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                navigate('crm-opportunity-detail', { id: String(data.opportunity) })
              }
            >
              Open Deal
            </Button>
          ) : null}
          {isDraft ? (
            <>
              <Button variant="outline" onClick={() => void onSave()} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save
              </Button>
              <Button onClick={() => void onSubmit()} disabled={busy || !Boolean(data.can_submit)}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit Quotation
              </Button>
            </>
          ) : null}
        </div>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{String(data.name)}</CardTitle>
            <Badge variant="outline">{String(data.docstatus_label || data.status || 'Draft')}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="Customer">{String(data.customer_display || data.party_name || '—')}</Field>
          <Field label="Company">{String(data.company || '—')}</Field>
          <Field label="Date">{String(data.transaction_date || '—')}</Field>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Valid till</label>
            {isDraft ? (
              <Input
                type="date"
                value={validTill}
                onChange={(e) => setValidTill(e.target.value)}
                disabled={busy}
              />
            ) : (
              <div>{String(data.valid_till || '—')}</div>
            )}
          </div>
          <Field label="Deal">
            {data.opportunity ? (
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() =>
                  navigate('crm-opportunity-detail', { id: String(data.opportunity) })
                }
              >
                {String(data.opportunity_title || data.opportunity)}
              </button>
            ) : (
              '—'
            )}
          </Field>
          <Field label="Customer status">
            {String(data.quotation_customer_status || '—')}
          </Field>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items on this quotation.</p>
          ) : (
            items.map((row, index) => {
              const amount = Number(row.qty || 0) * Number(row.rate || 0);
              const net = amount * (1 - Number(row.discount_percentage || 0) / 100);
              return (
                <div
                  key={`${row.item_code}-${index}`}
                  className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1.4fr_5rem_7rem_5rem_7rem]"
                >
                  <div>
                    <div className="font-medium text-sm">{row.item_name || row.item_code}</div>
                    <div className="text-xs text-muted-foreground">{row.item_code}</div>
                  </div>
                  {isDraft ? (
                    <>
                      <Input
                        type="number"
                        min={0}
                        value={row.qty}
                        onChange={(e) => updateRow(index, { qty: Number(e.target.value || 0) })}
                        disabled={busy}
                      />
                      <Input
                        type="number"
                        min={0}
                        value={row.rate}
                        onChange={(e) => updateRow(index, { rate: Number(e.target.value || 0) })}
                        disabled={busy}
                      />
                      <Input
                        type="number"
                        min={0}
                        value={row.discount_percentage || 0}
                        onChange={(e) =>
                          updateRow(index, { discount_percentage: Number(e.target.value || 0) })
                        }
                        disabled={busy}
                      />
                    </>
                  ) : (
                    <>
                      <div className="text-sm">{row.qty}</div>
                      <div className="text-sm">{Number(row.rate || 0).toLocaleString()}</div>
                      <div className="text-sm">{Number(row.discount_percentage || 0)}%</div>
                    </>
                  )}
                  <div className="text-sm font-medium">
                    {currency} {net.toLocaleString()}
                  </div>
                </div>
              );
            })
          )}
          <div className="flex justify-between border-t border-border/70 pt-3 text-sm font-semibold">
            <span>{isDraft ? 'Estimated total' : 'Grand total'}</span>
            <span>
              {currency}{' '}
              {(isDraft ? estimated : Number(data.grand_total || data.net_total || 0)).toLocaleString()}
            </span>
          </div>
          {isDraft ? (
            <p className="text-xs text-muted-foreground">
              Adjust qty / rate if needed, then click Submit Quotation. No Desk required.
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div>{children}</div>
    </div>
  );
}
