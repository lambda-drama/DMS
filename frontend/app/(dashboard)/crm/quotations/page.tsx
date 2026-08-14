'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listQuotations } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';

export default function CrmQuotationsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading } = useSWR(['crm-quotations', search, status], () =>
    listQuotations({ search: search || undefined, status, limit: 100 })
  );
  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Quotations</h1>
        <p className="text-sm text-muted-foreground">
          Review draft quotations, submit them, and track linked deals — without opening Desk.
        </p>
      </div>
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search quotation, customer or deal…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="all">All</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="cancelled">Cancelled</option>
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
                    <th className="pb-2 font-medium">Quotation</th>
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Deal</th>
                    <th className="pb-2 font-medium">Date</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length ? (
                    rows.map((row) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 hover:bg-muted/40"
                        onClick={() => navigate('crm-quotation-detail', { id: String(row.name) })}
                      >
                        <td className="py-3 font-medium">{String(row.name)}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.customer_display || row.party_name || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.opportunity_title || row.opportunity || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {row.transaction_date ? String(row.transaction_date) : '—'}
                        </td>
                        <td className="py-3">
                          {row.currency ? `${row.currency} ` : ''}
                          {Number(row.grand_total || row.net_total || 0).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">
                            {String(row.docstatus_label || row.status || 'Draft')}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No quotations yet. Create one from a completed Test Drive on a Deal.
                      </td>
                    </tr>
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
