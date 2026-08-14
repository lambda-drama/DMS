'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  escalateCase,
  fetchCaseFormOptions,
  getCase,
  updateCase,
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

function toLocalInput(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CrmCaseDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-case-form-options', fetchCaseFormOptions);
  const { data, isLoading, mutate } = useSWR(id ? ['crm-case', id] : null, () =>
    getCase(id)
  );
  const [saving, setSaving] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    subject: '',
    category: '',
    priority: '',
    status: '',
    source: '',
    responsible_department: '',
    escalation_level: '',
    next_action: '',
    next_action_due: '',
    parked_in_nurture: false,
    safety_impact: false,
    accident_related: false,
    legal_allegation: false,
    public_media_risk: false,
    vehicle_off_road: false,
    vip_fleet: false,
    reputational_risk: 'None',
    customer_statement: '',
    requested_outcome: '',
    evidence_notes: '',
    findings: '',
    responsible_process: '',
    root_cause: '',
    corrective_action: '',
    preventive_action: '',
    action_taken: '',
    resolution_summary: '',
    goodwill_compensation: '',
    customer_accepted: false,
    closure_code: '',
    post_resolution_satisfaction: '',
    lessons_learned: '',
    reopen_reason: '',
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      subject: String(data.subject || ''),
      category: String(data.category || ''),
      priority: String(data.priority || ''),
      status: String(data.status || ''),
      source: String(data.source || ''),
      responsible_department: String(data.responsible_department || ''),
      escalation_level: String(data.escalation_level || 'None'),
      next_action: String(data.next_action || ''),
      next_action_due: toLocalInput(data.next_action_due as string),
      parked_in_nurture: Boolean(data.parked_in_nurture),
      safety_impact: Boolean(data.safety_impact),
      accident_related: Boolean(data.accident_related),
      legal_allegation: Boolean(data.legal_allegation),
      public_media_risk: Boolean(data.public_media_risk),
      vehicle_off_road: Boolean(data.vehicle_off_road),
      vip_fleet: Boolean(data.vip_fleet),
      reputational_risk: String(data.reputational_risk || 'None'),
      customer_statement: String(data.customer_statement || '').replace(/<[^>]+>/g, ''),
      requested_outcome: String(data.requested_outcome || ''),
      evidence_notes: String(data.evidence_notes || ''),
      findings: String(data.findings || '').replace(/<[^>]+>/g, ''),
      responsible_process: String(data.responsible_process || ''),
      root_cause: String(data.root_cause || ''),
      corrective_action: String(data.corrective_action || ''),
      preventive_action: String(data.preventive_action || ''),
      action_taken: String(data.action_taken || ''),
      resolution_summary: String(data.resolution_summary || ''),
      goodwill_compensation:
        data.goodwill_compensation != null ? String(data.goodwill_compensation) : '',
      customer_accepted: Boolean(data.customer_accepted),
      closure_code: String(data.closure_code || ''),
      post_resolution_satisfaction: String(data.post_resolution_satisfaction || ''),
      lessons_learned: String(data.lessons_learned || ''),
      reopen_reason: String(data.reopen_reason || ''),
    });
  }, [data]);

  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));

  const statusOptions = (() => {
    const all = selectOpts(options?.statuses);
    if (data?.protected_escalation && !data?.can_close_protected) {
      return all.filter((o) => o.value !== 'Closed');
    }
    return all;
  })();

  const set = (key: keyof typeof form, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (!id) return;
    clear();
    if (
      form.status === 'Closed' &&
      data?.protected_escalation &&
      !data?.can_close_protected
    ) {
      showError(
        'This case is under protected escalation. Only a DMS CRM Manager can close it.'
      );
      return;
    }
    const open =
      form.status !== 'Resolved' && form.status !== 'Closed' && !form.parked_in_nurture;
    if (open && (!form.next_action.trim() || !form.next_action_due)) {
      showError('Open cases need a next action and due date, or tick Park in nurture.');
      return;
    }
    setSaving(true);
    try {
      await updateCase(id, {
        ...form,
        subject: form.subject.trim(),
        safety_impact: form.safety_impact ? 1 : 0,
        accident_related: form.accident_related ? 1 : 0,
        legal_allegation: form.legal_allegation ? 1 : 0,
        public_media_risk: form.public_media_risk ? 1 : 0,
        vehicle_off_road: form.vehicle_off_road ? 1 : 0,
        vip_fleet: form.vip_fleet ? 1 : 0,
        parked_in_nurture: form.parked_in_nurture ? 1 : 0,
        customer_accepted: form.customer_accepted ? 1 : 0,
        goodwill_compensation: form.goodwill_compensation
          ? Number(form.goodwill_compensation)
          : null,
      });
      await mutate();
      showSuccess('Case saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save case');
    } finally {
      setSaving(false);
    }
  };

  const onEscalate = async () => {
    if (!id) return;
    clear();
    setEscalating(true);
    try {
      await escalateCase(id, form.escalation_level !== 'None' ? form.escalation_level : undefined);
      await mutate();
      showSuccess('Case escalated.');
    } catch (e: unknown) {
      showError(e, 'Failed to escalate');
    } finally {
      setEscalating(false);
    }
  };

  if (!id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No case selected.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-48" />;

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('crm-cases')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Cases
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          {data.protected_escalation ? (
            <Badge variant="destructive">Protected escalation</Badge>
          ) : null}
          {data.sla_breached ? (
            <Badge variant="destructive">SLA breached</Badge>
          ) : null}
          {data.safety_impact ? <Badge variant="destructive">Safety</Badge> : null}
          <Button variant="outline" size="sm" disabled={escalating} onClick={onEscalate}>
            {escalating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Escalate
          </Button>
        </div>
      </div>

      {data.protected_escalation ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Protected escalation is active (safety, accident, legal, or public-media risk).
          Escalation is locked to Executive.
          {!data.can_close_protected
            ? ' Closure requires a DMS CRM Manager.'
            : ' You can close this case as a manager.'}
        </p>
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">
            {String(data.name)} — identification
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Subject</label>
            <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <p className="text-sm font-medium">
              {String(data.customer_name || data.customer || '—')}
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Owner</label>
            <p className="text-sm">{String(data.owner_name || data.case_owner || '—')}</p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Category</label>
            <SearchableSelect
              options={selectOpts(options?.categories)}
              value={form.category}
              onValueChange={(v) => set('category', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Priority</label>
            <SearchableSelect
              options={selectOpts(options?.priorities)}
              value={form.priority}
              onValueChange={(v) => set('priority', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Status</label>
            <SearchableSelect
              options={statusOptions}
              value={form.status}
              onValueChange={(v) => set('status', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Source</label>
            <SearchableSelect
              options={selectOpts(options?.sources)}
              value={form.source}
              onValueChange={(v) => set('source', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Department</label>
            <SearchableSelect
              options={selectOpts(options?.departments)}
              value={form.responsible_department}
              onValueChange={(v) => set('responsible_department', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Escalation level
            </label>
            <SearchableSelect
              options={selectOpts(options?.escalation_levels)}
              value={form.escalation_level}
              onValueChange={(v) => set('escalation_level', v || 'None')}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Next action
            </label>
            <Input
              value={form.next_action}
              onChange={(e) => set('next_action', e.target.value)}
              placeholder="What you will do next"
              disabled={form.parked_in_nurture || form.status === 'Resolved' || form.status === 'Closed'}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Next action due
            </label>
            <Input
              type="datetime-local"
              value={form.next_action_due}
              onChange={(e) => set('next_action_due', e.target.value)}
              disabled={form.parked_in_nurture || form.status === 'Resolved' || form.status === 'Closed'}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.parked_in_nurture}
                onChange={(e) => set('parked_in_nurture', e.target.checked)}
              />
              Park in nurture
            </label>
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2">
            {(
              [
                ['safety_impact', 'Safety impact'],
                ['accident_related', 'Accident related'],
                ['legal_allegation', 'Legal allegation'],
                ['public_media_risk', 'Public / media risk'],
                ['vehicle_off_road', 'Vehicle off-road'],
                ['vip_fleet', 'VIP / Fleet'],
                ['customer_accepted', 'Customer accepted'],
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
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Reputational risk
            </label>
            <SearchableSelect
              options={[
                { value: 'None', label: 'None' },
                { value: 'Low', label: 'Low' },
                { value: 'Medium', label: 'Medium' },
                { value: 'High', label: 'High' },
              ]}
              value={form.reputational_risk}
              onValueChange={(v) => set('reputational_risk', v || 'None')}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">SLA</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <p>
            <span className="text-muted-foreground">Opened: </span>
            {data.opened_on
              ? String(data.opened_on).slice(0, 16).replace('T', ' ')
              : '—'}
          </p>
          <p>
            <span className="text-muted-foreground">Response deadline: </span>
            {data.response_deadline
              ? String(data.response_deadline).slice(0, 16).replace('T', ' ')
              : '—'}
            {data.response_breached ? (
              <Badge variant="destructive" className="ml-2">
                Breached
              </Badge>
            ) : null}
          </p>
          <p>
            <span className="text-muted-foreground">Resolution target: </span>
            {data.resolution_target
              ? String(data.resolution_target).slice(0, 16).replace('T', ' ')
              : '—'}
            {data.resolution_breached ? (
              <Badge variant="destructive" className="ml-2">
                Breached
              </Badge>
            ) : null}
          </p>
          <p>
            <span className="text-muted-foreground">Escalated on: </span>
            {data.escalated_on
              ? String(data.escalated_on).slice(0, 16).replace('T', ' ')
              : '—'}
          </p>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Description & investigation</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Customer statement
            </label>
            <Textarea
              rows={3}
              value={form.customer_statement}
              onChange={(e) => set('customer_statement', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Requested outcome
            </label>
            <Textarea
              rows={2}
              value={form.requested_outcome}
              onChange={(e) => set('requested_outcome', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Evidence</label>
            <Textarea
              rows={2}
              value={form.evidence_notes}
              onChange={(e) => set('evidence_notes', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Findings</label>
            <Textarea
              rows={3}
              value={form.findings}
              onChange={(e) => set('findings', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Responsible process
            </label>
            <Input
              value={form.responsible_process}
              onChange={(e) => set('responsible_process', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Root cause</label>
            <Textarea
              rows={2}
              value={form.root_cause}
              onChange={(e) => set('root_cause', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Corrective action
            </label>
            <Textarea
              rows={2}
              value={form.corrective_action}
              onChange={(e) => set('corrective_action', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Preventive action
            </label>
            <Textarea
              rows={2}
              value={form.preventive_action}
              onChange={(e) => set('preventive_action', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Resolution & follow-up</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Action taken</label>
            <Textarea
              rows={2}
              value={form.action_taken}
              onChange={(e) => set('action_taken', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Resolution summary
            </label>
            <Textarea
              rows={2}
              value={form.resolution_summary}
              onChange={(e) => set('resolution_summary', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Goodwill / compensation
            </label>
            <Input
              type="number"
              value={form.goodwill_compensation}
              onChange={(e) => set('goodwill_compensation', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Closure code</label>
            <SearchableSelect
              options={selectOpts(options?.closure_codes)}
              value={form.closure_code}
              onValueChange={(v) => set('closure_code', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Post-resolution satisfaction
            </label>
            <SearchableSelect
              options={selectOpts(options?.satisfaction)}
              value={form.post_resolution_satisfaction}
              onValueChange={(v) => set('post_resolution_satisfaction', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Reopen reason
            </label>
            <Textarea
              rows={2}
              value={form.reopen_reason}
              onChange={(e) => set('reopen_reason', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Lessons learned
            </label>
            <Textarea
              rows={2}
              value={form.lessons_learned}
              onChange={(e) => set('lessons_learned', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {Array.isArray(data.activities) && data.activities.length > 0 ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Linked activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.activities.map((a: Record<string, unknown>) => (
              <div
                key={String(a.name)}
                className="flex justify-between gap-2 border-b border-border/50 py-2 last:border-0"
              >
                <span>{String(a.subject || a.name)}</span>
                <span className="text-muted-foreground">{String(a.status || '')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-cases')}>
          Cancel
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save case
        </Button>
      </FormActionsBar>
    </div>
  );
}
