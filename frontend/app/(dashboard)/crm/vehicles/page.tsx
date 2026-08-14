'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { listCrmVehicles } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';

export default function CrmVehiclesPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const { data, isLoading } = useSWR(['crm-vehicles', search], () =>
    listCrmVehicles({ search: search || undefined, limit: 50 })
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
              placeholder="Search VIN, plate, model, or buyer…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="dms-table-panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">VIN</th>
                    <th className="pb-2 font-medium">Vehicle</th>
                    <th className="pb-2 font-medium">Buyer</th>
                    <th className="pb-2 font-medium">Odometer</th>
                    <th className="pb-2 font-medium">Warranty</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center text-muted-foreground">
                        No vehicles found. Search by VIN / chassis number.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-vehicle-detail', {
                            id: String(row.vin_number || row.name),
                          })
                        }
                      >
                        <td className="py-3">
                          <p className="font-medium">{String(row.vin_number || row.name)}</p>
                          <p className="text-xs text-muted-foreground">
                            {String(row.plate_number || 'No plate')}
                          </p>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {[row.brand, row.model_name || row.model, row.model_year]
                            .filter(Boolean)
                            .join(' · ') || '—'}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.customer_name || row.current_customer || '—')}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {row.current_odometer != null ? String(row.current_odometer) : '—'}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary" className="font-normal">
                            {String(row.warranty_status || '—')}
                          </Badge>
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.vehicle_status || '—')}
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
