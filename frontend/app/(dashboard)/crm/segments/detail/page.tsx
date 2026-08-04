'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  fetchSegmentFormOptions,
  getSegment,
  previewSegment,
  updateSegment,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CrmSegmentDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-segment-form-options', fetchSegmentFormOptions);
  const { data, isLoading, mutate } = useSWR(id ? ['crm-segment', id] : null, () =>
    getSegment(id)
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    segment_name: '',
    status: '',
    customer_type: '',
    city: '',
    brand: '',
    retention_category: '',
    sales_status: '',
    channel_preference: '',
    require_marketing_consent: true,
    include_do_not_contact: false,
    has_deferred_work: false,
    has_complaint_history: false,
    notes: '',
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      segment_name: String(data.segment_name || ''),
      status: String(data.status || ''),
      customer_type: String(data.customer_type || ''),
      city: String(data.city || ''),
      brand: String(data.brand || ''),
      retention_category: String(data.retention_category || ''),
      sales_status: String(data.sales_status || ''),
      channel_preference: String(data.channel_preference || ''),
      require_marketing_consent: Boolean(data.require_marketing_consent),
      include_do_not_contact: Boolean(data.include_do_not_contact),
      has_deferred_work: Boolean(data.has_deferred_work),
      has_complaint_history: Boolean(data.has_complaint_history),
      notes: String(data.notes || ''),
    });
  }, [data]);

  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));
  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (!id) return;
    clear();
    setSaving(true);
    try {
      await updateSegment(id, {
        ...form,
        segment_name: form.segment_name.trim(),
        require_marketing_consent: form.require_marketing_consent ? 1 : 0,
        include_do_not_contact: form.include_do_not_contact ? 1 : 0,
        has_deferred_work: form.has_deferred_work ? 1 : 0,
        has_complaint_history: form.has_complaint_history ? 1 : 0,
      });
      await mutate();
      showSuccess('Segment saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save segment');
    } finally {
      setSaving(false);
    }
  };

  const onPreview = async () => {
    clear();
    try {
      const result = await previewSegment({ name: id });
      await mutate();
      showSuccess(`Audience: ${result.count} customers`);
    } catch (e: unknown) {
      showError(e, 'Preview failed');
    }
  };

  if (!id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No segment selected.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-48" />;

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('crm-campaigns')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Campaigns / Segments
        </Button>
        <p className="text-sm text-muted-foreground">
          Audience count: <span className="font-medium text-foreground">{Number(data.audience_count || 0)}</span>
        </p>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{String(data.name)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={form.segment_name}
              onChange={(e) => set('segment_name', e.target.value)}
            />
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
            <label className="block text-xs font-medium text-muted-foreground">
              Customer type
            </label>
            <SearchableSelect
              options={selectOpts(options?.customer_types)}
              value={form.customer_type}
              onValueChange={(v) => set('customer_type', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">City</label>
            <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Brand</label>
            <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Retention category
            </label>
            <SearchableSelect
              options={selectOpts(options?.retention_categories)}
              value={form.retention_category}
              onValueChange={(v) => set('retention_category', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Sales status
            </label>
            <SearchableSelect
              options={selectOpts(options?.sales_statuses)}
              value={form.sales_status}
              onValueChange={(v) => set('sales_status', v || '')}
            />
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            {(
              [
                ['require_marketing_consent', 'Require marketing consent'],
                ['include_do_not_contact', 'Include do-not-contact'],
                ['has_deferred_work', 'Has deferred work'],
                ['has_complaint_history', 'Has complaint history'],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(form[key])}
                  onChange={(e) => set(key, e.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <FormActionsBar align="between">
        <Button variant="outline" onClick={() => navigate('crm-campaigns')}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void onPreview()}>
            Refresh audience count
          </Button>
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save segment
          </Button>
        </div>
      </FormActionsBar>
    </div>
  );
}
