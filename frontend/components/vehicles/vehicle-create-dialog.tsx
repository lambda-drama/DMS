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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/searchable-select';
import { useCompanies, useCustomers, useVehicleItems, useVehicleModels } from '@/hooks/use-dms';
import { buildCustomerSelectOptions } from '@/lib/customer-default';
import * as vehiclesSvc from '@/services/vehicles';

const VEHICLE_STATUSES = ['In Stock', 'Delivered to Customer', 'In Service', 'In Transit'] as const;

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
  const [vinError, setVinError] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [itemSearch, setItemSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [form, setForm] = useState({
    company: '',
    vin_number: '',
    linked_item: '',
    model: '',
    plate_number: '',
    engine_number: '',
    current_customer: '',
    vehicle_status: 'In Stock',
  });

  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: vehicleItems, isLoading: itemsLoading } = useVehicleItems(itemSearch);
  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);
  const { data: customers } = useCustomers(customerSearch);

  useEffect(() => {
    if (!open) return;
    setForm({
      company: defaultCompany || '',
      vin_number: (defaultVin || '').toUpperCase(),
      linked_item: '',
      model: '',
      plate_number: '',
      engine_number: '',
      current_customer: defaultCustomer || '',
      vehicle_status: defaultCustomer ? 'Delivered to Customer' : 'In Stock',
    });
    setCustomerLabel(defaultCustomerLabel || '');
    setVinError('');
    setCompanySearch('');
    setItemSearch('');
    setModelSearch('');
    setCustomerSearch('');
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

  const update = (field: keyof typeof form, value: string) =>
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
        warranty_status: 'Active',
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Register new vehicle</DialogTitle>
            <DialogDescription>
              Creates the vehicle and selects it here — you stay on this screen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <Label>VIN Number *</Label>
              <Input
                value={form.vin_number}
                onChange={(e) => {
                  setVinError('');
                  update('vin_number', e.target.value.toUpperCase());
                }}
                placeholder="Enter 17-character chassis / VIN number"
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

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>License plate</Label>
                <Input
                  value={form.plate_number}
                  onChange={(e) => update('plate_number', e.target.value)}
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


            <div className="space-y-1">
              <Label>Customer</Label>
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

