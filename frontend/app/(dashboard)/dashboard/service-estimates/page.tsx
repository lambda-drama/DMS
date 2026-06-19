'use client';

import { useEffect, useState } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileSpreadsheet, Search, User, Car, Pencil, Trash2 } from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import * as estimatesSvc from '@/services/serviceEstimates';
import type { DMSServiceEstimate, ServiceEstimateStatus } from '@/types/dms';
import { format } from 'date-fns';
import { toast } from 'sonner';

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

function isEstimateEditable(status: ServiceEstimateStatus) {
  return !['Rejected', 'Cancelled'].includes(status);
}

function canDeleteEstimateRow(est: DMSServiceEstimate) {
  return !est.job_card && !est.diagnostic_invoice;
}

export default function ServiceEstimatesPage() {
  const { navigate } = useNavigation();
  const { canWrite, canDelete } = usePermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [deleteTarget, setDeleteTarget] = useState<DMSServiceEstimate | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: result, isLoading, error, mutate } = useServiceEstimates({
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: searchQuery || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const estimates = result?.data ?? [];
  const totalItems = result?.total || 0;
  const canEditAny = canWrite('service-estimates');
  const canDeleteAny = canDelete('service-estimates');

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await estimatesSvc.deleteServiceEstimate(deleteTarget.name);
      toast.success('Service estimate deleted');
      setDeleteTarget(null);
      await mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete estimate');
    } finally {
      setDeleting(false);
    }
  };

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
              <div className="dms-table-panel hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Estimate</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Before VAT</TableHead>
                      <TableHead className="text-right">Diagnostic Fee</TableHead>
                      <TableHead className="text-right w-[88px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {estimates.map((est) => {
                      const showEdit = canEditAny && isEstimateEditable(est.status);
                      const showDelete = canDeleteAny && canDeleteEstimateRow(est);
                      return (
                        <TableRow key={est.name} className="hover:bg-muted/50">
                          <TableCell>
                            <button
                              type="button"
                              onClick={() => navigate('estimate-detail', { id: est.name })}
                              className="font-medium text-primary hover:underline"
                            >
                              {est.name}
                            </button>
                          </TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              {showEdit ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  title="Edit"
                                  onClick={() =>
                                    navigate('estimate-detail', { id: est.name, tab: 'estimation' })
                                  }
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                              ) : null}
                              {showDelete ? (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                  title="Delete"
                                  onClick={() => setDeleteTarget(est)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-3 md:hidden">
                {estimates.map((est) => {
                  const showEdit = canEditAny && isEstimateEditable(est.status);
                  const showDelete = canDeleteAny && canDeleteEstimateRow(est);
                  return (
                    <div
                      key={est.name}
                      className="rounded-lg border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <button
                            type="button"
                            onClick={() => navigate('estimate-detail', { id: est.name })}
                            className="font-semibold text-primary hover:underline"
                          >
                            {est.name}
                          </button>
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
                      {(showEdit || showDelete) && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {showEdit ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate('estimate-detail', { id: est.name, tab: 'estimation' })
                              }
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </Button>
                          ) : null}
                          {showDelete ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(est)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </div>
                  );
                })}
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

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {deleteTarget?.name}. Estimates with a linked job card or
              diagnostic invoice cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete estimate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
