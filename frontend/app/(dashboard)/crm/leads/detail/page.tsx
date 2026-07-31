'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  acceptLead,
  addLeadNote,
  convertLeadToOpportunity,
  fetchLeadFormOptions,
  getLead,
  updateLead,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { PipelinePath } from '@/components/crm/pipeline-path';
import { NoteDialog } from '@/components/crm/note-task-dialogs';
import {
  LeadFormSections,
  emptyLeadForm,
  leadFromDoc,
  leadPayload,
  type LeadFormState,
} from '@/components/crm/lead-form';
import { Loader2, MessageSquarePlus } from 'lucide-react';

const LEAD_PATH = ['New', 'Assigned', 'Contact Attempted', 'Contacted', 'Qualified', 'Converted'];

export default function CrmLeadDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-lead-form-options', fetchLeadFormOptions);
  const { data, isLoading, mutate } = useSWR(id ? ['crm-lead', id] : null, () => getLead(id));
  const [form, setForm] = useState<LeadFormState>(emptyLeadForm);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState('');
  const [showConvert, setShowConvert] = useState(false);
  const [conversionCustomer, setConversionCustomer] = useState('');
  const [createCustomer, setCreateCustomer] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) {
      setForm(leadFromDoc(data as Record<string, unknown>));
      setConversionCustomer(String((data as Record<string, unknown>).customer || ''));
    }
  }, [data]);

  useEffect(() => {
    if (viewParams.get('action') === 'convert') setShowConvert(true);
  }, [viewParams]);

  const onSave = async () => {
    if (!id) return;
    setError('');
    setSaving(true);
    try {
      await updateLead(id, leadPayload(form));
      await mutate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const onAccept = async () => {
    if (!id) return;
    setError('');
    setAccepting(true);
    try {
      await acceptLead(id);
      await mutate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to accept lead');
    } finally {
      setAccepting(false);
    }
  };

  const onConvert = async () => {
    if (!id) return;
    setError('');
    setConverting(true);
    try {
      const result = (await convertLeadToOpportunity(id, {
        customer: conversionCustomer || null,
        create_customer: createCustomer ? 1 : 0,
      })) as {
        opportunity?: string;
      };
      await mutate();
      if (result?.opportunity) {
        navigate('crm-opportunity-detail', { id: result.opportunity });
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to convert lead');
    } finally {
      setConverting(false);
    }
  };

  const onAddNote = async () => {
    if (!id || !note.trim()) return;
    setError('');
    setAddingNote(true);
    try {
      await addLeadNote(id, note.trim());
      setNote('');
      setNoteOpen(false);
      await mutate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  if (!id) {
    return (
      <Card className="border-border/70">
        <CardContent className="py-10 text-center text-muted-foreground">
          No lead selected.
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  const doc = data as Record<string, unknown>;
  const busy = saving || converting || accepting || addingNote;
  const canAccept = !doc.accepted_on && ['Assigned', 'New'].includes(String(doc.status || ''));
  const notes = Array.isArray(doc.notes) ? (doc.notes as Record<string, unknown>[]) : [];
  const currentStatus = String(form.status || doc.status || 'New');
  const terminal = ['Disqualified', 'Invalid', 'Duplicate'].includes(currentStatus);

  return (
    <div className="dms-form-page space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Lead path</CardTitle>
            <span className="text-xs text-muted-foreground">{String(doc.name)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <PipelinePath
            stages={LEAD_PATH}
            current={currentStatus}
            terminal={terminal}
            onSelect={(status) => setForm((prev) => ({ ...prev, status }))}
          />
          {!LEAD_PATH.includes(currentStatus) ? (
            <span className="inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              {currentStatus}
            </span>
          ) : null}
        </CardContent>
      </Card>

      {showConvert && String(doc.status) !== 'Converted' ? (
        <Card className="border-primary/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Convert lead to deal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Existing Customer (optional)
              </label>
              <CrmCustomerLink
                value={conversionCustomer}
                onValueChange={(value) => {
                  setConversionCustomer(value || '');
                  if (value) setCreateCustomer(false);
                }}
              />
            </div>
            {!conversionCustomer ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createCustomer}
                  onChange={(event) => setCreateCustomer(event.target.checked)}
                />
                Create an ERPNext Customer from this lead, then link it to the deal
              </label>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowConvert(false)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={onConvert} disabled={busy || (!conversionCustomer && !createCustomer)}>
                {converting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Convert to Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <LeadFormSections form={form} setForm={setForm} options={options} showStatus />

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Notes</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setNote('');
              setNoteOpen(true);
            }}
            disabled={busy}
          >
            <MessageSquarePlus className="mr-2 h-4 w-4" />
            Add Note
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {notes.length ? (
            <div className="space-y-2">
              {notes.map((item) => (
                <div key={String(item.name)} className="rounded-xl border border-border/70 p-3">
                  <p className="whitespace-pre-wrap text-sm">
                    {String(item.content || '').replace(/<[^>]*>/g, '')}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {String(item.comment_by || item.owner || 'User')} ·{' '}
                    {item.creation ? new Date(String(item.creation)).toLocaleString() : ''}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No notes yet.</p>
          )}
        </CardContent>
      </Card>
      <NoteDialog
        open={noteOpen}
        onOpenChange={setNoteOpen}
        noteContent={note}
        onNoteContentChange={setNote}
        onSave={() => void onAddNote()}
        saving={addingNote}
      />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-leads')} disabled={busy}>
          Back
        </Button>
        {canAccept ? (
          <Button variant="secondary" onClick={onAccept} disabled={busy}>
            {accepting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Accept Lead
          </Button>
        ) : null}
        {String(doc.status) !== 'Converted' ? (
          <Button variant="secondary" onClick={() => setShowConvert(true)} disabled={busy}>
            Convert to Deal
          </Button>
        ) : null}
        <Button onClick={onSave} disabled={busy}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Changes
        </Button>
      </FormActionsBar>
    </div>
  );
}
