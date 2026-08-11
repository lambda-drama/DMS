'use client';

import { useEffect, useState } from 'react';
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
import * as mastersSvc from '@/services/masters';
import type { SparePartMaster } from '@/services/masters';

const PART_CATEGORIES = [
  'Engine Parts',
  'Transmission Parts',
  'Brake System',
  'Suspension & Steering',
  'Electrical & Electronics',
  'Body & Interior',
  'Exhaust System',
  'Cooling System',
  'Fuel System',
  'HVAC',
  'Lighting',
  'Filters',
  'Fluids & Lubricants',
  'Belts & Hoses',
  'Gaskets & Seals',
  'Fasteners & Hardware',
  'Tools & Equipment',
  'Cleaning Products',
  'Batteries',
  'Tires & Wheels',
  'Service Kits',
  'Consumables',
  'Genuine Part',
  'OEM Equivalent',
  'Aftermarket',
  'Reconditioned/Remanufactured',
  'Exchange Part',
  'Core Part',
  'Other',
];

const PART_TYPES = [
  'Genuine OEM',
  'OEM Equivalent',
  'Aftermarket',
  'Reconditioned',
  'Remanufactured',
  'Exchange (Core)',
  'Used/Recycled',
  'Consumable',
  'Tool/Equipment',
];

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  return Number.isFinite(n) ? n : null;
}

export interface EditSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sparePart: SparePartMaster | null;
  onUpdated?: (name: string) => void;
}

function sparePartId(part: SparePartMaster | null | undefined): string {
  if (!part) return '';
  return (
    (part.name || '').trim() ||
    (part.oem_part_number || '').trim() ||
    (part.spare_part_item || '').trim() ||
    (part.item_code || '').trim()
  );
}

export function EditSparePartDialog({
  open,
  onOpenChange,
  sparePart,
  onUpdated,
}: EditSparePartDialogProps) {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [docName, setDocName] = useState('');
  const [form, setForm] = useState({
    item_name: '',
    description: '',
    oem_part_number: '',
    manufacturer_part_number: '',
    part_category: '',
    part_type: '',
    bin_location: '',
    selling_price: '',
    wholesale_price: '',
    markup_percentage: '',
    minimum_stock_level: '',
    reorder_quantity: '',
    barcode: '',
    discontinued: '0',
  });

  useEffect(() => {
    if (!open || !sparePart) return;
    setError(null);
    setDocName(sparePartId(sparePart));
    setForm({
      item_name: sparePart.item?.item_name || sparePart.item_name || '',
      description: sparePart.item?.description || '',
      oem_part_number: sparePart.oem_part_number || '',
      manufacturer_part_number: sparePart.manufacturer_part_number || '',
      part_category: sparePart.part_category || '',
      part_type: sparePart.part_type || '',
      bin_location: sparePart.bin_location || '',
      selling_price:
        sparePart.selling_price != null
          ? String(sparePart.selling_price)
          : sparePart.item_price?.price_list_rate != null
            ? String(sparePart.item_price.price_list_rate)
            : '',
      wholesale_price:
        sparePart.wholesale_price != null ? String(sparePart.wholesale_price) : '',
      markup_percentage:
        sparePart.markup_percentage != null ? String(sparePart.markup_percentage) : '',
      minimum_stock_level:
        sparePart.minimum_stock_level != null ? String(sparePart.minimum_stock_level) : '',
      reorder_quantity:
        sparePart.reorder_quantity != null ? String(sparePart.reorder_quantity) : '',
      barcode: sparePart.barcode || '',
      discontinued: sparePart.discontinued ? '1' : '0',
    });
  }, [open, sparePart]);

  async function handleSave() {
    const name = docName || sparePartId(sparePart);
    if (!name) {
      setError('No spare part selected');
      toast.error('No spare part selected');
      return;
    }
    if (!form.item_name.trim()) {
      setError('Item name is required');
      toast.error('Item name is required');
      return;
    }
    if (!form.oem_part_number.trim()) {
      setError('OEM part number is required');
      toast.error('OEM part number is required');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await mastersSvc.updateSparePart(name, {
        item_name: form.item_name.trim(),
        description: form.description.trim() || null,
        oem_part_number: form.oem_part_number.trim(),
        manufacturer_part_number: form.manufacturer_part_number.trim() || null,
        part_category: form.part_category || null,
        part_type: form.part_type || null,
        bin_location: form.bin_location.trim() || null,
        selling_price: parseOptionalNumber(form.selling_price),
        wholesale_price: parseOptionalNumber(form.wholesale_price),
        markup_percentage: parseOptionalNumber(form.markup_percentage),
        minimum_stock_level: parseOptionalNumber(form.minimum_stock_level),
        reorder_quantity: parseOptionalNumber(form.reorder_quantity),
        barcode: form.barcode.trim() || null,
        discontinued: Number(form.discontinued),
      });
      await mutate(
        (key) => Array.isArray(key) && (key[0] === 'spare-parts-master' || key[0] === 'spare-part'),
        undefined,
        { revalidate: true }
      );
      toast.success('Spare part updated');
      onUpdated?.(name);
      onOpenChange(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update spare part';
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
            <DialogTitle>Edit spare part</DialogTitle>
            <DialogDescription>
              {sparePart?.item_code
                ? `Update ${sparePart.item_code}`
                : 'Update spare part master details and selling price'}
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
                <Label>Item name</Label>
                <Input
                  value={form.item_name}
                  onChange={(e) => setForm((p) => ({ ...p, item_name: e.target.value }))}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>OEM part number</Label>
                <Input
                  value={form.oem_part_number}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, oem_part_number: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Manufacturer part #</Label>
                <Input
                  value={form.manufacturer_part_number}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, manufacturer_part_number: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Barcode</Label>
                <Input
                  value={form.barcode}
                  onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select
                  value={form.part_category || undefined}
                  onValueChange={(v) => setForm((p) => ({ ...p, part_category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Part type</Label>
                <Select
                  value={form.part_type || undefined}
                  onValueChange={(v) => setForm((p) => ({ ...p, part_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PART_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Bin location</Label>
                <Input
                  value={form.bin_location}
                  onChange={(e) => setForm((p) => ({ ...p, bin_location: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select
                  value={form.discontinued}
                  onValueChange={(v) => setForm((p) => ({ ...p, discontinued: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Active</SelectItem>
                    <SelectItem value="1">Discontinued</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label>Selling price</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.selling_price}
                  onChange={(e) => setForm((p) => ({ ...p, selling_price: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Wholesale</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.wholesale_price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, wholesale_price: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Markup %</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.markup_percentage}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, markup_percentage: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Min stock</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.minimum_stock_level}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, minimum_stock_level: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Reorder qty</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={form.reorder_quantity}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, reorder_quantity: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              />
            </div>
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
