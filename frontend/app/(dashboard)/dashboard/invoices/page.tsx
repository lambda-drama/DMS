"use client";

import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useInvoices } from "@/hooks/use-dms";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Receipt,
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Send,
  CreditCard,
} from "lucide-react";
import { CollectPaymentDialog } from "@/components/invoices/collect-payment-dialog";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";
import { ListRowActions } from "@/components/list-row-actions";
import * as invoicesSvc from "@/services/invoices";
import type { SalesInvoiceDetail } from "@/types/dms";

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

export default function InvoicesPage() {
  const { navigate, viewParams } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<SalesInvoiceDetail | null>(null);

  useEffect(() => {
    const id = viewParams.get("id");
    if (id) setSelectedId(id);
  }, [viewParams]);
  const { data: invoices, isLoading, error } = useInvoices({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const selectedInvoice = invoices?.find((i) => i.name === selectedId);

  useEffect(() => {
    if (!selectedId) {
      setInvoiceDetail(null);
      return;
    }
    invoicesSvc.getSalesInvoiceDetail(selectedId).then(setInvoiceDetail).catch(() => setInvoiceDetail(null));
  }, [selectedId]);

  const canCollectPayment =
    invoiceDetail &&
    invoiceDetail.docstatus === 1 &&
    (invoiceDetail.outstanding_amount || 0) > 0;

  const stats = {
    total: invoices?.reduce((sum, inv) => sum + (inv.grand_total || 0), 0) || 0,
    paid: invoices?.filter((inv) => inv.status === "Paid").reduce((sum, inv) => sum + (inv.grand_total || 0), 0) || 0,
    outstanding: invoices?.reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0) || 0,
    overdue: invoices?.filter((inv) => inv.status === "Overdue").reduce((sum, inv) => sum + (inv.outstanding_amount || 0), 0) || 0,
  };

  const defaultCurrency = invoices?.[0]?.currency;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Aftersales invoices linked to a job card (DMS)
          </p>
        </div>
        <Button onClick={() => navigate('invoice-new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invoiced</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.total, defaultCurrency)}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-2xl font-bold text-[#2E7D32]">{formatCurrency(stats.paid, defaultCurrency)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#2E7D32]/10">
                <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-[#F9A825]">{formatCurrency(stats.outstanding, defaultCurrency)}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#F9A825]/10">
                <Clock className="h-5 w-5 text-[#F9A825]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{formatCurrency(stats.overdue, defaultCurrency)}</p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
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
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    <TableHead className="text-right">Actions</TableHead>
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
                            ? new Date(invoice.posting_date).toLocaleDateString()
                            : "—"
                          }
                        </TableCell>
                        <TableCell>
                          {invoice.due_date
                            ? new Date(invoice.due_date).toLocaleDateString()
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
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedId(invoice.name)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </DropdownMenuItem>
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
              {canCollectPayment ? (
                <Button className="w-full" onClick={() => setShowPaymentDialog(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Collect Payment
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
              <DetailRow label="Posting Date" value={selectedInvoice.posting_date ? new Date(selectedInvoice.posting_date).toLocaleDateString() : undefined} />
              <DetailRow label="Due Date" value={selectedInvoice.due_date ? new Date(selectedInvoice.due_date).toLocaleDateString() : undefined} />
            </DetailSection>
            <DetailSection title="Amounts">
              <DetailRow label="Grand Total" value={formatCurrency(selectedInvoice.grand_total || 0, selectedInvoice.currency)} />
              <DetailRow label="Outstanding" value={formatCurrency(selectedInvoice.outstanding_amount || 0, selectedInvoice.currency)} />
            </DetailSection>
            <DetailSection title="Info">
              <DetailRow label="Status" value={selectedInvoice.status} />
              <DetailRow label="Currency" value={selectedInvoice.currency} />
            </DetailSection>
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
                      {invoiceDetail.items.map((line, idx) => (
                        <TableRow key={`${line.item_code}-${idx}`}>
                          <TableCell className="max-w-[200px] truncate">
                            {line.description || line.item_code}
                          </TableCell>
                          <TableCell className="text-right">{line.qty}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(line.amount || 0, selectedInvoice.currency)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </DetailSection>
            )}
          </>
        )}
      </DetailSheet>

      {selectedId && (
        <CollectPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          salesInvoice={selectedId}
          onPaid={() => {
            invoicesSvc.getSalesInvoiceDetail(selectedId).then(setInvoiceDetail);
          }}
        />
      )}
    </div>
  );
}
