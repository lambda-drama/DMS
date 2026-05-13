"use client";

import { useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCards } from "@/hooks/use-dms";
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

function WorkflowProgress({ status }: { status: JobCardStatus }) {
  const stages = ["Draft", "Estimation", "Repair", "Road Test", "QC", "Completed"];
  const stageMap: Record<string, number> = {
    Draft: 0,
    "Estimation Pending": 1,
    "Estimation Approved": 1,
    "Waiting Customer Approval": 1,
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

  if (currentIndex < 0 || status === "Cancelled") return null;

  return (
    <div className="flex items-center gap-1">
      {stages.map((_, index) => (
        <div
          key={index}
          className={`h-1.5 w-6 rounded-full transition-colors ${
            index <= currentIndex
              ? index === currentIndex
                ? "bg-primary"
                : "bg-primary/60"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

export default function JobCardsPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: jobCards, isLoading, error } = useJobCards({
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

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
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
            <div className="overflow-x-auto">
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
                    <TableRow key={jc.name} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => navigate("job-card-detail", { id: jc.name })}
                          className="font-medium text-primary hover:underline"
                        >
                          {jc.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{jc.license_plate || jc.vehicle_registration}</p>
                          <p className="text-sm text-muted-foreground">{jc.vehicle_model}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{jc.customer_name}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{jc.service_type}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={jc.status} />
                      </TableCell>
                      <TableCell>
                        <WorkflowProgress status={jc.status} />
                      </TableCell>
                      <TableCell>
                        {jc.promised_delivery_date_time
                          ? new Date(jc.promised_delivery_date_time).toLocaleDateString()
                          : jc.expected_completion_date
                            ? new Date(jc.expected_completion_date).toLocaleDateString()
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
                            <DropdownMenuItem onClick={() => navigate("job-card-detail", { id: jc.name })}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            {jc.status === "Draft" && (
                              <DropdownMenuItem onClick={() => navigate("job-card-detail", { id: jc.name, mode: "edit" })}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
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
        </CardContent>
      </Card>
    </div>
  );
}
