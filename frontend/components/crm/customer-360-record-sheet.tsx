'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { useNavigation } from '@/contexts/navigation-context';
import { DetailSheet, DetailSection, DetailRow } from '@/components/detail-sheet';
import { JobCardDetailSheetContent } from '@/components/job-card/job-card-detail-sheet';
import { CollectPaymentDialog } from '@/components/invoices/collect-payment-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  getActivity,
  getAccount,
  getBooking,
  getCampaign,
  getCase,
  getDeliveryReadiness,
  getLead,
  getOpportunity,
  getReferral,
  getSalesAppointment,
  getTestDrive,
} from '@/services/crm';
import { getAppointment } from '@/services/appointments';
import { getDelivery } from '@/services/deliveries';
import { getFollowUp } from '@/services/followUps';
import { getInspection } from '@/services/inspections';
import { getJobCard } from '@/services/jobCards';
import { getServiceEstimate } from '@/services/serviceEstimates';
import { getSalesInvoiceDetail } from '@/services/invoices';
import { getVehicle } from '@/services/vehicles';
import type { DMSJobCard, SalesInvoiceDetail } from '@/types/dms';
import { CreditCard, ExternalLink } from 'lucide-react';

export type Customer360RecordKind =
  | 'opportunity'
  | 'lead'
  | 'delivery'
  | 'delivery_readiness'
  | 'job_card'
  | 'appointment'
  | 'estimate'
  | 'follow_up'
  | 'activity'
  | 'sales_appointment'
  | 'communication'
  | 'case'
  | 'campaign'
  | 'invoice'
  | 'payment'
  | 'vehicle'
  | 'account'
  | 'contact'
  | 'referral'
  | 'test_drive'
  | 'booking'
  | 'inspection'
  | 'service_due';

export type Customer360OpenRecord = {
  kind: Customer360RecordKind;
  name: string;
  row?: Record<string, unknown>;
};

type OpenFn = (record: Customer360OpenRecord) => void;

const OpenRecordContext = createContext<OpenFn>(() => {});

export function useCustomer360OpenRecord() {
  return useContext(OpenRecordContext);
}

export function Customer360RecordProvider({
  children,
  customerId,
}: {
  children: ReactNode;
  customerId: string;
}) {
  const [record, setRecord] = useState<Customer360OpenRecord | null>(null);
  const open = useMemo<OpenFn>(() => (next) => setRecord(next), []);
  return (
    <OpenRecordContext.Provider value={open}>
      {children}
      <Customer360RecordSheet
        record={record}
        customerId={customerId}
        onOpenChange={(openSheet) => {
          if (!openSheet) setRecord(null);
        }}
      />
    </OpenRecordContext.Provider>
  );
}

const FULL_PAGE: Partial<
  Record<Customer360RecordKind, { view: string; param?: string }>
> = {
  opportunity: { view: 'crm-opportunity-detail' },
  lead: { view: 'crm-lead-detail' },
  case: { view: 'crm-case-detail' },
  activity: { view: 'crm-activity-detail' },
  campaign: { view: 'crm-campaign-detail' },
  account: { view: 'crm-account-detail' },
  referral: { view: 'crm-referral-detail' },
  sales_appointment: { view: 'crm-sales-appointment-detail' },
  job_card: { view: 'job-card-detail' },
  appointment: { view: 'appointment-detail' },
  estimate: { view: 'estimate-detail' },
  delivery_readiness: { view: 'crm-delivery-readiness-detail' },
  vehicle: { view: 'crm-vehicle-detail' },
  test_drive: { view: 'crm-test-drive-detail' },
  inspection: { view: 'inspection-detail' },
};

const TITLES: Record<Customer360RecordKind, string> = {
  opportunity: 'Deal',
  lead: 'Lead',
  delivery: 'Delivery',
  delivery_readiness: 'Delivery readiness',
  sales_appointment: 'Sales appointment',
  job_card: 'Job card',
  appointment: 'Appointment',
  estimate: 'Estimate',
  follow_up: 'Follow-up',
  activity: 'Activity',
  communication: 'Communication',
  case: 'Case',
  campaign: 'Campaign',
  invoice: 'Sales invoice',
  payment: 'Payment',
  vehicle: 'Vehicle',
  account: 'Account',
  contact: 'Master',
  referral: 'Referral',
  test_drive: 'Test drive',
  booking: 'Booking',
  inspection: 'Inspection',
  service_due: 'Service due',
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function pickDoc(payload: unknown): Record<string, unknown> {
  const raw = asRecord(payload);
  for (const key of ['opportunity', 'lead', 'case', 'activity', 'campaign', 'account', 'doc']) {
    if (raw[key] && typeof raw[key] === 'object') return asRecord(raw[key]);
  }
  return raw;
}

function str(doc: Record<string, unknown>, key: string) {
  const value = doc[key];
  if (value == null || value === '') return '';
  return String(value);
}

function money(value: unknown) {
  if (value == null || value === '') return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return String(value);
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'BHD',
    maximumFractionDigits: 3,
  }).format(n);
}

function dateText(value: unknown) {
  if (!value) return '—';
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function fetchRecord(kind: Customer360RecordKind, name: string) {
  switch (kind) {
    case 'opportunity':
      return getOpportunity(name);
    case 'lead':
      return getLead(name);
    case 'case':
      return getCase(name);
    case 'activity':
      return getActivity(name);
    case 'campaign':
      return getCampaign(name);
    case 'account':
      return getAccount(name);
    case 'referral':
      return getReferral(name);
    case 'sales_appointment':
      return getSalesAppointment(name);
    case 'test_drive':
      return getTestDrive(name);
    case 'booking':
      return getBooking(name);
    case 'inspection':
      return getInspection(name);
    case 'job_card':
      return getJobCard(name);
    case 'appointment':
      return getAppointment(name);
    case 'estimate':
      return getServiceEstimate(name);
    case 'follow_up':
      return getFollowUp(name);
    case 'delivery':
      return getDelivery(name);
    case 'delivery_readiness':
      return getDeliveryReadiness(name);
    case 'invoice':
      return getSalesInvoiceDetail(name);
    case 'vehicle':
      return getVehicle(name);
    default:
      return null;
  }
}

function Rows({
  fields,
  doc,
}: {
  fields: Array<[string, string]>;
  doc: Record<string, unknown>;
}) {
  return (
    <>
      {fields.map(([label, key]) => {
        const value = doc[key];
        const display =
          key.includes('date') || key.includes('time') || key.endsWith('_on')
            ? dateText(value)
            : key.includes('amount') ||
                key.includes('value') ||
                key.includes('total') ||
                key === 'rate'
              ? money(value)
              : value == null || value === ''
                ? '—'
                : String(value);
        return <DetailRow key={key} label={label} value={display} />;
      })}
    </>
  );
}

function InvoiceSheetBody({
  invoice,
  onCollect,
}: {
  invoice: SalesInvoiceDetail;
  onCollect: () => void;
}) {
  const outstanding = Number(invoice.outstanding_amount || 0);
  const canCollect = Number(invoice.docstatus) === 1 && outstanding > 0.001;
  return (
    <>
      <DetailSection title="Invoice">
        <DetailRow label="Invoice" value={invoice.name} />
        <DetailRow label="Customer" value={invoice.customer_name || invoice.customer} />
        <DetailRow label="Status" value={invoice.status} />
        <DetailRow label="Posting date" value={dateText(invoice.posting_date)} />
        <DetailRow label="Due date" value={dateText(invoice.due_date)} />
      </DetailSection>
      <DetailSection title="Amounts">
        <DetailRow label="Net total" value={money(invoice.net_total)} />
        <DetailRow label="Tax" value={money(invoice.total_taxes_and_charges)} />
        <DetailRow label="Grand total" value={money(invoice.grand_total)} />
        <DetailRow label="Outstanding" value={money(invoice.outstanding_amount)} />
      </DetailSection>
      {invoice.items?.length ? (
        <DetailSection title="Items">
          <div className="space-y-2 text-sm">
            {invoice.items.map((line, idx) => (
              <div key={`${line.item_code || idx}`} className="flex justify-between gap-3">
                <span className="min-w-0 truncate">
                  {line.item_name || line.item_code || 'Item'}
                  <span className="text-muted-foreground"> × {line.qty}</span>
                </span>
                <span className="shrink-0 tabular-nums">{money(line.amount)}</span>
              </div>
            ))}
          </div>
        </DetailSection>
      ) : null}
      {canCollect ? (
        <Button className="mt-4 w-full" onClick={onCollect}>
          <CreditCard className="mr-2 h-4 w-4" />
          Collect payment
        </Button>
      ) : null}
    </>
  );
}

function GenericBody({
  kind,
  doc,
}: {
  kind: Customer360RecordKind;
  doc: Record<string, unknown>;
}) {
  const sections: Record<Customer360RecordKind, Array<[string, string]>> = {
    opportunity: [
      ['Deal', 'name'],
      ['Title', 'title'],
      ['Stage', 'stage'],
      ['Status', 'status'],
      ['Value', 'expected_value'],
      ['Probability', 'probability'],
      ['Close date', 'expected_close_date'],
      ['Owner', 'opportunity_owner'],
      ['Model', 'model'],
      ['Quotation', 'quotation'],
      ['Booking', 'booking'],
      ['Sales invoice', 'sales_invoice'],
      ['Lost reason', 'lost_reason'],
    ],
    lead: [
      ['Lead', 'name'],
      ['Name', 'lead_name'],
      ['Status', 'status'],
      ['Source', 'source'],
      ['Mobile', 'mobile_no'],
      ['Email', 'email'],
      ['Owner', 'lead_owner'],
      ['Next action', 'next_action'],
      ['Next action due', 'next_action_due'],
    ],
    case: [
      ['Case', 'name'],
      ['Subject', 'subject'],
      ['Status', 'status'],
      ['Priority', 'priority'],
      ['Category', 'category'],
      ['Owner', 'case_owner'],
      ['SLA status', 'sla_status'],
    ],
    activity: [
      ['Activity', 'name'],
      ['Subject', 'subject'],
      ['Type', 'activity_type'],
      ['Status', 'status'],
      ['Due', 'due_datetime'],
      ['Assignee', 'assigned_to'],
      ['Disposition', 'disposition'],
    ],
    appointment: [
      ['Appointment', 'name'],
      ['Status', 'status'],
      ['When', 'appointment_date_time'],
      ['Vehicle', 'vehicle'],
      ['Advisor', 'assigned_service_advisor'],
      ['Notes', 'notes'],
    ],
    sales_appointment: [
      ['Appointment', 'name'],
      ['When', 'appointment_datetime'],
      ['Type', 'appointment_type'],
      ['Status', 'status'],
      ['Deal', 'opportunity'],
      ['Assigned', 'owner_name'],
      ['Agenda', 'agenda'],
    ],
    estimate: [
      ['Estimate', 'name'],
      ['Status', 'status'],
      ['Total', 'grand_total'],
      ['Decision', 'customer_decision'],
      ['VIN', 'vehicle_vin'],
    ],
    follow_up: [
      ['Follow-up', 'name'],
      ['Due', 'follow_up_due_date'],
      ['Method', 'contact_method'],
      ['Status', 'contact_status'],
      ['Assignee', 'assigned_to'],
      ['NPS', 'nps_score'],
    ],
    delivery: [
      ['Delivery', 'name'],
      ['Status', 'status'],
      ['VIN', 'vehicle_vin'],
      ['Model', 'vehicle_model'],
      ['Date', 'delivery_date_time'],
      ['CSAT', 'customer_satisfaction_score'],
    ],
    delivery_readiness: [
      ['Readiness', 'name'],
      ['Status', 'status'],
      ['VIN', 'vehicle_vin'],
    ],
    campaign: [
      ['Campaign', 'name'],
      ['Name', 'campaign_name'],
      ['Type', 'campaign_type'],
      ['Status', 'status'],
    ],
    account: [
      ['Account', 'name'],
      ['Name', 'account_name'],
      ['Type', 'account_type'],
      ['Territory', 'territory'],
    ],
    vehicle: [
      ['VIN', 'vin_number'],
      ['Plate', 'plate_number'],
      ['Brand', 'brand'],
      ['Model', 'model_name'],
      ['Year', 'model_year'],
      ['Odometer', 'current_odometer'],
      ['Warranty', 'warranty_status'],
    ],
    test_drive: [
      ['Test drive', 'name'],
      ['When', 'scheduled_datetime'],
      ['Status', 'status'],
      ['Customer', 'customer'],
      ['VIN', 'vehicle_vin'],
    ],
    booking: [
      ['Booking', 'name'],
      ['Status', 'status'],
      ['Date', 'booking_date'],
      ['VIN', 'vehicle_vin'],
      ['Deposit', 'deposit_amount'],
    ],
    inspection: [
      ['Inspection', 'name'],
      ['Date', 'inspection_date'],
      ['Status', 'status'],
      ['VIN', 'vin_chassis'],
    ],
    service_due: [
      ['Due', 'name'],
      ['Class', 'classification'],
      ['Status', 'status'],
      ['Due date', 'due_date'],
      ['Due km', 'due_km'],
    ],
    referral: [
      ['Referral', 'name'],
      ['Referred', 'referred_customer'],
      ['Status', 'status'],
      ['Points', 'reward_points'],
    ],
    contact: [
      ['Name', 'full_name'],
      ['Company', 'company_name'],
      ['Mobile', 'mobile_no'],
      ['Email', 'email_id'],
      ['Status', 'status'],
    ],
    communication: [
      ['Subject', 'subject'],
      ['Channel', 'communication_medium'],
      ['Direction', 'sent_or_received'],
      ['When', 'creation'],
      ['Status', 'status'],
    ],
    payment: [
      ['Payment', 'name'],
      ['Date', 'posting_date'],
      ['Type', 'payment_type'],
      ['Mode', 'mode_of_payment'],
      ['Amount', 'received_amount'],
    ],
    invoice: [],
    job_card: [],
  };
  const fields = sections[kind] || [
    ['Name', 'name'],
    ['Status', 'status'],
  ];
  return (
    <DetailSection title={TITLES[kind]}>
      <Rows fields={fields} doc={doc} />
    </DetailSection>
  );
}

function Customer360RecordSheet({
  record,
  customerId,
  onOpenChange,
}: {
  record: Customer360OpenRecord | null;
  customerId: string;
  onOpenChange: (open: boolean) => void;
}) {
  const { navigate } = useNavigation();
  const [payOpen, setPayOpen] = useState(false);
  const kind = record?.kind;
  const name = record?.name || '';
  const canFetch = Boolean(
    kind &&
      name &&
      ![
        'contact',
        'communication',
        'payment',
        'service_due',
      ].includes(kind)
  );

  const { data, isLoading, mutate } = useSWR(
    canFetch ? ['crm-360-record', kind, name] : null,
    () => fetchRecord(kind!, name)
  );

  const doc = useMemo(() => {
    if (data) return pickDoc(data);
    return record?.row || {};
  }, [data, record]);

  const title = kind ? TITLES[kind] : 'Record';
  const subtitle = str(doc, 'title') || str(doc, 'subject') || str(doc, 'customer_name') || name;
  const badgeLabel = str(doc, 'status') || str(doc, 'stage');
  const full = kind ? FULL_PAGE[kind] : undefined;
  const isJobCard = kind === 'job_card' && data;
  const isInvoice = kind === 'invoice';

  return (
    <>
      <DetailSheet
        open={Boolean(record)}
        onOpenChange={onOpenChange}
        title={str(doc, 'name') || name || title}
        subtitle={subtitle && subtitle !== name ? `${title} · ${subtitle}` : title}
        badge={badgeLabel ? { label: badgeLabel } : undefined}
        isLoading={Boolean(canFetch && isLoading)}
        contentScroll={isJobCard ? 'inner' : 'outer'}
        footer={
          full ? (
            <Button
              className="w-full"
              onClick={() => {
                onOpenChange(false);
                navigate(full.view, { [full.param || 'id']: name });
              }}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              Open full {title.toLowerCase()}
            </Button>
          ) : undefined
        }
      >
        {isJobCard ? (
          <JobCardDetailSheetContent
            key={name}
            jobCard={data as DMSJobCard}
            onOpenFullDetails={() => {
              onOpenChange(false);
              navigate('job-card-detail', { id: name });
            }}
          />
        ) : isInvoice && data ? (
          <InvoiceSheetBody
            invoice={data as SalesInvoiceDetail}
            onCollect={() => setPayOpen(true)}
          />
        ) : kind ? (
          <GenericBody kind={kind} doc={doc} />
        ) : null}
      </DetailSheet>
      {kind === 'invoice' && name ? (
        <CollectPaymentDialog
          open={payOpen}
          onOpenChange={setPayOpen}
          salesInvoice={name}
          onPaid={() => {
            void mutate();
            void globalMutate(['crm-customer-360', customerId]);
          }}
        />
      ) : null}
    </>
  );
}
