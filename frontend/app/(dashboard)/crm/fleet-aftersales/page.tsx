'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  getFleetAftersales,
  getFleetHealthReport,
  listAccounts,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/searchable-select';
import { Search } from 'lucide-react';

function statusTone(status?: string) {
  if (status === 'Overdue') return 'destructive' as const;
  if (status === 'Due Soon') return 'secondary' as const;
  return 'outline' as const;
}

export default function CrmFleetAftersalesPage() {
  const { navigate, viewParams } = useNavigation();
  const presetAccount = viewParams.get('account') || '';
  const presetCustomer = viewParams.get('customer') || '';
  const [account, setAccount] = useState(presetAccount);
  const [customer, setCustomer] = useState(presetCustomer);
  const [search, setSearch] = useState('');
  const [accountSearch, setAccountSearch] = useState('');

  const { data: accounts } = useSWR(['crm-accounts-fleet-pick', accountSearch], () =>
    listAccounts({ search: accountSearch || undefined, limit: 30 })
  );

  const scopeKey = account || customer;
  const { data, isLoading } = useSWR(
    scopeKey ? ['crm-fleet-aftersales-page', account, customer, search] : null,
    () =>
      getFleetAftersales({
        account: account || undefined,
        customer: customer || undefined,
        search: search || undefined,
        limit: 100,
      })
  );
  const { data: health } = useSWR(
    scopeKey ? ['crm-fleet-health', account, customer] : null,
    () =>
      getFleetHealthReport({
        account: account || undefined,
        customer: customer || undefined,
      })
  );

  const rows = (data?.data || []) as Record<string, unknown>[];
  const summary = (data?.summary || {}) as Record<string, number>;
  const agreements = (data?.agreements || []) as Record<string, unknown>[];

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Fleet aftersales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Account
            </label>
            <SearchableSelect
              options={((accounts?.data as Record<string, unknown>[]) || []).map((a) => ({
                value: String(a.name),
                label: String(a.account_name || a.name),
                description: String(a.customer_name || a.customer || ''),
              }))}
              value={account}
              onValueChange={(v) => {
                const selected = ((accounts?.data as Record<string, unknown>[]) || []).find(
                  (a) => String(a.name) === v
                );
                setAccount(v || '');
                setCustomer(String(selected?.customer || ''));
              }}
              onSearchChange={setAccountSearch}
              placeholder="Select fleet account…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Search VIN / model
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter fleet vehicles…"
                disabled={!scopeKey}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {!scopeKey ? (
        <Card className="border-border/70">
          <CardContent className="py-10 text-center text-muted-foreground">
            Select a corporate / fleet account to view vehicle-level service due tracking,
            SLA signals and agreement utilization.
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Skeleton className="h-40" />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-4">
            <Card className="border-border/70 shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Vehicles</p>
                <p className="text-2xl font-semibold">{summary.total_vehicles ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Overdue</p>
                <p className="text-2xl font-semibold">{summary.overdue ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Due soon</p>
                <p className="text-2xl font-semibold">{summary.due_soon ?? 0}</p>
              </CardContent>
            </Card>
            <Card className="border-border/70 shadow-sm">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">Open job cards</p>
                <p className="text-2xl font-semibold">{summary.open_job_cards ?? 0}</p>
              </CardContent>
            </Card>
          </div>

          {health ? (
            <Card className="border-border/70 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Monthly fleet health</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Customer: </span>
                  {String(health.customer_name || health.customer || '—')}
                </p>
                <p>
                  <span className="text-muted-foreground">Avg odometer: </span>
                  {health.average_odometer != null
                    ? Number(health.average_odometer).toLocaleString()
                    : '—'}
                </p>
                <p>
                  <span className="text-muted-foreground">Avg age (yrs): </span>
                  {health.average_age_years != null ? String(health.average_age_years) : '—'}
                </p>
                <p className="text-muted-foreground">{String(health.preventive_plan || '')}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Vehicle service due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="dms-table-panel">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="pb-2 font-medium">VIN</th>
                      <th className="pb-2 font-medium">Model</th>
                      <th className="pb-2 font-medium">Odometer</th>
                      <th className="pb-2 font-medium">Next service</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-muted-foreground">
                          No fleet vehicles found for this account.
                        </td>
                      </tr>
                    ) : (
                      rows.map((row) => (
                        <tr
                          key={String(row.name)}
                          className="border-b border-border/60 last:border-0"
                        >
                          <td className="py-3">
                            <p className="font-medium">
                              {String(row.vin_number || row.name)}
                            </p>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {String(row.model_name || row.model || '—')}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {row.current_odometer != null
                              ? Number(row.current_odometer).toLocaleString()
                              : '—'}
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {row.next_service_due_date
                              ? String(row.next_service_due_date).slice(0, 10)
                              : '—'}
                          </td>
                          <td className="py-3">
                            <Badge
                              variant={statusTone(String(row.service_status || ''))}
                              className="font-normal"
                            >
                              {String(row.service_status || '—')}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                Contracts / utilization &amp; renewals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {agreements.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active framework agreements.</p>
              ) : (
                agreements.map((a) => (
                  <div
                    key={String(a.name)}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{String(a.agreement_title || a.name)}</p>
                      <p className="text-xs text-muted-foreground">
                        Valid to {String(a.valid_to || '—')} · Units{' '}
                        {String(a.utilization_units ?? 0)}/{String(a.max_units ?? '—')}
                      </p>
                    </div>
                    {account ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate('crm-account-detail', { id: account })
                        }
                      >
                        Account
                      </Button>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
