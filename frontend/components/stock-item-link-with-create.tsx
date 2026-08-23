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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as stockSvc from '@/services/stockOperations';

export interface StockItemCreatedPayload {
  item_code: string;
  item_name: string;
  valuation_rate?: number;
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
  const [valuationRate, setValuationRate] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [itemGroup, setItemGroup] = useState(defaultItemGroup || '');
  const [stockUom, setStockUom] = useState('Pcs');
  const [binLocation, setBinLocation] = useState('');
  const [uomOptions, setUomOptions] = useState<Array<{ value: string; label: string }>>([
    { value: 'Pcs', label: 'Pcs' },
  ]);
  const [autoSpare, setAutoSpare] = useState(Boolean(autoCreateSpareParts));

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setItemCode((initialItemCode || selectProps.value || '').trim());
    setItemName('');
    setValuationRate('');
    setSellingPrice('');
    setItemGroup(defaultItemGroup || '');
    setStockUom('Pcs');
    setBinLocation('');
    setAutoSpare(Boolean(autoCreateSpareParts));

    let cancelled = false;
    (async () => {
      try {
        const defaults = await stockSvc.fetchStockItemCreateDefaults();
        if (cancelled) return;
        if (!defaultItemGroup && defaults.default_item_group) {
          setItemGroup(defaults.default_item_group);
        }
        if (defaults.uoms?.length) {
          setUomOptions(defaults.uoms);
        }
        setStockUom(defaults.default_stock_uom || 'Pcs');
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
        valuation_rate: valuationRate ? Number(valuationRate) : undefined,
        standard_rate: sellingPrice ? Number(sellingPrice) : undefined,
        item_group: itemGroup,
        stock_uom: stockUom || 'Pcs',
        bin_location: binLocation.trim() || undefined,
      });
      const payload: StockItemCreatedPayload = {
        item_code: result.item_code || result.name,
        item_name: result.item_name || result.label || code,
        valuation_rate: result.valuation_rate,
        standard_rate: result.standard_rate,
        spare_part: result.spare_part,
      };
      onValueChange(payload.item_code);
      onItemCreated?.(payload);
      toast.success(
        payload.spare_part
          ? `Created item, spare part (${payload.spare_part})${
              result.price_list ? `, and price on ${result.price_list}` : ''
            }`
          : `Created item ${payload.item_code}${
              result.price_list ? ` with price on ${result.price_list}` : ''
            }`
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
              Selling price also creates an Item Price on the default selling price list
              configured in DMS Settings.
              {autoSpare
                ? ' A Spare Part will be created automatically with the prices and bin location you enter.'
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Valuation / cost</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={valuationRate}
                    onChange={(e) => setValuationRate(e.target.value)}
                    placeholder="Item valuation rate"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Selling price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="Standard selling rate"
                  />
                </div>
              </div>
            )}
            <div className="space-y-1">
              <Label>Default UOM</Label>
              <Select value={stockUom} onValueChange={setStockUom}>
                <SelectTrigger>
                  <SelectValue placeholder="Pcs" />
                </SelectTrigger>
                <SelectContent>
                  {(uomOptions.some((opt) => opt.value === stockUom)
                    ? uomOptions
                    : stockUom
                      ? [{ value: stockUom, label: stockUom }, ...uomOptions]
                      : uomOptions
                  ).map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Bin location</Label>
              <Input
                value={binLocation}
                onChange={(e) => setBinLocation(e.target.value)}
                placeholder="e.g. A-12-B-03"
              />
            </div>
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
