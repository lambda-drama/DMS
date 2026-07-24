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
} from "lucide-react";
import { RepeatJobBadge, StatusBadge } from "@/components/job-card/status-badge";
import { CreateRepeatJobDialog } from "@/components/job-card/create-repeat-job-dialog";
import { resolveJobCardWorkflowStatus } from "@/lib/job-card-workflow";
import { PaginationControls } from "@/components/pagination-controls";
import { ListRowActions } from "@/components/list-row-actions";
import { cn } from "@/lib/utils";
import type { DMSJobCard, JobCardStatus } from "@/types/dms";

function canCreateRepeatJob(jc: Pick<DMSJobCard, "status" | "job_card_type">) {
  return (
    jc.job_card_type !== "Internal" &&
    (jc.status === "Completed" || jc.status === "Delivered")
  );
}

const statusFilterOptions: { value: string; label: string }[] = [
  { value: "all", label: "All Statuses" },
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
      title="Open job card to continue workflow"
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

export default function JobCardsPage() {
  const { navigate, viewParams } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [presetFilter, setPresetFilter] = useState<"active" | "qc" | "qc_failed" | "overdue" | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [repeatSource, setRepeatSource] = useState<DMSJobCard | null>(null);

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

  const { data: result, isLoading, error } = useJobCards({
    status: statusFilter !== "all" ? statusFilter : undefined,
    filter: presetFilter || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const jobCards = result?.data;
  const totalItems = result?.total || 0;
  const { data: selectedJobCard, isLoading: detailLoading } = useJobCard(selectedId);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, presetFilter]);

  const clearListFilters = () => {
    setStatusFilter("all");
    setPresetFilter(null);
    navigate("job-cards");
  };

  const filtered = jobCards?.filter((jc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      jc.name?.toLowerCase().includes(q) ||
      jc.customer_name?.toLowerCase().includes(q) ||
      jc.license_plate?.toLowerCase().includes(q) ||
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
          {(presetFilter || statusFilter !== "all") && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {presetFilter
                  ? presetFilterLabels[presetFilter]
                  : `Status: ${statusFilter}`}
              </Badge>
              <Button variant="ghost" size="sm" onClick={clearListFilters}>
                Clear filter
              </Button>
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
                {filtered.map((jc) => (
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
                        <p className="font-medium">{jc.customer_name}</p>
                        <p className="truncate text-sm text-muted-foreground">{jc.name}</p>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p>
                            {jc.license_plate || "—"}
                            {jc.vehicle_model ? ` · ${jc.vehicle_model}` : ""}
                          </p>
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
                                {canCreateRepeatJob(jc) ? (
                                  <DropdownMenuItem onClick={() => openRepeatDialog(jc)}>
                                    <RotateCcw className="mr-2 h-4 w-4" />
                                    Create Repeat Job
                                  </DropdownMenuItem>
                                ) : null}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </ListRowActions>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 md:hidden">
                <PaginationControls
                  page={page}
                  pageSize={pageSize}
                  totalItems={totalItems}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                />
              </div>

              <div className="dms-table-panel hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Card ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((jc) => (
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
                      <TableCell>
                        <div>
                          <p className="font-medium">{jc.license_plate || "—"}</p>
                          <p className="text-sm text-muted-foreground">{jc.vehicle_model}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{jc.customer_name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{jc.job_card_type}</Badge>
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
                        <WorkflowProgress
                          status={jc.status}
                          docstatus={jc.docstatus}
                          onOpen={() => navigate("job-card-detail", { id: jc.name })}
                        />
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
                              {canCreateRepeatJob(jc) ? (
                                <DropdownMenuItem onClick={() => openRepeatDialog(jc)}>
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Create Repeat Job
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
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
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
    </div>
  );
}
