'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  FilePenLine,
  FileText,
  Loader2,
  MoreHorizontal,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { DetailSheet, DetailRow, DetailSection } from '@/components/detail-sheet';
import { ListRowActions } from '@/components/list-row-actions';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { CreateOrderInvoiceDialog } from '@/components/orders/create-order-invoice-dialog';
import { RecordOrderPaymentDialog } from '@/components/orders/record-order-payment-dialog';
import { SelectServiceAdvisorDialog } from '@/components/orders/select-service-advisor-dialog';
import * as inspectionsSvc from '@/services/inspections';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { usePersistedFilter } from '@/hooks/use-persisted-filter';
import * as ordersSvc from '@/services/orders';
import type { DmsOrderListItem } from '@/services/orders';

function formatMoney(amount?: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'ETB',
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

const STATUS_OPTIONS = [
  'Draft',
  'To Deliver and Bill',
  'To Bill',
  'To Deliver',
  'Completed',
  'Cancelled',
];

export default function OrdersPage() {
  const { viewParams, navigate } = useNavigation();
  const { canCreate, canWrite, canDelete, canSubmit, canCancel } = usePermissions();

  const [search, setSearch] = usePersistedFilter('orders', 'search', '');
  const [status, setStatus] = usePersistedFilter('orders', 'status', 'all');
  const [debounced, setDebounced] = useState(search);
  const [selectedId, setSelectedId] = useState<string | null>(viewParams.get('name'));
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [advisorOpen, setAdvisorOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<DmsOrderListItem | null>(null);
  const [advisorOrder, setAdvisorOrder] = useState<
    ordersSvc.DmsOrderDetail | DmsOrderListItem | null
  >(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [amending, setAmending] = useState(false);

  const canOrder = canCreate('orders');
  const canCollectPayment = canCreate('orders') || canCreate('payment-entries');
  const canRaiseInvoice = canCreate('orders') || canCreate('invoices');
  const canInspect = canCreate('inspections');
  const canMakeJobCard = canCreate('job-cards');

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading, error, mutate } = useSWR(
    ['dms-orders', debounced, status],
    () =>
      ordersSvc.listDmsOrders({
        search: debounced || undefined,
        status: status && status !== 'all' ? status : undefined,
        limit: 100,
      })
  );

  const {
    data: selected,
    isLoading: detailLoading,
    mutate: mutateDetail,
  } = useSWR(selectedId ? ['dms-order', selectedId] : null, () =>
    ordersSvc.getDmsOrder(selectedId!)
  );

  const rows = data?.data || [];
  const total = data?.total || 0;

  function isDraft(row: Pick<DmsOrderListItem, 'docstatus' | 'status'>) {
    return row.docstatus === 0 || row.status === 'Draft';
  }

  function isCancelled(row: Pick<DmsOrderListItem, 'docstatus' | 'status'>) {
    return row.docstatus === 2 || row.status === 'Cancelled';
  }

  // A cancelled order can be amended once (Desk rule); afterwards the replacement
  // draft can be opened instead.
  const canAmendFor = (
    row: Pick<DmsOrderListItem, 'docstatus' | 'status' | 'already_amended'>
  ) => (canCreate('orders') || canWrite('orders')) && isCancelled(row) && !row.already_amended;

  // Accepts a table row or the full detail — the dialogs only need these fields.
  const canPayFor = (order: DmsOrderListItem | null | undefined) =>
    Boolean(order) && order!.docstatus === 1 && !order!.converted && (order!.balance || 0) > 0.0001;

  const canInvoiceFor = (order: DmsOrderListItem | null | undefined) =>
    Boolean(order) &&
    order!.docstatus === 1 &&
    !order!.converted &&
    !('job_card' in (order || {}) && (order as ordersSvc.DmsOrderDetail).job_card);

  function canWorkshop(order: DmsOrderListItem | null | undefined) {
    return Boolean(order) && order!.docstatus === 1 && !order!.converted && !isCancelled(order!);
  }

  function goToOrderInspection(order: ordersSvc.DmsOrderDetail | DmsOrderListItem) {
    const detail = order as ordersSvc.DmsOrderDetail;
    if (detail.inspection && detail.inspection_docstatus === 0) {
      navigate('inspection-new', { id: detail.inspection, order: order.name });
      return;
    }
    if (detail.inspection) {
      navigate('inspection-detail', { id: detail.inspection });
      return;
    }
    navigate('inspection-new', { order: order.name });
  }

  async function createJobCardFromOrderWithAdvisor(
    order: ordersSvc.DmsOrderDetail | DmsOrderListItem,
    serviceAdvisor?: string
  ) {
    setBusy('create job card');
    try {
      const created = await ordersSvc.createJobCardFromOrder(order.name, serviceAdvisor);
      toast.success(
        created.existing
          ? 'Opened the existing job card for this order'
          : 'Draft job card created with the order items and downpayment'
      );
      await refresh();
      setAdvisorOpen(false);
      setAdvisorOrder(null);
      if (created.name) {
        navigate('job-card-new', { id: created.name });
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create a job card from this order');
    } finally {
      setBusy(null);
    }
  }

  async function handleCreateJobCard(order: ordersSvc.DmsOrderDetail | DmsOrderListItem) {
    const detail = order as ordersSvc.DmsOrderDetail;
    if (detail.job_card) {
      if ((detail.job_card_status || '').toLowerCase() === 'draft') {
        navigate('job-card-new', { id: detail.job_card });
      } else {
        navigate('job-card-detail', { id: detail.job_card });
      }
      return;
    }
    setBusy('create job card');
    try {
      let advisorName = '';
      try {
        const current = await inspectionsSvc.getCurrentServiceAdvisor();
        advisorName = current?.name || '';
      } catch {
        advisorName = '';
      }
      if (advisorName) {
        await createJobCardFromOrderWithAdvisor(order, advisorName);
        return;
      }
      setAdvisorOrder(order);
      setAdvisorOpen(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create a job card from this order');
    } finally {
      setBusy(null);
    }
  }

  function openPayment(order: DmsOrderListItem) {
    setActionTarget(order);
    setPaymentOpen(true);
  }

  function openInvoice(order: DmsOrderListItem) {
    setActionTarget(order);
    setInvoiceOpen(true);
  }

  async function refresh() {
    void mutate();
    if (selectedId) void mutateDetail();
  }

  async function runAction(label: string, action: () => Promise<unknown>) {
    setBusy(label);
    try {
      await action();
      await refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${label}`);
    } finally {
      setBusy(null);
    }
  }

  async function handleAmend(name: string) {
    setAmending(true);
    try {
      const draft = await ordersSvc.amendDmsOrder(name);
      toast.success(`Amended draft ${draft.name} created`);
      setSelectedId(null);
      // Refresh the list so the cancelled order now shows its amendment link.
      void mutate();
      navigate('order-new', { id: draft.name });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to amend the order');
    } finally {
      setAmending(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Customer orders for parts and labour — take a downpayment now, then inspect or open a
            job card when the customer comes in
          </p>
        </div>
        <PermittedCreateButton
          module="orders"
          label="New Order"
          onClick={() => navigate('order-new')}
        />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search order no or customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select
              value={status || 'all'}
              onValueChange={setStatus}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (excl. Cancelled)</SelectItem>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">
              {(error as Error).message || 'Failed to load orders'}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <ShoppingCart className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No orders found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Order date</TableHead>
                    <TableHead>Valid To</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.name}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(row.name)}
                    >
                      <TableCell className="text-sm font-medium">{row.name}</TableCell>
                      <TableCell className="text-sm">
                        {row.customer_name || row.customer || '—'}
                      </TableCell>
                      <TableCell className="text-sm">{row.transaction_date || '—'}</TableCell>
                      <TableCell className="text-sm">{row.delivery_date || '—'}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatMoney(row.grand_total, row.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatMoney(row.advance_paid, row.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatMoney(row.balance, row.currency)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isCancelled(row) ? (
                            <Badge variant="outline" className="text-muted-foreground">
                              Cancelled
                            </Badge>
                          ) : isDraft(row) ? (
                            <Badge variant="outline">Draft</Badge>
                          ) : row.converted ? (
                            <Badge variant="secondary">Invoiced</Badge>
                          ) : (
                            <Badge>{row.status || 'Submitted'}</Badge>
                          )}
                          {row.apply_tax_withholding ? (
                            <Badge
                              variant="outline"
                              title={`Tax withholding (TCS) applies on this order's invoice${
                                row.tax_withholding_category
                                  ? ` — ${row.tax_withholding_category}`
                                  : ''
                              }`}
                            >
                              TCS
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell onClick={(event) => event.stopPropagation()}>
                        <ListRowActions doctype="Sales Order" docName={row.name}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                disabled={busy !== null}
                              >
                                {busy !== null ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(row.name)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Order
                              </DropdownMenuItem>

                              {isDraft(row) ? (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => navigate('order-new', { id: row.name })}
                                  >
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    Edit Draft
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    disabled={!canSubmit('orders')}
                                    onClick={() =>
                                      void runAction('submit the order', () =>
                                        ordersSvc.submitDmsOrder(row.name)
                                      )
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Submit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    disabled={!canDelete('orders')}
                                    onClick={() =>
                                      void runAction('delete the order', () =>
                                        ordersSvc.deleteDraftDmsOrder(row.name)
                                      )
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Draft
                                  </DropdownMenuItem>
                                </>
                              ) : (
                                <>
                                  {canCollectPayment && canPayFor(row) ? (
                                    <DropdownMenuItem onClick={() => openPayment(row)}>
                                      <Receipt className="mr-2 h-4 w-4" />
                                      Record Payment
                                    </DropdownMenuItem>
                                  ) : null}
                                  {canInspect && canWorkshop(row) ? (
                                    <DropdownMenuItem
                                      onClick={() => goToOrderInspection(row)}
                                    >
                                      <ClipboardCheck className="mr-2 h-4 w-4" />
                                      Go to Inspection
                                    </DropdownMenuItem>
                                  ) : null}
                                  {canMakeJobCard && canWorkshop(row) ? (
                                    <DropdownMenuItem
                                      disabled={busy !== null}
                                      onClick={() => void handleCreateJobCard(row)}
                                    >
                                      <Wrench className="mr-2 h-4 w-4" />
                                      Create Job Card
                                    </DropdownMenuItem>
                                  ) : null}
                                  {canRaiseInvoice && canInvoiceFor(row) ? (
                                    <DropdownMenuItem onClick={() => openInvoice(row)}>
                                      <FileText className="mr-2 h-4 w-4" />
                                      Create Invoice
                                    </DropdownMenuItem>
                                  ) : null}
                                  {!isCancelled(row) && !row.converted ? (
                                    <DropdownMenuItem
                                      className="text-destructive focus:text-destructive"
                                      disabled={!canCancel('orders')}
                                      onClick={() =>
                                        void runAction('cancel the order', () =>
                                          ordersSvc.cancelDmsOrder(row.name)
                                        )
                                      }
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Cancel
                                    </DropdownMenuItem>
                                  ) : null}
                                  {canAmendFor(row) ? (
                                    <DropdownMenuItem
                                      disabled={amending}
                                      onClick={() => void handleAmend(row.name)}
                                    >
                                      <FilePenLine className="mr-2 h-4 w-4" />
                                      Amend Order
                                    </DropdownMenuItem>
                                  ) : null}
                                  {isCancelled(row) && row.amended_as ? (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        navigate('order-new', { id: row.amended_as as string })
                                      }
                                    >
                                      <FilePenLine className="mr-2 h-4 w-4" />
                                      Open Amendment
                                    </DropdownMenuItem>
                                  ) : null}
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </ListRowActions>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            {total > rows.length
              ? `Showing the latest ${rows.length} of ${total} orders — refine the search to narrow it down.`
              : `${rows.length} order${rows.length === 1 ? '' : 's'}`}
          </p>
        </CardContent>
      </Card>

      <DetailSheet
        open={Boolean(selectedId) && !paymentOpen && !invoiceOpen}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected ? `Order ${selected.name}` : selectedId || 'Order'}
        subtitle={
          selected
            ? `${selected.customer_name || selected.customer} · ${selected.transaction_date}`
            : undefined
        }
        badge={
          selected
            ? isCancelled(selected)
              ? { label: 'Cancelled', variant: 'outline' }
              : isDraft(selected)
                ? { label: 'Draft', variant: 'outline' }
                : selected.converted
                  ? { label: 'Invoiced', variant: 'secondary' }
                  : { label: selected.status || 'Submitted', variant: 'secondary' }
            : undefined
        }
        footer={
          selected ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              {isDraft(selected) ? (
                <>
                  <Button
                    variant="outline"
                    disabled={!canOrder || busy !== null}
                    onClick={() => navigate('order-new', { id: selected.name })}
                  >
                    <FilePenLine className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    disabled={!canSubmit('orders') || busy !== null}
                    onClick={() =>
                      void runAction('submit the order', () =>
                        ordersSvc.submitDmsOrder(selected.name)
                      )
                    }
                  >
                    {busy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                    )}
                    Submit
                  </Button>
                  <Button
                    variant="outline"
                    className="text-destructive"
                    disabled={!canDelete('orders') || busy !== null}
                    onClick={() =>
                      void runAction('delete the order', () =>
                        ordersSvc.deleteDraftDmsOrder(selected.name)
                      )
                    }
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Draft
                  </Button>
                </>
              ) : (
                <>
                  {canCollectPayment && canPayFor(selected) ? (
                    <Button disabled={busy !== null} onClick={() => openPayment(selected)}>
                      <Receipt className="mr-2 h-4 w-4" />
                      Record Payment
                    </Button>
                  ) : null}
                  {canInspect && canWorkshop(selected) ? (
                    <Button
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => goToOrderInspection(selected)}
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      {selected.inspection ? 'Open Inspection' : 'Go to Inspection'}
                    </Button>
                  ) : null}
                  {canMakeJobCard && canWorkshop(selected) ? (
                    <Button
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() => void handleCreateJobCard(selected)}
                    >
                      {busy === 'create job card' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wrench className="mr-2 h-4 w-4" />
                      )}
                      {selected.job_card ? 'Open Job Card' : 'Create Job Card'}
                    </Button>
                  ) : null}
                  {canRaiseInvoice && canInvoiceFor(selected) ? (
                    <Button
                      variant={canPayFor(selected) ? 'outline' : 'default'}
                      disabled={busy !== null}
                      onClick={() => openInvoice(selected)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Create Invoice
                    </Button>
                  ) : null}
                  {!isCancelled(selected) ? (
                    <Button
                      variant="outline"
                      className="text-destructive"
                      disabled={!canCancel('orders') || busy !== null || selected.converted}
                      onClick={() =>
                        void runAction('cancel the order', () =>
                          ordersSvc.cancelDmsOrder(selected.name)
                        )
                      }
                    >
                      <Ban className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  ) : null}
                  {canAmendFor(selected) ? (
                    <Button
                      disabled={amending || busy !== null}
                      onClick={() => void handleAmend(selected.name)}
                    >
                      {amending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FilePenLine className="mr-2 h-4 w-4" />
                      )}
                      Amend Order
                    </Button>
                  ) : null}
                  {isCancelled(selected) && selected.amended_as ? (
                    <Button
                      variant="outline"
                      disabled={busy !== null}
                      onClick={() =>
                        navigate('order-new', { id: selected.amended_as as string })
                      }
                    >
                      <FilePenLine className="mr-2 h-4 w-4" />
                      Open Amendment
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          ) : null
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : selected ? (
          <>
            <DetailSection title="Order">
              <DetailRow label="Customer" value={selected.customer_name || selected.customer} />
              <DetailRow label="Company" value={selected.company} />
              <DetailRow label="Order date" value={selected.transaction_date} />
              <DetailRow label="Valid To" value={selected.delivery_date} />
              <DetailRow label="Warehouse" value={selected.warehouse || undefined} />
              <DetailRow label="Status" value={selected.status} />
              {selected.vehicle_vin ? (
                <DetailRow
                  label="Vehicle"
                  value={selected.vin_number || selected.vehicle_vin}
                />
              ) : null}
              {selected.inspection ? (
                <DetailRow label="Inspection" value={selected.inspection} />
              ) : null}
              {selected.estimate ? (
                <DetailRow label="Estimate" value={selected.estimate} />
              ) : null}
              {selected.job_card ? (
                <DetailRow label="Job Card" value={selected.job_card} />
              ) : null}
              {selected.amended_from ? (
                <DetailRow label="Amended from" value={selected.amended_from} />
              ) : null}
              {selected.amended_as ? (
                <DetailRow label="Amended as" value={selected.amended_as} />
              ) : null}
            </DetailSection>
            <DetailSection title="Amounts">
              <DetailRow
                label="Net total"
                value={formatMoney(selected.net_total ?? selected.grand_total, selected.currency)}
              />
              <DetailRow
                label="VAT"
                value={
                  Number(selected.total_taxes_and_charges) > 0
                    ? formatMoney(selected.total_taxes_and_charges, selected.currency)
                    : 'Not included'
                }
              />
              <DetailRow
                label="Order total"
                value={formatMoney(selected.grand_total, selected.currency)}
              />
              <DetailRow
                label="Tax withholding (TCS)"
                value={
                  selected.apply_tax_withholding
                    ? [selected.tax_withholding_category, selected.tax_withholding_group]
                        .filter(Boolean)
                        .join(' · ') || 'Applied on the invoice'
                    : 'Not applied'
                }
              />
              <DetailRow
                label="Paid / advance"
                value={formatMoney(selected.advance_paid, selected.currency)}
              />
              <DetailRow label="Balance" value={formatMoney(selected.balance, selected.currency)} />
            </DetailSection>
            <DetailSection title="Items">
              {selected.items.length ? (
                <div className="space-y-2">
                  {selected.items.map((item) => (
                    <div
                      key={`${item.spare_part}-${item.item_code}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{item.item_name || item.spare_part}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[item.spare_part, `${item.qty} × ${formatMoney(item.rate, selected.currency)}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <span className="whitespace-nowrap tabular-nums">
                        {formatMoney(item.amount, selected.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No items.</p>
              )}
            </DetailSection>
            <DetailSection title="Labour">
              {selected.labour.length ? (
                <div className="space-y-2">
                  {selected.labour.map((line, index) => (
                    <div
                      key={`${line.vehicle_service_item}-${index}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {line.vehicle_service_item_name || line.vehicle_service_item}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[`${line.hours} × ${formatMoney(line.rate_per_hour, selected.currency)}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <span className="whitespace-nowrap tabular-nums">
                        {formatMoney(line.amount, selected.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No labour lines.</p>
              )}
            </DetailSection>
            <DetailSection title="Payments">
              {selected.payments.length ? (
                <div className="space-y-2">
                  {selected.payments.map((payment) => (
                    <div
                      key={payment.name}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{payment.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {[payment.posting_date, payment.mode_of_payment, payment.reference_no]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                      <span className="whitespace-nowrap tabular-nums">
                        {formatMoney(payment.allocated_amount, selected.currency)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No payment recorded yet.</p>
              )}
            </DetailSection>
            <DetailSection title="Invoices">
              {selected.sales_invoices.length ? (
                <div className="space-y-1 text-sm">
                  {selected.sales_invoices.map((invoice) => (
                    <p key={invoice} className="font-medium">
                      {invoice}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not invoiced yet.</p>
              )}
            </DetailSection>
            {selected.remarks ? (
              <DetailSection title="Remarks">
                <DetailRow label="Remarks" value={selected.remarks} />
              </DetailSection>
            ) : null}
          </>
        ) : null}
      </DetailSheet>

      <RecordOrderPaymentDialog
        open={paymentOpen}
        onOpenChange={(next) => {
          setPaymentOpen(next);
          if (!next) setActionTarget(null);
        }}
        order={actionTarget}
        onPaid={() => void refresh()}
      />

      <CreateOrderInvoiceDialog
        open={invoiceOpen}
        onOpenChange={(next) => {
          setInvoiceOpen(next);
          if (!next) setActionTarget(null);
        }}
        order={actionTarget}
        onCreated={() => void refresh()}
      />

      <SelectServiceAdvisorDialog
        open={advisorOpen}
        onOpenChange={(next) => {
          setAdvisorOpen(next);
          if (!next) setAdvisorOrder(null);
        }}
        orderName={advisorOrder?.name}
        saving={busy === 'create job card'}
        onConfirm={(advisor) => {
          if (!advisorOrder) return;
          void createJobCardFromOrderWithAdvisor(advisorOrder, advisor);
        }}
      />
    </div>
  );
}
