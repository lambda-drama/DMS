"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { SignaturePad } from "@/components/signature-pad";
import {
  CustomerTermsAcceptance,
  type BilingualCustomerTerms,
} from "@/components/customer-terms-acceptance";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Package,
  Pencil,
  Plus,
  Stethoscope,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as estimatesSvc from "@/services/serviceEstimates";
import {
  fetchSparePartPrice,
  fetchLabourRate,
  uploadFile,
  fetchVehicleServiceItemLineDefaults,
  sparePartToSelectOption,
  formatVehicleServiceItemLabel,
  vehicleServiceItemEstimatedHours,
} from "@/services/common";
import { useServiceEstimate, useSpareParts, useTechnicians, useVehicleServiceItems, useServicePackagesForVin } from "@/hooks/use-dms";
import { usePermissions } from "@/contexts/permissions-context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GroupDiscountFields } from "@/components/group-discount-fields";
import { WarrantyStatusBanner } from "@/components/warranty-status-banner";
import { AmountSummaryPopover } from "@/components/amount-summary-popover";
import { EditableLabourLinesTable } from "@/components/labour-parts/editable-labour-lines-table";
import { EditablePartsLinesTable } from "@/components/labour-parts/editable-parts-lines-table";
import { CreateSparePartDialog } from "@/components/create-spare-part-dialog";
import { CreateServiceItemDialog } from "@/components/create-service-item-dialog";
import {
  buildGroupDiscountPayload,
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from "@/lib/invoice-discount";
import * as vehiclesSvc from "@/services/vehicles";
import { fetchServicePackageLines } from "@/services/service-packages";
import type { VehicleWarrantySummary } from "@/types/dms";

function discountModeFromBackend(type?: string | null): InvoiceDiscountMode {
  if (!type) return "none";
  const t = type.toLowerCase();
  if (t === "percentage") return "percentage";
  if (t === "amount") return "amount";
  return "none";
}

function toFrappeDatetime(local: string) {
  if (!local) return "";
  return `${local.replace("T", " ")}:00`;
}

function defaultScheduleStartLocal() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultScheduleEndLocal(startLocal: string) {
  const d = startLocal ? new Date(startLocal) : new Date();
  if (Number.isNaN(d.getTime())) return defaultScheduleStartLocal();
  d.setHours(d.getHours() + 48);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

type EstimateLabourRow = {
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  estimated_hours: number;
  rate_per_hour: number;
};

type EstimatePartRow = {
  item_code: string;
  item_name: string;
  bin_location?: string;
  quantity_requested: number;
  unit_price: number;
};

export default function ServiceEstimateDetailPage() {
  const { viewParams, navigate } = useNavigation();
  const id = viewParams.get("id") || "";
  const { data: estimate, isLoading, error, mutate } = useServiceEstimate(id || null);
  const { canWrite, canDelete } = usePermissions();

  const [busy, setBusy] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("diagnosis");
  const [diagnosisFindings, setDiagnosisFindings] = useState("");
  const [recommendedRepairs, setRecommendedRepairs] = useState("");
  const [labourRows, setLabourRows] = useState<EstimateLabourRow[]>([]);
  const [partRows, setPartRows] = useState<EstimatePartRow[]>([]);
  const [newLabour, setNewLabour] = useState<EstimateLabourRow>({
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
  });
  const [newPart, setNewPart] = useState<EstimatePartRow>({
    item_code: "",
    item_name: "",
    quantity_requested: 1,
    unit_price: 0,
  });
  const [serviceItemSearch, setServiceItemSearch] = useState("");
  const [sparePartSearch, setSparePartSearch] = useState("");
  const [vehicleModelFilter, setVehicleModelFilter] = useState("");
  const [resolvedVehicleModel, setResolvedVehicleModel] = useState<string | null>(null);
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(
    serviceItemSearch,
    vehicleModelFilter || undefined,
    estimate?.vehicle_vin || undefined
  );
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(sparePartSearch);
  const [acceptSignature, setAcceptSignature] = useState("");
  const [rejectSignature, setRejectSignature] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [lostSaleFollowUpDate, setLostSaleFollowUpDate] = useState("");
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [customerTerms, setCustomerTerms] = useState<BilingualCustomerTerms | null>(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [startRepair, setStartRepair] = useState(false);
  const [showStartRepairDialog, setShowStartRepairDialog] = useState(false);
  const [acceptLeadTechnician, setAcceptLeadTechnician] = useState("");
  const [acceptScheduleStart, setAcceptScheduleStart] = useState("");
  const [acceptScheduleEnd, setAcceptScheduleEnd] = useState("");
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();
  
  // Create dialogs state
  const [showCreateSparePartDialog, setShowCreateSparePartDialog] = useState(false);
  const [showCreateServiceItemDialog, setShowCreateServiceItemDialog] = useState(false);
  const [warrantyApplicationType, setWarrantyApplicationType] = useState("");
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [labourDiscountInput, setLabourDiscountInput] = useState("");
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [partsDiscountInput, setPartsDiscountInput] = useState("");
  const [warrantySummary, setWarrantySummary] = useState<VehicleWarrantySummary | null>(null);
  const [selectedServicePackage, setSelectedServicePackage] = useState("");
  const [isLoadingPackageLines, setIsLoadingPackageLines] = useState(false);
  const lastAppliedPackageRef = useRef<string | null>(null);

  const { data: servicePackagesForVin, isLoading: servicePackagesLoading } =
    useServicePackagesForVin(estimate?.vehicle_vin || null, resolvedVehicleModel);

  useEffect(() => {
    const tab = viewParams.get("tab");
    if (tab === "estimation" || tab === "diagnosis" || tab === "approval") {
      setActiveTab(tab);
    }
  }, [id, viewParams]);

  useEffect(() => {
    if (!estimate) return;
    setWarrantyApplicationType(estimate.warranty_application_type || "");
    setLabourDiscountMode(discountModeFromBackend(estimate.labour_discount_type));
    setLabourDiscountInput(
      estimate.labour_discount_value ? String(estimate.labour_discount_value) : ""
    );
    setPartsDiscountMode(discountModeFromBackend(estimate.parts_discount_type));
    setPartsDiscountInput(
      estimate.parts_discount_value ? String(estimate.parts_discount_value) : ""
    );
    setDiagnosisFindings(estimate.diagnosis_findings || "");
    setRecommendedRepairs(estimate.recommended_repairs || "");
    setLabourRows(
      (estimate.labour || []).map((row) => ({
        vehicle_service_item: row.vehicle_service_item || "",
        vehicle_service_item_name:
          row.service_name || row.vehicle_service_item || "",
        estimated_hours: row.estimated_hours ?? 1,
        rate_per_hour: row.rate_per_hour ?? 0,
      }))
    );
    setPartRows(
      (estimate.parts || []).map((row) => ({
        item_code: row.item_code || "",
        item_name: row.part_name || row.item_code || "",
        bin_location: row.bin_location || "",
        quantity_requested: row.quantity_requested ?? 1,
        unit_price: row.unit_price ?? 0,
      }))
    );
    setSelectedServicePackage(estimate.service_package || "");
    lastAppliedPackageRef.current = estimate.service_package || null;
    if (estimate.vehicle_model) {
      setResolvedVehicleModel(estimate.vehicle_model);
      setVehicleModelFilter(estimate.vehicle_model);
    }
  }, [estimate]);

  useEffect(() => {
    if (!estimate?.vehicle_vin) {
      setWarrantySummary(null);
      setVehicleModelFilter("");
      return;
    }
    void vehiclesSvc.getVehicle(estimate.vehicle_vin).then(
      (full) => {
        setWarrantySummary(full.warranty_summary || null);
        const model = full.resolved_vehicle_model || full.model || estimate.vehicle_model || "";
        setVehicleModelFilter(model);
        setResolvedVehicleModel(model || null);
      },
      () => {
        setWarrantySummary(null);
        setVehicleModelFilter(estimate.vehicle_model || "");
        setResolvedVehicleModel(estimate.vehicle_model || null);
      }
    );
  }, [estimate?.vehicle_vin, estimate?.vehicle_model]);

  useEffect(() => {
    if (estimate?.status !== "Pending Customer Approval") {
      setTermsAccepted(Boolean(estimate?.terms_accepted));
      return;
    }
    let cancelled = false;
    setTermsLoading(true);
    void estimatesSvc
      .getCustomerTermsAndConditions()
      .then((terms) => {
        if (cancelled) return;
        setCustomerTerms(terms);
      })
      .catch(() => {
        if (cancelled) return;
        setCustomerTerms(null);
      })
      .finally(() => {
        if (!cancelled) setTermsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [estimate?.status, estimate?.terms_accepted]);

  useEffect(() => {
    if (!termsAccepted) {
      setAcceptSignature("");
      setRejectSignature("");
    }
  }, [termsAccepted]);

  const populateFromServicePackage = useCallback(async (packageName: string) => {
    setIsLoadingPackageLines(true);
    try {
      const lines = await fetchServicePackageLines(packageName, {
        vin: estimate?.vehicle_vin,
        vehicleModel: resolvedVehicleModel,
      });
      setLabourRows(
        lines.labour.map((row) => ({
          vehicle_service_item: row.vehicle_service_item,
          vehicle_service_item_name: row.service_code
            ? `${row.service_code}: ${row.service_name || row.vehicle_service_item}`
            : (row.service_name || row.vehicle_service_item),
          estimated_hours: row.estimated_hours,
          rate_per_hour: row.rate_per_hour,
        }))
      );
      setPartRows(
        lines.parts.map((row) => ({
          item_code: row.item_code,
          item_name: row.item_name || row.item_code,
          bin_location: row.bin_location,
          quantity_requested: row.quantity_requested,
          unit_price: row.unit_price,
        }))
      );

      const pkgLabel = lines.package_name || packageName;
      toast.success(
        `Loaded "${pkgLabel}": ${lines.labour.length} labour, ${lines.parts.length} parts`
      );

      if ((lines.labour_discount_amount || 0) > 0) {
        setLabourDiscountMode("amount");
        setLabourDiscountInput(String(lines.labour_discount_amount));
      }
    } catch (err) {
      lastAppliedPackageRef.current = null;
      toast.error(
        err instanceof Error ? err.message : "Could not load service package"
      );
    } finally {
      setIsLoadingPackageLines(false);
    }
  }, [estimate?.vehicle_vin, resolvedVehicleModel]);

  const servicePackageOptions = useMemo(
    () =>
      servicePackagesForVin?.packages?.map((p) => ({
        value: p.name,
        label: p.package_id
          ? `${p.package_id} — ${p.description || p.package_name}`
          : p.description || p.package_name,
        description: [
          p.total_amount ? `Total ${p.total_amount.toLocaleString()}` : null,
          p.before_discount && p.after_discount && p.before_discount !== p.after_discount
            ? `Before ${p.before_discount.toLocaleString()} → After ${p.after_discount.toLocaleString()}`
            : null,
          p.interval_km ? `${p.interval_km.toLocaleString()} km` : null,
          p.interval_months ? `${p.interval_months} mo` : null,
          p.total_labor_hours ? `${p.total_labor_hours}h labour` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })) || [],
    [servicePackagesForVin]
  );

  useEffect(() => {
    if (!selectedServicePackage) return;
    if (
      servicePackageOptions.length > 0 &&
      !servicePackageOptions.some((option) => option.value === selectedServicePackage)
    ) {
      setSelectedServicePackage("");
      lastAppliedPackageRef.current = null;
    }
  }, [servicePackageOptions, selectedServicePackage]);

  const isEstimateEditable = useMemo(
    () => estimate && !["Rejected", "Cancelled"].includes(estimate.status),
    [estimate]
  );
  const isAccepted = estimate?.status === "Accepted";
  const canEditEstimate = Boolean(isEstimateEditable && canWrite("service-estimates"));
  const canDeleteEstimate = Boolean(canDelete("service-estimates"));

  useEffect(() => {
    if (!estimate?.vehicle_vin || !selectedServicePackage || !canEditEstimate) {
      if (!selectedServicePackage) {
        lastAppliedPackageRef.current = null;
      }
      return;
    }
    if (lastAppliedPackageRef.current === selectedServicePackage) {
      return;
    }
    lastAppliedPackageRef.current = selectedServicePackage;
    void populateFromServicePackage(selectedServicePackage);
  }, [
    estimate?.vehicle_vin,
    selectedServicePackage,
    populateFromServicePackage,
    canEditEstimate,
  ]);

  const runAction = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        await mutate();
        toast.success(label);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `Failed: ${label}`);
      } finally {
        setBusy(false);
      }
    },
    [mutate]
  );

  const isSupplementary = estimate?.estimate_type === "Supplementary";

  const acceptEstimateAndNavigate = useCallback(
    async (payload: {
      customer_signature: string;
      lead_technician?: string;
      schedule_start_time?: string;
      schedule_end_time?: string;
      start_repair?: boolean;
      terms_accepted?: boolean;
    }) => {
      setBusy(true);
      try {
        const res = await estimatesSvc.acceptEstimate(id, payload);
        setShowStartRepairDialog(false);
        toast.success(
          isSupplementary
            ? "Supplementary estimate accepted — job card updated"
            : "Estimate accepted — job card created"
        );
        navigate("job-card-detail", {
          id: isSupplementary ? estimate?.parent_job_card || res.job_card : res.job_card,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to accept estimate");
      } finally {
        setBusy(false);
      }
    },
    [id, navigate, isSupplementary, estimate?.parent_job_card]
  );

  const openStartRepairDialog = () => {
    const start = defaultScheduleStartLocal();
    setAcceptScheduleStart(start);
    setAcceptScheduleEnd(defaultScheduleEndLocal(start));
    setAcceptLeadTechnician("");
    setShowStartRepairDialog(true);
  };

  const handleAcceptClick = () => {
    if (!termsAccepted) {
      toast.error("Customer must accept the terms and conditions first");
      return;
    }
    if (!acceptSignature) {
      toast.error("Customer signature is required");
      return;
    }
    if (startRepair) {
      openStartRepairDialog();
      return;
    }
    void acceptEstimateAndNavigate({
      customer_signature: acceptSignature,
      start_repair: false,
      terms_accepted: true,
    });
  };

  const handleConfirmAcceptWithRepair = () => {
    if (!termsAccepted) {
      toast.error("Customer must accept the terms and conditions first");
      return;
    }
    if (!acceptLeadTechnician) {
      toast.error("Lead technician is required");
      return;
    }
    if (!acceptScheduleStart) {
      toast.error("Schedule start time is required");
      return;
    }
    if (!acceptScheduleEnd) {
      toast.error("Schedule end time is required");
      return;
    }
    if (new Date(acceptScheduleEnd) <= new Date(acceptScheduleStart)) {
      toast.error("Schedule end must be after schedule start");
      return;
    }
    void acceptEstimateAndNavigate({
      customer_signature: acceptSignature,
      lead_technician: acceptLeadTechnician,
      schedule_start_time: toFrappeDatetime(acceptScheduleStart),
      schedule_end_time: toFrappeDatetime(acceptScheduleEnd),
      start_repair: true,
      terms_accepted: true,
    });
  };

  const buildWarrantyPayload = () => ({
    warranty_application_type:
      warrantyApplicationType && warrantyApplicationType !== "none"
        ? warrantyApplicationType
        : undefined,
    ...(warrantyApplicationType === "Discount"
      ? {
          labour_discount: buildGroupDiscountPayload(labourDiscountMode, labourDiscountInput),
          parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
        }
      : {}),
  });

  const saveEstimate = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await estimatesSvc.updateServiceEstimate(id, {
        diagnosis_findings: diagnosisFindings,
        recommended_repairs: recommendedRepairs,
        service_package: selectedServicePackage || undefined,
        ...buildWarrantyPayload(),
        labour: labourRows.map((row) => ({
          vehicle_service_item: row.vehicle_service_item,
          service_name: row.vehicle_service_item_name,
          estimated_hours: row.estimated_hours,
          rate_per_hour: row.rate_per_hour,
          amount: (row.estimated_hours || 0) * (row.rate_per_hour || 0),
        })),
        parts: partRows.map((row) => ({
          item_code: row.item_code,
          part_name: row.item_name,
          bin_location: row.bin_location,
          quantity_requested: row.quantity_requested,
          unit_price: row.unit_price,
          total_amount: (row.quantity_requested || 0) * (row.unit_price || 0),
        })),
      });
      await mutate();
      toast.success(isAccepted ? "Estimate saved — job card updated where allowed" : "Estimate saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEstimate = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await estimatesSvc.deleteServiceEstimate(id);
      toast.success("Service estimate deleted");
      navigate("service-estimates");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete estimate");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleServiceItemSelect = async (itemName: string) => {
    if (!itemName) return;
    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    let estHours = vehicleServiceItemEstimatedHours(item);
    let serviceLabel = formatVehicleServiceItemLabel(item) || itemName;

    try {
      const defaults = await fetchVehicleServiceItemLineDefaults(itemName);
      if (defaults.estimated_hours > 0) estHours = defaults.estimated_hours;
      if (defaults.rate_per_hour > 0) rate = defaults.rate_per_hour;
      if (defaults.service_name || defaults.service_code) {
        serviceLabel = defaults.service_code
          ? `${defaults.service_code}: ${defaults.service_name || itemName}`
          : (defaults.service_name || serviceLabel);
      }
    } catch {
      if (!rate) {
        try {
          rate = await fetchLabourRate(itemName);
        } catch {
          /* ignore */
        }
      }
    }

    setNewLabour((prev) => ({
      ...prev,
      vehicle_service_item: itemName,
      vehicle_service_item_name: serviceLabel,
      estimated_hours: estHours > 0 ? estHours : prev.estimated_hours || 1,
      rate_per_hour: rate || prev.rate_per_hour,
    }));
  };

  const handleSparePartSelect = async (partName: string) => {
    if (!partName) {
      setNewPart({ item_code: "", item_name: "", bin_location: "", quantity_requested: 1, unit_price: 0 });
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let unitPrice = 0;
    try {
      unitPrice = await fetchSparePartPrice(partName);
    } catch {
      toast.error("Could not load spare part unit price");
    }
    setNewPart({
      item_code: partName,
      item_name: part?.item_name || partName,
      bin_location: part?.bin_location || "",
      quantity_requested: 1,
      unit_price: unitPrice,
    });
  };

  const addLabourRow = () => {
    if (!newLabour.vehicle_service_item) {
      toast.error("Please select a service item");
      return;
    }
    setLabourRows((prev) => [...prev, { ...newLabour }]);
    setNewLabour({
      vehicle_service_item: "",
      vehicle_service_item_name: "",
      estimated_hours: 0,
      rate_per_hour: 0,
    });
  };

  const removeLabourRow = (idx: number) => {
    setLabourRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLabourRow = (idx: number, patch: Partial<EstimateLabourRow>) => {
    setLabourRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const addPartRow = () => {
    if (!newPart.item_code) {
      toast.error("Please select a spare part");
      return;
    }
    setPartRows((prev) => [...prev, { ...newPart }]);
    setNewPart({ item_code: "", item_name: "", bin_location: "", quantity_requested: 1, unit_price: 0 });
  };

  const removePartRow = (idx: number) => {
    setPartRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePartRow = (idx: number, patch: Partial<EstimatePartRow>) => {
    setPartRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-muted-foreground">No estimate ID provided</p>
        <Button variant="outline" onClick={() => navigate("service-estimates")}>
          Back to estimates
        </Button>
      </div>
    );
  }

  if (isLoading || !estimate) {
    return (
      <div className="flex justify-center py-24">
        {error ? (
          <p className="text-destructive">Failed to load estimate</p>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        )}
      </div>
    );
  }

  const status = estimate.status;
  const labourTotal = labourRows.reduce(
    (sum, row) => sum + (row.estimated_hours || 0) * (row.rate_per_hour || 0),
    0
  );
  const partsTotal = partRows.reduce(
    (sum, row) => sum + (row.quantity_requested || 0) * (row.unit_price || 0),
    0
  );
  const grossTotal = labourTotal + partsTotal;
  const labourDiscountValue = parseDiscountValue(labourDiscountMode, labourDiscountInput);
  const partsDiscountValue = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const labourDiscountTotal = groupDiscountAmount(labourTotal, labourDiscountMode, labourDiscountValue);
  const partsDiscountTotal = groupDiscountAmount(partsTotal, partsDiscountMode, partsDiscountValue);
  const combinedDiscountTotal = labourDiscountTotal + partsDiscountTotal;
  const netBeforeVat = (() => {
    if (warrantyApplicationType === "All Invoice") return 0;
    if (warrantyApplicationType === "Spare Part") return labourTotal;
    if (warrantyApplicationType === "Labour") return partsTotal;
    if (warrantyApplicationType === "Discount") {
      return Math.max(grossTotal - combinedDiscountTotal, 0);
    }
    return grossTotal;
  })();
  const vatRate = estimate.vat_rate ?? 15;
  const previewVat = netBeforeVat * (vatRate / 100);
  const previewGrandTotal = netBeforeVat + previewVat;

  const handleWarrantyApplicationChange = (value: string) => {
    setWarrantyApplicationType(value);
    if (value !== "Discount") {
      setLabourDiscountMode("none");
      setLabourDiscountInput("");
      setPartsDiscountMode("none");
      setPartsDiscountInput("");
    }
  };

  const validateWarrantyBeforeSubmit = () => {
    if (warrantyApplicationType !== "Discount") return true;
    if (combinedDiscountTotal < 1 && grossTotal > 0) {
      toast.error("Set a labour and/or parts discount (total at least 1)");
      return false;
    }
    return true;
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("service-estimates")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">{estimate.name}</h1>
              <Badge variant="outline">{status}</Badge>
              {estimate.diagnostic_fee_voided ? (
                <Badge className="bg-green-600">Diagnostic fee voided</Badge>
              ) : null}
              {estimate.warranty_application_type ? (
                <Badge variant="secondary">Warranty: {estimate.warranty_application_type}</Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-muted-foreground">
              {estimate.customer_name || estimate.customer} — {estimate.license_plate || estimate.vehicle_vin}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <AmountSummaryPopover
            title="Estimate totals"
            lines={[
              {
                label: "Diagnostic fee",
                value: `${(estimate.diagnostic_fee || 0).toLocaleString()} ETB`,
              },
              {
                label: "Customer net (before VAT)",
                value: `${(estimate.total_before_vat || 0).toLocaleString()} ETB`,
              },
              {
                label: `VAT (${estimate.vat_rate || 15}%)`,
                value: `${(estimate.vat_amount || 0).toLocaleString()} ETB`,
              },
              {
                label: "Grand total",
                value: `${(estimate.grand_total || 0).toLocaleString()} ETB`,
                highlight: true,
              },
            ]}
          />
          <PrintFormatDropdown doctype="DMS Service Estimate" docName={id} />
          {estimate.job_card && (
            <Button variant="outline" size="sm" onClick={() => navigate("job-card-detail", { id: estimate.job_card! })}>
              View Job Card
            </Button>
          )}
          {estimate.inspection && (
            <Button variant="outline" size="sm" onClick={() => navigate("inspection-detail", { id: estimate.inspection! })}>
              View Inspection
            </Button>
          )}
          {canEditEstimate && isAccepted && (
            <Button variant="outline" size="sm" onClick={() => setActiveTab("estimation")}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit estimate
            </Button>
          )}
          {canDeleteEstimate && (
            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="dms-tabs-scroll w-full justify-start">
          <TabsTrigger value="diagnosis">
            <Stethoscope className="mr-2 h-4 w-4" />
            Diagnosis
          </TabsTrigger>
          <TabsTrigger value="estimation">
            <ClipboardList className="mr-2 h-4 w-4" />
            Estimation
          </TabsTrigger>
          <TabsTrigger value="approval">Customer approval</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The mechanic performs the diagnosis. The service advisor records what was found and what is
                recommended to fix it.
              </p>

              <div className="space-y-2">
                <Label>Problems found</Label>
                <Textarea
                  value={diagnosisFindings}
                  onChange={(e) => setDiagnosisFindings(e.target.value)}
                  disabled={!canEditEstimate}
                  rows={5}
                  placeholder="List all problems identified during diagnosis..."
                />
              </div>

              <div className="space-y-2">
                <Label>Recommended repairs</Label>
                <Textarea
                  value={recommendedRepairs}
                  onChange={(e) => setRecommendedRepairs(e.target.value)}
                  disabled={!canEditEstimate}
                  rows={5}
                  placeholder="Describe the recommended work to resolve the problems..."
                />
              </div>

              {canEditEstimate && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={saveEstimate} disabled={busy}>
                    Save diagnosis
                  </Button>
                  {["Diagnosis In Progress", "Draft"].includes(status) && (
                    <Button
                      onClick={() =>
                        runAction("Diagnosis completed", async () => {
                          await saveEstimate();
                          await estimatesSvc.completeDiagnosis(id, {
                            diagnosis_findings: diagnosisFindings,
                            recommended_repairs: recommendedRepairs,
                          });
                          setActiveTab("estimation");
                        })
                      }
                      disabled={busy || (!diagnosisFindings.trim() && !recommendedRepairs.trim())}
                    >
                      Complete diagnosis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  {status === "Diagnosis Complete" && (
                    <Button
                      onClick={() =>
                        runAction("Estimation started", () => estimatesSvc.startEstimation(id))
                      }
                      disabled={busy}
                    >
                      Start estimation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Warranty application</CardTitle>
              <CardDescription>
                Choose how warranty applies to this estimate — same options as on the job card invoice.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {warrantySummary && <WarrantyStatusBanner summary={warrantySummary} />}
              <div className="space-y-2 max-w-md">
                <Label htmlFor="estimate-warranty-type">Warranty application type</Label>
                <Select
                  value={warrantyApplicationType || "none"}
                  onValueChange={handleWarrantyApplicationChange}
                  disabled={!canEditEstimate}
                >
                  <SelectTrigger id="estimate-warranty-type">
                    <SelectValue placeholder="None (customer pays all)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (customer pays all)</SelectItem>
                    <SelectItem value="All Invoice">All Invoice</SelectItem>
                    <SelectItem value="Labour">Labour</SelectItem>
                    <SelectItem value="Spare Part">Spare Part</SelectItem>
                    <SelectItem value="Discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {canEditEstimate && warrantyApplicationType === "Discount" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <GroupDiscountFields
                    label="Labour"
                    mode={labourDiscountMode}
                    onModeChange={setLabourDiscountMode}
                    value={labourDiscountInput}
                    onValueChange={setLabourDiscountInput}
                    subtotal={labourTotal}
                  />
                  <GroupDiscountFields
                    label="Parts"
                    mode={partsDiscountMode}
                    onModeChange={setPartsDiscountMode}
                    value={partsDiscountInput}
                    onValueChange={setPartsDiscountInput}
                    subtotal={partsTotal}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Service Package
              </CardTitle>
              <CardDescription>
                {estimate.vehicle_vin
                  ? servicePackagesForVin?.vehicle_model_label
                    ? `Packages for ${servicePackagesForVin.vehicle_model_label} only. Choosing a package fills labour and parts below.`
                    : servicePackagesForVin?.message ||
                      "Link a Vehicle Model on this VIN to see matching packages."
                  : "No vehicle linked to this estimate."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Package</Label>
                <SearchableSelect
                  options={servicePackageOptions}
                  value={selectedServicePackage}
                  onValueChange={setSelectedServicePackage}
                  placeholder={
                    !estimate.vehicle_vin
                      ? "No vehicle on estimate"
                      : servicePackagesLoading || isLoadingPackageLines
                        ? "Loading…"
                        : servicePackageOptions.length
                          ? "Select service package…"
                          : "No packages for this model"
                  }
                  disabled={
                    !canEditEstimate ||
                    !estimate.vehicle_vin ||
                    servicePackageOptions.length === 0 ||
                    isLoadingPackageLines
                  }
                  isLoading={servicePackagesLoading || isLoadingPackageLines}
                />
              </div>
              {estimate.vehicle_vin &&
                !servicePackagesLoading &&
                servicePackageOptions.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Set Model on the vehicle (VIN No), then link packages under Vehicle
                    Service Package → Applicable Vehicle Models.
                  </p>
                )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Labour Lines
              </CardTitle>
              <CardDescription>Add labour operations for the repair estimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {labourRows.length > 0 && (
                <EditableLabourLinesTable
                  rows={labourRows}
                  editable={canEditEstimate}
                  onUpdateRow={updateLabourRow}
                  onRemoveRow={removeLabourRow}
                  subtotal={labourTotal}
                />
              )}

              {canEditEstimate && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-2">
                  <div className="space-y-1 sm:col-span-4">
                    <Label className="text-xs">Service Item *</Label>
                    <SearchableSelect
                      options={
                        serviceItems?.map((si) => ({
                          value: si.name,
                          label: formatVehicleServiceItemLabel(si),
                          description: si.custom_rate || si.estimated_hours
                            ? [
                                si.custom_rate ? `Rate: ${si.custom_rate}` : null,
                                si.estimated_hours ? `${si.estimated_hours}h` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')
                            : undefined,
                        })) || []
                      }
                      value={newLabour.vehicle_service_item}
                      onValueChange={handleServiceItemSelect}
                      onSearchChange={setServiceItemSearch}
                      placeholder="Search items..."
                      isLoading={serviceItemsLoading}
                      onCreateNew={() => setShowCreateServiceItemDialog(true)}
                      createNewLabel="New Service Item"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:contents">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min={0}
                        placeholder="0"
                        value={newLabour.estimated_hours || ""}
                        onChange={(e) =>
                          setNewLabour((prev) => ({
                            ...prev,
                            estimated_hours: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Rate/Hr</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={newLabour.rate_per_hour || ""}
                        onChange={(e) =>
                          setNewLabour((prev) => ({
                            ...prev,
                            rate_per_hour: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" onClick={addLabourRow} className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {labourRows.length === 0 && !canEditEstimate && (
                <p className="text-sm text-muted-foreground">No labour lines added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parts Required</CardTitle>
              <CardDescription>Add spare parts needed for this estimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {partRows.length > 0 && (
                <EditablePartsLinesTable
                  rows={partRows}
                  editable={canEditEstimate}
                  quantityField="quantity_requested"
                  onUpdateRow={updatePartRow}
                  onRemoveRow={removePartRow}
                  subtotal={partsTotal}
                />
              )}

              {canEditEstimate && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-2">
                  <div className="space-y-1 sm:col-span-5">
                    <Label className="text-xs">Spare Part *</Label>
                    <SearchableSelect
                  options={spareParts?.map(sparePartToSelectOption) || []}
                      value={newPart.item_code}
                      onValueChange={handleSparePartSelect}
                      onSearchChange={setSparePartSearch}
                      placeholder="Search parts..."
                      isLoading={sparePartsLoading}
                      onCreateNew={() => setShowCreateSparePartDialog(true)}
                      createNewLabel="New Spare Part"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:contents">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={newPart.quantity_requested || ""}
                        onChange={(e) =>
                          setNewPart((prev) => ({
                            ...prev,
                            quantity_requested: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={newPart.unit_price || ""}
                        onChange={(e) =>
                          setNewPart((prev) => ({
                            ...prev,
                            unit_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" onClick={addPartRow} className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {partRows.length === 0 && !canEditEstimate && (
                <p className="text-sm text-muted-foreground">No parts added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Labour</p>
                  <p className="text-lg font-semibold">
                    {labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Parts</p>
                  <p className="text-lg font-semibold">
                    {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gross subtotal</p>
                  <p className="text-lg font-semibold">
                    {grossTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              {warrantyApplicationType && warrantyApplicationType !== "none" && (
                <>
                  <Separator />
                  <div className="flex flex-col items-end gap-2 text-sm">
                    <div className="flex w-full max-w-xs justify-between">
                      <span className="text-muted-foreground">
                        Warranty ({warrantyApplicationType})
                      </span>
                      <span className="font-medium text-orange-600">
                        -{(grossTotal - netBeforeVat).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                    {warrantyApplicationType === "Discount" && labourDiscountTotal > 0 && (
                      <div className="flex w-full max-w-xs justify-between">
                        <span className="text-muted-foreground">Labour discount</span>
                        <span className="font-medium text-orange-600">
                          -{labourDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                    {warrantyApplicationType === "Discount" && partsDiscountTotal > 0 && (
                      <div className="flex w-full max-w-xs justify-between">
                        <span className="text-muted-foreground">Parts discount</span>
                        <span className="font-medium text-orange-600">
                          -{partsDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
              <Separator />
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-sm text-muted-foreground">Customer net (before VAT)</p>
                  <p className="text-lg font-semibold text-primary">
                    {netBeforeVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">VAT ({vatRate}%)</p>
                  <p className="text-lg font-semibold">
                    {previewVat.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Grand total</p>
                  <p className="text-lg font-bold">
                    {previewGrandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {canEditEstimate && ["Diagnosis Complete", "Estimation In Progress"].includes(status) && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={saveEstimate} disabled={busy}>
                Save estimation
              </Button>
              <Button
                onClick={() => {
                  if (!validateWarrantyBeforeSubmit()) return;
                  void runAction("Sent to customer", async () => {
                    await saveEstimate();
                    await estimatesSvc.submitForCustomerApproval(id);
                    setActiveTab("approval");
                  });
                }}
                disabled={busy}
              >
                Submit for customer approval
              </Button>
            </div>
          )}

          {canEditEstimate && isAccepted && (
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={saveEstimate} disabled={busy}>
                Save changes
              </Button>
              {estimate.job_card ? (
                <p className="text-xs text-muted-foreground">
                  Labour and parts sync to the linked job card when no parts are issued and no invoice exists.
                </p>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approval" className="space-y-4">
          {status === "Pending Customer Approval" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Estimate summary for customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {estimate.warranty_application_type && (
                    <p className="text-muted-foreground">
                      Warranty application: <strong>{estimate.warranty_application_type}</strong>
                    </p>
                  )}
                  <p>
                    Customer amount (before VAT):{" "}
                    <strong>{(estimate.total_before_vat || 0).toLocaleString()} ETB</strong>
                  </p>
                  <p>
                    VAT: <strong>{(estimate.vat_amount || 0).toLocaleString()} ETB</strong>
                  </p>
                  <p>
                    Grand total: <strong>{(estimate.grand_total || 0).toLocaleString()} ETB</strong>
                  </p>
                  {!isSupplementary && (
                    <p className="text-muted-foreground">
                      If accepted, the diagnostic fee of {(estimate.diagnostic_fee || 0).toLocaleString()}{" "}
                      ETB will be voided and not added to the final invoice.
                    </p>
                  )}
                  {isSupplementary && estimate.parent_job_card && (
                    <p className="text-muted-foreground">
                      Approved lines will be added to job card {estimate.parent_job_card}.
                    </p>
                  )}
                </CardContent>
              </Card>

              <CustomerTermsAcceptance
                terms={customerTerms}
                loading={termsLoading}
                accepted={termsAccepted}
                onAcceptedChange={setTermsAccepted}
                printContext={{
                  documentTitle: `Service Estimate ${estimate.name}`,
                  details: [
                    { label: "Owners Name", value: estimate.customer_name || estimate.customer },
                    { label: "Estimate No.", value: estimate.name },
                    { label: "VIN", value: estimate.vehicle_vin },
                    { label: "Reg. No.", value: estimate.license_plate },
                    { label: "Service Advisor", value: estimate.service_advisor },
                    { label: "Grand Total", value: `${(estimate.grand_total || 0).toLocaleString()} ETB` },
                  ],
                }}
              />

              <Card className={!termsAccepted ? "opacity-60" : undefined}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Customer accepts estimate
                  </CardTitle>
                  {!termsAccepted ? (
                    <CardDescription>
                      Accept the terms and conditions above before signing.
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={!termsAccepted ? "pointer-events-none" : undefined}>
                    <SignaturePad
                      existingUrl={acceptSignature || undefined}
                      uploading={signatureUploading}
                      onSave={async (file) => {
                        if (!termsAccepted) return;
                        setSignatureUploading(true);
                        try {
                          const url = await uploadFile(file);
                          setAcceptSignature(url);
                        } finally {
                          setSignatureUploading(false);
                        }
                      }}
                      onClear={() => setAcceptSignature("")}
                      className="max-w-full"
                    />
                  </div>
                  {!isSupplementary && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="start-repair"
                        checked={startRepair}
                        disabled={!termsAccepted}
                        onCheckedChange={(v) => setStartRepair(Boolean(v))}
                      />
                      <Label htmlFor="start-repair">Start repair immediately on job card</Label>
                    </div>
                  )}
                  <Button
                    disabled={!termsAccepted || !acceptSignature || busy}
                    onClick={handleAcceptClick}
                  >
                    {isSupplementary ? "Accept & update job card" : "Accept & create job card"}
                  </Button>
                </CardContent>
              </Card>

              {!isSupplementary && (
              <Card className={!termsAccepted ? "opacity-60" : undefined}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Customer declines repair
                  </CardTitle>
                  {!termsAccepted ? (
                    <CardDescription>
                      Accept the terms and conditions above before signing.
                    </CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    A diagnostic invoice for {(estimate.diagnostic_fee || 0).toLocaleString()} ETB will
                    be created automatically.
                  </p>
                  <div className="space-y-2">
                    <Label>Rejection reason</Label>
                    <Select
                      value={rejectionReason || undefined}
                      onValueChange={setRejectionReason}
                      disabled={!termsAccepted || busy}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select reason…" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          "Price",
                          "Postponed",
                          "Unavailable Part",
                          "Went Elsewhere",
                          "Waiting for Salary",
                          "Vehicle Sold",
                          "No Response",
                          "Other",
                        ].map((r) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lost-sale-fu">Lost-sale follow-up date (optional)</Label>
                    <Input
                      id="lost-sale-fu"
                      type="date"
                      value={lostSaleFollowUpDate}
                      onChange={(e) => setLostSaleFollowUpDate(e.target.value)}
                      disabled={!termsAccepted || busy}
                    />
                  </div>
                  <div className={!termsAccepted ? "pointer-events-none" : undefined}>
                    <SignaturePad
                      existingUrl={rejectSignature || undefined}
                      uploading={signatureUploading}
                      onSave={async (file) => {
                        if (!termsAccepted) return;
                        setSignatureUploading(true);
                        try {
                          const url = await uploadFile(file);
                          setRejectSignature(url);
                        } finally {
                          setSignatureUploading(false);
                        }
                      }}
                      onClear={() => setRejectSignature("")}
                      className="max-w-full"
                    />
                  </div>
                  <Button
                    variant="destructive"
                    disabled={!termsAccepted || !rejectSignature || !rejectionReason || busy}
                    onClick={() => {
                      if (!termsAccepted) {
                        toast.error("Customer must accept the terms and conditions first");
                        return;
                      }
                      if (!rejectionReason) {
                        toast.error("Select a rejection reason");
                        return;
                      }
                      runAction("Estimate rejected — diagnostic invoice created", () =>
                        estimatesSvc.rejectEstimate(id, rejectSignature, true, {
                          rejection_reason: rejectionReason,
                          lost_sale_follow_up_date: lostSaleFollowUpDate || undefined,
                        })
                      );
                    }}
                  >
                    Reject & invoice diagnostic fee
                  </Button>
                </CardContent>
              </Card>
              )}
            </>
          )}

          {status === "Accepted" && (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <Badge className="bg-green-600">Accepted</Badge>
                <p>
                  Job card:{" "}
                  {isSupplementary
                    ? estimate.parent_job_card || estimate.job_card || "—"
                    : estimate.job_card || "—"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {(isSupplementary ? estimate.parent_job_card : estimate.job_card) && (
                    <Button
                      onClick={() =>
                        navigate("job-card-detail", {
                          id: (isSupplementary ? estimate.parent_job_card : estimate.job_card)!,
                        })
                      }
                    >
                      Open job card
                    </Button>
                  )}
                  {canEditEstimate && (
                    <Button variant="outline" onClick={() => setActiveTab("estimation")}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit labour & parts
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {status === "Rejected" && (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <Badge variant="destructive">Rejected</Badge>
                <p>Diagnostic invoice: {estimate.diagnostic_invoice || "—"}</p>
              </CardContent>
            </Card>
          )}

          {!["Pending Customer Approval", "Accepted", "Rejected"].includes(status) && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Complete diagnosis and estimation, then submit for customer approval to enable
                signatures here.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showStartRepairDialog} onOpenChange={setShowStartRepairDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start repair on job card</DialogTitle>
            <DialogDescription>
              Assign a lead technician and schedule before the job card is submitted and repair
              begins.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Lead technician *</Label>
              <SearchableSelect
                options={
                  technicians?.map((t) => ({
                    value: t.name,
                    label: t.full_name || t.name,
                  })) || []
                }
                value={acceptLeadTechnician}
                onValueChange={setAcceptLeadTechnician}
                placeholder="Search technicians..."
                isLoading={techniciansLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accept-schedule-start">Schedule start *</Label>
              <Input
                id="accept-schedule-start"
                type="datetime-local"
                value={acceptScheduleStart}
                onChange={(e) => setAcceptScheduleStart(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accept-schedule-end">Schedule end *</Label>
              <Input
                id="accept-schedule-end"
                type="datetime-local"
                value={acceptScheduleEnd}
                onChange={(e) => setAcceptScheduleEnd(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStartRepairDialog(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={handleConfirmAcceptWithRepair} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Accept & start repair"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete service estimate?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {estimate.name}. You cannot delete an estimate that already has a
              linked job card or diagnostic invoice.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteEstimate();
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete estimate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create dialogs */}
      <CreateSparePartDialog
        open={showCreateSparePartDialog}
        onOpenChange={setShowCreateSparePartDialog}
        onCreated={(itemCode, itemName) => {
          setNewPart((prev) => ({
            ...prev,
            item_code: itemCode,
            item_name: itemName,
          }));
          setSparePartSearch(itemCode);
          toast.success(`Spare part ${itemName} created and selected.`);
        }}
      />
      <CreateServiceItemDialog
        open={showCreateServiceItemDialog}
        onOpenChange={setShowCreateServiceItemDialog}
        onCreated={(serviceItemName) => {
          setNewLabour((prev) => ({
            ...prev,
            vehicle_service_item: serviceItemName,
          }));
          setServiceItemSearch(serviceItemName);
          toast.success(`Service item created and selected.`);
        }}
      />
    </div>
  );
}
