'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  createStandaloneSalesAppointment,
  fetchSalesAppointmentFormOptions,
  getOpportunity,
  listOpportunities,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

export default function CrmSalesAppointmentNewPage() {
  const { navigate, viewParams } = useNavigation();
  const presetCustomer = viewParams.get('customer') || '';
  const presetDeal = viewParams.get('opportunity') || '';
  const { data: options } = useSWR(
    'crm-sales-appointment-form-options',
    fetchSalesAppointmentFormOptions
  );
  const [dealSearch, setDealSearch] = useState('');
  const { data: deals } = useSWR(['crm-appt-deals', dealSearch], () =>
    listOpportunities({ search: dealSearch || undefined, status: 'Open', limit: 50 })
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    customer: presetCustomer,
    opportunity: presetDeal,
    appointment_datetime: '',
    duration_minutes: '60',
    appointment_type: 'Showroom Appointment',
    assigned_to: '',
    company: '',
    branch: '',
    agenda: '',
  });

  useEffect(() => {
    if (!options) return;
    setForm((prev) => ({
      ...prev,
      company: prev.company || String(options.default_company || options.companies?.[0] || ''),
      appointment_type:
        prev.appointment_type || String(options.appointment_types?.[0] || 'Showroom Appointment'),
    }));
  }, [options]);

  useEffect(() => {
    if (!form.opportunity) return;
    getOpportunity(form.opportunity)
      .then((opp: Record<string, unknown>) => {
        setForm((prev) => ({
          ...prev,
          customer: String(opp.customer || prev.customer),
          company: String(opp.company || prev.company),
          branch: String(opp.branch || prev.branch),
          assigned_to: String(opp.opportunity_owner || prev.assigned_to),
        }));
      })
      .catch(() => undefined);
  }, [form.opportunity]);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));
  const typeOpts = (options?.appointment_types || []).map((v: string) => ({ value: v, label: v }));
  const companyOpts = (options?.companies || []).map((v: string) => ({ value: v, label: v }));
  const branchOpts = (options?.branches || []).map((v: string) => ({ value: v, label: v }));
  const userOpts = options?.users || [];
  const dealOpts = useMemo(
    () =>
      (deals?.data || []).map((d: Record<string, unknown>) => ({
        value: String(d.name),
        label: String(d.title || d.name),
        description: String(d.customer_name || d.customer || ''),
      })),
    [deals]
  );

  const onSave = async () => {
    clear();
    if (!form.customer) {
      showError('Select a customer.');
      return;
    }
    if (!form.appointment_datetime) {
      showError('Appointment date and time are required.');
      return;
    }
    setSaving(true);
    try {
      const result = await createStandaloneSalesAppointment({
        customer: form.customer,
        opportunity: form.opportunity || null,
        appointment_datetime: form.appointment_datetime,
        duration_minutes: Number(form.duration_minutes || 60),
        appointment_type: form.appointment_type,
        assigned_to: form.assigned_to || null,
        company: form.company || null,
        branch: form.branch || null,
        agenda: form.agenda || null,
      });
      navigate('crm-sales-appointment-detail', { id: String(result.name) });
    } catch (e: unknown) {
      showError(e, 'Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New sales appointment</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer *</label>
            <CrmCustomerLink value={form.customer} onValueChange={(v) => set('customer', v)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Deal (optional)
            </label>
            <SearchableSelect
              options={dealOpts}
              value={form.opportunity}
              onValueChange={(v) => set('opportunity', v)}
              onSearchChange={setDealSearch}
              placeholder="Link a deal to move it to Appointment Scheduled…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Date & time *</label>
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
            <label className="block text-xs font-medium text-muted-foreground">Assigned to</label>
            <SearchableSelect
              options={userOpts}
              value={form.assigned_to}
              onValueChange={(v) => set('assigned_to', v)}
              placeholder="Salesperson…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Company</label>
            <SearchableSelect
              options={companyOpts}
              value={form.company}
              onValueChange={(v) => set('company', v)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Branch</label>
            <SearchableSelect
              options={branchOpts}
              value={form.branch}
              onValueChange={(v) => set('branch', v)}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Agenda</label>
            <Textarea
              rows={3}
              value={form.agenda}
              onChange={(e) => set('agenda', e.target.value)}
              placeholder="Showroom visit, vehicle viewing, finance discussion…"
            />
          </div>
        </CardContent>
      </Card>
      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-sales-appointments')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Book appointment
        </Button>
      </FormActionsBar>
    </div>
  );
}
