'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listBookings } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const STATUSES = [
  'all',
  'Provisional',
  'Deposit Pending',
  'Confirmed',
  'Allocation Pending',
  'Allocated',
  'Converted to Sale',
  'Cancelled',
  'Expired',
];

export default function CrmBookingsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useSWR(['crm-bookings', search, status], () =>
    listBookings({ search, status })
  );
  const rows = (data as { data?: Record<string, unknown>[] } | undefined)?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Bookings</h1>
          <p className="text-sm text-muted-foreground">
            Deposits, stock reservations and VIN allocations (Blueprint §7.3).
          </p>
        </div>
      </div>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input
            placeholder="Search booking, customer, VIN or deal…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-sm"
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {value === 'all' ? 'All statuses' : value}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>
      {isLoading ? (
        <Skeleton className="h-64" />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {rows.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">
                No bookings yet. Create a booking from a Deal at Quotation / Negotiation stage.
              </p>
            ) : (
              rows.map((row) => (
                <button
                  key={String(row.name)}
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/40"
                  onClick={() => {
                    if (row.opportunity) {
                      navigate('crm-opportunity-detail', { id: String(row.opportunity) });
                    }
                  }}
                >
                  <div>
                    <div className="font-medium">{String(row.name)}</div>
                    <div className="text-xs text-muted-foreground">
                      {String(row.customer_name || row.customer || '—')} ·{' '}
                      {String(row.vehicle_model || 'Model TBD')} ·{' '}
                      {String(row.vehicle_vin || 'No VIN')} · deposit{' '}
                      {row.deposit_amount != null ? String(row.deposit_amount) : '—'}
                    </div>
                  </div>
                  <Badge variant="outline">{String(row.status || 'Provisional')}</Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
