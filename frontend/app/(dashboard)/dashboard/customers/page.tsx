"use client";

import { useState, useMemo, useEffect } from "react";
import { useCustomersPaginated } from "@/hooks/use-dms";
import { usePermissions } from "@/contexts/permissions-context";
import { PaginationControls } from "@/components/pagination-controls";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { EditCustomerDialog } from "@/components/customers/edit-customer-dialog";
import { useNavigation } from "@/contexts/navigation-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Users,
  Phone,
  Mail,
  Loader2,
  Car,
  Pencil,
} from "lucide-react";

export default function CustomersPage() {
  const { navigate, viewParams } = useNavigation();
  const { canWrite } = usePermissions();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    const id = viewParams.get("id");
    if (id) setSelectedId(id);
  }, [viewParams]);

  const { data: result, isLoading, error, mutate } = useCustomersPaginated({
    search: searchQuery || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const customers = result?.data;
  const totalItems = result?.total || 0;

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const selectedCustomer = customers?.find((c) => c.name === selectedId);

  const stats = useMemo(() => {
    if (!customers) return { total: 0, individual: 0, company: 0 };
    return {
      total: customers.length,
      individual: customers.filter((c) => c.customer_type === "Individual").length,
      company: customers.filter((c) => c.customer_type === "Company").length,
    };
  }, [customers]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">Customers</h1>
          <p className="text-muted-foreground">Vehicle customers managed in DMS</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-1 w-fit rounded-full bg-primary/10 p-1.5 sm:order-2">
                <Users className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="order-2 min-w-0 sm:order-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Total Customers
                </p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-1 w-fit rounded-full bg-blue-100 p-2 dark:bg-blue-900/30 sm:p-1.5 sm:order-2">
                <Users className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="order-2 min-w-0 sm:order-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Individual</p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.individual}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-1 w-fit rounded-full bg-purple-100 p-2 dark:bg-purple-900/30 sm:p-1.5 sm:order-2">
                <Users className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="order-2 min-w-0 sm:order-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Company</p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.company}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="dms-toolbar-card">
        <CardContent className="px-3.5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or ID..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Failed to load customers
            </div>
          ) : customers && customers.length > 0 ? (
            <div className="dms-table-panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Vehicles</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((c) => (
                    <TableRow key={c.name} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(c.name)}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-medium">{c.customer_name}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            c.customer_type === "Individual"
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300"
                              : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300"
                          }
                        >
                          {c.customer_type || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {c.customer_group || "—"}
                      </TableCell>
                      <TableCell>
                        {c.mobile_no ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            {c.mobile_no}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {c.email_id ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[180px]">{c.email_id}</span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          onClick={() => navigate("vehicles", { customer: c.name })}
                        >
                          <Car className="h-3 w-3" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Users className="h-12 w-12 mb-4 opacity-50" />
              <p>No customers found</p>
              <p className="text-sm mt-1">
                Customers with vehicle customer groups will appear here
              </p>
            </div>
          )}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Detail slide-over */}
      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selectedCustomer?.customer_name || selectedId || ""}
        subtitle={selectedId || undefined}
        badge={selectedCustomer?.customer_type ? { label: selectedCustomer.customer_type } : undefined}
        onOpenInDesk={() => window.open(`/app/customer/${selectedId}`, "_blank")}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {canWrite("customers") && selectedCustomer ? (
              <Button onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Customer
              </Button>
            ) : null}
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                setSelectedId(null);
                navigate("vehicles", { customer: selectedId! });
              }}
            >
              <Car className="h-4 w-4" />
              View Vehicles
            </Button>
          </div>
        }
      >
        {selectedCustomer && (
          <>
            <DetailSection title="General">
              <DetailRow label="Customer Name" value={selectedCustomer.customer_name} />
              <DetailRow label="Customer Type" value={selectedCustomer.customer_type} />
              <DetailRow label="Customer Group" value={selectedCustomer.customer_group} />
              <DetailRow label="Territory" value={selectedCustomer.territory} />
            </DetailSection>
            <DetailSection title="Contact">
              <DetailRow label="Mobile" value={selectedCustomer.mobile_no} />
              <DetailRow label="Email" value={selectedCustomer.email_id} />
            </DetailSection>
            <DetailSection title="Info">
              <DetailRow
                label="Created"
                value={selectedCustomer.creation ? new Date(selectedCustomer.creation).toLocaleDateString() : undefined}
              />
            </DetailSection>
          </>
        )}
      </DetailSheet>

      <EditCustomerDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        customer={selectedCustomer || null}
        onUpdated={() => {
          void mutate();
        }}
      />
    </div>
  );
}
