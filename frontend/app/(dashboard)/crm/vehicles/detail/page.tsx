'use client';

import type { ReactNode } from 'react';
import useSWR from 'swr';
import { fetchVehicle360, type Vehicle360Data } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import {
  Customer360RecordProvider,
  useCustomer360OpenRecord,
  type Customer360RecordKind,
} from '@/components/crm/customer-360-record-sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Gauge,
  Handshake,
  Shield,
  UserRound,
  Wrench,
} from 'lucide-react';

function fmtMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'BHD',
    maximumFractionDigits: Number(n) >= 10_000 ? 0 : 3,
  }).format(Number(n));
}

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadge(status?: string) {
  if (!status) return null;
  return (
    <Badge variant="secondary" className="font-normal">
      {status}
    </Badge>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed py-10 text-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function DataTable({
  columns,
  rows,
  empty,
  onRowClick,
}: {
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[];
  rows: Record<string, unknown>[];
  empty: string;
  onRowClick?: (row: Record<string, unknown>) => void;
}) {
  if (!rows.length) return <EmptyState label={empty} />;
  return (
    <div className="dms-table-panel">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-xs text-muted-foreground">
            {columns.map((c) => (
              <th key={c.key} className="pb-2 font-medium">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr
              key={String(row.name || row.key || idx)}
              className={
                onRowClick
                  ? 'cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40'
                  : 'border-b border-border/60 last:border-0'
              }
              onClick={onRowClick ? () => onRowClick(row) : undefined}
            >
              {columns.map((c) => (
                <td key={c.key} className="py-3 align-top">
                  {c.render ? (
                    c.render(row)
                  ) : (
                    <span className="text-muted-foreground">
                      {row[c.key] != null && row[c.key] !== '' ? String(row[c.key]) : '—'}
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinkedTable({
  kind,
  nameKey = 'name',
  ...props
}: {
  kind: Customer360RecordKind;
  nameKey?: string;
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[];
  rows: Record<string, unknown>[];
  empty: string;
}) {
  const openRecord = useCustomer360OpenRecord();
  return (
    <DataTable
      {...props}
      onRowClick={(row) => {
        const name = String(row[nameKey] || row.name || '').trim();
        if (!name) return;
        openRecord({ kind, name, row });
      }}
    />
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-sm">
      <CardContent className="pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
        {hint ? <p className="mt-0.5 truncate text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  );
}

function OverviewTab({ data }: { data: Vehicle360Data }) {
  const { vehicle, owner, summary, job_cards, appointments, opportunities } = data;
  const recent = [
    ...job_cards.slice(0, 4).map((j) => ({
      key: `jc-${j.name}`,
      kind: 'job_card' as const,
      name: String(j.name),
      row: j,
      title: String(j.name),
      meta: `Job card · ${j.status || '—'}`,
      when: String(j.modified || j.creation || ''),
    })),
    ...appointments.slice(0, 4).map((a) => ({
      key: `apt-${a.name}`,
      kind: 'appointment' as const,
      name: String(a.name),
      row: a,
      title: String(a.name),
      meta: `Service appointment · ${a.status || '—'}`,
      when: String(a.appointment_date_time || a.modified || ''),
    })),
    ...opportunities.slice(0, 3).map((o) => ({
      key: `opp-${o.name}`,
      kind: 'opportunity' as const,
      name: String(o.name),
      row: o,
      title: String(o.title || o.name),
      meta: `Deal · ${o.stage || o.status || '—'}`,
      when: String(o.modified || ''),
    })),
  ]
    .sort((a, b) => String(b.when).localeCompare(String(a.when)))
    .slice(0, 8);
  const openRecord = useCustomer360OpenRecord();
  const { navigate } = useNavigation();
  const model = [vehicle.brand_label || vehicle.brand, vehicle.model_name || vehicle.model, vehicle.model_year]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Buyer" value={summary.buyer || 'Unassigned'} />
        <StatCard
          label="Odometer"
          value={summary.odometer != null ? String(summary.odometer) : '—'}
          hint={vehicle.odometer_unit || undefined}
        />
        <StatCard
          label="Warranty"
          value={summary.warranty_status || '—'}
          hint={vehicle.warranty_end_date ? `Until ${fmtDate(vehicle.warranty_end_date)}` : undefined}
        />
        <StatCard
          label="Next service"
          value={fmtDate(summary.next_service_due_date)}
          hint={summary.retention_status}
        />
        <StatCard label="Job cards" value={summary.job_cards} hint={`${summary.appointments} service appointments`} />
        <StatCard
          label="Open deals"
          value={summary.opportunities_open}
          hint={fmtMoney(summary.pipeline_value)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{model || '—'}</p>
            <p className="text-muted-foreground">Plate {vehicle.plate_number || '—'}</p>
            <p className="text-muted-foreground">Engine {vehicle.engine_number || '—'}</p>
            <p className="text-muted-foreground">
              {[vehicle.fuel_type, vehicle.transmission, vehicle.exterior_color].filter(Boolean).join(' · ') || '—'}
            </p>
            <p className="text-muted-foreground">Status {vehicle.vehicle_status || '—'}</p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Current buyer</CardTitle>
            {owner?.name ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('crm-customer-detail', { id: owner.name })}
              >
                Customer 360
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="font-medium">{owner?.customer_name || vehicle.customer_name || 'No buyer linked'}</p>
            <p className="text-muted-foreground">{owner?.mobile_no || vehicle.owner_mobile || '—'}</p>
            <p className="text-muted-foreground">{owner?.email_id || vehicle.owner_email || '—'}</p>
            <p className="text-muted-foreground">
              {[owner?.customer_group, owner?.territory].filter(Boolean).join(' · ') || '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent activity on this VIN</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState label="No sales or service history on this VIN yet." />
          ) : (
            <ul className="space-y-3">
              {recent.map((item) => (
                <li
                  key={item.key}
                  className="flex cursor-pointer items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0 hover:bg-muted/30"
                  onClick={() => openRecord({ kind: item.kind, name: item.name, row: item.row })}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.meta}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">{fmtDate(item.when)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BuyerTab({ data }: { data: Vehicle360Data }) {
  const { navigate } = useNavigation();
  const { owner, vehicle, ownership_history } = data;
  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Current buyer</CardTitle>
          {owner?.name ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('crm-customer-detail', { id: owner.name })}
            >
              Open Customer 360
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['Customer', owner?.customer_name || vehicle.customer_name],
              ['Customer ID', owner?.name || vehicle.current_customer],
              ['Mobile', owner?.mobile_no || vehicle.owner_mobile],
              ['Email', owner?.email_id || vehicle.owner_email],
              ['Tax ID', owner?.tax_id],
              ['Group', owner?.customer_group],
              ['Territory', owner?.territory],
              ['Type', owner?.customer_type],
              ['Delivery date', fmtDate(String(vehicle.delivery_date || ''))],
              ['Driver', vehicle.assigned_driver],
            ].map(([label, value]) => (
              <div key={String(label)}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-medium">{value ? String(value) : '—'}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ownership history ({ownership_history.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No previous owners recorded on this VIN."
            rows={ownership_history}
            onRowClick={(row) => {
              const id = String(row.customer || '').trim();
              if (id) navigate('crm-customer-detail', { id });
            }}
            columns={[
              {
                key: 'customer_name',
                label: 'Buyer',
                render: (r) => (
                  <div>
                    <p className="font-medium">{String(r.customer_name || r.customer || '—')}</p>
                    <p className="text-xs text-muted-foreground">{String(r.relationship || '')}</p>
                  </div>
                ),
              },
              {
                key: 'ownership_status',
                label: 'Status',
                render: (r) => statusBadge(String(r.ownership_status || '')),
              },
              { key: 'mobile_no', label: 'Mobile' },
              {
                key: 'from_date',
                label: 'From',
                render: (r) => fmtDate(String(r.from_date || '')),
              },
              {
                key: 'to_date',
                label: 'To',
                render: (r) => fmtDate(String(r.to_date || '')),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SalesTab({ data }: { data: Vehicle360Data }) {
  const {
    opportunities,
    sales_appointments,
    test_drives,
    bookings,
    deliveries,
    delivery_readiness,
  } = data;
  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Deals ({opportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="opportunity"
            empty="No deals allocated to this VIN."
            rows={opportunities}
            columns={[
              {
                key: 'title',
                label: 'Deal',
                render: (o) => <p className="font-medium">{String(o.title || o.name)}</p>,
              },
              {
                key: 'stage',
                label: 'Stage',
                render: (o) => statusBadge(String(o.stage || o.status || '')),
              },
              {
                key: 'value',
                label: 'Value',
                render: (o) => (o.expected_value != null ? fmtMoney(Number(o.expected_value)) : '—'),
              },
              { key: 'opportunity_owner', label: 'Owner' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Sales appointments ({sales_appointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="sales_appointment"
            empty="No sales appointments linked through a deal on this VIN."
            rows={sales_appointments}
            columns={[
              {
                key: 'appointment_datetime',
                label: 'When',
                render: (a) => fmtDateTime(String(a.appointment_datetime || '')),
              },
              { key: 'appointment_type', label: 'Type' },
              {
                key: 'status',
                label: 'Status',
                render: (a) => statusBadge(String(a.status || '')),
              },
              { key: 'opportunity', label: 'Deal' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Test drives ({test_drives.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="test_drive"
            empty="No test drives on this VIN."
            rows={test_drives}
            columns={[
              { key: 'name', label: 'Test drive' },
              {
                key: 'scheduled_datetime',
                label: 'When',
                render: (r) => fmtDateTime(String(r.scheduled_datetime || '')),
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => statusBadge(String(r.status || '')),
              },
              { key: 'customer', label: 'Customer' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Bookings ({bookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="booking"
            empty="No bookings on this VIN."
            rows={bookings}
            columns={[
              { key: 'name', label: 'Booking' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => statusBadge(String(r.status || '')),
              },
              {
                key: 'booking_date',
                label: 'Date',
                render: (r) => fmtDate(String(r.booking_date || '')),
              },
              {
                key: 'deposit_amount',
                label: 'Deposit',
                render: (r) => (r.deposit_amount != null ? fmtMoney(Number(r.deposit_amount)) : '—'),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Deliveries ({deliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="delivery"
            empty="No vehicle deliveries for this VIN."
            rows={deliveries}
            columns={[
              { key: 'name', label: 'Delivery' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => statusBadge(String(r.status || '')),
              },
              {
                key: 'delivery_date_time',
                label: 'When',
                render: (r) => fmtDateTime(String(r.delivery_date_time || '')),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Delivery readiness ({delivery_readiness.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="delivery_readiness"
            empty="No delivery readiness records."
            rows={delivery_readiness}
            columns={[
              { key: 'name', label: 'Record' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => statusBadge(String(r.status || '')),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AftersalesTab({ data }: { data: Vehicle360Data }) {
  const {
    summary,
    appointments,
    job_cards,
    estimates,
    follow_ups,
    inspections,
    service_dues,
    finance,
  } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Retention" value={summary.retention_status || '—'} />
        <StatCard label="Next service due" value={fmtDate(summary.next_service_due_date)} />
        <StatCard
          label="Aftersales billed"
          value={fmtMoney(summary.aftersales_revenue)}
          hint={`${finance.overdue_count || 0} overdue invoices`}
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service appointments ({appointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="appointment"
            empty="No workshop appointments on this VIN."
            rows={appointments}
            columns={[
              { key: 'name', label: 'Appointment' },
              {
                key: 'appointment_date_time',
                label: 'When',
                render: (a) => fmtDateTime(String(a.appointment_date_time || '')),
              },
              {
                key: 'status',
                label: 'Status',
                render: (a) => statusBadge(String(a.status || '')),
              },
              {
                key: 'assigned_service_advisor',
                label: 'Advisor',
                render: (a) =>
                  String(a.assigned_service_advisor_name || a.assigned_service_advisor || '—'),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Job cards ({job_cards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="job_card"
            empty="No job cards on this VIN."
            rows={job_cards}
            columns={[
              {
                key: 'name',
                label: 'Job card',
                render: (j) => <p className="font-medium">{String(j.name)}</p>,
              },
              {
                key: 'status',
                label: 'Status',
                render: (j) => statusBadge(String(j.status || '')),
              },
              {
                key: 'total_amount',
                label: 'Amount',
                render: (j) => (j.total_amount != null ? fmtMoney(Number(j.total_amount)) : '—'),
              },
              {
                key: 'service_advisor',
                label: 'Advisor',
                render: (j) => String(j.service_advisor_name || j.service_advisor || '—'),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Inspections ({inspections.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="inspection"
            empty="No inspections on this VIN."
            rows={inspections}
            columns={[
              { key: 'name', label: 'Inspection' },
              {
                key: 'inspection_date',
                label: 'Date',
                render: (r) => fmtDate(String(r.inspection_date || '')),
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => statusBadge(String(r.status || '')),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Service due ({service_dues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="service_due"
            empty="No service-due records."
            rows={service_dues}
            columns={[
              { key: 'name', label: 'Due' },
              {
                key: 'classification',
                label: 'Class',
                render: (r) => statusBadge(String(r.classification || r.status || '')),
              },
              {
                key: 'due_date',
                label: 'Due date',
                render: (r) => fmtDate(String(r.due_date || '')),
              },
              { key: 'due_km', label: 'Due km' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Estimates ({estimates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="estimate"
            empty="No service estimates."
            rows={estimates}
            columns={[
              { key: 'name', label: 'Estimate' },
              {
                key: 'status',
                label: 'Status',
                render: (r) => statusBadge(String(r.status || '')),
              },
              {
                key: 'grand_total',
                label: 'Total',
                render: (r) => (r.grand_total != null ? fmtMoney(Number(r.grand_total)) : '—'),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Follow-ups ({follow_ups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="follow_up"
            empty="No aftersales follow-ups."
            rows={follow_ups}
            columns={[
              { key: 'name', label: 'Follow-up' },
              {
                key: 'follow_up_due_date',
                label: 'Due',
                render: (r) => fmtDate(String(r.follow_up_due_date || '')),
              },
              { key: 'contact_method', label: 'Method' },
              {
                key: 'contact_status',
                label: 'Status',
                render: (r) => statusBadge(String(r.contact_status || '')),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Invoices ({finance.invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="invoice"
            empty="No job-card invoices on this VIN."
            rows={finance.invoices}
            columns={[
              { key: 'name', label: 'Invoice' },
              {
                key: 'posting_date',
                label: 'Date',
                render: (r) => fmtDate(String(r.posting_date || '')),
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => statusBadge(String(r.status || '')),
              },
              {
                key: 'grand_total',
                label: 'Total',
                render: (r) => (r.grand_total != null ? fmtMoney(Number(r.grand_total)) : '—'),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CasesTab({ data }: { data: Vehicle360Data }) {
  const { cases, activities } = data;
  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Cases ({cases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="case"
            empty="No cases on this VIN."
            rows={cases}
            columns={[
              {
                key: 'subject',
                label: 'Case',
                render: (c) => <p className="font-medium">{String(c.subject || c.name)}</p>,
              },
              {
                key: 'status',
                label: 'Status',
                render: (c) => statusBadge(String(c.status || '')),
              },
              { key: 'priority', label: 'Priority' },
              { key: 'case_owner', label: 'Owner' },
            ]}
          />
        </CardContent>
      </Card>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activities ({activities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <LinkedTable
            kind="activity"
            empty="No activities tagged to this VIN."
            rows={activities}
            columns={[
              {
                key: 'subject',
                label: 'Activity',
                render: (a) => <p className="font-medium">{String(a.subject || a.name)}</p>,
              },
              { key: 'activity_type', label: 'Type' },
              {
                key: 'status',
                label: 'Status',
                render: (a) => statusBadge(String(a.status || '')),
              },
              {
                key: 'due_datetime',
                label: 'Due',
                render: (a) => fmtDateTime(String(a.due_datetime || '')),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function CrmVehicleDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const vin = viewParams.get('id') || '';
  const { data, isLoading, error } = useSWR(vin ? ['crm-vehicle-360', vin] : null, () =>
    fetchVehicle360(vin)
  );

  if (!vin) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No VIN selected.</p>
        <Button variant="outline" onClick={() => navigate('crm-vehicles')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to vehicles
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-destructive">
          {(error as Error)?.message || 'Failed to load Vehicle 360.'}
        </p>
        <Button variant="outline" onClick={() => navigate('crm-vehicles')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to vehicles
        </Button>
      </div>
    );
  }

  const { vehicle, summary } = data;
  const title = [vehicle.brand_label || vehicle.brand, vehicle.model_name || vehicle.model]
    .filter(Boolean)
    .join(' ') || vehicle.vin_number || vehicle.name;

  return (
    <Customer360RecordProvider customerId={vin}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="-ml-2 h-8 px-2 text-muted-foreground"
              onClick={() => navigate('crm-vehicles')}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Vehicles
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <p className="font-mono text-sm text-muted-foreground">
                VIN {vehicle.vin_number || vehicle.name}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {vehicle.plate_number ? <Badge variant="outline">{vehicle.plate_number}</Badge> : null}
              {vehicle.vehicle_status ? <Badge variant="outline">{vehicle.vehicle_status}</Badge> : null}
              {vehicle.warranty_status ? (
                <Badge variant="secondary">{vehicle.warranty_status}</Badge>
              ) : null}
              {vehicle.is_fleet_vehicle ? <Badge variant="outline">Fleet</Badge> : null}
            </div>
          </div>
          <div className="flex flex-wrap justify-end gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
              <UserRound className="h-3.5 w-3.5" />
              {summary.buyer || 'No buyer'}
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
              <Gauge className="h-3.5 w-3.5" />
              {summary.odometer != null ? summary.odometer : '—'} km
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
              <Wrench className="h-3.5 w-3.5" />
              {summary.job_cards} job cards
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
              <Handshake className="h-3.5 w-3.5" />
              {summary.opportunities_open} open deals
            </span>
            <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
              <Shield className="h-3.5 w-3.5" />
              {summary.warranty_status || 'Warranty —'}
            </span>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="buyer">Buyer</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="aftersales">Service</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
          </TabsList>
          <TabsContent value="overview">
            <OverviewTab data={data} />
          </TabsContent>
          <TabsContent value="buyer">
            <BuyerTab data={data} />
          </TabsContent>
          <TabsContent value="sales">
            <SalesTab data={data} />
          </TabsContent>
          <TabsContent value="aftersales">
            <AftersalesTab data={data} />
          </TabsContent>
          <TabsContent value="cases">
            <CasesTab data={data} />
          </TabsContent>
        </Tabs>
      </div>
    </Customer360RecordProvider>
  );
}
