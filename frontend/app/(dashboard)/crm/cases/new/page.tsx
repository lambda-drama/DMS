'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { createCase, fetchCaseFormOptions } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { CrmVinLink } from '@/components/crm/crm-vin-link';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

function localDatetimeInHours(hours: number) {
  const d = new Date(Date.now() + hours * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CrmCaseNewPage() {
  const { navigate } = useNavigation();
  const { data: options } = useSWR('crm-case-form-options', fetchCaseFormOptions);
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    subject: '',
    customer: '',
    category: 'General Request',
    priority: 'Medium',
    source: 'Phone',
    status: 'New',
    vehicle_vin: '',
    responsible_department: '',
    next_action: 'Acknowledge and investigate',
    next_action_due: localDatetimeInHours(4),
    parked_in_nurture: false,
    safety_impact: false,
    accident_related: false,
    legal_allegation: false,
    public_media_risk: false,
    vehicle_off_road: false,
    vip_fleet: false,
    customer_statement: '',
    requested_outcome: '',
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));

  const categoryOptions = useMemo(() => selectOpts(options?.categories), [options]);
  const priorityOptions = useMemo(() => selectOpts(options?.priorities), [options]);
  const sourceOptions = useMemo(() => selectOpts(options?.sources), [options]);
  const deptOptions = useMemo(() => selectOpts(options?.departments), [options]);

  const onSave = async () => {
    clear();
    if (!form.subject.trim()) {
      showError('Subject is required.');
      return;
    }
    if (!form.parked_in_nurture && (!form.next_action.trim() || !form.next_action_due)) {
      showError('Open cases need a next action and due date, or tick Park in nurture.');
      return;
    }
    setSaving(true);
    try {
      const result = await createCase({
        subject: form.subject.trim(),
        customer: form.customer || null,
        category: form.category,
        priority: form.priority,
        source: form.source,
        status: form.status,
        vehicle_vin: form.vehicle_vin || null,
        responsible_department: form.responsible_department || null,
        next_action: form.parked_in_nurture ? form.next_action || null : form.next_action.trim(),
        next_action_due: form.parked_in_nurture ? form.next_action_due || null : form.next_action_due,
        parked_in_nurture: form.parked_in_nurture ? 1 : 0,
        safety_impact: form.safety_impact ? 1 : 0,
        accident_related: form.accident_related ? 1 : 0,
        legal_allegation: form.legal_allegation ? 1 : 0,
        public_media_risk: form.public_media_risk ? 1 : 0,
        vehicle_off_road: form.vehicle_off_road ? 1 : 0,
        vip_fleet: form.vip_fleet ? 1 : 0,
        customer_statement: form.customer_statement || null,
        requested_outcome: form.requested_outcome || null,
      });
      navigate('crm-case-detail', { id: String(result.name) });
    } catch (e: unknown) {
      showError(e, 'Failed to create case');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New case</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Subject *</label>
            <Input
              value={form.subject}
              onChange={(e) => set('subject', e.target.value)}
              placeholder="Brief case summary"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <CrmCustomerLink
              value={form.customer}
              onValueChange={(v) => set('customer', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Vehicle (VIN)</label>
            <CrmVinLink
              value={form.vehicle_vin}
              customer={form.customer}
              onValueChange={(vin, picked) => {
                setForm((prev) => ({
                  ...prev,
                  vehicle_vin: vin || '',
                  customer: prev.customer || picked?.customer || '',
                }));
              }}
            />
            <p className="text-xs text-muted-foreground">
              Pick from this customer's vehicles, or type a VIN / plate to search all units.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Category</label>
            <SearchableSelect
              options={categoryOptions}
              value={form.category}
              onValueChange={(v) => set('category', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Priority</label>
            <SearchableSelect
              options={priorityOptions}
              value={form.priority}
              onValueChange={(v) => set('priority', v || 'Medium')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Source</label>
            <SearchableSelect
              options={sourceOptions}
              value={form.source}
              onValueChange={(v) => set('source', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Department</label>
            <SearchableSelect
              options={deptOptions}
              value={form.responsible_department}
              onValueChange={(v) => set('responsible_department', v || '')}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Next action *
            </label>
            <Input
              value={form.next_action}
              onChange={(e) => set('next_action', e.target.value)}
              placeholder="e.g. Call customer, inspect vehicle, raise job card…"
              disabled={form.parked_in_nurture}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Next action due *
            </label>
            <Input
              type="datetime-local"
              value={form.next_action_due}
              onChange={(e) => set('next_action_due', e.target.value)}
              disabled={form.parked_in_nurture}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.parked_in_nurture}
                onChange={(e) => set('parked_in_nurture', e.target.checked)}
              />
              Park in nurture (no due date yet)
            </label>
          </div>
          <div className="flex flex-wrap gap-4 sm:col-span-2 pt-1">
            {(
              [
                ['safety_impact', 'Safety impact'],
                ['accident_related', 'Accident related'],
                ['legal_allegation', 'Legal allegation'],
                ['public_media_risk', 'Public / media risk'],
                ['vehicle_off_road', 'Vehicle off-road'],
                ['vip_fleet', 'VIP / Fleet'],
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
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Customer statement
            </label>
            <Textarea
              rows={4}
              value={form.customer_statement}
              onChange={(e) => set('customer_statement', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Requested outcome
            </label>
            <Textarea
              rows={2}
              value={form.requested_outcome}
              onChange={(e) => set('requested_outcome', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-cases')}>
          Cancel
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create case
        </Button>
      </FormActionsBar>
    </div>
  );
}
