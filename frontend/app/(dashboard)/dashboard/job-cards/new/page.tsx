"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { usePermissions } from "@/contexts/permissions-context";
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
  useJobCardTerms,
} from "@/hooks/use-dms";
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from "@/lib/customer-default";
import { LinkWithCreate } from "@/components/link-with-create";
import { SearchableSelect } from "@/components/searchable-select";
import { FormActionsBar } from "@/components/layout/form-actions-bar";
import {
  fetchSparePartPrice,
  fetchLabourRate,
  fetchServiceBayDetail,
  fetchVehicleServiceItemLineDefaults,
  sparePartToSelectOption,
  formatVehicleServiceItemLabel,
  vehicleServiceItemEstimatedHours,
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
import { AddLineButton } from "@/components/ui/add-line-button";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { DecimalInput } from "@/components/ui/decimal-input";
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
import { CreateSparePartDialog } from "@/components/create-spare-part-dialog";
import { CreateServiceItemDialog } from "@/components/create-service-item-dialog";
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
  bin_location?: string;
  quantity_requested: number;
  unit_price: number;
  warehouse?: string;
}

function emptyJobItem(): JobItemRow {
  return {
    complaint_description: "",
    symptom_category: DEFAULT_SYMPTOM_CATEGORY,
    severity: DEFAULT_COMPLAINT_SEVERITY,
    labor_operation: "",
  };
}

function emptyLabourRow(): LabourRow {
  return {
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    technician: "",
    technician_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
    complaint: "",
  };
}

function emptyPartRow(warehouse?: string): PartRow {
  return {
    item_code: "",
    item_name: "",
    quantity_requested: 1,
    unit_price: 0,
    warehouse: warehouse || undefined,
  };
}

export default function NewJobCardPage() {
  const { navigate, viewParams } = useNavigation();
  const { canEditPrice } = usePermissions();
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
  const [customer, setCustomer] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [selectedVin, setSelectedVin] = useState<VINNo | null>(null);
  const selectedVehicleModel =
    selectedVin?.model || selectedVin?.resolved_vehicle_model || undefined;

  // Lookup hooks
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: serviceAdvisors, isLoading: advisorsLoading } = useServiceAdvisors();
  const { data: jobCardTerms, isLoading: termsLoading } = useJobCardTerms();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();
  const { data: serviceBays, isLoading: baysLoading } = useServiceBays();
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(
    serviceItemSearch,
    selectedVehicleModel,
    vehicleVin || undefined
  );
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(
    sparePartSearch,
    undefined,
    company || undefined,
    selectedVehicleModel,
    vehicleVin || undefined
  );
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

  const [selectedServicePackage, setSelectedServicePackage] = useState("");
  const [isLoadingPackageLines, setIsLoadingPackageLines] = useState(false);
  const lastAppliedPackageRef = useRef<string | null>(null);
  
  // Create dialogs state
  const [showCreateSparePartDialog, setShowCreateSparePartDialog] = useState(false);
  const [showCreateServiceItemDialog, setShowCreateServiceItemDialog] = useState(false);
  
  /** Keeps VIN label/details when customer changes and search results no longer include this VIN */
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
  const [postingDate, setPostingDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
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
  const [terms, setTerms] = useState("");
  const [termsAndConditions, setTermsAndConditions] = useState("");

  const [appointmentId, setAppointmentId] = useState(viewParams.get("appointment") || "");
  const [inspectionId, setInspectionId] = useState(viewParams.get("inspection") || "");
  const [skipVehicleInspection, setSkipVehicleInspection] = useState(false);
  const [isLoadingInspectionComplaints, setIsLoadingInspectionComplaints] =
    useState(false);
  const lastAppliedInspectionRef = useRef<string | null>(null);

  // Inspections filtered by selected customer
  const { data: inspectionsData } = useInspections({ customer: customer || undefined });

  // VIN search is independent of customer — VIN drives customer, not the other way around
  const { data: vins, isLoading: vinsLoading } = useVINs(undefined, vinSearch);
  const { data: servicePackagesForVin, isLoading: servicePackagesLoading } =
    useServicePackagesForVin(vehicleVin || null, selectedVehicleModel);

  // Child tables (Frappe-style: always start with one empty line)
  const [jobItems, setJobItems] = useState<JobItemRow[]>([emptyJobItem()]);
  const [labourRows, setLabourRows] = useState<LabourRow[]>([emptyLabourRow()]);
  const [partRows, setPartRows] = useState<PartRow[]>([emptyPartRow()]);
  const [createLabourIdx, setCreateLabourIdx] = useState(0);
  const [createPartIdx, setCreatePartIdx] = useState(0);

  // Keep spare-part line warehouses in sync with the job card warehouse (per-line field on backend).
  useEffect(() => {
    if (!warehouse) return;
    setPartRows((prev) => prev.map((row) => ({ ...row, warehouse })));
  }, [warehouse]);

  useEffect(() => {
    if (terms) return;
    const defaultTerms = jobCardTerms?.find((row) => Boolean(row.is_default));
    if (defaultTerms?.name) {
      setTerms(defaultTerms.name);
      setTermsAndConditions(
        htmlToPlainText(defaultTerms.terms_and_conditions || "")
      );
    }
  }, [jobCardTerms, terms]);

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
        resolved_vehicle_model: full.resolved_vehicle_model,
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

  const handleServiceItemSelect = async (idx: number, itemName: string) => {
    if (!itemName) {
      setLabourRows((prev) =>
        prev.map((row, i) => (i === idx ? emptyLabourRow() : row))
      );
      return;
    }
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
        } catch { /* ignore */ }
      }
    }

    setLabourRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              vehicle_service_item: itemName,
              vehicle_service_item_name: serviceLabel,
              estimated_hours: estHours,
              rate_per_hour: rate || row.rate_per_hour,
            }
          : row
      )
    );
  };

  const handleSparePartSelect = async (idx: number, partName: string) => {
    const part = spareParts?.find((p) => p.name === partName);
    if (!partName) {
      setPartRows((prev) =>
        prev.map((row, i) =>
          i === idx
            ? {
                ...row,
                item_code: "",
                item_name: "",
                bin_location: undefined,
                unit_price: 0,
              }
            : row
        )
      );
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

    setPartRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              item_code: partName,
              item_name: part?.item_name || partName,
              bin_location: part?.bin_location,
              unit_price: unitPrice,
            }
          : row
      )
    );
  };

  // --- Child table add/remove ---

  const addJobItem = () => {
    setJobItems((prev) => [...prev, emptyJobItem()]);
  };

  const updateJobItem = (idx: number, patch: Partial<JobItemRow>) => {
    setJobItems((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const removeJobItem = (idx: number) => {
    setJobItems((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyJobItem()];
    });
  };

  const addLabourRow = () => {
    setLabourRows((prev) => [...prev, emptyLabourRow()]);
  };

  const removeLabourRow = (idx: number) => {
    setLabourRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyLabourRow()];
    });
  };

  const updateLabourRow = (idx: number, patch: Partial<LabourRow>) => {
    setLabourRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const addPartRow = () => {
    setPartRows((prev) => [...prev, emptyPartRow(warehouse)]);
  };

  const removePartRow = (idx: number) => {
    setPartRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyPartRow(warehouse)];
    });
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
        const lines = await fetchServicePackageLines(packageName, {
          vin: vehicleVin || undefined,
          vehicleModel: selectedVehicleModel,
        });
        const leadTechName =
          technicians?.find((t) => t.name === leadTechnician)?.full_name ||
          leadTechnician ||
          "";

        setLabourRows(
          lines.labour.length
            ? lines.labour.map((row) => ({
                vehicle_service_item: row.vehicle_service_item,
                vehicle_service_item_name:
                  row.service_code
                    ? `${row.service_code}: ${row.service_name || row.vehicle_service_item}`
                    : (row.service_name || row.vehicle_service_item),
                technician: leadTechnician || "",
                technician_name: leadTechName,
                estimated_hours: row.estimated_hours,
                rate_per_hour: row.rate_per_hour,
                complaint: row.notes || "",
              }))
            : [emptyLabourRow()]
        );

        setPartRows(
          lines.parts.length
            ? lines.parts.map((row) => ({
                item_code: row.item_code,
                item_name: row.item_name || row.item_code,
                bin_location: row.bin_location,
                quantity_requested: row.quantity_requested,
                unit_price: row.unit_price,
                warehouse: warehouse || undefined,
              }))
            : [emptyPartRow(warehouse)]
        );

        const pkgLabel = lines.package_name || packageName;
        toast.success(
          `Loaded "${pkgLabel}": ${lines.labour.length} labour, ${lines.parts.length} parts`
        );

        if ((lines.labour_discount_amount || 0) > 0) {
          setLabourDiscountMode("amount");
          setLabourDiscountInput(String(lines.labour_discount_amount));
        }

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
    [leadTechnician, technicians, warehouse, vehicleVin, selectedVehicleModel]
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
        setJobItems([emptyJobItem()]);
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

  // --- Totals ---

  const filledLabourRows = labourRows.filter((r) => r.vehicle_service_item);
  const filledPartRows = partRows.filter((r) => r.item_code);
  const filledJobItems = jobItems.filter((r) =>
    (r.complaint_description || "").trim()
  );

  const labourTotal = filledLabourRows.reduce(
    (sum, r) => sum + r.estimated_hours * r.rate_per_hour,
    0
  );

  const partsTotal = filledPartRows.reduce(
    (sum, r) => sum + r.quantity_requested * r.unit_price,
    0
  );

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
    if (jobCardType !== "Internal" && !skipVehicleInspection && !inspectionId) {
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
    if (filledJobItems.length === 0) {
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
      current_odometer: Number.isFinite(currentOdometer) ? currentOdometer : undefined,
      warranty_status: warrantyStatus || undefined,
      service_advisor: serviceAdvisor || undefined,
      lead_technician: leadTechnician || undefined,
      assigned_bay: assignedBay || undefined,
      workshop: workshop || undefined,
      warehouse: warehouse || undefined,
      company: company || undefined,
      currency: currency || "ETB",
      posting_date: postingDate || undefined,
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
      terms: terms || undefined,
      terms_and_conditions: termsAndConditions || undefined,
      appointment: appointmentId || undefined,
      skip_vehicle_inspection: skipVehicleInspection ? 1 : 0,
      inspection: skipVehicleInspection ? undefined : inspectionId || undefined,
      job_items: filledJobItems.map((ji) => ({
        name: "",
        complaint_description: ji.complaint_description,
        symptom_category: ji.symptom_category || undefined,
        severity: ji.severity || undefined,
        labor_operation: ji.labor_operation || undefined,
      })),
      labour: filledLabourRows.map((lr) => ({
        vehicle_service_item: lr.vehicle_service_item,
        technician: lr.technician || undefined,
        estimated_hours: lr.estimated_hours,
        rate_per_hour: lr.rate_per_hour,
        complaint: lr.complaint || undefined,
      })),
      parts: filledPartRows.map((pr) => ({
        item_code: pr.item_code,
        bin_location: pr.bin_location,
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
    <div className="dms-form-page dms-form-compact-mobile min-w-0 space-y-3 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("job-cards")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground sm:text-2xl">New Job Card</h1>
          <p className="text-muted-foreground mt-0.5 text-sm sm:mt-1">
            Create a new workshop job card
          </p>
        </div>
      </div>

      <form
        id="new-job-card-form"
        onSubmit={handleSubmit}
        className="min-w-0 space-y-3 sm:space-y-6"
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
                <Select
                  value={jobCardType}
                  onValueChange={(v) => {
                    setJobCardType(v);
                    if (v === "Internal") {
                      setSkipVehicleInspection(false);
                    }
                  }}
                >
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
                <DecimalInput
                  id="estimated_duration_hours"
                  min={0}
                  placeholder="0"
                  value={estimatedDurationHours}
                  onValueChange={setEstimatedDurationHours}
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

              <div className="space-y-2">
                <Label htmlFor="posting_date">Posting Date</Label>
                <Input
                  id="posting_date"
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  required
                />
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
              <div className="space-y-2 sm:col-span-2 md:col-span-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  {jobCardType !== "Internal" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Checkbox
                        id="skip-vehicle-inspection"
                        checked={skipVehicleInspection}
                        onCheckedChange={(c) => {
                          const skipped = c === true;
                          setSkipVehicleInspection(skipped);
                          if (skipped) {
                            setInspectionId("");
                            lastAppliedInspectionRef.current = null;
                          }
                        }}
                      />
                      <Label
                        htmlFor="skip-vehicle-inspection"
                        className="font-normal cursor-pointer whitespace-nowrap"
                      >
                        Skip vehicle inspection
                      </Label>
                    </div>
                  )}
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label>
                      Vehicle Inspection
                      {jobCardType === "Internal" || skipVehicleInspection
                        ? " (optional)"
                        : " *"}
                    </Label>
                    <SearchableSelect
                      options={inspectionSelectOptions}
                      value={inspectionId}
                      onValueChange={setInspectionId}
                      placeholder={
                        isLoadingInspectionComplaints
                          ? "Loading complaints…"
                          : skipVehicleInspection
                            ? "Skipped — optional"
                            : jobCardType === "Internal"
                              ? "Optional — link an inspection if available"
                              : "Search inspections..."
                      }
                      isLoading={isLoadingInspectionComplaints}
                      disabled={skipVehicleInspection}
                    />
                  </div>
                </div>
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
            {jobItems.map((ji, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2"
              >
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Complaint Description *</Label>
                  <Input
                    placeholder="Customer complaint / work description"
                    value={ji.complaint_description}
                    onChange={(e) =>
                      updateJobItem(idx, { complaint_description: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Symptom Category</Label>
                  <Select
                    value={ji.symptom_category || DEFAULT_SYMPTOM_CATEGORY}
                    onValueChange={(val) =>
                      updateJobItem(idx, { symptom_category: val })
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
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Severity</Label>
                  <Select
                    value={ji.severity || DEFAULT_COMPLAINT_SEVERITY}
                    onValueChange={(val) => updateJobItem(idx, { severity: val })}
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
                <div className="flex justify-end sm:col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeJobItem(idx)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <AddLineButton onClick={addJobItem} />
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
                  ? `Packages for ${servicePackagesForVin.vehicle_model_label} only. Choosing a package fills labour and parts below.`
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
            {labourRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2"
              >
                <div className="space-y-1 sm:col-span-3">
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
                    value={row.vehicle_service_item}
                    onValueChange={(val) => handleServiceItemSelect(idx, val)}
                    onSearchChange={setServiceItemSearch}
                    placeholder="Search items..."
                    isLoading={serviceItemsLoading}
                    onCreateNew={() => {
                      setCreateLabourIdx(idx);
                      setShowCreateServiceItemDialog(true);
                    }}
                    createNewLabel="New Service Item"
                  />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Technician</Label>
                  <LinkWithCreate
                    doctype="Technician"
                    onCreated={(name, label) => {
                      updateLabourRow(idx, {
                        technician: name,
                        technician_name: label || name,
                      });
                    }}
                  >
                    <SearchableSelect
                      options={
                        technicians?.map((t) => ({
                          value: t.name,
                          label: t.full_name,
                        })) || []
                      }
                      value={row.technician}
                      onValueChange={(val) => {
                        const tech = technicians?.find((t) => t.name === val);
                        updateLabourRow(idx, {
                          technician: val,
                          technician_name: tech?.full_name || val,
                        });
                      }}
                      placeholder="Search technicians..."
                      isLoading={techniciansLoading}
                    />
                  </LinkWithCreate>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Hours</Label>
                    <DecimalInput
                      min={0}
                      placeholder="0"
                      value={row.estimated_hours}
                      onValueChange={(estimated_hours) =>
                        updateLabourRow(idx, { estimated_hours })
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">{canEditPrice ? "Rate/Hr" : "Rate/Hr (fixed)"}</Label>
                    <DecimalInput
                      min={0}
                      placeholder="0"
                      value={row.rate_per_hour}
                      onValueChange={canEditPrice ? (rate_per_hour) => updateLabourRow(idx, { rate_per_hour }) : () => {}}
                      disabled={!canEditPrice}
                    />
                  </div>
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLabourRow(idx)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <AddLineButton onClick={addLabourRow} />
          </CardContent>
        </Card>

        {/* 7. Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Parts Required</CardTitle>
            <CardDescription>Add spare parts needed for this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2"
              >
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Spare Part *</Label>
                  <SearchableSelect
                    options={spareParts?.map(sparePartToSelectOption) || []}
                    value={row.item_code}
                    onValueChange={(val) => handleSparePartSelect(idx, val)}
                    onSearchChange={setSparePartSearch}
                    placeholder="Search parts..."
                    isLoading={sparePartsLoading}
                    onCreateNew={() => {
                      setCreatePartIdx(idx);
                      setShowCreateSparePartDialog(true);
                    }}
                    createNewLabel="New Spare Part"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Quantity</Label>
                    <DecimalInput
                      min={0}
                      placeholder="1"
                      value={row.quantity_requested}
                      onValueChange={(quantity_requested) =>
                        updatePartRow(idx, { quantity_requested })
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">{canEditPrice ? "Unit Price (editable)" : "Unit Price (fixed)"}</Label>
                    <DecimalInput
                      min={0}
                      placeholder="0"
                      value={row.unit_price}
                      onValueChange={canEditPrice ? (unit_price) => updatePartRow(idx, { unit_price }) : () => {}}
                      disabled={!canEditPrice}
                    />
                  </div>
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removePartRow(idx)}
                    className="h-8 w-8 text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <AddLineButton onClick={addPartRow} />
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
              <Label>Terms & Conditions</Label>
              <SearchableSelect
                options={
                  jobCardTerms?.map((row) => ({
                    value: row.name,
                    label: row.is_default ? `${row.title} (Default)` : row.title,
                    description: row.terms_and_conditions
                      ? row.terms_and_conditions.replace(/<[^>]*>/g, "").slice(0, 80) + "..."
                      : undefined,
                  })) || []
                }
                value={terms}
                onValueChange={(val) => {
                  setTerms(val);
                  const selected = jobCardTerms?.find((row) => row.name === val);
                  setTermsAndConditions(
                    htmlToPlainText(selected?.terms_and_conditions || "")
                  );
                }}
                placeholder="Select terms..."
                emptyMessage="No job card terms found"
                isLoading={termsLoading}
                valueLabel={
                  jobCardTerms?.find((row) => row.name === terms)?.title || terms
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms_and_conditions">Terms & Conditions Content</Label>
              <Textarea
                id="terms_and_conditions"
                rows={6}
                placeholder="Terms & conditions text will be shown here — edit as needed for this job"
                value={termsAndConditions}
                onChange={(e) => setTermsAndConditions(e.target.value)}
                disabled={!terms}
              />
              {terms && (
                <p className="text-xs text-muted-foreground">
                  Default text loaded from the selected terms template. Edit in your own words before saving if needed.
                </p>
              )}
            </div>
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

      <FormActionsBar>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={() => navigate("job-cards")}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="new-job-card-form"
          disabled={isMutating}
          className="min-h-11 w-full sm:w-auto"
        >
          {isMutating ? "Creating..." : "Create Job Card"}
        </Button>
      </FormActionsBar>

      {/* Create dialogs */}
      <CreateSparePartDialog
        open={showCreateSparePartDialog}
        onOpenChange={setShowCreateSparePartDialog}
        onCreated={(itemCode, itemName) => {
          updatePartRow(createPartIdx, {
            item_code: itemCode,
            item_name: itemName,
          });
          setSparePartSearch(itemCode);
          toast.success(`Spare part ${itemName} created and selected.`);
        }}
      />
      <CreateServiceItemDialog
        open={showCreateServiceItemDialog}
        onOpenChange={setShowCreateServiceItemDialog}
        onCreated={(serviceItemName) => {
          void handleServiceItemSelect(createLabourIdx, serviceItemName);
          setServiceItemSearch(serviceItemName);
          toast.success(`Service item created and selected.`);
        }}
      />
    </div>
  );
}
