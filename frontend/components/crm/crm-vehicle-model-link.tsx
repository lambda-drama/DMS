'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetchCrmVehicleModels, quickCreateVehicleModel } from '@/services/crm';
import { SearchableSelect } from '@/components/searchable-select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

type ModelMeta = { model_name?: string; variant?: string; brand?: string };

type Props = {
  value: string;
  onValueChange: (value: string, meta?: ModelMeta) => void;
  brand?: string;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
};

export function CrmVehicleModelLink({
  value,
  onValueChange,
  brand,
  valueLabel,
  placeholder,
  disabled,
  className,
  allowCreate = true,
}: Props) {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState('Automatic (AT)');
  const [variant, setVariant] = useState('');
  const { data, isLoading } = useSWR(['crm-link-models', search, brand], () =>
    fetchCrmVehicleModels(search || undefined, brand || undefined)
  );

  const options = useMemo(
    () =>
      (data || []).map((vm) => ({
        value: String(vm.name),
        label: String(vm.model_name || vm.model_code || vm.name),
        description:
          [vm.model_code, vm.variant, vm.brand_label || vm.brand].filter(Boolean).join(' · ') ||
          undefined,
        variant: String(vm.variant || ''),
        model_name: String(vm.model_name || ''),
        brand: String(vm.brand || ''),
      })),
    [data]
  );

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  const onCreated = async () => {
    if (!modelName.trim()) {
      toast.error('Model name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await quickCreateVehicleModel({
        model_name: modelName.trim(),
        brand: brand || undefined,
        model_code: modelCode.trim() || undefined,
        fuel_type: fuelType,
        transmission,
        variant: variant.trim() || undefined,
      });
      await mutate(
        (key) => Array.isArray(key) && String(key[0]).includes('model'),
        undefined,
        { revalidate: true }
      );
      setLocalLabel(res.label || res.name);
      onValueChange(res.name, {
        model_name: res.label,
        variant: variant.trim() || undefined,
        brand: brand || undefined,
      });
      setOpen(false);
      setModelName('');
      setModelCode('');
      setVariant('');
      toast.success(`Created: ${res.label || res.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create vehicle model');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <SearchableSelect
        className={className}
        options={options}
        value={value}
        valueLabel={selectedLabel}
        onValueChange={(next) => {
          const opt = options.find((o) => o.value === next);
          setLocalLabel(opt?.label || next || '');
          onValueChange(next || '', {
            model_name: opt?.model_name,
            variant: opt?.variant,
            brand: opt?.brand,
          });
        }}
        onSearchChange={setSearch}
        placeholder={
          placeholder ||
          (brand ? `Search ${brand} models…` : 'Search vehicle models…')
        }
        emptyMessage={
          brand
            ? 'No models for this brand — create one with +'
            : 'No vehicle models found'
        }
        isLoading={isLoading}
        disabled={disabled}
        onCreateNew={allowCreate && !disabled ? () => setOpen(true) : undefined}
        createNewLabel="Create vehicle model"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New vehicle model</DialogTitle>
            <DialogDescription>
              Creates the Item + Vehicle Model and selects it on this form.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Model name *</Label>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Jetour T2"
              />
            </div>
            <div className="space-y-1">
              <Label>Model code / Item code</Label>
              <Input
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                placeholder="Defaults to model name"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Fuel type</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={fuelType}
                  onChange={(e) => setFuelType(e.target.value)}
                >
                  {['Petrol', 'Diesel', 'Hybrid', 'PHEV', 'EV', 'CNG', 'LPG'].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label>Transmission</Label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={transmission}
                  onChange={(e) => setTransmission(e.target.value)}
                >
                  {[
                    'Manual (MT)',
                    'Automatic (AT)',
                    'CVT',
                    'DCT',
                    'AMT',
                    'EV Single Speed',
                  ].map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Variant</Label>
              <Input value={variant} onChange={(e) => setVariant(e.target.value)} />
            </div>
            {brand ? (
              <p className="text-xs text-muted-foreground">Brand: {brand}</p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onCreated()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
