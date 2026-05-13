"use client";

import { useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useInvoices } from "@/hooks/use-dms";
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
  Printer,
  Send,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  Draft: { label: "Draft", color: "bg-muted text-muted-foreground", icon: Clock },
  Sent: { label: "Sent", color: "bg-[#1E88E5]/10 text-[#1E88E5]", icon: Send },
  Paid: { label: "Paid", color: "bg-[#2E7D32]/10 text-[#2E7D32]", icon: CheckCircle2 },
  "Partially Paid": { label: "Partial", color: "bg-[#F9A825]/10 text-[#F9A825]", icon: AlertCircle },
  Overdue: { label: "Overdue", color: "bg-destructive/10 text-destructive", icon: AlertCircle },
  Cancelled: { label: "Cancelled", color: "bg-muted text-muted-foreground", icon: AlertCircle },
};

export default function InvoicesPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: invoices, isLoading, error } = useInvoices({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const stats = {
    total: invoices?.reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    paid: invoices?.filter((inv) => inv.status === "Paid").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    pending: invoices?.filter((inv) => ["Draft", "Sent"].includes(inv.status)).reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
    overdue: invoices?.filter((inv) => inv.status === "Overdue").reduce((sum, inv) => sum + (inv.total_amount || 0), 0) || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">Manage service invoices and payments</p>
        </div>
        <Button onClick={() => navigate('invoice-new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold">{stats.total.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Paid</p>
                <p className="text-2xl font-bold text-[#2E7D32]">{stats.paid.toLocaleString()}</p>
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
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-[#F9A825]">{stats.pending.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-destructive">{stats.overdue.toLocaleString()}</p>
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
                placeholder="Search by invoice ID, customer, job card..."
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Job Card</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
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
                            onClick={() => navigate('invoice-detail', { id: invoice.name })}
                            className="font-medium text-primary hover:underline"
                          >
                            {invoice.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          {invoice.job_card && (
                            <button 
                              onClick={() => navigate('job-card-detail', { id: invoice.job_card })}
                              className="text-muted-foreground hover:text-primary hover:underline"
                            >
                              {invoice.job_card}
                            </button>
                          )}
                        </TableCell>
                        <TableCell>{invoice.customer_name}</TableCell>
                        <TableCell>
                          {invoice.invoice_date 
                            ? new Date(invoice.invoice_date).toLocaleDateString()
                            : "-"
                          }
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {invoice.total_amount?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={`${config.color} border-0 gap-1`}>
                            <StatusIcon className="h-3 w-3" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => navigate('invoice-detail', { id: invoice.name })}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Printer className="h-4 w-4 mr-2" />
                                Print
                              </DropdownMenuItem>
                              {invoice.status === "Draft" && (
                                <DropdownMenuItem>
                                  <Send className="h-4 w-4 mr-2" />
                                  Send to Customer
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </div>
  );
}
