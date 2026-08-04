'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  approveCampaign,
  buildCampaignAudience,
  fetchCampaignFormOptions,
  getCampaign,
  listSegments,
  listSuppressionLists,
  refreshCampaignMetrics,
  updateCampaign,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft, Loader2, RefreshCw, Users } from 'lucide-react';

export default function CrmCampaignDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-campaign-form-options', fetchCampaignFormOptions);
  const { data: segments } = useSWR('crm-segments-pick', () => listSegments({ limit: 100 }));
  const { data: suppressions } = useSWR('crm-suppressions-pick', () =>
    listSuppressionLists({ limit: 50 })
  );
  const { data, isLoading, mutate } = useSWR(id ? ['crm-campaign', id] : null, () =>
    getCampaign(id)
  );
  const [saving, setSaving] = useState(false);
  const [building, setBuilding] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    campaign_name: '',
    campaign_type: '',
    status: '',
    channel: '',
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

  useEffect(() => {
    if (!data) return;
    setForm({
      campaign_name: String(data.campaign_name || ''),
      campaign_type: String(data.campaign_type || ''),
      status: String(data.status || ''),
      channel: String(data.channel || ''),
      start_date: String(data.start_date || ''),
      end_date: String(data.end_date || ''),
      budget: data.budget != null ? String(data.budget) : '',
      segment: String(data.segment || ''),
      suppression_list: String(data.suppression_list || ''),
      control_group_pct:
        data.control_group_pct != null ? String(data.control_group_pct) : '0',
      offer: String(data.offer || ''),
      language_version: String(data.language_version || ''),
      message_template: String(data.message_template || '').replace(/<[^>]+>/g, ''),
      notes: String(data.notes || ''),
    });
  }, [data]);

  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));
  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (!id) return;
    clear();
    setSaving(true);
    try {
      await updateCampaign(id, {
        ...form,
        campaign_name: form.campaign_name.trim(),
        budget: form.budget ? Number(form.budget) : null,
        control_group_pct: form.control_group_pct ? Number(form.control_group_pct) : 0,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        segment: form.segment || null,
        suppression_list: form.suppression_list || null,
      });
      await mutate();
      showSuccess('Campaign saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save campaign');
    } finally {
      setSaving(false);
    }
  };

  const onBuild = async () => {
    if (!id) return;
    clear();
    setBuilding(true);
    try {
      const result = await buildCampaignAudience(id, false);
      await mutate();
      showSuccess(
        `Audience built: ${result.added} added, ${result.skipped_suppressed} suppressed, ${result.control_group} control.`
      );
    } catch (e: unknown) {
      showError(e, 'Failed to build audience');
    } finally {
      setBuilding(false);
    }
  };

  if (!id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No campaign selected.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-48" />;

  const metrics = [
    ['Members', data.members_count],
    ['Control', data.control_group_count],
    ['Delivered', data.delivered_count],
    ['Opened', data.opened_count],
    ['Responses', data.response_count],
    ['Appointments', data.appointment_count],
    ['Test drives', data.test_drive_count],
    ['Quotations', data.quotation_count],
    ['Bookings', data.booking_count],
    ['Sales', data.sale_count],
    ['Workshop', data.workshop_visit_count],
    ['Revenue', data.campaign_revenue],
    ['CPL', data.cost_per_lead],
    ['CPA', data.cost_per_appointment],
    ['CPS', data.cost_per_sale],
    ['ROI %', data.roi_pct],
  ] as const;

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('crm-campaigns')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Campaigns
        </Button>
        <div className="flex flex-wrap gap-2">
          {data.status === 'Draft' || data.status === 'Pending Approval' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await approveCampaign(id);
                  await mutate();
                  showSuccess('Campaign approved.');
                } catch (e: unknown) {
                  showError(e, 'Approve failed');
                }
              }}
            >
              Approve
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={building || !form.segment}
            onClick={() => void onBuild()}
          >
            {building ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Users className="mr-2 h-4 w-4" />
            )}
            Build audience
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await refreshCampaignMetrics(id);
                await mutate();
                showSuccess('Metrics refreshed.');
              } catch (e: unknown) {
                showError(e, 'Refresh failed');
              }
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh metrics
          </Button>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {metrics.map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-border/70 px-3 py-2 text-center"
          >
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="text-sm font-semibold">
              {typeof value === 'number' ? Number(value).toLocaleString() : String(value ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{String(data.name)} — controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Name</label>
            <Input
              value={form.campaign_name}
              onChange={(e) => set('campaign_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={selectOpts(options?.campaign_types)}
              value={form.campaign_type}
              onValueChange={(v) => set('campaign_type', v || '')}
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
            <label className="block text-xs font-medium text-muted-foreground">Channel</label>
            <SearchableSelect
              options={selectOpts(options?.channels)}
              value={form.channel}
              onValueChange={(v) => set('channel', v || '')}
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
            <label className="block text-xs font-medium text-muted-foreground">Segment</label>
            <SearchableSelect
              options={((segments?.data as Record<string, unknown>[]) || []).map((s) => ({
                value: String(s.name),
                label: String(s.segment_name || s.name),
              }))}
              value={form.segment}
              onValueChange={(v) => set('segment', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Suppression list
            </label>
            <SearchableSelect
              options={((suppressions?.data as Record<string, unknown>[]) || []).map((s) => ({
                value: String(s.name),
                label: String(s.list_name || s.name),
              }))}
              value={form.suppression_list}
              onValueChange={(v) => set('suppression_list', v || '')}
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
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Offer</label>
            <Textarea rows={2} value={form.offer} onChange={(e) => set('offer', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Message template
            </label>
            <Textarea
              rows={3}
              value={form.message_template}
              onChange={(e) => set('message_template', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            Members ({Array.isArray(data.members) ? data.members.length : 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!Array.isArray(data.members) || data.members.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No members yet. Assign a segment and click Build audience.
            </p>
          ) : (
            <div className="dms-table-panel max-h-80 overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Response</th>
                    <th className="pb-2 font-medium">Flags</th>
                  </tr>
                </thead>
                <tbody>
                  {data.members.map((m: Record<string, unknown>) => (
                    <tr key={String(m.name)} className="border-b border-border/50 last:border-0">
                      <td className="py-2">
                        {String(m.customer_name || m.customer)}
                      </td>
                      <td className="py-2 text-muted-foreground">{String(m.status || '')}</td>
                      <td className="py-2 text-muted-foreground">
                        {String(m.response || '—')}
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {m.in_control_group ? (
                            <Badge variant="outline">Control</Badge>
                          ) : null}
                          {m.converted ? <Badge>Converted</Badge> : null}
                          {m.opted_out ? (
                            <Badge variant="destructive">Opt-out</Badge>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-campaigns')}>
          Cancel
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save campaign
        </Button>
      </FormActionsBar>
    </div>
  );
}
