'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetchCrmItems, quickCreateItem } from '@/services/crm';
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

type Props = {
  value: string;
  onValueChange: (
    value: string,
    meta?: { item_name?: string; uom?: string; rate?: number }
  ) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
};

export function CrmItemLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search items…',
  disabled,
  className,
  allowCreate = true,
}: Props) {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [rate, setRate] = useState('');
  const [binLocation, setBinLocation] = useState('');
  const { data, isLoading } = useSWR(['crm-link-items', search], () =>
    fetchCrmItems(search || undefined)
  );

  const options = useMemo(
    () =>
      (data || []).map((item) => ({
        value: String(item.name || item.item_code),
        label: String(item.label || item.item_name || item.item_code || item.name),
        description: [item.item_code, item.brand].filter(Boolean).join(' · ') || undefined,
        item_name: String(item.item_name || ''),
        uom: String(item.uom || ''),
        rate: Number(item.rate || 0),
      })),
    [data]
  );

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  const onCreated = async () => {
    const code = (itemCode || itemName).trim();
    if (!code) {
      toast.error('Item code is required');
      return;
    }
    setSaving(true);
    try {
      const res = await quickCreateItem({
        item_code: code,
        item_name: (itemName || itemCode).trim() || code,
        standard_rate: rate ? Number(rate) : undefined,
        bin_location: binLocation.trim() || undefined,
      });
      await mutate(
        (key) => Array.isArray(key) && String(key[0]).includes('item'),
        undefined,
        { revalidate: true }
      );
      setLocalLabel(res.label || res.name);
      onValueChange(res.name, {
        item_name: res.label,
        uom: 'Nos',
        rate: rate ? Number(rate) : 0,
      });
      setOpen(false);
      setItemCode('');
      setItemName('');
      setRate('');
      setBinLocation('');
      toast.success(`Created: ${res.label || res.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create item');
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
            item_name: opt?.item_name,
            uom: opt?.uom,
            rate: opt?.rate,
          });
        }}
        onSearchChange={setSearch}
        placeholder={placeholder}
        emptyMessage="No items found — create one with +"
        isLoading={isLoading}
        disabled={disabled}
        onCreateNew={allowCreate && !disabled ? () => setOpen(true) : undefined}
        createNewLabel="Create item"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New item</DialogTitle>
            <DialogDescription>
              Creates a sellable ERPNext Item and selects it on this form. Bin location is copied
              to the Spare Part if one is auto-created.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Item code *</Label>
              <Input
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g. VEH-T2-2026"
              />
            </div>
            <div className="space-y-1">
              <Label>Item name</Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Defaults to item code"
              />
            </div>
            <div className="space-y-1">
              <Label>Standard rate</Label>
              <Input
                type="number"
                min={0}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Bin location</Label>
              <Input
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                placeholder="e.g. A-12-B-03"
              />
            </div>
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
