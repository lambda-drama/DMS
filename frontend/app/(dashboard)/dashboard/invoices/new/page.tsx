"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
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
import { FormActionsBar } from "@/components/layout/form-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, Receipt, Trash2, User, Wrench } from "lucide-react";
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
import { CreateSparePartDialog } from "@/components/create-spare-part-dialog";
import { CreateServiceItemDialog } from "@/components/create-service-item-dialog";
import {
  buildGroupDiscountPayload,
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from "@/lib/invoice-discount";
import type { VINNo } from "@/types/dms";

interface LabourRow {
  source_row?: string;
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  estimated_hours: number;
  rate_per_hour: number;
}

interface PartRow {
  source_row?: string;
  item_code: string;
  item_name: string;
  bin_location?: string;
  quantity: number;
  unit_price: number;
}

function emptyLabourRow(): LabourRow {
  return {
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
  };
}

function emptyPartRow(): PartRow {
  return {
    item_code: "",
    item_name: "",
    quantity: 1,
    unit_price: 0,
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

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export default function NewInvoicePage() {
  const { navigate, viewParams } = useNavigation();
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
  const [submitInvoice, setSubmitInvoice] = useState(true);
  const [applyTaxes, setApplyTaxes] = useState(false);

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
      vehicle_service_item_name: sl.service_name || sl.vehicle_service_item || "",
      estimated_hours: sl.actual_hours || sl.estimated_hours || 1,
      rate_per_hour: sl.rate_per_hour || 0,
    }));
    const parts: PartRow[] = (jobCard.parts || []).map((pl) => ({
      source_row: pl.name,
      item_code: pl.item_code || "",
      item_name: pl.part_name || pl.item_code || "",
      bin_location: pl.bin_location || "",
      quantity: pl.quantity_issued || pl.quantity_requested || pl.quantity || 1,
      unit_price: pl.unit_price || 0,
    }));
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
  const labourTotal = filledLabourRows.reduce(
    (sum, r) => sum + r.estimated_hours * r.rate_per_hour,
    0
  );
  const partsTotal = filledPartRows.reduce((sum, r) => sum + r.quantity * r.unit_price, 0);
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
  const labourNet = labourTotal - labourDiscountTotal;
  const partsNet = partsTotal - partsDiscountTotal;
  const subtotal = labourNet + partsNet;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jobCardId) {
      setIsMutating(true);
      try {
        await invoicesSvc.createInvoiceFromJobCard(jobCardId, {
          dueDate,
          postingDate,
          submit: submitInvoice,
          applyTaxes,
          rateOverrides: buildRateOverridesFromRows(filledLabourRows, filledPartRows),
        });
        toast.success("Invoice created successfully");
        navigate("invoices");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create invoice");
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
      toast.error("Add at least one labour or parts line");
      return;
    }
    if (filledPartRows.length > 0 && !warehouse) {
      toast.error("Select a warehouse for spare parts");
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
        submit: submitInvoice,
        labour_discount: buildGroupDiscountPayload(labourDiscountMode, labourDiscountInput),
        parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
        labour: filledLabourRows.map((r) => ({
          vehicle_service_item: r.vehicle_service_item,
          hours: r.estimated_hours,
          rate_per_hour: r.rate_per_hour,
        })),
        parts: filledPartRows.map((r) => ({
          spare_part: r.item_code,
          qty: r.quantity,
          unit_price: r.unit_price,
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
      });
      toast.success("Invoice created successfully");
      navigate("invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setIsMutating(false);
    }
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
              <div className="flex items-center gap-2">
                <Checkbox
                  id="submit_invoice"
                  checked={submitInvoice}
                  onCheckedChange={(c) => setSubmitInvoice(Boolean(c))}
                />
                <Label htmlFor="submit_invoice" className="cursor-pointer font-normal">
                  Submit invoice in ERPNext
                </Label>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="apply_taxes"
                    checked={applyTaxes}
                    onCheckedChange={(c) => setApplyTaxes(Boolean(c))}
                  />
                  <Label htmlFor="apply_taxes" className="cursor-pointer font-normal">
                    Include taxes / tax withholding
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">
                  Leave unchecked to create the invoice without taxes or tax withholding.
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
                    <Label className="text-xs">Rate/hr</Label>
                    <DecimalInput
                      min={0}
                      value={row.rate_per_hour}
                      onValueChange={(rate_per_hour) =>
                        updateLabourRow(idx, { rate_per_hour })
                      }
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
                subtotal={labourTotal}
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
            {partRows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 gap-3 rounded-lg border p-3 sm:grid-cols-12 sm:items-end sm:gap-2"
              >
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Spare part *</Label>
                  <SearchableSelect
                    options={spareParts?.map(sparePartToSelectOption) || []}
                    value={row.item_code}
                    valueLabel={row.item_name || undefined}
                    onValueChange={(val) => void handleSparePartSelect(idx, val)}
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
                    <Label className="text-xs">Qty</Label>
                    <DecimalInput
                      min={0}
                      value={row.quantity}
                      onValueChange={(quantity) =>
                        updatePartRow(idx, { quantity })
                      }
                    />
                  </div>
                  <div className="space-y-1 sm:col-span-3">
                    <Label className="text-xs">Unit price</Label>
                    <DecimalInput
                      min={0}
                      value={row.unit_price}
                      onValueChange={(unit_price) =>
                        updatePartRow(idx, { unit_price })
                      }
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
                subtotal={partsTotal}
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
              <p className="text-xs text-muted-foreground">
                Tax and grand total are calculated in ERPNext on save.
                {isStandalone &&
                  (labourDiscountTotal > 0 || partsDiscountTotal > 0) &&
                  " Labour/parts discounts reduce each line rate (and Discount Amount on the Sales Invoice)."}
              </p>
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
