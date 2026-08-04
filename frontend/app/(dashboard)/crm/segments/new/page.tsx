'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { createSegment, fetchSegmentFormOptions, previewSegment } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

export default function CrmSegmentNewPage() {
  const { navigate } = useNavigation();
  const { data: options } = useSWR('crm-segment-form-options', fetchSegmentFormOptions);
  const [saving, setSaving] = useState(false);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    segment_name: '',
    status: 'Active',
    customer_type: '',
    city: '',
    preferred_language: '',
    brand: '',
    retention_category: '',
    sales_status: '',
    channel_preference: '',
    loyalty_tier: '',
    require_marketing_consent: true,
    include_do_not_contact: false,
    has_deferred_work: false,
    has_complaint_history: false,
    notes: '',
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));

  const payload = () => ({
    segment_name: form.segment_name.trim(),
    status: form.status,
    customer_type: form.customer_type || null,
    city: form.city || null,
    preferred_language: form.preferred_language || null,
    brand: form.brand || null,
    retention_category: form.retention_category || null,
    sales_status: form.sales_status || null,
    channel_preference: form.channel_preference || null,
    loyalty_tier: form.loyalty_tier || null,
    require_marketing_consent: form.require_marketing_consent ? 1 : 0,
    include_do_not_contact: form.include_do_not_contact ? 1 : 0,
    has_deferred_work: form.has_deferred_work ? 1 : 0,
    has_complaint_history: form.has_complaint_history ? 1 : 0,
    notes: form.notes || null,
  });

  const onPreview = async () => {
    clear();
    try {
      const result = await previewSegment({ data: payload() });
      setPreviewCount(Number(result.count || 0));
      showSuccess(`Preview audience: ${result.count} customers`);
    } catch (e: unknown) {
      showError(e, 'Preview failed');
    }
  };

  const onSave = async () => {
    clear();
    if (!form.segment_name.trim()) {
      showError('Segment name is required.');
      return;
    }
    setSaving(true);
    try {
      const result = await createSegment(payload());
      navigate('crm-segment-detail', { id: String(result.name) });
    } catch (e: unknown) {
      showError(e, 'Failed to create segment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New segment (§13.2)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Name *</label>
            <Input
              value={form.segment_name}
              onChange={(e) => set('segment_name', e.target.value)}
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
            <Input
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              placeholder="Brand name"
            />
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
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Channel preference
            </label>
            <SearchableSelect
              options={selectOpts(options?.channels)}
              value={form.channel_preference}
              onValueChange={(v) => set('channel_preference', v || '')}
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
          {previewCount != null ? (
            <p className="sm:col-span-2 text-sm text-muted-foreground">
              Last preview: <span className="font-medium text-foreground">{previewCount}</span>{' '}
              customers
            </p>
          ) : null}
        </CardContent>
      </Card>
      <FormActionsBar align="between">
        <Button variant="outline" onClick={() => navigate('crm-campaigns')}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void onPreview()}>
            Preview audience
          </Button>
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create segment
          </Button>
        </div>
      </FormActionsBar>
    </div>
  );
}
