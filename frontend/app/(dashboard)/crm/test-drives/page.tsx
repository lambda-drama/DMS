'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listTestDrives } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function CrmTestDrivesPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useSWR(['crm-test-drives', search, status], () =>
    listTestDrives({ search: search || undefined, status, limit: 100 })
  );
  const rows = data?.data || [];

  return (
    <Card className="border-border/70 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search test drives…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            {['Scheduled', 'Confirmed', 'In Progress', 'Completed', 'Failed', 'No-Show', 'Cancelled'].map(
              (value) => (
                <option key={value}>{value}</option>
              )
            )}
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
                  <th className="pb-2 font-medium">Test Drive</th>
                  <th className="pb-2 font-medium">Deal</th>
                  <th className="pb-2 font-medium">Customer</th>
                  <th className="pb-2 font-medium">Scheduled</th>
                  <th className="pb-2 font-medium">Vehicle</th>
                  <th className="pb-2 font-medium">Status</th>
                  <th className="pb-2 font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {rows.length ? (
                  rows.map((row: Record<string, unknown>) => (
                    <tr
                      key={String(row.name)}
                      className="cursor-pointer border-b border-border/60 hover:bg-muted/40"
                      onClick={() =>
                        navigate('crm-test-drive-detail', { id: String(row.name) })
                      }
                    >
                      <td className="py-3 font-medium">{String(row.name)}</td>
                      <td className="py-3">{String(row.opportunity || '—')}</td>
                      <td className="py-3 text-muted-foreground">{String(row.customer || '—')}</td>
                      <td className="py-3 text-muted-foreground">
                        {row.scheduled_datetime
                          ? new Date(String(row.scheduled_datetime)).toLocaleString()
                          : '—'}
                      </td>
                      <td className="py-3 text-muted-foreground">{String(row.vehicle_vin || '—')}</td>
                      <td className="py-3">{String(row.status || '—')}</td>
                      <td className="py-3 text-muted-foreground">{String(row.outcome || '—')}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-muted-foreground">
                      No test drives yet. Schedule one from a Deal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
