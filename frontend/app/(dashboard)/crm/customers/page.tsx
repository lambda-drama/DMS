'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCustomers } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search } from 'lucide-react';

export default function CrmCustomersPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSWR(['crm-customers', search], () =>
    listCustomers({ search: search || undefined, limit: 50 })
  );
  const rows = data?.data || [];
  const emptyMessage =
    data?.message ||
    (rows.length === 0 ? 'No DMS customers found.' : null);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('crm-customer-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search customers…"
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
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium">Mobile</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Group</th>
                    <th className="pb-2 font-medium">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-muted-foreground">
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-customer-detail', { id: String(row.name) })
                        }
                      >
                        <td className="py-3">
                          <p className="font-medium">{String(row.customer_name || row.name)}</p>
                          <p className="text-xs text-muted-foreground">{String(row.name)}</p>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.mobile_no || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.email_id || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.customer_group || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.customer_type || '—')}
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
