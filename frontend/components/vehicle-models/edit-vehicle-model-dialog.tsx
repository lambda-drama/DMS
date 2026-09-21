'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/searchable-select';
import * as mastersSvc from '@/services/masters';
import type { VehicleModelMaster } from '@/services/masters';

const FALLBACK_FUEL_TYPES = ['Petrol', 'Diesel', 'Hybrid', 'PHEV', 'EV', 'CNG', 'LPG'];
const FALLBACK_TRANSMISSIONS = [
  'Manual (MT)',
  'Automatic (AT)',
  'CVT',
  'DCT',
  'AMT',
  'EV Single Speed',
];
const FALLBACK_DRIVE_TYPES = ['FWD', 'RWD', 'AWD', '4WD'];

export interface EditVehicleModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleModel: VehicleModelMaster | null;
  onUpdated?: (name: string) => void;
}

export function EditVehicleModelDialog({
  open,
  onOpenChange,
  vehicleModel,
  onUpdated,
}: EditVehicleModelDialogProps) {
  const { mutate } = useSWRConfig();
  const { data: options } = useSWR(open ? 'masters-options' : null, mastersSvc.getMastersOptions);

  const [saving, setSaving] = useState(false);
  const [docName, setDocName] = useState('');
  const [linkedItem, setLinkedItem] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [brand, setBrand] = useState('');
  const [variant, setVariant] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState('Automatic (AT)');
  const [driveType, setDriveType] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [engineCode, setEngineCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const fuelTypes = options?.vehicle_model_fuel_types?.length
    ? options.vehicle_model_fuel_types
    : FALLBACK_FUEL_TYPES;
  const transmissions = options?.vehicle_model_transmissions?.length
    ? options.vehicle_model_transmissions
    : FALLBACK_TRANSMISSIONS;
  const driveTypes = options?.vehicle_model_drive_types?.length
    ? options.vehicle_model_drive_types
    : FALLBACK_DRIVE_TYPES;

  const brandOptions = useMemo(
    () =>
      (options?.brands || []).map((b) => ({
        value: b.name,
        label: b.brand || b.name,
      })),
    [options]
  );

  useEffect(() => {
    if (!open || !vehicleModel) return;
    setDocName((vehicleModel.name || '').trim());
    setLinkedItem((vehicleModel.model || '').trim());
    setModelName(vehicleModel.model_name || '');
    setModelCode(vehicleModel.model_code || '');
    setBrand(vehicleModel.brand || '');
    setVariant(vehicleModel.variant || '');
    setFuelType(vehicleModel.fuel_type || 'Petrol');
    setTransmission(vehicleModel.transmission || 'Automatic (AT)');
    setDriveType(vehicleModel.drive_type || '');
    setModelYear(vehicleModel.model_year != null ? String(vehicleModel.model_year) : '');
    setEngineCode(vehicleModel.engine_code || '');
    setIsActive(vehicleModel.is_active == null || Number(vehicleModel.is_active) === 1);
    setNotes(vehicleModel.notes || '');
  }, [open, vehicleModel]);

  const handleSave = async () => {
    if (!docName) {
      toast.error('No vehicle model selected');
      return;
    }
    if (!modelName.trim()) {
      toast.error('Model name is required');
      return;
    }

    setSaving(true);
    try {
      await mastersSvc.updateVehicleModel(docName, {
        model_name: modelName.trim(),
        model_code: modelCode.trim() || null,
        brand: brand || null,
        variant: variant.trim() || null,
        fuel_type: fuelType || null,
        transmission: transmission || null,
        drive_type: driveType || null,
        engine_code: engineCode.trim() || null,
        model_year: modelYear.trim() || null,
        is_active: isActive ? 1 : 0,
        notes: notes.trim() || null,
      });
      await mutate(
        (key) => Array.isArray(key) && String(key[0]).includes('vehicle-model'),
        undefined,
        { revalidate: true }
      );
      toast.success(`Updated: ${modelName.trim()}`);
      onUpdated?.(docName);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update vehicle model');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Vehicle Model</DialogTitle>
          <DialogDescription>
            {linkedItem
              ? `Linked item: ${linkedItem} (the docname cannot be renamed)`
              : 'Update the vehicle model master.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                Model name <span className="text-destructive">*</span>
              </Label>
              <Input value={modelName} onChange={(e) => setModelName(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Model code</Label>
              <Input value={modelCode} onChange={(e) => setModelCode(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Brand</Label>
              <SearchableSelect
                options={brandOptions}
                value={brand}
                valueLabel={vehicleModel?.brand_label}
                onValueChange={setBrand}
                placeholder="Search brands..."
                emptyMessage="No brands found"
                portaled
              />
            </div>
            <div className="space-y-1">
              <Label>Variant / Trim</Label>
              <Input value={variant} onChange={(e) => setVariant(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Fuel type</Label>
              <Select value={fuelType} onValueChange={setFuelType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fuelTypes.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Transmission</Label>
              <Select value={transmission} onValueChange={setTransmission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {transmissions.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Drive type</Label>
              <Select value={driveType || undefined} onValueChange={setDriveType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {driveTypes.map((v) => (
                    <SelectItem key={v} value={v}>
                      {v}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Model year</Label>
              <Input
                inputMode="numeric"
                value={modelYear}
                onChange={(e) => setModelYear(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Engine code</Label>
              <Input value={engineCode} onChange={(e) => setEngineCode(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="vehicle_model_edit_active"
              checked={isActive}
              onCheckedChange={(c) => setIsActive(Boolean(c))}
            />
            <Label htmlFor="vehicle_model_edit_active" className="cursor-pointer font-normal">
              Active
            </Label>
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
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
