'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listActivities } from '@/services/crm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function CrmActivitiesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Open');
  const { data, isLoading } = useSWR(['crm-activities', search, status], () =>
    listActivities({ search: search || undefined, status, limit: 50 })
  );
  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search activities…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Open">Open</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="dms-table-panel">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Subject</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Due</th>
                    <th className="pb-2 font-medium">Owner</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">
                        No activities yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr key={String(row.name)} className="border-b border-border/60 last:border-0">
                        <td className="py-3 font-medium">{String(row.subject || '')}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.activity_type || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.due_datetime || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.owner_name || '—')}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-sky-500/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {String(row.status || '')}
                          </span>
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
