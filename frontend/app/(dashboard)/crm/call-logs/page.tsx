'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCallLogs, type CallLogRow } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PhoneIncoming, PhoneOutgoing, Plus, Search } from 'lucide-react';

const STATUS_CLASS: Record<string, string> = {
  green: 'bg-emerald-500/10 text-emerald-700',
  red: 'bg-red-500/10 text-red-700',
  orange: 'bg-orange-500/10 text-orange-700',
  blue: 'bg-sky-500/10 text-sky-700',
  gray: 'bg-muted text-muted-foreground',
};

export default function CrmCallLogsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const { data, isLoading } = useSWR(['crm-call-logs', search, status, type], () =>
    listCallLogs({
      search: search || undefined,
      status,
      type,
      limit: 50,
    })
  );
  const rows: CallLogRow[] = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('crm-call-log-new')}>
          <Plus className="mr-2 h-4 w-4" />
          Log Call
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search number, ID, reference…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option value="all">All types</option>
              <option value="Incoming">Incoming</option>
              <option value="Outgoing">Outgoing</option>
            </select>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All statuses</option>
              <option value="Completed">Completed</option>
              <option value="No Answer">Missed Call</option>
              <option value="Busy">Declined</option>
              <option value="Failed">Failed</option>
              <option value="In Progress">In Progress</option>
              <option value="Initiated">Initiated</option>
              <option value="Ringing">Ringing</option>
              <option value="Queued">Queued</option>
              <option value="Canceled">Canceled</option>
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
            <div className="dms-table-panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Lead / Contact</th>
                    <th className="pb-2 font-medium">From</th>
                    <th className="pb-2 font-medium">To</th>
                    <th className="pb-2 font-medium">Caller / Receiver</th>
                    <th className="pb-2 font-medium">Duration</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-muted-foreground">
                        No call logs yet. Log your first call.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => {
                      const incoming = row.type === 'Incoming';
                      const party = incoming
                        ? row._caller?.label || row.from
                        : row._receiver?.label || row.to;
                      const agent = incoming
                        ? row._receiver?.label || row.receiver_name || row.receiver
                        : row._caller?.label || row.caller_name || row.caller;
                      return (
                        <tr
                          key={row.name}
                          className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                          onClick={() => navigate('crm-call-log-detail', { id: row.name })}
                        >
                          <td className="py-3">
                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                              {incoming ? (
                                <PhoneIncoming className="h-3.5 w-3.5" />
                              ) : (
                                <PhoneOutgoing className="h-3.5 w-3.5" />
                              )}
                              {row.type}
                            </span>
                          </td>
                          <td className="py-3">
                            <div className="truncate font-medium">
                              {row._lead_label || row._contact_label || row._deal_label || '—'}
                            </div>
                            <div className="truncate text-xs text-muted-foreground">
                              {row._lead
                                ? 'Lead'
                                : row._contact
                                  ? 'Contact'
                                  : row._deal
                                    ? 'Deal'
                                    : ''}
                            </div>
                          </td>
                          <td className="py-3 font-medium">{row.from || '—'}</td>
                          <td className="py-3 text-muted-foreground">{row.to || '—'}</td>
                          <td className="py-3 text-muted-foreground">
                            <div className="truncate">{party || '—'}</div>
                            <div className="truncate text-xs">{agent || '—'}</div>
                          </td>
                          <td className="py-3 text-muted-foreground">{row._duration || '—'}</td>
                          <td className="py-3">
                            <Badge
                              variant="secondary"
                              className={STATUS_CLASS[row.status_color || 'gray'] || STATUS_CLASS.gray}
                            >
                              {row.status_label || row.status || '—'}
                            </Badge>
                          </td>
                          <td className="py-3 text-muted-foreground">
                            {row.start_time || row.creation
                              ? new Date(String(row.start_time || row.creation)).toLocaleString()
                              : '—'}
                          </td>
                        </tr>
                      );
                    })
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
