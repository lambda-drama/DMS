'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { SearchableSelect } from '@/components/searchable-select';
import { useSpareParts, useVehicleModels, useVehicleServiceItems } from '@/hooks/use-dms';
import * as mastersSvc from '@/services/masters';

type SelectedModel = {
  name: string;
  label: string;
};

type LabourFormRow = {
  key: string;
  labor_operation: string;
  operation_name: string;
  standard_hours: number;
  quantity: number;
  total_hours: number;
  notes: string;
};

type PartFormRow = {
  key: string;
  part_item: string;
  part_name: string;
  quantity: number;
  unit_price: number;
};

interface ServicePackageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Existing package name — the dialog edits it; omit to create a new one. */
  packageName?: string | null;
  onSaved?: () => void;
}

let rowKey = 0;
function nextKey(prefix: string) {
  rowKey += 1;
  return `${prefix}-${rowKey}`;
}

function emptyLabourRow(): LabourFormRow {
  return {
    key: nextKey('labour'),
    labor_operation: '',
    operation_name: '',
    standard_hours: 0,
    quantity: 1,
    total_hours: 0,
    notes: '',
  };
}

function emptyPartRow(): PartFormRow {
  return { key: nextKey('part'), part_item: '', part_name: '', quantity: 1, unit_price: 0 };
}

function toNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatMoney(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function modelLabel(model: {
  name: string;
  model_code?: string;
  model_name?: string;
  variant?: string;
}): string {
  const code = (model.model_code || '').trim();
  return code || model.model_name || model.name;
}

export function ServicePackageDialog({
  open,
  onOpenChange,
  packageName,
  onSaved,
}: ServicePackageDialogProps) {
  const isEditing = Boolean(packageName);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [packageId, setPackageId] = useState('');
  const [description, setDescription] = useState('');
  const [intervalKm, setIntervalKm] = useState('10000');
  const [intervalMonths, setIntervalMonths] = useState('6');
  const [labourDiscount, setLabourDiscount] = useState('');
  const [beforeDiscount, setBeforeDiscount] = useState('');
  const [afterDiscount, setAfterDiscount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const [labourRows, setLabourRows] = useState<LabourFormRow[]>([emptyLabourRow()]);
  const [partRows, setPartRows] = useState<PartFormRow[]>([emptyPartRow()]);

  const [modelSearch, setModelSearch] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');

  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);
  const { data: serviceItems, isLoading: serviceItemsLoading } =
    useVehicleServiceItems(serviceSearch);
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(partSearch);

  function resetForm() {
    setName('');
    setPackageId('');
    setDescription('');
    setIntervalKm('10000');
    setIntervalMonths('6');
    setLabourDiscount('');
    setBeforeDiscount('');
    setAfterDiscount('');
    setIsActive(true);
    setSelectedModels([]);
    setLabourRows([emptyLabourRow()]);
    setPartRows([emptyPartRow()]);
    setModelSearch('');
    setServiceSearch('');
    setPartSearch('');
  }

  useEffect(() => {
    if (!open) return;

    if (!packageName) {
      resetForm();
      return;
    }

    let cancelled = false;
    setLoading(true);
    mastersSvc
      .getVehicleServicePackage(packageName)
      .then((pkg) => {
        if (cancelled) return;

        setName(pkg.package_name || pkg.name);
        setPackageId(pkg.package_id || '');
        setDescription(pkg.description || '');
        setIntervalKm(pkg.interval_km != null ? String(pkg.interval_km) : '');
        setIntervalMonths(pkg.interval_months != null ? String(pkg.interval_months) : '');
        setLabourDiscount(pkg.labour_discount_amount ? String(pkg.labour_discount_amount) : '');
        setBeforeDiscount(pkg.before_discount ? String(pkg.before_discount) : '');
        setAfterDiscount(pkg.after_discount ? String(pkg.after_discount) : '');
        setIsActive(pkg.is_active == null ? true : Number(pkg.is_active) === 1);

        const models: SelectedModel[] = [];
        for (const entry of pkg.applicable_vehicle_models || []) {
          const modelName = typeof entry === 'string' ? entry : entry?.vehicle_model;
          if (modelName) models.push({ name: modelName, label: modelName });
        }
        setSelectedModels(models);

        const labour = (pkg.labor_operations || []).map((row) => ({
          key: nextKey('labour'),
          labor_operation: row.labor_operation || '',
          operation_name: row.operation_name || '',
          standard_hours: Number(row.standard_hours) || 0,
          quantity: Number(row.quantity) || 1,
          total_hours: Number(row.total_hours) || 0,
          notes: row.notes || '',
        }));
        setLabourRows(labour.length ? labour : [emptyLabourRow()]);

        const parts = (pkg.parts_included || []).map((row) => ({
          key: nextKey('part'),
          part_item: row.part_item || '',
          part_name: row.part_name || '',
          quantity: Number(row.quantity) || 1,
          unit_price: Number(row.unit_price) || 0,
        }));
        setPartRows(parts.length ? parts : [emptyPartRow()]);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : 'Failed to load service package');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, packageName]);

  const modelOptions = (vehicleModels || [])
    .filter((vm) => !selectedModels.some((m) => m.name === vm.name))
    .map((vm) => ({
      value: vm.name,
      label: modelLabel(vm),
      description: [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
    }));

  const serviceOptions = (serviceItems || []).map((item) => ({
    value: item.name,
    label: item.custom_service_code || item.service_item || item.name,
    description: item.service_item || undefined,
  }));

  const partOptions = (spareParts || []).map((part) => ({
    value: part.name,
    label: part.item_name || part.item_code || part.name,
    description: [part.item_code, part.bin_location].filter(Boolean).join(' · ') || undefined,
  }));

  function addModel(value: string) {
    if (!value || selectedModels.some((m) => m.name === value)) return;
    const model = (vehicleModels || []).find((vm) => vm.name === value);
    setSelectedModels((prev) => [
      ...prev,
      { name: value, label: model ? modelLabel(model) : value },
    ]);
    setModelSearch('');
  }

  function updateLabourRow(key: string, patch: Partial<LabourFormRow>) {
    setLabourRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  function updatePartRow(key: string, patch: Partial<PartFormRow>) {
    setPartRows((rows) => rows.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  }

  const totalLabourHours = labourRows.reduce(
    (sum, row) => sum + (Number(row.total_hours) || 0),
    0
  );
  const totalPartsAmount = partRows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0) * (Number(row.unit_price) || 0),
    0
  );

  async function handleSave() {
    if (!name.trim()) {
      toast.error('Package Name is required');
      return;
    }

    const payload: mastersSvc.ServicePackageInput = {
      package_name: name.trim(),
      package_id: packageId.trim() || null,
      description: description.trim(),
      vehicle_model: selectedModels[0]?.name || null,
      applicable_vehicle_models: selectedModels.map((model) => ({ vehicle_model: model.name })),
      interval_km: toNumber(intervalKm),
      interval_months: toNumber(intervalMonths),
      labour_discount_amount: toNumber(labourDiscount),
      before_discount: toNumber(beforeDiscount),
      after_discount: toNumber(afterDiscount),
      total_amount: toNumber(afterDiscount) || toNumber(beforeDiscount),
      is_active: isActive ? 1 : 0,
      labor_operations: labourRows
        .filter((row) => row.labor_operation)
        .map((row) => ({
          labor_operation: row.labor_operation,
          operation_name: row.operation_name,
          standard_hours: Number(row.standard_hours) || 0,
          quantity: Number(row.quantity) || 1,
          total_hours:
            Number(row.total_hours) ||
            (Number(row.quantity) || 1) * (Number(row.standard_hours) || 0),
          notes: row.notes,
        })),
      parts_included: partRows
        .filter((row) => row.part_item)
        .map((row) => ({
          part_item: row.part_item,
          part_name: row.part_name,
          quantity: Number(row.quantity) || 1,
          unit_price: Number(row.unit_price) || 0,
        })),
    };

    setSaving(true);
    try {
      if (isEditing && packageName) {
        await mastersSvc.updateVehicleServicePackage(packageName, payload);
        toast.success('Service package updated');
      } else {
        await mastersSvc.createVehicleServicePackage(payload);
        toast.success('Service package created');
      }
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save service package');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="shrink-0">
          <DialogTitle>{isEditing ? 'Edit Service Package' : 'New Service Package'}</DialogTitle>
          <DialogDescription>
            Bundle labour operations, included parts, and pricing for a vehicle model service
            interval. Packages can be applied on Service Estimates and Job Cards.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto py-2">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="package-name">
                    Package Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="package-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. JX50-5K"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package-id">Package ID</Label>
                  <Input
                    id="package-id"
                    value={packageId}
                    onChange={(e) => setPackageId(e.target.value)}
                    placeholder="e.g. 5k"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package-km">Service Interval (KM)</Label>
                  <Input
                    id="package-km"
                    type="number"
                    value={intervalKm}
                    onChange={(e) => setIntervalKm(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="package-months">Service Interval (Months)</Label>
                  <Input
                    id="package-months"
                    type="number"
                    value={intervalMonths}
                    onChange={(e) => setIntervalMonths(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package-description">Description</Label>
                  <Input
                    id="package-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Shown when picking the package"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Applicable Vehicle Models</Label>
                <div className="flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background px-2 py-2">
                  {selectedModels.length === 0 ? (
                    <span className="px-1 text-xs text-muted-foreground">
                      Add one or more vehicle models this package applies to
                    </span>
                  ) : (
                    selectedModels.map((model) => (
                      <span
                        key={model.name}
                        className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
                      >
                        {model.label}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setSelectedModels((prev) => prev.filter((m) => m.name !== model.name))
                          }
                          aria-label={`Remove ${model.label}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                <SearchableSelect
                  value=""
                  onValueChange={addModel}
                  onSearchChange={setModelSearch}
                  placeholder="Add vehicle model…"
                  isLoading={modelsLoading}
                  options={modelOptions}
                  portaled
                  keepOpenOnSelect
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Labour Operations</Label>
                  <span className="text-xs text-muted-foreground">
                    Total {totalLabourHours.toFixed(2)} h
                  </span>
                </div>
                <div className="space-y-2">
                  {labourRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-5">
                        <SearchableSelect
                          value={row.labor_operation}
                          onValueChange={(value) => {
                            const item = (serviceItems || []).find((it) => it.name === value);
                            const hours = Number(item?.custom_estimated_timehours) || 0;
                            updateLabourRow(row.key, {
                              labor_operation: value,
                              operation_name:
                                item?.service_item || item?.custom_item_name || row.operation_name,
                              standard_hours: hours,
                              total_hours: hours * (Number(row.quantity) || 1),
                            });
                          }}
                          onSearchChange={setServiceSearch}
                          placeholder="Service item…"
                          isLoading={serviceItemsLoading}
                          options={serviceOptions}
                          valueLabel={row.operation_name || row.labor_operation}
                          portaled
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          value={row.operation_name}
                          onChange={(e) =>
                            updateLabourRow(row.key, { operation_name: e.target.value })
                          }
                          placeholder="Operation name"
                        />
                      </div>
                      <div className="sm:col-span-1">
                        <Input
                          type="number"
                          value={String(row.quantity)}
                          onChange={(e) => {
                            const quantity = toNumber(e.target.value);
                            updateLabourRow(row.key, {
                              quantity,
                              total_hours: quantity * (Number(row.standard_hours) || 0),
                            });
                          }}
                          placeholder="Qty"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          value={String(row.total_hours)}
                          onChange={(e) =>
                            updateLabourRow(row.key, { total_hours: toNumber(e.target.value) })
                          }
                          placeholder="Hours"
                        />
                      </div>
                      <div className="flex items-center justify-end sm:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={labourRows.length === 1}
                          aria-label="Remove labour operation"
                          onClick={() =>
                            setLabourRows((rows) =>
                              rows.length === 1
                                ? [emptyLabourRow()]
                                : rows.filter((r) => r.key !== row.key)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setLabourRows((rows) => [...rows, emptyLabourRow()])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add labour operation
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Parts Included</Label>
                  <span className="text-xs text-muted-foreground">
                    Parts total {formatMoney(totalPartsAmount)}
                  </span>
                </div>
                <div className="space-y-2">
                  {partRows.map((row) => (
                    <div
                      key={row.key}
                      className="grid grid-cols-1 gap-2 rounded-lg border p-2 sm:grid-cols-12"
                    >
                      <div className="sm:col-span-6">
                        <SearchableSelect
                          value={row.part_item}
                          onValueChange={(value) => {
                            const part = (spareParts || []).find((sp) => sp.name === value);
                            updatePartRow(row.key, {
                              part_item: value,
                              part_name: part?.item_name || row.part_name,
                            });
                          }}
                          onSearchChange={setPartSearch}
                          placeholder="Spare part…"
                          isLoading={sparePartsLoading}
                          options={partOptions}
                          valueLabel={row.part_name || row.part_item}
                          portaled
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Input
                          type="number"
                          value={String(row.quantity)}
                          onChange={(e) =>
                            updatePartRow(row.key, { quantity: toNumber(e.target.value) })
                          }
                          placeholder="Qty"
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <Input
                          type="number"
                          value={String(row.unit_price)}
                          onChange={(e) =>
                            updatePartRow(row.key, { unit_price: toNumber(e.target.value) })
                          }
                          placeholder="Unit price"
                        />
                      </div>
                      <div className="flex items-center justify-end sm:col-span-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          disabled={partRows.length === 1}
                          aria-label="Remove part"
                          onClick={() =>
                            setPartRows((rows) =>
                              rows.length === 1
                                ? [emptyPartRow()]
                                : rows.filter((r) => r.key !== row.key)
                            )
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPartRows((rows) => [...rows, emptyPartRow()])}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add part
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="space-y-2">
                  <Label htmlFor="package-before">Before Discount</Label>
                  <Input
                    id="package-before"
                    type="number"
                    value={beforeDiscount}
                    onChange={(e) => setBeforeDiscount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package-after">After Discount</Label>
                  <Input
                    id="package-after"
                    type="number"
                    value={afterDiscount}
                    onChange={(e) => setAfterDiscount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="package-labour-discount">Labour Discount</Label>
                  <Input
                    id="package-labour-discount"
                    type="number"
                    value={labourDiscount}
                    onChange={(e) => setLabourDiscount(e.target.value)}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="package-active"
                      checked={isActive}
                      onCheckedChange={(value) => setIsActive(Boolean(value))}
                    />
                    <Label htmlFor="package-active" className="cursor-pointer text-sm font-normal">
                      Active
                    </Label>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Total amount defaults to the After Discount value; the chargeable package amount is
                recalculated when the package is applied.
              </p>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || loading}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
