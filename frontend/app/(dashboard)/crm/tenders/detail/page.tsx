'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { fetchTenderFormOptions, getTender, updateTender } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';

type ReqRow = {
  model: string;
  specification: string;
  quantity: number;
  unit_estimate: string;
  notes: string;
};

export default function CrmTenderDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-tender-form-options', fetchTenderFormOptions);
  const { data, isLoading, mutate } = useSWR(id ? ['crm-tender', id] : null, () =>
    getTender(id)
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    title: '',
    status: '',
    tender_category: '',
    issuing_body: '',
    bid_deadline: '',
    estimated_value: '',
    financing_method: '',
    bid_version: '',
    technical_requirements: '',
    commercial_requirements: '',
    delivery_schedule_notes: '',
    aftersales_commitments: '',
    notes: '',
    opportunity: '',
    framework_agreement: '',
  });
  const [requirements, setRequirements] = useState<ReqRow[]>([]);

  useEffect(() => {
    if (!data) return;
    setForm({
      title: String(data.title || ''),
      status: String(data.status || ''),
      tender_category: String(data.tender_category || ''),
      issuing_body: String(data.issuing_body || ''),
      bid_deadline: String(data.bid_deadline || '').slice(0, 16),
      estimated_value:
        data.estimated_value != null ? String(data.estimated_value) : '',
      financing_method: String(data.financing_method || ''),
      bid_version: String(data.bid_version || ''),
      technical_requirements: String(data.technical_requirements || ''),
      commercial_requirements: String(data.commercial_requirements || ''),
      delivery_schedule_notes: String(data.delivery_schedule_notes || ''),
      aftersales_commitments: String(data.aftersales_commitments || ''),
      notes: String(data.notes || ''),
      opportunity: String(data.opportunity || ''),
      framework_agreement: String(data.framework_agreement || ''),
    });
    setRequirements(
      (Array.isArray(data.requirements) ? data.requirements : []).map(
        (row: Record<string, unknown>) => ({
          model: String(row.model || ''),
          specification: String(row.specification || ''),
          quantity: Number(row.quantity || 1),
          unit_estimate: row.unit_estimate != null ? String(row.unit_estimate) : '',
          notes: String(row.notes || ''),
        })
      )
    );
  }, [data]);

  const selectOpts = (values?: string[]) =>
    (values || []).map((v) => ({ value: v, label: v }));

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (!id) return;
    clear();
    setSaving(true);
    try {
      await updateTender(id, {
        ...form,
        title: form.title.trim(),
        bid_deadline: form.bid_deadline || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        requirements: requirements.filter((r) => r.model || r.specification),
      });
      await mutate();
      showSuccess('Tender saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save tender');
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No tender selected.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-48" />;

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('crm-tenders')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tenders
        </Button>
        {data.account ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate('crm-account-detail', { id: String(data.account) })
            }
          >
            Open account
          </Button>
        ) : null}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Tender details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Title</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <p className="text-sm font-medium">
              {String(data.customer_name || data.customer)}
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Status</label>
            <SearchableSelect
              options={selectOpts(options?.statuses)}
              value={form.status}
              onValueChange={(v) => set('status', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Category</label>
            <SearchableSelect
              options={selectOpts(options?.categories)}
              value={form.tender_category}
              onValueChange={(v) => set('tender_category', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Issuing body
            </label>
            <Input
              value={form.issuing_body}
              onChange={(e) => set('issuing_body', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Bid deadline
            </label>
            <Input
              type="datetime-local"
              value={form.bid_deadline}
              onChange={(e) => set('bid_deadline', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Estimated value
            </label>
            <Input
              type="number"
              value={form.estimated_value}
              onChange={(e) => set('estimated_value', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Financing / LC
            </label>
            <SearchableSelect
              options={selectOpts(options?.financing_methods)}
              value={form.financing_method}
              onValueChange={(v) => set('financing_method', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Bid version
            </label>
            <Input
              value={form.bid_version}
              onChange={(e) => set('bid_version', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Linked opportunity
            </label>
            <Input
              value={form.opportunity}
              onChange={(e) => set('opportunity', e.target.value)}
              placeholder="CRM-OPP-…"
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Technical requirements
            </label>
            <Textarea
              rows={3}
              value={form.technical_requirements}
              onChange={(e) => set('technical_requirements', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Commercial requirements
            </label>
            <Textarea
              rows={3}
              value={form.commercial_requirements}
              onChange={(e) => set('commercial_requirements', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Delivery schedule
            </label>
            <Textarea
              rows={2}
              value={form.delivery_schedule_notes}
              onChange={(e) => set('delivery_schedule_notes', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Aftersales commitments
            </label>
            <Textarea
              rows={2}
              value={form.aftersales_commitments}
              onChange={(e) => set('aftersales_commitments', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Quantity by model</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setRequirements((prev) => [
                ...prev,
                {
                  model: '',
                  specification: '',
                  quantity: 1,
                  unit_estimate: '',
                  notes: '',
                },
              ])
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add line
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {requirements.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Requested quantity by model and specification.
            </p>
          ) : (
            requirements.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-6"
              >
                <Input
                  className="sm:col-span-2"
                  placeholder="Model"
                  value={row.model}
                  onChange={(e) =>
                    setRequirements((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], model: e.target.value };
                      return next;
                    })
                  }
                />
                <Input
                  className="sm:col-span-2"
                  placeholder="Specification"
                  value={row.specification}
                  onChange={(e) =>
                    setRequirements((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], specification: e.target.value };
                      return next;
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) =>
                    setRequirements((prev) => {
                      const next = [...prev];
                      next[idx] = {
                        ...next[idx],
                        quantity: Number(e.target.value || 1),
                      };
                      return next;
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setRequirements((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save tender
        </Button>
      </FormActionsBar>
    </div>
  );
}
