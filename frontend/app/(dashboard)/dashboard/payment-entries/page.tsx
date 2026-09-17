'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { toast } from 'sonner';
import { DetailSheet, DetailSection, DetailRow } from '@/components/detail-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Search,
  Filter,
  Loader2,
  Trash2,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  MoreHorizontal,
  Eye,
  FilePenLine,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListRowActions } from '@/components/list-row-actions';
import { PrintFormatDropdown } from '@/components/print-format-dropdown';
import { ClearDateFiltersButton } from '@/components/clear-date-filters-button';
import { PaginationControls } from '@/components/pagination-controls';
import { usePersistedFilter } from '@/hooks/use-persisted-filter';
import { CreateAdvancePaymentDialog } from '@/components/payment-entries/create-advance-payment-dialog';
import * as paymentSvc from '@/services/paymentEntries';
import type { PaymentEntryDetail, PaymentEntryListItem } from '@/types/dms';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All (excl. Cancelled)' },
  { value: 'Advance', label: 'Advances only' },
  { value: 'Draft', label: 'Draft' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Cancelled', label: 'Cancelled' },
];

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

function statusBadge(row: PaymentEntryListItem) {
  if (row.docstatus === 2 || row.status === 'Cancelled') {
    return (
      <Badge className="bg-muted text-muted-foreground">
        <XCircle className="mr-1 h-3 w-3" />
        Cancelled
      </Badge>
    );
  }
  if (row.docstatus === 0 || row.status === 'Draft') {
    return (
      <Badge className="bg-muted text-muted-foreground">
        <Clock className="mr-1 h-3 w-3" />
        Draft
      </Badge>
    );
  }
  return (
    <Badge className="bg-[#2E7D32]/10 text-[#2E7D32]">
      <CheckCircle2 className="mr-1 h-3 w-3" />
      Submitted
    </Badge>
  );
}

export default function PaymentEntriesPage() {
  const { viewParams } = useNavigation();
  const { canCreate, canWrite, canCancel, canDelete } = usePermissions();

  const [searchQuery, setSearchQuery] = usePersistedFilter('payment-entries', 'search', '');
  const [statusFilter, setStatusFilter] = usePersistedFilter<string>(
    'payment-entries',
    'status',
    'all'
  );
  const [postingFrom, setPostingFrom] = usePersistedFilter('payment-entries', 'posting_from', '');
  const [postingTo, setPostingTo] = usePersistedFilter('payment-entries', 'posting_to', '');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<PaymentEntryDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [amendTarget, setAmendTarget] = useState<string | null>(null);
  const [amending, setAmending] = useState(false);
  const [amendEntry, setAmendEntry] = useState<PaymentEntryListItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const hasDateFilters = Boolean(postingFrom || postingTo);
  const clearDateFilters = useCallback(() => {
    setPostingFrom('');
    setPostingTo('');
  }, [setPostingFrom, setPostingTo]);

  useEffect(() => {
    const id = viewParams.get('id');
    if (id) setSelectedId(id);
    const status = viewParams.get('status');
    if (status && STATUS_OPTIONS.some((option) => option.value === status)) {
      setStatusFilter(status);
    }
  }, [viewParams, setStatusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, postingFrom, postingTo]);

  const listFilters = useMemo(
    () => ({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      search: searchQuery || undefined,
      advance_only: statusFilter === 'Advance',
      posting_from: postingFrom || undefined,
      posting_to: postingTo || undefined,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }),
    [statusFilter, searchQuery, postingFrom, postingTo, page, pageSize]
  );

  const { data: result, isLoading, error, mutate } = useSWR(
    ['payment-entries', listFilters],
    () => paymentSvc.listPaymentEntries(listFilters),
    { refreshInterval: 30000 }
  );

  const rows = result?.data ?? [];
  const totalItems = result?.total ?? 0;


  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    paymentSvc
      .getPaymentEntryDetail(selectedId)
      .then((row) => {
        if (!cancelled) setDetail(row);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setDetail(null);
          toast.error(err.message || 'Failed to load payment entry');
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const stats = useMemo(() => {
    const active = rows.filter((row) => row.docstatus === 1);
    return {
      received: active.reduce((sum, row) => sum + (row.paid_amount || 0), 0),
      advances: active
        .filter((row) => row.is_advance)
        .reduce((sum, row) => sum + (row.unallocated_amount || 0), 0),
      count: active.length,
    };
  }, [rows]);

  const defaultCurrency = rows[0]?.currency;

  const refreshDetail = useCallback(
    async (name: string) => {
      await mutate();
      if (selectedId === name) {
        try {
          setDetail(await paymentSvc.getPaymentEntryDetail(name));
        } catch {
          setDetail(null);
        }
      }
    },
    [mutate, selectedId]
  );

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await paymentSvc.cancelPaymentEntry(cancelTarget);
      toast.success('Payment entry cancelled');
      const name = cancelTarget;
      setCancelTarget(null);
      await refreshDetail(name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel payment entry');
    } finally {
      setCancelling(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await paymentSvc.deleteDraftPaymentEntry(deleteTarget);
      toast.success('Draft payment entry deleted');
      if (selectedId === deleteTarget) {
        setSelectedId(null);
        setDetail(null);
      }
      setDeleteTarget(null);
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete payment entry');
    } finally {
      setDeleting(false);
    }
  };

  const canCancelRow = (row: PaymentEntryListItem) =>
    canCancel('payment-entries') && row.docstatus === 1;
  const canAmendRow = (row: PaymentEntryListItem) =>
    (canCreate('payment-entries') || canWrite('payment-entries')) &&
    row.docstatus === 2 &&
    !row.already_amended;
  const canDeleteRow = (row: PaymentEntryListItem) =>
    canDelete('payment-entries') && row.docstatus === 0;

  const handleAmend = async () => {
    if (!amendTarget) return;
    setAmending(true);
    try {
      const result = await paymentSvc.amendPaymentEntry(amendTarget);
      toast.success(`Amended as ${result.name}`);
      setAmendTarget(null);
      await mutate();
      setSelectedId(result.name);
      setDetail(await paymentSvc.getPaymentEntryDetail(result.name));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to amend payment entry');
    } finally {
      setAmending(false);
    }
  };

  /**
   * Advances open the editable dialog (change amount / split modes), because the
   * replacement is a new advance. Invoice-linked receipts have no editable form,
   * so they are recreated from the cancelled copy instead.
   */
  const openAmend = (row: PaymentEntryListItem) => {
    if (row.is_advance) {
      setAmendEntry(row);
    } else {
      setAmendTarget(row.name);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-end gap-3">
        <PermittedCreateButton
          module="payment-entries"
          label="Advance Payment"
          onClick={() => setShowCreateDialog(true)}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        <Card className="gap-0 py-0">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Received
                </p>
                <p className="dms-stat-value mt-1 text-xl sm:text-2xl">
                  {formatMoney(stats.received, defaultCurrency)}
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-primary/10 p-1.5">
                <Banknote className="h-3.5 w-3.5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Available advance
                </p>
                <p className="dms-stat-value mt-1 text-xl sm:text-2xl text-[#F9A825]">
                  {formatMoney(stats.advances, defaultCurrency)}
                </p>
              </div>
              <div className="shrink-0 rounded-full bg-[#F9A825]/10 p-1.5">
                <Wallet className="h-3.5 w-3.5 text-[#F9A825]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="gap-0 py-0">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Entries
                </p>
                <p className="dms-stat-value mt-1 text-xl sm:text-2xl">{stats.count}</p>
              </div>
              <div className="shrink-0 rounded-full bg-[#1E88E5]/10 p-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#1E88E5]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, customer or reference…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl lg:flex-1">
              <div className="space-y-1.5">
                <Label htmlFor="payment-posting-from" className="text-xs text-muted-foreground">
                  Posting date from
                </Label>
                <Input
                  id="payment-posting-from"
                  type="date"
                  value={postingFrom}
                  max={postingTo || undefined}
                  onChange={(e) => setPostingFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="payment-posting-to" className="text-xs text-muted-foreground">
                  Posting date to
                </Label>
                <Input
                  id="payment-posting-to"
                  type="date"
                  value={postingTo}
                  min={postingFrom || undefined}
                  onChange={(e) => setPostingTo(e.target.value)}
                />
              </div>
            </div>
            <ClearDateFiltersButton
              onClear={clearDateFilters}
              disabled={!hasDateFilters}
              className="self-end sm:self-auto"
            />
          </div>
        </CardContent>
      </Card>


      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              Failed to load payment entries
            </div>
          ) : rows.length > 0 ? (
            <div className="dms-table-panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Entry #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Available</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[88px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.name}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(row.name)}
                    >
                      <TableCell>
                        <div className="font-medium">{row.name}</div>
                        {row.reference_no ? (
                          <div className="text-xs text-muted-foreground">{row.reference_no}</div>
                        ) : null}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {row.customer_name || row.customer || '—'}
                      </TableCell>
                      <TableCell>{row.posting_date || '—'}</TableCell>
                      <TableCell>{row.mode_of_payment || '—'}</TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.paid_amount, row.currency)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMoney(row.unallocated_amount, row.currency)}
                      </TableCell>
                      <TableCell>
                        {row.is_advance ? (
                          <Badge className="bg-[#F9A825]/10 text-[#F9A825]">Advance</Badge>
                        ) : (
                          <Badge variant="outline">Payment</Badge>
                        )}
                      </TableCell>
                      <TableCell>{statusBadge(row)}</TableCell>
                      <TableCell className="text-right">
                        <ListRowActions doctype="Payment Entry" docName={row.name}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title="More actions"
                                aria-label="More actions"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(row.name)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              {canCancelRow(row) ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setCancelTarget(row.name)}
                                >
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Cancel payment
                                </DropdownMenuItem>
                              ) : null}
                              {canAmendRow(row) ? (
                                <DropdownMenuItem onClick={() => openAmend(row)}>
                                  <FilePenLine className="mr-2 h-4 w-4" />
                                  Amend payment
                                </DropdownMenuItem>
                              ) : null}
                              {canDeleteRow(row) ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => setDeleteTarget(row.name)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete draft
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </ListRowActions>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Wallet className="h-8 w-8" />
              <p>No DMS payment entries yet.</p>
              {canCreate('payment-entries') ? (
                <Button variant="link" onClick={() => setShowCreateDialog(true)}>
                  Record an advance payment
                </Button>
              ) : null}
            </div>
          )}

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            loadedCount={rows.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>


      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={detail?.name || selectedId || ''}
        subtitle={detail?.payment_type}
        badge={detail ? { label: detail.status || 'Draft' } : undefined}
        isLoading={detailLoading}
        footer={
          selectedId ? (
            <div className="flex w-full flex-col gap-2">
              <div className="flex items-center gap-2">
                <ListRowActions
                  doctype="Payment Entry"
                  docName={selectedId}
                  showPrint={false}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-9 shrink-0 p-0"
                        title="More actions"
                        aria-label="More actions"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {detail && canCancelRow(detail) ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setCancelTarget(selectedId)}
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Cancel payment
                        </DropdownMenuItem>
                      ) : null}
                      {detail && canAmendRow(detail) ? (
                        <DropdownMenuItem onClick={() => openAmend(detail)}>
                          <FilePenLine className="mr-2 h-4 w-4" />
                          Amend payment
                        </DropdownMenuItem>
                      ) : null}
                      {detail && canDeleteRow(detail) ? (
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(selectedId)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete draft
                        </DropdownMenuItem>
                      ) : null}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ListRowActions>
                <div className="min-w-0 flex-1">
                  <PrintFormatDropdown
                    doctype="Payment Entry"
                    docName={selectedId}
                    className="w-full"
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSelectedId(null)}
              >
                Close
              </Button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <>
            <DetailSection title="Entry">
              <DetailRow label="Type" value={detail.payment_type} />
              <DetailRow label="Customer" value={detail.customer_name || detail.customer} />
              <DetailRow label="Company" value={detail.company} />
              <DetailRow label="Posting date" value={detail.posting_date} />
              <DetailRow label="Mode of payment" value={detail.mode_of_payment} />
              <DetailRow label="Reference no" value={detail.reference_no} />
              <DetailRow label="Amount" value={formatMoney(detail.paid_amount, detail.currency)} />
              <DetailRow
                label="Allocated"
                value={formatMoney(detail.total_allocated_amount || 0, detail.currency)}
              />
              <DetailRow
                label="Available (unallocated)"
                value={formatMoney(detail.unallocated_amount, detail.currency)}
              />
              {detail.remarks ? <DetailRow label="Remarks" value={detail.remarks} /> : null}
              {detail.amended_from ? (
                <DetailRow label="Amended from" value={detail.amended_from} />
              ) : null}
              {detail.amended_as ? (
                <DetailRow label="Amended as" value={detail.amended_as} />
              ) : null}
            </DetailSection>

            {detail.job_card || detail.service_estimate ? (
              <DetailSection title="Source">
                {detail.job_card ? <DetailRow label="Job Card" value={detail.job_card} /> : null}
                {detail.service_estimate ? (
                  <DetailRow label="Service Estimate" value={detail.service_estimate} />
                ) : null}
              </DetailSection>
            ) : null}

            {detail.references && detail.references.length > 0 ? (
              <DetailSection title={`References (${detail.references.length})`}>
                <div className="overflow-x-auto rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead className="text-right">Allocated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detail.references.map((ref, index) => (
                        <TableRow key={`${ref.reference_name}-${index}`}>
                          <TableCell>{ref.reference_doctype}</TableCell>
                          <TableCell>{ref.reference_name}</TableCell>
                          <TableCell className="text-right">
                            {formatMoney(ref.allocated_amount || 0, detail.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DetailSection>
            ) : (
              <DetailSection title="Advance">
                <p className="text-sm text-muted-foreground">
                  Unallocated receipt — available to settle future invoices for this customer.
                </p>
              </DetailSection>
            )}
          </>
        ) : null}
      </DetailSheet>


      <CreateAdvancePaymentDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={() => {
          void mutate();
        }}
      />

      <CreateAdvancePaymentDialog
        open={!!amendEntry}
        onOpenChange={(open) => {
          if (!open) setAmendEntry(null);
        }}
        customer={amendEntry?.customer}
        customerName={amendEntry?.customer_name}
        company={amendEntry?.company}
        jobCard={amendEntry?.job_card || undefined}
        serviceEstimate={amendEntry?.service_estimate || undefined}
        amendEntry={amendEntry}
        onCreated={(result) => {
          setAmendEntry(null);
          void mutate();
          if (result?.name) {
            setSelectedId(result.name);
            void paymentSvc
              .getPaymentEntryDetail(result.name)
              .then(setDetail)
              .catch(() => setDetail(null));
          }
        }}
      />

      <AlertDialog
        open={!!amendTarget}
        onOpenChange={(open) => {
          if (!open) setAmendTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Amend payment entry</AlertDialogTitle>
            <AlertDialogDescription>
              Amend cancelled <strong>{amendTarget}</strong>? A new payment entry is created with
              the same details, linked to it as the amendment, and submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={amending}>Keep cancelled</AlertDialogCancel>
            <AlertDialogAction
              disabled={amending}
              onClick={(e) => {
                e.preventDefault();
                void handleAmend();
              }}
            >
              {amending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Amending…
                </>
              ) : (
                'Amend entry'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) setCancelTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel payment entry</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel <strong>{cancelTarget}</strong>? The advance / receipt will no longer count
              towards the customer balance.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
            >
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling…
                </>
              ) : (
                'Cancel entry'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft payment entry</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete draft <strong>{deleteTarget}</strong>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep draft</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting…
                </>
              ) : (
                'Delete draft'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

