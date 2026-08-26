'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/searchable-select';
import { useVehicleModels } from '@/hooks/use-dms';
import * as mastersSvc from '@/services/masters';
import type { VehicleServiceItemMaster } from '@/services/masters';

function combineServiceCode(enteredCode: string, modelCode: string): string {
  const code = enteredCode.trim().toUpperCase();
  const model = (modelCode || '').trim().toUpperCase();
  if (!code || !model) return code;
  if (code.startsWith(model)) return code;
  return `${model}${code}`;
}

function serviceCodeSuffix(serviceCode: string, modelCode: string): string {
  const code = (serviceCode || '').trim().toUpperCase();
  const model = (modelCode || '').trim().toUpperCase();
  if (!code) return '';
  if (model && code.startsWith(model) && code.length > model.length) {
    return code.slice(model.length);
  }
  return code;
}

type SelectedModel = {
  name: string;
  modelCode: string;
  label: string;
};

export function AddServiceItemModelDialog({
  open,
  onOpenChange,
  serviceItem,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceItem: VehicleServiceItemMaster | null;
  onCreated?: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [selectedModels, setSelectedModels] = useState<SelectedModel[]>([]);
  const sourceModel = (serviceItem?.custom_vehicle_model || '').trim();

  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);
  const { data: sourceModelHits } = useVehicleModels(open ? sourceModel || undefined : undefined);

  useEffect(() => {
    if (!open) return;
    setSelectedModels([]);
    setModelSearch('');
  }, [open, serviceItem?.name]);

  const sourceModelCode = useMemo(() => {
    const pool = [...(sourceModelHits || []), ...(vehicleModels || [])];
    const match = pool.find((vm) => vm.name === sourceModel);
    return (match?.model_code || '').trim();
  }, [sourceModel, sourceModelHits, vehicleModels]);

  const suffix = useMemo(() => {
    const fromCode = serviceCodeSuffix(serviceItem?.custom_service_code || '', sourceModelCode);
    if (fromCode) return fromCode;
    const cat = (serviceItem?.custom_cat_code || '').trim().toUpperCase();
    const sub = (serviceItem?.custom_sub_code || '').trim();
    return `${cat}${sub}`;
  }, [serviceItem, sourceModelCode]);

  const previewCodes = selectedModels.map((m) => combineServiceCode(suffix, m.modelCode)).filter(Boolean);

  const remainingOptions = (vehicleModels || [])
    .filter((vm) => vm.name !== sourceModel && !selectedModels.some((m) => m.name === vm.name))
    .map((vm) => ({
      value: vm.name,
      label: vm.model_code || vm.name,
      description: [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
    }));

  const addModel = (name: string) => {
    const vm = (vehicleModels || []).find((m) => m.name === name);
    if (!vm) return;
    setSelectedModels((current) =>
      current.some((m) => m.name === vm.name)
        ? current
        : [
            ...current,
            {
              name: vm.name,
              modelCode: (vm.model_code || '').trim(),
              label: vm.model_code || vm.name,
            },
          ]
    );
  };

  const handleClose = () => {
    if (!saving) onOpenChange(false);
  };

  const handleSubmit = async () => {
    const id = (serviceItem?.name || '').trim();
    if (!id) {
      toast.error('No service item selected');
      return;
    }
    if (selectedModels.length === 0) {
      toast.error('Select at least one vehicle model');
      return;
    }

    setSaving(true);
    try {
      const response = await mastersSvc.addVehicleServiceItemModels(
        id,
        selectedModels.map((m) => m.name)
      );
      const count = response.count || response.created?.length || 0;
      const codes = (response.created || [])
        .map((row) => row.custom_service_code)
        .filter(Boolean)
        .join(', ');
      toast.success(
        count > 1
          ? `Added ${count} models${codes ? ` (${codes})` : ''}`
          : `Service created${codes ? ` as ${codes}` : ''}`
      );
      onCreated?.();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add model');
    } finally {
      setSaving(false);
    }
  };

  const sourceLabel = serviceItem?.custom_item_name || serviceItem?.service_item || 'this service';
  const sourceCode = serviceItem?.custom_service_code || '—';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Model</DialogTitle>
          <DialogDescription>
            Create {sourceLabel} for another vehicle model. The suffix from {sourceCode}
            {suffix ? ` (${suffix})` : ''} is combined with the new model code.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label>
              Vehicle Model <span className="text-destructive">*</span>
            </Label>
            <div className="flex min-h-10 flex-wrap gap-1.5 rounded-md border bg-background px-2 py-2">
              {selectedModels.length === 0 ? (
                <span className="px-1 text-xs text-muted-foreground">Select a vehicle model</span>
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
                        setSelectedModels((current) => current.filter((m) => m.name !== model.name))
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
              placeholder="Search vehicle models..."
              isLoading={modelsLoading}
              options={remainingOptions}
              portaled
              keepOpenOnSelect
            />
          </div>
          {previewCodes.length > 0 ? (
            <p className="text-xs text-muted-foreground">Will create: {previewCodes.join(', ')}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {selectedModels.length > 1 ? `Add ${selectedModels.length} Models` : 'Add Model'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
