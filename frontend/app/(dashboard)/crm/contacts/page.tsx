'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listContacts } from '@/services/crm';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function CrmContactsPage() {
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSWR(['crm-contacts', search], () =>
    listContacts({ search: search || undefined, limit: 50 })
  );
  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search contacts…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                    <th className="pb-2 font-medium">Name</th>
                    <th className="pb-2 font-medium">Mobile</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Company</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        No contacts found.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr key={String(row.name)} className="border-b border-border/60 last:border-0">
                        <td className="py-3 font-medium">{String(row.full_name || row.name)}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.mobile_no || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.email_id || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.company_name || '—')}
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
