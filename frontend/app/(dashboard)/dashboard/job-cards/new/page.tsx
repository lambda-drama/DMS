"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import {
  useCreateJobCard,
  useCustomers,
  useVINs,
  useServiceAdvisors,
  useTechnicians,
  useServiceBays,
  useSpareParts,
  useVehicleServiceItems,
  useWarehouses,
  useInspections,
  useCompanies,
  useAutofillSingleCompany,
  useAutofillDefaultCustomer,
  useDmsCustomerDefaults,
  useCurrencies,
  useServicePackagesForVin,
} from "@/hooks/use-dms";
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from "@/lib/customer-default";
import { LinkWithCreate } from "@/components/link-with-create";
import { SearchableSelect } from "@/components/searchable-select";
import { FormActionsBar } from "@/components/layout/form-actions-bar";
import {
  fetchSparePartPrice,
  fetchLabourRate,
  fetchServiceBayDetail,
} from "@/services/common";
import * as vehiclesSvc from "@/services/vehicles";
import { fetchServicePackageLines } from "@/services/service-packages";
import { getInspection } from "@/services/inspections";
import { htmlToPlainText } from "@/lib/plain-text";
import {
  COMPLAINT_SEVERITY_OPTIONS,
  DEFAULT_COMPLAINT_SEVERITY,
  DEFAULT_SYMPTOM_CATEGORY,
  SYMPTOM_CATEGORIES,
} from "@/lib/customer-complaint-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Car, User, Wrench, Package } from "lucide-react";
import { toast } from "sonner";
import { GroupDiscountFields } from "@/components/group-discount-fields";
import {
  buildGroupDiscountPayload,
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from "@/lib/invoice-discount";
import { WarrantyStatusBanner } from "@/components/warranty-status-banner";
import { EditableLabourLinesTable } from "@/components/labour-parts/editable-labour-lines-table";
import { EditablePartsLinesTable } from "@/components/labour-parts/editable-parts-lines-table";
import type { DMSJobCard, JobCardType, Priority, VINNo, VehicleWarrantySummary } from "@/types/dms";

const jobCardTypes: JobCardType[] = [
  "Customer Paid",
  "Warranty",
  "Internal",
  "PDI",
  "Campaign/Recall",
  "Insurance",
  "Goodwill",
  "Fleet Contract",
];

const priorities: Priority[] = [
  "Normal",
  "VIP",
  "Comeback/Repeat Repair",
  "Safety Critical",
  "Immobilized",
  "Fleet Priority",
  "Emergency",
  "Urgent",
];

interface JobItemRow {
  complaint_description: string;
  symptom_category: string;
  severity: string;
  labor_operation: string;
}

interface LabourRow {
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  technician: string;
  technician_name: string;
  estimated_hours: number;
  rate_per_hour: number;
  complaint: string;
}

interface PartRow {
  item_code: string;
  item_name: string;
  quantity_requested: number;
  unit_price: number;
  warehouse?: string;
}

export default function NewJobCardPage() {
  const { navigate, viewParams } = useNavigation();
  const { trigger: createJobCard, isMutating } = useCreateJobCard();

  // Search states for searchable selects
  const [customerSearch, setCustomerSearch] = useState("");
  const [vinSearch, setVinSearch] = useState("");
  const [serviceItemSearch, setServiceItemSearch] = useState("");
  const [sparePartSearch, setSparePartSearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [company, setCompany] = useState("");
  const [currency, setCurrency] = useState("ETB");
  const [warehouse, setWarehouse] = useState("");

  // Lookup hooks
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: serviceAdvisors, isLoading: advisorsLoading } = useServiceAdvisors();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();
  const { data: serviceBays, isLoading: baysLoading } = useServiceBays();
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(serviceItemSearch);
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(sparePartSearch);
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses(
    warehouseSearch,
    company || undefined
  );
  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: dmsCustomerDefaults } = useDmsCustomerDefaults();
  const { data: currencies } = useCurrencies();

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    company,
    (c) => {
      setCompany(c.name);
      setWarehouse("");
      setWarehouseSearch("");
      if (c.default_currency) {
        setCurrency(c.default_currency);
      }
    },
    { search: companySearch }
  );

  // Main form state
  const [jobCardType, setJobCardType] = useState<string>("");
  const [priority, setPriority] = useState<string>("Normal");
  const [estimatedDurationHours, setEstimatedDurationHours] = useState<number>(0);
  const [promisedDelivery, setPromisedDelivery] = useState<string>("");

  const [customer, setCustomer] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [selectedServicePackage, setSelectedServicePackage] = useState("");
  const [isLoadingPackageLines, setIsLoadingPackageLines] = useState(false);
  const lastAppliedPackageRef = useRef<string | null>(null);
  /** Keeps VIN label/details when customer changes and search results no longer include this VIN */
  const [selectedVin, setSelectedVin] = useState<VINNo | null>(null);
  /** Owner from VIN — pinned in customer dropdown when not in search results */
  const [selectedCustomer, setSelectedCustomer] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);

  useAutofillDefaultCustomer(customer, (d) => {
    setCustomer(d.default_customer!);
    setSelectedCustomer({
      name: d.default_customer!,
      customer_name: d.customer_name || d.default_customer!,
      mobile_no: d.mobile_no || undefined,
    });
  });

  const [licensePlate, setLicensePlate] = useState("");
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [warrantyStatus, setWarrantyStatus] = useState("");
  const [warrantySummary, setWarrantySummary] = useState<VehicleWarrantySummary | null>(null);

  const [serviceAdvisor, setServiceAdvisor] = useState("");
  const [leadTechnician, setLeadTechnician] = useState("");
  const [assignedBay, setAssignedBay] = useState("");
  const [workshop, setWorkshop] = useState("");

  const [warrantyApplicationType, setWarrantyApplicationType] = useState("");
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [labourDiscountInput, setLabourDiscountInput] = useState("");
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [partsDiscountInput, setPartsDiscountInput] = useState("");
  const customerVehicleSectionRef = useRef<HTMLDivElement>(null);

  const handleWarrantyApplicationChange = (value: string) => {
    setWarrantyApplicationType(value);
    if (value !== "Discount") {
      setLabourDiscountMode("none");
      setLabourDiscountInput("");
      setPartsDiscountMode("none");
      setPartsDiscountInput("");
    }
    if (value && value !== "none") {
      requestAnimationFrame(() => {
        customerVehicleSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      });
    }
  };

  const [customerComplaintSummary, setCustomerComplaintSummary] = useState("");
  const [serviceAdvisorNotes, setServiceAdvisorNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const [appointmentId, setAppointmentId] = useState(viewParams.get("appointment") || "");
  const [inspectionId, setInspectionId] = useState(viewParams.get("inspection") || "");
  const [isLoadingInspectionComplaints, setIsLoadingInspectionComplaints] =
    useState(false);
  const lastAppliedInspectionRef = useRef<string | null>(null);

  // Inspections filtered by selected customer
  const { data: inspectionsData } = useInspections({ customer: customer || undefined });

  // VIN search is independent of customer — VIN drives customer, not the other way around
  const { data: vins, isLoading: vinsLoading } = useVINs(undefined, vinSearch);
  const { data: servicePackagesForVin, isLoading: servicePackagesLoading } =
    useServicePackagesForVin(vehicleVin || null);

  // Child table: Job Items
  const [jobItems, setJobItems] = useState<JobItemRow[]>([]);
  const [newJobItem, setNewJobItem] = useState<JobItemRow>({
    complaint_description: "",
    symptom_category: DEFAULT_SYMPTOM_CATEGORY,
    severity: DEFAULT_COMPLAINT_SEVERITY,
    labor_operation: "",
  });

  // Child table: Labour
  const [labourRows, setLabourRows] = useState<LabourRow[]>([]);
  const [newLabour, setNewLabour] = useState<LabourRow>({
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    technician: "",
    technician_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
    complaint: "",
  });

  // Child table: Parts
  const [partRows, setPartRows] = useState<PartRow[]>([]);
  const [newPart, setNewPart] = useState<PartRow>({
    item_code: "",
    item_name: "",
    quantity_requested: 1,
    unit_price: 0,
  });

  // Keep spare-part line warehouses in sync with the job card warehouse (per-line field on backend).
  useEffect(() => {
    if (!warehouse) return;
    setPartRows((prev) =>
      prev.map((row) => ({ ...row, warehouse }))
    );
    setNewPart((prev) => ({ ...prev, warehouse }));
  }, [warehouse]);

  // --- Auto-fill handlers ---

  const applyVinToForm = (vin: VINNo) => {
    setSelectedVin(vin);
    setLicensePlate(vin.plate_number || "");
    setCurrentOdometer(vin.current_odometer || 0);
    setWarrantyStatus(vin.warranty_status || "");
    setWarrantySummary(null);
    if (vin.current_customer) {
      setCustomer(vin.current_customer);
      setSelectedCustomer({
        name: vin.current_customer,
        customer_name: vin.customer_name || vin.current_customer,
      });
    }
  };

  const handleVinSelect = async (vinName: string) => {
    setVehicleVin(vinName);
    setSelectedServicePackage("");
    setWarrantySummary(null);
    if (!vinName) {
      setSelectedVin(null);
      setWarrantyStatus("");
      return;
    }

    const fromList = vins?.find((v) => v.name === vinName);
    if (fromList) {
      applyVinToForm(fromList);
    }

    try {
      const full = await vehiclesSvc.getVehicle(vinName);
      applyVinToForm({
        name: full.name,
        vin_number: full.vin_number,
        plate_number: full.plate_number,
        model: full.model,
        model_name: full.model_name,
        current_customer: full.current_customer,
        customer_name: full.customer_name,
        current_odometer: full.current_odometer,
        warranty_status: full.warranty_status,
        linked_item: full.linked_item,
        model_year: full.model_year,
        warranty_end_date: full.warranty_end_date,
      });
      setWarrantyStatus(full.warranty_status || "");
      setWarrantySummary(full.warranty_summary || null);
    } catch {
      if (!fromList) {
        toast.error("Could not load vehicle details for the selected VIN");
      }
    }
  };

  const handleCustomerChange = (customerId: string) => {
    const next = resolveCustomerFieldChange(customerId, customers, dmsCustomerDefaults);
    setCustomer(next.customer);
    setSelectedCustomer(next.meta);
    // Never clear VIN — user may override owner for this visit
  };

  const handleCustomerCreated = (name: string, label?: string) => {
    setCustomer(name);
    setSelectedCustomer({
      name,
      customer_name: label || name,
    });
  };

  const customerSelectOptions = useMemo(
    () => buildCustomerSelectOptions(customers, customer, selectedCustomer),
    [customers, customer, selectedCustomer]
  );

  const vinSelectOptions = useMemo(() => {
    const mapped =
      vins?.map((v) => ({
        value: v.name,
        label: v.vin_number,
        description: [v.model_name, v.plate_number, v.customer_name]
          .filter(Boolean)
          .join(" · "),
      })) || [];

    if (
      vehicleVin &&
      selectedVin &&
      !mapped.some((o) => o.value === vehicleVin)
    ) {
      return [
        {
          value: selectedVin.name,
          label: selectedVin.vin_number,
          description: [selectedVin.model_name, selectedVin.plate_number]
            .filter(Boolean)
            .join(" · "),
        },
        ...mapped,
      ];
    }
    return mapped;
  }, [vins, vehicleVin, selectedVin]);

  const handleBaySelect = async (bayName: string) => {
    setAssignedBay(bayName);
    if (!bayName) {
      setWorkshop("");
      return;
    }
    try {
      const detail = await fetchServiceBayDetail(bayName);
      const workshopName = detail?.workshop || detail?.branch;
      if (workshopName) {
        setWorkshop(workshopName);
      }
      if (detail?.warehouse) {
        setWarehouse(detail.warehouse);
      }
    } catch { /* ignore */ }
  };

  const handleServiceItemSelect = async (itemName: string) => {
    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    if (!rate && itemName) {
      try {
        rate = await fetchLabourRate(itemName);
      } catch { /* ignore */ }
    }
    const estMinutes = parseFloat(item?.custom_estimated_timemin || "0") || 0;
    const estHours = estMinutes > 0 ? Math.round((estMinutes / 60) * 10) / 10 : 0;
    setNewLabour((prev) => ({
      ...prev,
      vehicle_service_item: itemName,
      vehicle_service_item_name: item?.service_item || item?.custom_item_name || itemName,
      estimated_hours: estHours || prev.estimated_hours,
      rate_per_hour: rate || prev.rate_per_hour,
    }));
  };

  const handleSparePartSelect = async (partName: string) => {
    const part = spareParts?.find((p) => p.name === partName);
    if (!partName) {
      setNewPart((prev) => ({
        ...prev,
        item_code: "",
        item_name: "",
        unit_price: 0,
      }));
      return;
    }

    let unitPrice = 0;
    try {
      unitPrice = await fetchSparePartPrice(partName);
    } catch (err) {
      console.error("[DMS] fetchSparePartPrice failed", { sparePart: partName, err });
      toast.error(
        err instanceof Error ? err.message : "Could not load spare part unit price"
      );
    }

    setNewPart((prev) => ({
      ...prev,
      item_code: partName,
      item_name: part?.item_name || partName,
      unit_price: unitPrice,
    }));
  };

  // --- Child table add/remove ---

  const addJobItem = () => {
    if (!newJobItem.complaint_description) {
      toast.error("Please enter a complaint description");
      return;
    }
    setJobItems((prev) => [...prev, { ...newJobItem }]);
    setNewJobItem({
      complaint_description: "",
      symptom_category: DEFAULT_SYMPTOM_CATEGORY,
      severity: DEFAULT_COMPLAINT_SEVERITY,
      labor_operation: "",
    });
  };

  const removeJobItem = (idx: number) => {
    setJobItems((prev) => prev.filter((_, i) => i !== idx));
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
      technician: "",
      technician_name: "",
      estimated_hours: 0,
      rate_per_hour: 0,
      complaint: "",
    });
  };

  const removeLabourRow = (idx: number) => {
    setLabourRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateLabourRow = (idx: number, patch: Partial<LabourRow>) => {
    setLabourRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const addPartRow = () => {
    if (!newPart.item_code) {
      toast.error("Please select a spare part");
      return;
    }
    setPartRows((prev) => [
      ...prev,
      { ...newPart, warehouse: newPart.warehouse || warehouse || undefined },
    ]);
    setNewPart({
      item_code: "",
      item_name: "",
      quantity_requested: 1,
      unit_price: 0,
      warehouse: warehouse || undefined,
    });
  };

  const removePartRow = (idx: number) => {
    setPartRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const updatePartRow = (idx: number, patch: Partial<PartRow>) => {
    setPartRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const populateFromServicePackage = useCallback(
    async (packageName: string) => {
      setIsLoadingPackageLines(true);
      try {
        const lines = await fetchServicePackageLines(packageName);
        const leadTechName =
          technicians?.find((t) => t.name === leadTechnician)?.full_name ||
          leadTechnician ||
          "";

        setLabourRows(
          lines.labour.map((row) => ({
            vehicle_service_item: row.vehicle_service_item,
            vehicle_service_item_name:
              row.service_name || row.vehicle_service_item,
            technician: leadTechnician || "",
            technician_name: leadTechName,
            estimated_hours: row.estimated_hours,
            rate_per_hour: row.rate_per_hour,
            complaint: row.notes || "",
          }))
        );

        setPartRows(
          lines.parts.map((row) => ({
            item_code: row.item_code,
            item_name: row.item_name || row.item_code,
            quantity_requested: row.quantity_requested,
            unit_price: row.unit_price,
            warehouse: warehouse || undefined,
          }))
        );

        const pkgLabel = lines.package_name || packageName;
        toast.success(
          `Loaded "${pkgLabel}": ${lines.labour.length} labour, ${lines.parts.length} parts`
        );

        const packageHours = lines.labour.reduce(
          (sum, r) => sum + (r.estimated_hours || 0),
          0
        );
        if (packageHours > 0) {
          setEstimatedDurationHours(Math.round(packageHours * 10) / 10);
        }
      } catch (err) {
        lastAppliedPackageRef.current = null;
        toast.error(
          err instanceof Error ? err.message : "Could not load service package"
        );
      } finally {
        setIsLoadingPackageLines(false);
      }
    },
    [leadTechnician, technicians, warehouse]
  );

  useEffect(() => {
    const fromUrl = viewParams.get("inspection") || "";
    if (fromUrl && fromUrl !== inspectionId) {
      setInspectionId(fromUrl);
    }
    const appointmentFromUrl = viewParams.get("appointment") || "";
    if (appointmentFromUrl && appointmentFromUrl !== appointmentId) {
      setAppointmentId(appointmentFromUrl);
    }
  }, [viewParams, inspectionId, appointmentId]);

  const populateFromInspection = useCallback(async (inspectionName: string) => {
    setIsLoadingInspectionComplaints(true);
    try {
      const insp = await getInspection(inspectionName);

      if (insp.company) {
        setCompany(insp.company);
        const companyMatch = companies?.find((c) => c.name === insp.company);
        if (companyMatch?.default_currency) {
          setCurrency(companyMatch.default_currency);
        }
      }

      if (insp.service_advisor) {
        setServiceAdvisor(insp.service_advisor);
      }

      if (insp.appointment) {
        setAppointmentId(insp.appointment);
      }

      if (insp.customer) {
        setCustomer(insp.customer);
        setSelectedCustomer({
          name: insp.customer,
          customer_name: insp.customer_name || insp.customer,
        });
      }

      if (insp.vin_chassis) {
        setVehicleVin(insp.vin_chassis);
        try {
          const full = await vehiclesSvc.getVehicle(insp.vin_chassis);
          applyVinToForm({
            name: full.name,
            vin_number: full.vin_number,
            plate_number: full.plate_number,
            model: full.model,
            model_name: full.model_name,
            current_customer: full.current_customer,
            customer_name: full.customer_name,
            current_odometer: full.current_odometer,
            warranty_status: full.warranty_status,
            linked_item: full.linked_item,
            model_year: full.model_year,
            warranty_end_date: full.warranty_end_date,
          });
          setWarrantyStatus(full.warranty_status || "");
          setWarrantySummary(full.warranty_summary || null);
        } catch {
          toast.error("Could not load vehicle details from the inspection");
        }
      }

      if (insp.license_plate) {
        setLicensePlate(insp.license_plate);
      }
      if (insp.odometer != null) {
        setCurrentOdometer(insp.odometer);
      }

      const complaints = insp.customer_complaints || [];
      const rows: JobItemRow[] = complaints
        .map((row) => {
          const text = htmlToPlainText(
            row.customer_exact_words || row.complaint || ""
          );
          return {
            complaint_description: text,
            symptom_category:
              row.symptom_category || row.category || DEFAULT_SYMPTOM_CATEGORY,
            severity: row.severity || DEFAULT_COMPLAINT_SEVERITY,
            labor_operation: "",
          };
        })
        .filter((row) => row.complaint_description);

      if (rows.length) {
        setJobItems(rows);
        setCustomerComplaintSummary(
          rows.map((r) => r.complaint_description).join("\n\n")
        );
      } else {
        setJobItems([]);
        setCustomerComplaintSummary("");
        toast.info("This inspection has no customer complaint rows");
      }

      const advisorNotes = htmlToPlainText(insp.service_advisor_notes || "");
      if (advisorNotes) {
        setServiceAdvisorNotes(advisorNotes);
      }

      const internal = htmlToPlainText(insp.internal_notes || "");
      if (internal) {
        setInternalNotes(internal);
      }
    } catch (err) {
      lastAppliedInspectionRef.current = null;
      toast.error(
        err instanceof Error
          ? err.message
          : "Could not load complaints from inspection"
      );
    } finally {
      setIsLoadingInspectionComplaints(false);
    }
  }, [companies]);

  useEffect(() => {
    if (!inspectionId) {
      lastAppliedInspectionRef.current = null;
      return;
    }
    if (lastAppliedInspectionRef.current === inspectionId) {
      return;
    }
    lastAppliedInspectionRef.current = inspectionId;
    void populateFromInspection(inspectionId);
  }, [inspectionId, populateFromInspection]);

  useEffect(() => {
    if (!vehicleVin || !selectedServicePackage) {
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
  }, [vehicleVin, selectedServicePackage, populateFromServicePackage]);

  const inspectionSelectOptions = useMemo(() => {
    let list = inspectionsData?.data || [];
    if (vehicleVin) {
      const forVin = list.filter((i) => i.customer_vehicle === vehicleVin);
      if (forVin.length) list = forVin;
    }
    return list.map((insp) => ({
      value: insp.name!,
      label: insp.name!,
      description: [insp.customer_vehicle || insp.vin_chassis, insp.customer]
        .filter(Boolean)
        .join(" · "),
    }));
  }, [inspectionsData, vehicleVin]);

  const servicePackageOptions = useMemo(
    () =>
      servicePackagesForVin?.packages?.map((p) => ({
        value: p.name,
        label: p.package_name,
        description: [
          p.interval_km ? `${p.interval_km.toLocaleString()} km` : null,
          p.interval_months ? `${p.interval_months} mo` : null,
          p.total_labor_hours ? `${p.total_labor_hours}h labour` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      })) || [],
    [servicePackagesForVin]
  );

  // --- Totals (include current row being edited) ---

  const labourRowsTotal = labourRows.reduce(
    (sum, r) => sum + r.estimated_hours * r.rate_per_hour,
    0
  );
  const currentLabourAmount = newLabour.estimated_hours * newLabour.rate_per_hour;
  const labourTotal = labourRowsTotal + currentLabourAmount;

  const partsRowsTotal = partRows.reduce(
    (sum, r) => sum + r.quantity_requested * r.unit_price,
    0
  );
  const currentPartAmount = newPart.quantity_requested * newPart.unit_price;
  const partsTotal = partsRowsTotal + currentPartAmount;

  const totalAmount = labourTotal + partsTotal;

  const labourDiscountValue = parseDiscountValue(labourDiscountMode, labourDiscountInput);
  const partsDiscountValue = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const labourDiscountTotal = groupDiscountAmount(
    labourTotal,
    labourDiscountMode,
    labourDiscountValue
  );
  const partsDiscountTotal = groupDiscountAmount(
    partsTotal,
    partsDiscountMode,
    partsDiscountValue
  );
  const combinedDiscountTotal = labourDiscountTotal + partsDiscountTotal;

  const netAmount = (() => {
    if (warrantyApplicationType === "All Invoice") return 0;
    if (warrantyApplicationType === "Spare Part") return labourTotal;
    if (warrantyApplicationType === "Labour") return partsTotal;
    if (warrantyApplicationType === "Discount") {
      return Math.max(totalAmount - combinedDiscountTotal, 0);
    }
    return totalAmount;
  })();

  // --- Submit ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobCardType) {
      toast.error("Please select a job card type");
      return;
    }
    if (!customer) {
      toast.error("Please select a customer");
      return;
    }
    if (!vehicleVin) {
      toast.error("Please select a vehicle VIN");
      return;
    }
    if (jobCardType !== "Internal" && !inspectionId) {
      toast.error("Please select a vehicle inspection");
      return;
    }
    if (jobCardType === "Internal") {
      if (!serviceAdvisor) {
        toast.error("Service advisor is required for internal job cards");
        return;
      }
      if (!leadTechnician) {
        toast.error("Lead technician is required to start repair");
        return;
      }
    }
    if (jobItems.length === 0) {
      toast.error("Please add at least one job item");
      return;
    }

    if (warrantyApplicationType === "Discount") {
      if (combinedDiscountTotal < 1) {
        toast.error("Set a labour and/or parts discount (total at least 1)");
        return;
      }
      if (
        labourDiscountMode === "amount" &&
        labourDiscountValue > labourTotal &&
        labourTotal > 0
      ) {
        toast.error("Labour discount cannot exceed labour total");
        return;
      }
      if (
        partsDiscountMode === "amount" &&
        partsDiscountValue > partsTotal &&
        partsTotal > 0
      ) {
        toast.error("Parts discount cannot exceed parts total");
        return;
      }
      if (labourDiscountMode === "percentage" && labourDiscountValue > 100) {
        toast.error("Labour discount percentage cannot exceed 100");
        return;
      }
      if (partsDiscountMode === "percentage" && partsDiscountValue > 100) {
        toast.error("Parts discount percentage cannot exceed 100");
        return;
      }
    }

    const labourDiscountPayload = buildGroupDiscountPayload(
      labourDiscountMode,
      labourDiscountInput
    );
    const partsDiscountPayload = buildGroupDiscountPayload(
      partsDiscountMode,
      partsDiscountInput
    );

    const payload: Partial<DMSJobCard> & {
      labour_discount?: { type: string; value: number };
      parts_discount?: { type: string; value: number };
    } = {
      job_card_type: jobCardType as JobCardType,
      priority: priority as Priority,
      estimated_duration_hours: estimatedDurationHours || undefined,
      promised_delivery_date_time: promisedDelivery || undefined,
      customer,
      vehicle_vin: vehicleVin,
      license_plate: licensePlate || undefined,
      current_odometer: currentOdometer || undefined,
      warranty_status: warrantyStatus || undefined,
      service_advisor: serviceAdvisor || undefined,
      lead_technician: leadTechnician || undefined,
      assigned_bay: assignedBay || undefined,
      workshop: workshop || undefined,
      warehouse: warehouse || undefined,
      company: company || undefined,
      currency: currency || "ETB",
      warranty_application_type: (warrantyApplicationType && warrantyApplicationType !== "none") ? warrantyApplicationType : undefined,
      ...(warrantyApplicationType === "Discount"
        ? {
            labour_discount: labourDiscountPayload,
            parts_discount: partsDiscountPayload,
          }
        : {}),
      customer_complaint_summary: customerComplaintSummary || undefined,
      service_advisor_notes: serviceAdvisorNotes || undefined,
      internal_notes: internalNotes || undefined,
      appointment: appointmentId || undefined,
      inspection: inspectionId || undefined,
      job_items: jobItems.map((ji) => ({
        name: "",
        complaint_description: ji.complaint_description,
        symptom_category: ji.symptom_category || undefined,
        severity: ji.severity || undefined,
        labor_operation: ji.labor_operation || undefined,
      })),
      labour: labourRows.map((lr) => ({
        vehicle_service_item: lr.vehicle_service_item,
        technician: lr.technician || undefined,
        estimated_hours: lr.estimated_hours,
        rate_per_hour: lr.rate_per_hour,
        complaint: lr.complaint || undefined,
      })),
      parts: partRows.map((pr) => ({
        item_code: pr.item_code,
        quantity_requested: pr.quantity_requested,
        unit_price: pr.unit_price,
        warehouse: pr.warehouse || warehouse || undefined,
      })),
    } as Partial<DMSJobCard>;

    try {
      const result = await createJobCard(payload);
      if (jobCardType === "Internal") {
        toast.success(
          result.status === "Repair In Progress"
            ? "Internal job card created — repair in progress"
            : "Internal job card created"
        );
      } else {
        toast.success("Job card created successfully");
      }
      navigate("job-card-detail", { id: result.name });
    } catch {
      toast.error("Failed to create job card");
    }
  };

  return (
    <>
      <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("job-cards")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Job Card</h1>
          <p className="text-muted-foreground mt-1">
            Create a new workshop job card
          </p>
        </div>
      </div>

      <form
        id="new-job-card-form"
        onSubmit={handleSubmit}
        className="dms-form-page min-w-0 space-y-4 sm:space-y-6"
      >
        {/* 1. Service Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="job_card_type">Job Card Type *</Label>
                <Select value={jobCardType} onValueChange={setJobCardType}>
                  <SelectTrigger id="job_card_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCardTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {jobCardType === "Internal" && (
                  <p className="text-xs text-muted-foreground">
                    Company / fleet vehicle — no estimate or approval. Assign service advisor and lead
                    technician; repair starts automatically when you save.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_duration_hours">
                  Estimated Duration (hours)
                </Label>
                <Input
                  id="estimated_duration_hours"
                  type="number"
                  step="0.5"
                  min={0}
                  placeholder="0"
                  value={estimatedDurationHours || ""}
                  onChange={(e) =>
                    setEstimatedDurationHours(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promised_delivery">
                  Promised Delivery Date/Time (optional)
                </Label>
                <Input
                  id="promised_delivery"
                  type="datetime-local"
                  value={promisedDelivery}
                  onChange={(e) => setPromisedDelivery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_application_type">
                  Warranty Application Type
                </Label>
                <Select
                  value={warrantyApplicationType}
                  onValueChange={handleWarrantyApplicationChange}
                >
                  <SelectTrigger id="warranty_application_type">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="All Invoice">All Invoice</SelectItem>
                    <SelectItem value="Labour">Labour</SelectItem>
                    <SelectItem value="Spare Part">Spare Part</SelectItem>
                    <SelectItem value="Discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* 2. Customer & Vehicle */}
        <Card ref={customerVehicleSectionRef}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Customer & Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Vehicle (VIN) *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("vehicle-new")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Register new vehicle
                  </Button>
                </div>
                <SearchableSelect
                  options={vinSelectOptions}
                  value={vehicleVin}
                  onValueChange={handleVinSelect}
                  onSearchChange={setVinSearch}
                  placeholder="Type at least 3 characters of VIN, chassis, or plate..."
                  isLoading={vinsLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Search and select the vehicle first. The registered owner fills in as customer when
                  available; you can change or create a customer without clearing the VIN.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Customer *</Label>
                <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                  <SearchableSelect
                    options={customerSelectOptions}
                    value={customer}
                    valueLabel={selectedCustomer?.customer_name}
                    onValueChange={handleCustomerChange}
                    onSearchChange={setCustomerSearch}
                    placeholder="Search customers..."
                    isLoading={customersLoading}
                  />
                </LinkWithCreate>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_plate">License plate</Label>
                <Input
                  id="license_plate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="Editable — confirm or update for this visit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_odometer">Current Odometer (km)</Label>
                <Input
                  id="current_odometer"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={currentOdometer || ""}
                  onChange={(e) =>
                    setCurrentOdometer(parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            {warrantySummary && (
              <WarrantyStatusBanner summary={warrantySummary} />
            )}

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Vehicle Inspection{jobCardType === "Internal" ? " (optional)" : " *"}
                </Label>
                <SearchableSelect
                  options={inspectionSelectOptions}
                  value={inspectionId}
                  onValueChange={setInspectionId}
                  placeholder={
                    isLoadingInspectionComplaints
                      ? "Loading complaints…"
                      : jobCardType === "Internal"
                        ? "Optional — link an inspection if available"
                        : "Search inspections..."
                  }
                  isLoading={isLoadingInspectionComplaints}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Advisor</Label>
                <LinkWithCreate doctype="Service Advisor" onCreated={setServiceAdvisor}>
                  <SearchableSelect
                    options={
                      serviceAdvisors?.map((sa) => ({
                        value: sa.name,
                        label: sa.full_name,
                      })) || []
                    }
                    value={serviceAdvisor}
                    onValueChange={setServiceAdvisor}
                    placeholder="Search advisors..."
                    isLoading={advisorsLoading}
                  />
                </LinkWithCreate>
              </div>

              <div className="space-y-2">
                <Label>Lead Technician</Label>
                <LinkWithCreate doctype="Technician" onCreated={setLeadTechnician}>
                  <SearchableSelect
                    options={
                      technicians?.map((t) => ({
                        value: t.name,
                        label: t.full_name,
                      })) || []
                    }
                    value={leadTechnician}
                    onValueChange={setLeadTechnician}
                    placeholder="Search technicians..."
                    isLoading={techniciansLoading}
                  />
                </LinkWithCreate>
              </div>

              <div className="space-y-2">
                <Label>Assigned Bay (optional)</Label>
                <SearchableSelect
                  options={
                    serviceBays?.map((b) => ({
                      value: b.name,
                      label: b.bay_name || b.bay_number || b.name,
                      description: b.branch || undefined,
                    })) || []
                  }
                  value={assignedBay}
                  onValueChange={handleBaySelect}
                  placeholder="Search bays..."
                  isLoading={baysLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Workshop</Label>
                <Input
                  value={workshop}
                  readOnly
                  placeholder="Auto-filled from service bay"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <SearchableSelect
                  value={company}
                  onValueChange={(val) => {
                    setCompany(val);
                    setWarehouse("");
                    setWarehouseSearch("");
                    const match = companies?.find((c) => c.name === val);
                    if (match?.default_currency) {
                      setCurrency(match.default_currency);
                    }
                  }}
                  onSearchChange={setCompanySearch}
                  placeholder="Select company..."
                  isLoading={companiesLoading}
                  options={(companies || []).map((c) => ({
                    value: c.name,
                    label: c.company_name || c.name,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {(currencies?.length ? currencies : ["ETB"]).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Used for job costing and when creating a sales invoice from this job card.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Warehouse</Label>
                <SearchableSelect
                  options={
                    warehouses?.map((w: { name: string; warehouse_name?: string }) => ({
                      value: w.name,
                      label: w.warehouse_name || w.name,
                    })) || []
                  }
                  value={warehouse}
                  onValueChange={setWarehouse}
                  onSearchChange={setWarehouseSearch}
                  placeholder={company ? "Search warehouses..." : "Select company first"}
                  isLoading={warehousesLoading}
                  disabled={!company}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Customer Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Complaints</CardTitle>
            <CardDescription>
              Filled from the selected inspection; you can edit before saving
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter customer complaint summary..."
              rows={4}
              value={customerComplaintSummary}
              onChange={(e) => setCustomerComplaintSummary(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* 5. Job Items (Complaint / Cause / Correction) */}
        <Card>
          <CardHeader>
            <CardTitle>Job Items</CardTitle>
            <CardDescription>
              Customer complaints from the inspection (same fields as Job Card Items)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobItems.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full min-w-[32rem] text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Complaint Description</th>
                      <th className="text-left p-3">Symptom Category</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobItems.map((ji, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">{ji.complaint_description}</td>
                        <td className="p-3">{ji.symptom_category || "—"}</td>
                        <td className="p-3">{ji.severity || "—"}</td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeJobItem(idx)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-2">
              <div className="space-y-1 sm:col-span-5">
                <Label className="text-xs">Complaint Description *</Label>
                <Input
                  placeholder="Customer complaint / work description"
                  value={newJobItem.complaint_description}
                  onChange={(e) =>
                    setNewJobItem((prev) => ({
                      ...prev,
                      complaint_description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Symptom Category</Label>
                <Select
                  value={newJobItem.symptom_category || DEFAULT_SYMPTOM_CATEGORY}
                  onValueChange={(val) =>
                    setNewJobItem((prev) => ({
                      ...prev,
                      symptom_category: val,
                    }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {SYMPTOM_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Severity</Label>
                <Select
                  value={newJobItem.severity || DEFAULT_COMPLAINT_SEVERITY}
                  onValueChange={(val) =>
                    setNewJobItem((prev) => ({
                      ...prev,
                      severity: val,
                    }))
                  }
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_SEVERITY_OPTIONS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="button" onClick={addJobItem} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Service package (model from VIN) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Service Package
            </CardTitle>
            <CardDescription>
              {vehicleVin
                ? servicePackagesForVin?.vehicle_model_label
                  ? `Packages for ${servicePackagesForVin.vehicle_model_label}. Choosing a package fills labour and parts below.`
                  : servicePackagesForVin?.message ||
                    "Select a VIN with a linked vehicle model to see packages."
                : "Select a vehicle (VIN) first — the model is taken from the vehicle record."}
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
                  !vehicleVin
                    ? "Select VIN first"
                    : servicePackagesLoading || isLoadingPackageLines
                      ? "Loading…"
                      : servicePackageOptions.length
                        ? "Select service package…"
                        : "No packages for this model"
                }
                disabled={
                  !vehicleVin ||
                  servicePackageOptions.length === 0 ||
                  isLoadingPackageLines
                }
                isLoading={servicePackagesLoading || isLoadingPackageLines}
              />
            </div>
            {vehicleVin &&
              !servicePackagesLoading &&
              servicePackageOptions.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Set Model on the vehicle (VIN No), then link packages under Vehicle
                  Service Package → Applicable Vehicle Models.
                </p>
              )}
          </CardContent>
        </Card>

        {/* 6. Labour Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Labour Lines
            </CardTitle>
            <CardDescription>
              Filled from the service package above, or add lines manually
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {labourRows.length > 0 && (
              <EditableLabourLinesTable
                rows={labourRows}
                showTechnician
                onUpdateRow={updateLabourRow}
                onRemoveRow={removeLabourRow}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-2">
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Service Item *</Label>
                <SearchableSelect
                  options={
                    serviceItems?.map((si) => ({
                      value: si.name,
                      label: si.service_item || si.name,
                      description: si.custom_rate ? `Rate: ${si.custom_rate}` : undefined,
                    })) || []
                  }
                  value={newLabour.vehicle_service_item}
                  onValueChange={handleServiceItemSelect}
                  onSearchChange={setServiceItemSearch}
                  placeholder="Search items..."
                  isLoading={serviceItemsLoading}
                />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs">Technician</Label>
                <LinkWithCreate
                  doctype="Technician"
                  onCreated={(name, label) => {
                    setNewLabour((prev) => ({
                      ...prev,
                      technician: name,
                      technician_name: label || name,
                    }));
                  }}
                >
                  <SearchableSelect
                    options={
                      technicians?.map((t) => ({
                        value: t.name,
                        label: t.full_name,
                      })) || []
                    }
                    value={newLabour.technician}
                    onValueChange={(val) => {
                      const tech = technicians?.find((t) => t.name === val);
                      setNewLabour((prev) => ({
                        ...prev,
                        technician: val,
                        technician_name: tech?.full_name || val,
                      }));
                    }}
                    placeholder="Search technicians..."
                    isLoading={techniciansLoading}
                  />
                </LinkWithCreate>
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
                <Button
                  type="button"
                  onClick={addLabourRow}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Parts Required</CardTitle>
            <CardDescription>Add spare parts needed for this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partRows.length > 0 && (
              <EditablePartsLinesTable
                rows={partRows}
                quantityField="quantity_requested"
                onUpdateRow={updatePartRow}
                onRemoveRow={removePartRow}
              />
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-2">
              <div className="space-y-1 sm:col-span-5">
                <Label className="text-xs">Spare Part *</Label>
                <SearchableSelect
                  options={
                    spareParts?.map((sp) => ({
                      value: sp.name,
                      label: sp.item_name || sp.name,
                      description: sp.oem_part_number || sp.part_category || undefined,
                    })) || []
                  }
                  value={newPart.item_code}
                  onValueChange={handleSparePartSelect}
                  onSearchChange={setSparePartSearch}
                  placeholder="Search parts..."
                  isLoading={sparePartsLoading}
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
                        quantity_requested: parseInt(e.target.value) || 1,
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
          </CardContent>
        </Card>

        {/* 8. Totals */}
        <Card>
          <CardContent className="p-4 space-y-4">
            {warrantyApplicationType === "Discount" && (
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
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Labour Total:</span>
                <span className="font-medium w-32 text-right">
                  {labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Parts Total:</span>
                <span className="font-medium w-32 text-right">
                  {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Separator className="w-64" />
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium w-32 text-right">
                  {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {warrantyApplicationType && warrantyApplicationType !== "none" && (
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground text-sm">
                    Warranty ({warrantyApplicationType}):
                  </span>
                  <span className="font-medium w-32 text-right text-orange-600">
                    -{(totalAmount - netAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {warrantyApplicationType === "Discount" && labourDiscountTotal > 0 && (
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground text-sm">Labour discount:</span>
                  <span className="font-medium w-32 text-right text-orange-600">
                    -{labourDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {warrantyApplicationType === "Discount" && partsDiscountTotal > 0 && (
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground text-sm">Parts discount:</span>
                  <span className="font-medium w-32 text-right text-orange-600">
                    -{partsDiscountTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <Separator className="w-64" />
              <div className="flex items-center gap-8">
                <span className="font-semibold">Net Amount:</span>
                <span className="font-bold text-lg w-32 text-right text-primary">
                  {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 9. Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service_advisor_notes">
                Service Advisor Notes
              </Label>
              <Textarea
                id="service_advisor_notes"
                placeholder="Notes from the service advisor..."
                rows={3}
                value={serviceAdvisorNotes}
                onChange={(e) => setServiceAdvisorNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                placeholder="Internal workshop notes..."
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </form>
      </div>

      <FormActionsBar>
        <Button type="button" variant="outline" onClick={() => navigate("job-cards")}>
          Cancel
        </Button>
        <Button type="submit" form="new-job-card-form" disabled={isMutating}>
          {isMutating ? "Creating..." : "Create Job Card"}
        </Button>
      </FormActionsBar>
    </>
  );
}
