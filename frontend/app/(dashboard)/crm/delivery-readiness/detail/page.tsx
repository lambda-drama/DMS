'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  getDeliveryReadiness,
  markDeliveryReady,
  updateDeliveryReadiness,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Loader2 } from 'lucide-react';

type ChecklistRow = {
  category?: string;
  check_item: string;
  is_mandatory?: number;
  is_completed?: number;
  result?: string;
  notes?: string;
};

export default function CrmDeliveryReadinessDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data, isLoading, mutate } = useSWR(id ? ['crm-delivery-ready', id] : null, () =>
    getDeliveryReadiness(id)
  );
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data) setForm(data as Record<string, unknown>);
  }, [data]);

  const checklist = (form.checklist as ChecklistRow[] | undefined) || [];
  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));
  const updateRow = (index: number, patch: Partial<ChecklistRow>) => {
    const next = [...checklist];
    next[index] = { ...next[index], ...patch };
    set('checklist', next);
  };

  const onSave = async (markReady = false) => {
    setSaving(true);
    setError('');
    try {
      await updateDeliveryReadiness(id, {
        status: markReady ? 'Ready' : form.status,
        payment_status: form.payment_status,
        documentation_status: form.documentation_status,
        pdi_status: form.pdi_status,
        vehicle_location: form.vehicle_location,
        delivery_appointment: form.delivery_appointment,
        handover_on: form.handover_on,
        blocked_reason: form.blocked_reason,
        satisfaction_score: Number(form.satisfaction_score || 0),
        notes: form.notes,
        checklist,
      });
      if (markReady) await markDeliveryReady(id);
      await mutate();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update delivery readiness');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !data) return <Skeleton className="h-80" />;

  const categories = Array.from(new Set(checklist.map((row) => row.category || 'Other')));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('crm-delivery-readiness')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Delivery Readiness
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void onSave(false)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save
          </Button>
          <Button onClick={() => void onSave(true)} disabled={saving}>
            Mark Ready
          </Button>
        </div>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {id} · {String(form.status || 'Draft')}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Deal">
            <button
              className="text-sm text-primary hover:underline"
              onClick={() =>
                navigate('crm-opportunity-detail', { id: String(form.opportunity) })
              }
            >
              {String(form.opportunity)}
            </button>
          </Field>
          <Field label="Customer">{String(form.customer || '—')}</Field>
          <Field label="Allocated VIN">{String(form.vehicle_vin || '—')}</Field>
          <Field label="Vehicle Location">
            <Input
              value={String(form.vehicle_location || '')}
              onChange={(event) => set('vehicle_location', event.target.value)}
            />
          </Field>
          <Field label="Payment Status">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={String(form.payment_status || 'Pending')}
              onChange={(event) => set('payment_status', event.target.value)}
            >
              {['Pending', 'Deposit Received', 'Fully Paid', 'Credit Approved'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Documentation Status">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={String(form.documentation_status || 'Pending')}
              onChange={(event) => set('documentation_status', event.target.value)}
            >
              {['Pending', 'In Progress', 'Complete'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="PDI Status">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={String(form.pdi_status || 'Not Started')}
              onChange={(event) => set('pdi_status', event.target.value)}
            >
              {['Not Started', 'In Progress', 'Passed', 'Failed', 'Waived'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Delivery Appointment">
            <Input
              type="datetime-local"
              value={String(form.delivery_appointment || '').slice(0, 16)}
              onChange={(event) => set('delivery_appointment', event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      {categories.map((category) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base">{category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {checklist
              .map((row, index) => ({ row, index }))
              .filter(({ row }) => (row.category || 'Other') === category)
              .map(({ row, index }) => (
                <div
                  key={`${row.check_item}-${index}`}
                  className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_8rem_2fr]"
                >
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={Boolean(row.is_completed)}
                      onChange={(event) =>
                        updateRow(index, {
                          is_completed: event.target.checked ? 1 : 0,
                          result: event.target.checked ? 'Pass' : 'Pending',
                        })
                      }
                    />
                    <span>
                      {row.check_item}
                      {row.is_mandatory ? <span className="ml-1 text-destructive">*</span> : null}
                    </span>
                  </label>
                  <select
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    value={row.result || 'Pending'}
                    onChange={(event) => updateRow(index, { result: event.target.value })}
                  >
                    {['Pending', 'Pass', 'Fail', 'N/A'].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                  <Input
                    placeholder="Evidence / notes"
                    value={row.notes || ''}
                    onChange={(event) => updateRow(index, { notes: event.target.value })}
                  />
                </div>
              ))}
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Handover notes</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Satisfaction (1-5)">
            <Input
              type="number"
              min={1}
              max={5}
              value={String(form.satisfaction_score || '')}
              onChange={(event) => set('satisfaction_score', event.target.value)}
            />
          </Field>
          <Field label="Blocked Reason">
            <Input
              value={String(form.blocked_reason || '')}
              onChange={(event) => set('blocked_reason', event.target.value)}
            />
          </Field>
          <Field label="Internal Notes">
            <Textarea
              value={String(form.notes || '')}
              onChange={(event) => set('notes', event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      <div>{children}</div>
    </div>
  );
}
