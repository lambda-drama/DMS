'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  createSalesAppointment,
  createSalesInvoiceFromOpportunity,
  createSalesOrderFromOpportunity,
  createTestDrive,
  createQuotationFromOpportunity,
  createDeliveryReadiness,
  allocateVin,
  searchAllocatableVins,
  fetchCrmBrands,
  fetchCrmBranches,
  fetchCrmColors,
  fetchCrmItems,
  fetchCrmVehicleModels,
  fetchOpportunityFormOptions,
  fetchTestVehicleOptions,
  getOpportunity,
  markOpportunityWon,
  reissueQuotation,
  updateOpportunity,
  updateQuotationTracking,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { PipelinePath } from '@/components/crm/pipeline-path';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2, Plus, Trash2 } from 'lucide-react';

const DEAL_PATH = [
  'Qualified',
  'Appointment Scheduled',
  'Test Drive',
  'Quotation Submitted',
  'Negotiation',
  'Booking / Deposit',
  'Order Confirmed',
  'Won',
];

type OppItem = {
  item_code: string;
  item_name?: string;
  qty: number;
  rate: number;
  uom?: string;
  discount_percentage?: number;
  amount?: number;
  net_amount?: number;
};

type OppForm = {
  title: string;
  customer: string;
  stage: string;
  status: string;
  company: string;
  branch: string;
  brand: string;
  model: string;
  preferred_color: string;
  expected_value: string;
  expected_close_date: string;
  probability: string;
  next_action: string;
  next_action_due: string;
  lost_reason: string;
  competitor: string;
  opportunity_type: string;
  quotation_validity: string;
  notes: string;
  items: OppItem[];
};

const emptyForm: OppForm = {
  title: '',
  customer: '',
  stage: 'New',
  status: 'Open',
  company: '',
  branch: '',
  brand: '',
  model: '',
  preferred_color: '',
  expected_value: '',
  expected_close_date: '',
  probability: '10',
  next_action: '',
  next_action_due: '',
  lost_reason: '',
  competitor: '',
  opportunity_type: '',
  quotation_validity: '',
  notes: '',
  items: [],
};

function formFromDoc(doc: Record<string, unknown>): OppForm {
  const items = Array.isArray(doc.items)
    ? (doc.items as Record<string, unknown>[]).map((row) => ({
        item_code: String(row.item_code || ''),
        item_name: String(row.item_name || ''),
        qty: Number(row.qty || 1),
        rate: Number(row.rate || 0),
        uom: String(row.uom || ''),
        discount_percentage: Number(row.discount_percentage || 0),
        amount: Number(row.amount || 0),
        net_amount: Number(row.net_amount || 0),
      }))
    : [];
  return {
    title: String(doc.title || ''),
    customer: String(doc.customer || ''),
    stage: String(doc.stage || 'New'),
    status: String(doc.status || 'Open'),
    company: String(doc.company || ''),
    branch: String(doc.branch || ''),
    brand: String(doc.brand || ''),
    model: String(doc.model || ''),
    preferred_color: String(doc.preferred_color || ''),
    expected_value: doc.expected_value != null ? String(doc.expected_value) : '',
    expected_close_date: String(doc.expected_close_date || ''),
    probability: doc.probability != null ? String(doc.probability) : '10',
    next_action: String(doc.next_action || ''),
    next_action_due: String(doc.next_action_due || '').slice(0, 16),
    lost_reason: String(doc.lost_reason || ''),
    competitor: String(doc.competitor || ''),
    opportunity_type: String(doc.opportunity_type || ''),
    quotation_validity: String(doc.quotation_validity || ''),
    notes: String(doc.notes || '').replace(/<[^>]+>/g, ''),
    items,
  };
}

export default function CrmOpportunityDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-opp-form-options', fetchOpportunityFormOptions);
  const { data, isLoading, mutate } = useSWR(id ? ['crm-opportunity', id] : null, () =>
    getOpportunity(id)
  );
  const [form, setForm] = useState<OppForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [pipelineBusy, setPipelineBusy] = useState(false);
  const [pipelinePanel, setPipelinePanel] = useState<
    '' | 'appointment' | 'test-drive' | 'quotation' | 'booking' | 'invoice'
  >('');
  const [appointmentForm, setAppointmentForm] = useState({
    appointment_datetime: '',
    appointment_type: 'Showroom Appointment',
    duration_minutes: '60',
    agenda: '',
  });
  const [testDriveForm, setTestDriveForm] = useState({
    scheduled_datetime: '',
    driver_name: '',
    driver_license: '',
    route: '',
    vehicle_vin: '',
  });
  const [bookingForm, setBookingForm] = useState({
    deposit_amount: '',
    receipt_reference: '',
    booking_expiry: '',
    factory_order_reference: '',
    cancellation_terms: '',
  });
  const [allocateVinValue, setAllocateVinValue] = useState('');
  const [allocateSearch, setAllocateSearch] = useState('');
  const [allocating, setAllocating] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [testVehicleSearch, setTestVehicleSearch] = useState('');

  useEffect(() => {
    if (data) setForm(formFromDoc(data as Record<string, unknown>));
  }, [data]);

  const statusOptions = useMemo(
    () => (options?.statuses || []).map((s) => ({ value: s, label: s })),
    [options]
  );
  const typeOptions = useMemo(
    () => (options?.opportunity_types || []).map((s) => ({ value: s, label: s })),
    [options]
  );
  const companyOptions = useMemo(
    () => (options?.companies || []).map((c) => ({ value: c, label: c })),
    [options]
  );

  const { data: brands, isLoading: brandsLoading } = useSWR(
    ['crm-opp-detail-brands', brandSearch],
    () => fetchCrmBrands(brandSearch),
    { keepPreviousData: true }
  );
  const { data: models, isLoading: modelsLoading } = useSWR(
    ['crm-opp-detail-models', modelSearch, form.brand],
    () => fetchCrmVehicleModels(modelSearch, form.brand || undefined),
    { keepPreviousData: true }
  );
  const { data: colors, isLoading: colorsLoading } = useSWR(
    ['crm-opp-detail-colors', colorSearch],
    () => fetchCrmColors(colorSearch),
    { keepPreviousData: true }
  );
  const { data: branches } = useSWR(
    ['crm-opp-detail-branches', form.company],
    () => fetchCrmBranches(form.company || undefined),
    { keepPreviousData: true }
  );
  const { data: items, isLoading: itemsLoading } = useSWR(
    ['crm-opp-items', itemSearch],
    () => fetchCrmItems(itemSearch),
    { keepPreviousData: true }
  );
  const { data: testVehicles, isLoading: testVehiclesLoading } = useSWR(
    ['crm-test-vehicles', testVehicleSearch, form.company],
    () => fetchTestVehicleOptions(testVehicleSearch, form.company || undefined),
    { keepPreviousData: true }
  );
  const { data: allocatableVins, isLoading: allocatableLoading } = useSWR(
    ['crm-opp-allocate-vins', allocateSearch, form.company, form.model],
    () =>
      searchAllocatableVins({
        search: allocateSearch,
        company: form.company || undefined,
        model: form.model || undefined,
        preferred_color: form.preferred_color || undefined,
      }),
    { keepPreviousData: true }
  );

  const set = (key: keyof OppForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const updateItem = (index: number, patch: Partial<OppItem>) => {
    setForm((prev) => {
      const next = [...prev.items];
      const row = { ...next[index], ...patch };
      const amount = Number(row.qty || 0) * Number(row.rate || 0);
      const discount = (amount * Number(row.discount_percentage || 0)) / 100;
      row.amount = amount;
      row.net_amount = amount - discount;
      next[index] = row;
      return { ...prev, items: next };
    });
  };

  const payload = () => ({
    title: form.title.trim(),
    customer: form.customer || null,
    stage: form.stage,
    status: form.status,
    company: form.company || null,
    branch: form.branch || null,
    brand: form.brand || null,
    model: form.model || null,
    preferred_color: form.preferred_color || null,
    expected_value: form.expected_value ? Number(form.expected_value) : 0,
    expected_close_date: form.expected_close_date || null,
    probability: form.probability ? Number(form.probability) : 0,
    next_action: form.next_action || null,
    next_action_due: form.next_action_due || null,
    lost_reason: form.lost_reason || null,
    competitor: form.competitor || null,
    opportunity_type: form.opportunity_type || null,
    quotation_validity: form.quotation_validity || null,
    notes: form.notes || null,
    items: form.items.filter((r) => r.item_code),
  });

  const onSave = async () => {
    if (!id) return;
    clear();
    if (!form.title.trim()) {
      showError('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await updateOpportunity(id, payload());
      await mutate();
      showSuccess('Deal saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to update deal');
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <Card className="border-border/70">
        <CardContent className="py-10 text-center text-muted-foreground">
          No opportunity selected.
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
  const busy = saving || pipelineBusy;

  const openDeskDoc = (doctype: string, name: unknown) => {
    if (!name) return;
    const slug = doctype.toLowerCase().replace(/\s+/g, '-');
    window.open(`/app/${slug}/${encodeURIComponent(String(name))}`, '_blank', 'noopener');
  };

  const linked = {
    appointment: String(doc.sales_appointment || ''),
    testDrive: String(doc.test_drive || ''),
    quotation: String(doc.quotation || ''),
    booking: String(doc.booking || ''),
    allocatedVin: String(doc.allocated_vin || ''),
    deliveryReadiness: String(doc.delivery_readiness || ''),
    salesOrder: String(doc.sales_order || ''),
    salesInvoice: String(doc.sales_invoice || ''),
  };
  const appointmentStatus = String(
    (doc.sales_appointment_details as Record<string, unknown> | undefined)?.status || ''
  );
  const testDriveStatus = String(
    (doc.test_drive_details as Record<string, unknown> | undefined)?.status || ''
  );

  const onPipelineStageClick = (stage: string) => {
    if (stage === 'Appointment Scheduled') {
      if (linked.appointment) openDeskDoc('DMS CRM Sales Appointment', linked.appointment);
      else setPipelinePanel('appointment');
    } else if (stage === 'Test Drive') {
      if (linked.testDrive) navigate('crm-test-drive-detail', { id: linked.testDrive });
      else setPipelinePanel('test-drive');
    } else if (stage === 'Quotation Submitted') {
      if (linked.quotation) openDeskDoc('Quotation', linked.quotation);
      else setPipelinePanel('quotation');
    } else if (stage === 'Negotiation') {
      if (!linked.quotation) setPipelinePanel('quotation');
      else setForm((prev) => ({ ...prev, stage: 'Negotiation' }));
    } else if (stage === 'Booking / Deposit') {
      if (linked.booking) openDeskDoc('DMS CRM Booking', linked.booking);
      else if (linked.salesOrder) openDeskDoc('Sales Order', linked.salesOrder);
      else setPipelinePanel('booking');
    } else if (stage === 'Order Confirmed') {
      if (linked.salesInvoice) openDeskDoc('Sales Invoice', linked.salesInvoice);
      else setPipelinePanel('invoice');
    } else if (stage === 'Won') {
      void runPipelineAction('won');
    }
  };

  const runPipelineAction = async (
    action: '' | 'appointment' | 'test-drive' | 'quotation' | 'negotiation' | 'booking' | 'invoice' | 'won'
  ) => {
    if (!action) return;
    clear();
    setPipelineBusy(true);
    try {
      if (action === 'appointment') {
        await createSalesAppointment(id, {
          ...appointmentForm,
          duration_minutes: Number(appointmentForm.duration_minutes || 60),
        });
      } else if (action === 'test-drive') {
        const result = await createTestDrive({ opportunity: id, ...testDriveForm });
        const testDrive = String((result as Record<string, unknown>)?.name || '');
        await mutate();
        setPipelinePanel('');
        if (testDrive) navigate('crm-test-drive-detail', { id: testDrive });
        return;
      } else if (action === 'quotation') {
        await updateOpportunity(id, payload());
        await createQuotationFromOpportunity(id, false);
      } else if (action === 'negotiation') {
        await updateOpportunity(id, { ...payload(), stage: 'Negotiation', status: 'Open' });
      } else if (action === 'booking') {
        await createSalesOrderFromOpportunity(id, {
          ...bookingForm,
          deposit_amount: Number(bookingForm.deposit_amount || 0),
          vehicle_vin: testDriveForm.vehicle_vin || undefined,
        });
      } else if (action === 'invoice') {
        const result = await createSalesInvoiceFromOpportunity(id);
        if (!(result as Record<string, unknown>)?.update_stock) {
          showError(
            'Invoice created as draft. Open it, set warehouse/serial or VIN details, enable Update Stock, then submit it before Won.'
          );
        }
      } else {
        await markOpportunityWon(id);
      }
      setPipelinePanel('');
      await mutate();
    } catch (e: unknown) {
      showError(e, 'Pipeline action failed');
    } finally {
      setPipelineBusy(false);
    }
  };

  const setQuotationStatus = async (
    status: 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired'
  ) => {
    const reason =
      status === 'Rejected'
        ? window.prompt('Enter the customer rejection reason')?.trim() || ''
        : '';
    if (status === 'Rejected' && !reason) return;
    setPipelineBusy(true);
    clear();
    try {
      await updateQuotationTracking(id, status, reason);
      await mutate();
      showSuccess(`Quotation marked ${status.toLowerCase()}.`);
    } catch (e: unknown) {
      showError(e, 'Failed to update quotation status');
    } finally {
      setPipelineBusy(false);
    }
  };

  const onReissueQuotation = async () => {
    setPipelineBusy(true);
    clear();
    try {
      await reissueQuotation(id, form.quotation_validity);
      await mutate();
      showSuccess('New quotation version created.');
    } catch (e: unknown) {
      showError(e, 'Failed to reissue quotation');
    } finally {
      setPipelineBusy(false);
    }
  };

  const onAllocateVin = async () => {
    if (!linked.booking || !allocateVinValue) return;
    setAllocating(true);
    clear();
    try {
      await allocateVin(linked.booking, { vehicle_vin: allocateVinValue });
      setAllocateVinValue('');
      await mutate();
      showSuccess('VIN allocated to this booking.');
    } catch (e: unknown) {
      showError(e, 'Failed to allocate VIN');
    } finally {
      setAllocating(false);
    }
  };

  const onStartDeliveryReadiness = async () => {
    setPipelineBusy(true);
    clear();
    try {
      const readiness = (await createDeliveryReadiness(id)) as Record<string, unknown>;
      await mutate();
      if (readiness?.name) {
        navigate('crm-delivery-readiness-detail', { id: String(readiness.name) });
      }
    } catch (e: unknown) {
      showError(e, 'Failed to create delivery readiness');
    } finally {
      setPipelineBusy(false);
    }
  };

  const nextAction = (() => {
    if (form.stage === 'Won' || form.status === 'Won') return null;
    if (!linked.appointment || ['No-Show', 'Cancelled'].includes(appointmentStatus))
      return { label: 'Schedule Appointment', action: 'appointment' as const };
    if (!linked.testDrive || ['Failed', 'No-Show', 'Cancelled'].includes(testDriveStatus))
      return { label: 'Schedule Test Drive', action: 'test-drive' as const };
    if (testDriveStatus !== 'Completed')
      return { label: 'Complete Test Drive Checklist', action: 'open-test-drive' as const };
    if (!linked.quotation) return { label: 'Create Quotation', action: 'quotation' as const };
    if (doc.quotation_customer_status === 'Rejected')
      return { label: 'Review & Reissue Quotation', action: 'open-quotation' as const };
    if (doc.quotation_customer_status === 'Accepted' && !linked.salesOrder)
      return { label: 'Create Booking / Sales Order', action: 'booking' as const };
    if (form.stage === 'Quotation Submitted')
      return { label: 'Start Negotiation', action: 'negotiation' as const };
    if (!linked.salesOrder)
      return { label: 'Create Booking / Sales Order', action: 'booking' as const };
    if (linked.booking && !linked.allocatedVin)
      return { label: 'Allocate VIN / Stock Unit', action: 'allocate' as const };
    if (!linked.salesInvoice)
      return { label: 'Create Invoice / Confirm Order', action: 'invoice' as const };
    if (!linked.deliveryReadiness)
      return { label: 'Start Delivery Readiness', action: 'delivery-readiness' as const };
    if (
      String(
        (doc.delivery_readiness_details as Record<string, unknown> | undefined)?.status || ''
      ) !== 'Ready' &&
      String(
        (doc.delivery_readiness_details as Record<string, unknown> | undefined)?.status || ''
      ) !== 'Delivered'
    )
      return { label: 'Complete Delivery Readiness', action: 'open-delivery-readiness' as const };
    if (form.stage !== 'Won') return { label: 'Verify Invoice & Mark Won', action: 'won' as const };
    return null;
  })();

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Sales path</CardTitle>
            <span className="text-xs text-muted-foreground">{String(doc.name)}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <PipelinePath
            stages={DEAL_PATH}
            current={form.stage}
            terminal={form.stage === 'Lost' || form.status === 'Lost'}
            onSelect={onPipelineStageClick}
          />
          {form.stage === 'Lost' || form.status === 'Lost' ? (
            <span className="inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              Lost
            </span>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Click Appointment, Test Drive, Quotation, Booking or Invoice to open its record.
            Missing records will ask you to create them.
          </p>
        </CardContent>
      </Card>

      {linked.quotation ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Official quotation tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button variant="outline" onClick={() => openDeskDoc('Quotation', linked.quotation)}>
                Open {linked.quotation}
              </Button>
              <span className="rounded-full bg-muted px-3 py-1">
                Version {String(doc.quotation_version || 1)}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
                {String(doc.quotation_customer_status || 'Draft')}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(['Sent', 'Viewed', 'Accepted', 'Rejected'] as const).map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant="outline"
                  disabled={pipelineBusy}
                  onClick={() => void setQuotationStatus(status)}
                >
                  Mark {status}
                </Button>
              ))}
              <Button
                size="sm"
                variant="outline"
                disabled={pipelineBusy}
                onClick={() => void onReissueQuotation()}
              >
                Reissue Quotation
              </Button>
            </div>
            {doc.quotation_rejection_reason ? (
              <p className="text-sm text-destructive">
                Rejection: {String(doc.quotation_rejection_reason)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {linked.booking ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Vehicle allocation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2 text-sm">
              <Button variant="outline" onClick={() => openDeskDoc('DMS CRM Booking', linked.booking)}>
                Open {linked.booking}
              </Button>
              {linked.allocatedVin ? (
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-emerald-700">
                  Allocated {linked.allocatedVin}
                </span>
              ) : (
                <span className="rounded-full bg-amber-500/15 px-3 py-1 text-amber-700">
                  Allocation pending
                </span>
              )}
              {linked.deliveryReadiness ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate('crm-delivery-readiness-detail', { id: linked.deliveryReadiness })
                  }
                >
                  Delivery readiness
                </Button>
              ) : null}
            </div>
            {!linked.allocatedVin ? (
              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <SearchableSelect
                  options={((allocatableVins as Record<string, unknown>[] | undefined) || []).map(
                    (vehicle) => ({
                      value: String(vehicle.name),
                      label: String(vehicle.vin_number || vehicle.name),
                      description: [vehicle.linked_item, vehicle.location, vehicle.model_name]
                        .filter(Boolean)
                        .join(' · '),
                    })
                  )}
                  value={allocateVinValue}
                  onValueChange={(value) => setAllocateVinValue(value || '')}
                  onSearchChange={setAllocateSearch}
                  isLoading={allocatableLoading}
                  placeholder="Search in-stock VIN…"
                />
                <Button onClick={() => void onAllocateVin()} disabled={allocating || !allocateVinValue}>
                  {allocating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Allocate
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {pipelinePanel ? (
        <Card className="border-primary/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {pipelinePanel === 'appointment'
                ? 'Schedule Sales Appointment'
                : pipelinePanel === 'test-drive'
                  ? 'Schedule Test Drive'
                  : pipelinePanel === 'quotation'
                    ? 'Create Standard Quotation'
                    : pipelinePanel === 'booking'
                      ? 'Create Booking / Sales Order'
                      : 'Create Sales Invoice'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pipelinePanel === 'appointment' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Date & time</label>
                  <Input
                    type="datetime-local"
                    value={appointmentForm.appointment_datetime}
                    onChange={(event) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        appointment_datetime: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={appointmentForm.appointment_type}
                    onChange={(event) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        appointment_type: event.target.value,
                      }))
                    }
                  >
                    {[
                      'Showroom Appointment',
                      'Sales Consultation',
                      'Vehicle Viewing',
                      'Document Review',
                      'Finance Consultation',
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Duration (minutes)</label>
                  <Input
                    type="number"
                    value={appointmentForm.duration_minutes}
                    onChange={(event) =>
                      setAppointmentForm((prev) => ({
                        ...prev,
                        duration_minutes: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Agenda</label>
                  <Input
                    value={appointmentForm.agenda}
                    onChange={(event) =>
                      setAppointmentForm((prev) => ({ ...prev, agenda: event.target.value }))
                    }
                  />
                </div>
              </div>
            ) : null}
            {pipelinePanel === 'test-drive' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Date & time</label>
                  <Input
                    type="datetime-local"
                    value={testDriveForm.scheduled_datetime}
                    onChange={(event) =>
                      setTestDriveForm((prev) => ({
                        ...prev,
                        scheduled_datetime: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Test Vehicle VIN</label>
                  <SearchableSelect
                    options={(testVehicles || []).map((vehicle: Record<string, unknown>) => ({
                      value: String(vehicle.name),
                      label: String(vehicle.vin_number || vehicle.name),
                      description: [vehicle.linked_item, vehicle.plate_number]
                        .filter(Boolean)
                        .join(' · '),
                    }))}
                    value={testDriveForm.vehicle_vin}
                    onValueChange={(value) =>
                      setTestDriveForm((prev) => ({ ...prev, vehicle_vin: value || '' }))
                    }
                    onSearchChange={setTestVehicleSearch}
                    isLoading={testVehiclesLoading}
                    placeholder="Search VIN or vehicle…"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Driver Name</label>
                  <Input
                    value={testDriveForm.driver_name}
                    onChange={(event) =>
                      setTestDriveForm((prev) => ({ ...prev, driver_name: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Driver Licence</label>
                  <Input
                    value={testDriveForm.driver_license}
                    onChange={(event) =>
                      setTestDriveForm((prev) => ({ ...prev, driver_license: event.target.value }))
                    }
                  />
                </div>
              </div>
            ) : pipelinePanel === 'booking' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Deposit amount
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={bookingForm.deposit_amount}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, deposit_amount: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Receipt reference
                  </label>
                  <Input
                    value={bookingForm.receipt_reference}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, receipt_reference: event.target.value }))
                    }
                    placeholder="Required to confirm a paid deposit"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Booking expiry
                  </label>
                  <Input
                    type="date"
                    value={bookingForm.booking_expiry}
                    onChange={(event) =>
                      setBookingForm((prev) => ({ ...prev, booking_expiry: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Factory order reference
                  </label>
                  <Input
                    value={bookingForm.factory_order_reference}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        factory_order_reference: event.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Booking expiry / cancellation terms
                  </label>
                  <Textarea
                    value={bookingForm.cancellation_terms}
                    onChange={(event) =>
                      setBookingForm((prev) => ({
                        ...prev,
                        cancellation_terms: event.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            ) : (
              pipelinePanel !== 'appointment' && (
                <p className="text-sm text-muted-foreground">
                  {pipelinePanel === 'quotation'
                    ? 'This creates a standard ERPNext Quotation from the deal items. Complete the Test Drive first.'
                    : pipelinePanel === 'booking'
                      ? 'This submits the Quotation and creates a draft standard Sales Order as the booking record.'
                      : 'This submits the Sales Order and creates a draft Sales Invoice. Won remains locked until the invoice is submitted with Update Stock.'}
                </p>
              )
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setPipelinePanel('')} disabled={busy}>
                Cancel
              </Button>
              <Button
                onClick={() => void runPipelineAction(pipelinePanel)}
                disabled={
                  busy ||
                  (pipelinePanel === 'appointment' && !appointmentForm.appointment_datetime) ||
                  (pipelinePanel === 'test-drive' && !testDriveForm.scheduled_datetime)
                }
              >
                {pipelineBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Create
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Stage</label>
            <Input value={form.stage} readOnly />
            <p className="text-xs text-muted-foreground">
              Stage advances only when its linked business document is created.
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Status</label>
            <SearchableSelect
              options={statusOptions}
              value={form.status}
              onValueChange={(v) => set('status', v || 'Open')}
              placeholder="Status…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Probability %</label>
            <Input
              type="number"
              value={form.probability}
              onChange={(e) => set('probability', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Expected close</label>
            <Input
              type="date"
              value={form.expected_close_date}
              onChange={(e) => set('expected_close_date', e.target.value)}
            />
          </div>
          {(form.stage === 'Lost' || form.status === 'Lost') && (
            <>
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Lost reason *
                </label>
                <Input
                  value={form.lost_reason}
                  onChange={(e) => set('lost_reason', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">Competitor</label>
                <Input
                  value={form.competitor}
                  onChange={(e) => set('competitor', e.target.value)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Deal details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <CrmCustomerLink
              value={form.customer}
              onValueChange={(v) => set('customer', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Company</label>
            <SearchableSelect
              options={companyOptions}
              value={form.company}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, company: v || '', branch: '' }))
              }
              placeholder="Company…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Branch</label>
            <SearchableSelect
              options={(branches || []).map((b) => ({
                value: b.name,
                label: b.branch || b.name,
              }))}
              value={form.branch}
              onValueChange={(v) => set('branch', v || '')}
              placeholder="Branch…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={typeOptions}
              value={form.opportunity_type}
              onValueChange={(v) => set('opportunity_type', v || '')}
              placeholder="Type…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Opportunity amount
            </label>
            <Input
              type="number"
              value={form.expected_value}
              onChange={(e) => set('expected_value', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Brand</label>
            <SearchableSelect
              options={(brands || []).map((b) => ({
                value: b.name,
                label: b.label || b.name,
              }))}
              value={form.brand}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  brand: v || '',
                  model: v && prev.brand && v !== prev.brand ? '' : prev.model,
                }))
              }
              onSearchChange={setBrandSearch}
              placeholder="Brand…"
              isLoading={brandsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Model</label>
            <SearchableSelect
              options={(models || []).map((vm) => ({
                value: vm.name,
                label: vm.model_code || vm.name,
                description:
                  [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
              }))}
              value={form.model}
              onValueChange={(v) => {
                const selected = (models || []).find((m) => m.name === v);
                setForm((prev) => ({
                  ...prev,
                  model: v || '',
                  brand: prev.brand || selected?.brand || '',
                }));
              }}
              onSearchChange={setModelSearch}
              placeholder="Model…"
              isLoading={modelsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Color</label>
            <SearchableSelect
              options={(colors || []).map((c) => ({
                value: c.name,
                label: c.label || c.name,
              }))}
              value={form.preferred_color}
              onValueChange={(v) => set('preferred_color', v || '')}
              onSearchChange={setColorSearch}
              placeholder="Color…"
              isLoading={colorsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Quotation validity
            </label>
            <Input
              type="date"
              value={form.quotation_validity}
              onChange={(e) => set('quotation_validity', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Next action</label>
            <Input value={form.next_action} onChange={(e) => set('next_action', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Next action due
            </label>
            <Input
              type="datetime-local"
              value={form.next_action_due}
              onChange={(e) => set('next_action_due', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Items</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                items: [...prev.items, { item_code: '', qty: 1, rate: 0, discount_percentage: 0 }],
              }))
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add item
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add items to enable Create Quotation (standard ERPNext Quotation lines).
            </p>
          ) : (
            form.items.map((row, index) => (
              <div
                key={`${row.item_code}-${index}`}
                className="grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-12"
              >
                <div className="sm:col-span-5">
                  <SearchableSelect
                    options={(items || []).map((it) => ({
                      value: it.name,
                      label: it.label || it.item_name || it.name,
                    }))}
                    value={row.item_code}
                    onValueChange={(v) => {
                      const selected = (items || []).find((it) => it.name === v);
                      updateItem(index, {
                        item_code: v || '',
                        item_name: selected?.item_name || '',
                        uom: selected?.uom || '',
                        rate: Number(selected?.rate || row.rate || 0),
                      });
                    }}
                    onSearchChange={setItemSearch}
                    placeholder="Search item…"
                    isLoading={itemsLoading}
                    valueLabel={row.item_name || row.item_code}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="number"
                    value={row.qty}
                    onChange={(e) => updateItem(index, { qty: Number(e.target.value || 0) })}
                    placeholder="Qty"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="number"
                    value={row.rate}
                    onChange={(e) => updateItem(index, { rate: Number(e.target.value || 0) })}
                    placeholder="Rate"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    type="number"
                    value={row.discount_percentage || 0}
                    onChange={(e) =>
                      updateItem(index, {
                        discount_percentage: Number(e.target.value || 0),
                      })
                    }
                    placeholder="Disc %"
                  />
                </div>
                <div className="flex items-center justify-end sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        items: prev.items.filter((_, i) => i !== index),
                      }))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>


      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-opportunities')} disabled={busy}>
          Back
        </Button>
        <Button variant="outline" onClick={onSave} disabled={busy}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save
        </Button>
        {nextAction ? (
          <Button
            onClick={() => {
              if (nextAction.action === 'open-test-drive') {
                navigate('crm-test-drive-detail', { id: linked.testDrive });
              } else if (nextAction.action === 'open-quotation') {
                openDeskDoc('Quotation', linked.quotation);
              } else if (nextAction.action === 'allocate') {
                // Allocation panel is already visible when booking exists.
              } else if (nextAction.action === 'delivery-readiness') {
                void onStartDeliveryReadiness();
              } else if (nextAction.action === 'open-delivery-readiness') {
                navigate('crm-delivery-readiness-detail', { id: linked.deliveryReadiness });
              } else if (['appointment', 'test-drive', 'quotation', 'booking', 'invoice'].includes(nextAction.action)) {
                setPipelinePanel(nextAction.action as typeof pipelinePanel);
              } else {
                void runPipelineAction(nextAction.action);
              }
            }}
            disabled={busy}
          >
            {pipelineBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {nextAction.label}
          </Button>
        ) : null}
      </FormActionsBar>
    </div>
  );
}
