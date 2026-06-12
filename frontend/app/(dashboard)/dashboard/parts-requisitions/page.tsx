"use client";

import { useEffect, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { usePermissions } from "@/contexts/permissions-context";
import { usePartsRequisitions } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  Package,
  MoreHorizontal,
  ClipboardList,
  Wrench,
  XCircle,
  ExternalLink,
  Undo2,
} from "lucide-react";
import { PaginationControls } from "@/components/pagination-controls";
import { ListRowActions } from "@/components/list-row-actions";
import { PartsRequestFlowProgress } from "@/components/parts-request/parts-request-flow-progress";
import { cn } from "@/lib/utils";
import * as partsSvc from "@/services/partsRequests";
import { toast } from "sonner";

const statusFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active (in progress)" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "ready_for_issue", label: "Ready for issue" },
  { value: "Pending Approval", label: "Pending Approval" },
  { value: "Ready for Issue", label: "Ready for Issue" },
  { value: "Issued", label: "Issued" },
  { value: "Received", label: "Received" },
  { value: "Cancelled", label: "Cancelled" },
];

const CANCELLABLE_STATUSES = new Set([
  "Draft",
  "Pending Approval",
  "Approved",
  "Ready for Issue",
  "Partially Issued",
]);

function statusBadgeClass(status: string) {
  if (status === "Received" || status === "Issued") return "bg-green-600";
  if (status === "Ready for Issue" || status === "Partially Issued") return "bg-blue-600";
  if (status === "Pending Approval") return "bg-amber-500";
  if (status === "Cancelled") return "bg-muted text-muted-foreground";
  return "secondary";
}

function PartsRequisitionRowMenu({
  pr,
  canWrite,
  onProcess,
  onJobCard,
  onPartsReturn,
  onCancelled,
}: {
  pr: { name: string; status: string; job_card?: string };
  canWrite: boolean;
  onProcess: () => void;
  onJobCard: () => void;
  onPartsReturn: () => void;
  onCancelled: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const canCancel = canWrite && CANCELLABLE_STATUSES.has(pr.status);

  const handleCancel = async () => {
    if (!window.confirm(`Cancel parts requisition ${pr.name}?`)) return;
    setBusy(true);
    try {
      await partsSvc.cancelPartsRequest(pr.name);
      toast.success("Parts requisition cancelled");
      onCancelled();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ListRowActions doctype="DMS Parts Request" docName={pr.name}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={busy}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onProcess}>
            <ClipboardList className="mr-2 h-4 w-4" />
            Process
          </DropdownMenuItem>
          {pr.job_card && (
            <DropdownMenuItem onClick={onJobCard}>
              <Wrench className="mr-2 h-4 w-4" />
              Open job card
            </DropdownMenuItem>
          )}
          {pr.job_card && (pr.status === "Issued" || pr.status === "Received") && (
            <DropdownMenuItem onClick={onPartsReturn}>
              <Undo2 className="mr-2 h-4 w-4" />
              Parts return
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => window.open(`/app/dms-parts-request/${pr.name}`, "_blank")}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in Desk
          </DropdownMenuItem>
          {canCancel && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => void handleCancel()}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Cancel request
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </ListRowActions>
  );
}

export default function PartsRequisitionsPage() {
  const { navigate, viewParams } = useNavigation();
  const { canWrite } = usePermissions();
  const canManage = canWrite("parts-requisitions");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  useEffect(() => {
    const filter = viewParams.get("filter");
    const status = viewParams.get("status");
    if (status) setStatusFilter(status);
    else if (filter) setStatusFilter(filter);
  }, [viewParams]);

  const listFilter =
    statusFilter === "active" ||
    statusFilter === "pending_approval" ||
    statusFilter === "ready_for_issue"
      ? statusFilter
      : undefined;

  const listStatus =
    statusFilter !== "all" &&
    statusFilter !== "active" &&
    statusFilter !== "pending_approval" &&
    statusFilter !== "ready_for_issue"
      ? statusFilter
      : undefined;

  const { data: result, isLoading, error, mutate } = usePartsRequisitions({
    status: listStatus,
    filter: listFilter,
    search: searchQuery.trim() || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });

  const rows = result?.data ?? [];
  const totalItems = result?.total ?? 0;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchQuery]);

  const openDetail = (name: string) => {
    navigate("parts-requisition-detail", { id: name });
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Parts Requisition
          </CardTitle>
          <CardDescription>
            Parts department queue — approve, pick, and issue spare parts requested from job cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search request, job card, plate, customer…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[240px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              Failed to load parts requisitions
            </div>
          ) : rows.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                {rows.map((pr) => (
                  <div
                    key={pr.name}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => openDetail(pr.name)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <p className="font-medium">{pr.name}</p>
                        <p className="text-sm text-muted-foreground">{pr.job_card}</p>
                        <p className="mt-1 text-sm">
                          {pr.license_plate || "—"}
                          {pr.customer_name ? ` · ${pr.customer_name}` : ""}
                        </p>
                        <div className="mt-2">
                          <Badge className={cn(statusBadgeClass(pr.status))}>{pr.status}</Badge>
                        </div>
                      </button>
                      <PartsRequisitionRowMenu
                        pr={pr}
                        canWrite={canManage}
                        onProcess={() => openDetail(pr.name)}
                        onJobCard={() => navigate("job-card-detail", { id: pr.job_card || "" })}
                        onPartsReturn={() =>
                          navigate("job-card-detail", { id: pr.job_card || "", tab: "parts" })
                        }
                        onCancelled={() => void mutate()}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => openDetail(pr.name)}
                      className="mt-3 w-full rounded-md p-1 transition-colors hover:bg-muted/80"
                    >
                      <PartsRequestFlowProgress status={pr.status} compact />
                    </button>
                  </div>
                ))}
              </div>

              <div className="dms-table-panel hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request</TableHead>
                      <TableHead>Job Card</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Parts</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Process</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((pr) => (
                      <TableRow key={pr.name} className="hover:bg-muted/50">
                        <TableCell>
                          <button
                            type="button"
                            onClick={() => openDetail(pr.name)}
                            className="font-medium text-primary hover:underline"
                          >
                            {pr.name}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {pr.posting_date
                              ? new Date(pr.posting_date).toLocaleDateString()
                              : "—"}
                          </p>
                        </TableCell>
                        <TableCell>
                          <button
                            type="button"
                            className="text-sm hover:underline"
                            onClick={() => navigate("job-card-detail", { id: pr.job_card || "" })}
                          >
                            {pr.job_card || "—"}
                          </button>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{pr.license_plate || "—"}</p>
                          <p className="text-xs text-muted-foreground">{pr.vehicle_vin || ""}</p>
                        </TableCell>
                        <TableCell>{pr.customer_name || pr.customer || "—"}</TableCell>
                        <TableCell>{pr.item_count ?? "—"}</TableCell>
                        <TableCell>
                          <Badge className={statusBadgeClass(pr.status)}>{pr.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <PartsRequestFlowProgress
                            status={pr.status}
                            onOpen={() => openDetail(pr.name)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <PartsRequisitionRowMenu
                            pr={pr}
                            canWrite={canManage}
                            onProcess={() => openDetail(pr.name)}
                            onJobCard={() => navigate("job-card-detail", { id: pr.job_card || "" })}
                            onPartsReturn={() =>
                              navigate("job-card-detail", { id: pr.job_card || "", tab: "parts" })
                            }
                            onCancelled={() => void mutate()}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </>
          ) : (
            <div className="flex h-48 flex-col items-center justify-center gap-2 text-muted-foreground">
              <Package className="h-10 w-10 opacity-40" />
              <p>No parts requisitions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
