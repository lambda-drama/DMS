'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listAccounts } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Plus, Search } from 'lucide-react';

export default function CrmAccountsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSWR(['crm-accounts', search], () =>
    listAccounts({ search: search || undefined, limit: 50 })
  );
  const rows = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => navigate('crm-account-new')}>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search accounts…"
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
                    <th className="pb-2 font-medium">Account</th>
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Fleet</th>
                    <th className="pb-2 font-medium">Health</th>
                    <th className="pb-2 font-medium">Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No corporate / fleet accounts yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-account-detail', { id: String(row.name) })
                        }
                      >
                        <td className="py-3">
                          <p className="font-medium">
                            {String(row.account_name || row.name)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {String(row.customer_name || row.customer || row.name)}
                          </p>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.account_type || '—')}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className="font-normal">
                            {String(row.status || '—')}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {row.fleet_size != null ? String(row.fleet_size) : '—'}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.relationship_health || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.owner_name || row.account_owner || '—')}
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
