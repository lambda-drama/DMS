"use client";

import { useMemo, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useCustomers, useVehicleItems, useVehicleModels, useColors, useCompanies, useAutofillSingleCompany, useAutofillDefaultCustomer, useDmsCustomerDefaults } from "@/hooks/use-dms";
import { buildCustomerSelectOptions, customerMetaFromDefaults, resolveCustomerFieldChange } from "@/lib/customer-default";
import * as vehiclesSvc from "@/services/vehicles";
import { SearchableSelect } from "@/components/searchable-select";
import { LinkWithCreate } from "@/components/link-with-create";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { FormActionsBar } from "@/components/layout/form-actions-bar";

const fuelTypeOptions = [
  "Petrol", "Diesel", "Hybrid", "PHEV", "EV", "CNG", "LPG",
];
const transmissionOptions = [
  "Manual (MT)", "Automatic (AT)", "CVT", "DCT", "AMT", "EV Single Speed",
];
const driveTypeOptions = ["FWD", "RWD", "AWD", "4WD"];
const vehicleStatusOptions = [
  "In Stock", "Delivered to Customer", "In Service", "In Transit",
];

export default function NewVehiclePage() {
  const { navigate, viewParams } = useNavigation();
  const { toast } = useToast();
  const returnTo = viewParams.get("returnTo");
  const returnAppointment = viewParams.get("appointment");

  const returnTarget = useMemo(() => {
    if (returnTo === "inspection-new") {
      return {
        view: "inspection-new" as const,
        label: "Back to New Inspection",
      };
    }
    return {
      view: "vehicles" as const,
      label: "Back to Vehicles",
    };
  }, [returnTo]);

  const navigateAfterVehicle = (vinDocName?: string) => {
    if (returnTarget.view === "inspection-new") {
      const params: Record<string, string> = {};
      if (returnAppointment) params.appointment = returnAppointment;
      if (vinDocName) params.vin = vinDocName;
      navigate("inspection-new", params);
      return;
    }
    navigate("vehicles");
  };
  const [saving, setSaving] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [exteriorColorSearch, setExteriorColorSearch] = useState("");
  const [interiorColorSearch, setInteriorColorSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");

  const { data: vehicleItems } = useVehicleItems(itemSearch);
  const { data: vehicleModels, isLoading: vehicleModelsLoading } = useVehicleModels(modelSearch);
  const { data: customers } = useCustomers(customerSearch);
  const { data: dmsCustomerDefaults } = useDmsCustomerDefaults();
  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: exteriorColors, isLoading: exteriorColorsLoading } = useColors(exteriorColorSearch);
  const { data: interiorColors, isLoading: interiorColorsLoading } = useColors(interiorColorSearch);

  const [customerMeta, setCustomerMeta] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);

  const [form, setForm] = useState({
    company: "",
    vin_number: "",
    engine_number: "",
    plate_number: "",
    linked_item: "",
    model: "",
    brand: "",
    model_variant: "",
    model_year: "",
    fuel_type: "Petrol",
    transmission: "Automatic (AT)",
    drive_type: "FWD",
    exterior_color: "",
    interior_color: "",
    current_customer: "",
    current_odometer: "",
    odometer_unit: "km",
    vehicle_status: "In Stock",
    special_notes: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    form.company,
    (c) => update("company", c.name),
    { search: companySearch }
  );

  useAutofillDefaultCustomer(form.current_customer, (d) => {
    update("current_customer", d.default_customer!);
    setCustomerMeta(customerMetaFromDefaults(d));
  });

  const customerSelectOptions = useMemo(
    () => buildCustomerSelectOptions(customers, form.current_customer, customerMeta),
    [customers, form.current_customer, customerMeta]
  );

  const handleCustomerChange = (id: string) => {
    const next = resolveCustomerFieldChange(id, customers, dmsCustomerDefaults);
    update("current_customer", next.customer);
    setCustomerMeta(next.meta);
  };

  async function handleSubmit() {
    if (!form.vin_number.trim()) {
      toast({ title: "VIN number is required", variant: "destructive" });
      return;
    }
    if (!form.linked_item) {
      toast({ title: "Vehicle ERP Item is required", variant: "destructive" });
      return;
    }
    if (!form.company) {
      toast({ title: "Company is required", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const result = await vehiclesSvc.createVehicle({
        company: form.company,
        vin_number: form.vin_number.trim(),
        engine_number: form.engine_number || undefined,
        plate_number: form.plate_number || undefined,
        linked_item: form.linked_item,
        model: form.model || undefined,
        brand: form.brand || undefined,
        model_variant: form.model_variant || undefined,
        model_year: form.model_year ? parseInt(form.model_year) : undefined,
        fuel_type: form.fuel_type || undefined,
        transmission: form.transmission || undefined,
        drive_type: form.drive_type || undefined,
        exterior_color: form.exterior_color || undefined,
        interior_color: form.interior_color || undefined,
        current_customer: form.current_customer || undefined,
        current_odometer: form.current_odometer ? parseInt(form.current_odometer) : undefined,
        odometer_unit: form.odometer_unit,
        vehicle_status: form.vehicle_status,
        special_notes: form.special_notes || undefined,
      });
      toast({ title: `Vehicle ${result.name} created successfully` });
      navigateAfterVehicle(result.name);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create vehicle";
      toast({ title: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dms-form-page space-y-6 max-w-4xl">
      <Button variant="ghost" size="sm" onClick={() => navigateAfterVehicle()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> {returnTarget.label}
      </Button>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Register New Vehicle</h1>
        <p className="text-muted-foreground">Create a new VIN record</p>
      </div>

      {/* Vehicle Identification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Vehicle Identification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>
                Company <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                value={form.company}
                onValueChange={(v) => update("company", v)}
                onSearchChange={setCompanySearch}
                placeholder="Search companies (from DMS Settings)..."
                isLoading={companiesLoading}
                options={(companies || []).map((c) => ({
                  value: c.name,
                  label: c.company_name || c.name,
                }))}
              />
              {companies && companies.length === 0 && !companiesLoading ? (
                <p className="text-xs text-muted-foreground">
                  No companies available. Add companies under DMS Settings → Company (table).
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>
                VIN / Chassis Number <span className="text-destructive">*</span>
              </Label>
              <Input
                placeholder="17-character VIN"
                value={form.vin_number}
                onChange={(e) => update("vin_number", e.target.value.toUpperCase())}
                maxLength={17}
              />
              {form.vin_number && form.vin_number.length !== 17 && (
                <p className="text-xs text-amber-600">
                  VIN should be 17 characters ({form.vin_number.length}/17)
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Engine Number</Label>
              <Input
                placeholder="Engine number"
                value={form.engine_number}
                onChange={(e) => update("engine_number", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>License Plate</Label>
              <Input
                placeholder="License plate number"
                value={form.plate_number}
                onChange={(e) => update("plate_number", e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Vehicle ERP Item() <span className="text-destructive">*</span>
              </Label>
              <Select
                value={form.linked_item}
                onValueChange={(v) => update("linked_item", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ERP item" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search items..."
                      value={itemSearch}
                      onChange={(e) => setItemSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>
                  {vehicleItems && vehicleItems.length > 0 ? (
                    vehicleItems.map((item) => (
                      <SelectItem key={item.name} value={item.name}>
                        {item.item_name} {item.brand ? `(${item.brand})` : ""}
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                      No vehicle items found — adjust search or add Items in ERPNext
                    </div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <SearchableSelect
                value={form.model}
                onValueChange={(v) => update("model", v)}
                onSearchChange={setModelSearch}
                placeholder="Search vehicle models..."
                isLoading={vehicleModelsLoading}
                options={(vehicleModels || []).map((vm) => ({
                  value: vm.name,
                  label: `${vm.model_name || vm.name}${vm.variant ? ` ${vm.variant}` : ""}`,
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Model & Trim Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Model Year</Label>
              <Input
                type="number"
                placeholder="e.g. 2024"
                value={form.model_year}
                onChange={(e) => update("model_year", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Variant / Trim</Label>
              <Input
                placeholder="e.g. Premium, Sport"
                value={form.model_variant}
                onChange={(e) => update("model_variant", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Exterior color</Label>
              <LinkWithCreate doctype="Color" onCreated={(name) => update("exterior_color", name)}>
                <SearchableSelect
                  options={
                    exteriorColors?.map((c) => ({
                      value: c.name,
                      label: c.label || c.name,
                    })) || []
                  }
                  value={form.exterior_color}
                  onValueChange={(v) => update("exterior_color", v)}
                  onSearchChange={setExteriorColorSearch}
                  placeholder="Search Color..."
                  isLoading={exteriorColorsLoading}
                />
              </LinkWithCreate>
            </div>
            <div className="space-y-2">
              <Label>Interior color</Label>
              <LinkWithCreate doctype="Color" onCreated={(name) => update("interior_color", name)}>
                <SearchableSelect
                  options={
                    interiorColors?.map((c) => ({
                      value: c.name,
                      label: c.label || c.name,
                    })) || []
                  }
                  value={form.interior_color}
                  onValueChange={(v) => update("interior_color", v)}
                  onSearchChange={setInteriorColorSearch}
                  placeholder="Search Color..."
                  isLoading={interiorColorsLoading}
                />
              </LinkWithCreate>
            </div>
            <div className="space-y-2">
              <Label>Fuel Type</Label>
              <Select value={form.fuel_type} onValueChange={(v) => update("fuel_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypeOptions.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transmission</Label>
              <Select value={form.transmission} onValueChange={(v) => update("transmission", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transmissionOptions.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Drive Type</Label>
              <Select value={form.drive_type} onValueChange={(v) => update("drive_type", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {driveTypeOptions.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer & Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer & Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Current Customer / Owner</Label>
              <LinkWithCreate
                doctype="Customer"
                onCreated={(name, label) => {
                  update("current_customer", name);
                  setCustomerMeta({ name, customer_name: label || name });
                }}
              >
                <SearchableSelect
                  options={customerSelectOptions}
                  value={form.current_customer}
                  valueLabel={customerMeta?.customer_name}
                  onValueChange={handleCustomerChange}
                  onSearchChange={setCustomerSearch}
                  placeholder="Search customers (optional)..."
                />
              </LinkWithCreate>
            </div>
            <div className="space-y-2">
              <Label>Vehicle Status</Label>
              <Select
                value={form.vehicle_status}
                onValueChange={(v) => update("vehicle_status", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {vehicleStatusOptions.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Current Odometer</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0"
                  value={form.current_odometer}
                  onChange={(e) => update("current_odometer", e.target.value)}
                  className="flex-1"
                />
                <Select
                  value={form.odometer_unit}
                  onValueChange={(v) => update("odometer_unit", v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">km</SelectItem>
                    <SelectItem value="miles">miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any special notes about this vehicle..."
            value={form.special_notes}
            onChange={(e) => update("special_notes", e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate("vehicles")}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Create Vehicle
        </Button>
      </FormActionsBar>
    </div>
  );
}
