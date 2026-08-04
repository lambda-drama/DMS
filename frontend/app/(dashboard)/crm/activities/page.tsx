'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { getOverdueBoard, listActivities } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

export default function CrmActivitiesPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Open');
  const [mine, setMine] = useState(true);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [boardScope, setBoardScope] = useState<'mine' | 'team'>('mine');

  const { data, isLoading } = useSWR(
    ['crm-activities', search, status, mine, overdueOnly],
    () =>
      listActivities({
        search: search || undefined,
        status,
        mine,
        overdue_only: overdueOnly,
        limit: 50,
      })
  );
  const { data: board } = useSWR(['crm-overdue-board', boardScope], () =>
    getOverdueBoard(boardScope)
  );
  const rows = data?.data || [];
  const summary = data?.summary || {};

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-md border px-2.5 py-1">Open: {Number(summary.open || 0)}</span>
          <span className="rounded-md border px-2.5 py-1">
            Mine: {Number(summary.mine_open || 0)}
          </span>
          <span className="rounded-md border border-destructive/40 px-2.5 py-1 text-destructive">
            Overdue: {Number(summary.overdue || 0)}
          </span>
        </div>
        <Button onClick={() => navigate('crm-activity-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Activity
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Overdue board</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={boardScope === 'mine' ? 'default' : 'outline'}
                onClick={() => setBoardScope('mine')}
              >
                Mine
              </Button>
              {board?.can_view_team ? (
                <Button
                  size="sm"
                  variant={boardScope === 'team' ? 'default' : 'outline'}
                  onClick={() => setBoardScope('team')}
                >
                  Team
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {(board?.activities || []).length === 0 ? (
            <p className="text-muted-foreground">No overdue activities.</p>
          ) : (
            (board?.activities || []).slice(0, 8).map((a: Record<string, unknown>) => (
              <button
                key={String(a.name)}
                type="button"
                className="flex w-full items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-left hover:bg-muted/40"
                onClick={() => navigate('crm-activity-detail', { id: String(a.name) })}
              >
                <span className="font-medium">{String(a.subject)}</span>
                <span className="text-xs text-destructive">
                  {String(a.due_datetime || '').slice(0, 16).replace('T', ' ')}
                </span>
              </button>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} />
              Mine only
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => setOverdueOnly(e.target.checked)}
              />
              Overdue only
            </label>
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
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-activity-detail', { id: String(row.name) })
                        }
                      >
                        <td className="py-3 font-medium">{String(row.subject || '')}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.activity_type || '—')}
                        </td>
                        <td className="py-3">
                          {row.is_overdue || row.sla_breached ? (
                            <Badge variant="destructive" className="font-normal">
                              {String(row.due_datetime || '').slice(0, 16).replace('T', ' ')}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              {String(row.due_datetime || '—')}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.owner_name || '—')}
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
