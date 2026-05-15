"use client";

import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCards, useJobCard } from "@/hooks/use-dms";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  FileText,
  Wrench,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { StatusBadge } from "@/components/job-card/status-badge";
import { PaginationControls } from "@/components/pagination-controls";
import type { JobCardStatus } from "@/types/dms";

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
  onOpen,
}: {
  status: JobCardStatus;
  onOpen?: () => void;
}) {
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
  const currentIndex = stageMap[status] ?? -1;

  if (currentIndex < 0 || status === "Cancelled") {
    if (!onOpen) return <span className="text-sm text-muted-foreground">—</span>;
    return (
      <button
        type="button"
        onClick={onOpen}
        className="text-sm text-muted-foreground hover:text-primary hover:underline"
      >
        {status}
      </button>
    );
  }

  const bar = (
    <div className="flex items-center gap-0.5 min-w-[200px]" title={status}>
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

export default function JobCardsPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: result, isLoading, error } = useJobCards({
    status: statusFilter !== "all" ? statusFilter : undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const jobCards = result?.data;
  const totalItems = result?.total || 0;
  const { data: selectedJobCard, isLoading: detailLoading } = useJobCard(selectedId);

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

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
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Job Cards</h1>
          <p className="text-muted-foreground mt-1">Manage workshop job cards and track repairs</p>
        </div>
        <Button onClick={() => navigate("job-card-new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Job Card
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#1E88E5]/10">
                <Clock className="h-5 w-5 text-[#1E88E5]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{stats.inProgress}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#F9A825]/10">
                <Wrench className="h-5 w-5 text-[#F9A825]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#2E7D32]/10">
                <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by job card ID, vehicle, customer..."
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
                {statusFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Job Cards List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Failed to load job cards
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="dms-table-panel">
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
                        <StatusBadge status={jc.status} />
                      </TableCell>
                      <TableCell>
                        <WorkflowProgress
                          status={jc.status}
                          onOpen={() => navigate("job-card-detail", { id: jc.name })}
                        />
                      </TableCell>
                      <TableCell>
                        {jc.promised_delivery_date_time
                          ? new Date(jc.promised_delivery_date_time).toLocaleDateString()
                          : "–"}
                      </TableCell>
                      <TableCell className="text-right">
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Wrench className="h-12 w-12 mb-4 opacity-50" />
              <p>No job cards found</p>
              <Button variant="link" className="mt-2" onClick={() => navigate("job-card-new")}>
                Create your first job card
              </Button>
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

      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        title={selectedId || ""}
        subtitle={selectedJobCard?.customer_name}
        badge={selectedJobCard ? { label: selectedJobCard.status } : undefined}
        isLoading={detailLoading}
        onOpenInDesk={() => window.open(`/app/dms-job-card/${selectedId}`, '_blank')}
      >
        {selectedJobCard && (
          <>
            <DetailSection title="Customer & Vehicle">
              <DetailRow label="Customer" value={selectedJobCard.customer_name} />
              <DetailRow label="Vehicle" value={selectedJobCard.vehicle_model} />
              <DetailRow label="License Plate" value={selectedJobCard.license_plate} />
              <DetailRow label="VIN" value={selectedJobCard.vehicle_vin} />
              <DetailRow label="Odometer" value={selectedJobCard.current_odometer ? `${selectedJobCard.current_odometer} km` : undefined} />
            </DetailSection>
            <DetailSection title="Service Details">
              <DetailRow label="Type" value={selectedJobCard.job_card_type} />
              <DetailRow label="Priority" value={selectedJobCard.priority} />
              <DetailRow label="Service Advisor" value={selectedJobCard.service_advisor} />
              <DetailRow label="Lead Technician" value={selectedJobCard.lead_technician_name || selectedJobCard.lead_technician} />
              <DetailRow label="Service Bay" value={selectedJobCard.assigned_bay} />
              <DetailRow label="Warranty" value={selectedJobCard.warranty_status} />
            </DetailSection>
            <DetailSection title="Timing">
              <DetailRow label="Opened" value={selectedJobCard.opened_date_time ? new Date(selectedJobCard.opened_date_time).toLocaleString() : undefined} />
              <DetailRow label="Promised Delivery" value={selectedJobCard.promised_delivery_date_time ? new Date(selectedJobCard.promised_delivery_date_time).toLocaleString() : undefined} />
              <DetailRow label="Completed" value={selectedJobCard.completed_date_time ? new Date(selectedJobCard.completed_date_time).toLocaleString() : undefined} />
              <DetailRow label="Est. Duration" value={selectedJobCard.estimated_duration_hours ? `${selectedJobCard.estimated_duration_hours} hrs` : undefined} />
              <DetailRow label="Actual Duration" value={selectedJobCard.actual_duration_hours ? `${selectedJobCard.actual_duration_hours} hrs` : undefined} />
            </DetailSection>
            <DetailSection title="Financials">
              <DetailRow label="Labor Cost" value={selectedJobCard.total_labor_cost?.toLocaleString()} />
              <DetailRow label="Parts Cost" value={selectedJobCard.total_parts_cost?.toLocaleString()} />
              <DetailRow label="Total Amount" value={selectedJobCard.total_amount?.toLocaleString()} />
              <DetailRow label="Approval Status" value={selectedJobCard.customer_approval_status} />
              <DetailRow label="Payment Status" value={selectedJobCard.payment_status} />
              <DetailRow label="Invoice" value={selectedJobCard.invoice} />
            </DetailSection>
            {selectedJobCard.customer_complaint_summary && (
              <DetailSection title="Customer Complaints">
                <p className="text-sm">{selectedJobCard.customer_complaint_summary}</p>
              </DetailSection>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setSelectedId(null); navigate('job-card-detail', { id: selectedId! }); }}>
                Open Full Details
              </Button>
            </div>
          </>
        )}
      </DetailSheet>
    </div>
  );
}
