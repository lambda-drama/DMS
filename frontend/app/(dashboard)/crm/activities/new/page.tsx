'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { createActivity, fetchActivityFormOptions } from '@/services/crm';
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

export default function CrmActivityNewPage() {
  const { navigate } = useNavigation();
  const { data: options } = useSWR('crm-activity-form-options', fetchActivityFormOptions);
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    subject: '',
    activity_type: 'Call',
    status: 'Open',
    priority: 'Medium',
    due_datetime: '',
    customer: '',
    is_recurring: false,
    recurrence_frequency: '',
    outcome_notes: '',
  });

  const set = (key: string, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));
  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));

  const onSave = async () => {
    clear();
    if (!form.subject.trim()) {
      showError('Subject is required.');
      return;
    }
    setSaving(true);
    try {
      const result = await createActivity({
        subject: form.subject.trim(),
        activity_type: form.activity_type,
        status: form.status,
        priority: form.priority,
        due_datetime: form.due_datetime || null,
        customer: form.customer || null,
        is_recurring: form.is_recurring ? 1 : 0,
        recurrence_frequency: form.is_recurring ? form.recurrence_frequency || null : null,
        outcome_notes: form.outcome_notes || null,
      });
      navigate('crm-activity-detail', { id: String(result.name) });
    } catch (e: unknown) {
      showError(e, 'Failed to create activity');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New activity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Subject *</label>
            <Input value={form.subject} onChange={(e) => set('subject', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={selectOpts(options?.activity_types)}
              value={form.activity_type}
              onValueChange={(v) => set('activity_type', v || 'Call')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Priority</label>
            <SearchableSelect
              options={selectOpts(options?.priorities)}
              value={form.priority}
              onValueChange={(v) => set('priority', v || 'Medium')}
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
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <CrmCustomerLink
              value={form.customer}
              onValueChange={(v) => set('customer', v || '')}
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.is_recurring}
              onChange={(e) => set('is_recurring', e.target.checked)}
            />
            Recurring activity
          </label>
          {form.is_recurring ? (
            <div className="space-y-2">
              <label className="block text-xs font-medium text-muted-foreground">Frequency</label>
              <SearchableSelect
                options={selectOpts(options?.recurrence_frequencies)}
                value={form.recurrence_frequency}
                onValueChange={(v) => set('recurrence_frequency', v || '')}
              />
            </div>
          ) : null}
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea
              rows={2}
              value={form.outcome_notes}
              onChange={(e) => set('outcome_notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-activities')}>
          Cancel
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create activity
        </Button>
      </FormActionsBar>
    </div>
  );
}
