'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  adjustServiceDue,
  fetchRetentionSettings,
  getServiceDue,
  listDeferredWork,
  listServiceDue,
  runReminderSequence,
  syncServiceDue,
  updateDeferredWork,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2, RefreshCw, Search } from 'lucide-react';

function tone(classification?: string) {
  if (classification === 'Overdue' || classification === 'Severely Overdue') {
    return 'destructive' as const;
  }
  if (classification === 'Lapsed') return 'destructive' as const;
  if (classification === 'Due') return 'secondary' as const;
  return 'outline' as const;
}

export default function CrmServiceRetentionPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [classification, setClassification] = useState('all');
  const [selectedDue, setSelectedDue] = useState('');
  const [busy, setBusy] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [adjustForm, setAdjustForm] = useState({
    adjusted_due_date: '',
    adjusted_due_km: '',
    adjustment_reason: '',
  });

  const { data, isLoading, mutate } = useSWR(
    ['crm-service-due', search, classification],
    () =>
      listServiceDue({
        search: search || undefined,
        classification: classification === 'all' ? undefined : classification,
        limit: 50,
      })
  );
  const { data: settings } = useSWR('crm-retention-settings', fetchRetentionSettings);
  const { data: deferred, mutate: mutateDeferred } = useSWR('crm-deferred-work', () =>
    listDeferredWork({ status: 'Open', limit: 50 })
  );
  const { data: dueDetail, mutate: mutateDue } = useSWR(
    selectedDue ? ['crm-service-due-detail', selectedDue] : null,
    () => getServiceDue(selectedDue)
  );

  const rows = (data?.data || []) as Record<string, unknown>[];
  const summary = (data?.summary || {}) as Record<string, number>;
  const deferredRows = (deferred?.data || []) as Record<string, unknown>[];
  const sequence = (settings?.service_reminder_sequence || []) as Record<string, unknown>[];

  const onSync = async () => {
    clear();
    setBusy(true);
    try {
      const result = await syncServiceDue(300);
      await mutate();
      showSuccess(`Synced ${result?.synced ?? 0} service-due records.`);
    } catch (e: unknown) {
      showError(e, 'Sync failed');
    } finally {
      setBusy(false);
    }
  };

  const onRunReminders = async () => {
    clear();
    setBusy(true);
    try {
      const result = await runReminderSequence(300);
      await mutate();
      if (selectedDue) await mutateDue();
      showSuccess(`Created ${result?.created ?? 0} reminders.`);
    } catch (e: unknown) {
      showError(e, 'Reminder run failed');
    } finally {
      setBusy(false);
    }
  };

  const onAdjust = async () => {
    if (!selectedDue) return;
    clear();
    if (!adjustForm.adjustment_reason.trim()) {
      showError('Adjustment reason is required.');
      return;
    }
    setBusy(true);
    try {
      await adjustServiceDue(selectedDue, {
        adjusted_due_date: adjustForm.adjusted_due_date || null,
        adjusted_due_km: adjustForm.adjusted_due_km
          ? Number(adjustForm.adjusted_due_km)
          : null,
        adjustment_reason: adjustForm.adjustment_reason,
      });
      await mutateDue();
      await mutate();
      showSuccess('Due date adjusted (audit trail saved).');
    } catch (e: unknown) {
      showError(e, 'Adjustment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Aftersales lifecycle · service due engine · reminder sequence from DMS CRM Settings
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" disabled={busy} onClick={() => void onSync()}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Sync from VINs
          </Button>
          <Button disabled={busy} onClick={() => void onRunReminders()}>
            Run reminder sequence
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {['Upcoming', 'Due', 'Overdue', 'Severely Overdue', 'Lapsed', 'Inactive'].map((key) => (
          <Card
            key={key}
            className={`cursor-pointer border-border/70 shadow-sm ${
              classification === key ? 'ring-1 ring-primary' : ''
            }`}
            onClick={() => setClassification(classification === key ? 'all' : key)}
          >
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">{key}</p>
              <p className="text-2xl font-semibold">{summary[key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="due">
        <TabsList>
          <TabsTrigger value="due">Service due</TabsTrigger>
          <TabsTrigger value="deferred">Deferred work</TabsTrigger>
          <TabsTrigger value="sequence">Reminder sequence</TabsTrigger>
        </TabsList>

        <TabsContent value="due" className="space-y-4">
          <Card className="border-border/70 shadow-sm">
            <CardHeader className="pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search VIN / customer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-24" />
              ) : (
                <div className="dms-table-panel">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Vehicle</th>
                        <th className="pb-2 font-medium">Customer</th>
                        <th className="pb-2 font-medium">Effective due</th>
                        <th className="pb-2 font-medium">Basis</th>
                        <th className="pb-2 font-medium">Class</th>
                        <th className="pb-2 font-medium">Stage</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-muted-foreground">
                            No service-due records. Click Sync from VINs.
                          </td>
                        </tr>
                      ) : (
                        rows.map((row) => (
                          <tr
                            key={String(row.name)}
                            className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                            onClick={() => setSelectedDue(String(row.name))}
                          >
                            <td className="py-3">
                              <p className="font-medium">{String(row.vin_number || row.vin)}</p>
                              <p className="text-xs text-muted-foreground">{String(row.name)}</p>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {String(row.customer_name || row.customer || '—')}
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {row.effective_due_date
                                ? String(row.effective_due_date).slice(0, 10)
                                : '—'}
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {String(row.trigger_basis || '—')}
                            </td>
                            <td className="py-3">
                              <Badge variant={tone(String(row.classification))} className="font-normal">
                                {String(row.classification || '—')}
                              </Badge>
                            </td>
                            <td className="py-3 text-muted-foreground">
                              {String(row.lifecycle_stage || '—')}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedDue && dueDetail ? (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  {String(dueDetail.vin_number || dueDetail.vin)} · adjust / reminders
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">Customer: </span>
                    {String(dueDetail.customer_name || dueDetail.customer || '—')}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Effective due: </span>
                    {String(dueDetail.effective_due_date || '—')}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Due km: </span>
                    {dueDetail.due_km != null ? Number(dueDetail.due_km).toLocaleString() : '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Avg daily km: </span>
                    {dueDetail.average_daily_km != null
                      ? String(dueDetail.average_daily_km)
                      : '—'}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Last reminder: </span>
                    {String(dueDetail.last_reminder_step || '—')}
                  </p>
                  <div className="space-y-1 pt-2">
                    <p className="text-xs font-medium text-muted-foreground">Reminder log</p>
                    {((dueDetail.reminders as Record<string, unknown>[]) || []).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No reminders yet.</p>
                    ) : (
                      ((dueDetail.reminders as Record<string, unknown>[]) || []).map((r) => (
                        <div key={String(r.name)} className="flex justify-between text-xs">
                          <span>
                            {String(r.label || r.step_key)} · {String(r.channel)}
                          </span>
                          <span className="text-muted-foreground">
                            {r.sent_on ? String(r.sent_on).slice(0, 16) : ''}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-medium">Manual adjustment</p>
                  <Input
                    type="date"
                    value={adjustForm.adjusted_due_date}
                    onChange={(e) =>
                      setAdjustForm((p) => ({ ...p, adjusted_due_date: e.target.value }))
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Adjusted due km"
                    value={adjustForm.adjusted_due_km}
                    onChange={(e) =>
                      setAdjustForm((p) => ({ ...p, adjusted_due_km: e.target.value }))
                    }
                  />
                  <Textarea
                    rows={3}
                    placeholder="Reason (required for audit trail)"
                    value={adjustForm.adjustment_reason}
                    onChange={(e) =>
                      setAdjustForm((p) => ({ ...p, adjustment_reason: e.target.value }))
                    }
                  />
                  <Button disabled={busy} onClick={() => void onAdjust()}>
                    Save adjustment
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </TabsContent>

        <TabsContent value="deferred" className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Open pipeline value</p>
                <p className="text-2xl font-semibold">
                  {Number(deferred?.open_pipeline_value || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Recovered revenue</p>
                <p className="text-2xl font-semibold">
                  {Number(deferred?.recovered_revenue || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recommended / deferred work</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="dms-table-panel">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">Title</th>
                      <th className="pb-2 font-medium">Category</th>
                      <th className="pb-2 font-medium">Urgency</th>
                      <th className="pb-2 font-medium">Estimate</th>
                      <th className="pb-2 font-medium">Status</th>
                      <th className="pb-2 font-medium" />
                    </tr>
                  </thead>
                  <tbody>
                    {deferredRows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-10 text-center text-muted-foreground">
                          No open deferred recommendations.
                        </td>
                      </tr>
                    ) : (
                      deferredRows.map((row) => (
                        <tr key={String(row.name)} className="border-b border-border/60 last:border-0">
                          <td className="py-3">
                            <p className="font-medium">{String(row.title)}</p>
                            <p className="text-xs text-muted-foreground">
                              {String(row.customer_name || row.customer || '')}
                            </p>
                          </td>
                          <td className="py-3 text-muted-foreground">{String(row.category)}</td>
                          <td className="py-3 text-muted-foreground">{String(row.urgency)}</td>
                          <td className="py-3 text-muted-foreground">
                            {row.estimated_value != null
                              ? Number(row.estimated_value).toLocaleString()
                              : '—'}
                          </td>
                          <td className="py-3">
                            <Badge variant="secondary">{String(row.status)}</Badge>
                          </td>
                          <td className="py-3">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                void updateDeferredWork(String(row.name), {
                                  status: 'Completed',
                                  recovered_value: row.estimated_value || 0,
                                }).then(() => mutateDeferred())
                              }
                            >
                              Mark recovered
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sequence">
          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Configured reminder sequence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Edit offsets and channels in Desk → DMS CRM Settings → Service Reminder Sequence.
                Service intervals still come from VIN / Vehicle Model (and DMS warranty settings).
              </p>
              {sequence.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No steps yet — open DMS CRM Settings and save once to seed blueprint defaults.
                </p>
              ) : (
                sequence.map((step) => (
                  <div
                    key={String(step.step_key)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">
                        {String(step.label)}{' '}
                        <span className="text-muted-foreground">
                          ({Number(step.days_offset) > 0 ? '+' : ''}
                          {String(step.days_offset)}d)
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {String(step.channel)} · {String(step.human_action || '')}
                      </p>
                    </div>
                    <Badge variant={step.enabled ? 'secondary' : 'outline'}>
                      {step.enabled ? 'On' : 'Off'}
                    </Badge>
                  </div>
                ))
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('crm-activities')}
              >
                Open CRM activities
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
