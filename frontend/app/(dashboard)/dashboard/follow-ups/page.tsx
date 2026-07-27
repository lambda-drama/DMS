"use client";

import { useEffect, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { useFollowUp, useFollowUps } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DetailSheet,
  DetailSection,
  DetailRow,
} from "@/components/detail-sheet";
import { ListRowActions } from "@/components/list-row-actions";
import {
  Search,
  MoreHorizontal,
  Eye,
  Phone,
  CalendarClock,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import * as followUpsSvc from "@/services/followUps";
import { mutate as globalMutate } from "swr";

const statusFilterOptions = [
  { value: "all", label: "All statuses" },
  { value: "Pending", label: "Pending" },
  { value: "Reached", label: "Reached" },
  { value: "Not Reached", label: "Not Reached" },
  { value: "Callback Requested", label: "Callback Requested" },
  { value: "Wrong Number", label: "Wrong Number" },
  { value: "Customer Not Interested", label: "Not Interested" },
];

/** Soft tint badges — same style as invoice status chips */
function contactStatusClass(status?: string): string {
  switch (status) {
    case "Reached":
      return "bg-[#2E7D32]/10 text-[#2E7D32] border-0";
    case "Pending":
    case "Callback Requested":
      return "bg-[#F9A825]/10 text-[#F9A825] border-0";
    case "Not Reached":
    case "Wrong Number":
    case "Number Disconnected":
      return "bg-destructive/10 text-destructive border-0";
    case "Customer Not Interested":
      return "bg-muted text-muted-foreground border-0";
    default:
      return "bg-muted text-muted-foreground border-0";
  }
}

const overdueStatusClass = "bg-destructive/10 text-destructive border-0";

export default function FollowUpsPage() {
  const { navigate, viewParams } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [presetFilter, setPresetFilter] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleDue, setScheduleDue] = useState("");
  const [scheduleNext, setScheduleNext] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [scheduleBusy, setScheduleBusy] = useState(false);

  useEffect(() => {
    const id = viewParams.get("id");
    if (id) setSelectedId(id);
    const filter = viewParams.get("filter");
    if (filter === "pending" || filter === "overdue" || filter === "due_today") {
      setPresetFilter(filter);
      setStatusFilter("all");
    }
  }, [viewParams]);

  const { data: result, isLoading, error, mutate } = useFollowUps({
    status: statusFilter !== "all" ? statusFilter : undefined,
    filter: presetFilter || undefined,
    search: searchQuery || undefined,
    limit: 50,
  });
  const followUps = result?.data || [];
  const { data: selected, isLoading: detailLoading, mutate: mutateDetail } = useFollowUp(
    selectedId
  );

  const stats = {
    total: result?.total ?? followUps.length,
    pending: followUps.filter((f) => f.contact_status === "Pending").length,
    overdue: followUps.filter((f) => f.is_overdue).length,
    reached: followUps.filter((f) => f.contact_status === "Reached").length,
  };

  const openSchedule = (id: string, due?: string) => {
    setSelectedId(id);
    setScheduleDue(due ? due.slice(0, 10) : "");
    setScheduleNext("");
    setScheduleNotes("");
    setScheduleOpen(true);
  };

  const handleSchedule = async () => {
    if (!selectedId) return;
    if (!scheduleDue && !scheduleNext) {
      toast.error("Set a due date or next attempt date");
      return;
    }
    setScheduleBusy(true);
    try {
      await followUpsSvc.scheduleFollowUp(selectedId, {
        follow_up_due_date: scheduleDue || undefined,
        next_attempt_date: scheduleNext
          ? `${scheduleNext.replace("T", " ")}:00`
          : undefined,
        contact_notes: scheduleNotes.trim() || undefined,
      });
      toast.success("Follow-up rescheduled");
      setScheduleOpen(false);
      void mutate();
      void mutateDetail();
      void globalMutate((key) => Array.isArray(key) && key[0] === "follow-ups");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to schedule");
    } finally {
      setScheduleBusy(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="dms-stat-value text-xl text-foreground">Follow-ups</h1>
          <p className="mt-1 hidden text-muted-foreground sm:block">
            Schedule and track customer follow-ups after service
          </p>
        </div>
        <PermittedCreateButton
          module="follow-ups"
          label="New Follow-up"
          onClick={() => navigate("follow-up-new")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Total
            </p>
            <p className="dms-stat-value text-xl sm:text-2xl">{stats.total}</p>
          </CardContent>
        </Card>
        <Card
          className="dms-kpi-card cursor-pointer"
          onClick={() => {
            setPresetFilter("pending");
            setStatusFilter("all");
          }}
        >
          <CardContent className="px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Pending
                </p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.pending}</p>
              </div>
              <Clock className="h-4 w-4 text-amber-600" />
            </div>
          </CardContent>
        </Card>
        <Card
          className="dms-kpi-card cursor-pointer"
          onClick={() => {
            setPresetFilter("overdue");
            setStatusFilter("all");
          }}
        >
          <CardContent className="px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Overdue
                </p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </CardContent>
        </Card>
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Reached
                </p>
                <p className="dms-stat-value text-xl sm:text-2xl">{stats.reached}</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Follow-up list</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by ID, customer, VIN, job card…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setPresetFilter(null);
              }}
            >
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {presetFilter ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPresetFilter(null)}
              >
                Clear filter
              </Button>
            ) : null}
          </div>

          {isLoading ? (
            <p className="py-8 text-center text-muted-foreground">Loading…</p>
          ) : error ? (
            <p className="py-8 text-center text-destructive">Failed to load follow-ups</p>
          ) : followUps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Phone className="mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">No follow-ups found</p>
              <Button
                variant="link"
                className="mt-1"
                onClick={() => navigate("follow-up-new")}
              >
                Schedule your first follow-up
              </Button>
            </div>
          ) : (
            <div className="dms-table-panel overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Follow-up</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Job Card</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map((fu) => (
                    <TableRow key={fu.name} className="hover:bg-muted/50">
                      <TableCell>
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline"
                          onClick={() => setSelectedId(fu.name)}
                        >
                          {fu.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{fu.customer_name || fu.customer}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{fu.license_plate || fu.vehicle_vin || "—"}</p>
                        {fu.vehicle_model ? (
                          <p className="text-xs text-muted-foreground">{fu.vehicle_model}</p>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span>
                            {fu.follow_up_due_date
                              ? new Date(fu.follow_up_due_date).toLocaleDateString()
                              : "—"}
                          </span>
                          {fu.is_overdue ? (
                            <Badge className={`${overdueStatusClass} w-fit text-[10px]`}>
                              Overdue
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={contactStatusClass(fu.contact_status)}>
                          {fu.contact_status || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {fu.job_card || "Standalone"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ListRowActions doctype="Customer Follow Up" docName={fu.name}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(fu.name)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openSchedule(fu.name, fu.follow_up_due_date)}
                              >
                                <CalendarClock className="mr-2 h-4 w-4" />
                                Reschedule
                              </DropdownMenuItem>
                              {fu.job_card ? (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate("job-card-detail", { id: fu.job_card! })
                                  }
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Open Job Card
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
          )}
        </CardContent>
      </Card>

      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={selectedId || ""}
        subtitle={selected?.customer_name || selected?.customer}
        badge={
          selected?.contact_status
            ? { label: selected.contact_status }
            : undefined
        }
        isLoading={detailLoading}
        onOpenInDesk={() =>
          window.open(`/app/customer-follow-up/${selectedId}`, "_blank")
        }
      >
        {selected ? (
          <>
            <DetailSection title="Schedule">
              <DetailRow
                label="Due date"
                value={
                  selected.follow_up_due_date
                    ? new Date(selected.follow_up_due_date).toLocaleDateString()
                    : undefined
                }
              />
              <DetailRow
                label="Next attempt"
                value={
                  selected.next_attempt_date
                    ? new Date(selected.next_attempt_date).toLocaleString()
                    : undefined
                }
              />
              <DetailRow label="Assigned to" value={selected.assigned_to} />
              <DetailRow label="Contact method" value={selected.contact_method} />
              <DetailRow label="Case status" value={selected.case_status} />
            </DetailSection>
            <DetailSection title="Links">
              <DetailRow label="Customer" value={selected.customer_name || selected.customer} />
              <DetailRow label="VIN" value={selected.vehicle_vin} />
              <DetailRow label="Job Card" value={selected.job_card || "Standalone"} />
              <DetailRow label="Delivery" value={selected.delivery} />
            </DetailSection>
            {selected.contact_notes ? (
              <DetailSection title="Notes">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm"
                  dangerouslySetInnerHTML={{ __html: selected.contact_notes }}
                />
              </DetailSection>
            ) : null}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => openSchedule(selected.name, selected.follow_up_due_date)}
              >
                <CalendarClock className="mr-2 h-4 w-4" />
                Reschedule
              </Button>
              {selected.job_card ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate("job-card-detail", { id: selected.job_card! })
                  }
                >
                  Open Job Card
                </Button>
              ) : null}
            </div>
          </>
        ) : null}
      </DetailSheet>

      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule follow-up</DialogTitle>
            <DialogDescription>
              Update the due date or set a next attempt for {selectedId}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label htmlFor="fu-due">Follow-up due date</Label>
              <Input
                id="fu-due"
                type="date"
                value={scheduleDue}
                onChange={(e) => setScheduleDue(e.target.value)}
                disabled={scheduleBusy}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fu-next">Next attempt (optional)</Label>
              <Input
                id="fu-next"
                type="datetime-local"
                value={scheduleNext}
                onChange={(e) => setScheduleNext(e.target.value)}
                disabled={scheduleBusy}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fu-notes">Notes (optional)</Label>
              <Textarea
                id="fu-notes"
                rows={3}
                value={scheduleNotes}
                onChange={(e) => setScheduleNotes(e.target.value)}
                disabled={scheduleBusy}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)} disabled={scheduleBusy}>
              Cancel
            </Button>
            <Button onClick={() => void handleSchedule()} disabled={scheduleBusy}>
              Save schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
