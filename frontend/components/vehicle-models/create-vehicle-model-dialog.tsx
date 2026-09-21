'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

export interface CreateVehicleModelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (name: string, label?: string) => void;
}

export function CreateVehicleModelDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateVehicleModelDialogProps) {
  const { mutate } = useSWRConfig();
  const { data: options } = useSWR(open ? 'masters-options' : null, mastersSvc.getMastersOptions);

  const [saving, setSaving] = useState(false);
  const [modelName, setModelName] = useState('');
  const [modelCode, setModelCode] = useState('');
  const [itemGroup, setItemGroup] = useState('');
  const [newGroupOpen, setNewGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [brand, setBrand] = useState('');
  const [variant, setVariant] = useState('');
  const [fuelType, setFuelType] = useState('Petrol');
  const [transmission, setTransmission] = useState('Automatic (AT)');
  const [driveType, setDriveType] = useState('');
  const [modelYear, setModelYear] = useState('');
  const [engineCode, setEngineCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [notes, setNotes] = useState('');

  const vehicleItemGroups = options?.vehicle_item_groups || [];

  const itemGroupOptions = useMemo(
    () => (options?.vehicle_item_groups || []).map((group) => ({ value: group, label: group })),
    [options]
  );

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

  const resetForm = useCallback(() => {
    setModelName('');
    setModelCode('');
    setItemGroup('');
    setBrand('');
    setVariant('');
    setFuelType('Petrol');
    setTransmission('Automatic (AT)');
    setDriveType('');
    setModelYear('');
    setEngineCode('');
    setIsActive(true);
    setNotes('');
  }, []);

  useEffect(() => {
    if (open) resetForm();
  }, [open, resetForm]);

  const handleCreateGroup = async () => {
    const name = newGroupName.trim();
    if (!name) {
      toast.error('Item Group name is required');
      return;
    }

    setCreatingGroup(true);
    try {
      const res = await mastersSvc.createVehicleItemGroup(name);
      await mutate('masters-options');
      setItemGroup(res.name);
      setNewGroupOpen(false);
      setNewGroupName('');
      toast.success(
        res.created
          ? `Item Group ${res.name} created with 'Is Vehicle' ticked`
          : `Item Group ${res.name} is now marked as a vehicle group`
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create item group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSubmit = async () => {
    if (!modelName.trim()) {
      toast.error('Model name is required');
      return;
    }
    if (!itemGroup) {
      toast.error('Select the vehicle item group');
      return;
    }

    setSaving(true);
    try {
      const res = await mastersSvc.createVehicleModel({
        model_name: modelName.trim(),
        model_code: modelCode.trim() || null,
        item_group: itemGroup,
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
      toast.success(
        `Created ${res.label || res.name} — item ${res.item_code || ''} in ${itemGroup}`
      );
      onCreated?.(res.name, res.label);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create vehicle model');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Vehicle Model</DialogTitle>
          <DialogDescription>
            Saves a Vehicle Model master and always creates its vehicle Item in the selected
            Item Group. The Model code becomes the Item code.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                Model name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. Jetour T2"
              />
            </div>
            <div className="space-y-1">
              <Label>Model code</Label>
              <Input
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                placeholder="e.g. JET-T2-2024"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>
                Item Group <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={itemGroupOptions}
                value={itemGroup}
                onValueChange={setItemGroup}
                placeholder="Select a vehicle item group…"
                emptyMessage="No vehicle item group found — use + to create one"
                isLoading={!options}
                onCreateNew={() => setNewGroupOpen(true)}
                createNewLabel="Create item group"
                portaled
              />
              <p
                className={
                  vehicleItemGroups.length
                    ? "text-xs text-muted-foreground"
                    : "text-xs text-destructive"
                }
              >
                {vehicleItemGroups.length
                  ? "The model's Item is created under this group."
                  : "No vehicle item group yet — use + to create one (it is saved with 'Is Vehicle' ticked)."}
              </p>
            </div>
            <div className="space-y-1">
              <Label>Brand</Label>
              <SearchableSelect
                options={brandOptions}
                value={brand}
                onValueChange={setBrand}
                placeholder="Search brands..."
                emptyMessage="No brands found"
                portaled
              />
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
              <Label>Variant / Trim</Label>
              <Input
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                placeholder="e.g. Premium"
              />
            </div>
            <div className="space-y-1">
              <Label>Model year</Label>
              <Input
                inputMode="numeric"
                value={modelYear}
                onChange={(e) => setModelYear(e.target.value)}
                placeholder="e.g. 2024"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Engine code</Label>
            <Input
              value={engineCode}
              onChange={(e) => setEngineCode(e.target.value)}
              placeholder="e.g. SQRF4J20"
            />
          </div>
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="vehicle_model_active"
              checked={isActive}
              onCheckedChange={(c) => setIsActive(Boolean(c))}
            />
            <Label htmlFor="vehicle_model_active" className="cursor-pointer font-normal">
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
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Vehicle Model
          </Button>
        </DialogFooter>
      </DialogContent>

      <Dialog open={newGroupOpen} onOpenChange={(next) => !creatingGroup && setNewGroupOpen(next)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>New Item Group</DialogTitle>
            <DialogDescription>
              {"Created with 'Is Vehicle' ticked, so it can be used for vehicle models."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2">
            <Label>
              Item Group name <span className="text-destructive">*</span>
            </Label>
            <Input
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Jetour"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setNewGroupOpen(false)}
              disabled={creatingGroup}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleCreateGroup()}
              disabled={creatingGroup}
            >
              {creatingGroup ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create Item Group
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
