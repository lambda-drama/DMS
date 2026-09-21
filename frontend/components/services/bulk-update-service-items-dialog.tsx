'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
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
import { SearchableSelect } from '@/components/searchable-select';
import * as mastersSvc from '@/services/masters';
import { usePermissions } from '@/contexts/permissions-context';

export interface BulkUpdateServiceItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
}

/**
 * One service name owns a code per vehicle model, so hours / rate are edited once
 * for the name and applied to all of its codes.
 */
export function BulkUpdateServiceItemsDialog({
  open,
  onOpenChange,
  onUpdated,
}: BulkUpdateServiceItemsDialogProps) {
  const { mutate } = useSWRConfig();
  const { canEditPrice } = usePermissions();
  const [saving, setSaving] = useState(false);
  const [nameSearch, setNameSearch] = useState('');
  const [serviceItem, setServiceItem] = useState('');
  const [hours, setHours] = useState('');
  const [rate, setRate] = useState('');

  const { data, isLoading } = useSWR(
    open ? ['vehicle-service-item-names', nameSearch] : null,
    () => mastersSvc.listVehicleServiceItemNames({ search: nameSearch || undefined })
  );

  const options = useMemo(
    () =>
      (data?.data || []).map((row) => ({
        value: row.service_item,
        label: row.service_item,
        description: `${row.code_count} code${row.code_count === 1 ? '' : 's'}`,
      })),
    [data]
  );

  const selected = (data?.data || []).find((row) => row.service_item === serviceItem);

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setNameSearch('');
    setServiceItem('');
    setHours('');
    setRate('');
  }, [open]);

  const handleSubmit = async () => {
    if (!serviceItem) {
      toast.error('Select the vehicle service item name');
      return;
    }
    if (!hours.trim() && !rate.trim()) {
      toast.error('Enter hours, rate, or both');
      return;
    }

    setSaving(true);
    try {
      const res = await mastersSvc.bulkUpdateVehicleServiceItems({
        service_item: serviceItem,
        hours: hours.trim() || null,
        rate: rate.trim() || null,
      });
      await mutate(
        (key) => Array.isArray(key) && String(key[0]).includes('vehicle-service-item'),
        undefined,
        { revalidate: true }
      );
      const applied = [
        res.hours != null ? `hours ${res.hours}` : null,
        res.rate != null ? `rate ${res.rate}` : null,
      ]
        .filter(Boolean)
        .join(' · ');
      toast.success(
        `Updated ${res.updated} code${res.updated === 1 ? '' : 's'} of ${res.service_item}${
          applied ? ` — ${applied}` : ''
        }`
      );
      onUpdated?.();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to bulk update service items');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Bulk Update Service Items</DialogTitle>
          <DialogDescription>
            Pick a service name and set hours and/or rate — every code of that name is updated,
            whichever vehicle model it belongs to.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="space-y-1">
            <Label>
              Vehicle Service Item <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              options={options}
              value={serviceItem}
              onValueChange={setServiceItem}
              onSearchChange={setNameSearch}
              placeholder="Search service name…"
              emptyMessage="No service item name found"
              isLoading={isLoading}
              portaled
            />
            <p className="text-xs text-muted-foreground">
              {selected
                ? `Updates all ${selected.code_count} code${
                    selected.code_count === 1 ? '' : 's'
                  } of this name.`
                : 'The name is shared by every model; codes differ per model.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Estimated hours</Label>
              <Input
                inputMode="decimal"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Leave blank to keep"
              />
            </div>
            <div className="space-y-1">
              <Label>{canEditPrice ? 'Rate' : 'Rate (fixed)'}</Label>
              <Input
                inputMode="decimal"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="Leave blank to keep"
                disabled={!canEditPrice}
                className={!canEditPrice ? 'bg-muted' : undefined}
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Blank fields keep their current values.
            {canEditPrice ? '' : ' Your role cannot change rates.'}
          </p>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={saving || !serviceItem}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Update All Codes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
