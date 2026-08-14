'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listSalesAppointments } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

const STATUSES = [
  'Requested',
  'Scheduled',
  'Confirmed',
  'Arrived',
  'Completed',
  'Rescheduled',
  'Cancelled',
  'No-Show',
];

export default function CrmSalesAppointmentsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useSWR(['crm-sales-appointments', search, status], () =>
    listSalesAppointments({ search: search || undefined, status, limit: 100 })
  );
  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('crm-sales-appointment-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Appointment
        </Button>
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search appointments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              {STATUSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-32" />
          ) : (
            <div className="dms-table-panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">When</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Deal</th>
                    <th className="pb-2 font-medium">Assigned</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No sales appointments yet. Book a showroom visit from here or from a deal.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-sales-appointment-detail', { id: String(row.name) })
                        }
                      >
                        <td className="py-3 font-medium">
                          {row.appointment_datetime
                            ? new Date(String(row.appointment_datetime)).toLocaleString()
                            : '—'}
                        </td>
                        <td className="py-3">
                          {String(row.customer_name || row.customer || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.appointment_type || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.opportunity_title || row.opportunity || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.owner_name || row.assigned_to || '—')}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className="font-normal">
                            {String(row.status || '—')}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
