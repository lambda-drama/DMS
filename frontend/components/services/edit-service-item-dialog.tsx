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
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/searchable-select';
import { useVehicleModels, useVehicleServiceTypes } from '@/hooks/use-dms';
import * as mastersSvc from '@/services/masters';
import type { VehicleServiceItemMaster } from '@/services/masters';
import { usePermissions } from '@/contexts/permissions-context';

export interface EditServiceItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceItem: VehicleServiceItemMaster | null;
  onUpdated?: (name: string) => void;
}

export function EditServiceItemDialog({
  open,
  onOpenChange,
  serviceItem,
  onUpdated,
}: EditServiceItemDialogProps) {
  const { mutate } = useSWRConfig();
  const { canEditPrice } = usePermissions();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docName, setDocName] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [form, setForm] = useState({
    service_item: '',
    custom_service_code: '',
    custom_item_name: '',
    custom_vehicle_model: '',
    custom_category: '',
    custom_frt: '',
    custom_cat_code: '',
    custom_sub_code: '',
    custom_estimated_timehours: '',
    custom_rate: '',
    custom_description: '',
  });

  const { data: vehicleModels } = useVehicleModels(modelSearch);
  const { data: serviceCategories } = useVehicleServiceTypes(categorySearch);

  useEffect(() => {
    if (!open || !serviceItem) return;
    setError(null);
    setDocName(
      (serviceItem.name || '').trim() ||
        (serviceItem.custom_service_code || '').trim() ||
        (serviceItem.custom_erpnext_item || '').trim()
    );
    const serviceName = serviceItem.service_item || '';
    setForm({
      service_item: serviceName,
      custom_service_code: serviceItem.custom_service_code || '',
      custom_item_name: serviceItem.custom_item_name || serviceName || '',
      custom_vehicle_model: serviceItem.custom_vehicle_model || '',
      custom_category: serviceItem.custom_category || '',
      custom_frt: serviceItem.custom_frt || '',
      custom_cat_code: serviceItem.custom_cat_code || '',
      custom_sub_code: serviceItem.custom_sub_code || '',
      custom_estimated_timehours:
        serviceItem.custom_estimated_timehours != null
          ? String(serviceItem.custom_estimated_timehours)
          : '',
      custom_rate: serviceItem.custom_rate != null ? String(serviceItem.custom_rate) : '',
      custom_description: serviceItem.custom_description || '',
    });
    setModelSearch('');
    setCategorySearch('');
  }, [open, serviceItem]);

  const modelOptions = useMemo(
    () =>
      (vehicleModels || []).map((m: { name: string; model_name?: string }) => ({
        value: m.name,
        label: m.model_name || m.name,
      })),
    [vehicleModels]
  );

  const categoryOptions = useMemo(
    () =>
      (serviceCategories || []).map((c: { name: string; service_type_name?: string }) => ({
        value: c.name,
        label: c.service_type_name || c.name,
      })),
    [serviceCategories]
  );

  async function handleSave() {
    const name =
      docName ||
      (serviceItem?.name || '').trim() ||
      (serviceItem?.custom_service_code || '').trim();
    if (!name) {
      setError('No service item selected');
      toast.error('No service item selected');
      return;
    }
    if (!form.service_item.trim()) {
      setError('Service item name is required');
      toast.error('Service item name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await mastersSvc.updateVehicleServiceItem(name, {
        service_item: form.service_item.trim(),
        custom_service_code: form.custom_service_code.trim() || null,
        custom_item_name:
          form.custom_item_name.trim() || form.service_item.trim() || null,
        custom_vehicle_model: form.custom_vehicle_model || null,
        custom_category: form.custom_category || null,
        custom_frt: form.custom_frt.trim() || null,
        custom_cat_code: form.custom_cat_code.trim() || null,
        custom_sub_code: form.custom_sub_code.trim() || null,
        custom_estimated_timehours: form.custom_estimated_timehours
          ? Number(form.custom_estimated_timehours)
          : null,
        custom_rate: form.custom_rate ? Number(form.custom_rate) : null,
        custom_description: form.custom_description.trim() || null,
      });
      await mutate(
        (key) =>
          Array.isArray(key) &&
          (key[0] === 'vehicle-service-items-master' || key[0] === 'vehicle-service-item'),
        undefined,
        { revalidate: true }
      );
      toast.success('Service item updated');
      onUpdated?.(name);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update service item';
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void handleSave();
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit service item</DialogTitle>
            <DialogDescription>
              Update labour / vehicle service master details and rate.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Service item *</Label>
                <Input
                  value={form.service_item}
                  onChange={(e) => {
                    const next = e.target.value;
                    setForm((p) => ({
                      ...p,
                      service_item: next,
                      // Keep display / Item name aligned when it still matches the old service name
                      custom_item_name:
                        !p.custom_item_name.trim() || p.custom_item_name === p.service_item
                          ? next
                          : p.custom_item_name,
                    }));
                  }}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>Service code</Label>
                <Input
                  value={form.custom_service_code}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, custom_service_code: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Item name (display)</Label>
              <Input
                value={form.custom_item_name}
                onChange={(e) => setForm((p) => ({ ...p, custom_item_name: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Vehicle model</Label>
                <SearchableSelect
                  options={modelOptions}
                  value={form.custom_vehicle_model}
                  onValueChange={(v) => setForm((p) => ({ ...p, custom_vehicle_model: v }))}
                  onSearchChange={setModelSearch}
                  placeholder="Search models..."
                />
              </div>
              <div className="space-y-1">
                <Label>Category</Label>
                <SearchableSelect
                  options={categoryOptions}
                  value={form.custom_category}
                  onValueChange={(v) => setForm((p) => ({ ...p, custom_category: v }))}
                  onSearchChange={setCategorySearch}
                  placeholder="Search categories..."
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>FRT</Label>
                <Input
                  value={form.custom_frt}
                  onChange={(e) => setForm((p) => ({ ...p, custom_frt: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Cat code</Label>
                <Input
                  value={form.custom_cat_code}
                  onChange={(e) => setForm((p) => ({ ...p, custom_cat_code: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Sub code</Label>
                <Input
                  value={form.custom_sub_code}
                  onChange={(e) => setForm((p) => ({ ...p, custom_sub_code: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Estimated hours</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.custom_estimated_timehours}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, custom_estimated_timehours: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>{canEditPrice ? 'Rate' : 'Rate (fixed)'}</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.custom_rate}
                  onChange={(e) => setForm((p) => ({ ...p, custom_rate: e.target.value }))}
                  disabled={!canEditPrice}
                  className={!canEditPrice ? 'bg-muted' : undefined}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.custom_description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, custom_description: e.target.value }))
                }
              />
            </div>
            {serviceItem?.custom_erpnext_item ? (
              <p className="text-xs text-muted-foreground">
                Linked Item: {serviceItem.custom_erpnext_item}
              </p>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={saving} onClick={() => void handleSave()}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
