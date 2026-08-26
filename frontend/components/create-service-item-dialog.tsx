'use client';

import { useMemo, useState } from 'react';
import { Copy, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SearchableSelect } from '@/components/searchable-select';
import { useVehicleModels, useVehicleServiceTypes } from '@/hooks/use-dms';
import { createVehicleServiceItems } from '@/services/masters';
import { usePermissions } from '@/contexts/permissions-context';
import { cn } from '@/lib/utils';
import type { VehicleModelOption } from '@/types/dms';

interface CreateServiceItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (serviceItemName: string) => void;
}

type SelectedModel = {
  name: string;
  modelCode: string;
  label: string;
};

function combineServiceCode(enteredCode: string, modelCode: string): string {
  const code = enteredCode.trim().toUpperCase();
  const model = (modelCode || '').trim().toUpperCase();
  if (!code || !model) return code;
  if (code.startsWith(model)) return code;
  return `${model}${code}`;
}

function toSelectedModel(vm: VehicleModelOption): SelectedModel {
  const modelCode = (vm.model_code || '').trim();
  return {
    name: vm.name,
    modelCode,
    label: modelCode || vm.name,
  };
}

export function CreateServiceItemDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateServiceItemDialogProps) {
  const { canEditPrice } = usePermissions();
  const [saving, setSaving] = useState(false);
  const [combineConfirmOpen, setCombineConfirmOpen] = useState(false);
  const [duplicateModels, setDuplicateModels] = useState(false);
  const [serviceItem, setServiceItem] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const [modelSearch, setModelSearch] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [category, setCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [frt, setFrt] = useState('');
  const [catCode, setCatCode] = useState('');
  const [subCode, setSubCode] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [rate, setRate] = useState('');
  const [description, setDescription] = useState('');

  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);
  const { data: serviceCategories, isLoading: categoriesLoading } = useVehicleServiceTypes(categorySearch);

  const modelOptions = (vehicleModels || []).map((vm) => ({
    value: vm.name,
    label: vm.model_code || vm.name,
    description: [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
  }));

  const remainingModelOptions = duplicateModels
    ? modelOptions.filter((opt) => !selectedModels.some((m) => m.name === opt.value))
    : modelOptions;

  const singleModelCode =
    (vehicleModels || []).find((vm) => vm.name === vehicleModel)?.model_code || '';
  const enteredCodeNormalized = serviceCode.trim().toUpperCase();
  const combinedSingleCode = combineServiceCode(serviceCode, singleModelCode);
  const canOfferCombine =
    !duplicateModels &&
    Boolean(vehicleModel) &&
    Boolean(enteredCodeNormalized) &&
    Boolean(singleModelCode) &&
    combinedSingleCode !== enteredCodeNormalized;

  const previewCodes = useMemo(() => {
    const code = serviceCode.trim();
    if (!code) return [];
    if (duplicateModels) {
      if (!selectedModels.length) return [combineServiceCode(code, '')];
      return selectedModels.map((m) => combineServiceCode(code, m.modelCode)).filter(Boolean);
    }
    return [enteredCodeNormalized].filter(Boolean);
  }, [duplicateModels, selectedModels, serviceCode, enteredCodeNormalized]);

  const handleClose = () => {
    if (!saving) {
      setCombineConfirmOpen(false);
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setCombineConfirmOpen(false);
    setDuplicateModels(false);
    setServiceItem('');
    setServiceCode('');
    setVehicleModel('');
    setSelectedModels([]);
    setModelSearch('');
    setServiceType('');
    setCategory('');
    setCategorySearch('');
    setFrt('');
    setCatCode('');
    setSubCode('');
    setEstimatedHours('');
    setRate('');
    setDescription('');
  };

  const currentSingleModel = (vehicleModels || []).find((vm) => vm.name === vehicleModel);

  const toggleDuplicateModels = () => {
    setDuplicateModels((prev) => {
      const next = !prev;
      if (next) {
        if (vehicleModel) {
          const vm = currentSingleModel;
          const selected = vm
            ? toSelectedModel(vm)
            : { name: vehicleModel, modelCode: '', label: vehicleModel };
          setSelectedModels((current) =>
            current.some((m) => m.name === selected.name) ? current : [...current, selected]
          );
        }
      } else {
        const first = selectedModels[0];
        setVehicleModel(first?.name || '');
        setSelectedModels(first ? [first] : []);
      }
      return next;
    });
  };

  const addSelectedModel = (name: string) => {
    const vm = (vehicleModels || []).find((m) => m.name === name);
    if (!vm) return;
    setSelectedModels((current) =>
      current.some((m) => m.name === vm.name) ? current : [...current, toSelectedModel(vm)]
    );
  };

  const removeSelectedModel = (name: string) => {
    setSelectedModels((current) => current.filter((m) => m.name !== name));
  };

  const handleSubmit = async () => {
    if (!serviceItem.trim()) {
      toast.error('Service item name is required');
      return;
    }

    const models = duplicateModels
      ? selectedModels.map((m) => m.name)
      : vehicleModel
        ? [vehicleModel]
        : [];

    if (duplicateModels && models.length === 0) {
      toast.error('Select at least one vehicle model');
      return;
    }

    if (duplicateModels && !serviceCode.trim()) {
      toast.error('Enter the service code suffix (last part) to combine with each model');
      return;
    }

    if (canOfferCombine) {
      setCombineConfirmOpen(true);
      return;
    }

    await createItems({ combineWithModel: duplicateModels && models.length > 0 });
  };

  const createItems = async ({ combineWithModel }: { combineWithModel: boolean }) => {
    const models = duplicateModels
      ? selectedModels.map((m) => m.name)
      : vehicleModel
        ? [vehicleModel]
        : [];

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        service_item: serviceItem.trim(),
        vehicle_models: models,
        combine_with_model: combineWithModel ? 1 : 0,
      };

      if (serviceCode.trim()) payload.custom_service_code = serviceCode.trim();
      if (serviceType) payload.service_type = serviceType;
      if (category) payload.custom_category = category;
      if (frt.trim()) payload.custom_frt = frt.trim();
      if (catCode.trim()) payload.custom_cat_code = catCode.trim();
      if (subCode.trim()) payload.custom_sub_code = subCode.trim();
      if (estimatedHours) payload.custom_estimated_timehours = estimatedHours;
      if (rate && canEditPrice) payload.custom_rate = parseFloat(rate);
      if (description.trim()) payload.custom_description = description.trim();

      const response = await createVehicleServiceItems(payload);
      const count = response.count || response.created?.length || 0;
      const codes = (response.created || [])
        .map((row) => row.custom_service_code)
        .filter(Boolean)
        .join(', ');

      toast.success(
        count > 1
          ? `Created ${count} service items${codes ? ` (${codes})` : ''}`
          : `Service item "${serviceItem}" created successfully`
      );
      setCombineConfirmOpen(false);
      onCreated?.(response.name || response.created?.[0]?.name || '');
      onOpenChange(false);
      resetForm();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create service item';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const createCount = duplicateModels ? Math.max(selectedModels.length, 1) : 1;

  return (
    <>
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        headerActions={
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={toggleDuplicateModels}
                aria-pressed={duplicateModels}
                aria-label="Duplicate across vehicle models"
                className={cn(
                  'ring-offset-background focus:ring-ring rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*="size-"])]:size-4',
                  duplicateModels && 'bg-accent text-foreground opacity-100'
                )}
              >
                <Copy />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {duplicateModels
                ? 'Switch back to a single vehicle model'
                : 'Duplicate across multiple vehicle models'}
            </TooltipContent>
          </Tooltip>
        }
      >
        <DialogHeader className="pr-16">
          <DialogTitle>New Vehicle Service Item</DialogTitle>
          <DialogDescription>
            {duplicateModels
              ? 'Select multiple vehicle models and enter only the service-code suffix. Each model code is prepended automatically (TYP + GTY → GTYTYP).'
              : 'Create a new labour service item for vehicle maintenance and repair.'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Service Item <span className="text-destructive">*</span>
              </Label>
              <Input
                value={serviceItem}
                onChange={(e) => setServiceItem(e.target.value)}
                placeholder="e.g., Engine Oil Change"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Service Code
                {duplicateModels ? (
                  <span className="text-destructive"> *</span>
                ) : null}
              </Label>
              <Input
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                placeholder={duplicateModels ? 'e.g. TYP (suffix only)' : 'e.g., SVC-001'}
              />
              {previewCodes.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {duplicateModels
                    ? `Will create: ${previewCodes.join(', ')}`
                    : `Will save as: ${previewCodes.join(', ')}`}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Vehicle Model
                {duplicateModels ? <span className="text-destructive"> *</span> : null}
              </Label>
              {duplicateModels ? (
                <div className="space-y-2">
                  <div className="flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background px-2 py-2">
                    {selectedModels.length === 0 ? (
                      <span className="px-1 text-xs text-muted-foreground">
                        Add one or more vehicle models
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
                            onClick={() => removeSelectedModel(model.name)}
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
                    onValueChange={addSelectedModel}
                    onSearchChange={setModelSearch}
                    placeholder="Add vehicle model..."
                    isLoading={modelsLoading}
                    options={remainingModelOptions}
                    portaled
                    keepOpenOnSelect
                  />
                </div>
              ) : (
                <SearchableSelect
                  value={vehicleModel}
                  onValueChange={setVehicleModel}
                  onSearchChange={setModelSearch}
                  placeholder="Search vehicle models..."
                  isLoading={modelsLoading}
                  options={modelOptions}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventive Maintenance">Preventive Maintenance</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Inspection">Inspection</SelectItem>
                  <SelectItem value="Diagnosis">Diagnosis</SelectItem>
                  <SelectItem value="Replacement">Replacement</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableSelect
                value={category}
                onValueChange={setCategory}
                onSearchChange={setCategorySearch}
                placeholder="Search categories..."
                isLoading={categoriesLoading}
                options={(serviceCategories || []).map((cat) => ({
                  value: cat.name,
                  label: cat.service_type_name || cat.name,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>FRT</Label>
              <Input
                value={frt}
                onChange={(e) => setFrt(e.target.value)}
                placeholder="Flat Rate Time"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cat Code</Label>
              <Input
                value={catCode}
                onChange={(e) => setCatCode(e.target.value)}
                placeholder="Category Code"
              />
            </div>
            <div className="space-y-2">
              <Label>Sub Code</Label>
              <Input
                value={subCode}
                onChange={(e) => setSubCode(e.target.value)}
                placeholder="Sub Code"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g., 1.5"
              />
            </div>
            <div className="space-y-2">
              <Label>{canEditPrice ? 'Rate' : 'Rate (fixed)'}</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
                disabled={!canEditPrice}
                className={!canEditPrice ? 'bg-muted' : undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Service description..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {createCount > 1 ? `Create ${createCount} Service Items` : 'Create Service Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
      <AlertDialog open={combineConfirmOpen} onOpenChange={setCombineConfirmOpen}>
        <AlertDialogContent className="z-[60] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Add model code to the service code?</AlertDialogTitle>
            <AlertDialogDescription>
              You entered {enteredCodeNormalized} with model {singleModelCode}. Prepend the model
              to store {combinedSingleCode}, or keep the code as entered.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-between">
            <AlertDialogCancel disabled={saving}>Back</AlertDialogCancel>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                disabled={saving}
                onClick={() => void createItems({ combineWithModel: false })}
              >
                Keep {enteredCodeNormalized}
              </Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => void createItems({ combineWithModel: true })}
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Use {combinedSingleCode}
              </Button>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
