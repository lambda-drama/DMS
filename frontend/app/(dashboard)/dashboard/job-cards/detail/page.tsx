"use client";

import { useState, useCallback, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCard, useServiceBays, useTechnicians } from "@/hooks/use-dms";
import { canEditJobCardAssignment } from "@/lib/job-card-workflow";
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
  ClipboardList,
  Settings2,
  Truck,
  DollarSign,
  CreditCard,
  Play,
  Pause,
  ChevronRight,
  Shield,
  Package,
  Timer,
  RotateCcw,
  Send,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { JobCardStatus, DMSJobCard, JobCardQCResult, RoadTestItemResult } from "@/types/dms";
import { StatusBadge } from "@/components/job-card/status-badge";
import { WorkflowStepper } from "@/components/job-card/workflow-stepper";
import { RepairTimer } from "@/components/job-card/repair-timer";
import { RoadTestSection } from "@/components/job-card/road-test-section";
import { QCSection } from "@/components/job-card/qc-section";
import { SignaturePad } from "@/components/signature-pad";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";
import { uploadFile } from "@/services/common";
import { SearchableSelect } from "@/components/searchable-select";
import { LinkWithCreate } from "@/components/link-with-create";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { CollectPaymentDialog } from "@/components/invoices/collect-payment-dialog";
import * as invoicesSvc from "@/services/invoices";
import type { SalesInvoiceDetail } from "@/types/dms";
function toDatetimeLocal(value?: string) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toFrappeDatetime(local: string) {
  if (!local) return "";
  return `${local.replace("T", " ")}:00`;
}

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
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [invoiceDetail, setInvoiceDetail] = useState<SalesInvoiceDetail | null>(null);
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [savedSignatureUrl, setSavedSignatureUrl] = useState<string | null>(null);
  const [scheduleStart, setScheduleStart] = useState("");
  const [scheduleEnd, setScheduleEnd] = useState("");
  const [leadTechnician, setLeadTechnician] = useState("");
  const [assignedBay, setAssignedBay] = useState("");
  const [assistantRows, setAssistantRows] = useState<Array<{ technician: string }>>([]);
  const [roadTestState, setRoadTestState] = useState<{
    rows: RoadTestItemResult[];
    complete: boolean;
    hasCriticalFails: boolean;
  }>({ rows: [], complete: false, hasCriticalFails: false });
  const [qcState, setQcState] = useState<{
    rows: JobCardQCResult[];
    complete: boolean;
    hasMandatoryFails: boolean;
  }>({ rows: [], complete: false, hasMandatoryFails: false });

  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();
  const { data: serviceBays, isLoading: baysLoading } = useServiceBays();

  const handleRoadTestChecklistState = useCallback(
    (
      rows: RoadTestItemResult[],
      meta: { complete: boolean; hasCriticalFails: boolean }
    ) => {
      setRoadTestState({ rows, ...meta });
    },
    []
  );

  const handleQCChecklistState = useCallback(
    (
      rows: JobCardQCResult[],
      meta: { complete: boolean; hasMandatoryFails: boolean }
    ) => {
      setQcState({ rows, ...meta });
    },
    []
  );

  useEffect(() => {
    if (!jobCard) return;
    setScheduleStart(toDatetimeLocal(jobCard.schedule_start_time));
    setScheduleEnd(toDatetimeLocal(jobCard.schedule_end_time));
    setLeadTechnician(jobCard.lead_technician || "");
    setAssignedBay(jobCard.assigned_bay || "");
    setAssistantRows(
      (jobCard.assistant_technicians || [])
        .filter((r) => r.technician)
        .map((r) => ({ technician: r.technician }))
    );
  }, [
    jobCard?.name,
    jobCard?.schedule_start_time,
    jobCard?.schedule_end_time,
    jobCard?.lead_technician,
    jobCard?.assigned_bay,
    jobCard?.assistant_technicians,
  ]);

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

  const refreshInvoiceDetail = useCallback(async (invoiceName: string) => {
    try {
      const detail = await invoicesSvc.getSalesInvoiceDetail(invoiceName);
      setInvoiceDetail(detail);
    } catch {
      setInvoiceDetail(null);
    }
  }, []);

  useEffect(() => {
    if (jobCard?.invoice) {
      refreshInvoiceDetail(jobCard.invoice);
    } else {
      setInvoiceDetail(null);
    }
  }, [jobCard?.invoice, refreshInvoiceDetail]);

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
  const assignmentEditable = canEditJobCardAssignment(status);

  const assignmentDirty =
    leadTechnician !== (jobCard.lead_technician || "") ||
    assignedBay !== (jobCard.assigned_bay || "");

  const handleSaveAssignment = () => {
    if (!leadTechnician) {
      toast.error("Lead technician is required");
      return;
    }
    if (!assignedBay) {
      toast.error("Assigned service bay is required");
      return;
    }
    runAction("Assignment updated", () =>
      jobCardsSvc.updateJobCard(id, {
        lead_technician: leadTechnician,
        assigned_bay: assignedBay,
      })
    );
  };

  // ─── Workflow Action Handlers ───────────────────────────────

  const handleSubmitForEstimation = () =>
    runAction("Submitted for Estimation", () => jobCardsSvc.submitForEstimation(id));

  const customerSignatureUrl =
    savedSignatureUrl || jobCard?.customer_signature || "";

  const hasCustomerSignature = Boolean(customerSignatureUrl?.trim());

  const handleSaveCustomerSignature = async (file: File) => {
    setSignatureUploading(true);
    try {
      const fileUrl = await uploadFile(file);
      await jobCardsSvc.saveCustomerSignature(id, fileUrl);
      setSavedSignatureUrl(fileUrl);
      toast.success("Customer signature saved");
      await mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save signature");
    } finally {
      setSignatureUploading(false);
    }
  };

  const handleMarkCustomerApproved = () => {
    if (!hasCustomerSignature) {
      toast.error("Customer signature is required before approval");
      return;
    }
    if (!approvalReference.trim()) {
      toast.error("Approval reference is required");
      return;
    }
    if (!leadTechnician) {
      toast.error("Lead technician is required");
      return;
    }
    if (!scheduleStart) {
      toast.error("Schedule start time is required");
      return;
    }
    if (!scheduleEnd) {
      toast.error("Schedule end time is required");
      return;
    }
    runAction("Customer approved and job card submitted", async () => {
      await jobCardsSvc.approveAndSubmitJobCard(id, {
        approval_reference: approvalReference.trim(),
        approved_amount: approvedAmount ? parseFloat(approvedAmount) : undefined,
        customer_signature: customerSignatureUrl || undefined,
        schedule_start_time: toFrappeDatetime(scheduleStart),
        schedule_end_time: toFrappeDatetime(scheduleEnd),
        lead_technician: leadTechnician,
        assistant_technicians: assistantRows.filter((r) => r.technician),
      });
    });
    setShowApproveDialog(false);
    setApprovalReference("");
    setApprovedAmount("");
  };

  const handleStartRepair = () =>
    runAction("Repair Started", async () => {
      const now = new Date().toISOString().replace("T", " ").slice(0, 19);
      const technicians = new Set<string>();
      if (jobCard.lead_technician) technicians.add(jobCard.lead_technician);
      (jobCard.assistant_technicians || []).forEach((row) => {
        if (row.technician) technicians.add(row.technician);
      });
      const timeLogs = Array.from(technicians).map((technician) => ({
        technician,
        technician_name: technician,
        start_time: now,
      }));
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

  const persistRoadTestResults = async () => {
    const payload = roadTestState.rows.map((row) => ({
      test_item: row.test_item,
      test_description: row.test_description,
      category: row.category,
      test_condition: row.test_condition,
      is_critical: row.is_critical,
      result: row.result,
      observations: row.observations,
    }));
    await jobCardsSvc.saveRoadTestResults(id, jobCard.road_test_template, payload);
  };

  const handlePassRoadTest = () => {
    if (!roadTestState.complete) {
      toast.error("Complete all road test checklist items before passing");
      return;
    }
    if (roadTestState.hasCriticalFails) {
      toast.error("Critical item(s) failed — cannot pass road test");
      return;
    }
    runAction("Road Test Passed", async () => {
      await persistRoadTestResults();
      await jobCardsSvc.passRoadTest(id, roadTestPassNotes || undefined);
    });
    setShowRoadTestPassDialog(false);
    setRoadTestPassNotes("");
  };

  const handleFailRoadTest = () => {
    if (!roadTestFailReason.trim()) {
      toast.error("Fail reason is required");
      return;
    }
    if (!roadTestState.complete) {
      toast.error("Complete all road test checklist items before failing");
      return;
    }
    runAction("Road Test Failed – Rework Required", async () => {
      await persistRoadTestResults();
      await jobCardsSvc.failRoadTest(id, roadTestFailReason);
    });
    setShowRoadTestFailDialog(false);
    setRoadTestFailReason("");
  };

  const persistQCResults = async () => {
    const payload = qcState.rows.map((row) => ({
      check_item_text: row.check_item_text,
      category: row.category,
      is_mandatory: row.is_mandatory,
      requires_photo: row.requires_photo,
      requires_measurement: row.requires_measurement,
      min_value: row.min_value,
      max_value: row.max_value,
      result: row.result,
      measurement_value: row.measurement_value,
      photo: row.photo,
      notes: row.notes,
    }));
    await jobCardsSvc.saveQCResults(id, jobCard.qc_checklist_template, payload);
  };

  const handleStartQC = () =>
    runAction("QC Check Started", () => jobCardsSvc.startQC(id));

  const handlePassQC = () => {
    if (!qcState.complete) {
      toast.error("Complete all QC checklist items before passing");
      return;
    }
    if (qcState.hasMandatoryFails) {
      toast.error("Mandatory item(s) failed — cannot pass QC");
      return;
    }
    runAction("QC Passed – Completed", async () => {
      await persistQCResults();
      await jobCardsSvc.passQC(id);
    });
  };

  const handleFailQC = () => {
    if (!qcFailReason.trim()) {
      toast.error("Fail reason is required");
      return;
    }
    if (!qcState.complete) {
      toast.error("Complete all QC checklist items before failing");
      return;
    }
    runAction("QC Failed – Rework Required", async () => {
      await persistQCResults();
      await jobCardsSvc.failQC(id, qcFailReason);
    });
    setShowQCFailDialog(false);
    setQcFailReason("");
  };

  const handleReworkCompleted = () =>
    runAction("Rework Completed", () => jobCardsSvc.reworkCompleted(id));

  const handleInvoiceCreated = async (invoiceName: string) => {
    await mutate();
    await refreshInvoiceDetail(invoiceName);
  };

  const canCollectPayment =
    invoiceDetail &&
    invoiceDetail.docstatus === 1 &&
    (invoiceDetail.outstanding_amount || 0) > 0;

  // ─── Cost calculations ─────────────────────────────────────

  const labourTotal = jobCard.total_labor_cost || jobCard.labour?.reduce((sum, l) => sum + (l.amount || 0), 0) || 0;
  const partsTotal = jobCard.total_parts_cost || jobCard.parts?.reduce((sum, p) => sum + (p.total_amount || 0), 0) || 0;
  const grandTotal = jobCard.total_amount || labourTotal + partsTotal;

  const showApprovalSignature =
    status === "Estimation Pending" &&
    jobCard.customer_approval_status !== "Approved" &&
    docstatus === 0;

  const canMarkApproved =
    hasCustomerSignature && !!leadTechnician && !!scheduleStart && !!scheduleEnd;

  const technicianOptions =
    technicians?.map((t) => ({
      value: t.name,
      label: t.full_name,
    })) || [];

  const bayOptions =
    serviceBays?.map((b) => ({
      value: b.name,
      label: b.bay_name || b.bay_number || b.name,
      description: b.branch || undefined,
    })) || [];

  const signaturePreviewUrl = customerSignatureUrl
    ? customerSignatureUrl.startsWith("http") || customerSignatureUrl.startsWith("data:")
      ? customerSignatureUrl
      : `${typeof window !== "undefined" ? window.location.origin : ""}${customerSignatureUrl}`
    : "";

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("job-cards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">{jobCard.name}</h1>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 truncate text-muted-foreground">
              {jobCard.license_plate} – {jobCard.vehicle_model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <PrintFormatDropdown doctype="DMS Job Card" docName={id} />
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

      {status === "Road Test In Progress" && (
        <RoadTestSection
          jobCard={jobCard}
          onSaved={mutate}
          onChecklistState={handleRoadTestChecklistState}
        />
      )}

      {status === "QC In Progress" && (
        <QCSection
          jobCard={jobCard}
          onSaved={mutate}
          onChecklistState={handleQCChecklistState}
        />
      )}

      {showApprovalSignature && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Schedule &amp; technicians
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Required before customer approval. The job card will be submitted when approved.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="schedule-start">Schedule start *</Label>
                <Input
                  id="schedule-start"
                  type="datetime-local"
                  value={scheduleStart}
                  onChange={(e) => setScheduleStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schedule-end">Schedule end *</Label>
                <Input
                  id="schedule-end"
                  type="datetime-local"
                  value={scheduleEnd}
                  onChange={(e) => setScheduleEnd(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Lead technician *</Label>
              <LinkWithCreate doctype="Technician" onCreated={setLeadTechnician}>
                <SearchableSelect
                  options={technicianOptions}
                  value={leadTechnician}
                  onValueChange={setLeadTechnician}
                  placeholder="Search technicians..."
                  isLoading={techniciansLoading}
                />
              </LinkWithCreate>
            </div>
            <div className="space-y-2">
              <Label>Assistant technicians</Label>
              <div className="space-y-2">
                {assistantRows.map((row, index) => (
                  <div key={index} className="flex gap-2 items-end">
                    <div className="flex-1">
                      <LinkWithCreate
                        doctype="Technician"
                        onCreated={(name) => {
                          const next = [...assistantRows];
                          next[index] = { technician: name };
                          setAssistantRows(next);
                        }}
                      >
                        <SearchableSelect
                          options={technicianOptions}
                          value={row.technician}
                          onValueChange={(value) => {
                            const next = [...assistantRows];
                            next[index] = { technician: value };
                            setAssistantRows(next);
                          }}
                          placeholder="Search technicians..."
                          isLoading={techniciansLoading}
                        />
                      </LinkWithCreate>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setAssistantRows(assistantRows.filter((_, i) => i !== index))
                      }
                      aria-label="Remove assistant"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAssistantRows([...assistantRows, { technician: "" }])}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add assistant
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ─── Workflow Action Buttons ─────────────────────────── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Draft → Submit for Estimation */}
            {status === "Draft" && (
              <Button onClick={handleSubmitForEstimation} disabled={busy}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Estimation
              </Button>
            )}

            {/* Estimation Pending → signature then Mark Customer Approved */}
            {showApprovalSignature && (
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-md">
                  <p className="text-sm font-medium mb-2">Customer signature</p>
                  <SignaturePad
                    existingUrl={customerSignatureUrl || undefined}
                    uploading={signatureUploading}
                    onSave={handleSaveCustomerSignature}
                    onClear={() => setSavedSignatureUrl(null)}
                  />
                  {!canMarkApproved && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Complete signature, schedule times, and lead technician before approval.
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={busy || !canMarkApproved}
                  className="shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Customer Approved
                </Button>
              </div>
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
                <Button
                  onClick={() => setShowRoadTestPassDialog(true)}
                  disabled={busy || !roadTestState.complete || roadTestState.hasCriticalFails}
                  title={
                    !roadTestState.complete
                      ? "Complete all checklist items first"
                      : roadTestState.hasCriticalFails
                        ? "Critical items failed"
                        : undefined
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Pass Road Test
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRoadTestFailDialog(true)}
                  disabled={busy || !roadTestState.complete}
                  title={!roadTestState.complete ? "Complete all checklist items first" : undefined}
                >
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
                <Button
                  onClick={handlePassQC}
                  disabled={busy || !qcState.complete || qcState.hasMandatoryFails}
                  title={
                    !qcState.complete
                      ? "Complete all checklist items first"
                      : qcState.hasMandatoryFails
                        ? "Mandatory items failed"
                        : undefined
                  }
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Pass QC
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowQCFailDialog(true)}
                  disabled={busy || !qcState.complete}
                  title={!qcState.complete ? "Complete all checklist items first" : undefined}
                >
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
                  <Button onClick={() => setShowCreateInvoiceDialog(true)} disabled={busy}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Create Sales Invoice
                  </Button>
                )}
                {jobCard.invoice && (
                  <>
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/app/sales-invoice/${jobCard.invoice}`} target="_blank" rel="noreferrer">
                        <FileText className="h-4 w-4 mr-2" />
                        View Invoice
                      </a>
                    </Button>
                    {canCollectPayment && (
                      <Button size="sm" onClick={() => setShowPaymentDialog(true)} disabled={busy}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay
                      </Button>
                    )}
                  </>
                )}
                {status === "Completed" && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("delivery-new", { jobcard: id })}
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

      {jobCard.invoice && invoiceDetail && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="text-base">Sales Invoice</CardTitle>
              <div className="flex flex-wrap gap-2">
                {canCollectPayment && (
                  <Button size="sm" onClick={() => setShowPaymentDialog(true)}>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Collect Payment
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <a href={`/app/sales-invoice/${jobCard.invoice}`} target="_blank" rel="noreferrer">
                    Open in Desk
                  </a>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <span>
                <span className="text-muted-foreground">Invoice: </span>
                <span className="font-medium">{invoiceDetail.name}</span>
              </span>
              {invoiceDetail.due_date && (
                <span>
                  <span className="text-muted-foreground">Due: </span>
                  {new Date(invoiceDetail.due_date).toLocaleDateString()}
                </span>
              )}
              <span>
                <span className="text-muted-foreground">Total: </span>
                {(invoiceDetail.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              {(invoiceDetail.outstanding_amount || 0) > 0 && (
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Outstanding: {(invoiceDetail.outstanding_amount || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
              )}
            </div>
            {invoiceDetail.items?.length > 0 && (
              <div className="dms-table-panel rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoiceDetail.items.map((line, idx) => (
                      <TableRow key={`${line.item_code}-${idx}`}>
                        <TableCell className="max-w-[240px] truncate">
                          {line.description || line.item_code}
                        </TableCell>
                        <TableCell className="text-right">{line.qty}</TableCell>
                        <TableCell className="text-right">
                          {(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {invoiceDetail.docstatus !== 1 && (
              <p className="text-sm text-muted-foreground">
                Invoice is a draft — submit in ERPNext to collect payment.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
        <div className="dms-tabs-scroll">
        <TabsList className="bg-muted/50 w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>
        </div>

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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                {(showApprovalSignature || customerSignatureUrl) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2">Customer digital signature</p>
                      {showApprovalSignature ? (
                        <SignaturePad
                          existingUrl={customerSignatureUrl || undefined}
                          uploading={signatureUploading}
                          onSave={handleSaveCustomerSignature}
                          onClear={() => setSavedSignatureUrl(null)}
                        />
                      ) : customerSignatureUrl ? (
                        <div className="rounded-lg border bg-muted/30 p-4 flex justify-center">
                          <img
                            src={
                              customerSignatureUrl.startsWith("http") ||
                              customerSignatureUrl.startsWith("data:")
                                ? customerSignatureUrl
                                : `${typeof window !== "undefined" ? window.location.origin : ""}${customerSignatureUrl}`
                            }
                            alt="Customer signature"
                            className="max-h-24 object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Assignment
                </CardTitle>
                {assignmentEditable && assignmentDirty && (
                  <Button size="sm" onClick={handleSaveAssignment} disabled={busy}>
                    Save assignment
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {assignmentEditable && (
                  <p className="text-sm text-muted-foreground">
                    Lead technician and service bay can be changed until repair starts.
                  </p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Service Advisor</p>
                    <p className="font-medium">{jobCard.service_advisor || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Priority</p>
                    <Badge variant={jobCard.priority === "Urgent" ? "destructive" : "outline"}>
                      {jobCard.priority}
                    </Badge>
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Lead technician {assignmentEditable ? "*" : ""}</Label>
                    {assignmentEditable ? (
                      <LinkWithCreate doctype="Technician" onCreated={setLeadTechnician}>
                        <SearchableSelect
                          options={technicianOptions}
                          value={leadTechnician}
                          onValueChange={setLeadTechnician}
                          placeholder="Search technicians..."
                          isLoading={techniciansLoading}
                        />
                      </LinkWithCreate>
                    ) : (
                      <p className="font-medium">
                        {jobCard.lead_technician_name || jobCard.lead_technician || "N/A"}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Assigned service bay {assignmentEditable ? "*" : ""}</Label>
                    {assignmentEditable ? (
                      <SearchableSelect
                        options={bayOptions}
                        value={assignedBay}
                        onValueChange={setAssignedBay}
                        placeholder="Search bays..."
                        isLoading={baysLoading}
                      />
                    ) : (
                      <p className="font-medium">{jobCard.assigned_bay || "N/A"}</p>
                    )}
                  </div>
                </div>
                {jobCard.assistant_technicians && jobCard.assistant_technicians.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Assistant technicians</p>
                    <ul className="text-sm font-medium space-y-1">
                      {jobCard.assistant_technicians.map((row, i) => (
                        <li key={row.name || i}>
                          {row.technician_name || row.technician}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Opened</p>
                    <p className="font-medium">
                      {jobCard.opened_date_time
                        ? new Date(jobCard.opened_date_time).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                  {jobCard.schedule_start_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Schedule start</p>
                      <p className="font-medium">
                        {new Date(jobCard.schedule_start_time).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {jobCard.schedule_end_time && (
                    <div>
                      <p className="text-sm text-muted-foreground">Schedule end</p>
                      <p className="font-medium">
                        {new Date(jobCard.schedule_end_time).toLocaleString()}
                      </p>
                    </div>
                  )}
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
                          <TableCell className="font-medium">{line.service_name || line.vehicle_service_item}</TableCell>
                          <TableCell>{line.technician || "–"}</TableCell>
                          <TableCell className="text-right">{line.actual_hours || line.estimated_hours || 0}</TableCell>
                          <TableCell className="text-right">
                            {(line.rate_per_hour || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(line.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                          <TableCell className="font-mono text-sm">{part.item_code}</TableCell>
                          <TableCell className="font-medium">{part.part_name || part.item_code}</TableCell>
                          <TableCell className="text-right">{part.quantity_issued || part.quantity_requested || 0}</TableCell>
                          <TableCell className="text-right">
                            {(part.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(part.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
          <div className="min-w-0 space-y-4 sm:space-y-6">
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
                        <TableHead>Observations</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.road_test_results.map((rt, idx) => (
                        <TableRow key={rt.name || idx}>
                          <TableCell className="font-medium">
                            {rt.test_description || rt.test_item}
                          </TableCell>
                          <TableCell>
                            <Badge variant={rt.result === "Pass" ? "default" : rt.result === "Fail" ? "destructive" : "secondary"}>
                              {rt.result}
                            </Badge>
                          </TableCell>
                          <TableCell>{rt.observations || "–"}</TableCell>
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
                          <TableCell className="font-medium">{qc.check_item_text || "–"}</TableCell>
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
              Record customer approval and submit the job card so repair can start after approval.
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

      <CreateInvoiceDialog
        open={showCreateInvoiceDialog}
        onOpenChange={setShowCreateInvoiceDialog}
        jobCardId={id}
        onCreated={handleInvoiceCreated}
      />

      {jobCard.invoice && (
        <CollectPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          salesInvoice={jobCard.invoice}
          onPaid={() => {
            mutate();
            refreshInvoiceDetail(jobCard.invoice!);
          }}
        />
      )}
    </div>
  );
}
