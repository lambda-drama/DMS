'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listOpportunities } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

export default function CrmOpportunitiesPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Open');
  const { data, isLoading } = useSWR(
    ['crm-opportunities', search, status],
    () => listOpportunities({ search: search || undefined, status, limit: 50 })
  );
  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('crm-opportunity-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Deal
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search deals…"
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
              <option value="Won">Won</option>
              <option value="Lost">Lost</option>
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
                    <th className="pb-2 font-medium">Deal</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Stage</th>
                    <th className="pb-2 font-medium">Value</th>
                    <th className="pb-2 font-medium">Owner</th>
                    <th className="pb-2 font-medium">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No deals in this view.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr key={String(row.name)} className="border-b border-border/60 last:border-0">
                        <td className="py-3 font-medium">{String(row.title || '')}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.customer_name || row.customer || '—')}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-orange-500/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                            {String(row.stage || '')}
                          </span>
                        </td>
                        <td className="py-3">
                          {Number(row.expected_value || 0).toLocaleString()}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.owner_name || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.expected_close_date || '—')}
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
