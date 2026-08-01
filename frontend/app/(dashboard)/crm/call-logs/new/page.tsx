'use client';

import { useMemo, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { createCallLog, fetchCallLogFormOptions } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft } from 'lucide-react';

export default function CrmCallLogNewPage() {
  const { navigate } = useNavigation();
  const { data: options } = useSWR('crm-call-log-options', fetchCallLogFormOptions);
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    from: '',
    to: '',
    type: 'Outgoing',
    status: 'Completed',
    duration: '',
    start_time: '',
    caller: '',
    receiver: '',
    recording_url: '',
    lead: '',
    note_title: '',
    note_content: '',
  });

  const statusOptions = useMemo(
    () => (options?.statuses || []).map((s) => ({ value: s, label: s })),
    [options]
  );
  const typeOptions = useMemo(
    () => (options?.types || []).map((s) => ({ value: s, label: s })),
    [options]
  );
  const userOptions = useMemo(() => options?.users || [], [options]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSave() {
    clear();
    if (!form.from.trim() || !form.to.trim()) {
      showError('From and To numbers are required.');
      return;
    }
    setSaving(true);
    try {
      const created = await createCallLog({
        from: form.from.trim(),
        to: form.to.trim(),
        type: form.type,
        status: form.status,
        duration: form.duration ? Number(form.duration) : 0,
        start_time: form.start_time || null,
        caller: form.type === 'Outgoing' ? form.caller || null : null,
        receiver: form.type === 'Incoming' ? form.receiver || null : null,
        recording_url: form.recording_url || null,
        lead: form.lead || null,
        note_title: form.note_title || null,
        note_content: form.note_content || null,
        telephony_medium: 'Manual',
      });
      const name = (created as { name?: string })?.name;
      if (name) {
        navigate('crm-call-log-detail', { id: name });
      } else {
        navigate('crm-call-logs');
      }
    } catch (e: unknown) {
      showError(e, 'Failed to create call log.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex items-center justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('crm-call-logs')} disabled={saving}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Call Log'}
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New Call Log</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Field label="From number *">
            <Input value={form.from} onChange={(e) => set('from', e.target.value)} />
          </Field>
          <Field label="To number *">
            <Input value={form.to} onChange={(e) => set('to', e.target.value)} />
          </Field>
          <Field label="Type">
            <SearchableSelect
              options={typeOptions}
              value={form.type}
              onValueChange={(v) => set('type', v || 'Outgoing')}
            />
          </Field>
          <Field label="Status">
            <SearchableSelect
              options={statusOptions}
              value={form.status}
              onValueChange={(v) => set('status', v || 'Completed')}
            />
          </Field>
          <Field label="Duration (seconds)">
            <Input
              type="number"
              value={form.duration}
              onChange={(e) => set('duration', e.target.value)}
            />
          </Field>
          <Field label="Start time">
            <Input
              type="datetime-local"
              value={form.start_time}
              onChange={(e) => set('start_time', e.target.value)}
            />
          </Field>
          <Field label={form.type === 'Incoming' ? 'Received by' : 'Caller'}>
            <SearchableSelect
              options={userOptions}
              value={form.type === 'Incoming' ? form.receiver : form.caller}
              onValueChange={(v) =>
                form.type === 'Incoming' ? set('receiver', v || '') : set('caller', v || '')
              }
              placeholder="Select user…"
            />
          </Field>
          <Field label="Lead (optional)">
            <Input
              value={form.lead}
              onChange={(e) => set('lead', e.target.value)}
              placeholder="DMS CRM Lead name"
            />
          </Field>
          <Field label="Recording URL">
            <Input
              value={form.recording_url}
              onChange={(e) => set('recording_url', e.target.value)}
            />
          </Field>
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
            <Field label="Note title">
              <Input value={form.note_title} onChange={(e) => set('note_title', e.target.value)} />
            </Field>
            <Field label="Note">
              <Textarea
                rows={3}
                value={form.note_content}
                onChange={(e) => set('note_content', e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
