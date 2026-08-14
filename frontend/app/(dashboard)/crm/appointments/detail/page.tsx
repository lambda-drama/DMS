'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  fetchSalesAppointmentFormOptions,
  getSalesAppointment,
  updateStandaloneSalesAppointment,
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

export default function CrmSalesAppointmentDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR(
    'crm-sales-appointment-form-options',
    fetchSalesAppointmentFormOptions
  );
  const { data, isLoading, mutate } = useSWR(id ? ['crm-sales-appointment', id] : null, () =>
    getSalesAppointment(id)
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    appointment_datetime: '',
    duration_minutes: '60',
    appointment_type: '',
    status: '',
    assigned_to: '',
    agenda: '',
    outcome_notes: '',
  });

  useEffect(() => {
    if (!data) return;
    setForm({
      appointment_datetime: String(data.appointment_datetime || '').slice(0, 16),
      duration_minutes: String(data.duration_minutes || 60),
      appointment_type: String(data.appointment_type || ''),
      status: String(data.status || ''),
      assigned_to: String(data.assigned_to || ''),
      agenda: String(data.agenda || ''),
      outcome_notes: String(data.outcome_notes || ''),
    });
  }, [data]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (!id) return;
    clear();
    setSaving(true);
    try {
      await updateStandaloneSalesAppointment(id, {
        appointment_datetime: form.appointment_datetime,
        duration_minutes: Number(form.duration_minutes || 60),
        appointment_type: form.appointment_type,
        status: form.status,
        assigned_to: form.assigned_to || null,
        agenda: form.agenda || null,
        outcome_notes: form.outcome_notes || null,
      });
      await mutate();
      showSuccess('Appointment saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <p className="text-sm text-muted-foreground">No appointment selected.</p>
    );
  }
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }
  if (!data) {
    return <p className="text-sm text-destructive">Appointment not found.</p>;
  }

  const typeOpts = (options?.appointment_types || []).map((v: string) => ({ value: v, label: v }));
  const statusOpts = (options?.statuses || []).map((v: string) => ({ value: v, label: v }));
  const userOpts = options?.users || [];

  return (
    <div className="dms-form-page space-y-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 h-8 px-2 text-muted-foreground"
        onClick={() => navigate('crm-sales-appointments')}
      >
        <ArrowLeft className="mr-1.5 h-4 w-4" />
        Appointments
      </Button>
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {String(data.customer_name || data.customer || data.name)}
        </h1>
        <p className="text-sm text-muted-foreground">{String(data.name)}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Badge variant="secondary">{String(data.status || '—')}</Badge>
          {data.appointment_type ? (
            <Badge variant="outline">{String(data.appointment_type)}</Badge>
          ) : null}
        </div>
      </div>
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Appointment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Date & time</label>
            <Input
              type="datetime-local"
              value={form.appointment_datetime}
              onChange={(e) => set('appointment_datetime', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Duration (min)</label>
            <Input
              type="number"
              min={15}
              value={form.duration_minutes}
              onChange={(e) => set('duration_minutes', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={typeOpts}
              value={form.appointment_type}
              onValueChange={(v) => set('appointment_type', v)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Status</label>
            <SearchableSelect
              options={statusOpts}
              value={form.status}
              onValueChange={(v) => set('status', v)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Assigned to</label>
            <SearchableSelect
              options={userOpts}
              value={form.assigned_to}
              onValueChange={(v) => set('assigned_to', v)}
            />
          </div>
          {data.opportunity ? (
            <button
              type="button"
              className="sm:col-span-2 text-left text-sm text-primary underline-offset-2 hover:underline"
              onClick={() =>
                navigate('crm-opportunity-detail', { id: String(data.opportunity) })
              }
            >
              Open deal {String(data.opportunity_title || data.opportunity)}
            </button>
          ) : null}
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Agenda</label>
            <Textarea
              rows={3}
              value={form.agenda}
              onChange={(e) => set('agenda', e.target.value)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Outcome / notes (required for No-Show or Cancelled)
            </label>
            <Textarea
              rows={3}
              value={form.outcome_notes}
              onChange={(e) => set('outcome_notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <FormActionsBar>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
      </FormActionsBar>
    </div>
  );
}
