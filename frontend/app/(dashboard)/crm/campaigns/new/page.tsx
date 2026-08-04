'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  createCampaign,
  fetchCampaignFormOptions,
  listSegments,
  listSuppressionLists,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

export default function CrmCampaignNewPage() {
  const { navigate } = useNavigation();
  const { data: options } = useSWR('crm-campaign-form-options', fetchCampaignFormOptions);
  const { data: segments } = useSWR('crm-segments-pick', () => listSegments({ limit: 100 }));
  const { data: suppressions } = useSWR('crm-suppressions-pick', () =>
    listSuppressionLists({ limit: 50 })
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    campaign_name: '',
    campaign_type: 'Retail Promotion',
    status: 'Draft',
    channel: 'Phone',
    start_date: '',
    end_date: '',
    budget: '',
    segment: '',
    suppression_list: '',
    control_group_pct: '0',
    offer: '',
    language_version: '',
    message_template: '',
    notes: '',
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));

  const segmentOptions = useMemo(
    () =>
      ((segments?.data as Record<string, unknown>[]) || []).map((s) => ({
        value: String(s.name),
        label: String(s.segment_name || s.name),
      })),
    [segments]
  );
  const suppressionOptions = useMemo(
    () =>
      ((suppressions?.data as Record<string, unknown>[]) || []).map((s) => ({
        value: String(s.name),
        label: String(s.list_name || s.name),
      })),
    [suppressions]
  );

  const onSave = async () => {
    clear();
    if (!form.campaign_name.trim()) {
      showError('Campaign name is required.');
      return;
    }
    setSaving(true);
    try {
      const result = await createCampaign({
        ...form,
        campaign_name: form.campaign_name.trim(),
        budget: form.budget ? Number(form.budget) : null,
        control_group_pct: form.control_group_pct ? Number(form.control_group_pct) : 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        segment: form.segment || null,
        suppression_list: form.suppression_list || null,
      });
      navigate('crm-campaign-detail', { id: String(result.name) });
    } catch (e: unknown) {
      showError(e, 'Failed to create campaign');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New campaign</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Name *</label>
            <Input
              value={form.campaign_name}
              onChange={(e) => set('campaign_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type *</label>
            <SearchableSelect
              options={selectOpts(options?.campaign_types)}
              value={form.campaign_type}
              onValueChange={(v) => set('campaign_type', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Channel</label>
            <SearchableSelect
              options={selectOpts(options?.channels)}
              value={form.channel}
              onValueChange={(v) => set('channel', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Start</label>
            <Input
              type="date"
              value={form.start_date}
              onChange={(e) => set('start_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">End</label>
            <Input
              type="date"
              value={form.end_date}
              onChange={(e) => set('end_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Budget</label>
            <Input
              type="number"
              value={form.budget}
              onChange={(e) => set('budget', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Control group %
            </label>
            <Input
              type="number"
              value={form.control_group_pct}
              onChange={(e) => set('control_group_pct', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Target segment
            </label>
            <SearchableSelect
              options={segmentOptions}
              value={form.segment}
              onValueChange={(v) => set('segment', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Suppression list
            </label>
            <SearchableSelect
              options={suppressionOptions}
              value={form.suppression_list}
              onValueChange={(v) => set('suppression_list', v || '')}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Offer</label>
            <Textarea rows={2} value={form.offer} onChange={(e) => set('offer', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Message template
            </label>
            <Textarea
              rows={4}
              value={form.message_template}
              onChange={(e) => set('message_template', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-campaigns')}>
          Cancel
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create campaign
        </Button>
      </FormActionsBar>
    </div>
  );
}
