'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  acceptLead,
  addLeadNote,
  convertLeadToOpportunity,
  disqualifyLead,
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
import { CallLogDialog } from '@/components/crm/call-log-dialog';
import { LostReasonDialog } from '@/components/crm/lost-reason-dialog';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import {
  LeadFormSections,
  emptyLeadForm,
  leadFromDoc,
  leadPayload,
  type LeadFormState,
} from '@/components/crm/lead-form';
import { Loader2, MessageSquarePlus, PhoneCall, XCircle } from 'lucide-react';

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
  const [callLogOpen, setCallLogOpen] = useState(false);
  const [lostReasonOpen, setLostReasonOpen] = useState(false);
  const [disqualifying, setDisqualifying] = useState(false);
  const [conversionCustomer, setConversionCustomer] = useState('');
  const [createCustomer, setCreateCustomer] = useState(true);
  /** Farthest pipeline stage reached — keeps Contact Attempted colored if user clicks Assigned. */
  const [reachedStatus, setReachedStatus] = useState('New');
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();

  useEffect(() => {
    if (data) {
      setForm(leadFromDoc(data as Record<string, unknown>));
      setConversionCustomer(String((data as Record<string, unknown>).customer || ''));
      const saved = String((data as Record<string, unknown>).status || 'New');
      const hasCalls = Number((data as Record<string, unknown>).call_log_count || 0) > 0;
      const hasCompletedCalls =
        Number((data as Record<string, unknown>).completed_call_log_count || 0) > 0;
      setReachedStatus((prev) => {
        let best = prev;
        const fromCalls = hasCompletedCalls
          ? 'Contacted'
          : hasCalls
            ? 'Contact Attempted'
            : '';
        for (const candidate of [saved, fromCalls]) {
          if (!candidate) continue;
          if (LEAD_PATH.indexOf(candidate) > LEAD_PATH.indexOf(best)) best = candidate;
        }
        return best;
      });
    }
  }, [data]);

  useEffect(() => {
    if (viewParams.get('action') === 'convert') setShowConvert(true);
  }, [viewParams]);

  const onSave = async () => {
    if (!id) return;
    clear();
    setSaving(true);
    try {
      await updateLead(id, leadPayload(form));
      await mutate();
      showSuccess('Lead saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to update lead');
    } finally {
      setSaving(false);
    }
  };

  const onAccept = async () => {
    if (!id) return;
    clear();
    setAccepting(true);
    try {
      await acceptLead(id);
      await mutate();
      showSuccess('Lead accepted.');
    } catch (e: unknown) {
      showError(e, 'Failed to accept lead');
    } finally {
      setAccepting(false);
    }
  };

  const onConvert = async () => {
    if (!id) return;
    clear();
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
      showError(e, 'Failed to convert lead');
    } finally {
      setConverting(false);
    }
  };

  const onAddNote = async () => {
    if (!id || !note.trim()) return;
    clear();
    setAddingNote(true);
    try {
      await addLeadNote(id, note.trim());
      setNote('');
      setNoteOpen(false);
      await mutate();
      showSuccess('Note added.');
    } catch (e: unknown) {
      showError(e, 'Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const onDisqualify = async (reason: string) => {
    if (!id) return;
    clear();
    setDisqualifying(true);
    try {
      await disqualifyLead(id, reason);
      setLostReasonOpen(false);
      await mutate();
      showSuccess('Lead disqualified.');
    } catch (e: unknown) {
      showError(e, 'Failed to disqualify lead');
    } finally {
      setDisqualifying(false);
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
  const busy = saving || converting || accepting || addingNote || disqualifying;
  const canAccept = !doc.accepted_on && ['Assigned', 'New'].includes(String(doc.status || ''));
  const notes = Array.isArray(doc.notes) ? (doc.notes as Record<string, unknown>[]) : [];
  const currentStatus = String(form.status || doc.status || 'New');
  const terminal = ['Disqualified', 'Invalid', 'Duplicate'].includes(currentStatus);
  const canLoseLead =
    !['Qualified', 'Converted', 'Disqualified', 'Duplicate', 'Invalid'].includes(currentStatus);

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
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
            reached={reachedStatus}
            terminal={terminal}
            onSelect={(status) => {
              setForm((prev) => ({ ...prev, status }));
              const idx = LEAD_PATH.indexOf(status);
              const reachedIdx = LEAD_PATH.indexOf(reachedStatus);
              if (idx > reachedIdx) setReachedStatus(status);
            }}
            trailing={
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full"
                  title="Log call"
                  aria-label="Log call"
                  onClick={() => setCallLogOpen(true)}
                  disabled={busy}
                >
                  <PhoneCall className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-full"
                  title="Add note"
                  aria-label="Add note"
                  onClick={() => {
                    setNote('');
                    setNoteOpen(true);
                  }}
                  disabled={busy}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                </Button>
                {canLoseLead ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 shrink-0 rounded-full border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    title="Lost reason — disqualify lead"
                    aria-label="Lost reason — disqualify lead"
                    onClick={() => setLostReasonOpen(true)}
                    disabled={busy}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                ) : null}
              </>
            }
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
                Customer
              </label>
              <CrmCustomerLink
                value={conversionCustomer}
                onValueChange={(value) => {
                  setConversionCustomer(value || '');
                  if (value) setCreateCustomer(false);
                }}
                createDefaults={{
                  customer_name:
                    String(doc.organization_name || '').trim() ||
                    String(doc.lead_name || '').trim() ||
                    [doc.first_name, doc.last_name].filter(Boolean).map(String).join(' '),
                  mobile_no: String(doc.mobile_no || doc.phone || ''),
                  email_id: String(doc.email || ''),
                  customer_type: [
                    'Company',
                    'Government',
                    'Embassy',
                    'NGO',
                    'Fleet Operator',
                    'Taxi / Mobility',
                    'Leasing / Rental',
                    'Dealer / Reseller',
                  ].includes(String(doc.customer_type || ''))
                    ? 'Company'
                    : 'Individual',
                }}
              />
              <p className="text-xs text-muted-foreground">
                Search an existing customer, or use Create customer — it opens a modal and
                selects the new record automatically.
              </p>
            </div>
            {!conversionCustomer ? (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={createCustomer}
                  onChange={(event) => setCreateCustomer(event.target.checked)}
                />
                Auto-create customer from this lead on convert (if none selected)
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

      <CallLogDialog
        open={callLogOpen}
        onOpenChange={setCallLogOpen}
        leadName={id}
        leadLabel={String(doc.lead_name || doc.name || 'Lead')}
        leadMobile={String(doc.mobile_no || doc.phone || '')}
        defaultCaller={String(doc.lead_owner || doc.owner || '')}
        onSaved={() => void mutate()}
      />

      <LostReasonDialog
        open={lostReasonOpen}
        onOpenChange={setLostReasonOpen}
        leadName={id}
        leadLabel={String(doc.lead_name || doc.name || 'Lead')}
        onSave={(reason) => void onDisqualify(reason)}
        saving={disqualifying}
      />
    </div>
  );
}