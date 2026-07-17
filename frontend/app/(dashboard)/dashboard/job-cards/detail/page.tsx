"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCard, useServiceBays, useServiceEstimate, useTechnicians } from "@/hooks/use-dms";
import { canEditJobCardAssignment, canStartRepairFromWorkflow, isJobCardWorkshopAssigned, resolveJobCardWorkflowStatus } from "@/lib/job-card-workflow";
import * as jobCardsSvc from "@/services/jobCards";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Headphones,
  HardHat,
} from "lucide-react";
import { toast } from "sonner";
import type { JobCardStatus, DMSJobCard, JobCardItem, JobCardQCResult, RoadTestItemResult } from "@/types/dms";
import { htmlToPlainText } from "@/lib/plain-text";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { StatusBadge } from "@/components/job-card/status-badge";
import { WorkshopAssignmentBadge } from "@/components/job-card/workshop-assignment-badge";
import { WorkflowStepper } from "@/components/job-card/workflow-stepper";
import {
  RepairTimer,
  clearRepairTimerState,
  isOpenTimeLog,
  loadRepairTimerState,
  saveRepairTimerState,
} from "@/components/job-card/repair-timer";
import { RoadTestSection } from "@/components/job-card/road-test-section";
import { QCSection } from "@/components/job-card/qc-section";
import { SignaturePad } from "@/components/signature-pad";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";
import { AmountSummaryPopover } from "@/components/amount-summary-popover";
import { fetchServiceBayDetail, uploadFile } from "@/services/common";
import { SearchableSelect } from "@/components/searchable-select";
import { LinkWithCreate } from "@/components/link-with-create";
import { CreateInvoiceDialog } from "@/components/invoices/create-invoice-dialog";
import { PartsRequestSection } from "@/components/job-card/parts-request-section";
import { hasRequestableParts } from "@/lib/parts-request-eligibility";
import { PartsAcquisitionFlowBanner } from "@/components/job-card/parts-acquisition-flow-banner";
import { PartsReturnSection } from "@/components/job-card/parts-return-section";
import { AdditionalWorkSection } from "@/components/job-card/additional-work-section";
import { AddExtraPartSection } from "@/components/job-card/add-extra-part-section";
import * as partsRequestsSvc from "@/services/partsRequests";
import type { AdditionalWorkRequestSummary } from "@/services/partsRequests";
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

function collectRepairTechnicians(jobCard: DMSJobCard): string[] {
  const technicians: string[] = [];
  const lead = (jobCard.lead_technician || "").trim();
  if (lead) technicians.push(lead);
  for (const row of jobCard.assistant_technicians || []) {
    const tech = (row.technician || "").trim();
    if (tech && !technicians.includes(tech)) technicians.push(tech);
  }
  return technicians;
}

function jobItemComplaintText(item: JobCardItem): string {
  return htmlToPlainText(item.complaint_description || item.complaint || "").trim();
}

function richTextBlock(value?: string | null) {
  const text = htmlToPlainText(value || "").trim();
  if (!text) {
    return <p className="text-sm text-muted-foreground">Not recorded</p>;
  }
  return <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>;
}

export default function JobCardDetailPage() {
  const { viewParams, navigate } = useNavigation();
  const id = viewParams.get("id") || "";
  const { data: jobCard, isLoading, error, mutate } = useJobCard(id || null);
  const { data: linkedEstimate } = useServiceEstimate(jobCard?.service_estimate || null);
  const [additionalWorkRequests, setAdditionalWorkRequests] = useState<AdditionalWorkRequestSummary[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [busy, setBusy] = useState(false);

  // Dialog states
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvalReference, setApprovalReference] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [pauseReason, setPauseReason] = useState<
    "Waiting Parts" | "Waiting Customer Approval" | "Other"
  >("Waiting Parts");
  const [pauseOtherNotes, setPauseOtherNotes] = useState("");
  const [showRoadTestFailDialog, setShowRoadTestFailDialog] = useState(false);
  const [roadTestFailReason, setRoadTestFailReason] = useState("");
  const [showRoadTestPassDialog, setShowRoadTestPassDialog] = useState(false);
  const [roadTestPassNotes, setRoadTestPassNotes] = useState("");
  const [showQCFailDialog, setShowQCFailDialog] = useState(false);
  const [qcFailReason, setQcFailReason] = useState("");
  const [showCreateInvoiceDialog, setShowCreateInvoiceDialog] = useState(false);
  const [partsFlowRefreshKey, setPartsFlowRefreshKey] = useState(0);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showInvoiceSheet, setShowInvoiceSheet] = useState(false);
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
  const [repairTimerAnchorMs, setRepairTimerAnchorMs] = useState<number | null>(null);
  const [repairTimerOffsetSeconds, setRepairTimerOffsetSeconds] = useState(0);
  const [bayLinkedWorkshop, setBayLinkedWorkshop] = useState<string>("");
  const [bayLinkedWarehouse, setBayLinkedWarehouse] = useState<string>("");
  const [savingLinePrice, setSavingLinePrice] = useState<string | null>(null);
  const autoPartsTabJobRef = useRef<string | null>(null);

  const hasActivePartsRequest = (requests?: Array<{ status: string }>) =>
    !!requests?.some((pr) => pr.status !== "Received" && pr.status !== "Cancelled");

  useEffect(() => {
    const tab = viewParams.get("tab");
    if (tab && ["overview", "services", "parts", "timeline", "service-advisor", "workshop"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [id, viewParams]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void partsRequestsSvc.listAdditionalWorkRequests(id).then((rows) => {
      if (!cancelled) setAdditionalWorkRequests(rows || []);
    });
    return () => {
      cancelled = true;
    };
  }, [id, partsFlowRefreshKey]);

  useEffect(() => {
    if (!jobCard?.name) return;
    if (!hasActivePartsRequest(jobCard.parts_requests)) {
      if (autoPartsTabJobRef.current === jobCard.name) {
        autoPartsTabJobRef.current = null;
      }
      return;
    }
    if (autoPartsTabJobRef.current !== jobCard.name) {
      autoPartsTabJobRef.current = jobCard.name;
      setActiveTab("parts");
    }
  }, [jobCard?.name, jobCard?.parts_requests]);

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

  useEffect(() => {
    if (!jobCard?.assigned_bay || jobCard.warehouse) {
      return;
    }
    void fetchServiceBayDetail(jobCard.assigned_bay).then((detail) => {
      setBayLinkedWorkshop(detail.workshop || detail.branch || "");
      setBayLinkedWarehouse(detail.warehouse || "");
    });
  }, [jobCard?.assigned_bay, jobCard?.warehouse]);

  // Restore client-only timer from this browser session (never from time logs / schedule).
  useEffect(() => {
    if (!id || !jobCard) return;

    if (jobCard.status === "Repair In Progress") {
      if (repairTimerAnchorMs !== null) return;
      const saved = loadRepairTimerState(id);
      if (saved?.startedAtMs) {
        setRepairTimerAnchorMs(saved.startedAtMs);
        setRepairTimerOffsetSeconds(saved.offsetSeconds ?? 0);
      }
      return;
    }

    setRepairTimerAnchorMs(null);

    if (
      jobCard.status !== "Waiting Parts" &&
      jobCard.status !== "Waiting Customer Approval"
    ) {
      clearRepairTimerState(id);
      setRepairTimerOffsetSeconds(0);
    }
  }, [id, jobCard?.status, repairTimerAnchorMs]);

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
  const workflowStatus = resolveJobCardWorkflowStatus(status, docstatus);
  const workshopAssigned = isJobCardWorkshopAssigned(jobCard);
  const isInternal = jobCard.job_card_type === "Internal";
  const assignmentEditable = canEditJobCardAssignment(status);
  const displayWorkshop = bayLinkedWorkshop || jobCard.workshop || "";
  const displayWarehouse = bayLinkedWarehouse || jobCard.warehouse || "";
  const hasWorkshopWarehouse = Boolean(displayWarehouse.trim());
  const needsWorkshopWarehouse =
    !hasWorkshopWarehouse &&
    (workflowStatus === "Estimation Approved" ||
      (isInternal && ["Draft", "Open"].includes(workflowStatus)));
  const canRequestParts =
    hasRequestableParts(jobCard.parts) &&
    !["Cancelled", "Delivered", "Completed"].includes(workflowStatus);
  const canAddExtraPart = [
    "Open",
    "Estimation Approved",
    "Repair In Progress",
    "Waiting Parts",
    "Waiting Customer Approval",
    "Rework",
  ].includes(workflowStatus);
  const canEditLinePricing =
    !jobCard.invoice &&
    !["Cancelled", "Delivered", "Completed"].includes(workflowStatus);

  const assignmentDirty =
    leadTechnician !== (jobCard.lead_technician || "") ||
    assignedBay !== (jobCard.assigned_bay || "");

  const handleAssignedBayChange = async (bayName: string) => {
    setAssignedBay(bayName);
    if (!bayName) {
      setBayLinkedWorkshop("");
      setBayLinkedWarehouse("");
      return;
    }
    try {
      const detail = await fetchServiceBayDetail(bayName);
      setBayLinkedWorkshop(detail.workshop || detail.branch || "");
      setBayLinkedWarehouse(detail.warehouse || "");
    } catch {
      setBayLinkedWorkshop("");
      setBayLinkedWarehouse("");
    }
  };

  const handleSaveAssignment = () => {
    if (!leadTechnician) {
      toast.error("Lead technician is required");
      return;
    }
    if (!assignedBay) {
      toast.error("Assigned service bay is required");
      return;
    }
    runAction("Assignment updated", async () => {
      if (["Open", "Estimation Approved", "Draft", "Assigned"].includes(status)) {
        await partsRequestsSvc.assignJobCardWorkshop(id, leadTechnician, assignedBay);
      } else {
        await jobCardsSvc.updateJobCard(id, {
          lead_technician: leadTechnician,
          assigned_bay: assignedBay,
        });
      }
      setBayLinkedWorkshop("");
      setBayLinkedWarehouse("");
    });
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

  const handleStartRepair = async () => {
    if (!hasWorkshopWarehouse) {
      toast.error(
        jobCard.workshop
          ? `Kindly add a warehouse on Workshop ${jobCard.workshop} before starting repair.`
          : "Kindly add a warehouse on the Workshop before starting repair."
      );
      return;
    }

    const technicians = collectRepairTechnicians(jobCard);
    if (!technicians.length) {
      toast.error("Assign a lead technician before starting repair.");
      return;
    }

    const startedAt = Date.now();
    setRepairTimerOffsetSeconds(0);
    setRepairTimerAnchorMs(startedAt);
    saveRepairTimerState(id, { offsetSeconds: 0, startedAtMs: startedAt });

    setBusy(true);
    try {
      await jobCardsSvc.startRepair(id, technicians);
      toast.success("Repair Started");
      await mutate();
    } catch (err) {
      clearRepairTimerState(id);
      setRepairTimerAnchorMs(null);
      setRepairTimerOffsetSeconds(0);
      toast.error(err instanceof Error ? err.message : "Failed to start repair");
    } finally {
      setBusy(false);
    }
  };

  const savePartUnitPrice = async (rowName: string, unitPrice: number) => {
    setSavingLinePrice(rowName);
    try {
      await partsRequestsSvc.updateJobCardLinePricing(id, {
        parts: [{ name: rowName, unit_price: unitPrice }],
      });
      await mutate();
      toast.success("Part price updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update part price");
    } finally {
      setSavingLinePrice(null);
    }
  };

  const saveLabourRate = async (rowName: string, ratePerHour: number) => {
    setSavingLinePrice(rowName);
    try {
      await partsRequestsSvc.updateJobCardLinePricing(id, {
        labour: [{ name: rowName, rate_per_hour: ratePerHour }],
      });
      await mutate();
      toast.success("Labour rate updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update labour rate");
    } finally {
      setSavingLinePrice(null);
    }
  };

  const handleRequestParts = () =>
    runAction("Parts request created", async () => {
      await partsRequestsSvc.createPartsRequest(id, jobCard.lead_technician);
      setPartsFlowRefreshKey((k) => k + 1);
      autoPartsTabJobRef.current = id;
      setActiveTab("parts");
    });

  const buildPausePayload = () => {
    if (pauseReason === "Waiting Parts") {
      return {
        status: "Waiting Parts" as const,
        pause_reason: "Waiting Parts",
        label: "Waiting for Parts",
      };
    }
    if (pauseReason === "Waiting Customer Approval") {
      return {
        status: "Waiting Customer Approval" as const,
        pause_reason: "Waiting Approval",
        label: "Waiting for Customer Approval",
      };
    }
    return {
      status: "Waiting Customer Approval" as const,
      pause_reason: "Other",
      label: pauseOtherNotes.trim(),
      notes: pauseOtherNotes.trim(),
    };
  };

  const handlePauseRepair = () => {
    if (pauseReason === "Other" && !pauseOtherNotes.trim()) {
      toast.error("Please describe the pause reason");
      return;
    }

    const { status, pause_reason, label, notes } = buildPausePayload();
    const segmentSeconds =
      repairTimerAnchorMs !== null
        ? Math.max(0, Math.floor((Date.now() - repairTimerAnchorMs) / 1000))
        : 0;
    const totalElapsed = repairTimerOffsetSeconds + segmentSeconds;
    setRepairTimerOffsetSeconds(totalElapsed);
    setRepairTimerAnchorMs(null);
    saveRepairTimerState(id, { offsetSeconds: totalElapsed, startedAtMs: null });

    const openLogs = (jobCard.time_logs || []).filter(isOpenTimeLog);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const closedLogs = openLogs.map((l) => ({
      name: l.name,
      end_time: now,
      duration_hours: (Date.now() - new Date(l.start_time).getTime()) / 3600000,
      pause_reason,
      ...(notes ? { notes } : {}),
    }));
    runAction(`Paused – ${label}`, () => jobCardsSvc.pauseRepair(id, status, closedLogs));
    setShowPauseDialog(false);
    setPauseOtherNotes("");
  };

  const handleCompleteRepair = () => {
    clearRepairTimerState(id);
    setRepairTimerAnchorMs(null);
    setRepairTimerOffsetSeconds(0);

    const openLogs = (jobCard.time_logs || []).filter(isOpenTimeLog);
    const now = new Date().toISOString().replace("T", " ").slice(0, 19);
    const closedLogs = openLogs.map((l) => ({
      name: l.name,
      end_time: now,
      duration_hours: (Date.now() - new Date(l.start_time).getTime()) / 3600000,
    }));
    runAction("Repair Completed", () => jobCardsSvc.completeRepair(id, closedLogs, now));
  };

  const resumeRepairTimer = () => {
    const startedAt = Date.now();
    setRepairTimerAnchorMs(startedAt);
    saveRepairTimerState(id, {
      offsetSeconds: repairTimerOffsetSeconds,
      startedAtMs: startedAt,
    });
  };

  const handlePartsArrived = () => {
    resumeRepairTimer();
    runAction("Parts Arrived – Resuming Repair", () => jobCardsSvc.partsArrived(id));
  };

  const handleCustomerApprovedDuringRepair = () => {
    resumeRepairTimer();
    runAction("Customer Approved – Resuming Repair", () =>
      jobCardsSvc.customerApprovedDuringRepair(id)
    );
  };

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
    runAction(
      isInternal ? "Completed — materials consumed from stock" : "QC Passed – Completed",
      async () => {
        await persistQCResults();
        await jobCardsSvc.passQC(id);
      }
    );
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

  const labourEstimatedHours =
    jobCard.labour?.reduce(
      (sum, l) => sum + (Number((l as { estimated_hours?: number }).estimated_hours) || 0),
      0
    ) || jobCard.estimated_duration_hours || 0;
  const labourActualHours =
    jobCard.total_labor_hours ||
    jobCard.labour?.reduce(
      (sum, l) => sum + (Number((l as { actual_hours?: number }).actual_hours) || 0),
      0
    ) ||
    jobCard.actual_duration_hours ||
    0;

  const labourDiagnosisBlocks = (jobCard.labour || [])
    .map((line) => {
      const svc = (line as { service_name?: string; vehicle_service_item?: string }).service_name
        || (line as { vehicle_service_item?: string }).vehicle_service_item;
      const text = htmlToPlainText((line as { diagnosis?: string }).diagnosis || "").trim();
      return text ? { label: svc || "Labour line", text } : null;
    })
    .filter(Boolean) as Array<{ label: string; text: string }>;

  const estimateDiagnosis = htmlToPlainText(linkedEstimate?.diagnosis_findings || "").trim();
  const estimateRecommended = htmlToPlainText(linkedEstimate?.recommended_repairs || "").trim();

  const showApprovalSignature =
    !isInternal &&
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
      {/* Header — sticky on mobile so back/title stay visible while scrolling */}
      <div className="sticky top-0 z-20 -mx-3 flex flex-col gap-4 border-b border-border bg-background/95 px-3 py-3 backdrop-blur-sm sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("job-cards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h1 className="text-xl font-bold text-foreground sm:text-2xl">{jobCard.name}</h1>
              <StatusBadge status={workflowStatus} />
              {workshopAssigned ? <WorkshopAssignmentBadge /> : null}
            </div>
            <p className="mt-1 truncate text-muted-foreground">
              {jobCard.license_plate} – {jobCard.vehicle_model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AmountSummaryPopover
            title="Job card totals"
            lines={[
              {
                label: "Labour",
                value: labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }),
              },
              {
                label: "Parts",
                value: partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }),
              },
              {
                label: "Grand total",
                value: grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 }),
                highlight: true,
              },
              {
                label: "Est. hours",
                value: jobCard.estimated_duration_hours
                  ? `${jobCard.estimated_duration_hours} hrs`
                  : "–",
              },
            ]}
          />
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
      <WorkflowStepper
        status={status}
        docstatus={docstatus}
        jobCardType={jobCard.job_card_type}
      />

      {/* Repair Timer */}
      <RepairTimer
        running={status === "Repair In Progress"}
        startedAtMs={repairTimerAnchorMs}
        offsetSeconds={repairTimerOffsetSeconds}
      />

      {/* Parts acquisition — visible progress while a request is in flight */}
      <PartsAcquisitionFlowBanner
        jobCardId={id}
        requests={jobCard.parts_requests}
        leadTechnician={jobCard.lead_technician}
        refreshKey={partsFlowRefreshKey}
        onUpdated={() => {
          setPartsFlowRefreshKey((k) => k + 1);
          void mutate();
        }}
        onViewDetails={() => setActiveTab("parts")}
      />

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
              Customer signature, schedule &amp; technicians
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Customer signature *</p>
              <SignaturePad
                existingUrl={customerSignatureUrl || undefined}
                uploading={signatureUploading}
                onSave={handleSaveCustomerSignature}
                onClear={() => setSavedSignatureUrl(null)}
              />
            </div>
            <Separator />
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
            {/* Draft → Submit for Estimation (customer jobs only) */}
            {status === "Draft" && !isInternal && (
              <Button onClick={handleSubmitForEstimation} disabled={busy}>
                <Send className="h-4 w-4 mr-2" />
                Submit for Estimation
              </Button>
            )}
            {status === "Draft" && isInternal && docstatus === 0 && (
              <Button
                onClick={() =>
                  runAction("Repair started", async () => {
                    await jobCardsSvc.submitJobCard(id);
                  })
                }
                disabled={busy || !jobCard.lead_technician || !jobCard.service_advisor}
              >
                <Play className="h-4 w-4 mr-2" />
                Start Repair
              </Button>
            )}

            {/* Estimation Pending → signature then Mark Customer Approved */}
            {showApprovalSignature && (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  onClick={() => setShowApproveDialog(true)}
                  disabled={busy || !canMarkApproved}
                  className="shrink-0"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Customer Approved
                </Button>
                {!canMarkApproved && (
                  <p className="text-xs text-muted-foreground">
                    Complete signature, schedule times, and lead technician before approval.
                  </p>
                )}
              </div>
            )}

            {/* Pre-repair → request parts + start repair */}
            {canStartRepairFromWorkflow(status) && (
              <div className="flex w-full flex-col gap-2">
                <div className="flex flex-row flex-wrap items-center gap-2">
                  {canRequestParts && (
                    <Button variant="outline" onClick={handleRequestParts} disabled={busy}>
                      <Package className="h-4 w-4 mr-2" />
                      Request parts
                    </Button>
                  )}
                  <Button
                    onClick={handleStartRepair}
                    disabled={busy || needsWorkshopWarehouse}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Repair
                  </Button>
                </div>
                {needsWorkshopWarehouse && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                    {jobCard.workshop
                      ? `Kindly add a warehouse on Workshop ${jobCard.workshop} before starting repair.`
                      : "Assign a service bay linked to a Workshop, then add a warehouse on that Workshop before starting repair."}
                  </p>
                )}
              </div>
            )}

            {/* Repair In Progress → Pause / Complete */}
            {status === "Repair In Progress" && (
              <div className="flex flex-row flex-wrap items-center gap-2">
                {canRequestParts && (
                  <Button variant="outline" onClick={handleRequestParts} disabled={busy}>
                    <Package className="h-4 w-4 mr-2" />
                    Request parts
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowPauseDialog(true)} disabled={busy}>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Repair
                </Button>
                <Button onClick={handleCompleteRepair} disabled={busy}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Complete Repair
                </Button>
              </div>
            )}

            {/* Waiting Parts → request more / resume when received */}
            {status === "Waiting Parts" && (
              <div className="flex flex-row flex-wrap items-center gap-2">
                {canRequestParts && (
                  <Button variant="outline" onClick={handleRequestParts} disabled={busy}>
                    <Package className="h-4 w-4 mr-2" />
                    Request parts
                  </Button>
                )}
                <Button onClick={handlePartsArrived} disabled={busy}>
                  <Play className="h-4 w-4 mr-2" />
                  Resume repair (parts received)
                </Button>
              </div>
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

            {/* Completed → Invoice (customer jobs) / Delivery */}
            {(status === "Completed" || status === "Delivered") && !isInternal && (
              <>
                {!jobCard.invoice && (
                  <Button onClick={() => setShowCreateInvoiceDialog(true)} disabled={busy}>
                    <DollarSign className="h-4 w-4 mr-2" />
                    Create Sales Invoice
                  </Button>
                )}
                {jobCard.invoice && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowInvoiceSheet(true)}
                      disabled={busy}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoice
                    </Button>
                    {canCollectPayment && (
                      <Button size="sm" onClick={() => setShowPaymentDialog(true)} disabled={busy}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pay
                      </Button>
                    )}
                  </>
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
            {isInternal && jobCard.material_issue && (
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`/app/stock-entry/${jobCard.material_issue}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Package className="h-4 w-4 mr-2" />
                  View Material Issue
                </a>
              </Button>
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

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="min-w-0">
        <div className="dms-tabs-scroll">
        <TabsList className="bg-muted/50 w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="parts">Parts</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="service-advisor">Service Advisor</TabsTrigger>
          <TabsTrigger value="workshop">Workshop</TabsTrigger>
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
                        onValueChange={handleAssignedBayChange}
                        placeholder="Search bays..."
                        isLoading={baysLoading}
                      />
                    ) : (
                      <p className="font-medium">{jobCard.assigned_bay || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Workshop</p>
                    <p className="font-medium">{displayWorkshop || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Warehouse</p>
                    <p
                      className={
                        hasWorkshopWarehouse
                          ? "font-medium"
                          : "font-medium text-amber-600 dark:text-amber-400"
                      }
                    >
                      {displayWarehouse || "Not set — add on Workshop"}
                    </p>
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
                    <p className="text-sm text-muted-foreground">Currency</p>
                    <p className="font-medium">{jobCard.currency || "ETB"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="font-medium">{jobCard.company || "N/A"}</p>
                  </div>
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
              <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    Customer complaints
                    {jobCard.job_items?.length ? (
                      <Badge variant="secondary" className="font-normal">
                        {jobCard.job_items.length}
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Copied from the vehicle inspection — complaint, category, and severity per line.
                  </p>
                </div>
                {jobCard.inspection && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => navigate("inspection-detail", { id: jobCard.inspection! })}
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    Inspection {jobCard.inspection}
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {jobCard.job_items && jobCard.job_items.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Customer complaint</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Labor operation</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobCard.job_items.map((item, idx) => {
                        const complaint = jobItemComplaintText(item);
                        return (
                          <TableRow key={item.name || idx}>
                            <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="font-medium max-w-md whitespace-pre-wrap">
                              {complaint || "—"}
                            </TableCell>
                            <TableCell>{item.symptom_category || "—"}</TableCell>
                            <TableCell>
                              {item.severity ? (
                                <Badge variant="outline">{item.severity}</Badge>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>{item.labor_operation || "—"}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No complaints recorded on this job card</p>
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
                            {canEditLinePricing && line.name ? (
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                className="ml-auto h-8 w-28 text-right"
                                defaultValue={line.rate_per_hour || 0}
                                disabled={savingLinePrice === line.name}
                                onBlur={(e) => {
                                  const next = parseFloat(e.target.value) || 0;
                                  if (next !== (line.rate_per_hour || 0)) {
                                    void saveLabourRate(line.name, next);
                                  }
                                }}
                              />
                            ) : (
                              (line.rate_per_hour || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })
                            )}
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
        <TabsContent value="parts" className="mt-6 space-y-6">
          {canAddExtraPart && (
            <AddExtraPartSection
              jobCardId={id}
              leadTechnician={jobCard.lead_technician}
              warehouse={jobCard.warehouse}
              company={jobCard.company}
              onAdded={(result) => {
                setPartsFlowRefreshKey((k) => k + 1);
                autoPartsTabJobRef.current = id;
                setActiveTab("parts");
                void mutate();
                if (result?.parts_request) {
                  toast.success("Parts request started — track progress at the top");
                }
              }}
            />
          )}

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
                        <TableHead>Bin Location</TableHead>
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
                          <TableCell>{part.bin_location || "–"}</TableCell>
                          <TableCell className="text-right">{part.quantity_requested ?? part.quantity ?? 0}</TableCell>
                          <TableCell className="text-right">
                            {canEditLinePricing && part.name ? (
                              <Input
                                type="number"
                                min={0}
                                step="0.01"
                                className="ml-auto h-8 w-28 text-right"
                                defaultValue={part.unit_price || 0}
                                disabled={savingLinePrice === part.name}
                                onBlur={(e) => {
                                  const next = parseFloat(e.target.value) || 0;
                                  if (next !== (part.unit_price || 0)) {
                                    void savePartUnitPrice(part.name, next);
                                  }
                                }}
                              />
                            ) : (
                              (part.unit_price || 0).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                              })
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {(part.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {part.line_status || part.status || "Requested"}
                            </Badge>
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

          <div className="mt-6 space-y-6">
            <PartsRequestSection
              jobCardId={id}
              leadTechnician={jobCard.lead_technician}
              parts={jobCard.parts}
              canRequest={canRequestParts}
              onUpdated={() => {
                setPartsFlowRefreshKey((k) => k + 1);
                void mutate();
              }}
            />
            <PartsReturnSection
              jobCardId={id}
              parts={jobCard.parts}
              leadTechnician={jobCard.lead_technician}
              canCreate={
                !["Cancelled", "Delivered", "Completed", "Draft"].includes(status)
              }
              onUpdated={() => mutate()}
            />
            <AdditionalWorkSection
              jobCardId={id}
              leadTechnician={jobCard.lead_technician}
              canCreate={[
                "Repair In Progress",
                "Waiting Parts",
                "Open",
              ].includes(workflowStatus)}
              onUpdated={() => mutate()}
            />
          </div>

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

        {/* Service Advisor Tab */}
        <TabsContent value="service-advisor" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Headphones className="h-5 w-5" />
                Service Advisor
              </CardTitle>
              <CardDescription>
                Customer-facing intake — complaints, delivery promise, and advisor notes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Service advisor</p>
                  <p className="font-medium">{jobCard.service_advisor || "Not assigned"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Promised delivery time</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                    {jobCard.promised_delivery_date_time
                      ? new Date(jobCard.promised_delivery_date_time).toLocaleString()
                      : "Not set"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <ClipboardList className="h-4 w-4" />
                  Customer complaint
                  {jobCard.job_items?.length ? (
                    <Badge variant="secondary" className="font-normal">
                      {jobCard.job_items.length}
                    </Badge>
                  ) : null}
                </p>
                {jobCard.job_items && jobCard.job_items.length > 0 ? (
                  <div className="space-y-3">
                    {jobCard.job_items.map((item, idx) => {
                      const complaint = jobItemComplaintText(item);
                      return (
                        <div key={item.name || idx} className="rounded-lg border bg-muted/20 p-4">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Complaint {idx + 1}
                            {item.symptom_category ? ` · ${item.symptom_category}` : ""}
                            {item.severity ? ` · ${item.severity}` : ""}
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {complaint || "—"}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No customer complaints on this job card.</p>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Advisor notes</p>
                {richTextBlock(jobCard.service_advisor_notes)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workshop Tab */}
        <TabsContent value="workshop" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                Workshop
              </CardTitle>
              <CardDescription>
                Technician assignment, diagnosis, labour time, and findings during repair.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Wrench className="h-4 w-4" />
                  Technician assigned
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Lead technician</p>
                    <p className="font-medium">
                      {jobCard.lead_technician_name || jobCard.lead_technician || "Not assigned"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Service bay</p>
                    <p className="font-medium">{jobCard.assigned_bay || "Not assigned"}</p>
                  </div>
                </div>
                {jobCard.assistant_technicians && jobCard.assistant_technicians.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Assistants</p>
                    <div className="flex flex-wrap gap-2">
                      {jobCard.assistant_technicians.map((a) => (
                        <Badge key={a.name} variant="outline">
                          {a.technician_name || a.technician}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Diagnosis</p>
                {estimateDiagnosis && (
                  <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      From service estimate
                      {jobCard.service_estimate ? ` (${jobCard.service_estimate})` : ""}
                    </p>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{estimateDiagnosis}</p>
                    {estimateRecommended && (
                      <>
                        <p className="text-xs font-medium text-muted-foreground mt-3 mb-1">
                          Recommended repairs
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{estimateRecommended}</p>
                      </>
                    )}
                  </div>
                )}
                {labourDiagnosisBlocks.length > 0 ? (
                  <div className="space-y-3">
                    {labourDiagnosisBlocks.map((block, idx) => (
                      <div key={idx} className="rounded-lg border p-4">
                        <p className="text-xs font-medium text-muted-foreground mb-1">{block.label}</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{block.text}</p>
                      </div>
                    ))}
                  </div>
                ) : !estimateDiagnosis ? (
                  <p className="text-sm text-muted-foreground">No diagnosis recorded yet.</p>
                ) : null}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Labor time
                </p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Estimated (labour lines)</p>
                    <p className="text-lg font-semibold">
                      {labourEstimatedHours ? `${labourEstimatedHours.toFixed(1)} hrs` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Actual (logged)</p>
                    <p className="text-lg font-semibold">
                      {labourActualHours ? `${Number(labourActualHours).toFixed(1)} hrs` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Job duration</p>
                    <p className="text-lg font-semibold">
                      {jobCard.actual_duration_hours
                        ? `${jobCard.actual_duration_hours} hrs`
                        : jobCard.estimated_duration_hours
                          ? `${jobCard.estimated_duration_hours} hrs est.`
                          : "—"}
                    </p>
                  </div>
                </div>
                {jobCard.labour && jobCard.labour.length > 0 && (
                  <div className="mt-4 dms-table-panel">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Operation</TableHead>
                          <TableHead>Technician</TableHead>
                          <TableHead className="text-right">Est. hrs</TableHead>
                          <TableHead className="text-right">Actual hrs</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobCard.labour.map((line, idx) => (
                          <TableRow key={line.name || idx}>
                            <TableCell className="font-medium">
                              {(line as { service_name?: string }).service_name
                                || (line as { vehicle_service_item?: string }).vehicle_service_item
                                || "—"}
                            </TableCell>
                            <TableCell>{line.technician || "—"}</TableCell>
                            <TableCell className="text-right">
                              {(line as { estimated_hours?: number }).estimated_hours ?? "—"}
                            </TableCell>
                            <TableCell className="text-right">
                              {(line as { actual_hours?: number }).actual_hours ?? "—"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Additional findings
                </p>
                <div className="space-y-4">
                  {jobCard.internal_notes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Workshop internal notes</p>
                      {richTextBlock(jobCard.internal_notes)}
                    </div>
                  )}
                  {jobCard.road_test_note && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">Road test notes</p>
                      {richTextBlock(jobCard.road_test_note)}
                    </div>
                  )}
                  {additionalWorkRequests.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Additional work discovered
                      </p>
                      <div className="space-y-2">
                        {additionalWorkRequests.map((awr) => (
                          <div key={awr.name} className="rounded-lg border p-3">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{awr.name}</span>
                              <Badge variant="outline">{awr.status}</Badge>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{awr.description || "—"}</p>
                            {awr.reason && (
                              <p className="text-xs text-muted-foreground mt-1">Reason: {awr.reason}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {!jobCard.internal_notes &&
                    !jobCard.road_test_note &&
                    additionalWorkRequests.length === 0 && (
                      <p className="text-sm text-muted-foreground">No additional findings recorded.</p>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
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
      <Dialog
        open={showPauseDialog}
        onOpenChange={(open) => {
          setShowPauseDialog(open);
          if (!open) setPauseOtherNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pause Repair</DialogTitle>
            <DialogDescription>
              Stop the repair timer until you resume. Use Request parts separately when you need
              warehouse stock.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select
                value={pauseReason}
                onValueChange={(v) => {
                  setPauseReason(v as typeof pauseReason);
                  if (v !== "Other") setPauseOtherNotes("");
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Waiting Parts">Waiting for Parts</SelectItem>
                  <SelectItem value="Waiting Customer Approval">Waiting for Customer Approval</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {pauseReason === "Other" && (
              <div className="space-y-2">
                <Label htmlFor="pause-other-notes">Details</Label>
                <Textarea
                  id="pause-other-notes"
                  placeholder="e.g. Lunch break, waiting for tool, technical support…"
                  value={pauseOtherNotes}
                  onChange={(e) => setPauseOtherNotes(e.target.value)}
                  rows={3}
                />
              </div>
            )}
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
        <DetailSheet
          open={showInvoiceSheet}
          onOpenChange={setShowInvoiceSheet}
          title={invoiceDetail?.name || jobCard.invoice}
          subtitle={invoiceDetail?.customer_name || invoiceDetail?.customer || jobCard.customer_name}
          badge={invoiceDetail?.status ? { label: invoiceDetail.status } : undefined}
          footer={
            <div className="flex flex-col gap-2 w-full">
              <PrintFormatDropdown
                doctype="Sales Invoice"
                docName={jobCard.invoice}
                className="w-full"
              />
              {canCollectPayment ? (
                <Button
                  className="w-full"
                  onClick={() => {
                    setShowInvoiceSheet(false);
                    setShowPaymentDialog(true);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Collect Payment
                </Button>
              ) : null}
            </div>
          }
        >
          {invoiceDetail ? (
            <>
              <DetailSection title="Customer">
                <DetailRow label="Customer" value={invoiceDetail.customer} />
                <DetailRow label="Customer Name" value={invoiceDetail.customer_name} />
              </DetailSection>
              <DetailSection title="Dates">
                <DetailRow
                  label="Posting Date"
                  value={
                    invoiceDetail.posting_date
                      ? new Date(invoiceDetail.posting_date).toLocaleDateString()
                      : undefined
                  }
                />
                <DetailRow
                  label="Due Date"
                  value={
                    invoiceDetail.due_date
                      ? new Date(invoiceDetail.due_date).toLocaleDateString()
                      : undefined
                  }
                />
              </DetailSection>
              <DetailSection title="Amounts">
                <DetailRow
                  label="Net Total"
                  value={formatInvoiceMoney(
                    invoiceDetail.net_total || 0,
                    invoiceDetail.currency
                  )}
                />
                <DetailRow
                  label="Tax"
                  value={formatInvoiceMoney(
                    invoiceDetail.total_taxes_and_charges || 0,
                    invoiceDetail.currency
                  )}
                />
                <DetailRow
                  label="Grand Total"
                  value={formatInvoiceMoney(
                    invoiceDetail.grand_total || 0,
                    invoiceDetail.currency
                  )}
                />
                <DetailRow
                  label="Outstanding"
                  value={formatInvoiceMoney(
                    invoiceDetail.outstanding_amount || 0,
                    invoiceDetail.currency
                  )}
                />
              </DetailSection>
              <DetailSection title="Info">
                <DetailRow label="Status" value={invoiceDetail.status} />
                <DetailRow label="Currency" value={invoiceDetail.currency} />
                {invoiceDetail.company ? (
                  <DetailRow label="Company" value={invoiceDetail.company} />
                ) : null}
              </DetailSection>
              {invoiceDetail.items?.length > 0 && (
                <DetailSection title="Line Items">
                  <div className="dms-table-panel rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoiceDetail.items.map((line, idx) => (
                          <TableRow key={`${line.item_code}-${idx}`}>
                            <TableCell className="max-w-[200px]">
                              <div className="font-medium truncate" title={line.item_code}>
                                {line.item_code}
                              </div>
                              {(line.item_name || line.description) &&
                              (line.item_name || line.description) !== line.item_code ? (
                                <div
                                  className="text-xs font-light text-muted-foreground truncate"
                                  title={line.item_name || line.description}
                                >
                                  {line.item_name || line.description}
                                </div>
                              ) : null}
                            </TableCell>
                            <TableCell className="text-right">{line.qty}</TableCell>
                            <TableCell className="text-right">
                              {formatInvoiceMoney(line.amount || 0, invoiceDetail.currency)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="mt-3 space-y-1.5 rounded-md border bg-muted/30 px-3 py-2 text-sm">
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Net Total</span>
                      <span>
                        {formatInvoiceMoney(
                          invoiceDetail.net_total || 0,
                          invoiceDetail.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Tax</span>
                      <span>
                        {formatInvoiceMoney(
                          invoiceDetail.total_taxes_and_charges || 0,
                          invoiceDetail.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 border-t pt-1.5 font-medium">
                      <span>Grand Total</span>
                      <span>
                        {formatInvoiceMoney(
                          invoiceDetail.grand_total || 0,
                          invoiceDetail.currency
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-muted-foreground">Outstanding</span>
                      <span
                        className={
                          (invoiceDetail.outstanding_amount || 0) > 0
                            ? "font-medium text-amber-600 dark:text-amber-400"
                            : undefined
                        }
                      >
                        {formatInvoiceMoney(
                          invoiceDetail.outstanding_amount || 0,
                          invoiceDetail.currency
                        )}
                      </span>
                    </div>
                  </div>
                </DetailSection>
              )}
              {invoiceDetail.docstatus !== 1 && (
                <p className="text-sm text-muted-foreground px-1">
                  Invoice is a draft — submit in ERPNext to collect payment.
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Loading invoice details…</p>
          )}
        </DetailSheet>
      )}

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

function formatInvoiceMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "ETB",
    minimumFractionDigits: 2,
  }).format(amount);
}
