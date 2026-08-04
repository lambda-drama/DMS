'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  completeActivity,
  fetchActivityFormOptions,
  getActivity,
  reassignActivity,
  updateActivity,
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
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function CrmActivityDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-activity-form-options', fetchActivityFormOptions);
  const { data, isLoading, mutate } = useSWR(id ? ['crm-activity', id] : null, () =>
    getActivity(id)
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    subject: '',
    activity_type: '',
    status: '',
    priority: '',
    due_datetime: '',
    disposition: '',
    outcome_notes: '',
    reassign_to: '',
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      subject: String(data.subject || ''),
      activity_type: String(data.activity_type || ''),
      status: String(data.status || ''),
      priority: String(data.priority || ''),
      due_datetime: String(data.due_datetime || '').slice(0, 16),
      disposition: String(data.disposition || ''),
      outcome_notes: String(data.outcome_notes || ''),
      reassign_to: '',
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
      await updateActivity(id, {
        subject: form.subject.trim(),
        activity_type: form.activity_type,
        status: form.status,
        priority: form.priority,
        due_datetime: form.due_datetime || null,
        disposition: form.disposition || null,
        outcome_notes: form.outcome_notes || null,
      });
      await mutate();
      showSuccess('Activity saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const onComplete = async () => {
    if (!id) return;
    clear();
    try {
      await completeActivity(id, form.disposition, form.outcome_notes);
      await mutate();
      showSuccess('Activity completed.');
    } catch (e: unknown) {
      showError(e, 'Complete failed — disposition and notes are required');
    }
  };

  const onReassign = async () => {
    if (!id || !form.reassign_to.trim()) {
      showError('Enter a User ID / email to reassign.');
      return;
    }
    clear();
    try {
      await reassignActivity(id, form.reassign_to.trim(), 'Reassigned from CRM');
      await mutate();
      showSuccess('Reassigned.');
    } catch (e: unknown) {
      showError(e, 'Reassign failed');
    }
  };

  if (!id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No activity selected.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-48" />;

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('crm-activities')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Activities
        </Button>
        <div className="flex gap-2">
          {data.is_overdue || data.sla_breached ? (
            <Badge variant="destructive">Overdue</Badge>
          ) : null}
          {data.status !== 'Completed' ? (
            <Button size="sm" onClick={() => void onComplete()}>
              Complete
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{String(data.name)}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Subject</label>
            <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={selectOpts(options?.activity_types)}
              value={form.activity_type}
              onValueChange={(v) => set('activity_type', v || '')}
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
            <label className="block text-xs font-medium text-muted-foreground">Due</label>
            <Input
              type="datetime-local"
              value={form.due_datetime}
              onChange={(e) => set('due_datetime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Owner</label>
            <p className="text-sm">{String(data.owner_name || data.assigned_to || '—')}</p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Disposition</label>
            <SearchableSelect
              options={selectOpts(options?.dispositions)}
              value={form.disposition}
              onValueChange={(v) => set('disposition', v || '')}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Outcome notes
            </label>
            <Textarea
              rows={3}
              value={form.outcome_notes}
              onChange={(e) => set('outcome_notes', e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Input
              placeholder="Reassign to user (email)"
              value={form.reassign_to}
              onChange={(e) => set('reassign_to', e.target.value)}
            />
            <Button variant="outline" onClick={() => void onReassign()}>
              Reassign
            </Button>
          </div>
        </CardContent>
      </Card>

      {Array.isArray(data.assignment_history) && data.assignment_history.length > 0 ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Ownership history</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.assignment_history.map((h: Record<string, unknown>, i: number) => (
              <div key={i} className="border-b border-border/50 py-2 last:border-0">
                {String(h.from_user || '—')} → {String(h.to_user)} by{' '}
                {String(h.reassigned_by || '—')}{' '}
                <span className="text-muted-foreground">
                  ({String(h.reassigned_on || '').slice(0, 16)})
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-activities')}>
          Back
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </FormActionsBar>
    </div>
  );
}
