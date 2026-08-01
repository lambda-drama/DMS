'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import {
  createQuotationFromOpportunity,
  fetchTestVehicleOptions,
  getTestDrive,
  updateTestDrive,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft, Loader2 } from 'lucide-react';

type ChecklistRow = {
  category?: string;
  check_item: string;
  is_mandatory?: number;
  is_completed: number;
  result: string;
  notes?: string;
};

export default function CrmTestDriveDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data, isLoading, mutate } = useSWR(id ? ['crm-test-drive', id] : null, () =>
    getTestDrive(id)
  );
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [creatingQuotation, setCreatingQuotation] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [vehicleSearch, setVehicleSearch] = useState('');
  const { data: vehicles, isLoading: vehiclesLoading } = useSWR(
    ['crm-test-drive-vins', vehicleSearch, form.company],
    () => fetchTestVehicleOptions(vehicleSearch, String(form.company || '') || undefined),
    { keepPreviousData: true }
  );

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

  const onSave = async () => {
    setSaving(true);
    clear();
    try {
      await updateTestDrive(id, {
        scheduled_datetime: form.scheduled_datetime,
        status: form.status,
        vehicle_vin: form.vehicle_vin,
        driver_name: form.driver_name,
        driver_license: form.driver_license,
        id_verified: form.id_verified ? 1 : 0,
        driver_id_reference: form.driver_id_reference,
        customer_consent: form.customer_consent ? 1 : 0,
        consent_notes: form.consent_notes,
        route: form.route,
        start_odometer: Number(form.start_odometer || 0),
        end_odometer: Number(form.end_odometer || 0),
        pre_drive_condition: form.pre_drive_condition,
        fuel_charge_level: Number(form.fuel_charge_level || 0),
        customer_feedback: form.customer_feedback,
        customer_preferences: form.customer_preferences,
        outcome: form.outcome,
        model_changed_to: form.model_changed_to,
        failure_reason: form.failure_reason,
        incident_reported: form.incident_reported ? 1 : 0,
        incident_details: form.incident_details,
        damage_reported: form.damage_reported ? 1 : 0,
        damage_details: form.damage_details,
        notes: form.notes,
        checklist,
      });
      await mutate();
      showSuccess('Test Drive saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to update Test Drive');
    } finally {
      setSaving(false);
    }
  };

  const onCreateQuotation = async () => {
    if (form.quotation) {
      window.open(
        `/app/quotation/${encodeURIComponent(String(form.quotation))}`,
        '_blank',
        'noopener'
      );
      return;
    }
    setCreatingQuotation(true);
    clear();
    try {
      const result = await createQuotationFromOpportunity(String(form.opportunity));
      await mutate();
      navigate('crm-opportunity-detail', { id: String(form.opportunity) });
      return result;
    } catch (e: unknown) {
      showError(e, 'Failed to create Quotation');
    } finally {
      setCreatingQuotation(false);
    }
  };

  if (isLoading || !data) return <Skeleton className="h-80" />;

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={() => navigate('crm-test-drives')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Test Drives
        </Button>
        <div className="flex gap-2">
          {form.status === 'Completed' &&
          ['Interested', 'Quotation Requested'].includes(String(form.outcome || '')) ? (
            <Button variant="outline" onClick={onCreateQuotation} disabled={creatingQuotation}>
              {creatingQuotation ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {form.quotation ? 'Open Quotation' : 'Create Quotation'}
            </Button>
          ) : null}
          <Button onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Test Drive
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Test Drive {id}</CardTitle>
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
          <Field label="Scheduled">
            <Input
              type="datetime-local"
              value={String(form.scheduled_datetime || '').slice(0, 16)}
              onChange={(event) => set('scheduled_datetime', event.target.value)}
            />
          </Field>
          <Field label="Status">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={String(form.status || 'Scheduled')}
              onChange={(event) => set('status', event.target.value)}
            >
              {['Scheduled', 'Confirmed', 'Accepted', 'In Progress', 'Completed', 'Failed', 'No-Show', 'Cancelled'].map(
                (value) => (
                  <option key={value}>{value}</option>
                )
              )}
            </select>
          </Field>
          <Field label="Test Vehicle VIN">
            <SearchableSelect
              options={(vehicles || []).map((vehicle: Record<string, unknown>) => ({
                value: String(vehicle.name),
                label: String(vehicle.vin_number || vehicle.name),
                description: [vehicle.linked_item, vehicle.plate_number].filter(Boolean).join(' · '),
              }))}
              value={String(form.vehicle_vin || '')}
              onValueChange={(value) => set('vehicle_vin', value || '')}
              onSearchChange={setVehicleSearch}
              isLoading={vehiclesLoading}
              placeholder="Search VIN or vehicle…"
            />
          </Field>
          <Field label="Driver Name">
            <Input
              value={String(form.driver_name || '')}
              onChange={(event) => set('driver_name', event.target.value)}
            />
          </Field>
          <Field label="Driver Licence">
            <Input
              value={String(form.driver_license || '')}
              onChange={(event) => set('driver_license', event.target.value)}
            />
          </Field>
          <Field label="ID / Licence Reference">
            <Input
              value={String(form.driver_id_reference || '')}
              onChange={(event) => set('driver_id_reference', event.target.value)}
            />
          </Field>
          <CheckField
            label="Driver licence / ID verified"
            checked={Boolean(form.id_verified)}
            onChange={(checked) => set('id_verified', checked ? 1 : 0)}
          />
          <CheckField
            label="Customer test-drive consent captured"
            checked={Boolean(form.customer_consent)}
            onChange={(checked) => set('customer_consent', checked ? 1 : 0)}
          />
          <Field label="Consent Notes">
            <Input
              value={String(form.consent_notes || '')}
              onChange={(event) => set('consent_notes', event.target.value)}
            />
          </Field>
          <Field label="Route">
            <Input
              value={String(form.route || '')}
              onChange={(event) => set('route', event.target.value)}
            />
          </Field>
          <Field label="Start Odometer">
            <Input
              type="number"
              value={String(form.start_odometer || '')}
              onChange={(event) => set('start_odometer', event.target.value)}
            />
          </Field>
          <Field label="End Odometer">
            <Input
              type="number"
              value={String(form.end_odometer || '')}
              onChange={(event) => set('end_odometer', event.target.value)}
            />
          </Field>
          <Field label="Pre-drive Condition">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={String(form.pre_drive_condition || '')}
              onChange={(event) => set('pre_drive_condition', event.target.value)}
            >
              <option value="">Select condition</option>
              {['Excellent', 'Good', 'Fair', 'Damage Noted'].map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
          <Field label="Fuel / Charge Level (%)">
            <Input
              type="number"
              min={0}
              max={100}
              value={String(form.fuel_charge_level || '')}
              onChange={(event) => set('fuel_charge_level', event.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Safety & handover checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {checklist.map((row, index) => (
            <div
              key={`${row.check_item}-${index}`}
              className="grid gap-2 rounded-xl border border-border/70 p-3 sm:grid-cols-[1fr_8rem_2fr]"
            >
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean(row.is_completed)}
                  onChange={(event) =>
                    updateRow(index, { is_completed: event.target.checked ? 1 : 0 })
                  }
                />
                <span>
                  {row.check_item}
                  {row.is_mandatory ? <span className="ml-1 text-destructive">*</span> : null}
                  {row.category ? (
                    <span className="block text-xs text-muted-foreground">{row.category}</span>
                  ) : null}
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
                placeholder="Notes"
                value={row.notes || ''}
                onChange={(event) => updateRow(index, { notes: event.target.value })}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Outcome</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Outcome">
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={String(form.outcome || '')}
              onChange={(event) => set('outcome', event.target.value)}
            >
              <option value="">Select outcome</option>
              {[
                'Interested',
                'Follow-up Required',
                'Quotation Requested',
                'Model Changed',
                'Not Interested',
                'Issue Reported',
              ].map(
                (value) => (
                  <option key={value}>{value}</option>
                )
              )}
            </select>
          </Field>
          <Field label="Failure / No-show Reason">
            <Input
              value={String(form.failure_reason || '')}
              onChange={(event) => set('failure_reason', event.target.value)}
            />
          </Field>
          <Field label="Customer Feedback">
            <Textarea
              value={String(form.customer_feedback || '')}
              onChange={(event) => set('customer_feedback', event.target.value)}
            />
          </Field>
          <Field label="Customer Preferences / Evaluation">
            <Textarea
              value={String(form.customer_preferences || '')}
              onChange={(event) => set('customer_preferences', event.target.value)}
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Incident & vehicle damage report</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <CheckField
            label="Incident reported"
            checked={Boolean(form.incident_reported)}
            onChange={(checked) => set('incident_reported', checked ? 1 : 0)}
          />
          <CheckField
            label="Vehicle damage reported"
            checked={Boolean(form.damage_reported)}
            onChange={(checked) => set('damage_reported', checked ? 1 : 0)}
          />
          <Field label="Incident Details">
            <Textarea
              value={String(form.incident_details || '')}
              onChange={(event) => set('incident_details', event.target.value)}
            />
          </Field>
          <Field label="Damage Details">
            <Textarea
              value={String(form.damage_details || '')}
              onChange={(event) => set('damage_details', event.target.value)}
            />
          </Field>
          {form.follow_up_activity ? (
            <Field label="Automatic Follow-up Task">{String(form.follow_up_activity)}</Field>
          ) : null}
          {form.quotation ? <Field label="Quotation">{String(form.quotation)}</Field> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function CheckField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-border/70 p-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
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
