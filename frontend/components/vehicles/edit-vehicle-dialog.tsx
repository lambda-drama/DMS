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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/searchable-select';
import { useCustomers } from '@/hooks/use-dms';
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from '@/lib/customer-default';
import * as vehiclesSvc from '@/services/vehicles';
import type { VINNoFull } from '@/types/dms';

const VEHICLE_STATUSES = [
  'In Stock',
  'Delivered to Customer',
  'In Service',
  'In Transit',
  'Total Loss',
  'Scrapped',
] as const;

export interface EditVehicleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicle: VINNoFull | null;
  onUpdated?: (name: string) => void;
}

export function EditVehicleDialog({
  open,
  onOpenChange,
  vehicle,
  onUpdated,
}: EditVehicleDialogProps) {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const { data: customers } = useCustomers(customerSearch);
  const [form, setForm] = useState({
    plate_number: '',
    engine_number: '',
    current_customer: '',
    current_odometer: '',
    exterior_color: '',
    interior_color: '',
    vehicle_status: 'In Stock',
    special_notes: '',
  });

  useEffect(() => {
    if (!open || !vehicle) return;
    setForm({
      plate_number: vehicle.plate_number || '',
      engine_number: vehicle.engine_number || '',
      current_customer: vehicle.current_customer || '',
      current_odometer:
        vehicle.current_odometer != null ? String(vehicle.current_odometer) : '',
      exterior_color: vehicle.exterior_color || '',
      interior_color: vehicle.interior_color || '',
      vehicle_status: vehicle.vehicle_status || 'In Stock',
      special_notes: vehicle.special_notes || '',
    });
    setCustomerSearch('');
  }, [open, vehicle]);

  const customerOptions = useMemo(
    () =>
      buildCustomerSelectOptions(customers, form.current_customer, {
        name: form.current_customer,
        customer_name: vehicle?.customer_name || form.current_customer,
      }),
    [customers, form.current_customer, vehicle?.customer_name]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!vehicle?.name) return;
    setSaving(true);
    try {
      await vehiclesSvc.updateVehicle(vehicle.name, {
        plate_number: form.plate_number.trim() || null,
        engine_number: form.engine_number.trim() || null,
        current_customer: form.current_customer || null,
        current_odometer: form.current_odometer
          ? Number(form.current_odometer)
          : null,
        exterior_color: form.exterior_color.trim() || null,
        interior_color: form.interior_color.trim() || null,
        vehicle_status: form.vehicle_status || null,
        special_notes: form.special_notes.trim() || null,
      });
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
      toast.error(err instanceof Error ? err.message : 'Failed to update vehicle');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit vehicle</DialogTitle>
            <DialogDescription>
              {vehicle?.vin_number
                ? `Update details for VIN ${vehicle.vin_number}`
                : 'Update vehicle master details'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Plate number</Label>
                <Input
                  value={form.plate_number}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, plate_number: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Engine number</Label>
                <Input
                  value={form.engine_number}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, engine_number: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Current customer</Label>
              <SearchableSelect
                options={customerOptions}
                value={form.current_customer}
                onValueChange={(id) => {
                  const next = resolveCustomerFieldChange(id, customers, undefined);
                  setForm((p) => ({ ...p, current_customer: next.customer }));
                }}
                onSearchChange={setCustomerSearch}
                placeholder="Search customers..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Odometer</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.current_odometer}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, current_odometer: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Vehicle status</Label>
                <Select
                  value={form.vehicle_status}
                  onValueChange={(v) => setForm((p) => ({ ...p, vehicle_status: v }))}
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
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Exterior color</Label>
                <Input
                  value={form.exterior_color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, exterior_color: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Interior color</Label>
                <Input
                  value={form.interior_color}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, interior_color: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Special notes</Label>
              <Textarea
                rows={3}
                value={form.special_notes}
                onChange={(e) =>
                  setForm((p) => ({ ...p, special_notes: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
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
  );
}
