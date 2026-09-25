'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LinkWithCreate } from '@/components/link-with-create';
import { SearchableSelect } from '@/components/searchable-select';
import {
  useColors,
  useCustomers,
  useVehicleItems,
  useVehicleModels,
} from '@/hooks/use-dms';
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from '@/lib/customer-default';
import { htmlToPlainText } from '@/lib/plain-text';
import * as commonSvc from '@/services/common';
import * as mastersSvc from '@/services/masters';
import * as vehiclesSvc from '@/services/vehicles';
import type { VINNoFull } from '@/types/dms';

const VEHICLE_STATUSES = [
  'In Stock',
  'Allocated',
  'Delivered to Customer',
  'In Service',
  'In Transit',
  'Total Loss',
  'Scrapped',
] as const;

const WARRANTY_STATUSES = [
  'Inactive',
  'Active',
  'Expired by Time',
  'Expired by Mileage',
  'Void',
  'Pending Verification',
] as const;

const FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'PHEV', 'EV', 'CNG', 'LPG'] as const;

const TRANSMISSIONS = [
  'Manual (MT)',
  'Automatic (AT)',
  'CVT',
  'DCT',
  'AMT',
  'EV Single Speed',
] as const;

const DRIVE_TYPES = ['FWD', 'RWD', 'AWD', '4WD'] as const;

const ODOMETER_UNITS = ['km', 'miles'] as const;

const INTERIOR_MATERIALS = [
  'Fabric',
  'Leather',
  'Vinyl',
  'Synthetic Leather',
  'Alcantara',
] as const;

const IMPORT_TYPES = [
  'CBU (Completely Built Up)',
  'SKD (Semi Knocked Down)',
  'CKD (Completely Knocked Down)',
  'Local Assembly',
  'Used Import',
] as const;

/** Keep a legacy stored value selectable even when it is not in the list. */
function withCurrent<T extends string>(list: readonly T[], current?: string | null): string[] {
  const out: string[] = [...list];
  const value = (current || '').trim();
  if (value && !out.includes(value)) out.push(value);
  return out;
}

export interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VINNoFull | null;
  onUpdated?: (name: string) => void;
}

type VehicleForm = {
  company: string;
  linked_item: string;
  model: string;
  plate_number: string;
  engine_number: string;
  engine_code: string;
  current_customer: string;
  vehicle_status: string;
  current_odometer: string;
  odometer_unit: string;
  brand: string;
  model_variant: string;
  model_year: string;
  production_date: string;
  fuel_type: string;
  transmission: string;
  drive_type: string;
  interior_material: string;
  exterior_color: string;
  interior_color: string;
  warranty_status: string;
  warranty_start_date: string;
  warranty_end_date: string;
  warranty_km_limit: string;
  import_type: string;
  registration_date: string;
  registration_country: string;
  insurance_company: string;
  insurance_policy_number: string;
  insurance_expiry_date: string;
  is_fleet_vehicle: boolean;
  fleet_company: string;
  fleet_reference: string;
  special_notes: string;
  internal_notes: string;
};

const EMPTY_FORM: VehicleForm = {
  company: '',
  linked_item: '',
  model: '',
  plate_number: '',
  engine_number: '',
  engine_code: '',
  current_customer: '',
  vehicle_status: 'In Stock',
  current_odometer: '',
  odometer_unit: 'km',
  brand: '',
  model_variant: '',
  model_year: '',
  production_date: '',
  fuel_type: '',
  transmission: '',
  drive_type: '',
  interior_material: '',
  exterior_color: '',
  interior_color: '',
  warranty_status: 'Inactive',
  warranty_start_date: '',
  warranty_end_date: '',
  warranty_km_limit: '',
  import_type: '',
  registration_date: '',
  registration_country: '',
  insurance_company: '',
  insurance_policy_number: '',
  insurance_expiry_date: '',
  is_fleet_vehicle: false,
  fleet_company: '',
  fleet_reference: '',
  special_notes: '',
  internal_notes: '',
};

function text(value: unknown): string {
  return value == null ? '' : String(value);
}


export function EditVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onUpdated,
}: EditVehicleDialogProps) {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicle');
  /** Odometer-rollback warning awaiting the user's "save anyway". */
  const [rollbackPrompt, setRollbackPrompt] = useState<string | null>(null);

  const [customerSearch, setCustomerSearch] = useState('');
  const [fleetSearch, setFleetSearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [exteriorColorSearch, setExteriorColorSearch] = useState('');
  const [interiorColorSearch, setInteriorColorSearch] = useState('');
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);

  const { data: customers } = useCustomers(customerSearch);
  const { data: fleetCustomers } = useCustomers(fleetSearch);
  const { data: vehicleItems, isLoading: itemsLoading } = useVehicleItems(itemSearch);
  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);
  const { data: exteriorColors, isLoading: exteriorColorsLoading } = useColors(
    exteriorColorSearch
  );
  const { data: interiorColors, isLoading: interiorColorsLoading } = useColors(
    interiorColorSearch
  );
  const { data: masterOptions } = useSWR(
    open ? 'masters-options' : null,
    mastersSvc.getMastersOptions
  );

  // Companies selected in DMS Settings — the only companies a vehicle may be
  // moved to (plus the one it already belongs to).
  const { data: dmsCompanies } = useSWR(open ? 'dms-companies' : null, () =>
    commonSvc.fetchCompanies()
  );

  // The vehicle Item backs the vehicle's Serial No. It can be changed while that
  // serial has no transactions; changing it replaces the serial.
  const hasLinkedSerial = Boolean((vehicle?.linked_serial || '').trim());
  const serialInUse = Boolean(vehicle?.serial_in_use);

  useEffect(() => {
    if (!open || !vehicle) return;
    setForm({
      ...EMPTY_FORM,
      company: text(vehicle.company),
      linked_item: text(vehicle.linked_item),
      model: text(vehicle.model),
      plate_number: text(vehicle.plate_number),
      engine_number: text(vehicle.engine_number),
      engine_code: text(vehicle.engine_code),
      current_customer: text(vehicle.current_customer),
      vehicle_status: text(vehicle.vehicle_status) || 'In Stock',
      current_odometer: text(vehicle.current_odometer),
      odometer_unit: text(vehicle.odometer_unit) || 'km',
      brand: text(vehicle.brand),
      model_variant: text(vehicle.model_variant),
      model_year: text(vehicle.model_year),
      production_date: text(vehicle.production_date),
      fuel_type: text(vehicle.fuel_type),
      transmission: text(vehicle.transmission),
      drive_type: text(vehicle.drive_type),
      interior_material: text(vehicle.interior_material),
      exterior_color: text(vehicle.exterior_color),
      interior_color: text(vehicle.interior_color),
      warranty_status: text(vehicle.warranty_status) || 'Inactive',
      warranty_start_date: text(vehicle.warranty_start_date),
      warranty_end_date: text(vehicle.warranty_end_date),
      warranty_km_limit: text(vehicle.warranty_km_limit),
      import_type: text(vehicle.import_type),
      registration_date: text(vehicle.registration_date),
      registration_country: text(vehicle.registration_country),
      insurance_company: text(vehicle.insurance_company),
      insurance_policy_number: text(vehicle.insurance_policy_number),
      insurance_expiry_date: text(vehicle.insurance_expiry_date),
      is_fleet_vehicle: Boolean(vehicle.is_fleet_vehicle),
      fleet_company: text(vehicle.fleet_company),
      fleet_reference: text(vehicle.fleet_reference),
      special_notes: htmlToPlainText(text(vehicle.special_notes)),
      internal_notes: htmlToPlainText(text(vehicle.internal_notes)),
    });
    setActiveTab('vehicle');
    setCustomerSearch('');
    setFleetSearch('');
    setItemSearch('');
    setModelSearch('');
    setExteriorColorSearch('');
    setInteriorColorSearch('');
  }, [open, vehicle]);

  function update<K extends keyof VehicleForm>(field: K, value: VehicleForm[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }


  const companyOptions = useMemo(() => {
    const out: string[] = [];
    const existing = (vehicle?.company || '').trim();
    if (existing) out.push(existing);
    for (const company of dmsCompanies || []) {
      if (company.name && !out.includes(company.name)) out.push(company.name);
    }
    return out;
  }, [vehicle?.company, dmsCompanies]);

  const itemOptions = useMemo(
    () =>
      (vehicleItems || []).map((item) => ({
        value: item.name,
        label: item.item_name || item.name,
        description: item.item_code,
      })),
    [vehicleItems]
  );

  const modelOptions = useMemo(
    () =>
      (vehicleModels || []).map((vm) => ({
        value: vm.name,
        label: vm.model_code || vm.name,
        description: [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
      })),
    [vehicleModels]
  );

  const brandOptions = useMemo(
    () =>
      (masterOptions?.brands || []).map((b) => ({
        value: b.name,
        label: b.brand || b.name,
      })),
    [masterOptions?.brands]
  );

  const customerOptions = useMemo(
    () =>
      buildCustomerSelectOptions(customers, form.current_customer, {
        name: form.current_customer,
        customer_name: vehicle?.customer_name || form.current_customer,
      }),
    [customers, form.current_customer, vehicle?.customer_name]
  );

  const fleetOptions = useMemo(
    () =>
      buildCustomerSelectOptions(fleetCustomers, form.fleet_company, {
        name: form.fleet_company,
        customer_name: form.fleet_company,
      }),
    [fleetCustomers, form.fleet_company]
  );

  const colorOptions = (rows: { name: string; label?: string }[] | undefined) =>
    (rows || []).map((c) => ({ value: c.name, label: c.label || c.name }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle?.name) return;

    // A lower reading needs the user's OK before we touch the vehicle.
    const rollback = localOdometerRollbackMessage();
    if (rollback) {
      setRollbackPrompt(rollback);
      return;
    }

    await saveVehicle(false);
  }

  /** Local mirror of the server's check, so we can ask before sending. */
  function localOdometerRollbackMessage(): string | null {
    if (form.current_odometer === '') return null;
    const previous = Number(vehicle?.current_odometer || 0);
    const next = Number(form.current_odometer);
    if (previous > 0 && Number.isFinite(next) && next > 0 && next < previous) {
      return `Odometer rollback detected! Previous: ${previous} km, New: ${next} km.`;
    }
    return null;
  }

  async function saveVehicle(confirmRollback: boolean) {
    if (!vehicle?.name) return;

    const payload: Record<string, unknown> = {
      company: form.company || null,
      model: form.model || null,
      plate_number: form.plate_number.trim() || null,
      engine_number: form.engine_number.trim() || null,
      engine_code: form.engine_code.trim() || null,
      current_customer: form.current_customer || null,
      vehicle_status: form.vehicle_status || null,
      current_odometer: form.current_odometer !== '' ? Number(form.current_odometer) : null,
      odometer_unit: form.odometer_unit || 'km',
      brand: form.brand || null,
      model_variant: form.model_variant.trim() || null,
      model_year: form.model_year !== '' ? Number(form.model_year) : null,
      production_date: form.production_date || null,
      fuel_type: form.fuel_type || null,
      transmission: form.transmission || null,
      drive_type: form.drive_type || null,
      interior_material: form.interior_material || null,
      exterior_color: form.exterior_color || null,
      interior_color: form.interior_color || null,
      warranty_status: form.warranty_status || null,
      warranty_start_date: form.warranty_start_date || null,
      warranty_end_date: form.warranty_end_date || null,
      warranty_km_limit: form.warranty_km_limit !== '' ? Number(form.warranty_km_limit) : null,
      import_type: form.import_type || null,
      registration_date: form.registration_date || null,
      registration_country: form.registration_country.trim() || null,
      insurance_company: form.insurance_company.trim() || null,
      insurance_policy_number: form.insurance_policy_number.trim() || null,
      insurance_expiry_date: form.insurance_expiry_date || null,
      is_fleet_vehicle: form.is_fleet_vehicle ? 1 : 0,
      fleet_company: form.is_fleet_vehicle ? form.fleet_company || null : null,
      fleet_reference: form.is_fleet_vehicle ? form.fleet_reference.trim() || null : null,
      special_notes: form.special_notes.trim() || null,
      internal_notes: form.internal_notes.trim() || null,
    };

    // Changing the item replaces the vehicle's Serial No. The backend refuses once
    // that serial has transactions (the field is locked then).
    payload.linked_item = form.linked_item || null;
    if (confirmRollback) payload.confirm_odometer_rollback = 1;

    setSaving(true);
    try {
      await vehiclesSvc.updateVehicle(vehicle.name, payload);
      await mutate(
        (key) =>
          (Array.isArray(key) && (key[0] === 'vehicles' || key[0] === 'vehicle')) ||
          key === 'vehicles',
        undefined,
        { revalidate: true }
      );
      toast.success('Vehicle updated');
      onUpdated?.(vehicle.name);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      // The server still flags a rollback (e.g. the stored reading differs from the
      // one we loaded) — ask the user instead of failing the save.
      if (!confirmRollback && /odometer rollback detected/i.test(message)) {
        setRollbackPrompt(message);
        return;
      }
      toast.error(message || 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit vehicle</DialogTitle>
            <DialogDescription>
              {vehicle?.vin_number
                ? `Update details for VIN ${vehicle.vin_number}`
                : 'Update vehicle master details'}
            </DialogDescription>
          </DialogHeader>

          {/* The VIN is the record name (autoname), so it is shown for reference only. */}
          {vehicle?.vin_number ? (
            <div className="space-y-1 pt-3">
              <Label>VIN / Chassis Number</Label>
              <Input value={vehicle.vin_number} readOnly disabled />
            </div>
          ) : null}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-3 py-3">
            <TabsList className="bg-muted/50 w-full justify-start">
              <TabsTrigger value="vehicle">Vehicle &amp; Customer</TabsTrigger>
              <TabsTrigger value="specs">Specifications &amp; More</TabsTrigger>
            </TabsList>

            <TabsContent value="vehicle" className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Vehicle Item</Label>
                  <SearchableSelect
                    options={itemOptions}
                    value={form.linked_item}
                    onValueChange={(v) => update('linked_item', v)}
                    onSearchChange={setItemSearch}
                    placeholder="Search vehicle item..."
                    isLoading={itemsLoading}
                    disabled={serialInUse}
                    portaled
                  />
                  <p className="text-xs text-muted-foreground">
                    {serialInUse
                      ? `Locked — Serial No ${vehicle?.linked_serial} already has transactions.`
                      : hasLinkedSerial
                        ? `Saving a different item replaces Serial No ${vehicle?.linked_serial} with one for the new item.`
                        : 'ERPNext Item this vehicle is registered as.'}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Vehicle Model</Label>
                  <SearchableSelect
                    options={modelOptions}
                    value={form.model}
                    onValueChange={(v) => update('model', v)}
                    onSearchChange={setModelSearch}
                    placeholder="Search vehicle models..."
                    isLoading={modelsLoading}
                    portaled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>License plate</Label>
                  <Input
                    value={form.plate_number}
                    onChange={(e) => update('plate_number', e.target.value.toUpperCase())}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Engine number</Label>
                  <Input
                    value={form.engine_number}
                    onChange={(e) => update('engine_number', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Engine code</Label>
                  <Input
                    value={form.engine_code}
                    onChange={(e) => update('engine_code', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Company</Label>
                  <Select value={form.company} onValueChange={(v) => update('company', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companyOptions.map((company) => (
                        <SelectItem key={company} value={company}>
                          {company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The vehicle&apos;s current company or a company selected in DMS Settings.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Customer / Owner</Label>
                  <LinkWithCreate
                    doctype="Customer"
                    onCreated={(name) => update('current_customer', name)}
                  >
                    <SearchableSelect
                      options={customerOptions}
                      value={form.current_customer}
                      onValueChange={(id) => {
                        const next = resolveCustomerFieldChange(id, customers, undefined);
                        update('current_customer', next.customer);
                      }}
                      onSearchChange={setCustomerSearch}
                      placeholder="Search customers..."
                      portaled
                    />
                  </LinkWithCreate>
                </div>
                <div className="space-y-1">
                  <Label>Vehicle status</Label>
                  <Select
                    value={form.vehicle_status}
                    onValueChange={(v) => update('vehicle_status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(VEHICLE_STATUSES, form.vehicle_status).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Odometer (current mileage)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="e.g. 12500"
                      className="flex-1"
                      value={form.current_odometer}
                      onChange={(e) => update('current_odometer', e.target.value)}
                    />
                    <Select
                      value={form.odometer_unit}
                      onValueChange={(v) => update('odometer_unit', v)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {withCurrent(ODOMETER_UNITS, form.odometer_unit).map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Odometer can only go up — a lower value is rejected.
                  </p>
                </div>
                <div className="space-y-1">
                  <Label>Warranty status</Label>
                  <Select
                    value={form.warranty_status}
                    onValueChange={(v) => update('warranty_status', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(WARRANTY_STATUSES, form.warranty_status).map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="edit-vehicle-warranty-active"
                  checked={form.warranty_status === 'Active'}
                  onCheckedChange={(v) =>
                    update('warranty_status', v === true ? 'Active' : 'Inactive')
                  }
                />
                <Label htmlFor="edit-vehicle-warranty-active" className="cursor-pointer">
                  Warranty active
                </Label>
                <span className="text-xs text-muted-foreground">
                  — quick Active / Inactive switch
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label>Warranty start date</Label>
                  <Input
                    type="date"
                    value={form.warranty_start_date}
                    onChange={(e) => update('warranty_start_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Warranty end date</Label>
                  <Input
                    type="date"
                    value={form.warranty_end_date}
                    onChange={(e) => update('warranty_end_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Warranty KM limit</Label>
                  <Input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={form.warranty_km_limit}
                    onChange={(e) => update('warranty_km_limit', e.target.value)}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specs" className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Brand</Label>
                  <SearchableSelect
                    options={brandOptions}
                    value={form.brand}
                    onValueChange={(v) => update('brand', v)}
                    placeholder="Search brands..."
                    portaled
                  />
                </div>
                <div className="space-y-1">
                  <Label>Variant / Trim</Label>
                  <Input
                    value={form.model_variant}
                    onChange={(e) => update('model_variant', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Model year</Label>
                  <Input
                    type="number"
                    placeholder="e.g. 2024"
                    value={form.model_year}
                    onChange={(e) => update('model_year', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Production date</Label>
                  <Input
                    type="date"
                    value={form.production_date}
                    onChange={(e) => update('production_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Fuel type</Label>
                  <Select value={form.fuel_type} onValueChange={(v) => update('fuel_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fuel type" />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(FUEL_TYPES, form.fuel_type).map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Transmission</Label>
                  <Select
                    value={form.transmission}
                    onValueChange={(v) => update('transmission', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select transmission" />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(TRANSMISSIONS, form.transmission).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Drive type</Label>
                  <Select
                    value={form.drive_type}
                    onValueChange={(v) => update('drive_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select drive type" />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(DRIVE_TYPES, form.drive_type).map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Interior material</Label>
                  <Select
                    value={form.interior_material}
                    onValueChange={(v) => update('interior_material', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(INTERIOR_MATERIALS, form.interior_material).map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>


              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Exterior color</Label>
                  <LinkWithCreate
                    doctype="Color"
                    onCreated={(name) => update('exterior_color', name)}
                  >
                    <SearchableSelect
                      options={colorOptions(exteriorColors)}
                      value={form.exterior_color}
                      onValueChange={(v) => update('exterior_color', v)}
                      onSearchChange={setExteriorColorSearch}
                      placeholder="Search color..."
                      isLoading={exteriorColorsLoading}
                      portaled
                    />
                  </LinkWithCreate>
                </div>
                <div className="space-y-1">
                  <Label>Interior color</Label>
                  <LinkWithCreate
                    doctype="Color"
                    onCreated={(name) => update('interior_color', name)}
                  >
                    <SearchableSelect
                      options={colorOptions(interiorColors)}
                      value={form.interior_color}
                      onValueChange={(v) => update('interior_color', v)}
                      onSearchChange={setInteriorColorSearch}
                      placeholder="Search color..."
                      isLoading={interiorColorsLoading}
                      portaled
                    />
                  </LinkWithCreate>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Import type</Label>
                  <Select
                    value={form.import_type}
                    onValueChange={(v) => update('import_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select import type" />
                    </SelectTrigger>
                    <SelectContent>
                      {withCurrent(IMPORT_TYPES, form.import_type).map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>First registration date</Label>
                  <Input
                    type="date"
                    value={form.registration_date}
                    onChange={(e) => update('registration_date', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Country of origin</Label>
                  <Input
                    value={form.registration_country}
                    onChange={(e) => update('registration_country', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Insurance company</Label>
                  <Input
                    value={form.insurance_company}
                    onChange={(e) => update('insurance_company', e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Insurance policy number</Label>
                  <Input
                    value={form.insurance_policy_number}
                    onChange={(e) => update('insurance_policy_number', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Insurance expiry date</Label>
                  <Input
                    type="date"
                    value={form.insurance_expiry_date}
                    onChange={(e) => update('insurance_expiry_date', e.target.value)}
                  />
                </div>
              </div>


              <div className="space-y-2 rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="edit-vehicle-fleet"
                    checked={form.is_fleet_vehicle}
                    onCheckedChange={(v) => update('is_fleet_vehicle', v === true)}
                  />
                  <Label htmlFor="edit-vehicle-fleet" className="cursor-pointer">
                    Fleet vehicle
                  </Label>
                </div>
                {form.is_fleet_vehicle ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>Fleet company</Label>
                      <SearchableSelect
                        options={fleetOptions}
                        value={form.fleet_company}
                        onValueChange={(v) => update('fleet_company', v)}
                        onSearchChange={setFleetSearch}
                        placeholder="Search fleet companies..."
                        portaled
                      />
                    </div>
                    <div className="space-y-1">
                      <Label>Fleet reference</Label>
                      <Input
                        value={form.fleet_reference}
                        onChange={(e) => update('fleet_reference', e.target.value)}
                      />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-1">
                <Label>Special notes</Label>
                <Textarea
                  rows={3}
                  placeholder="Any special notes about this vehicle..."
                  value={form.special_notes}
                  onChange={(e) => update('special_notes', e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label>Internal notes (dealership only)</Label>
                <Textarea
                  rows={3}
                  placeholder="Not shown to the customer..."
                  value={form.internal_notes}
                  onChange={(e) => update('internal_notes', e.target.value)}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* A lower odometer is usually a typo but can be genuine (cluster replacement) —
        warn and let the user decide instead of blocking the save. */}
    <AlertDialog
      open={rollbackPrompt !== null}
      onOpenChange={(open) => !open && setRollbackPrompt(null)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Odometer rollback detected</AlertDialogTitle>
          <AlertDialogDescription>
            {rollbackPrompt} The new reading is lower than the one stored on this vehicle. Save it
            anyway? Only do this when the reading is genuinely lower (for example an instrument
            cluster replacement).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Go back</AlertDialogCancel>
          <AlertDialogAction
            disabled={saving}
            onClick={(e) => {
              e.preventDefault();
              setRollbackPrompt(null);
              void saveVehicle(true);
            }}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}

