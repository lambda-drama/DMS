'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  createSalesAppointment,
  createSalesInvoiceFromOpportunity,
  createSalesOrderFromOpportunity,
  createTestDrive,
  createDeliveryReadiness,
  allocateVin,
  approveAllocationSwitch,
  getAllocationSnapshot,
  releaseVin,
  requestAllocationSwitch,
  searchAllocatableVins,
  recordExperienceScore,
  fetchCrmBranches,
  fetchOpportunityFormOptions,
  getOpportunity,
  listAccounts,
  listTenders,
  markOpportunityWon,
  reissueQuotation,
  updateOpportunity,
  updateQuotationTracking,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { CrmBrandLink } from '@/components/crm/crm-brand-link';
import { CrmColorLink } from '@/components/crm/crm-color-link';
import { CrmVehicleModelLink } from '@/components/crm/crm-vehicle-model-link';
import { CrmSparePartLink } from '@/components/crm/crm-spare-part-link';
import { CrmVinLink } from '@/components/crm/crm-vin-link';
import { Button } from '@/components/ui/button';
import { AddLineButton } from '@/components/ui/add-line-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { PipelinePath } from '@/components/crm/pipeline-path';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { CreateQuotationDialog } from '@/components/crm/create-quotation-dialog';
import { Loader2, Trash2 } from 'lucide-react';

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

type FleetReq = {
  model: string;
  specification: string;
  quantity: number;
  preferred_color: string;
  unit_price: string;
  body_building_notes: string;
  delivery_location: string;
  delivery_batch: string;
  delivery_date: string;
};

function emptyOppItem(): OppItem {
  return { item_code: '', qty: 1, rate: 0, discount_percentage: 0 };
}

function emptyFleetReq(): FleetReq {
  return {
    model: '',
    specification: '',
    quantity: 1,
    preferred_color: '',
    unit_price: '',
    body_building_notes: '',
    delivery_location: '',
    delivery_batch: '',
    delivery_date: '',
  };
}

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
  account: string;
  tender: string;
  framework_agreement: string;
  bid_deadline: string;
  financing_method: string;
  delivery_schedule_notes: string;
  aftersales_package_notes: string;
  special_conversion_notes: string;
  fleet_requirements: FleetReq[];
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
  account: '',
  tender: '',
  framework_agreement: '',
  bid_deadline: '',
  financing_method: '',
  delivery_schedule_notes: '',
  aftersales_package_notes: '',
  special_conversion_notes: '',
  fleet_requirements: [emptyFleetReq()],
  items: [emptyOppItem()],
};

function formFromDoc(doc: Record<string, unknown>): OppForm {
  const mappedItems = Array.isArray(doc.items)
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
  const items = mappedItems.length ? mappedItems : [emptyOppItem()];
  const mappedFleet = Array.isArray(doc.fleet_requirements)
    ? (doc.fleet_requirements as Record<string, unknown>[]).map((row) => ({
        model: String(row.model || ''),
        specification: String(row.specification || ''),
        quantity: Number(row.quantity || 1),
        preferred_color: String(row.preferred_color || ''),
        unit_price: row.unit_price != null ? String(row.unit_price) : '',
        body_building_notes: String(row.body_building_notes || ''),
        delivery_location: String(row.delivery_location || ''),
        delivery_batch: String(row.delivery_batch || ''),
        delivery_date: String(row.delivery_date || ''),
      }))
    : [];
  const fleet_requirements = mappedFleet.length ? mappedFleet : [emptyFleetReq()];
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
    account: String(doc.account || ''),
    tender: String(doc.tender || ''),
    framework_agreement: String(doc.framework_agreement || ''),
    bid_deadline: String(doc.bid_deadline || '').slice(0, 16),
    financing_method: String(doc.financing_method || ''),
    delivery_schedule_notes: String(doc.delivery_schedule_notes || ''),
    aftersales_package_notes: String(doc.aftersales_package_notes || ''),
    special_conversion_notes: String(doc.special_conversion_notes || ''),
    fleet_requirements,
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
  const [accountSearch, setAccountSearch] = useState('');
  const [tenderSearch, setTenderSearch] = useState('');
  const isFleetDeal =
    form.opportunity_type === 'Fleet' || form.opportunity_type === 'Tender';
  const { data: accountPick } = useSWR(
    isFleetDeal ? ['crm-opp-accounts', accountSearch] : null,
    () => listAccounts({ search: accountSearch || undefined, limit: 30 })
  );
  const { data: tenderPick } = useSWR(
    isFleetDeal ? ['crm-opp-tenders', tenderSearch] : null,
    () => listTenders({ search: tenderSearch || undefined, limit: 30 })
  );
  const [pipelinePanel, setPipelinePanel] = useState<
    '' | 'appointment' | 'test-drive' | 'booking' | 'invoice'
  >('');
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
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
  const [switchReason, setSwitchReason] = useState('');
  const [switchVin, setSwitchVin] = useState('');
  const [experienceScore, setExperienceScore] = useState('');
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();

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

  const { data: branches } = useSWR(
    ['crm-opp-detail-branches', form.company],
    () => fetchCrmBranches(form.company || undefined),
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

  const bookingId = String((data as Record<string, unknown> | undefined)?.booking || '');
  const { data: allocationSnapshot, mutate: mutateAllocation } = useSWR(
    bookingId ? ['crm-allocation-snapshot', bookingId] : null,
    () => getAllocationSnapshot(bookingId)
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
    account: form.account || null,
    tender: form.tender || null,
    framework_agreement: form.framework_agreement || null,
    bid_deadline: form.bid_deadline || null,
    financing_method: form.financing_method || null,
    delivery_schedule_notes: form.delivery_schedule_notes || null,
    aftersales_package_notes: form.aftersales_package_notes || null,
    special_conversion_notes: form.special_conversion_notes || null,
    fleet_requirements: form.fleet_requirements
      .filter((r) => r.model || r.specification)
      .map((r) => ({
        model: r.model || null,
        specification: r.specification || null,
        quantity: r.quantity || 1,
        preferred_color: r.preferred_color || null,
        unit_price: r.unit_price ? Number(r.unit_price) : 0,
        body_building_notes: r.body_building_notes || null,
        delivery_location: r.delivery_location || null,
        delivery_batch: r.delivery_batch || null,
        delivery_date: r.delivery_date || null,
      })),
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
      if (linked.appointment) {
        document
          .getElementById('deal-sales-appointment')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else setPipelinePanel('appointment');
    } else if (stage === 'Test Drive') {
      if (linked.testDrive) navigate('crm-test-drive-detail', { id: linked.testDrive });
      else setPipelinePanel('test-drive');
    } else if (stage === 'Quotation Submitted') {
      if (linked.quotation) navigate('crm-quotation-detail', { id: linked.quotation });
      else setQuotationDialogOpen(true);
    } else if (stage === 'Negotiation') {
      if (!linked.quotation) setQuotationDialogOpen(true);
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
    action: '' | 'appointment' | 'test-drive' | 'negotiation' | 'booking' | 'invoice' | 'won'
  ) => {
    if (!action) return;
    clear();
    setPipelineBusy(true);
    try {
      if (action === 'appointment') {
        const result = await createSalesAppointment(id, {
          ...appointmentForm,
          duration_minutes: Number(appointmentForm.duration_minutes || 60),
        });
        await mutate();
        setPipelinePanel('');
        showSuccess('Sales appointment scheduled on this deal.');
        return;
      } else if (action === 'test-drive') {
        const result = await createTestDrive({ opportunity: id, ...testDriveForm });
        const testDrive = String((result as Record<string, unknown>)?.name || '');
        await mutate();
        setPipelinePanel('');
        if (testDrive) navigate('crm-test-drive-detail', { id: testDrive });
        return;
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
      await Promise.all([mutate(), mutateAllocation()]);
      showSuccess('VIN allocated to this booking.');
    } catch (e: unknown) {
      showError(e, 'Failed to allocate VIN');
    } finally {
      setAllocating(false);
    }
  };

  const onRequestSwitch = async () => {
    if (!linked.booking || !switchReason.trim()) {
      showError('Enter a reason for the allocation switch.');
      return;
    }
    setAllocating(true);
    clear();
    try {
      await requestAllocationSwitch(linked.booking, switchReason.trim(), switchVin || undefined);
      setSwitchReason('');
      await Promise.all([mutate(), mutateAllocation()]);
      showSuccess('Allocation switch requested — awaiting manager approval.');
    } catch (e: unknown) {
      showError(e, 'Failed to request allocation switch');
    } finally {
      setAllocating(false);
    }
  };

  const onApproveSwitch = async (approve: boolean) => {
    if (!linked.booking) return;
    setAllocating(true);
    clear();
    try {
      await approveAllocationSwitch(
        linked.booking,
        approve,
        switchVin || undefined,
        switchReason || undefined
      );
      setSwitchVin('');
      setSwitchReason('');
      await Promise.all([mutate(), mutateAllocation()]);
      showSuccess(approve ? 'Allocation switch approved.' : 'Allocation switch rejected.');
    } catch (e: unknown) {
      showError(e, 'Failed to update allocation switch');
    } finally {
      setAllocating(false);
    }
  };

  const onReleaseVin = async () => {
    if (!linked.booking) return;
    const reason = window.prompt('Reason for releasing this VIN?')?.trim();
    if (!reason) return;
    setAllocating(true);
    clear();
    try {
      await releaseVin(linked.booking, reason);
      await Promise.all([mutate(), mutateAllocation()]);
      showSuccess('VIN released from booking.');
    } catch (e: unknown) {
      showError(e, 'Failed to release VIN');
    } finally {
      setAllocating(false);
    }
  };

  const onRecordExperience = async () => {
    const score = Number(experienceScore);
    if (!score || score < 1 || score > 5) {
      showError('Enter a satisfaction score from 1 to 5.');
      return;
    }
    clear();
    try {
      const result = (await recordExperienceScore(id, score)) as {
        referral_created?: boolean;
      };
      await mutate();
      showSuccess(
        result?.referral_created
          ? 'Experience recorded. Referral task created (score ≥ 4).'
          : 'Experience score recorded.'
      );
    } catch (e: unknown) {
      showError(e, 'Failed to record experience score');
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
            checked={testDriveStatus === 'Completed' ? ['Test Drive'] : []}
            terminal={form.stage === 'Lost' || form.status === 'Lost'}
            onSelect={onPipelineStageClick}
          />
          {form.stage === 'Lost' || form.status === 'Lost' ? (
            <span className="inline-flex rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
              Lost
            </span>
          ) : null}
          <p className="text-xs text-muted-foreground">
            Click a path step to create or review its record here. You stay on this deal — nothing
            jumps to another page.
          </p>
        </CardContent>
      </Card>

      {linked.appointment ? (
        <Card id="deal-sales-appointment" className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sales appointment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{linked.appointment}</span>
              {appointmentStatus ? (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                  {appointmentStatus}
                </span>
              ) : null}
            </div>
            <p className="text-muted-foreground">
              {(
                (doc.sales_appointment_details as Record<string, unknown> | undefined)
                  ?.appointment_datetime as string | undefined
              )
                ? new Date(
                    String(
                      (doc.sales_appointment_details as Record<string, unknown>).appointment_datetime
                    )
                  ).toLocaleString()
                : '—'}
              {' · '}
              {String(
                (doc.sales_appointment_details as Record<string, unknown> | undefined)
                  ?.appointment_type || 'Showroom Appointment'
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('crm-sales-appointment-detail', { id: linked.appointment })}
            >
              Open full appointment record
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {linked.quotation ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Official quotation tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Button
                variant="outline"
                onClick={() => navigate('crm-quotation-detail', { id: linked.quotation })}
              >
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

            {(() => {
              const snap = allocationSnapshot as Record<string, unknown> | undefined;
              const summary = (snap?.status_summary || {}) as Record<string, unknown>;
              const history = (snap?.history || []) as Record<string, unknown>[];
              const bookingDoc = (snap?.booking || {}) as Record<string, unknown>;
              if (!linked.allocatedVin && !Object.keys(summary).length) return null;
              return (
                <div className="grid gap-2 rounded-xl border border-border/70 p-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p>{String(summary.vehicle_location || '—')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Payment</p>
                    <p>{String(summary.payment_status || '—')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Documentation</p>
                    <p>{String(summary.documentation_status || '—')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">PDI</p>
                    <p>{String(summary.pdi_status || '—')}</p>
                  </div>
                  {history.length ? (
                    <div className="sm:col-span-2 lg:col-span-4">
                      <p className="mb-1 text-xs text-muted-foreground">Allocation history</p>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        {history.slice(-5).reverse().map((row, index) => (
                          <li key={`${row.action}-${index}`}>
                            {String(row.action_on || '')} · {String(row.action)} ·{' '}
                            {String(row.from_vin || '—')} → {String(row.to_vin || '—')}
                            {row.approved_by ? ` · approved by ${String(row.approved_by)}` : ''}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {bookingDoc.allocation_switch_requested ? (
                    <div className="sm:col-span-2 lg:col-span-4 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-amber-800">
                      Switch requested: {String(bookingDoc.allocation_switch_reason || '—')}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          disabled={allocating}
                          onClick={() => void onApproveSwitch(true)}
                        >
                          Approve switch
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={allocating}
                          onClick={() => void onApproveSwitch(false)}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })()}

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
            ) : (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    placeholder="Switch reason (required)"
                    value={switchReason}
                    onChange={(event) => setSwitchReason(event.target.value)}
                  />
                  <SearchableSelect
                    options={((allocatableVins as Record<string, unknown>[] | undefined) || []).map(
                      (vehicle) => ({
                        value: String(vehicle.name),
                        label: String(vehicle.vin_number || vehicle.name),
                        description: [vehicle.linked_item, vehicle.location]
                          .filter(Boolean)
                          .join(' · '),
                      })
                    )}
                    value={switchVin}
                    onValueChange={(value) => setSwitchVin(value || '')}
                    onSearchChange={setAllocateSearch}
                    isLoading={allocatableLoading}
                    placeholder="New VIN (optional until approve)…"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    disabled={allocating}
                    onClick={() => void onRequestSwitch()}
                  >
                    Request switch
                  </Button>
                  <Button
                    variant="outline"
                    disabled={allocating}
                    onClick={() => void onReleaseVin()}
                  >
                    Release VIN
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {form.stage === 'Won' || form.status === 'Won' ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Ownership journey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Welcome call, experience check, first-service, retention and anniversary tasks are
              created automatically. Record the 7-day experience score to unlock a referral request
              (only when score ≥ 4).
            </p>
            <div className="flex flex-wrap items-end gap-2">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Experience score (1–5)</label>
                <Input
                  type="number"
                  min={1}
                  max={5}
                  className="w-28"
                  value={experienceScore}
                  onChange={(event) => setExperienceScore(event.target.value)}
                />
              </div>
              <Button onClick={() => void onRecordExperience()}>Record experience</Button>
              <Button variant="outline" onClick={() => navigate('crm-activities')}>
                Open activities
              </Button>
            </div>
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
                  <CrmVinLink
                    value={testDriveForm.vehicle_vin}
                    onValueChange={(value) =>
                      setTestDriveForm((prev) => ({ ...prev, vehicle_vin: value || '' }))
                    }
                    customer={form.customer || undefined}
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
                  {pipelinePanel === 'booking'
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
            <CrmBrandLink
              value={form.brand}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  brand: v,
                  model: v && prev.brand && v !== prev.brand ? '' : prev.model,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Model</label>
            <CrmVehicleModelLink
              value={form.model}
              brand={form.brand || undefined}
              onValueChange={(v, meta) =>
                setForm((prev) => ({
                  ...prev,
                  model: v || '',
                  brand: prev.brand || meta?.brand || '',
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Color</label>
            <CrmColorLink
              value={form.preferred_color}
              onValueChange={(v) => set('preferred_color', v)}
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
        <CardHeader>
          <CardTitle className="text-base">Spare parts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Add accessories or spare parts only. The vehicle line is taken from the completed test
            drive when you create the quotation.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {form.items.map((row, index) => (
            <div
              key={`${row.item_code}-${index}`}
              className="grid gap-2 rounded-md border border-border/60 p-3 sm:grid-cols-12"
            >
              <div className="sm:col-span-5">
                <CrmSparePartLink
                  value={row.item_code}
                  valueLabel={row.item_name || row.item_code}
                  onValueChange={(v, meta) =>
                    updateItem(index, {
                      item_code: v || '',
                      item_name: meta?.item_name || '',
                      uom: meta?.uom || '',
                      rate: Number(meta?.rate ?? row.rate ?? 0),
                    })
                  }
                  placeholder="Search spare part…"
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
                    setForm((prev) => {
                      const next = prev.items.filter((_, i) => i !== index);
                      return {
                        ...prev,
                        items: next.length ? next : [emptyOppItem()],
                      };
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <AddLineButton
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                items: [...prev.items, emptyOppItem()],
              }))
            }
            label="Add spare part"
          />
        </CardContent>
      </Card>

      {isFleetDeal ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Fleet / Tender</CardTitle>
            {form.account ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('crm-account-detail', { id: form.account })}
              >
                Open account
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Account
                </label>
                <SearchableSelect
                  options={((accountPick?.data as Record<string, unknown>[]) || []).map(
                    (a) => ({
                      value: String(a.name),
                      label: String(a.account_name || a.name),
                      description: String(a.customer_name || a.customer || ''),
                    })
                  )}
                  value={form.account}
                  onValueChange={(v) => set('account', v || '')}
                  onSearchChange={setAccountSearch}
                  placeholder="Corporate account…"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Tender
                </label>
                <SearchableSelect
                  options={((tenderPick?.data as Record<string, unknown>[]) || []).map(
                    (t) => ({
                      value: String(t.name),
                      label: String(t.title || t.name),
                      description: String(t.customer_name || t.status || ''),
                    })
                  )}
                  value={form.tender}
                  onValueChange={(v) => set('tender', v || '')}
                  onSearchChange={setTenderSearch}
                  placeholder="Linked tender…"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Framework agreement
                </label>
                <Input
                  value={form.framework_agreement}
                  onChange={(e) => set('framework_agreement', e.target.value)}
                  placeholder="CRM-FA-…"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Bid deadline
                </label>
                <Input
                  type="datetime-local"
                  value={form.bid_deadline}
                  onChange={(e) => set('bid_deadline', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Financing / LC
                </label>
                <SearchableSelect
                  options={[
                    'Cash',
                    'Bank Finance',
                    'Lease',
                    'LC',
                    'Company Purchase',
                    'Other',
                  ].map((v) => ({ value: v, label: v }))}
                  value={form.financing_method}
                  onValueChange={(v) => set('financing_method', v || '')}
                  placeholder="Financing…"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Delivery schedule (batch / location)
                </label>
                <Textarea
                  rows={2}
                  value={form.delivery_schedule_notes}
                  onChange={(e) => set('delivery_schedule_notes', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Aftersales package
                </label>
                <Textarea
                  rows={2}
                  value={form.aftersales_package_notes}
                  onChange={(e) => set('aftersales_package_notes', e.target.value)}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="block text-xs font-medium text-muted-foreground">
                  Body-building / conversion
                </label>
                <Textarea
                  rows={2}
                  value={form.special_conversion_notes}
                  onChange={(e) => set('special_conversion_notes', e.target.value)}
                />
              </div>
            </div>

            <p className="text-sm font-medium">Fleet requirements</p>
            {form.fleet_requirements.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-6"
              >
                <div className="sm:col-span-2">
                  <CrmVehicleModelLink
                    value={row.model}
                    onValueChange={(v) =>
                      setForm((prev) => {
                        const next = [...prev.fleet_requirements];
                        next[idx] = { ...next[idx], model: v || '' };
                        return { ...prev, fleet_requirements: next };
                      })
                    }
                    placeholder="Model…"
                  />
                </div>
                <Input
                  className="sm:col-span-2"
                  placeholder="Specification"
                  value={row.specification}
                  onChange={(e) =>
                    setForm((prev) => {
                      const next = [...prev.fleet_requirements];
                      next[idx] = { ...next[idx], specification: e.target.value };
                      return { ...prev, fleet_requirements: next };
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) =>
                    setForm((prev) => {
                      const next = [...prev.fleet_requirements];
                      next[idx] = {
                        ...next[idx],
                        quantity: Number(e.target.value || 1),
                      };
                      return { ...prev, fleet_requirements: next };
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setForm((prev) => {
                      const next = prev.fleet_requirements.filter((_, i) => i !== idx);
                      return {
                        ...prev,
                        fleet_requirements: next.length ? next : [emptyFleetReq()],
                      };
                    })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Delivery location"
                  value={row.delivery_location}
                  onChange={(e) =>
                    setForm((prev) => {
                      const next = [...prev.fleet_requirements];
                      next[idx] = {
                        ...next[idx],
                        delivery_location: e.target.value,
                      };
                      return { ...prev, fleet_requirements: next };
                    })
                  }
                />
                <Input
                  placeholder="Batch"
                  value={row.delivery_batch}
                  onChange={(e) =>
                    setForm((prev) => {
                      const next = [...prev.fleet_requirements];
                      next[idx] = { ...next[idx], delivery_batch: e.target.value };
                      return { ...prev, fleet_requirements: next };
                    })
                  }
                />
                <Input
                  type="date"
                  value={row.delivery_date}
                  onChange={(e) =>
                    setForm((prev) => {
                      const next = [...prev.fleet_requirements];
                      next[idx] = { ...next[idx], delivery_date: e.target.value };
                      return { ...prev, fleet_requirements: next };
                    })
                  }
                />
                <Input
                  className="sm:col-span-3"
                  placeholder="Body-building notes"
                  value={row.body_building_notes}
                  onChange={(e) =>
                    setForm((prev) => {
                      const next = [...prev.fleet_requirements];
                      next[idx] = {
                        ...next[idx],
                        body_building_notes: e.target.value,
                      };
                      return { ...prev, fleet_requirements: next };
                    })
                  }
                />
              </div>
            ))}
            <AddLineButton
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  fleet_requirements: [...prev.fleet_requirements, emptyFleetReq()],
                }))
              }
              label="Add line"
            />
          </CardContent>
        </Card>
      ) : null}

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
                navigate('crm-quotation-detail', { id: linked.quotation });
              } else if (nextAction.action === 'allocate') {
                // Allocation panel is already visible when booking exists.
              } else if (nextAction.action === 'delivery-readiness') {
                void onStartDeliveryReadiness();
              } else if (nextAction.action === 'open-delivery-readiness') {
                navigate('crm-delivery-readiness-detail', { id: linked.deliveryReadiness });
              } else if (nextAction.action === 'quotation') {
                setQuotationDialogOpen(true);
              } else if (['appointment', 'test-drive', 'booking', 'invoice'].includes(nextAction.action)) {
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

      <CreateQuotationDialog
        open={quotationDialogOpen}
        onOpenChange={setQuotationDialogOpen}
        opportunityId={id}
        dealPayload={payload()}
        onError={showError}
        onCreated={(quotation) => {
          void mutate().then(() => {
            showSuccess('Quotation created.');
            navigate('crm-quotation-detail', { id: quotation });
          });
        }}
      />
    </div>
  );
}
