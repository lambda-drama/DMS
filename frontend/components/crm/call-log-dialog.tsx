'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import { Loader2, PhoneCall } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/searchable-select';
import { createCallLog, fetchCallLogFormOptions } from '@/services/crm';
import { useCrmFeedback } from '@/components/crm/form-feedback';

type CallLogDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  leadLabel: string;
  leadMobile: string;
  /** Lead owner (user id) — pre-selected as the default Caller. */
  defaultCaller?: string;
  onSaved?: () => void;
};

const EMPTY = {
  from: '',
  to: '',
  type: 'Outgoing',
  status: 'Completed',
  duration: '',
  start_time: '',
  caller: '',
  receiver: '',
  note_title: '',
  note_content: '',
};

type Form = typeof EMPTY;

export function CallLogDialog({ open, onOpenChange, leadName, leadLabel, leadMobile, defaultCaller, onSaved }: CallLogDialogProps) {
  const { error, showError, showSuccess, clear } = useCrmFeedback();
  const { data: options } = useSWR(open ? 'crm-call-log-options' : null, fetchCallLogFormOptions);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);

  useEffect(() => {
    if (open) {
      clear();
      setSaving(false);
      setForm({
        ...EMPTY,
        from: leadMobile || '',
        to: leadMobile || '',
        caller: defaultCaller || '',
        receiver: defaultCaller || '',
      });
    }
  }, [open, leadMobile, defaultCaller, clear]);

  const statusOptions = useMemo(() => (options?.statuses || []).map((s) => ({ value: s, label: s })), [options]);
  const typeOptions = useMemo(() => (options?.types || []).map((s) => ({ value: s, label: s })), [options]);
  const userOptions = useMemo(() => options?.users || [], [options]);

  function set<K extends keyof Form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    clear();
    if (!leadName) return showError('Lead is required to log a call.');
    if (!form.from.trim() || !form.to.trim()) return showError('From and To numbers are required.');
    setSaving(true);
    try {
      await createCallLog({
        from: form.from.trim(),
        to: form.to.trim(),
        type: form.type,
        status: form.status,
        duration: form.duration ? Number(form.duration) : 0,
        start_time: form.start_time || null,
        caller: form.type === 'Outgoing' ? form.caller || null : null,
        receiver: form.type === 'Incoming' ? form.receiver || null : null,
        lead: leadName,
        note_title: form.note_title || null,
        note_content: form.note_content || null,
        telephony_medium: 'Manual',
      });
      // Backend advances lead: Completed → Contacted; other outcomes → Contact Attempted.
      setForm(EMPTY);
      onOpenChange(false);
      onSaved?.();
      showSuccess('Call logged.');
    } catch (e: unknown) {
      showError(e, 'Failed to create call log.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PhoneCall className="h-4 w-4" />
            Log Call — {leadLabel || leadName}
          </DialogTitle>
          <DialogDescription>
            Record a call for this lead. You can log calls at any stage.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
          {error ? (
            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="From number *">
              <Input value={form.from} onChange={(e) => set('from', e.target.value)} placeholder="Agent / lead number" />
            </Field>
            <Field label="To number *">
              <Input value={form.to} onChange={(e) => set('to', e.target.value)} placeholder="Lead / agent number" />
            </Field>
            <Field label="Type">
              <SearchableSelect options={typeOptions} value={form.type} onValueChange={(v) => set('type', v || 'Outgoing')} />
            </Field>
            <Field label="Status">
              <SearchableSelect options={statusOptions} value={form.status} onValueChange={(v) => set('status', v || 'Completed')} />
            </Field>
            <Field label="Duration (seconds)">
              <Input type="number" min={0} value={form.duration} onChange={(e) => set('duration', e.target.value)} />
            </Field>
            <Field label="Start time">
              <Input type="datetime-local" value={form.start_time} onChange={(e) => set('start_time', e.target.value)} />
            </Field>
            <Field label={form.type === 'Incoming' ? 'Received by' : 'Caller'}>
              <SearchableSelect
                options={userOptions}
                value={form.type === 'Incoming' ? form.receiver : form.caller}
                onValueChange={(v) => (form.type === 'Incoming' ? set('receiver', v || '') : set('caller', v || ''))}
                placeholder="Select user…"
              />
            </Field>
            <div className="grid gap-3 sm:col-span-2 sm:grid-cols-2">
              <Field label="Note title">
                <Input value={form.note_title} onChange={(e) => set('note_title', e.target.value)} placeholder="e.g. First contact call" />
              </Field>
              <Field label="Note">
                <Textarea rows={3} value={form.note_content} onChange={(e) => set('note_content', e.target.value)} placeholder="Call summary…" />
              </Field>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Call Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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