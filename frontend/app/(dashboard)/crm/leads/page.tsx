'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listLeads } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

export default function CrmLeadsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useSWR(
    ['crm-leads', search, status],
    () => listLeads({ search: search || undefined, status, limit: 50 })
  );

  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('crm-lead-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Lead
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search leads…"
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
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Converted">Converted</option>
              <option value="Nurture">Nurture</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          ) : (
            <div className="dms-table-panel">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Lead</th>
                    <th className="pb-2 font-medium">Mobile</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium">Owner</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No leads yet. Create your first enquiry.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr key={String(row.name)} className="border-b border-border/60 last:border-0">
                        <td className="py-3 font-medium">{String(row.lead_name || '')}</td>
                        <td className="py-3 text-muted-foreground">{String(row.mobile_no || '—')}</td>
                        <td className="py-3 text-muted-foreground">{String(row.source || '—')}</td>
                        <td className="py-3 text-muted-foreground">{String(row.model || '—')}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.owner_name || row.lead_owner || '—')}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
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
          <CardTitle className="sr-only">Leads list</CardTitle>
        </CardContent>
      </Card>
    </div>
  );
}
