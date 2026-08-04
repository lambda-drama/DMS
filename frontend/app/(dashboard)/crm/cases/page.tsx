'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCases } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

function priorityClass(priority: string) {
  if (priority === 'Critical') return 'bg-red-600/15 text-red-700 dark:text-red-400';
  if (priority === 'High') return 'bg-orange-500/15 text-orange-700 dark:text-orange-400';
  if (priority === 'Medium') return 'bg-amber-500/15 text-amber-800 dark:text-amber-400';
  return 'bg-muted text-muted-foreground';
}

export default function CrmCasesPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const { data, isLoading } = useSWR(['crm-cases', search, status, priority], () =>
    listCases({
      search: search || undefined,
      status,
      priority,
      limit: 50,
    })
  );
  const rows = data?.data || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          {(['Critical', 'High', 'Medium', 'Low'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriority(priority === p ? 'all' : p)}
              className={`rounded-md border px-2.5 py-1 ${
                priority === p ? 'border-primary bg-primary/5' : 'border-border'
              }`}
            >
              {p}: {Number(summary[p] || 0)}
            </button>
          ))}
          <span className="rounded-md border border-destructive/40 px-2.5 py-1 text-destructive">
            SLA breached: {Number(summary.breached || 0)}
          </span>
        </div>
        <Button onClick={() => navigate('crm-case-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Case
        </Button>
      </div>

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
              <option value="Acknowledged">Acknowledged</option>
              <option value="Assigned">Assigned</option>
              <option value="Investigation">Investigation</option>
              <option value="Awaiting Customer">Awaiting Customer</option>
              <option value="Awaiting Internal Action">Awaiting Internal Action</option>
              <option value="Resolution Proposed">Resolution Proposed</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
              <option value="Reopened">Reopened</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">All priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
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
                    <th className="pb-2 font-medium">Case</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Category</th>
                    <th className="pb-2 font-medium">Priority</th>
                    <th className="pb-2 font-medium">SLA</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No cases yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-case-detail', { id: String(row.name) })
                        }
                      >
                        <td className="py-3">
                          <p className="font-medium">{String(row.subject || '')}</p>
                          <p className="text-xs text-muted-foreground">{String(row.name)}</p>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.customer_name || row.customer || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.category || '—')}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityClass(
                              String(row.priority || '')
                            )}`}
                          >
                            {String(row.priority || '')}
                          </span>
                        </td>
						<td className="py-3">
                          {row.protected_escalation ? (
                            <Badge variant="destructive" className="font-normal">
                              Protected
                            </Badge>
                          ) : row.sla_breached ? (
                            <Badge variant="destructive" className="font-normal">
                              Breached
                            </Badge>
                          ) : row.response_deadline ? (
                            <span className="text-xs text-muted-foreground">
                              {String(row.response_deadline).slice(0, 16).replace('T', ' ')}
                            </span>
                          ) : (
                            '—'
                          )}
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
