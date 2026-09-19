'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/searchable-select';
import { LinkWithCreate } from '@/components/link-with-create';
import {
  useColors,
  useCompanies,
  useCustomers,
  useVehicleItems,
  useVehicleModels,
} from '@/hooks/use-dms';
import { buildCustomerSelectOptions } from '@/lib/customer-default';
import * as vehiclesSvc from '@/services/vehicles';

const VEHICLE_STATUSES = ['In Stock', 'Delivered to Customer', 'In Service', 'In Transit'] as const;
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
const WARRANTY_STATUSES = [
  'Inactive',
  'Active',
  'Expired by Time',
  'Expired by Mileage',
  'Void',
  'Pending Verification',
] as const;

type VehicleForm = {
  company: string;
  vin_number: string;
  linked_item: string;
  model: string;
  plate_number: string;
  engine_number: string;
  current_customer: string;
  vehicle_status: string;
  warranty_status: string;
  current_odometer: string;
  odometer_unit: string;
  brand: string;
  model_variant: string;
  model_year: string;
  fuel_type: string;
  transmission: string;
  drive_type: string;
  exterior_color: string;
  interior_color: string;
  special_notes: string;
};

const EMPTY_FORM: VehicleForm = {
  company: '',
  vin_number: '',
  linked_item: '',
  model: '',
  plate_number: '',
  engine_number: '',
  current_customer: '',
  vehicle_status: 'In Stock',
  warranty_status: 'Active',
  current_odometer: '',
  odometer_unit: 'km',
  brand: '',
  model_variant: '',
  model_year: '',
  fuel_type: 'Petrol',
  transmission: 'Automatic (AT)',
  drive_type: 'FWD',
  exterior_color: '',
  interior_color: '',
  special_notes: '',
};

export interface VehicleCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Prefilled from the calling form (e.g. the Job Card company). */
  defaultCompany?: string;
  /** Prefilled owner (e.g. the Job Card customer). */
  defaultCustomer?: string;
  /** Display name for `defaultCustomer` (the id alone is not enough to show a label). */
  defaultCustomerLabel?: string;
  /** Prefilled VIN — usually whatever was typed in the VIN search box. */
  defaultVin?: string;
  onCreated?: (name: string, vinNumber?: string) => void;
}

/**
 * Registers a vehicle (VIN No) without leaving the current screen — used inline
 * from the VIN field's "+" button on the Job Card (and reusable elsewhere).
 *
 * Mirrors almost all of the New Vehicle page fields, laid out two-per-row over
 * two tabs so the important fields stay on the first screen:
 *   - "Vehicle & Customer": VIN, company, item, model, plate, engine, customer,
 *     vehicle status, odometer, warranty status + Active/Inactive checkbox.
 *   - "Specifications": brand, variant, year, fuel, transmission, drive, colours
 *     and notes.
 */
export function VehicleCreateDialog({
  open,
  onOpenChange,
  defaultCompany = '',
  defaultCustomer = '',
  defaultCustomerLabel = '',
  defaultVin = '',
  onCreated,
}: VehicleCreateDialogProps) {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('vehicle');
  const [vinError, setVinError] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [exteriorColorSearch, setExteriorColorSearch] = useState('');
  const [interiorColorSearch, setInteriorColorSearch] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [form, setForm] = useState<VehicleForm>(EMPTY_FORM);

  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: vehicleItems, isLoading: itemsLoading } = useVehicleItems(itemSearch);
  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);
  const { data: customers } = useCustomers(customerSearch);
  const { data: exteriorColors, isLoading: exteriorColorsLoading } = useColors(
    exteriorColorSearch
  );
  const { data: interiorColors, isLoading: interiorColorsLoading } = useColors(
    interiorColorSearch
  );

  useEffect(() => {
    if (!open) return;
    setForm({
      ...EMPTY_FORM,
      company: defaultCompany || '',
      vin_number: (defaultVin || '').toUpperCase(),
      current_customer: defaultCustomer || '',
      vehicle_status: defaultCustomer ? 'Delivered to Customer' : 'In Stock',
    });
    setCustomerLabel(defaultCustomerLabel || '');
    setVinError('');
    setActiveTab('vehicle');
    setCompanySearch('');
    setItemSearch('');
    setModelSearch('');
    setCustomerSearch('');
    setExteriorColorSearch('');
    setInteriorColorSearch('');
  }, [open, defaultCompany, defaultCustomer, defaultCustomerLabel, defaultVin]);

  const companyOptions = useMemo(
    () =>
      (companies || []).map((c) => ({
        value: c.name,
        label: c.company_name || c.name,
      })),
    [companies]
  );

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

  const customerOptions = useMemo(
    () =>
      buildCustomerSelectOptions(
        customers,
        form.current_customer,
        form.current_customer
          ? {
              name: form.current_customer,
              customer_name: customerLabel || form.current_customer,
            }
          : null
      ),
    [customers, form.current_customer, customerLabel]
  );

  const exteriorColorOptions = useMemo(
    () =>
      (exteriorColors || []).map((c) => ({
        value: c.name,
        label: c.label || c.name,
      })),
    [exteriorColors]
  );

  const interiorColorOptions = useMemo(
    () =>
      (interiorColors || []).map((c) => ({
        value: c.name,
        label: c.label || c.name,
      })),
    [interiorColors]
  );

  const update = <K extends keyof VehicleForm>(field: K, value: VehicleForm[K]) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vin = form.vin_number.trim().toUpperCase();
    if (!vin) {
      setVinError('VIN number is required');
      toast.error('VIN number is required');
      return;
    }
    if (vin.length !== 17) {
      setVinError(`VIN must be exactly 17 characters (currently ${vin.length}).`);
      toast.error('VIN / Chassis Number must be exactly 17 characters');
      return;
    }
    if (!form.linked_item) {
      toast.error('Vehicle item is required');
      return;
    }
    if (!form.company) {
      toast.error('Company is required');
      return;
    }

    setSaving(true);
    try {
      const created = await vehiclesSvc.createVehicle({
        company: form.company,
        vin_number: vin,
        linked_item: form.linked_item,
        model: form.model || undefined,
        plate_number: form.plate_number.trim() || undefined,
        engine_number: form.engine_number.trim() || undefined,
        current_customer: form.current_customer || undefined,
        vehicle_status: form.vehicle_status || 'In Stock',
        warranty_status: form.warranty_status || 'Active',
        current_odometer: form.current_odometer
          ? parseInt(form.current_odometer, 10)
          : undefined,
        odometer_unit: form.odometer_unit || 'km',
        brand: form.brand.trim() || undefined,
        model_variant: form.model_variant.trim() || undefined,
        model_year: form.model_year ? parseInt(form.model_year, 10) : undefined,
        fuel_type: form.fuel_type || undefined,
        transmission: form.transmission || undefined,
        drive_type: form.drive_type || undefined,
        exterior_color: form.exterior_color || undefined,
        interior_color: form.interior_color || undefined,
        special_notes: form.special_notes.trim() || undefined,
      });
      await mutate((key) => Array.isArray(key) && key[0] === 'vins', undefined, {
        revalidate: true,
      });
      toast.success(`Vehicle ${created.vin_number || created.name} registered`);
      onCreated?.(created.name, created.vin_number);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not register vehicle');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Register new vehicle</DialogTitle>
            <DialogDescription>
              Creates the vehicle and selects it here — you stay on this screen.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-3">
            <TabsList className="bg-muted/50 w-full justify-start">
              <TabsTrigger value="vehicle">Vehicle &amp; Customer</TabsTrigger>
              <TabsTrigger value="specs">Specifications</TabsTrigger>
            </TabsList>

            <TabsContent value="vehicle" className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>VIN Number *</Label>
                  <Input
                    value={form.vin_number}
                    onChange={(e) => {
                      setVinError('');
                      update('vin_number', e.target.value.toUpperCase());
                    }}
                    placeholder="17-character VIN"
                    maxLength={17}
                    aria-invalid={Boolean(vinError)}
                    className={
                      vinError
                        ? 'border-destructive focus-visible:ring-destructive/30'
                        : undefined
                    }
                    autoFocus
                  />
                  <p
                    className={`text-xs ${
                      vinError ? 'text-destructive' : 'text-muted-foreground'
                    }`}
                  >
                    {vinError || `${form.vin_number.trim().length}/17 characters`}
                  </p>
                </div>

                <div className="space-y-1">
                  <Label>Company *</Label>
                  <SearchableSelect
                    options={companyOptions}
                    value={form.company}
                    onValueChange={(v) => update('company', v)}
                    onSearchChange={setCompanySearch}
                    placeholder="Select company..."
                    isLoading={companiesLoading}
                    portaled
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Vehicle Item *</Label>
                  <SearchableSelect
                    options={itemOptions}
                    value={form.linked_item}
                    onValueChange={(v) => update('linked_item', v)}
                    onSearchChange={setItemSearch}
                    placeholder="Search vehicle item..."
                    isLoading={itemsLoading}
                    portaled
                  />
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Customer</Label>
                  <LinkWithCreate
                    doctype="Customer"
                    onCreated={(name, label) => {
                      update('current_customer', name);
                      setCustomerLabel(label || name);
                    }}
                  >
                    <SearchableSelect
                      options={customerOptions}
                      value={form.current_customer}
                      valueLabel={customerLabel}
                      onValueChange={(id) => {
                        const found = customers?.find((c) => c.name === id);
                        update('current_customer', id);
                        setCustomerLabel(found?.customer_name || '');
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
                      {VEHICLE_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Current odometer</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      value={form.current_odometer}
                      onChange={(e) => update('current_odometer', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={form.odometer_unit}
                      onValueChange={(v) => update('odometer_unit', v)}
                    >
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ODOMETER_UNITS.map((u) => (
                          <SelectItem key={u} value={u}>
                            {u}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                      {WARRANTY_STATUSES.map((s) => (
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
                  id="vehicle-warranty-active"
                  checked={form.warranty_status === 'Active'}
                  onCheckedChange={(v) =>
                    update('warranty_status', v === true ? 'Active' : 'Inactive')
                  }
                />
                <Label htmlFor="vehicle-warranty-active" className="cursor-pointer">
                  Warranty active
                </Label>
                <span className="text-xs text-muted-foreground">
                  — quick Active / Inactive switch
                </span>
              </div>
            </TabsContent>

            <TabsContent value="specs" className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Brand</Label>
                  <Input
                    value={form.brand}
                    onChange={(e) => update('brand', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Model variant</Label>
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
                  <Label>Fuel type</Label>
                  <Select
                    value={form.fuel_type}
                    onValueChange={(v) => update('fuel_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FUEL_TYPES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Transmission</Label>
                  <Select
                    value={form.transmission}
                    onValueChange={(v) => update('transmission', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSMISSIONS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Drive type</Label>
                  <Select
                    value={form.drive_type}
                    onValueChange={(v) => update('drive_type', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DRIVE_TYPES.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Exterior color</Label>
                  <SearchableSelect
                    options={exteriorColorOptions}
                    value={form.exterior_color}
                    onValueChange={(v) => update('exterior_color', v)}
                    onSearchChange={setExteriorColorSearch}
                    placeholder="Search color..."
                    isLoading={exteriorColorsLoading}
                    portaled
                  />
                </div>
                <div className="space-y-1">
                  <Label>Interior color</Label>
                  <SearchableSelect
                    options={interiorColorOptions}
                    value={form.interior_color}
                    onValueChange={(v) => update('interior_color', v)}
                    onSearchChange={setInteriorColorSearch}
                    placeholder="Search color..."
                    isLoading={interiorColorsLoading}
                    portaled
                  />
                </div>
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
            </TabsContent>
          </Tabs>

          <DialogFooter>
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
              Register vehicle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

