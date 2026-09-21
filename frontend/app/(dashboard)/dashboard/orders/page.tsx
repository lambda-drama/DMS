'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Ban,
  CheckCircle2,
  Eye,
  FilePenLine,
  FileText,
  Loader2,
  MoreHorizontal,
  Receipt,
  Search,
  ShoppingCart,
  Trash2,
} from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { DetailSheet, DetailRow, DetailSection } from '@/components/detail-sheet';
import { ListRowActions } from '@/components/list-row-actions';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { CreateOrderInvoiceDialog } from '@/components/orders/create-order-invoice-dialog';
import { RecordOrderPaymentDialog } from '@/components/orders/record-order-payment-dialog';
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

const STATUS_OPTIONS = ['Draft', 'To Deliver and Bill', 'To Bill', 'To Deliver', 'Completed', 'Cancelled'];

export default function OrdersPage() {
  const { viewParams, navigate } = useNavigation();
  const { canCreate, canDelete, canSubmit, canCancel } = usePermissions();

  const [search, setSearch] = usePersistedFilter('orders', 'search', '');
  const [status, setStatus] = usePersistedFilter('orders', 'status', '');
  const [debounced, setDebounced] = useState(search);
  const [selectedId, setSelectedId] = useState<string | null>(viewParams.get('name'));
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [actionTarget, setActionTarget] = useState<DmsOrderListItem | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const canOrder = canCreate('orders');
  const canCollectPayment = canCreate('orders') || canCreate('payment-entries');
  const canRaiseInvoice = canCreate('orders') || canCreate('invoices');

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading, error, mutate } = useSWR(
    ['dms-orders', debounced, status],
    () =>
      ordersSvc.listDmsOrders({
        search: debounced || undefined,
        status: status || undefined,
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

  // Accepts a table row or the full detail — the dialogs only need these fields.
  const canPayFor = (order: DmsOrderListItem | null | undefined) =>
    Boolean(order) && order!.docstatus === 1 && !order!.converted && (order!.balance || 0) > 0.0001;

  const canInvoiceFor = (order: DmsOrderListItem | null | undefined) =>
    Boolean(order) && order!.docstatus === 1 && !order!.converted;

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

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Customer orders for parts that are not in stock — take a payment now, invoice later
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
              onValueChange={(value) => setStatus(value === 'all' ? '' : value)}
            >
              <SelectTrigger className="sm:w-56">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
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
                    <TableHead>Expected</TableHead>
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
              <DetailRow label="Expected delivery" value={selected.delivery_date} />
              <DetailRow label="Warehouse" value={selected.warehouse || undefined} />
              <DetailRow label="Status" value={selected.status} />
            </DetailSection>
            <DetailSection title="Amounts">
              <DetailRow
                label="Order total"
                value={formatMoney(selected.grand_total, selected.currency)}
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
    </div>
  );
}
