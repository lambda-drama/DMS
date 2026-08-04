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
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

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
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Vehicle (VIN)</label>
            <Input
              value={form.vehicle_vin}
              onChange={(e) => set('vehicle_vin', e.target.value)}
              placeholder="VIN doc name"
            />
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
