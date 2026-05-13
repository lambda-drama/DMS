"use client";

import { useState, useCallback } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCard } from "@/hooks/use-dms";
import * as jobCardsSvc from "@/services/jobCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Clock,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Pencil,
  Printer,
  ClipboardList,
  Settings2,
  Truck,
  DollarSign,
  Play,
  Pause,
  ChevronRight,
  Shield,
  Package,
  Timer,
  RotateCcw,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import type { JobCardStatus, DMSJobCard } from "@/types/dms";
import { StatusBadge } from "@/components/job-card/status-badge";
import { WorkflowStepper } from "@/components/job-card/workflow-stepper";
import { RepairTimer } from "@/components/job-card/repair-timer";

export default function JobCardDetailPage() {
  const { viewParams, navigate } = useNavigation();
  const id = viewParams.get("id") || "";
  const { data: jobCard, isLoading, error, mutate } = useJobCard(id || null);
  const [activeTab, setActiveTab] = useState("overview");
  const [busy, setBusy] = useState(false);

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvalReference, setApprovalReference] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState<"Waiting Parts" | "Waiting Customer Approval">("Waiting Parts");
  const [showRoadTestFailDialog, setShowRoadTestFailDialog] = useState(false);
  const [roadTestFailReason, setRoadTestFailReason] = useState("");
  const [showRoadTestPassDialog, setShowRoadTestPassDialog] = useState(false);
  const [roadTestPassNotes, setRoadTestPassNotes] = useState("");
  const [showQCFailDialog, setShowQCFailDialog] = useState(false);
  const [qcFailReason, setQcFailReason] = useState("");

  const runAction = useCallback(
    async (label: string, action: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await action();
        toast.success(label);
        await mutate();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : `Failed: ${label}`);
      } finally {
        setBusy(false);
      }
    },
    [mutate]
  );

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">No job card ID provided</p>
        <Button variant="outline" onClick={() => navigate("job-cards")}>
          Back to Job Cards
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !jobCard) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">Failed to load job card</p>
        <Button variant="outline" onClick={() => navigate("job-cards")}>
          Go Back
        </Button>
      </div>
    );
  }

  const status = jobCard.status;
  const docstatus = jobCard.docstatus ?? 0;

  // ─── Workflow Action Handlers ───────────────────────────────

  const handleSubmitForEstimation = () =>
    runAction("Submitted for Estimation", async () => {
      if (docstatus === 0) {
        await jobCardsSvc.submitJobCard(id);
      }
      await jobCardsSvc.submitForEstimation(id);
    });

  const handleMarkCustomerApproved = () => {
    if (!approvalReference.trim()) {
      toast.error("Approval reference is required");
      return;
    }
    runAction("Customer Approved", async () => {
      await jobCardsSvc.markCustomerApproved(
        id,
        approvalReference,
        approvedAmount ? parseFloat(approvedAmount) : undefined
      );
    });
    setShowApproveDialog(false);
    setApprovalReference("");
    setApprovedAmount("");
  };

  const handleStartRepair = () =>
    runAction("Repair Started", async () => {
      const timeLogs = [];
      if (jobCard.lead_technician) {
        timeLogs.push({
          technician: jobCard.lead_technician,
          technician_name: jobCard.lead_technician_name || jobCard.lead_technician,
          start_time: new Date().toISOString().replace("T", " ").slice(0, 19),
        });
      }
      await jobCardsSvc.startRepair(id, timeLogs.length > 0 ? timeLogs : undefined);
    });

  const handlePauseRepair = () => {
    const openLogs = (jobCard.time_logs || []).filter((l) => l.start_time && !l.end_time);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const closedLogs = openLogs.map((l) => ({
      name: l.name,
      end_time: now,
      duration_hours: (Date.now() - new Date(l.start_time).getTime()) / 3600000,
      pause_reason: pauseReason,
    }));
    runAction(`Paused – ${pauseReason}`, () =>
      jobCardsSvc.pauseRepair(id, pauseReason, closedLogs)
    );
    setShowPauseDialog(false);
  };

  const handleCompleteRepair = () => {
    const openLogs = (jobCard.time_logs || []).filter((l) => l.start_time && !l.end_time);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const closedLogs = openLogs.map((l) => ({
      name: l.name,
      end_time: now,
      duration_hours: (Date.now() - new Date(l.start_time).getTime()) / 3600000,
    }));
    runAction("Repair Completed", () => jobCardsSvc.completeRepair(id, closedLogs, now));
  };

  const handlePartsArrived = () =>
    runAction("Parts Arrived – Resuming Repair", () => jobCardsSvc.partsArrived(id));

  const handleCustomerApprovedDuringRepair = () =>
    runAction("Customer Approved – Resuming Repair", () =>
      jobCardsSvc.customerApprovedDuringRepair(id)
    );

  const handleStartRoadTest = () =>
    runAction("Road Test Started", () => jobCardsSvc.startRoadTest(id));

  const handlePassRoadTest = () => {
    runAction("Road Test Passed", () =>
      jobCardsSvc.passRoadTest(id, roadTestPassNotes || undefined)
    );
    setShowRoadTestPassDialog(false);
    setRoadTestPassNotes("");
  };

  const handleFailRoadTest = () => {
    if (!roadTestFailReason.trim()) {
      toast.error("Fail reason is required");
      return;
    }
    runAction("Road Test Failed – Rework Required", () =>
      jobCardsSvc.failRoadTest(id, roadTestFailReason)
    );
    setShowRoadTestFailDialog(false);
    setRoadTestFailReason("");
  };

  const handleStartQC = () =>
    runAction("QC Check Started", () => jobCardsSvc.startQC(id));

  const handlePassQC = () =>
    runAction("QC Passed – Completed", () => jobCardsSvc.passQC(id));

  const handleFailQC = () => {
    if (!qcFailReason.trim()) {
      toast.error("Fail reason is required");
      return;
    }
    runAction("QC Failed – Rework Required", () =>
      jobCardsSvc.failQC(id, qcFailReason)
    );
    setShowQCFailDialog(false);
    setQcFailReason("");
  };

  const handleReworkCompleted = () =>
    runAction("Rework Completed", () => jobCardsSvc.reworkCompleted(id));

  const handleCreateInvoice = () =>
    runAction("Sales Invoice Created", () => jobCardsSvc.makeSalesInvoice(id));

  // ─── Cost calculations ─────────────────────────────────────

  const labourTotal = jobCard.labour?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
  const partsTotal = jobCard.parts?.reduce((sum, p) => sum + (p.total_price || 0), 0) || 0;
  const grandTotal = jobCard.total_amount || labourTotal + partsTotal;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("job-cards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{jobCard.name}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="text-muted-foreground mt-1">
              {jobCard.license_plate} – {jobCard.vehicle_model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          {status === "Draft" && (
            <Button variant="outline" size="sm" onClick={() => navigate("job-card-detail", { id, mode: "edit" })}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Workflow Stepper */}
      <WorkflowStepper status={status} />

      {/* Repair Timer */}
      <RepairTimer jobCard={jobCard} />

      {/* ─── Workflow Action Buttons ─────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Draft → Submit for Estimation (requires docstatus=1 first) */}
            {status === "Draft" && (
              <Button onClick={handleSubmitForEstimation} disabled={busy}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Estimation
              </Button>
            )}

            {/* Estimation Pending → Mark Customer Approved (docstatus=0) */}
            {status === "Estimation Pending" && (
              <Button onClick={() => setShowApproveDialog(true)} disabled={busy}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Mark Customer Approved
              </Button>
            )}

            {/* Estimation Approved → auto starts repair on submit */}
            {status === "Estimation Approved" && (
              <Button onClick={handleStartRepair} disabled={busy}>
                <Play className="h-4 w-4 mr-2" />
                Start Repair
              </Button>
            )}

            {/* Repair In Progress → Pause / Complete */}
            {status === "Repair In Progress" && (
              <>
                <Button variant="outline" onClick={() => setShowPauseDialog(true)} disabled={busy}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Repair
                </Button>
                <Button onClick={handleCompleteRepair} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Repair
                </Button>
              </>
            )}

            {/* Waiting Parts → Parts Arrived */}
            {status === "Waiting Parts" && (
              <Button onClick={handlePartsArrived} disabled={busy}>
                <Package className="h-4 w-4 mr-2" />
                Parts Arrived
              </Button>
            )}

            {/* Waiting Customer Approval → Customer Approved */}
            {status === "Waiting Customer Approval" && (
              <Button onClick={handleCustomerApprovedDuringRepair} disabled={busy}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Customer Approved
              </Button>
            )}

            {/* Repair Completed → Start Road Test */}
            {status === "Repair Completed" && (
              <Button onClick={handleStartRoadTest} disabled={busy}>
                <Car className="h-4 w-4 mr-2" />
                Start Road Test
              </Button>
            )}

            {/* Road Test In Progress → Pass / Fail */}
            {status === "Road Test In Progress" && (
              <>
                <Button onClick={() => setShowRoadTestPassDialog(true)} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Pass Road Test
                </Button>
                <Button variant="destructive" onClick={() => setShowRoadTestFailDialog(true)} disabled={busy}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Fail Road Test
                </Button>
              </>
            )}

            {/* Road Test Completed → Start QC */}
            {status === "Road Test Completed" && (
              <Button onClick={handleStartQC} disabled={busy}>
                <Settings2 className="h-4 w-4 mr-2" />
                Start QC Check
              </Button>
            )}

            {/* QC In Progress → Pass / Fail */}
            {status === "QC In Progress" && (
              <>
                <Button onClick={handlePassQC} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Pass QC
                </Button>
                <Button variant="destructive" onClick={() => setShowQCFailDialog(true)} disabled={busy}>
                  <XCircle className="h-4 w-4 mr-2" />
                  Fail QC
                </Button>
              </>
            )}

            {/* Rework → Rework Completed */}
            {status === "Rework" && (
              <Button onClick={handleReworkCompleted} disabled={busy}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Rework Completed
              </Button>
            )}

            {/* Completed → Create Invoice / Create Delivery */}
            {(status === "Completed" || status === "Delivered") && (
              <>
                {!jobCard.invoice && (
                  <Button onClick={handleCreateInvoice} disabled={busy}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Create Sales Invoice
                  </Button>
                )}
                {jobCard.invoice && (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`/app/sales-invoice/${jobCard.invoice}`} target="_blank" rel="noreferrer">
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoice
                    </a>
                  </Button>
                )}
                {status === "Completed" && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("delivery-new", { job_card: id })}
                    disabled={busy}
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    Vehicle Delivery Note
                  </Button>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Labour</p>
                <p className="text-lg font-semibold">
                  {labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parts</p>
                <p className="text-lg font-semibold">
                  {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[#2E7D32]/10">
                <DollarSign className="h-5 w-5 text-[#2E7D32]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Grand Total</p>
                <p className="text-lg font-semibold">
                  {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Timer className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Est. Hours</p>
                <p className="text-lg font-semibold">
                  {jobCard.estimated_duration_hours || "–"} hrs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">License Plate</p>
                    <p className="font-medium">{jobCard.license_plate || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{jobCard.vehicle_model || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-medium font-mono text-sm">{jobCard.vehicle_vin}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Odometer</p>
                    <p className="font-medium">{jobCard.current_odometer?.toLocaleString() || "N/A"} km</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty Status</p>
                    <p className="font-medium">{jobCard.warranty_status || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Warranty Expiry</p>
                    <p className="font-medium">
                      {jobCard.warranty_expiry_date
                        ? new Date(jobCard.warranty_expiry_date).toLocaleDateString()
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer</p>
                    <p className="font-medium">{jobCard.customer_name || jobCard.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Mobile</p>
                    <p className="font-medium">{jobCard.customer_mobile || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Approval Status</p>
                    <Badge variant="outline">{jobCard.customer_approval_status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <Badge variant="outline">{jobCard.payment_status}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Assignment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Service Advisor</p>
                    <p className="font-medium">{jobCard.service_advisor || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lead Technician</p>
                    <p className="font-medium">{jobCard.lead_technician || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Assigned Bay</p>
                    <p className="font-medium">{jobCard.assigned_bay || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={jobCard.priority === "Urgent" ? "destructive" : "outline"}>
                      {jobCard.priority}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Opened</p>
                    <p className="font-medium">
                      {jobCard.opened_date_time
                        ? new Date(jobCard.opened_date_time).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Promised Delivery</p>
                    <p className="font-medium">
                      {jobCard.promised_delivery_date_time
                        ? new Date(jobCard.promised_delivery_date_time).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="font-medium">
                      {jobCard.completed_date_time
                        ? new Date(jobCard.completed_date_time).toLocaleString()
                        : "–"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Actual Hours</p>
                    <p className="font-medium">{jobCard.actual_duration_hours || "–"} hrs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Items */}
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="h-5 w-5" />
                  Job Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobCard.job_items && jobCard.job_items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Complaint</TableHead>
                        <TableHead>Cause</TableHead>
                        <TableHead>Correction</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.job_items.map((item, idx) => (
                        <TableRow key={item.name || idx}>
                          <TableCell className="font-medium">{item.complaint}</TableCell>
                          <TableCell>{item.cause || "–"}</TableCell>
                          <TableCell>{item.correction || "–"}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.status || "Pending"}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {item.actual_hours ?? item.estimated_hours ?? "–"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No job items recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            {(jobCard.service_advisor_notes || jobCard.internal_notes) && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {jobCard.service_advisor_notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Service Advisor Notes</p>
                      <p>{jobCard.service_advisor_notes}</p>
                    </div>
                  )}
                  {jobCard.internal_notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">Internal Notes</p>
                      <p>{jobCard.internal_notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Services (Labour) Tab */}
        <TabsContent value="services" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Service Lines (Labour)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobCard.labour && jobCard.labour.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Operation</TableHead>
                        <TableHead>Technician</TableHead>
                        <TableHead className="text-right">Hours</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Warranty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.labour.map((line, idx) => (
                        <TableRow key={line.name || idx}>
                          <TableCell className="font-medium">{line.operation}</TableCell>
                          <TableCell>{line.technician || "–"}</TableCell>
                          <TableCell className="text-right">{line.hours}</TableCell>
                          <TableCell className="text-right">
                            {line.rate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {line.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {line.is_warranty ? (
                              <Badge variant="outline" className="bg-[#2E7D32]/10 text-[#2E7D32] border-0">
                                Warranty
                              </Badge>
                            ) : "–"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Labour Total</p>
                      <p className="text-xl font-bold">
                        {labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No service lines recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parts Tab */}
        <TabsContent value="parts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Parts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {jobCard.parts && jobCard.parts.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Part Code</TableHead>
                        <TableHead>Part Name</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Warranty</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.parts.map((part, idx) => (
                        <TableRow key={part.name || idx}>
                          <TableCell className="font-mono text-sm">{part.part_code}</TableCell>
                          <TableCell className="font-medium">{part.part_name}</TableCell>
                          <TableCell className="text-right">{part.quantity}</TableCell>
                          <TableCell className="text-right">
                            {part.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {part.total_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{part.status || "Requested"}</Badge>
                          </TableCell>
                          <TableCell>
                            {part.is_warranty ? (
                              <Badge variant="outline" className="bg-[#2E7D32]/10 text-[#2E7D32] border-0">
                                Warranty
                              </Badge>
                            ) : "–"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Separator className="my-4" />
                  <div className="flex justify-end">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Parts Total</p>
                      <p className="text-xl font-bold">
                        {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">No parts recorded</p>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Cost Summary</p>
                  <div className="flex gap-8">
                    <div>
                      <p className="text-xs text-muted-foreground">Labour</p>
                      <p className="font-medium">{labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Parts</p>
                      <p className="font-medium">{partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                    {(jobCard.discount_amount ?? 0) > 0 && (
                      <div>
                        <p className="text-xs text-muted-foreground">Discount</p>
                        <p className="font-medium text-destructive">
                          -{jobCard.discount_amount!.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Grand Total</p>
                  <p className="text-3xl font-bold text-primary">
                    {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Time Logs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {jobCard.time_logs && jobCard.time_logs.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Technician</TableHead>
                        <TableHead>Start</TableHead>
                        <TableHead>End</TableHead>
                        <TableHead className="text-right">Duration</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.time_logs.map((log, idx) => (
                        <TableRow key={log.name || idx}>
                          <TableCell className="font-medium">{log.technician_name}</TableCell>
                          <TableCell>{new Date(log.start_time).toLocaleString()}</TableCell>
                          <TableCell>
                            {log.end_time ? new Date(log.end_time).toLocaleString() : (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-0 animate-pulse">
                                In progress
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {log.duration_hours ? `${log.duration_hours.toFixed(1)} hrs` : "–"}
                          </TableCell>
                          <TableCell>{log.notes || "–"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No time logs recorded</p>
                )}
              </CardContent>
            </Card>

            {/* Road Test Results */}
            {jobCard.road_test_results && jobCard.road_test_results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Road Test Results
                    {jobCard.rt_result && (
                      <Badge variant={jobCard.rt_result === "Pass" ? "default" : "destructive"} className="ml-2">
                        {jobCard.rt_result}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Item</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.road_test_results.map((rt, idx) => (
                        <TableRow key={rt.name || idx}>
                          <TableCell className="font-medium">{rt.test_item}</TableCell>
                          <TableCell>
                            <Badge variant={rt.result === "Pass" ? "default" : rt.result === "Fail" ? "destructive" : "secondary"}>
                              {rt.result}
                            </Badge>
                          </TableCell>
                          <TableCell>{rt.notes || "–"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {jobCard.road_test_note && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Road Test Notes</p>
                        <p>{jobCard.road_test_note}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* QC Results */}
            {jobCard.qc_results && jobCard.qc_results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings2 className="h-5 w-5" />
                    Quality Control Results
                    {jobCard.qc_result && (
                      <Badge
                        variant={
                          jobCard.qc_result === "Pass" || jobCard.qc_result === "Pass with Advisory"
                            ? "default"
                            : "destructive"
                        }
                        className="ml-2"
                      >
                        {jobCard.qc_result}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Check Item</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.qc_results.map((qc, idx) => (
                        <TableRow key={qc.name || idx}>
                          <TableCell className="font-medium">{qc.check_item}</TableCell>
                          <TableCell>
                            <Badge
                              variant={qc.result === "Pass" ? "default" : qc.result === "Fail" ? "destructive" : "secondary"}
                            >
                              {qc.result}
                            </Badge>
                          </TableCell>
                          <TableCell>{qc.notes || "–"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {jobCard.qc_fail_reason && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Failure Reason</p>
                        <p className="text-destructive">{jobCard.qc_fail_reason}</p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── Dialogs ──────────────────────────────────────────── */}

      {/* Mark Customer Approved Dialog */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Customer Approved</DialogTitle>
            <DialogDescription>
              Record customer approval for the estimated work on this job card.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="approval-ref">Approval Reference *</Label>
              <Input
                id="approval-ref"
                placeholder="e.g. PO number, email reference, verbal confirmation"
                value={approvalReference}
                onChange={(e) => setApprovalReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="approved-amount">Approved Amount</Label>
              <Input
                id="approved-amount"
                type="number"
                placeholder="Optional — leave blank to use estimate"
                value={approvedAmount}
                onChange={(e) => setApprovedAmount(e.target.value)}
              />
            </div>
            <Separator />
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estimated Total</span>
              <span className="font-medium">{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleMarkCustomerApproved} disabled={busy}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pause Repair Dialog */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Repair</DialogTitle>
            <DialogDescription>
              Select the reason for pausing the repair.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Reason</Label>
            <Select value={pauseReason} onValueChange={(v) => setPauseReason(v as typeof pauseReason)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Waiting Parts">Waiting for Parts</SelectItem>
                <SelectItem value="Waiting Customer Approval">Waiting for Customer Approval</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPauseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePauseRepair} disabled={busy}>
              <Pause className="h-4 w-4 mr-2" />
              Pause
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pass Road Test Dialog */}
      <Dialog open={showRoadTestPassDialog} onOpenChange={setShowRoadTestPassDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pass Road Test</DialogTitle>
            <DialogDescription>
              Optionally add notes about the road test results.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Road test notes (optional)"
              value={roadTestPassNotes}
              onChange={(e) => setRoadTestPassNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoadTestPassDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handlePassRoadTest} disabled={busy}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Pass
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fail Road Test Dialog */}
      <Dialog open={showRoadTestFailDialog} onOpenChange={setShowRoadTestFailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fail Road Test</DialogTitle>
            <DialogDescription>
              Provide a reason for the road test failure. The vehicle will be sent for rework.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the failure reason..."
              value={roadTestFailReason}
              onChange={(e) => setRoadTestFailReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoadTestFailDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFailRoadTest} disabled={busy || !roadTestFailReason.trim()}>
              <XCircle className="h-4 w-4 mr-2" />
              Fail &amp; Send to Rework
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Fail QC Dialog */}
      <Dialog open={showQCFailDialog} onOpenChange={setShowQCFailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fail QC Check</DialogTitle>
            <DialogDescription>
              Provide a reason for the QC failure. The vehicle will be sent for rework.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Describe the QC failure..."
              value={qcFailReason}
              onChange={(e) => setQcFailReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQCFailDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleFailQC} disabled={busy || !qcFailReason.trim()}>
              <XCircle className="h-4 w-4 mr-2" />
              Fail QC &amp; Rework
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
