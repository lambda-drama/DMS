"use client";

import { formatDate } from '@/lib/date-format';

import { useState, useEffect, useMemo, useCallback } from "react";
import { mutate } from "swr";
import { useNavigation } from "@/contexts/navigation-context";
import { usePermissions } from "@/contexts/permissions-context";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { useInvoices } from "@/hooks/use-dms";
import { toast } from "sonner";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Receipt,
  Banknote,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Send,
  CreditCard,
  XCircle,
  Loader2,
  FilePenLine,
  Trash2,
  RefreshCw,
  Undo2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CollectPaymentDialog } from "@/components/invoices/collect-payment-dialog";
import { AmendInvoiceDialog } from "@/components/invoices/amend-invoice-dialog";
import { CreditNoteDialog } from "@/components/invoices/credit-note-dialog";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";
import { ListRowActions } from "@/components/list-row-actions";
import { ClearDateFiltersButton } from "@/components/clear-date-filters-button";
import { PaginationControls } from "@/components/pagination-controls";
import { LOAD_MORE_PAGE_SIZE, useLoadMore } from "@/hooks/use-load-more";
import { usePersistedFilter } from "@/hooks/use-persisted-filter";
import * as invoicesSvc from "@/services/invoices";
import type { SalesInvoiceDetail, SalesInvoiceListItem } from "@/types/dms";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  Unpaid: { label: "Unpaid", color: "bg-[#1E88E5]/10 text-[#1E88E5]", icon: Send },
  Paid: { label: "Paid", color: "bg-[#2E7D32]/10 text-[#2E7D32]", icon: CheckCircle2 },
  "Partly Paid": { label: "Partly Paid", color: "bg-[#F9A825]/10 text-[#F9A825]", icon: AlertCircle },
  Overdue: { label: "Overdue", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
  Cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: AlertCircle },
  Return: { label: "Return", color: "bg-muted text-muted-foreground", icon: AlertCircle },
};

function formatCurrency(amount: number, currency?: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Compact KPI card used by the invoice summary row. */
function SummaryCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconClass,
  valueClass,
  compact = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconBg: string;
  iconClass: string;
  valueClass?: string;
  compact?: boolean;
}) {
  return (
    <Card className="gap-0 py-0">
      <CardContent className={compact ? "px-3 py-2.5" : "px-3.5 py-3"}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className={`${
                compact ? "text-[10px]" : "text-[11px]"
              } font-medium uppercase tracking-[0.08em] text-muted-foreground`}
            >
              {label}
            </p>
            <p
              className={`dms-stat-value mt-1 ${
                compact ? "text-base sm:text-lg" : "text-lg sm:text-xl"
              } ${valueClass || ""}`}
            >
              {value}
            </p>
          </div>
          <div className={`shrink-0 rounded-full p-1.5 ${iconBg}`}>
            <Icon className={`${compact ? "h-3 w-3" : "h-3.5 w-3.5"} ${iconClass}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InvoicesPage() {
  const { navigate, viewParams } = useNavigation();
  const [searchQuery, setSearchQuery] = usePersistedFilter("invoices", "search", "");
  const [statusFilter, setStatusFilter] = usePersistedFilter<string>("invoices", "status", "all");
  const [postingFrom, setPostingFrom] = usePersistedFilter("invoices", "posting_from", "");
  const [postingTo, setPostingTo] = usePersistedFilter("invoices", "posting_to", "");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelInvoiceId, setCancelInvoiceId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showAmendDialog, setShowAmendDialog] = useState(false);
  const [amendInvoiceId, setAmendInvoiceId] = useState<string | null>(null);
  const [showCreditNoteDialog, setShowCreditNoteDialog] = useState(false);
  const [creditNoteInvoiceId, setCreditNoteInvoiceId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [updatingJobCardPrices, setUpdatingJobCardPrices] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<SalesInvoiceDetail | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { canCancel, canCreate, canWrite, canDelete } = usePermissions();

  const hasDateFilters = Boolean(postingFrom || postingTo);

  const clearDateFilters = useCallback(() => {
    setPostingFrom("");
    setPostingTo("");
  }, [setPostingFrom, setPostingTo]);

  useEffect(() => {
    const id = viewParams.get("id");
    if (id) setSelectedId(id);
    const status = viewParams.get("status");
    if (status && (status === "all" || status in statusConfig)) {
      setStatusFilter(status);
    }
  }, [viewParams]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery, postingFrom, postingTo]);

  const listFilters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
    posting_from: postingFrom || undefined,
    posting_to: postingTo || undefined,
  };

  const { data: result, isLoading, error } = useInvoices({
    ...listFilters,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const totalItems = result?.total || 0;
  const loadMoreResetKey = [statusFilter, searchQuery, postingFrom, postingTo, page, pageSize].join("|");
  const {
    items: invoices,
    loadedCount,
    isLoadingMore,
    loadMore,
  } = useLoadMore<SalesInvoiceListItem>({
    items: result?.data,
    total: totalItems,
    offset: (page - 1) * pageSize,
    resetKey: loadMoreResetKey,
    enabled: pageSize >= LOAD_MORE_PAGE_SIZE,
    fetchMore: async (offset, limit) =>
      (await invoicesSvc.listInvoicesPaginated({ ...listFilters, limit, offset })).data,
  });

  const selectedInvoice = invoices?.find((i) => i.name === selectedId);

  useEffect(() => {
    if (!selectedId) {
      setInvoiceDetail(null);
      return;
    }
    invoicesSvc.getSalesInvoiceDetail(selectedId).then(setInvoiceDetail).catch(() => setInvoiceDetail(null));
  }, [selectedId]);

  const canCollectFor = (inv: Pick<SalesInvoiceListItem, "docstatus" | "outstanding_amount">) =>
    inv.docstatus === 1 && (inv.outstanding_amount || 0) > 0;

  const canCancelFor = (inv: Pick<SalesInvoiceListItem, "docstatus" | "status">) =>
    canCancel("invoices") && inv.docstatus === 1 && inv.status !== "Cancelled";

  const isDraftInvoice = (
    inv: Pick<SalesInvoiceListItem, "docstatus" | "status">
  ) => inv.docstatus === 0 || inv.status === "Draft";

  const isCancelledInvoice = (
    inv: Pick<SalesInvoiceListItem, "docstatus" | "status">
  ) => inv.docstatus === 2 || inv.status === "Cancelled";

  const canEditDraftFor = (
    inv: Pick<SalesInvoiceListItem, "docstatus" | "status">
  ) => (canCreate("invoices") || canWrite("invoices")) && isDraftInvoice(inv);

  const canDeleteDraftFor = (
    inv: Pick<SalesInvoiceListItem, "docstatus" | "status">
  ) => canDelete("invoices") && isDraftInvoice(inv);

  const canAmendCancelledFor = (
    inv: Pick<SalesInvoiceListItem, "docstatus" | "status" | "already_amended">
  ) => {
    if (!(canCreate("invoices") || canWrite("invoices"))) return false;
    if (!isCancelledInvoice(inv)) return false;
    // Already amended — no second Amend.
    if (inv.already_amended) return false;
    return true;
  };

  const canCreditNoteFor = (
    inv: Pick<SalesInvoiceListItem, "docstatus" | "status" | "is_return">
  ) => {
    if (!(canCreate("invoices") || canWrite("invoices"))) return false;
    // Credit notes are raised against submitted invoices, never against returns.
    if (inv.docstatus !== 1) return false;
    if (inv.is_return) return false;
    return inv.status !== "Cancelled";
  };

  const canCollectPayment = invoiceDetail ? canCollectFor(invoiceDetail) : false;
  const canCancelInvoice = invoiceDetail ? canCancelFor(invoiceDetail) : false;
  const canEditDraftInvoice = invoiceDetail ? canEditDraftFor(invoiceDetail) : false;
  const canDeleteDraftInvoice = invoiceDetail ? canDeleteDraftFor(invoiceDetail) : false;
  const canAmendCancelledInvoice = invoiceDetail
    ? canAmendCancelledFor(invoiceDetail)
    : false;
  const canCreditNoteInvoice = invoiceDetail ? canCreditNoteFor(invoiceDetail) : false;
  const linkedJobCard = (invoiceDetail?.dms_job_card || "").trim();
  /**
   * Remarks shown on the invoice sheet: the remark saved on the linked Job Card at
   * billing time, else the invoice's own user remark. ERPNext's auto-generated
   * "DMS Job Card: …" line is never shown on its own.
   */
  const invoiceRemarks =
    (invoiceDetail?.job_card_remark || "").trim() ||
    ((invoiceDetail?.remarks || "").trim().startsWith("DMS Job Card:")
      ? ""
      : (invoiceDetail?.remarks || "").trim());
  const canUpdateJobCardPrices =
    Boolean(linkedJobCard) && (canCreate("invoices") || canWrite("invoices"));

  const openCollectPayment = (invoiceName: string) => {
    setPaymentInvoiceId(invoiceName);
    setShowPaymentDialog(true);
  };

  const openCancelInvoice = (invoiceName: string) => {
    setCancelInvoiceId(invoiceName);
    setShowCancelDialog(true);
  };

  const openInvoiceEditor = (invoiceName: string) => {
    // Keep detail sheet closed while the editor modal is open.
    setSelectedId(null);
    setInvoiceDetail(null);
    setAmendInvoiceId(invoiceName);
    setShowAmendDialog(true);
  };

  const openDeleteInvoice = (invoiceName: string) => {
    setDeleteInvoiceId(invoiceName);
    setShowDeleteDialog(true);
  };

  const openCreditNote = (invoiceName: string) => {
    // Keep the detail sheet closed while the credit note modal is open.
    setSelectedId(null);
    setInvoiceDetail(null);
    setCreditNoteInvoiceId(invoiceName);
    setShowCreditNoteDialog(true);
  };

  const handleCreditNoteCreated = () => {
    void mutate((key) => Array.isArray(key) && key[0] === "invoices");
  };

  const handleUpdateJobCardPrices = async () => {
    if (!selectedId || !linkedJobCard) return;
    setUpdatingJobCardPrices(true);
    try {
      const result = await invoicesSvc.updateJobCardPricesFromInvoice(selectedId);
      toast.success(
        result.message ||
          (result.updated_lines
            ? `Updated ${result.updated_lines} line(s) on ${result.job_card}`
            : `Job Card ${result.job_card} already matches invoice rates`)
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update job card prices");
    } finally {
      setUpdatingJobCardPrices(false);
    }
  };

  const refreshAfterInvoiceAction = async (invoiceName: string) => {
    await mutate(
      (key) => Array.isArray(key) && key[0] === "invoices",
      undefined,
      { revalidate: true }
    );
    if (selectedId === invoiceName) {
      const updated = await invoicesSvc.getSalesInvoiceDetail(invoiceName);
      setInvoiceDetail(updated);
    }
  };

  const handleCancelInvoice = async () => {
    const target = cancelInvoiceId ?? selectedId;
    if (!target) return;
    setCancelling(true);
    try {
      await invoicesSvc.cancelSalesInvoice(target);
      toast.success("Invoice cancelled");
      setShowCancelDialog(false);
      setCancelInvoiceId(null);
      await refreshAfterInvoiceAction(target);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel invoice");
    } finally {
      setCancelling(false);
    }
  };

  const handleDeleteInvoice = async () => {
    const target = deleteInvoiceId ?? selectedId;
    if (!target) return;
    setDeleting(true);
    try {
      await invoicesSvc.deleteDraftSalesInvoice(target);
      toast.success("Draft invoice deleted");
      setShowDeleteDialog(false);
      setDeleteInvoiceId(null);
      if (selectedId === target) {
        setSelectedId(null);
        setInvoiceDetail(null);
      }
      await mutate(
        (key) => Array.isArray(key) && key[0] === "invoices",
        undefined,
        { revalidate: true }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete invoice");
    } finally {
      setDeleting(false);
    }
  };

  const stats = useMemo(() => {
    // Only submitted (active) invoices — cancelled/draft must not inflate cards.
    const active =
      invoices?.filter(
        (inv) =>
          Number(inv.docstatus) === 1 &&
          inv.status !== "Cancelled" &&
          inv.status !== "Draft"
      ) || [];

    const total = active.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
    const outstanding = active.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);
    // Amount actually collected (handles Partly Paid and cancelled payments).
    const paid = active.reduce((sum, inv) => {
      const collected = (inv.grand_total || 0) - (inv.outstanding_amount || 0);
      return sum + Math.max(0, collected);
    }, 0);
    // Same collected amount net of VAT: allocate each invoice's collected amount
    // to its pre-tax (net) share using the invoice's net_total / grand_total ratio.
    const paidNet = active.reduce((sum, inv) => {
      const grand = inv.grand_total || 0;
      const collected = Math.max(0, grand - (inv.outstanding_amount || 0));
      if (grand <= 0 || collected <= 0) return sum;
      const net = inv.net_total != null ? inv.net_total : grand - (inv.total_taxes_and_charges || 0);
      const netShare = Math.min(Math.max(net, 0), grand);
      return sum + collected * (netShare / grand);
    }, 0);
    // VAT part of what was collected = collected total − collected without VAT.
    const paidVat = Math.max(0, paid - paidNet);
    const overdue = active
      .filter((inv) => inv.status === "Overdue")
      .reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0);

    return { total, paid, paidNet, paidVat, outstanding, overdue };
  }, [invoices]);

  const defaultCurrency = invoices?.[0]?.currency;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-end gap-3">
        <PermittedCreateButton
          module="invoices"
          label="New Invoice"
          onClick={() => navigate('invoice-new')}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        <SummaryCard
          compact
          label="Total Invoiced"
          value={formatCurrency(stats.total, defaultCurrency)}
          icon={DollarSign}
          iconBg="bg-primary/10"
          iconClass="text-primary"
        />
        <SummaryCard
          label="Collected without VAT"
          value={formatCurrency(stats.paidNet, defaultCurrency)}
          icon={Banknote}
          iconBg="bg-[#1E88E5]/10"
          iconClass="text-[#1E88E5]"
          valueClass="text-[#1E88E5]"
        />
        <SummaryCard
          label="VAT"
          value={formatCurrency(stats.paidVat, defaultCurrency)}
          icon={Receipt}
          iconBg="bg-[#00897B]/10"
          iconClass="text-[#00897B]"
          valueClass="text-[#00897B]"
        />
        <SummaryCard
          label="Collected"
          value={formatCurrency(stats.paid, defaultCurrency)}
          icon={CheckCircle2}
          iconBg="bg-[#2E7D32]/10"
          iconClass="text-[#2E7D32]"
          valueClass="text-[#2E7D32]"
        />
        <SummaryCard
          compact
          label="Outstanding"
          value={formatCurrency(stats.outstanding, defaultCurrency)}
          icon={Clock}
          iconBg="bg-[#F9A825]/10"
          iconClass="text-[#F9A825]"
          valueClass="text-[#F9A825]"
        />
        <SummaryCard
          compact
          label="Overdue"
          value={formatCurrency(stats.overdue, defaultCurrency)}
          icon={AlertCircle}
          iconBg="bg-destructive/10"
          iconClass="text-destructive"
          valueClass="text-destructive"
        />
      </div>

      {/* Filters */}
      <Card className="dms-toolbar-card">
        <CardContent className="px-3.5 py-3">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by invoice ID or customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All (excl. Cancelled)</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:max-w-xl lg:flex-1">
              <div className="space-y-1.5">
                <Label htmlFor="invoice-posting-from" className="text-xs text-muted-foreground">
                  Invoice date from
                </Label>
                <Input
                  id="invoice-posting-from"
                  type="date"
                  value={postingFrom}
                  max={postingTo || undefined}
                  onChange={(e) => setPostingFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="invoice-posting-to" className="text-xs text-muted-foreground">
                  Invoice date to
                </Label>
                <Input
                  id="invoice-posting-to"
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
          <CardTitle>Invoices List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Failed to load invoices
            </div>
          ) : invoices && invoices.length > 0 ? (
            <div className="dms-table-panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right w-[88px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => {
                    const config = statusConfig[invoice.status] || statusConfig.Draft;
                    const StatusIcon = config.icon;
                    return (
                      <TableRow key={invoice.name}>
                        <TableCell>
                          <button
                            className="font-medium text-primary hover:underline"
                            onClick={() => setSelectedId(invoice.name)}
                          >
                            {invoice.name}
                          </button>
                        </TableCell>
                        <TableCell>{invoice.customer_name || invoice.customer}</TableCell>
                        <TableCell>
                          {invoice.posting_date
                            ? formatDate(invoice.posting_date)
                            : "—"
                          }
                        </TableCell>
                        <TableCell>
                          {invoice.due_date
                            ? formatDate(invoice.due_date)
                            : "—"
                          }
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.grand_total || 0, invoice.currency)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {invoice.outstanding_amount > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              {formatCurrency(invoice.outstanding_amount, invoice.currency)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.color} border-0 gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ListRowActions doctype="Sales Invoice" docName={invoice.name}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" title="More actions">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedId(invoice.name)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
                                {canCreditNoteFor(invoice) ? (
                                  <DropdownMenuItem onClick={() => openCreditNote(invoice.name)}>
                                    <Undo2 className="h-4 w-4 mr-2" />
                                    Credit note
                                  </DropdownMenuItem>
                                ) : null}
                                {canCollectFor(invoice) ? (
                                  <DropdownMenuItem onClick={() => openCollectPayment(invoice.name)}>
                                    <CreditCard className="h-4 w-4 mr-2" />
                                    Collect payment
                                  </DropdownMenuItem>
                                ) : null}
                                {canCancelFor(invoice) ? (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => openCancelInvoice(invoice.name)}
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel invoice
                                  </DropdownMenuItem>
                                ) : null}
                                {canEditDraftFor(invoice) ? (
                                  <DropdownMenuItem onClick={() => openInvoiceEditor(invoice.name)}>
                                    <FilePenLine className="h-4 w-4 mr-2" />
                                    Edit invoice
                                  </DropdownMenuItem>
                                ) : null}
                                {canDeleteDraftFor(invoice) ? (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => openDeleteInvoice(invoice.name)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete draft
                                  </DropdownMenuItem>
                                ) : null}
                                {canAmendCancelledFor(invoice) ? (
                                  <DropdownMenuItem onClick={() => openInvoiceEditor(invoice.name)}>
                                    <FilePenLine className="h-4 w-4 mr-2" />
                                    Amend invoice
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </ListRowActions>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Receipt className="h-12 w-12 mb-4 opacity-50" />
              <p>No invoices found</p>
              <Button variant="link" className="mt-2" onClick={() => navigate('invoice-new')}>
                Create your first invoice
              </Button>
            </div>
          )}
          {invoices.length > 0 ? (
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              loadedCount={loadedCount}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
              onLoadMore={loadMore}
              isLoadingMore={isLoadingMore}
            />
          ) : null}
        </CardContent>
      </Card>

      {/* Detail slide-over */}
      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selectedInvoice?.name || selectedId || ""}
        subtitle={selectedInvoice?.customer_name || selectedInvoice?.customer || undefined}
        badge={selectedInvoice?.status ? { label: selectedInvoice.status } : undefined}
        onOpenInDesk={() => window.open(`/app/sales-invoice/${selectedId}`, "_blank")}
        footer={
          selectedId ? (
            <div className="flex flex-col gap-2 w-full">
              <PrintFormatDropdown doctype="Sales Invoice" docName={selectedId} className="w-full" />
              {canCollectPayment && selectedId ? (
                <Button className="w-full" onClick={() => openCollectPayment(selectedId)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Collect Payment
                </Button>
              ) : null}
              {canCreditNoteInvoice && selectedId ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openCreditNote(selectedId)}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  Credit Note
                </Button>
              ) : null}
              {canCancelInvoice && selectedId ? (
                <Button
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => openCancelInvoice(selectedId)}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Invoice
                </Button>
              ) : null}
              {canEditDraftInvoice && selectedId ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openInvoiceEditor(selectedId)}
                >
                  <FilePenLine className="h-4 w-4 mr-2" />
                  Edit Invoice
                </Button>
              ) : null}
              {canDeleteDraftInvoice && selectedId ? (
                <Button
                  variant="outline"
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10"
                  onClick={() => openDeleteInvoice(selectedId)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Draft
                </Button>
              ) : null}
              {canAmendCancelledInvoice && selectedId ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => openInvoiceEditor(selectedId)}
                >
                  <FilePenLine className="h-4 w-4 mr-2" />
                  Amend Invoice
                </Button>
              ) : null}
              {canUpdateJobCardPrices && selectedId ? (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={updatingJobCardPrices}
                  onClick={() => void handleUpdateJobCardPrices()}
                >
                  {updatingJobCardPrices ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Update Job Card Prices
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {selectedInvoice && (
          <>
            <DetailSection title="Customer">
              <DetailRow label="Customer" value={selectedInvoice.customer} />
              <DetailRow label="Customer Name" value={selectedInvoice.customer_name} />
            </DetailSection>
            <DetailSection title="Dates">
              <DetailRow label="Posting Date" value={selectedInvoice.posting_date ? formatDate(selectedInvoice.posting_date) : undefined} />
              <DetailRow label="Due Date" value={selectedInvoice.due_date ? formatDate(selectedInvoice.due_date) : undefined} />
            </DetailSection>
            <DetailSection title="Amounts">
              <DetailRow
                label="Net Total"
                value={formatCurrency(invoiceDetail?.net_total || 0, selectedInvoice.currency)}
              />
              <DetailRow
                label="Tax"
                value={formatCurrency(
                  invoiceDetail?.total_taxes_and_charges || 0,
                  selectedInvoice.currency
                )}
              />
              <DetailRow
                label="Grand Total"
                value={formatCurrency(
                  invoiceDetail?.grand_total ?? selectedInvoice.grand_total ?? 0,
                  selectedInvoice.currency
                )}
              />
              <DetailRow
                label="Outstanding"
                value={formatCurrency(
                  invoiceDetail?.outstanding_amount ??
                    selectedInvoice.outstanding_amount ??
                    0,
                  selectedInvoice.currency
                )}
              />
            </DetailSection>
            <DetailSection title="Info">
              <DetailRow label="Status" value={selectedInvoice.status} />
              <DetailRow label="Currency" value={selectedInvoice.currency} />
              {linkedJobCard ? (
                <DetailRow label="Job Card" value={linkedJobCard} />
              ) : null}
              {invoiceDetail?.return_against ? (
                <DetailRow label="Credits Invoice" value={invoiceDetail.return_against} />
              ) : null}
            </DetailSection>
            {invoiceRemarks ? (
              <DetailSection title="Remarks">
                <p className="whitespace-pre-wrap break-words text-sm">{invoiceRemarks}</p>
              </DetailSection>
            ) : null}
            {invoiceDetail?.payments && invoiceDetail.payments.length > 0 ? (
              <DetailSection title={`Payments (${invoiceDetail.payments.length})`}>
                <div className="space-y-2">
                  {invoiceDetail.payments.map((payment) => (
                    <div
                      key={payment.name}
                      className="space-y-1 rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-medium">{payment.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {payment.posting_date ? formatDate(payment.posting_date) : '—'}
                            {payment.mode_of_payment ? ` · ${payment.mode_of_payment}` : ''}
                            {payment.reference_no ? ` · ${payment.reference_no}` : ''}
                          </div>
                        </div>
                        <span className="whitespace-nowrap font-medium">
                          {formatCurrency(
                            payment.paid_amount || 0,
                            selectedInvoice.currency
                          )}
                        </span>
                      </div>
                      {payment.dms_remarks ? (
                        <p className="whitespace-pre-wrap break-words text-xs">
                          <span className="text-muted-foreground">DMS remarks: </span>
                          {payment.dms_remarks}
                        </p>
                      ) : payment.remarks ? (
                        <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                          {payment.remarks}
                        </p>
                      ) : null}
                    </div>
                  ))}
                  {(invoiceDetail.payment_total || 0) > 0 ? (
                    <div className="flex justify-between gap-4 px-1">
                      <span className="text-muted-foreground">Applied to this invoice</span>
                      <span className="font-medium">
                        {formatCurrency(
                          invoiceDetail.payment_total || 0,
                          selectedInvoice.currency
                        )}
                      </span>
                    </div>
                  ) : null}
                </div>
              </DetailSection>
            ) : null}
            {invoiceDetail?.credit_notes && invoiceDetail.credit_notes.length > 0 && (
              <DetailSection title="Credit Notes">
                <div className="space-y-2">
                  {invoiceDetail.credit_notes.map((creditNote) => (
                    <div
                      key={creditNote.name}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="min-w-0">
                        <button
                          type="button"
                          className="truncate font-medium text-primary hover:underline"
                          onClick={() => setSelectedId(creditNote.name)}
                        >
                          {creditNote.name}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {creditNote.posting_date || "—"}
                          {creditNote.status ? ` · ${creditNote.status}` : ""}
                        </p>
                      </div>
                      <span className="whitespace-nowrap font-medium">
                        {formatCurrency(
                          creditNote.grand_total || 0,
                          creditNote.currency || selectedInvoice.currency
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </DetailSection>
            )}
            {invoiceDetail?.items && invoiceDetail.items.length > 0 && (
              <DetailSection title="Line Items">
                <div className="dms-table-panel rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceDetail.items.map((line, idx) => {
                        // Prefer the line description (this is where a labour "display name"
                        // is stored) over the ERP item name.
                        const lineLabel = line.description || line.item_name;
                        return (
                          <TableRow key={`${line.item_code}-${idx}`}>
                            <TableCell className="max-w-[200px]">
                              <div className="font-medium truncate" title={line.item_code}>
                                {line.item_code}
                              </div>
                              {lineLabel && lineLabel !== line.item_code ? (
                                <div
                                  className="text-xs font-light text-muted-foreground truncate"
                                  title={lineLabel}
                                >
                                  {lineLabel}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right">{line.qty}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(line.amount || 0, selectedInvoice.currency)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                <div className="mt-3 space-y-1.5 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Net Total</span>
                    <span>
                      {formatCurrency(invoiceDetail.net_total || 0, selectedInvoice.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Tax</span>
                    <span>
                      {formatCurrency(
                        invoiceDetail.total_taxes_and_charges || 0,
                        selectedInvoice.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4 border-t pt-1.5 font-medium">
                    <span>Grand Total</span>
                    <span>
                      {formatCurrency(
                        invoiceDetail.grand_total || selectedInvoice.grand_total || 0,
                        selectedInvoice.currency
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Outstanding</span>
                    <span
                      className={
                        (invoiceDetail.outstanding_amount ??
                          selectedInvoice.outstanding_amount ??
                          0) > 0
                          ? "font-medium text-amber-600 dark:text-amber-400"
                          : undefined
                      }
                    >
                      {formatCurrency(
                        invoiceDetail.outstanding_amount ??
                          selectedInvoice.outstanding_amount ??
                          0,
                        selectedInvoice.currency
                      )}
                    </span>
                  </div>
                </div>
              </DetailSection>
            )}
          </>
        )}
      </DetailSheet>

      <AlertDialog
        open={showCancelDialog}
        onOpenChange={(open) => {
          setShowCancelDialog(open);
          if (!open) setCancelInvoiceId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Cancel <strong>{cancelInvoiceId ?? selectedId}</strong>? This reverses the submitted Sales Invoice
              in ERPNext, same as cancelling from Desk. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep invoice</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={cancelling}
              onClick={(e) => {
                e.preventDefault();
                void handleCancelInvoice();
              }}
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling…
                </>
              ) : (
                "Cancel invoice"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={(open) => {
          setShowDeleteDialog(open);
          if (!open) setDeleteInvoiceId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete draft invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete draft <strong>{deleteInvoiceId ?? selectedId}</strong>? This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep draft</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteInvoice();
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete draft"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {(paymentInvoiceId ?? selectedId) && (
        <CollectPaymentDialog
          open={showPaymentDialog}
          onOpenChange={(open) => {
            setShowPaymentDialog(open);
            if (!open) setPaymentInvoiceId(null);
          }}
          salesInvoice={paymentInvoiceId ?? selectedId!}
          onPaid={() => {
            const id = paymentInvoiceId ?? selectedId;
            if (id) void refreshAfterInvoiceAction(id);
          }}
        />
      )}

      {amendInvoiceId ? (
        <AmendInvoiceDialog
          open={showAmendDialog}
          onOpenChange={(open) => {
            setShowAmendDialog(open);
            if (!open) setAmendInvoiceId(null);
          }}
          salesInvoice={amendInvoiceId}
          onAmended={(draftName) => {
            // Refresh list only — do not open the detail sheet while editing.
            void mutate((key) => Array.isArray(key) && key[0] === "invoices");
            setAmendInvoiceId(draftName);
          }}
          onSaved={(invoiceName) => {
            void mutate((key) => Array.isArray(key) && key[0] === "invoices");
            setSelectedId(invoiceName);
            void invoicesSvc.getSalesInvoiceDetail(invoiceName).then(setInvoiceDetail);
          }}
          onDeleted={() => {
            setSelectedId(null);
            setInvoiceDetail(null);
            void mutate((key) => Array.isArray(key) && key[0] === "invoices");
          }}
        />
      ) : null}

      {creditNoteInvoiceId ? (
        <CreditNoteDialog
          open={showCreditNoteDialog}
          onOpenChange={(open) => {
            setShowCreditNoteDialog(open);
            if (!open) setCreditNoteInvoiceId(null);
          }}
          salesInvoice={creditNoteInvoiceId}
          onCreated={handleCreditNoteCreated}
        />
      ) : null}
    </div>
  );
}
