"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { usePermissions } from "@/contexts/permissions-context";
import {
  useCompanies,
  useAutofillSingleCompany,
  useAutofillDefaultCustomer,
  useDmsCustomerDefaults,
  useCustomers,
  useJobCard,
  useSpareParts,
  useVehicleServiceItems,
  useWarehouses,
  useCurrencies,
  useVINs,
} from "@/hooks/use-dms";
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from "@/lib/customer-default";
import { LinkWithCreate } from "@/components/link-with-create";
import { SearchableSelect } from "@/components/searchable-select";
import { InvoiceTaxBreakdown } from "@/components/invoices/invoice-tax-breakdown";
import { FormActionsBar } from "@/components/layout/form-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  AlertTriangle,
  FileText,
  Loader2,
  Receipt,
  Save,
  Trash2,
  User,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import {
  fetchLabourRate,
  fetchSparePartPrice,
  fetchVehicleServiceItemLineDefaults,
  sparePartToSelectOption,
  formatVehicleServiceItemLabel,
  vehicleServiceItemEstimatedHours,
} from "@/services/common";
import * as invoicesSvc from "@/services/invoices";
import * as vehiclesSvc from "@/services/vehicles";
import * as sparePartSalesSvc from "@/services/sparePartSales";
import { GroupDiscountFields } from "@/components/group-discount-fields";
import { AddLineButton } from "@/components/ui/add-line-button";
import { LineDiscountButton } from "@/components/line-discount-button";
import { CreateSparePartDialog } from "@/components/create-spare-part-dialog";
import { CreateServiceItemDialog } from "@/components/create-service-item-dialog";
import {
  buildGroupDiscountPayload,
  discountModeFromBackend,
  groupDiscountAmount,
  lineDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from "@/lib/invoice-discount";
import type { VINNo } from "@/types/dms";

interface LabourRow {
  source_row?: string;
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  /** Name shown on the invoice line (goes to the Sales Invoice Item description). */
  display_name: string;
  estimated_hours: number;
  rate_per_hour: number;
  discount_type: '' | 'Percentage' | 'Amount';
  discount_value: number;
}

interface PartRow {
  source_row?: string;
  item_code: string;
  item_name: string;
  bin_location?: string;
  quantity: number;
  unit_price: number;
  discount_type: '' | 'Percentage' | 'Amount';
  discount_value: number;
  never_requested?: boolean;
  /**
   * Job card billable quantity — the highest quantity that may be invoiced for
   * this row. Set for rows that came from a job card.
   */
  max_quantity?: number;
}

function emptyLabourRow(): LabourRow {
  return {
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    display_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
    discount_type: "",
    discount_value: 0,
  };
}

function emptyPartRow(): PartRow {
  return {
    item_code: "",
    item_name: "",
    quantity: 1,
    unit_price: 0,
    discount_type: "",
    discount_value: 0,
  };
}

function buildRateOverridesFromRows(
  labour: LabourRow[],
  parts: PartRow[]
): invoicesSvc.RateOverrides | undefined {
  const out: invoicesSvc.RateOverrides = {};
  for (const row of labour) {
    if (row.source_row) out[row.source_row] = row.rate_per_hour;
  }
  for (const row of parts) {
    if (row.source_row) out[row.source_row] = row.unit_price;
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Per-line discounts keyed by the job card child row name. Every sourced row is
 * sent (zeros included) so clearing a discount on the invoice clears it on the
 * job card too.
 */
function buildLineDiscountsFromRows(
  labour: LabourRow[],
  parts: PartRow[]
): invoicesSvc.JobCardLineDiscountMap | undefined {
  const out: invoicesSvc.JobCardLineDiscountMap = {};
  for (const row of [...labour, ...parts]) {
    if (!row.source_row) continue;
    out[row.source_row] = {
      discount_type: row.discount_type,
      discount_value: row.discount_value,
    };
  }
  return Object.keys(out).length ? out : undefined;
}

/**
 * Parts on a job card may be billed for less than the job card quantity (or
 * dropped by removing the row). Only rows whose quantity was changed are sent.
 */
function buildQtyOverridesFromRows(parts: PartRow[]): invoicesSvc.QtyOverrides | undefined {
  const out: invoicesSvc.QtyOverrides = {};
  for (const row of parts) {
    if (!row.source_row || row.max_quantity === undefined) continue;
    if (Math.abs(row.quantity - row.max_quantity) < 0.0001) continue;
    out[row.source_row] = row.quantity;
  }
  return Object.keys(out).length ? out : undefined;
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export default function NewInvoicePage() {
  const { navigate, viewParams } = useNavigation();
  const { canEditPrice } = usePermissions();
  const jobCardId = viewParams.get("jobcard");

  const { data: jobCard } = useJobCard(jobCardId || "");
  const [isMutating, setIsMutating] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [serviceItemSearch, setServiceItemSearch] = useState("");
  const [sparePartSearch, setSparePartSearch] = useState("");
  const [vehicleModelFilter, setVehicleModelFilter] = useState("");
  const [vinSearch, setVinSearch] = useState("");

  // Create dialogs state
  const [showCreateSparePartDialog, setShowCreateSparePartDialog] = useState(false);
  const [showCreateServiceItemDialog, setShowCreateServiceItemDialog] = useState(false);
  const [createLabourIdx, setCreateLabourIdx] = useState(0);
  const [createPartIdx, setCreatePartIdx] = useState(0);

  const [customer, setCustomer] = useState("");
  const [customerMeta, setCustomerMeta] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);
  const [isDmsInvoice, setIsDmsInvoice] = useState(false);
  const [vehicleVin, setVehicleVin] = useState("");
  const [selectedVin, setSelectedVin] = useState<VINNo | null>(null);
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleBrandLabel, setVehicleBrandLabel] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [currentOdometer, setCurrentOdometer] = useState(0);
  const [currency, setCurrency] = useState("ETB");
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [remarks, setRemarks] = useState("");
  const [applyTaxes, setApplyTaxes] = useState(false);
  const [applyTaxWithholding, setApplyTaxWithholding] = useState(false);
  const [taxPreview, setTaxPreview] = useState<invoicesSvc.InvoiceTaxPreview | null>(null);
  const [taxPreviewLoading, setTaxPreviewLoading] = useState(false);

  const isStandalone = !jobCardId;
  const showVinOnCustomer = isStandalone && isDmsInvoice;
  const effectiveVin = showVinOnCustomer ? vehicleVin : jobCard?.vehicle_vin || "";
  const effectiveModelFilter = showVinOnCustomer
    ? vehicleModel || vehicleModelFilter
    : vehicleModelFilter;

  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: dmsCustomerDefaults } = useDmsCustomerDefaults();
  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const [company, setCompany] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses(
    warehouseSearch,
    company || undefined
  );
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(
    serviceItemSearch,
    effectiveModelFilter || undefined,
    effectiveVin || undefined
  );
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(
    sparePartSearch,
    undefined,
    company || undefined,
    effectiveModelFilter || undefined,
    effectiveVin || undefined
  );
  const { data: currencies } = useCurrencies();
  const { data: vins, isLoading: vinsLoading } = useVINs(
    showVinOnCustomer ? customer || undefined : undefined,
    showVinOnCustomer ? vinSearch : undefined
  );

  const [labourRows, setLabourRows] = useState<LabourRow[]>([emptyLabourRow()]);
  const [partRows, setPartRows] = useState<PartRow[]>([emptyPartRow()]);
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [labourDiscountInput, setLabourDiscountInput] = useState("");
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [partsDiscountInput, setPartsDiscountInput] = useState("");

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    company,
    (c) => setCompany(c.name),
    { search: companySearch, enabled: !jobCardId }
  );

  useAutofillDefaultCustomer(
    customer,
    (d) => {
      setCustomer(d.default_customer!);
      setCustomerMeta({
        name: d.default_customer!,
        customer_name: d.customer_name || d.default_customer!,
        mobile_no: d.mobile_no || undefined,
      });
    },
    { enabled: !jobCardId }
  );

  const applyPartsWarehouseDefault = useCallback(async (co: string) => {
    if (!co || jobCardId) return;
    try {
      const result = await sparePartSalesSvc.fetchSparePartSalesDefaults(co);
      if (result.default_warehouse) {
        setWarehouse(result.default_warehouse);
      }
    } catch {
      // Keep warehouse empty if defaults cannot be loaded
    }
  }, [jobCardId]);

  useEffect(() => {
    if (!company || jobCardId) return;
    void applyPartsWarehouseDefault(company);
  }, [company, jobCardId, applyPartsWarehouseDefault]);

  useEffect(() => {
    if (!jobCard) return;
    if (jobCard.customer) {
      setCustomer(jobCard.customer);
      setCustomerMeta({
        name: jobCard.customer,
        customer_name: jobCard.customer_name || jobCard.customer,
      });
    }
    if (jobCard.company) setCompany(jobCard.company);
    const labour: LabourRow[] = (jobCard.labour || []).map((sl) => ({
      source_row: sl.name,
      vehicle_service_item: sl.vehicle_service_item || "",
      vehicle_service_item_name: sl.custom_display_name || sl.display_name || sl.service_name || sl.vehicle_service_item || "",
      display_name: sl.custom_display_name || sl.display_name || sl.service_name || "",
      estimated_hours: sl.actual_hours || sl.estimated_hours || 1,
      rate_per_hour: sl.rate_per_hour || 0,
      discount_type: sl.discount_type || "",
      discount_value: sl.discount_value ?? 0,
    }));
    const parts: PartRow[] = (jobCard.parts || []).map((pl) => {
      // Mirror the backend billable qty: issued, else requested − returned.
      const issued = pl.quantity_issued || 0;
      const requested = pl.quantity_requested || 0;
      const returned = pl.quantity_returned || 0;
      const billable =
        issued > 0 ? issued : returned > 0 ? Math.max(requested - returned, 0) : requested;
      return {
        source_row: pl.name,
        item_code: pl.item_code || "",
        item_name: pl.part_name || pl.item_code || "",
        bin_location: pl.bin_location || "",
        quantity: billable,
        max_quantity: billable,
        unit_price: pl.unit_price || 0,
        discount_type: pl.discount_type || "",
        discount_value: pl.discount_value ?? 0,
        never_requested: Boolean(pl.never_requested),
      };
    });
    setLabourRows(labour.length ? labour : [emptyLabourRow()]);
    setPartRows(parts.length ? parts : [emptyPartRow()]);
  }, [jobCard]);

  useEffect(() => {
    if (!jobCard?.vehicle_vin) {
      setVehicleModelFilter("");
      return;
    }
    void vehiclesSvc.getVehicle(jobCard.vehicle_vin).then(
      (full) => setVehicleModelFilter(full.model || full.resolved_vehicle_model || ""),
      () => setVehicleModelFilter("")
    );
  }, [jobCard?.vehicle_vin]);

  const customerSelectOptions = useMemo(
    () => buildCustomerSelectOptions(customers, customer, customerMeta),
    [customers, customer, customerMeta]
  );

  const filledLabourRows = labourRows.filter((r) => r.vehicle_service_item);
  const filledPartRows = partRows.filter((r) => r.item_code);
  const neverRequestedPartCount = filledPartRows.filter((r) => r.never_requested).length;
  const labourTotal = filledLabourRows.reduce(
    (sum, r) => sum + r.estimated_hours * r.rate_per_hour,
    0
  );
  const partsTotal = filledPartRows.reduce((sum, r) => sum + r.quantity * r.unit_price, 0);

  // Per-line discounts come off each line before the labour/parts group discount.
  const rowLineDiscount = (
    gross: number,
    type: LabourRow["discount_type"],
    value: number
  ) => lineDiscountAmount(gross, discountModeFromBackend(type), value);
  const labourLineDiscountTotal = filledLabourRows.reduce(
    (sum, r) =>
      sum + rowLineDiscount(r.estimated_hours * r.rate_per_hour, r.discount_type, r.discount_value),
    0
  );
  const partsLineDiscountTotal = filledPartRows.reduce(
    (sum, r) =>
      sum + rowLineDiscount(r.quantity * r.unit_price, r.discount_type, r.discount_value),
    0
  );
  const labourBase = Math.max(labourTotal - labourLineDiscountTotal, 0);
  const partsBase = Math.max(partsTotal - partsLineDiscountTotal, 0);

  const labourDiscountValue = parseDiscountValue(labourDiscountMode, labourDiscountInput);
  const partsDiscountValue = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const labourDiscountTotal = groupDiscountAmount(
    labourBase,
    labourDiscountMode,
    labourDiscountValue
  );
  const partsDiscountTotal = groupDiscountAmount(
    partsBase,
    partsDiscountMode,
    partsDiscountValue
  );
  const labourNet = labourBase - labourDiscountTotal;
  const partsNet = partsBase - partsDiscountTotal;
  const subtotal = labourNet + partsNet;

  // Live VAT / tax-withholding amounts for the invoice being built. Lines are
  // already net of the group discounts, so the taxable base is this subtotal.
  useEffect(() => {
    if (!company || !customer || subtotal <= 0) {
      setTaxPreview(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setTaxPreviewLoading(true);
      invoicesSvc
        .getInvoiceTaxPreview({
          company,
          customer,
          currency,
          posting_date: postingDate,
          apply_taxes: applyTaxes,
          apply_tax_withholding: applyTaxWithholding,
          lines: [
            ...(labourNet > 0 ? [{ qty: 1, rate: labourNet, description: "Labour" }] : []),
            ...(partsNet > 0 ? [{ qty: 1, rate: partsNet, description: "Parts" }] : []),
          ],
        })
        .then((data) => {
          if (!cancelled) setTaxPreview(data);
        })
        .catch(() => {
          if (!cancelled) setTaxPreview(null);
        })
        .finally(() => {
          if (!cancelled) setTaxPreviewLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    company,
    customer,
    currency,
    postingDate,
    applyTaxes,
    applyTaxWithholding,
    labourNet,
    partsNet,
    subtotal,
  ]);

  const clearVinFields = () => {
    setVehicleVin("");
    setSelectedVin(null);
    setVehicleBrand("");
    setVehicleBrandLabel("");
    setVehicleModel("");
    setVehicleModelFilter("");
    setVinSearch("");
    setCurrentOdometer(0);
  };

  const applyVinToForm = (vin: VINNo & { brand?: string; brand_label?: string }) => {
    setSelectedVin(vin);
    setVehicleBrand(vin.brand || "");
    setVehicleBrandLabel(vin.brand_label || vin.brand || "");
    const model = vin.model || vin.resolved_vehicle_model || "";
    setVehicleModel(model);
    setVehicleModelFilter(model);
    setCurrentOdometer(vin.current_odometer || 0);
    if (vin.current_customer) {
      setCustomer(vin.current_customer);
      setCustomerMeta({
        name: vin.current_customer,
        customer_name: vin.customer_name || vin.current_customer,
      });
    }
  };

  const handleVinSelect = async (vinName: string) => {
    setVehicleVin(vinName);
    if (!vinName) {
      clearVinFields();
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
        resolved_vehicle_model_label: full.resolved_vehicle_model_label,
        current_customer: full.current_customer,
        customer_name: full.customer_name,
        current_odometer: full.current_odometer,
        brand: full.brand,
        brand_label: full.brand_label,
      });
    } catch {
      if (!fromList) {
        toast.error("Could not load vehicle details for the selected VIN");
      }
    }
  };

  const vinFromReturn = viewParams.get("vin");

  useEffect(() => {
    if (!vinFromReturn || jobCardId) return;
    setIsDmsInvoice(true);
    if (vinFromReturn === vehicleVin) return;
    void handleVinSelect(vinFromReturn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once when returning from vehicle-new
  }, [vinFromReturn, jobCardId]);

  const goToNewVehicle = () => {
    const params: Record<string, string> = { returnTo: "invoice-new" };
    const draft = vinSearch.trim();
    if (draft) params.vinDraft = draft;
    if (company) params.company = company;
    navigate("vehicle-new", params);
  };

  const handleDmsInvoiceChange = (checked: boolean) => {
    setIsDmsInvoice(checked);
    if (!checked) {
      clearVinFields();
    }
  };

  const vinSelectOptions = useMemo(() => {
    const mapped =
      vins?.map((v) => ({
        value: v.name,
        label: v.vin_number,
        description: [v.model, v.model_name, v.plate_number, v.customer_name]
          .filter(Boolean)
          .join(" · "),
      })) || [];

    if (vehicleVin && selectedVin && !mapped.some((o) => o.value === vehicleVin)) {
      mapped.unshift({
        value: vehicleVin,
        label: selectedVin.vin_number || vehicleVin,
        description: [
          selectedVin.model || selectedVin.resolved_vehicle_model,
          selectedVin.model_name,
          selectedVin.plate_number,
          selectedVin.customer_name,
        ]
          .filter(Boolean)
          .join(" · "),
      });
    }
    return mapped;
  }, [vins, vehicleVin, selectedVin]);

  const handleCustomerChange = (id: string) => {
    const next = resolveCustomerFieldChange(id, customers, dmsCustomerDefaults);
    setCustomer(next.customer);
    setCustomerMeta(next.meta);
  };

  const handleCustomerCreated = (name: string, label?: string) => {
    setCustomer(name);
    setCustomerMeta({ name, customer_name: label || name });
  };

  const handleServiceItemSelect = async (idx: number, itemName: string) => {
    if (!itemName) {
      setLabourRows((prev) =>
        prev.map((row, i) =>
          i === idx
            ? {
                ...row,
                vehicle_service_item: "",
                vehicle_service_item_name: "",
                display_name: "",
                estimated_hours: 0,
                rate_per_hour: 0,
              }
            : row
        )
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
        } catch {
          /* ignore */
        }
      }
    }

    setLabourRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              vehicle_service_item: itemName,
              vehicle_service_item_name: serviceLabel,
              display_name: serviceLabel,
              estimated_hours: estHours,
              rate_per_hour: rate || row.rate_per_hour,
            }
          : row
      )
    );
  };

  const handleSparePartSelect = async (idx: number, partName: string) => {
    if (!partName) {
      setPartRows((prev) =>
        prev.map((row, i) =>
          i === idx
            ? {
                ...row,
                item_code: "",
                item_name: "",
                bin_location: "",
                unit_price: 0,
              }
            : row
        )
      );
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let unitPrice = 0;
    try {
      unitPrice = await fetchSparePartPrice(partName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load part price");
    }
    setPartRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              item_code: partName,
              item_name: part?.item_name || partName,
              bin_location: part?.bin_location || "",
              unit_price: unitPrice,
            }
          : row
      )
    );
  };

  const addLabourRow = () => {
    setLabourRows((prev) => [...prev, emptyLabourRow()]);
  };

  const addPartRow = () => {
    setPartRows((prev) => [...prev, emptyPartRow()]);
  };

  const removeLabourRow = (idx: number) => {
    setLabourRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyLabourRow()];
    });
  };

  const removePartRow = (idx: number) => {
    setPartRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyPartRow()];
    });
  };

  /**
   * Drop a job card part from the invoice. Both requested and never-requested
   * parts may be dropped — the job card and its stock movements are untouched.
   */
  const removeJobCardPartRow = (idx: number) => {
    const remainingBillableParts = partRows.filter(
      (row, i) => i !== idx && row.item_code && row.quantity > 0
    );
    if (filledLabourRows.length === 0 && remainingBillableParts.length === 0) {
      toast.error("Keep at least one billable line on the invoice");
      return;
    }
    removePartRow(idx);
  };

  const updatePartQuantity = (idx: number, quantity: number) => {
    const max = partRows[idx]?.max_quantity;
    let next = Math.max(quantity, 0);
    if (max !== undefined && next > max) {
      next = max;
      toast.error(`Billed quantity cannot exceed the ${max} on the job card`);
    }
    updatePartRow(idx, { quantity: next });
  };

  const updateLabourRow = (idx: number, patch: Partial<LabourRow>) => {
    setLabourRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const updatePartRow = (idx: number, patch: Partial<PartRow>) => {
    setPartRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const saveInvoice = async (mode: "draft" | "create") => {
    const asDraft = mode === "draft";
    const shouldSubmit = !asDraft;

    if (jobCardId) {
      setIsMutating(true);
      try {
        const remainingSourceRows = new Set(
          filledPartRows.map((r) => r.source_row).filter(Boolean) as string[]
        );
        // Any part dropped from the form — requested or not — is excluded from
        // the invoice. The job card itself is never changed.
        const removedPartRows = (jobCard?.parts || [])
          .filter((pl) => Boolean(pl.name) && !remainingSourceRows.has(pl.name))
          .map((pl) => pl.name as string);

        await invoicesSvc.createInvoiceFromJobCard(jobCardId, {
          dueDate,
          postingDate,
          submit: shouldSubmit,
          applyTaxes,
          applyTaxWithholding,
          rateOverrides: buildRateOverridesFromRows(filledLabourRows, filledPartRows),
          excludeRows: removedPartRows.length ? removedPartRows : undefined,
          qtyOverrides: buildQtyOverridesFromRows(filledPartRows),
          lineDiscounts: buildLineDiscountsFromRows(filledLabourRows, filledPartRows),
        });
        toast.success(asDraft ? "Invoice saved as draft" : "Invoice created successfully");
        navigate("invoices");
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : asDraft
              ? "Failed to save draft invoice"
              : "Failed to create invoice"
        );
      } finally {
        setIsMutating(false);
      }
      return;
    }

    if (!customer) {
      toast.error("Select a customer");
      return;
    }
    if (!company) {
      toast.error("Select a company");
      return;
    }
    if (filledLabourRows.length === 0 && filledPartRows.length === 0) {
      toast.error(
        asDraft
          ? "Add at least one labour or parts line before saving a draft"
          : "Add at least one labour or parts line"
      );
      return;
    }
    if (filledPartRows.length > 0 && !warehouse) {
      toast.error("Select a warehouse for spare parts");
      return;
    }

    if (
      labourDiscountMode === "amount" &&
      labourDiscountValue > labourBase &&
      labourTotal > 0
    ) {
      toast.error("Labour discount cannot exceed labour total");
      return;
    }
    if (
      partsDiscountMode === "amount" &&
      partsDiscountValue > partsBase &&
      partsTotal > 0
    ) {
      toast.error("Parts discount cannot exceed parts total");
      return;
    }
    if (labourDiscountMode === "percentage" && labourDiscountValue > 100) {
      toast.error("Labour discount percentage cannot exceed 100%");
      return;
    }
    if (partsDiscountMode === "percentage" && partsDiscountValue > 100) {
      toast.error("Parts discount percentage cannot exceed 100%");
      return;
    }

    setIsMutating(true);
    try {
      await invoicesSvc.createStandaloneInvoice({
        customer,
        company,
        warehouse: warehouse || undefined,
        currency,
        posting_date: postingDate,
        due_date: dueDate,
        remarks: remarks || undefined,
        submit: shouldSubmit,
        labour_discount: buildGroupDiscountPayload(labourDiscountMode, labourDiscountInput),
        parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
        labour: filledLabourRows.map((r) => ({
          vehicle_service_item: r.vehicle_service_item,
          hours: r.estimated_hours,
          rate_per_hour: r.rate_per_hour,
          // Display name → Sales Invoice Item description.
          description: r.display_name.trim() || undefined,
          discount_type: r.discount_type,
          discount_value: r.discount_value,
        })),
        parts: filledPartRows.map((r) => ({
          spare_part: r.item_code,
          qty: r.quantity,
          unit_price: r.unit_price,
          discount_type: r.discount_type,
          discount_value: r.discount_value,
        })),
        is_dms_invoice: isDmsInvoice,
        vehicle_vin: showVinOnCustomer && vehicleVin ? vehicleVin : undefined,
        vehicle_brand: showVinOnCustomer && vehicleBrand ? vehicleBrand : undefined,
        vehicle_model: showVinOnCustomer && vehicleModel ? vehicleModel : undefined,
        current_odometer:
          showVinOnCustomer && vehicleVin && Number.isFinite(currentOdometer)
            ? currentOdometer
            : undefined,
        apply_taxes: applyTaxes,
        apply_tax_withholding: applyTaxWithholding,
      });
      toast.success(asDraft ? "Invoice saved as draft" : "Invoice created successfully");
      navigate("invoices");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : asDraft
            ? "Failed to save draft invoice"
            : "Failed to create invoice"
      );
    } finally {
      setIsMutating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveInvoice("create");
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Invoice</h1>
          <p className="mt-1 text-muted-foreground">
            {jobCardId ? "Create invoice from job card" : "Standalone aftersales invoice"}
          </p>
        </div>
      </div>

      <form
        id="new-invoice-form"
        onSubmit={handleSubmit}
        className="dms-form-page min-w-0 space-y-4 sm:space-y-6"
      >
        {jobCard && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-2 p-4 text-primary">
              <FileText className="h-5 w-5" />
              <span className="font-medium">Job Card: {jobCard.name}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {showVinOnCustomer ? (
                <>
                  <div className="space-y-2">
                    <Label>VIN</Label>
                    <SearchableSelect
                      options={vinSelectOptions}
                      value={vehicleVin}
                      onValueChange={(val) => void handleVinSelect(val)}
                      onSearchChange={setVinSearch}
                      placeholder="Search VIN, chassis, or plate (min 3 chars)..."
                      isLoading={vinsLoading}
                      onCreateNew={goToNewVehicle}
                      createNewLabel="Register new vehicle"
                    />
                    <p className="text-xs text-muted-foreground">
                      Start with VIN — or use + to register a new one. Selects customer, make, model,
                      and odometer when available.
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Make</Label>
                      <Input
                        readOnly
                        value={vehicleBrandLabel}
                        placeholder="From selected VIN"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Model</Label>
                      <Input
                        readOnly
                        value={
                          selectedVin?.model_name ||
                          selectedVin?.resolved_vehicle_model_label ||
                          vehicleModel ||
                          ""
                        }
                        placeholder="From selected VIN"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="invoice_current_odometer">Current odometer (km)</Label>
                    <Input
                      id="invoice_current_odometer"
                      type="number"
                      min={0}
                      placeholder="0"
                      value={currentOdometer || ""}
                      onChange={(e) => setCurrentOdometer(parseInt(e.target.value, 10) || 0)}
                      disabled={!vehicleVin}
                    />
                    <p className="text-xs text-muted-foreground">
                      Editable — saved to the VIN when you create the invoice.
                    </p>
                  </div>
                </>
              ) : null}
              <div className="space-y-2">
                <Label>Customer *</Label>
                <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                  <SearchableSelect
                    options={customerSelectOptions}
                    value={customer}
                    valueLabel={customerMeta?.customer_name}
                    onValueChange={handleCustomerChange}
                    onSearchChange={setCustomerSearch}
                    placeholder="Search customers..."
                    isLoading={customersLoading}
                    disabled={Boolean(jobCardId)}
                  />
                </LinkWithCreate>
                {showVinOnCustomer ? (
                  <p className="text-xs text-muted-foreground">
                    {vehicleVin &&
                    selectedVin?.current_customer &&
                    customer &&
                    selectedVin.current_customer !== customer
                      ? "Customer differs from VIN owner — on create, the previous owner goes to Customer History and this customer becomes the VIN’s current owner."
                      : "Choosing a customer filters available VINs. You can also change customer after selecting a VIN."}
                  </p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isStandalone ? (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="dms_invoice"
                      checked={isDmsInvoice}
                      onCheckedChange={(c) => handleDmsInvoiceChange(Boolean(c))}
                    />
                    <Label htmlFor="dms_invoice" className="cursor-pointer font-medium">
                      DMS invoice
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">
                    Tick to mark Missing DMS (past data catch-up) and show VIN on the customer card.
                  </p>
                </div>
              ) : null}
              <div className="space-y-2">
                <Label>Company *</Label>
                <SearchableSelect
                  options={
                    companies?.map((c) => ({
                      value: c.name,
                      label: c.company_name || c.name,
                    })) || []
                  }
                  value={company}
                  onValueChange={(val) => {
                    setCompany(val);
                    setWarehouse("");
                    setWarehouseSearch("");
                    if (val) void applyPartsWarehouseDefault(val);
                  }}
                  onSearchChange={setCompanySearch}
                  placeholder="Select company..."
                  isLoading={companiesLoading}
                  disabled={Boolean(jobCardId)}
                />
              </div>
              {!jobCardId && (
                <div className="space-y-2">
                  <Label>Currency *</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
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
                </div>
              )}
              {!jobCardId && (
                <div className="space-y-2">
                  <Label>Warehouse{filledPartRows.length > 0 ? " *" : ""}</Label>
                  <SearchableSelect
                    options={
                      warehouses?.map((w) => ({
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
                  <p className="text-xs text-muted-foreground">
                    Defaults to Parts Warehouse from DMS Settings for this company. Used for spare parts
                    (stock items); labour lines are not warehouse-specific.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posting date</Label>
                  <Input
                    type="date"
                    value={postingDate}
                    onChange={(e) => setPostingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="apply_taxes"
                    checked={applyTaxes}
                    onCheckedChange={(c) => setApplyTaxes(Boolean(c))}
                  />
                  <Label htmlFor="apply_taxes" className="cursor-pointer font-normal">
                    Include VAT
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Uses the Default Taxes and Charges Template from DMS Settings. Leave unchecked
                  to create the invoice without VAT.
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="apply_tax_withholding"
                    checked={applyTaxWithholding}
                    onCheckedChange={(c) => setApplyTaxWithholding(Boolean(c))}
                  />
                  <Label htmlFor="apply_tax_withholding" className="cursor-pointer font-normal">
                    Include tax withholding (TCS)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Applies the Default Tax Withholding Category from DMS Settings — with Use
                  Withholding Group ticked the group goes on the invoice, otherwise the category is
                  saved on the customer. ERPNext fills the Tax Withholding Entries on save.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Labour
            </CardTitle>
            <CardDescription>
              Vehicle service items — recommended rate loads from item master; edit as needed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {labourRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2"
              >
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Service item *</Label>
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
                              .join(" · ")
                          : undefined,
                      })) || []
                    }
                    value={row.vehicle_service_item}
                    valueLabel={row.vehicle_service_item_name || undefined}
                    onValueChange={(val) => void handleServiceItemSelect(idx, val)}
                    onSearchChange={setServiceItemSearch}
                    placeholder="Search labour items..."
                    isLoading={serviceItemsLoading}
                    onCreateNew={() => {
                      setCreateLabourIdx(idx);
                      setShowCreateServiceItemDialog(true);
                    }}
                    createNewLabel="New Service Item"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="space-y-1 sm:col-span-2">
                    <Label className="text-xs">Hours</Label>
                    <DecimalInput
                      min={0}
                      value={row.estimated_hours}
                      onValueChange={(estimated_hours) =>
                        updateLabourRow(idx, { estimated_hours })
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">{canEditPrice ? "Rate/hr" : "Rate/hr (fixed)"}</Label>
                    <div className="flex items-center gap-1">
                      <DecimalInput
                        min={0}
                        value={row.rate_per_hour}
                        onValueChange={canEditPrice ? (rate_per_hour) => updateLabourRow(idx, { rate_per_hour }) : () => {}}
                        disabled={!canEditPrice}
                      />
                      <LineDiscountButton
                        label={row.display_name || row.vehicle_service_item_name || "this service line"}
                        lineAmount={(row.estimated_hours || 0) * (row.rate_per_hour || 0)}
                        discountType={row.discount_type}
                        discountValue={row.discount_value}
                        disabled={!row.vehicle_service_item}
                        onApply={(discount) =>
                          updateLabourRow(idx, {
                            discount_type: discount.discount_type,
                            discount_value: discount.discount_value,
                          })
                        }
                      />
                    </div>
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
                <div className="space-y-1 sm:col-span-12">
                  <Label className="text-xs">Display name</Label>
                  <Input
                    value={row.display_name}
                    placeholder="Name shown on this invoice line"
                    disabled={!row.vehicle_service_item}
                    onChange={(e) => updateLabourRow(idx, { display_name: e.target.value })}
                  />
                </div>
              </div>
            ))}
            <AddLineButton onClick={addLabourRow} />
            {isStandalone && filledLabourRows.length > 0 && (
              <GroupDiscountFields
                label="Labour"
                mode={labourDiscountMode}
                onModeChange={(m) => {
                  setLabourDiscountMode(m);
                  if (m === "none") setLabourDiscountInput("");
                }}
                value={labourDiscountInput}
                onValueChange={setLabourDiscountInput}
                subtotal={labourBase}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parts</CardTitle>
            <CardDescription>
              Spare parts — recommended selling price from part master; edit as needed
              {warehouse ? ` · Warehouse: ${warehouse}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobCardId && neverRequestedPartCount > 0 && (
              <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-xs">
                  {neverRequestedPartCount} spare part
                  {neverRequestedPartCount === 1 ? " was" : "s were"} never requested on a
                  parts requisition. Reduce the Qty or use Remove to drop{" "}
                  {neverRequestedPartCount === 1 ? "it" : "them"} from this invoice — the job
                  card is updated too.
                </p>
              </div>
            )}
            {jobCardId && (
              <p className="text-xs text-muted-foreground">
                Reducing a Qty or removing a part line also updates the job card (its billable
                qty and totals) when the invoice is created — even after the job card is
                Completed. A removed part that was already issued is marked Returned on the
                card; return the physical part with Parts Return or a manual Stock Entry.
              </p>
            )}
            {partRows.map((row, idx) => (
              <div
                key={idx}
                className={`grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2 ${
                  row.never_requested
                    ? "border-amber-300 bg-amber-50/70 dark:border-amber-800 dark:bg-amber-950/20"
                    : ""
                }`}
              >
                <div className="space-y-1 sm:col-span-5">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Spare part *</Label>
                    {row.never_requested ? (
                      <Badge
                        variant="outline"
                        className="border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                      >
                        Not requested
                      </Badge>
                    ) : null}
                  </div>
                  <SearchableSelect
                    options={spareParts?.map(sparePartToSelectOption) || []}
                    value={row.item_code}
                    valueLabel={row.item_name || undefined}
                    onValueChange={(val) => void handleSparePartSelect(idx, val)}
                    onSearchChange={setSparePartSearch}
                    placeholder="Search parts..."
                    isLoading={sparePartsLoading}
                    disabled={Boolean(jobCardId)}
                    onCreateNew={
                      jobCardId
                        ? undefined
                        : () => {
                            setCreatePartIdx(idx);
                            setShowCreateSparePartDialog(true);
                          }
                    }
                    createNewLabel="New Spare Part"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3 sm:contents">
                  <div className="space-y-1 sm:col-span-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs">Qty</Label>
                      {jobCardId && row.item_code && row.quantity <= 0 && (
                        <Badge
                          variant="outline"
                          className="border-destructive/40 text-destructive"
                        >
                          Not billed
                        </Badge>
                      )}
                    </div>
                    <DecimalInput
                      min={0}
                      max={row.max_quantity ?? undefined}
                      value={row.quantity}
                      onValueChange={(quantity) =>
                        jobCardId ? updatePartQuantity(idx, quantity) : updatePartRow(idx, { quantity })
                      }
                      disabled={Boolean(jobCardId) && row.max_quantity === undefined}
                      title={
                        row.max_quantity !== undefined
                          ? `Bill up to ${row.max_quantity} (job card quantity)`
                          : undefined
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">{canEditPrice ? "Unit price" : "Unit price (fixed)"}</Label>
                    <div className="flex items-center gap-1">
                      <DecimalInput
                        min={0}
                        value={row.unit_price}
                        onValueChange={canEditPrice ? (unit_price) => updatePartRow(idx, { unit_price }) : () => {}}
                        disabled={!canEditPrice}
                      />
                      <LineDiscountButton
                        label={row.item_name || row.item_code || "this part"}
                        lineAmount={(row.quantity || 0) * (row.unit_price || 0)}
                        discountType={row.discount_type}
                        discountValue={row.discount_value}
                        disabled={!row.item_code}
                        onApply={(discount) =>
                          updatePartRow(idx, {
                            discount_type: discount.discount_type,
                            discount_value: discount.discount_value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end sm:col-span-2">
                  {(isStandalone || Boolean(row.source_row)) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        jobCardId ? removeJobCardPartRow(idx) : removePartRow(idx)
                      }
                      className="h-8 w-8 text-destructive"
                      title={
                        jobCardId
                          ? "Remove this part from the invoice and the job card"
                          : "Remove part"
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            {isStandalone && <AddLineButton onClick={addPartRow} />}
            {isStandalone && filledPartRows.length > 0 && (
              <GroupDiscountFields
                label="Parts"
                mode={partsDiscountMode}
                onModeChange={(m) => {
                  setPartsDiscountMode(m);
                  if (m === "none") setPartsDiscountInput("");
                }}
                value={partsDiscountInput}
                onValueChange={setPartsDiscountInput}
                subtotal={partsBase}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex justify-end p-6">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour</span>
                <span>{labourTotal.toLocaleString()}</span>
              </div>
              {isStandalone && labourDiscountTotal > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Labour discount</span>
                  <span>−{labourDiscountTotal.toLocaleString()}</span>
                </div>
              )}
              {isStandalone && labourDiscountTotal > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Labour net</span>
                  <span>{labourNet.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts</span>
                <span>{partsTotal.toLocaleString()}</span>
              </div>
              {isStandalone && partsDiscountTotal > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Parts discount</span>
                  <span>−{partsDiscountTotal.toLocaleString()}</span>
                </div>
              )}
              {isStandalone && partsDiscountTotal > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Parts net</span>
                  <span>{partsNet.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal (excl. tax)</span>
                <span>{subtotal.toLocaleString()}</span>
              </div>

              <InvoiceTaxBreakdown
                subtotal={subtotal}
                currency={currency}
                applyTaxes={applyTaxes}
                applyTaxWithholding={applyTaxWithholding}
                preview={taxPreview}
                isLoading={taxPreviewLoading}
                className="mt-2"
              />

              {isStandalone && (labourDiscountTotal > 0 || partsDiscountTotal > 0) ? (
                <p className="text-xs text-muted-foreground">
                  Labour/parts discounts reduce each line rate (and Discount Amount on the Sales
                  Invoice).
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks on the invoice"
            />
          </CardContent>
        </Card>

        <FormActionsBar>
          <Button type="button" variant="outline" onClick={() => navigate("invoices")}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={isMutating}
            onClick={() => void saveInvoice("draft")}
          >
            {isMutating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </>
            )}
          </Button>
          <Button type="submit" form="new-invoice-form" disabled={isMutating}>
            <Receipt className="mr-2 h-4 w-4" />
            {isMutating ? "Creating…" : "Create invoice"}
          </Button>
        </FormActionsBar>
      </form>

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
