'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { acceptLead, listLeads } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { MoreHorizontal, Plus, Search } from 'lucide-react';

function leadStatusTone(status: string) {
  switch (status) {
    case 'New':
      return 'bg-sky-500/10 text-sky-700';
    case 'Assigned':
      return 'bg-blue-500/10 text-blue-700';
    case 'Contact Attempted':
      return 'bg-amber-500/10 text-amber-700';
    case 'Contacted':
      return 'bg-violet-500/10 text-violet-700';
    case 'Qualified':
      return 'bg-emerald-500/10 text-emerald-700';
    case 'Disqualified':
      return 'bg-destructive/10 text-destructive';
    case 'Converted':
      return 'bg-emerald-600/10 text-emerald-800';
    case 'Nurture':
      return 'bg-cyan-500/10 text-cyan-700';
    case 'Duplicate':
      return 'bg-orange-500/10 text-orange-700';
    case 'Invalid':
      return 'bg-slate-400/10 text-slate-500';
    default:
      return 'bg-muted text-foreground';
  }
}

export default function CrmLeadsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const { data, isLoading, mutate } = useSWR(
    ['crm-leads', search, status],
    () => listLeads({ search: search || undefined, status, limit: 50 })
  );

  const rows = data?.data || [];

  const onAcceptLead = async (lead: string) => {
    clear();
    try {
      await acceptLead(lead);
      await mutate();
      showSuccess(`Lead ${lead} accepted.`);
    } catch (e: unknown) {
      showError(e, 'Failed to accept lead');
    }
  };

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
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
              <option value="Assigned">Assigned</option>
              <option value="Contact Attempted">Contact Attempted</option>
              <option value="Contacted">Contacted</option>
              <option value="Qualified">Qualified</option>
              <option value="Disqualified">Disqualified</option>
              <option value="Converted">Converted</option>
              <option value="Nurture">Nurture</option>
              <option value="Duplicate">Duplicate</option>
              <option value="Invalid">Invalid</option>
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
                    <th className="pb-2 font-medium">Lead</th>
                    <th className="pb-2 font-medium">Mobile</th>
                    <th className="pb-2 font-medium">Source</th>
                    <th className="pb-2 font-medium">Model</th>
                    <th className="pb-2 font-medium">Priority</th>
                    <th className="pb-2 font-medium">SLA</th>
                    <th className="pb-2 font-medium">Owner</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-muted-foreground">
                        No leads yet. Create your first enquiry.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() => navigate('crm-lead-detail', { id: String(row.name) })}
                      >
                        <td className="py-3 font-medium">{String(row.lead_name || '')}</td>
                        <td className="py-3 text-muted-foreground">{String(row.mobile_no || '—')}</td>
                        <td className="py-3 text-muted-foreground">{String(row.source || '—')}</td>
                        <td className="py-3 text-muted-foreground">{String(row.model || '—')}</td>
                        <td className="py-3 text-muted-foreground">{String(row.priority || '—')}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.sla_status || '—').replace('First Response ', '')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.owner_name || row.lead_owner || '—')}
                        </td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${leadStatusTone(String(row.status || ''))}`}
                          >
                            {String(row.status || '')}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(event) => event.stopPropagation()}
                                aria-label="Lead actions"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" onClick={(event) => event.stopPropagation()}>
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate('crm-lead-detail', { id: String(row.name) })
                                }
                              >
                                Open Lead
                              </DropdownMenuItem>
                              {!row.accepted_on &&
                              ['New', 'Assigned'].includes(String(row.status || '')) ? (
                                <DropdownMenuItem
                                  onClick={() => void onAcceptLead(String(row.name))}
                                >
                                  Accept Lead
                                </DropdownMenuItem>
                              ) : null}
                              {String(row.status) !== 'Converted' ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate('crm-lead-detail', {
                                      id: String(row.name),
                                      action: 'convert',
                                    })
                                  }
                                >
                                  Convert to Deal
                                </DropdownMenuItem>
                              ) : null}
                              {row.opportunity ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate('crm-opportunity-detail', {
                                      id: String(row.opportunity),
                                    })
                                  }
                                >
                                  Open Deal
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
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