'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import useSWR, { useSWRConfig } from 'swr';
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
import { SearchableSelect } from '@/components/searchable-select';
import { useSpareParts } from '@/hooks/use-dms';
import * as mastersSvc from '@/services/masters';
import type { ItemPriceMaster } from '@/services/masters';

export interface EditItemPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemPrice: ItemPriceMaster | null;
  /** When true, create a new Item Price instead of editing. */
  createMode?: boolean;
  onUpdated?: (name: string) => void;
}

export function EditItemPriceDialog({
  open,
  onOpenChange,
  itemPrice,
  createMode = false,
  onUpdated,
}: EditItemPriceDialogProps) {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [itemSearch, setItemSearch] = useState('');
  const { data: spareParts } = useSpareParts(itemSearch);
  const { data: options } = useSWR(open ? 'masters-options' : null, mastersSvc.getMastersOptions);

  const [form, setForm] = useState({
    item_code: '',
    price_list: '',
    price_list_rate: '',
    uom: 'Nos',
    valid_from: '',
    valid_upto: '',
  });

  useEffect(() => {
    if (!open) return;
    if (createMode) {
      setForm({
        item_code: '',
        price_list: options?.default_price_list || '',
        price_list_rate: '',
        uom: 'Nos',
        valid_from: '',
        valid_upto: '',
      });
      setItemSearch('');
      return;
    }
    if (!itemPrice) return;
    setForm({
      item_code: itemPrice.item_code || '',
      price_list: itemPrice.price_list || '',
      price_list_rate:
        itemPrice.price_list_rate != null ? String(itemPrice.price_list_rate) : '',
      uom: itemPrice.uom || 'Nos',
      valid_from: itemPrice.valid_from || '',
      valid_upto: itemPrice.valid_upto || '',
    });
  }, [open, itemPrice, createMode, options?.default_price_list]);

  const itemOptions = useMemo(() => {
    const opts = (spareParts || []).map((p) => ({
      value: p.spare_part_item || p.item_code || p.name,
      label: `${p.item_code || p.spare_part_item || p.name}${
        p.item_name ? ` — ${p.item_name}` : ''
      }`,
    }));
    if (form.item_code && !opts.some((o) => o.value === form.item_code)) {
      opts.unshift({
        value: form.item_code,
        label: itemPrice?.item_name
          ? `${form.item_code} — ${itemPrice.item_name}`
          : form.item_code,
      });
    }
    return opts;
  }, [spareParts, form.item_code, itemPrice?.item_name]);

  const priceListOptions = useMemo(
    () =>
      (options?.price_lists || []).map((p) => ({
        value: p.name,
        label: p.currency ? `${p.name} (${p.currency})` : p.name,
      })),
    [options]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.price_list_rate || Number(form.price_list_rate) <= 0) {
      toast.error('Rate must be greater than zero');
      return;
    }
    setSaving(true);
    try {
      let name = itemPrice?.name || '';
      if (createMode) {
        if (!form.item_code) {
          toast.error('Item is required');
          setSaving(false);
          return;
        }
        const created = await mastersSvc.createItemPrice({
          item_code: form.item_code,
          price_list: form.price_list || null,
          price_list_rate: Number(form.price_list_rate),
          uom: form.uom || 'Nos',
          valid_from: form.valid_from || null,
          valid_upto: form.valid_upto || null,
        });
        name = created.name;
        toast.success('Item price created');
      } else {
        if (!itemPrice?.name) return;
        await mastersSvc.updateItemPrice(itemPrice.name, {
          price_list_rate: Number(form.price_list_rate),
          uom: form.uom || null,
          valid_from: form.valid_from || null,
          valid_upto: form.valid_upto || null,
        });
        name = itemPrice.name;
        toast.success('Item price updated');
      }
      await mutate(
        (key) => Array.isArray(key) && (key[0] === 'item-prices-master' || key[0] === 'item-price'),
        undefined,
        { revalidate: true }
      );
      onUpdated?.(name);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save item price');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{createMode ? 'New item price' : 'Edit item price'}</DialogTitle>
            <DialogDescription>
              {createMode
                ? 'Create a selling price on the default or selected price list.'
                : `Update rate for ${itemPrice?.item_code || 'item'}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            {createMode ? (
              <>
                <div className="space-y-1">
                  <Label>Item *</Label>
                  <SearchableSelect
                    options={itemOptions}
                    value={form.item_code}
                    onValueChange={(v) => setForm((p) => ({ ...p, item_code: v }))}
                    onSearchChange={setItemSearch}
                    placeholder="Search spare parts / items..."
                  />
                </div>
                <div className="space-y-1">
                  <Label>Price list</Label>
                  <SearchableSelect
                    options={priceListOptions}
                    value={form.price_list}
                    onValueChange={(v) => setForm((p) => ({ ...p, price_list: v }))}
                    placeholder="Default selling list"
                  />
                </div>
              </>
            ) : (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <div className="font-medium">{itemPrice?.item_code}</div>
                <div className="text-muted-foreground">
                  {itemPrice?.item_name || '—'} · {itemPrice?.price_list || '—'}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Rate *</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={form.price_list_rate}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price_list_rate: e.target.value }))
                  }
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>UOM</Label>
                <Input
                  value={form.uom}
                  onChange={(e) => setForm((p) => ({ ...p, uom: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Valid from</Label>
                <Input
                  type="date"
                  value={form.valid_from}
                  onChange={(e) => setForm((p) => ({ ...p, valid_from: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Valid upto</Label>
                <Input
                  type="date"
                  value={form.valid_upto}
                  onChange={(e) => setForm((p) => ({ ...p, valid_upto: e.target.value }))}
                />
              </div>
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
