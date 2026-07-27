'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCases } from '@/services/crm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function CrmCasesPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useSWR(['crm-cases', search, status], () =>
    listCases({ search: search || undefined, status, limit: 50 })
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
                placeholder="Search cases…"
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
              <option value="New">New</option>
              <option value="Investigation">Investigation</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
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
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Priority</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">
                        No cases yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr key={String(row.name)} className="border-b border-border/60 last:border-0">
                        <td className="py-3 font-medium">{String(row.subject || '')}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.customer_name || row.customer || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.category || '—')}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {String(row.priority || '')}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">{String(row.status || '')}</td>
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
