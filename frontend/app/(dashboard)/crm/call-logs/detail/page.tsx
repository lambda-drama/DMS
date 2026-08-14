'use client';

import { useMemo, useState, type ReactNode } from 'react';
import useSWR from 'swr';
import {
  addNoteToCallLog,
  addTaskToCallLog,
  createLeadFromCallLog,
  fetchCallLogFormOptions,
  getCallLog,
  updateCallLog,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/searchable-select';
import { NoteDialog, TaskDialog } from '@/components/crm/note-task-dialogs';
import { CrmLeadLink } from '@/components/crm/crm-lead-link';
import { CrmContactLink } from '@/components/crm/crm-contact-link';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import {
  ArrowLeft,
  ArrowRight,
  PhoneIncoming,
  PhoneOutgoing,
  Plus,
} from 'lucide-react';

export default function CrmCallLogDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data, isLoading, mutate, error: loadError } = useSWR(
    id ? ['crm-call-log', id] : null,
    () => getCallLog(id)
  );
  const { data: options } = useSWR('crm-call-log-options', fetchCallLogFormOptions);
  const [busy, setBusy] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [editing, setEditing] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [taskSubject, setTaskSubject] = useState('');
  const [taskNotes, setTaskNotes] = useState('');
  const [taskDue, setTaskDue] = useState('');
  const [form, setForm] = useState<Record<string, string>>({});

  const call = data;
  const notes = call?._notes || [];
  const tasks = call?._tasks || [];

  const statusOptions = useMemo(
    () => (options?.statuses || []).map((s) => ({ value: s, label: s })),
    [options]
  );
  const typeOptions = useMemo(
    () => (options?.types || []).map((s) => ({ value: s, label: s })),
    [options]
  );
  const userOptions = useMemo(() => options?.users || [], [options]);

  function startEdit() {
    if (!call) return;
    setForm({
      from: String(call.from || ''),
      to: String(call.to || ''),
      type: String(call.type || 'Outgoing'),
      status: String(call.status || 'Completed'),
      duration: String(call.duration ?? ''),
      start_time: String(call.start_time || '').slice(0, 16),
      end_time: String(call.end_time || '').slice(0, 16),
      caller: String(call.caller || ''),
      receiver: String(call.receiver || ''),
      recording_url: String(call.recording_url || ''),
      lead: String(call._lead || (call.reference_doctype === 'DMS CRM Lead' ? call.reference_docname : '') || ''),
      lead_label: String(call._lead_label || ''),
      contact: String(call._contact || (call.reference_doctype === 'Contact' ? call.reference_docname : '') || ''),
      contact_label: String(call._contact_label || ''),
    });
    setEditing(true);
  }

  async function saveEdit() {
    if (!id) return;
    setBusy(true);
    clear();
    try {
      await updateCallLog(id, {
        from: form.from,
        to: form.to,
        type: form.type,
        status: form.status,
        duration: form.duration ? Number(form.duration) : 0,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        caller: form.caller || null,
        receiver: form.receiver || null,
        recording_url: form.recording_url || null,
        lead: form.lead || null,
        contact: form.contact || null,
      });
      setEditing(false);
      await mutate();
      showSuccess('Call log updated.');
    } catch (e: unknown) {
      showError(e, 'Failed to update call log.');
    } finally {
      setBusy(false);
    }
  }

  async function saveNote() {
    if (!id) return;
    setBusy(true);
    clear();
    try {
      const existing = notes[0] as { name?: string } | undefined;
      await addNoteToCallLog(id, {
        name: existing?.name,
        title: noteTitle || 'Call Note',
        content: noteContent,
      });
      setNoteOpen(false);
      setNoteTitle('');
      setNoteContent('');
      await mutate();
      showSuccess('Note saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save note.');
    } finally {
      setBusy(false);
    }
  }

  async function saveTask() {
    if (!id || !taskSubject.trim()) {
      showError('Task subject is required.');
      return;
    }
    setBusy(true);
    clear();
    try {
      await addTaskToCallLog(id, {
        subject: taskSubject,
        outcome_notes: taskNotes,
        due_datetime: taskDue || null,
        activity_type: 'Call',
      });
      setTaskOpen(false);
      setTaskSubject('');
      setTaskNotes('');
      setTaskDue('');
      await mutate();
      showSuccess('Task created.');
    } catch (e: unknown) {
      showError(e, 'Failed to save task.');
    } finally {
      setBusy(false);
    }
  }

  async function onCreateLead() {
    if (!id) return;
    setBusy(true);
    clear();
    try {
      const res = await createLeadFromCallLog(id);
      await mutate();
      const lead = (res as { lead?: string })?.lead;
      if (lead) {
        navigate('crm-lead-detail', { id: lead });
        return;
      }
      showSuccess('Lead created from call.');
    } catch (e: unknown) {
      showError(e, 'Failed to create lead.');
    } finally {
      setBusy(false);
    }
  }

  if (!id) {
    return <p className="text-sm text-muted-foreground">Missing call log id.</p>;
  }

  if (isLoading) {
    return <Skeleton className="h-64" />;
  }

  if (loadError || !call) {
    return (
      <div className="space-y-3">
        <Button variant="outline" onClick={() => navigate('crm-call-logs')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <p className="text-sm text-destructive">
          {loadError instanceof Error ? loadError.message : 'Call log not found.'}
        </p>
      </div>
    );
  }

  const incoming = call.type === 'Incoming';

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('crm-call-logs')} disabled={busy}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Call Logs
        </Button>
        <div className="flex flex-wrap gap-2">
          {!editing ? (
            <Button variant="outline" onClick={startEdit} disabled={busy}>
              Edit Call Log
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={saveEdit} disabled={busy}>
                Save
              </Button>
            </>
          )}
          <Button
            variant="outline"
            onClick={() => {
              const existing = notes[0] as { title?: string; content?: string } | undefined;
              setNoteTitle(noteTitle || String(existing?.title || ''));
              setNoteContent(noteContent || String(existing?.content || '').replace(/<[^>]*>/g, ''));
              setNoteOpen(true);
            }}
            disabled={busy}
          >
            {notes.length ? 'Edit Note' : 'Add Note'}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setTaskSubject('');
              setTaskNotes('');
              setTaskDue('');
              setTaskOpen(true);
            }}
            disabled={busy}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Task
          </Button>
          {!call._lead && !call._deal ? (
            <Button onClick={onCreateLead} disabled={busy}>
              Create Lead
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            {incoming ? (
              <PhoneIncoming className="h-4 w-4" />
            ) : (
              <PhoneOutgoing className="h-4 w-4" />
            )}
            Call Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          {!editing ? (
            <>
              <DetailRow label="Direction">
                <span className="inline-flex items-center gap-2">
                  {call._caller?.label || '—'}
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  {call._receiver?.label || '—'}
                </span>
              </DetailRow>
              <DetailRow label="From">{call.from || '—'}</DetailRow>
              <DetailRow label="To">{call.to || '—'}</DetailRow>
              <DetailRow label="Type">{call.type || '—'}</DetailRow>
              <DetailRow label="Status">
                <Badge variant="secondary">{call.status_label || call.status || '—'}</Badge>
              </DetailRow>
              <DetailRow label="Duration">{call._duration || '—'}</DetailRow>
              <DetailRow label="Medium">{call.telephony_medium || call.medium || 'Manual'}</DetailRow>
              <DetailRow label="Start">
                {call.start_time ? new Date(call.start_time).toLocaleString() : '—'}
              </DetailRow>
              <DetailRow label="End">
                {call.end_time ? new Date(call.end_time).toLocaleString() : '—'}
              </DetailRow>
              {(call.recording_url_path || call.recording_url) && (
                <DetailRow label="Recording">
                  <audio
                    className="w-full max-w-md"
                    controls
                    src={String(call.recording_url_path || call.recording_url)}
                  />
                </DetailRow>
              )}
              {call._lead ? (
                <DetailRow label="Lead">
                  <button
                    type="button"
                    className="text-primary underline-offset-2 hover:underline"
                    onClick={() => navigate('crm-lead-detail', { id: String(call._lead) })}
                  >
                    {String(call._lead_label || call._lead)}
                  </button>
                </DetailRow>
              ) : null}
              {call._contact ? (
                <DetailRow label="Contact">{String(call._contact_label || call._contact)}</DetailRow>
              ) : null}
              {call._deal ? (
                <DetailRow label="Deal">
                  <button
                    type="button"
                    className="text-primary underline-offset-2 hover:underline"
                    onClick={() =>
                      navigate('crm-opportunity-detail', { id: String(call._deal) })
                    }
                  >
                    {String(call._deal_label || call._deal)}
                  </button>
                </DetailRow>
              ) : null}
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="From">
                <Input
                  value={form.from}
                  onChange={(e) => setForm((p) => ({ ...p, from: e.target.value }))}
                />
              </Field>
              <Field label="To">
                <Input
                  value={form.to}
                  onChange={(e) => setForm((p) => ({ ...p, to: e.target.value }))}
                />
              </Field>
              <Field label="Type">
                <SearchableSelect
                  options={typeOptions}
                  value={form.type}
                  onValueChange={(v) => setForm((p) => ({ ...p, type: v || '' }))}
                />
              </Field>
              <Field label="Status">
                <SearchableSelect
                  options={statusOptions}
                  value={form.status}
                  onValueChange={(v) => setForm((p) => ({ ...p, status: v || '' }))}
                />
              </Field>
              <Field label="Duration (seconds)">
                <Input
                  type="number"
                  value={form.duration}
                  onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                />
              </Field>
              <Field label={form.type === 'Incoming' ? 'Received by' : 'Caller'}>
                <SearchableSelect
                  options={userOptions}
                  value={form.type === 'Incoming' ? form.receiver : form.caller}
                  onValueChange={(v) =>
                    setForm((p) =>
                      p.type === 'Incoming'
                        ? { ...p, receiver: v || '' }
                        : { ...p, caller: v || '' }
                    )
                  }
                  placeholder="Select user…"
                />
              </Field>
              <Field label="Start">
                <Input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                />
              </Field>
              <Field label="End">
                <Input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                />
              </Field>
              <Field label="Lead (optional)">
                <CrmLeadLink
                  value={form.lead || ''}
                  valueLabel={form.lead_label}
                  presetOptions={options?.leads}
                  onValueChange={(v, label, meta) =>
                    setForm((p) => ({
                      ...p,
                      lead: v || '',
                      lead_label: label || '',
                      contact: v ? '' : p.contact,
                      contact_label: v ? '' : p.contact_label,
                      to: meta?.mobile || p.to,
                    }))
                  }
                  placeholder="Select a lead…"
                />
              </Field>
              <Field label="Contact">
                <CrmContactLink
                  value={form.contact || ''}
                  valueLabel={form.contact_label}
                  onValueChange={(v, label, meta) =>
                    setForm((p) => ({
                      ...p,
                      contact: v || '',
                      contact_label: label || '',
                      lead: v ? '' : p.lead,
                      lead_label: v ? '' : p.lead_label,
                      to: meta?.mobile || p.to,
                    }))
                  }
                  placeholder="Or link a contact…"
                />
              </Field>
              <Field label="Recording URL">
                <Input
                  value={form.recording_url}
                  onChange={(e) => setForm((p) => ({ ...p, recording_url: e.target.value }))}
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {notes.length ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {notes.map((n) => (
              <div key={String(n.name)} className="rounded-md border border-border/70 p-3 text-sm">
                <div className="font-medium">{String(n.title || 'Note')}</div>
                <div
                  className="mt-1 text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: String(n.content || '') }}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {tasks.length ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Linked Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((t) => (
              <div
                key={String(t.name)}
                className="flex items-center justify-between rounded-md border border-border/70 px-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{String(t.subject || t.name)}</div>
                  <div className="text-xs text-muted-foreground">
                    {String(t.status || '')}
                    {t.due_datetime ? ` · ${new Date(String(t.due_datetime)).toLocaleString()}` : ''}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('crm-activities')}
                >
                  Open
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <NoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        title={notes.length ? 'Edit Note' : 'Add Note'}
        noteTitle={noteTitle}
        noteContent={noteContent}
        onNoteTitleChange={setNoteTitle}
        onNoteContentChange={setNoteContent}
        onSave={() => void saveNote()}
        saving={busy}
        showTitleField
      />
      <TaskDialog
        open={taskOpen}
        onOpenChange={setTaskOpen}
        subject={taskSubject}
        notes={taskNotes}
        due={taskDue}
        onSubjectChange={setTaskSubject}
        onNotesChange={setTaskNotes}
        onDueChange={setTaskDue}
        onSave={() => void saveTask()}
        saving={busy}
      />
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[8rem_1fr] sm:items-center">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
      <div>{children}</div>
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
