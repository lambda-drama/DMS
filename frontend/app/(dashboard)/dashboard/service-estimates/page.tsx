'use client';

import { useEffect, useState } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { useServiceEstimates } from '@/hooks/use-dms';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileSpreadsheet, Search, User, Car } from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import type { ServiceEstimateStatus } from '@/types/dms';
import { format } from 'date-fns';

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'Diagnosis In Progress', label: 'Diagnosis In Progress' },
  { value: 'Diagnosis Complete', label: 'Diagnosis Complete' },
  { value: 'Estimation In Progress', label: 'Estimation In Progress' },
  { value: 'Pending Customer Approval', label: 'Pending Approval' },
  { value: 'Accepted', label: 'Accepted' },
  { value: 'Rejected', label: 'Rejected' },
];

function statusVariant(status: ServiceEstimateStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Accepted') return 'default';
  if (status === 'Rejected' || status === 'Cancelled') return 'destructive';
  if (status === 'Pending Customer Approval') return 'outline';
  return 'secondary';
}

export default function ServiceEstimatesPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const { data: result, isLoading, error } = useServiceEstimates({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const estimates = result?.data ?? [];
  const totalItems = result?.total || 0;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <Card className="order-1 min-w-0">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              Service Estimates
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search estimates, customer, plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-destructive">Failed to load service estimates</p>
          ) : estimates.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No service estimates found</p>
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estimate</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Before VAT</TableHead>
                      <TableHead className="text-right">Diagnostic Fee</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimates.map((est) => (
                      <TableRow
                        key={est.name}
                        className="cursor-pointer"
                        onClick={() => navigate('estimate-detail', { id: est.name })}
                      >
                        <TableCell className="font-medium">{est.name}</TableCell>
                        <TableCell>{est.customer_name || est.customer}</TableCell>
                        <TableCell>{est.license_plate || est.vehicle_vin}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(est.status)}>{est.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {(est.total_before_vat || 0).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {(est.diagnostic_fee || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {estimates.map((est) => (
                  <button
                    key={est.name}
                    type="button"
                    className="w-full rounded-lg border border-border bg-card p-4 text-left"
                    onClick={() => navigate('estimate-detail', { id: est.name })}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold">{est.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {est.customer_name || est.customer}
                        </p>
                      </div>
                      <Badge variant={statusVariant(est.status)}>{est.status}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" />
                        {est.license_plate || est.vehicle_vin}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        {(est.total_before_vat || 0).toLocaleString()} before VAT
                      </span>
                    </div>
                    {est.posting_date && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {format(new Date(est.posting_date), 'dd MMM yyyy')}
                      </p>
                    )}
                  </button>
                ))}
              </div>

              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
