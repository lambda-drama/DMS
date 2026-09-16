"use client";

import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { useJobCards, useJobCard } from "@/hooks/use-dms";
import { DetailSheet } from "@/components/detail-sheet";
import { JobCardDetailSheetContent } from "@/components/job-card/job-card-detail-sheet";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  FileText,
  Wrench,
  Clock,
  CheckCircle2,
  ChevronDown,
  BarChart3,
  RotateCcw,
  XCircle,
  Copy,
  FilePenLine,
} from "lucide-react";
import { toast } from "sonner";
import { PaymentStatusBadge, RepeatJobBadge, StatusBadge } from "@/components/job-card/status-badge";
import { CreateRepeatJobDialog } from "@/components/job-card/create-repeat-job-dialog";
import { resolveJobCardWorkflowStatus } from "@/lib/job-card-workflow";
import { PaginationControls } from "@/components/pagination-controls";
import { LOAD_MORE_PAGE_SIZE, useLoadMore } from "@/hooks/use-load-more";
import { usePersistedFilter } from "@/hooks/use-persisted-filter";
import { ListRowActions } from "@/components/list-row-actions";
import { ClearDateFiltersButton } from "@/components/clear-date-filters-button";
import { cn, vehicleListingLines } from "@/lib/utils";
import * as jobCardsSvc from "@/services/jobCards";
import type { DMSJobCard, JobCardStatus } from "@/types/dms";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function canCreateRepeatJob(jc: Pick<DMSJobCard, "status" | "job_card_type">) {
  return (
    jc.job_card_type !== "Internal" &&
    (jc.status === "Completed" || jc.status === "Delivered")
  );
}

function canCancelJobCard(jc: Pick<DMSJobCard, "status" | "docstatus">) {
  const workflow = resolveJobCardWorkflowStatus(jc.status, jc.docstatus);
  return workflow !== "Cancelled" && workflow !== "Delivered";
}

function isCancelledJobCard(jc: Pick<DMSJobCard, "status" | "docstatus">) {
  return resolveJobCardWorkflowStatus(jc.status, jc.docstatus) === "Cancelled";
}

const statusFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "All (excl. Cancelled)" },
  { value: "Draft", label: "Draft" },
  { value: "Estimation Pending", label: "Estimation Pending" },
  { value: "Estimation Approved", label: "Estimation Approved" },
  { value: "Waiting Customer Approval", label: "Waiting Customer Approval" },
  { value: "Repair In Progress", label: "Repair In Progress" },
  { value: "Repair Completed", label: "Repair Completed" },
  { value: "Waiting Parts", label: "Waiting Parts" },
  { value: "Road Test In Progress", label: "Road Test In Progress" },
  { value: "Road Test Completed", label: "Road Test Completed" },
  { value: "QC In Progress", label: "QC In Progress" },
  { value: "QC Failed", label: "QC Failed" },
  { value: "Rework", label: "Rework" },
  { value: "Completed", label: "Completed" },
  { value: "Delivered", label: "Delivered" },
  { value: "Cancelled", label: "Cancelled" },
];

const jobCardTypeFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "All job card types" },
  { value: "Customer Paid", label: "Customer Paid" },
  { value: "Warranty", label: "Warranty" },
  { value: "Internal", label: "Internal" },
  { value: "PDI", label: "PDI" },
  { value: "Campaign/Recall", label: "Campaign/Recall" },
  { value: "Insurance", label: "Insurance" },
  { value: "Goodwill", label: "Goodwill" },
  { value: "Fleet Contract", label: "Fleet Contract" },
];

const ACTIVE_STATUSES = [
  "Estimation Pending",
  "Estimation Approved",
  "Waiting Customer Approval",
  "Repair In Progress",
  "Waiting Parts",
  "Road Test In Progress",
  "QC In Progress",
  "Rework",
];

function WorkflowProgress({
  status,
  docstatus,
  onOpen,
}: {
  status: JobCardStatus;
  docstatus?: number;
  onOpen?: () => void;
}) {
  const workflowStatus = resolveJobCardWorkflowStatus(status, docstatus);
  const stages = ["Draft", "Estimate", "Repair", "Road Test", "QC", "Done"];
  const stageMap: Record<string, number> = {
    Draft: 0,
    Open: 0,
    "Estimation Pending": 1,
    "Estimation Approved": 1,
    "Waiting Customer Approval": 1,
    Scheduled: 1,
    "Repair In Progress": 2,
    "Repair Completed": 2,
    "Waiting Parts": 2,
    Rework: 2,
    "Road Test In Progress": 3,
    "Road Test Completed": 3,
    "QC In Progress": 4,
    "QC Failed": 4,
    Completed: 5,
    Delivered: 5,
  };
  const currentIndex = stageMap[workflowStatus] ?? -1;

  if (currentIndex < 0 || workflowStatus === "Cancelled") {
    if (!onOpen) return <span className="text-sm text-muted-foreground">—</span>;
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-sm text-muted-foreground hover:text-primary hover:underline"
      >
        {workflowStatus}
      </button>
    );
  }

  const bar = (
    <div className="flex items-center gap-0.5 min-w-[200px]" title={workflowStatus}>
      {stages.map((label, index) => (
        <div key={index} className="flex flex-col items-center">
          <div
            className={`h-1.5 w-5 rounded-full transition-colors ${
              index <= currentIndex
                ? index === currentIndex
                  ? "bg-primary"
                  : "bg-primary/60"
                : "bg-muted"
            }`}
          />
          <span
            className={`text-[9px] leading-tight mt-0.5 ${
              index === currentIndex
                ? "text-primary font-semibold"
                : index < currentIndex
                  ? "text-muted-foreground"
                  : "text-muted-foreground/50"
            }`}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );

  if (!onOpen) return bar;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="rounded-md p-1 -m-1 text-left transition-colors hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
      title={
        workflowStatus === "Draft"
          ? "Continue editing draft job card"
          : "Open job card to continue workflow"
      }
    >
      {bar}
    </button>
  );
}

const presetFilterLabels: Record<string, string> = {
  active: "Active job cards",
  qc: "Pending QC",
  qc_failed: "QC failed / rework",
  overdue: "Overdue promised",
};

function formatDateRangeLabel(from?: string, to?: string) {
  if (from && to) return from === to ? from : `${from} – ${to}`;
  if (from) return `from ${from}`;
  if (to) return `to ${to}`;
  return "";
}

export default function JobCardsPage() {
  const { navigate, viewParams } = useNavigation();
  const [searchQuery, setSearchQuery] = usePersistedFilter("job-cards", "search", "");
  const [statusFilter, setStatusFilter] = usePersistedFilter<string>("job-cards", "status", "all");
  const [jobCardTypeFilter, setJobCardTypeFilter] = usePersistedFilter<string>(
    "job-cards",
    "job_card_type",
    "all"
  );
  const [presetFilter, setPresetFilter] = usePersistedFilter<
    "active" | "qc" | "qc_failed" | "overdue" | null
  >("job-cards", "preset", null);
  const [openedFrom, setOpenedFrom] = usePersistedFilter("job-cards", "opened_from", "");
  const [openedTo, setOpenedTo] = usePersistedFilter("job-cards", "opened_to", "");
  const [completedFrom, setCompletedFrom] = usePersistedFilter("job-cards", "completed_from", "");
  const [completedTo, setCompletedTo] = usePersistedFilter("job-cards", "completed_to", "");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [repeatSource, setRepeatSource] = useState<DMSJobCard | null>(null);
  const [cancelTarget, setCancelTarget] = useState<DMSJobCard | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState<string | null>(null);

  const openRepeatDialog = (jc: DMSJobCard) => {
    setRepeatSource(jc);
  };

  useEffect(() => {
    const filter = viewParams.get("filter");
    const status = viewParams.get("status");
    if (status) {
      setStatusFilter(status);
      setPresetFilter(null);
    } else if (filter === "active" || filter === "qc" || filter === "qc_failed" || filter === "overdue") {
      setPresetFilter(filter);
      setStatusFilter("all");
    }
  }, [viewParams]);

  const listFilters = {
    status: statusFilter !== "all" ? statusFilter : undefined,
    filter: presetFilter || undefined,
    job_card_type: jobCardTypeFilter !== "all" ? jobCardTypeFilter : undefined,
    opened_from: openedFrom || undefined,
    opened_to: openedTo || undefined,
    completed_from: completedFrom || undefined,
    completed_to: completedTo || undefined,
  };

  const { data: result, isLoading, error, mutate } = useJobCards({
    ...listFilters,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const totalItems = result?.total || 0;
  const loadMoreResetKey = [
    statusFilter,
    jobCardTypeFilter,
    presetFilter ?? "",
    openedFrom,
    openedTo,
    completedFrom,
    completedTo,
    page,
    pageSize,
  ].join("|");
  const {
    items: jobCards,
    loadedCount,
    isLoadingMore,
    loadMore,
  } = useLoadMore<DMSJobCard>({
    items: result?.data,
    total: totalItems,
    offset: (page - 1) * pageSize,
    resetKey: loadMoreResetKey,
    enabled: pageSize >= LOAD_MORE_PAGE_SIZE,
    fetchMore: async (offset, limit) =>
      (await jobCardsSvc.listJobCards({ ...listFilters, limit, offset })).data,
  });
  const { data: selectedJobCard, isLoading: detailLoading } = useJobCard(selectedId);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      await jobCardsSvc.cancelJobCard(
        cancelTarget.name,
        cancelReason.trim() || undefined
      );
      toast.success(`Job card ${cancelTarget.name} cancelled`);
      setCancelTarget(null);
      setCancelReason("");
      if (selectedId === cancelTarget.name) setSelectedId(null);
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to cancel job card");
    } finally {
      setCancelling(false);
    }
  };

  const handleCreateNewVersion = async (jc: DMSJobCard) => {
    setCreatingVersion(jc.name);
    try {
      const created = await jobCardsSvc.createJobCardNewVersion(jc.name);
      toast.success(`New version ${created.name} created`);
      navigate("job-card-detail", { id: created.name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create new version");
    } finally {
      setCreatingVersion(null);
    }
  };

  const handleAmend = async (jc: DMSJobCard) => {
    if (jc.already_amended && jc.amended_as) {
      navigate("job-card-detail", { id: jc.amended_as });
      return;
    }
    setCreatingVersion(jc.name);
    try {
      const created = await jobCardsSvc.amendJobCard(jc.name);
      toast.success(`Amended as ${created.name}`);
      navigate("job-card-detail", { id: created.name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to amend job card");
    } finally {
      setCreatingVersion(null);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [
    statusFilter,
    jobCardTypeFilter,
    presetFilter,
    openedFrom,
    openedTo,
    completedFrom,
    completedTo,
  ]);

  const hasDateFilters = Boolean(openedFrom || openedTo || completedFrom || completedTo);
  const hasListFilters = Boolean(
    presetFilter || statusFilter !== "all" || jobCardTypeFilter !== "all" || hasDateFilters
  );
  const openedRangeLabel = formatDateRangeLabel(openedFrom, openedTo);
  const completedRangeLabel = formatDateRangeLabel(completedFrom, completedTo);

  const clearListFilters = () => {
    setStatusFilter("all");
    setJobCardTypeFilter("all");
    setPresetFilter(null);
    setOpenedFrom("");
    setOpenedTo("");
    setCompletedFrom("");
    setCompletedTo("");
    navigate("job-cards");
  };

  const filtered = jobCards?.filter((jc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      jc.name?.toLowerCase().includes(q) ||
      jc.customer_name?.toLowerCase().includes(q) ||
      jc.license_plate?.toLowerCase().includes(q) ||
      jc.vehicle_vin?.toLowerCase().includes(q) ||
      jc.vin_number?.toLowerCase().includes(q) ||
      jc.vehicle_model?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: filtered?.length || 0,
    open: filtered?.filter((jc) => jc.status === "Draft" || jc.status === "Estimation Pending").length || 0,
    inProgress: filtered?.filter((jc) => ACTIVE_STATUSES.includes(jc.status)).length || 0,
    completed: filtered?.filter((jc) => jc.status === "Completed" || jc.status === "Delivered").length || 0,
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {/* Main listing — first on mobile */}
      <Card className="order-1 md:order-2">
        <CardHeader className="flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <CardTitle className="hidden md:block">Job Cards</CardTitle>
            <CardDescription className="hidden sm:block">
              Manage workshop job cards and track repairs
            </CardDescription>
            {!isLoading && totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground md:hidden">
                {(filtered?.length ?? 0) === totalItems
                  ? `${totalItems} job card${totalItems === 1 ? "" : "s"}`
                  : `${filtered?.length ?? 0} of ${totalItems} shown`}
              </p>
            ) : null}
          </div>
          <PermittedCreateButton
            module="job-cards"
            label="New Job Card"
            onClick={() => navigate("job-card-new")}
          />
        </CardHeader>
        <CardContent className="min-w-0 space-y-4">
          {hasListFilters && (
            <div className="flex flex-wrap items-center gap-2">
              {presetFilter ? (
                <Badge variant="outline">{presetFilterLabels[presetFilter]}</Badge>
              ) : statusFilter !== "all" ? (
                <Badge variant="outline">Status: {statusFilter}</Badge>
              ) : null}
              {openedRangeLabel ? (
                <Badge variant="outline">Opened: {openedRangeLabel}</Badge>
              ) : null}
              {completedRangeLabel ? (
                <Badge variant="outline">Completed: {completedRangeLabel}</Badge>
              ) : null}
              {jobCardTypeFilter !== "all" ? (
                <Badge variant="outline">Type: {jobCardTypeFilter}</Badge>
              ) : null}
              <ClearDateFiltersButton onClear={clearListFilters} />
            </div>
          )}

          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by job card ID, vehicle, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setPresetFilter(null);
              }}
            >
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
            <Select value={jobCardTypeFilter} onValueChange={setJobCardTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Filter by job card type" />
              </SelectTrigger>
              <SelectContent>
                {jobCardTypeFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label htmlFor="job-card-opened-from" className="text-xs text-muted-foreground">
                Open date from
              </Label>
              <Input
                id="job-card-opened-from"
                type="date"
                value={openedFrom}
                max={openedTo || undefined}
                onChange={(e) => setOpenedFrom(e.target.value)}
                aria-label="Open date from"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-card-opened-to" className="text-xs text-muted-foreground">
                Open date to
              </Label>
              <Input
                id="job-card-opened-to"
                type="date"
                value={openedTo}
                min={openedFrom || undefined}
                onChange={(e) => setOpenedTo(e.target.value)}
                aria-label="Open date to"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-card-completed-from" className="text-xs text-muted-foreground">
                Completed date from
              </Label>
              <Input
                id="job-card-completed-from"
                type="date"
                value={completedFrom}
                max={completedTo || undefined}
                onChange={(e) => setCompletedFrom(e.target.value)}
                aria-label="Completed date from"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="job-card-completed-to" className="text-xs text-muted-foreground">
                Completed date to
              </Label>
              <Input
                id="job-card-completed-to"
                type="date"
                value={completedTo}
                min={completedFrom || undefined}
                onChange={(e) => setCompletedTo(e.target.value)}
                aria-label="Completed date to"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex h-48 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex h-48 items-center justify-center text-muted-foreground">
              Failed to load job cards
            </div>
          ) : filtered && filtered.length > 0 ? (
            <>
              <div className="space-y-3 md:hidden">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tap a row for details
                </p>
                {filtered.map((jc) => {
                  const vehicle = vehicleListingLines({
                    vin: jc.vin_number || jc.vehicle_vin,
                    model: jc.vehicle_model,
                    license: jc.license_plate,
                  });
                  return (
                  <div
                    key={jc.name}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(jc.name)}
                        className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
                      >
                        <p className="truncate font-medium" title={jc.customer_name}>
                          {jc.customer_name}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">{jc.name}</p>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p className="truncate font-medium text-foreground" title={vehicle.primary}>
                            {vehicle.primary}
                          </p>
                          {vehicle.secondary ? (
                            <p className="truncate" title={vehicle.secondary}>
                              {vehicle.secondary}
                            </p>
                          ) : null}
                          <Badge variant="outline" className="mt-1">
                            {jc.job_card_type}
                          </Badge>
                        </div>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2 self-stretch">
                        <StatusBadge status={resolveJobCardWorkflowStatus(jc.status, jc.docstatus)} />
                        {jc.is_repeat_repair ? (
                          <RepeatJobBadge reference={jc.repeat_repair_reference} />
                        ) : null}
                        {jc.invoice ? (
                          <PaymentStatusBadge
                            paymentStatus={jc.payment_status}
                            hasInvoice
                          />
                        ) : null}
                        <div className="mt-auto">
                          <ListRowActions doctype="DMS Job Card" docName={jc.name}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedId(jc.name)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => navigate("job-card-detail", { id: jc.name })}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Open Job Card
                                </DropdownMenuItem>
                                {jc.status === "Draft" ? (
                                  <DropdownMenuItem
                                    onClick={() => navigate("job-card-new", { id: jc.name })}
                                  >
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Continue Editing
                                  </DropdownMenuItem>
                                ) : null}
                                {canCreateRepeatJob(jc) ? (
                                  <DropdownMenuItem onClick={() => openRepeatDialog(jc)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Create Repeat Job
                                  </DropdownMenuItem>
                                ) : null}
                                {isCancelledJobCard(jc) && !jc.already_amended ? (
                                  <DropdownMenuItem
                                    disabled={creatingVersion === jc.name}
                                    onClick={() => void handleAmend(jc)}
                                  >
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    Amend
                                  </DropdownMenuItem>
                                ) : null}
                                {isCancelledJobCard(jc) && jc.amended_as ? (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate("job-card-detail", { id: jc.amended_as! })
                                    }
                                  >
                                    <FilePenLine className="mr-2 h-4 w-4" />
                                    Open Amendment
                                  </DropdownMenuItem>
                                ) : null}
                                {isCancelledJobCard(jc) ? (
                                  <DropdownMenuItem
                                    disabled={creatingVersion === jc.name}
                                    onClick={() => void handleCreateNewVersion(jc)}
                                  >
                                    <Copy className="mr-2 h-4 w-4" />
                                    New Version
                                  </DropdownMenuItem>
                                ) : null}
                                {canCancelJobCard(jc) ? (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => {
                                      setCancelReason("");
                                      setCancelTarget(jc);
                                    }}
                                  >
                                    <XCircle className="mr-2 h-4 w-4" />
                                    Cancel Job Card
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </ListRowActions>
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>

              <div className="mt-4 md:hidden">
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
              </div>

              <div className="dms-table-panel hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">Job Card ID</TableHead>
                    <TableHead className="w-[180px]">Vehicle</TableHead>
                    <TableHead className="w-[160px]">Customer</TableHead>
                    <TableHead className="w-[170px]">Status</TableHead>
                    <TableHead className="w-[130px]">Payment Status</TableHead>
                    <TableHead className="w-[230px]">Progress</TableHead>
                    <TableHead className="w-[130px]">Service Type</TableHead>
                    <TableHead className="w-[100px]">Due Date</TableHead>
                    <TableHead className="w-[56px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((jc) => {
                    const vehicle = vehicleListingLines({
                      vin: jc.vin_number || jc.vehicle_vin,
                      model: jc.vehicle_model,
                      license: jc.license_plate,
                    });
                    return (
                    <TableRow key={jc.name} className="hover:bg-muted/50">
                      <TableCell>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedId(jc.name);
                          }}
                          className="font-medium text-primary hover:underline"
                        >
                          {jc.name}
                        </button>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="min-w-0">
                          <p className="max-w-[180px] truncate font-medium" title={vehicle.primary}>
                            {vehicle.primary}
                          </p>
                          {vehicle.secondary ? (
                            <p
                              className="max-w-[180px] truncate text-sm text-muted-foreground"
                              title={vehicle.secondary}
                            >
                              {vehicle.secondary}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[160px]">
                        <p className="max-w-[160px] truncate font-medium" title={jc.customer_name}>
                          {jc.customer_name}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={resolveJobCardWorkflowStatus(jc.status, jc.docstatus)} />
                          {jc.is_repeat_repair ? (
                            <RepeatJobBadge reference={jc.repeat_repair_reference} />
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge
                          paymentStatus={jc.payment_status}
                          hasInvoice={Boolean(jc.invoice)}
                        />
                      </TableCell>
                      <TableCell>
                        <WorkflowProgress
                          status={jc.status}
                          docstatus={jc.docstatus}
                          onOpen={() =>
                            jc.status === "Draft"
                              ? navigate("job-card-new", { id: jc.name })
                              : navigate("job-card-detail", { id: jc.name })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{jc.job_card_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {jc.promised_delivery_date_time
                          ? new Date(jc.promised_delivery_date_time).toLocaleDateString()
                          : "–"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ListRowActions doctype="DMS Job Card" docName={jc.name}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(jc.name)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate("job-card-detail", { id: jc.name })}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              {jc.status === "Draft" ? (
                                <DropdownMenuItem onClick={() => navigate("job-card-new", { id: jc.name })}>
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Continue Editing
                                </DropdownMenuItem>
                              ) : null}
                              {canCreateRepeatJob(jc) ? (
                                <DropdownMenuItem onClick={() => openRepeatDialog(jc)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Create Repeat Job
                                </DropdownMenuItem>
                              ) : null}
                              {isCancelledJobCard(jc) && !jc.already_amended ? (
                                <DropdownMenuItem
                                  disabled={creatingVersion === jc.name}
                                  onClick={() => void handleAmend(jc)}
                                >
                                  <FilePenLine className="h-4 w-4 mr-2" />
                                  Amend
                                </DropdownMenuItem>
                              ) : null}
                              {isCancelledJobCard(jc) && jc.amended_as ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate("job-card-detail", { id: jc.amended_as! })
                                  }
                                >
                                  <FilePenLine className="h-4 w-4 mr-2" />
                                  Open Amendment
                                </DropdownMenuItem>
                              ) : null}
                              {isCancelledJobCard(jc) ? (
                                <DropdownMenuItem
                                  disabled={creatingVersion === jc.name}
                                  onClick={() => void handleCreateNewVersion(jc)}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  New Version
                                </DropdownMenuItem>
                              ) : null}
                              {canCancelJobCard(jc) ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => {
                                    setCancelReason("");
                                    setCancelTarget(jc);
                                  }}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Cancel Job Card
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
            </>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-muted-foreground md:h-48 md:border-0 md:py-0">
              <Wrench className="mb-4 h-12 w-12 opacity-50" />
              <p className="text-sm font-medium">No job cards found</p>
              <Button variant="link" className="mt-2" onClick={() => navigate("job-card-new")}>
                Create your first job card
              </Button>
            </div>
          )}

          {filtered && filtered.length > 0 ? (
            <div className="hidden md:block">
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
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Summary stats — hidden on mobile by default */}
      <div className="order-2 space-y-3 md:order-1">
        <div className="flex items-center justify-between md:hidden">
          <p className="text-sm font-medium text-muted-foreground">Summary</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setShowMobileStats((open) => !open)}
          >
            <BarChart3 className="mr-2 h-3.5 w-3.5" />
            {showMobileStats ? "Hide stats" : "Show stats"}
            <ChevronDown
              className={cn(
                "ml-2 h-3.5 w-3.5 transition-transform",
                showMobileStats && "rotate-180",
              )}
            />
          </Button>
        </div>
        <div
          className={cn(
            "grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
            showMobileStats ? "grid" : "hidden md:grid",
          )}
        >
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center justify-between px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Total Jobs</p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.total}</p>
              </div>
              <div className="rounded-full bg-primary/10 p-2 sm:p-2">
                <FileText className="h-3.5 w-3.5 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center justify-between px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Open</p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.open}</p>
              </div>
              <div className="rounded-full bg-[#1E88E5]/10 p-2 sm:p-2">
                <Clock className="h-3.5 w-3.5 text-[#1E88E5]" />
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center justify-between px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">In Progress</p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.inProgress}</p>
              </div>
              <div className="rounded-full bg-[#F9A825]/10 p-2 sm:p-2">
                <Wrench className="h-3.5 w-3.5 text-[#F9A825]" />
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center justify-between px-3.5 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Completed</p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.completed}</p>
              </div>
              <div className="rounded-full bg-[#2E7D32]/10 p-2 sm:p-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#2E7D32]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        title={selectedId || ""}
        subtitle={selectedJobCard?.customer_name}
        badge={selectedJobCard ? { label: selectedJobCard.status } : undefined}
        isLoading={detailLoading}
        contentScroll="inner"
        onOpenInDesk={() => window.open(`/app/dms-job-card/${selectedId}`, '_blank')}
      >
        {selectedJobCard && selectedId && (
          <JobCardDetailSheetContent
            key={selectedId}
            jobCard={selectedJobCard}
            onOpenFullDetails={() => {
              setSelectedId(null);
              navigate("job-card-detail", { id: selectedId });
            }}
          />
        )}
      </DetailSheet>

      <CreateRepeatJobDialog
        open={!!repeatSource}
        onOpenChange={(open) => {
          if (!open) setRepeatSource(null);
        }}
        sourceJobCard={repeatSource?.name || ""}
        defaultComplaint={repeatSource?.customer_complaint_summary}
        vehicleVin={repeatSource?.vehicle_vin}
        company={repeatSource?.company}
        onCreated={(name) => {
          setRepeatSource(null);
          navigate("job-card-detail", { id: name });
        }}
      />

      <Dialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Job Card</DialogTitle>
            <DialogDescription>
              {cancelTarget
                ? `Cancel ${cancelTarget.name}? Linked parts stock transfers will be reversed. The job card is not deleted — filter status to Cancelled to find it later.`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="list-cancel-reason">Reason (optional)</Label>
            <Textarea
              id="list-cancel-reason"
              placeholder="Why is this job card being cancelled?"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelTarget(null);
                setCancelReason("");
              }}
              disabled={cancelling}
            >
              Keep Job Card
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              <XCircle className="h-4 w-4 mr-2" />
              {cancelling ? "Cancelling…" : "Cancel Job Card"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
