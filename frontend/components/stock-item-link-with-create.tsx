'use client';

import { useEffect, useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect, type SearchableSelectProps } from '@/components/searchable-select';
import * as stockSvc from '@/services/stockOperations';

export interface StockItemCreatedPayload {
  item_code: string;
  item_name: string;
  standard_rate?: number;
  spare_part?: string | null;
}

export interface StockItemLinkWithCreateProps
  extends Omit<SearchableSelectProps, 'onCreateNew' | 'createNewLabel'> {
  defaultItemGroup?: string | null;
  autoCreateSpareParts?: boolean;
  showRateField?: boolean;
  initialItemCode?: string;
  onItemCreated?: (item: StockItemCreatedPayload) => void;
}

export function StockItemLinkWithCreate({
  defaultItemGroup,
  autoCreateSpareParts,
  showRateField = true,
  initialItemCode,
  onItemCreated,
  onValueChange,
  className,
  disabled,
  ...selectProps
}: StockItemLinkWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [rate, setRate] = useState('');
  const [itemGroup, setItemGroup] = useState(defaultItemGroup || '');
  const [autoSpare, setAutoSpare] = useState(Boolean(autoCreateSpareParts));

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setItemCode((initialItemCode || selectProps.value || '').trim());
    setItemName('');
    setRate('');
    setItemGroup(defaultItemGroup || '');
    setAutoSpare(Boolean(autoCreateSpareParts));

    let cancelled = false;
    (async () => {
      try {
        const defaults = await stockSvc.fetchStockItemCreateDefaults();
        if (cancelled) return;
        if (!defaultItemGroup && defaults.default_item_group) {
          setItemGroup(defaults.default_item_group);
        }
        setAutoSpare(Boolean(defaults.auto_create_spare_parts));
      } catch {
        /* use props */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    initialItemCode,
    selectProps.value,
    defaultItemGroup,
    autoCreateSpareParts,
  ]);

  async function handleSubmit() {
    const code = itemCode.trim();
    const name = (itemName.trim() || code).trim();
    if (!code) {
      toast.error('Item code is required');
      return;
    }
    if (!itemGroup) {
      toast.error('Configure Default Item Group on DMS Settings first');
      return;
    }

    setSaving(true);
    try {
      const result = await stockSvc.createStockItem({
        item_code: code,
        item_name: name,
        standard_rate: rate ? Number(rate) : 0,
        item_group: itemGroup,
      });
      const payload: StockItemCreatedPayload = {
        item_code: result.item_code || result.name,
        item_name: result.item_name || result.label || code,
        standard_rate: result.standard_rate,
        spare_part: result.spare_part,
      };
      onValueChange(payload.item_code);
      onItemCreated?.(payload);
      toast.success(
        payload.spare_part
          ? `Created item and spare part (${payload.spare_part})`
          : `Created item ${payload.item_code}`
      );
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create item');
    } finally {
      setSaving(false);
    }
  }

  const select = (
    <SearchableSelect
      {...selectProps}
      className={className}
      disabled={disabled}
      onValueChange={onValueChange}
      onCreateNew={disabled ? undefined : () => setOpen(true)}
      createNewLabel="New item"
    />
  );

  return (
    <>
      {select}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New stock item</DialogTitle>
            <DialogDescription>
              Creates an ERPNext Item using the default item group from DMS Settings.
              {autoSpare
                ? ' A Spare Part will be created automatically with the rate you enter.'
                : ' Enable Auto Generate Spare Parts on the item group to create a Spare Part automatically.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Item code *</Label>
              <Input
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g. BRK-PAD-001"
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
            {showRateField && (
              <div className="space-y-1">
                <Label>Rate / selling price</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  placeholder="Used on item and spare part"
                />
              </div>
            )}
            <div className="space-y-1">
              <Label>Item group</Label>
              <Input value={itemGroup} disabled placeholder="From DMS Settings" />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
