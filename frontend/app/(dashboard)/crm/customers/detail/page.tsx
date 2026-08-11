'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import {
  fetchCustomer360,
  findCustomerDuplicates,
  mergeCustomers,
  type Customer360Data,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { useCrmFeedback } from '@/components/crm/form-feedback';
import { EditCustomerDialog } from '@/components/customers/edit-customer-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Building2,
  Car,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Pencil,
  Target,
  UserRound,
  Wrench,
  AlertTriangle,
} from 'lucide-react';

function fmtMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  const value = Number(n);
  const abs = Math.abs(value);
  // Compact form keeps overview cards from overflowing large totals
  if (abs >= 1_000_000) {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: 'BHD',
      notation: 'compact',
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'BHD',
    maximumFractionDigits: abs >= 10_000 ? 0 : 3,
  }).format(value);
}

function fmtMoneyFull(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'BHD',
    maximumFractionDigits: 3,
  }).format(Number(n));
}

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
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
}: {
  columns: { key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }[];
  rows: Record<string, unknown>[];
  empty: string;
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
              className="border-b border-border/60 last:border-0"
            >
              {columns.map((c) => (
                <td key={c.key} className="py-3 align-top">
                  {c.render
                    ? c.render(row)
                    : (
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

function StatCard({
  label,
  value,
  hint,
  title,
}: {
  label: string;
  value: string | number;
  hint?: string;
  title?: string;
}) {
  const text = String(value);
  const long = text.length > 14;
  return (
    <Card className="min-w-0 overflow-hidden border-border/70 shadow-sm">
      <CardContent className="min-w-0 overflow-hidden pt-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={
            long
              ? 'mt-1 break-words text-base font-semibold leading-snug tracking-tight tabular-nums sm:text-lg'
              : 'mt-1 truncate text-2xl font-semibold tracking-tight tabular-nums'
          }
          title={title || text}
        >
          {value}
        </p>
        {hint ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={hint}>
            {hint}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function OverviewTab({ data }: { data: Customer360Data }) {
  const { customer, summary, activities, opportunities, cases, retention, loyalty } = data;
  const recent = [
    ...activities.slice(0, 5).map((a) => ({
      key: `act-${a.name}`,
      title: String(a.subject || a.name),
      meta: `${a.activity_type || 'Activity'} · ${a.status || '—'}`,
      when: String(a.due_datetime || a.modified || ''),
    })),
    ...opportunities.slice(0, 3).map((o) => ({
      key: `opp-${o.name}`,
      title: String(o.title || o.name),
      meta: `Deal · ${o.stage || o.status || '—'}`,
      when: String(o.modified || ''),
    })),
    ...cases.slice(0, 3).map((c) => ({
      key: `case-${c.name}`,
      title: String(c.subject || c.name),
      meta: `Case · ${c.status || '—'}`,
      when: String(c.modified || ''),
    })),
  ]
    .sort((a, b) => String(b.when).localeCompare(String(a.when)))
    .slice(0, 8);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Vehicles" value={summary.vehicles} />
        <StatCard
          label="Open pipeline"
          value={fmtMoney(summary.pipeline_value)}
          title={fmtMoneyFull(summary.pipeline_value)}
          hint={`${summary.opportunities_open} open deals`}
        />
        <StatCard
          label="Outstanding"
          value={fmtMoney(summary.outstanding)}
          title={fmtMoneyFull(summary.outstanding)}
          hint={`${summary.cases_open} open cases`}
        />
        <StatCard
          label="Lifetime value"
          value={fmtMoney(summary.lifetime_value)}
          title={fmtMoneyFull(summary.lifetime_value)}
          hint={loyalty.loyalty_tier}
        />
        <StatCard
          label="Retention"
          value={retention.status}
          hint={
            retention.next_service_due_date
              ? `Next service ${fmtDate(retention.next_service_due_date)}`
              : undefined
          }
        />
        <StatCard
          label="Open activities"
          value={summary.activities_open}
          hint={`${summary.job_cards || 0} job cards`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-4 w-4 shrink-0" />
              <span>
                {customer.customer_group || '—'} · {customer.customer_type || '—'}
                {customer.market_segment ? ` · ${String(customer.market_segment)}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span>{customer.territory || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 shrink-0" />
              <span>{customer.mobile_no || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 shrink-0" />
              <span>{customer.email_id || '—'}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Owner {customer.owner || '—'} · Language {String(customer.language || '—')}
            </p>
            {(customer.primary_address || customer.customer_primary_address) && (
              <p className="whitespace-pre-wrap text-muted-foreground">
                {String(customer.primary_address || customer.customer_primary_address)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recent.length === 0 ? (
              <EmptyState label="No recent CRM activity." />
            ) : (
              <ul className="space-y-3">
                {recent.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-start justify-between gap-3 border-b border-border/50 pb-3 last:border-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.meta}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {fmtDate(item.when)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IdentityTab({ data }: { data: Customer360Data }) {
  const { customer } = data;
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Identity & contact</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Customer ID', customer.name],
            ['Legal / display name', customer.customer_name],
            ['Type', customer.customer_type],
            ['Group', customer.customer_group],
            ['Segment', customer.market_segment],
            ['Territory', customer.territory],
            ['Mobile', customer.mobile_no],
            ['Email', customer.email_id],
            ['Tax ID', customer.tax_id],
            ['Website', customer.website],
            ['Language', customer.language],
            ['Industry', customer.industry],
            ['Created', fmtDate(customer.creation)],
            ['Last modified', fmtDate(customer.modified)],
            ['Owner', customer.owner],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="mt-0.5 font-medium">{value ? String(value) : '—'}</dd>
            </div>
          ))}
        </dl>
        {(customer.primary_address || customer.customer_primary_address) && (
          <div className="mt-4 border-t pt-4">
            <p className="text-xs text-muted-foreground">Address</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">
              {String(customer.primary_address || customer.customer_primary_address)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OrganizationsTab({ data }: { data: Customer360Data }) {
  const { organizations, contacts } = data;
  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Organizations ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No organization relationships."
            rows={organizations}
            columns={[
              {
                key: 'organization_name',
                label: 'Organization',
                render: (r) => (
                  <span className="font-medium">{String(r.organization_name || r.name)}</span>
                ),
              },
              { key: 'relationship', label: 'Relationship' },
              { key: 'contact', label: 'Contact' },
              { key: 'territory', label: 'Territory' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Contacts ({contacts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No linked contacts."
            rows={contacts}
            columns={[
              {
                key: 'full_name',
                label: 'Name',
                render: (c) => (
                  <div>
                    <p className="font-medium">{String(c.full_name || c.name)}</p>
                    <p className="text-xs text-muted-foreground">{String(c.org_role || '')}</p>
                  </div>
                ),
              },
              { key: 'company_name', label: 'Company' },
              { key: 'mobile_no', label: 'Mobile' },
              { key: 'email_id', label: 'Email' },
              {
                key: 'status',
                label: 'Status',
                render: (c) => statusBadge(String(c.status || '')),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function VehiclesTab({ data }: { data: Customer360Data }) {
  const { vehicles, vehicle_history } = data;
  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Current vehicles ({vehicles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No vehicles linked to this customer."
            rows={vehicles}
            columns={[
              {
                key: 'vin',
                label: 'VIN',
                render: (v) => (
                  <p className="font-medium">{String(v.vin_number || v.name)}</p>
                ),
              },
              { key: 'plate_number', label: 'Plate' },
              {
                key: 'vehicle',
                label: 'Vehicle',
                render: (v) =>
                  [v.brand, v.model_name || v.model, v.model_year].filter(Boolean).join(' · ') ||
                  '—',
              },
              {
                key: 'odometer',
                label: 'Odometer',
                render: (v) => (v.current_odometer != null ? String(v.current_odometer) : '—'),
              },
              {
                key: 'warranty',
                label: 'Warranty',
                render: (v) => (
                  <div className="space-y-1">
                    {statusBadge(String(v.warranty_status || ''))}
                    <p className="text-xs text-muted-foreground">
                      {fmtDate(String(v.warranty_end_date || ''))}
                    </p>
                  </div>
                ),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Ownership history ({vehicle_history.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No previous ownership records."
            rows={vehicle_history}
            columns={[
              {
                key: 'vin',
                label: 'VIN',
                render: (v) => (
                  <p className="font-medium">{String(v.vin_number || v.vin)}</p>
                ),
              },
              { key: 'relationship', label: 'Relationship' },
              {
                key: 'ownership_status',
                label: 'Status',
                render: (v) => statusBadge(String(v.ownership_status || '')),
              },
              {
                key: 'from_date',
                label: 'From',
                render: (v) => fmtDate(String(v.from_date || '')),
              },
              {
                key: 'to_date',
                label: 'To',
                render: (v) => fmtDate(String(v.to_date || '')),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function SalesTab({ data }: { data: Customer360Data }) {
  const { leads, opportunities, deliveries } = data;
  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Opportunities ({opportunities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No opportunities."
            rows={opportunities}
            columns={[
              {
                key: 'title',
                label: 'Deal',
                render: (o) => (
                  <div>
                    <p className="font-medium">{String(o.title || o.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {[o.brand, o.model].filter(Boolean).join(' · ') || String(o.name)}
                    </p>
                  </div>
                ),
              },
              {
                key: 'stage',
                label: 'Stage',
                render: (o) => statusBadge(String(o.stage || o.status || '')),
              },
              {
                key: 'value',
                label: 'Value',
                render: (o) =>
                  o.expected_value != null ? fmtMoney(Number(o.expected_value)) : '—',
              },
              {
                key: 'close',
                label: 'Close',
                render: (o) => fmtDate(String(o.expected_close_date || '')),
              },
              {
                key: 'lost_reason',
                label: 'Lost reason',
                render: (o) => String(o.lost_reason || '—'),
              },
              { key: 'opportunity_owner', label: 'Owner' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Leads ({leads.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No leads linked."
            rows={leads}
            columns={[
              {
                key: 'lead_name',
                label: 'Lead',
                render: (l) => (
                  <div>
                    <p className="font-medium">{String(l.lead_name || l.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {[l.brand, l.model].filter(Boolean).join(' · ') || String(l.name)}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (l) => statusBadge(String(l.status || '')),
              },
              { key: 'source', label: 'Source' },
              {
                key: 'next_action_due',
                label: 'Next action',
                render: (l) => fmtDate(String(l.next_action_due || '')),
              },
              { key: 'lead_owner', label: 'Owner' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Deliveries ({deliveries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No vehicle deliveries."
            rows={deliveries}
            columns={[
              {
                key: 'name',
                label: 'Delivery',
                render: (d) => <span className="font-medium">{String(d.name)}</span>,
              },
              { key: 'vehicle_vin', label: 'VIN' },
              { key: 'vehicle_model', label: 'Model' },
              {
                key: 'delivery_date_time',
                label: 'Date',
                render: (d) => fmtDate(String(d.delivery_date_time || '')),
              },
              {
                key: 'status',
                label: 'Status',
                render: (d) => statusBadge(String(d.status || '')),
              },
              {
                key: 'csat',
                label: 'CSAT',
                render: (d) =>
                  d.customer_satisfaction_score != null
                    ? String(d.customer_satisfaction_score)
                    : '—',
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function AftersalesTab({ data }: { data: Customer360Data }) {
  const { appointments, job_cards, estimates, follow_ups, retention } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Retention" value={retention.status} />
        <StatCard
          label="Next service due"
          value={fmtDate(retention.next_service_due_date)}
        />
        <StatCard label="Open follow-ups" value={retention.open_follow_ups} />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Job cards ({job_cards.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No job cards."
            rows={job_cards}
            columns={[
              {
                key: 'name',
                label: 'Job card',
                render: (j) => (
                  <div>
                    <p className="font-medium">{String(j.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {String(j.vehicle_vin || j.vehicle_model || '')}
                    </p>
                  </div>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (j) => statusBadge(String(j.status || '')),
              },
              {
                key: 'total_amount',
                label: 'Amount',
                render: (j) =>
                  j.total_amount != null ? fmtMoney(Number(j.total_amount)) : '—',
              },
              {
                key: 'next_service_due_date',
                label: 'Next service',
                render: (j) => (
                  <div>
                    <p>{fmtDate(String(j.next_service_due_date || ''))}</p>
                    {j.next_service_due_km != null ? (
                      <p className="text-xs text-muted-foreground">
                        {String(j.next_service_due_km)} km
                      </p>
                    ) : null}
                  </div>
                ),
              },
              { key: 'service_advisor', label: 'Advisor' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Appointments ({appointments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No service appointments."
            rows={appointments}
            columns={[
              {
                key: 'name',
                label: 'Appointment',
                render: (a) => <span className="font-medium">{String(a.name)}</span>,
              },
              {
                key: 'appointment_date_time',
                label: 'Date',
                render: (a) => fmtDate(String(a.appointment_date_time || '')),
              },
              { key: 'vehicle', label: 'Vehicle' },
              { key: 'assigned_service_advisor', label: 'Advisor' },
              {
                key: 'status',
                label: 'Status',
                render: (a) => statusBadge(String(a.status || '')),
              },
            ]}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Estimates ({estimates.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              empty="No service estimates."
              rows={estimates}
              columns={[
                {
                  key: 'name',
                  label: 'Estimate',
                  render: (e) => <span className="font-medium">{String(e.name)}</span>,
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (e) => statusBadge(String(e.status || '')),
                },
                {
                  key: 'grand_total',
                  label: 'Total',
                  render: (e) =>
                    e.grand_total != null ? fmtMoney(Number(e.grand_total)) : '—',
                },
                { key: 'customer_decision', label: 'Decision' },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Follow-ups ({follow_ups.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              empty="No follow-ups."
              rows={follow_ups}
              columns={[
                {
                  key: 'name',
                  label: 'Follow-up',
                  render: (f) => <span className="font-medium">{String(f.name)}</span>,
                },
                {
                  key: 'follow_up_due_date',
                  label: 'Due',
                  render: (f) => fmtDate(String(f.follow_up_due_date || '')),
                },
                { key: 'contact_status', label: 'Contact' },
                {
                  key: 'nps',
                  label: 'NPS / rating',
                  render: (f) =>
                    [f.nps_score, f.customer_rating].filter((x) => x != null && x !== '').join(' / ') ||
                    '—',
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CommunicationsTab({ data }: { data: Customer360Data }) {
  const { activities, communications, follow_ups } = data;
  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">CRM activities ({activities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No activities."
            rows={activities}
            columns={[
              {
                key: 'subject',
                label: 'Subject',
                render: (a) => <span className="font-medium">{String(a.subject || a.name)}</span>,
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
                render: (a) => fmtDate(String(a.due_datetime || '')),
              },
              { key: 'assigned_to', label: 'Assignee' },
              { key: 'disposition', label: 'Disposition' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Messages & emails ({communications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No linked communications yet."
            rows={communications}
            columns={[
              {
                key: 'subject',
                label: 'Subject',
                render: (c) => <span className="font-medium">{String(c.subject || c.name)}</span>,
              },
              { key: 'communication_medium', label: 'Channel' },
              { key: 'sent_or_received', label: 'Direction' },
              {
                key: 'creation',
                label: 'When',
                render: (c) => fmtDate(String(c.creation || '')),
              },
              { key: 'status', label: 'Status' },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Aftersales contact notes ({follow_ups.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No follow-up contact notes."
            rows={follow_ups}
            columns={[
              {
                key: 'name',
                label: 'Follow-up',
                render: (f) => <span className="font-medium">{String(f.name)}</span>,
              },
              { key: 'contact_method', label: 'Method' },
              { key: 'contact_status', label: 'Status' },
              {
                key: 'follow_up_due_date',
                label: 'Due',
                render: (f) => fmtDate(String(f.follow_up_due_date || '')),
              },
              { key: 'assigned_to', label: 'Assignee' },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function CasesTab({ data }: { data: Customer360Data }) {
  const { cases } = data;
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Cases ({cases.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          empty="No cases."
          rows={cases}
          columns={[
            {
              key: 'subject',
              label: 'Subject',
              render: (c) => (
                <div>
                  <p className="font-medium">{String(c.subject || c.name)}</p>
                  <p className="text-xs text-muted-foreground">
                    {String(c.vehicle_vin || c.name)}
                  </p>
                </div>
              ),
            },
            { key: 'category', label: 'Category' },
            {
              key: 'priority',
              label: 'Priority',
              render: (c) => statusBadge(String(c.priority || '')),
            },
            {
              key: 'status',
              label: 'Status',
              render: (c) => statusBadge(String(c.status || '')),
            },
            { key: 'case_owner', label: 'Owner' },
            {
              key: 'sla',
              label: 'SLA',
              render: (c) =>
                c.sla_breached ? (
                  <Badge variant="destructive" className="font-normal">
                    Breached
                  </Badge>
                ) : (
                  fmtDate(String(c.response_deadline || ''))
                ),
            },
          ]}
        />
      </CardContent>
    </Card>
  );
}

function CampaignsTab({ data }: { data: Customer360Data }) {
  const { campaigns } = data;
  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Campaigns ({campaigns.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {campaigns.length === 0 ? (
          <EmptyState label="No campaign membership yet." />
        ) : (
          <DataTable
            empty="No campaign membership."
            rows={campaigns}
            columns={[
              {
                key: 'campaign_name',
                label: 'Campaign',
                render: (c) => (
                  <span className="font-medium">
                    {String(c.campaign_name || c.campaign || c.name)}
                  </span>
                ),
              },
              { key: 'campaign_type', label: 'Type' },
              {
                key: 'status',
                label: 'Member status',
                render: (c) => statusBadge(String(c.status || '')),
              },
              { key: 'response', label: 'Response' },
              {
                key: 'converted',
                label: 'Converted',
                render: (c) => (c.converted ? 'Yes' : 'No'),
              },
              {
                key: 'opted_out',
                label: 'Opt-out',
                render: (c) => (c.opted_out ? 'Yes' : 'No'),
              },
            ]}
          />
        )}
      </CardContent>
    </Card>
  );
}

function FinanceTab({ data }: { data: Customer360Data }) {
  const { finance } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Invoiced"
          value={fmtMoney(finance.invoiced_total)}
          title={fmtMoneyFull(finance.invoiced_total)}
        />
        <StatCard
          label="Paid"
          value={fmtMoney(finance.paid_total)}
          title={fmtMoneyFull(finance.paid_total)}
        />
        <StatCard
          label="Outstanding"
          value={fmtMoney(finance.outstanding)}
          title={fmtMoneyFull(finance.outstanding)}
        />
        <StatCard
          label="Overdue invoices"
          value={finance.overdue_count}
          hint={
            finance.credit_limit
              ? `Credit limit ${fmtMoney(finance.credit_limit)}`
              : finance.payment_terms
                ? String(finance.payment_terms)
                : undefined
          }
        />
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Invoices ({finance.invoices.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No sales invoices."
            rows={finance.invoices}
            columns={[
              {
                key: 'name',
                label: 'Invoice',
                render: (i) => <span className="font-medium">{String(i.name)}</span>,
              },
              {
                key: 'posting_date',
                label: 'Date',
                render: (i) => fmtDate(String(i.posting_date || '')),
              },
              {
                key: 'status',
                label: 'Status',
                render: (i) => (
                  <div className="flex flex-wrap gap-1">
                    {statusBadge(String(i.status || ''))}
                    {i.is_overdue ? (
                      <Badge variant="destructive" className="font-normal">
                        Overdue
                      </Badge>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'grand_total',
                label: 'Total',
                render: (i) => fmtMoney(Number(i.grand_total || 0)),
              },
              {
                key: 'outstanding_amount',
                label: 'Outstanding',
                render: (i) => fmtMoney(Number(i.outstanding_amount || 0)),
              },
            ]}
          />
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Payments ({finance.payments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No payment entries."
            rows={finance.payments}
            columns={[
              {
                key: 'name',
                label: 'Payment',
                render: (p) => <span className="font-medium">{String(p.name)}</span>,
              },
              {
                key: 'posting_date',
                label: 'Date',
                render: (p) => fmtDate(String(p.posting_date || '')),
              },
              { key: 'payment_type', label: 'Type' },
              { key: 'mode_of_payment', label: 'Mode' },
              {
                key: 'amount',
                label: 'Amount',
                render: (p) =>
                  fmtMoney(Number(p.received_amount || p.paid_amount || 0)),
              },
            ]}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function LoyaltyTab({ data }: { data: Customer360Data }) {
  const { loyalty } = data;
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Loyalty tier" value={loyalty.loyalty_tier} />
        <StatCard
          label="Lifetime value"
          value={fmtMoney(loyalty.lifetime_value)}
          title={fmtMoneyFull(loyalty.lifetime_value)}
        />
        <StatCard label="Points" value={loyalty.points} />
        <StatCard label="Repurchase potential" value={loyalty.repurchase_potential} />
        <StatCard
          label="Relationship health"
          value={
            (loyalty as { relationship_health?: number }).relationship_health != null
              ? String((loyalty as { relationship_health?: number }).relationship_health)
              : '—'
          }
        />
        <StatCard
          label="Retention"
          value={String((loyalty as { retention_status?: string }).retention_status || '—')}
        />
        <StatCard
          label="Churn risk"
          value={String((loyalty as { churn_risk?: string }).churn_risk || '—')}
        />
        <StatCard label="Referrals" value={loyalty.referral_count} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Value breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Sales revenue', fmtMoney(loyalty.sales_revenue)],
                ['Aftersales revenue', fmtMoney(loyalty.aftersales_revenue)],
                ['Won deals', String(loyalty.won_deals)],
                ['Service visits', String(loyalty.service_visits)],
                ['Avg NPS', loyalty.avg_nps != null ? String(loyalty.avg_nps) : '—'],
                ['Referrals', String(loyalty.referral_count)],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted-foreground">
              Points from ERPNext Loyalty Program when enrolled. Tier benefits and health from
              DMS CRM Loyalty Settings. Use Pricing Rule only for discount delivery, not as the
              points engine.
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Referrals ({loyalty.referrals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              empty="No referrals recorded yet."
              rows={loyalty.referrals}
              columns={[
                {
                  key: 'name',
                  label: 'Referral',
                  render: (r) => <span className="font-medium">{String(r.name)}</span>,
                },
                { key: 'referred_customer', label: 'Referred' },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => statusBadge(String(r.status || '')),
                },
                {
                  key: 'reward_points',
                  label: 'Points',
                  render: (r) => (r.reward_points != null ? String(r.reward_points) : '—'),
                },
              ]}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AuditTab({
  data,
  duplicates,
  masterId,
}: {
  data: Customer360Data;
  duplicates: Record<string, unknown>[];
  masterId: string;
}) {
  const { audit, customer } = data;
  const { showError, showSuccess } = useCrmFeedback();
  const [merging, setMerging] = useState<string | null>(null);

  const handleMerge = async (duplicateName: string) => {
    if (
      !window.confirm(
        `Merge "${duplicateName}" into this customer (${masterId})?\n\n` +
          'Linked leads, deals, cases and communications will move to this record. ' +
          'The duplicate will be disabled (not deleted).'
      )
    ) {
      return;
    }
    setMerging(duplicateName);
    try {
      const result = await mergeCustomers(masterId, duplicateName, {
        confirmDifferentVehicles: true,
      });
      showSuccess(
        result.message ||
          `Merged ${duplicateName}. Moved ${result.moved_count ?? 0} linked records.`
      );
      await globalMutate(['crm-customer-360', masterId]);
      await globalMutate(['crm-customer-duplicates', masterId]);
    } catch (e) {
      showError(e, 'Merge failed. Managers only — review vehicle ownership first.');
    } finally {
      setMerging(null);
    }
  };

  return (
    <div className="space-y-4">
      {duplicates.length > 0 ? (
        <Card className="border-amber-500/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Possible duplicates ({duplicates.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              empty=""
              rows={duplicates}
              columns={[
                {
                  key: 'customer_name',
                  label: 'Customer',
                  render: (d) => (
                    <div>
                      <p className="font-medium">{String(d.customer_name || d.name)}</p>
                      <p className="text-xs text-muted-foreground">{String(d.name)}</p>
                    </div>
                  ),
                },
                { key: 'mobile_no', label: 'Mobile' },
                { key: 'email_id', label: 'Email' },
                { key: 'reason', label: 'Match' },
                {
                  key: 'actions',
                  label: '',
                  render: (d) => (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={merging === String(d.name)}
                      onClick={() => handleMerge(String(d.name))}
                    >
                      {merging === String(d.name) ? 'Merging…' : 'Merge into this'}
                    </Button>
                  ),
                },
              ]}
            />
            <p className="mt-3 text-xs text-muted-foreground">
              Merge requires CRM Manager review — do not merge different vehicle owners only
              because they share a phone number. The surviving record is this Customer 360.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Audit trail ({audit.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            empty="No audit events yet."
            rows={audit}
            columns={[
              {
                key: 'event_type',
                label: 'Type',
                render: (e) => statusBadge(String(e.event_type || '')),
              },
              {
                key: 'summary',
                label: 'Summary',
                render: (e) => (
                  <div>
                    <p className="font-medium">{String(e.summary || '—')}</p>
                    {e.detail ? (
                      <p className="text-xs text-muted-foreground">{String(e.detail)}</p>
                    ) : null}
                  </div>
                ),
              },
              {
                key: 'when',
                label: 'When',
                render: (e) => fmtDate(String(e.when || '')),
              },
              { key: 'user', label: 'User' },
              {
                key: 'ref',
                label: 'Reference',
                render: (e) =>
                  e.ref_doctype
                    ? `${String(e.ref_doctype)} ${String(e.ref_name || '')}`.trim()
                    : '—',
              },
            ]}
          />
          <p className="mt-3 text-xs text-muted-foreground">
            Record created {fmtDate(customer.creation)} by {customer.owner || '—'} · last
            modified {fmtDate(customer.modified)} by {customer.modified_by || '—'}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function CrmCustomerDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const { canWrite } = usePermissions();
  const customerId = viewParams.get('id') || '';
  const [editOpen, setEditOpen] = useState(false);

  const { data, isLoading, error, mutate } = useSWR(
    customerId ? ['crm-customer-360', customerId] : null,
    () => fetchCustomer360(customerId)
  );

  const { data: dupData } = useSWR(
    customerId ? ['crm-customer-duplicates', customerId] : null,
    () => findCustomerDuplicates(customerId)
  );

  if (!customerId) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">No customer selected.</p>
        <Button variant="outline" onClick={() => navigate('crm-customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to customers
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
          {(error as Error)?.message || 'Failed to load Customer 360.'}
        </p>
        <Button variant="outline" onClick={() => navigate('crm-customers')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to customers
        </Button>
      </div>
    );
  }

  const { customer, summary } = data;
  const duplicates = dupData?.duplicates || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="-ml-2 h-8 px-2 text-muted-foreground"
            onClick={() => navigate('crm-customers')}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Customers
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{customer.customer_name}</h1>
            <p className="text-sm text-muted-foreground">{customer.name}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {customer.customer_group ? (
              <Badge variant="outline">{customer.customer_group}</Badge>
            ) : null}
            {customer.territory ? <Badge variant="outline">{customer.territory}</Badge> : null}
            {summary.loyalty_tier ? (
              <Badge variant="outline">{summary.loyalty_tier}</Badge>
            ) : null}
            {customer.disabled ? (
              <Badge variant="destructive">Disabled</Badge>
            ) : (
              <Badge variant="secondary">Active</Badge>
            )}
            {duplicates.length > 0 ? (
              <Badge variant="destructive">{duplicates.length} possible duplicates</Badge>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          {canWrite('customers') ? (
            <Button onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Customer
            </Button>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <Car className="h-3.5 w-3.5" />
            {summary.vehicles} vehicles
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <Target className="h-3.5 w-3.5" />
            {summary.leads_open} open leads
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <Handshake className="h-3.5 w-3.5" />
            {summary.opportunities_open} open deals
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <Wrench className="h-3.5 w-3.5" />
            {summary.job_cards || 0} job cards
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border px-2 py-1">
            <UserRound className="h-3.5 w-3.5" />
            {summary.contacts} contacts
          </span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="identity">Identity</TabsTrigger>
          <TabsTrigger value="organizations">Organizations</TabsTrigger>
          <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="aftersales">Aftersales</TabsTrigger>
          <TabsTrigger value="communications">Communications</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="loyalty">Loyalty</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="identity">
          <IdentityTab data={data} />
        </TabsContent>
        <TabsContent value="organizations">
          <OrganizationsTab data={data} />
        </TabsContent>
        <TabsContent value="vehicles">
          <VehiclesTab data={data} />
        </TabsContent>
        <TabsContent value="sales">
          <SalesTab data={data} />
        </TabsContent>
        <TabsContent value="aftersales">
          <AftersalesTab data={data} />
        </TabsContent>
        <TabsContent value="communications">
          <CommunicationsTab data={data} />
        </TabsContent>
        <TabsContent value="cases">
          <CasesTab data={data} />
        </TabsContent>
        <TabsContent value="campaigns">
          <CampaignsTab data={data} />
        </TabsContent>
        <TabsContent value="finance">
          <FinanceTab data={data} />
        </TabsContent>
        <TabsContent value="loyalty">
          <LoyaltyTab data={data} />
        </TabsContent>
        <TabsContent value="audit">
          <AuditTab data={data} duplicates={duplicates} masterId={customerId} />
        </TabsContent>
      </Tabs>

      <EditCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={customer}
        onUpdated={() => {
          void mutate();
          void globalMutate(
            (key) =>
              Array.isArray(key) &&
              (key[0] === 'crm-customer-360' ||
                key[0] === 'crm-customer-duplicates' ||
                key[0] === 'customers' ||
                key[0] === 'crm-customers'),
            undefined,
            { revalidate: true }
          );
        }}
      />
    </div>
  );
}
