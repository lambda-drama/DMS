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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiRequest } from '@/services/apiClient';
import * as stockSvc from '@/services/stockOperations';

interface CreateSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (itemCode: string, itemName: string) => void;
}

interface MastersOptions {
  item_groups?: string[];
}

export function CreateSparePartDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSparePartDialogProps) {
  const [saving, setSaving] = useState(false);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemGroup, setItemGroup] = useState('');
  const [itemGroupOptions, setItemGroupOptions] = useState<string[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [uom, setUom] = useState('Pcs');
  const [standardRate, setStandardRate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingGroups(true);
    apiRequest<MastersOptions>('/api/method/dms.api.masters.get_masters_options', {
      method: 'POST',
      body: JSON.stringify({}),
    })
      .then((res) => {
        const groups = (res?.item_groups || []).filter(Boolean) as string[];
        setItemGroupOptions(groups);
        setItemGroup((prev) => {
          if (prev && groups.includes(prev)) return prev;
          if (groups.includes('Spare Parts')) return 'Spare Parts';
          return groups[0] || '';
        });
      })
      .catch(() => {
        setItemGroupOptions(['Spare Parts']);
        setItemGroup('Spare Parts');
      })
      .finally(() => setLoadingGroups(false));
  }, [open]);

  const handleClose = () => {
    if (!saving) {
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setItemCode('');
    setItemName('');
    setItemGroup('');
    setUom('Pcs');
    setStandardRate('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!itemCode.trim()) {
      toast.error('Item code is required');
      return;
    }
    if (!itemName.trim()) {
      toast.error('Item name is required');
      return;
    }
    if (!itemGroup) {
      toast.error('Select an item group');
      return;
    }

    setSaving(true);
    try {
      const result = await stockSvc.createStockItem({
        item_code: itemCode.trim(),
        item_name: itemName.trim(),
        item_group: itemGroup,
        stock_uom: uom,
        ...(standardRate ? { standard_rate: parseFloat(standardRate) } : {}),
      });

      toast.success(`Spare part "${itemName}" created successfully`);
      onCreated?.(itemCode.trim(), itemName.trim());
      handleClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create spare part';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Spare Part</DialogTitle>
          <DialogDescription>
            Create a new spare part item in the inventory system.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Item Code <span className="text-destructive">*</span>
              </Label>
              <Input
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                placeholder="e.g., SP-12345"
              />
            </div>
            <div className="space-y-2">
              <Label>
                Item Name <span className="text-destructive">*</span>
              </Label>
              <Input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Brake Pad"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Item Group</Label>
              <Select value={itemGroup || undefined} onValueChange={setItemGroup} disabled={loadingGroups}>
                <SelectTrigger>
                  {loadingGroups ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
                </SelectTrigger>
                <SelectContent>
                  {itemGroupOptions.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit of Measure</Label>
              <Select value={uom} onValueChange={setUom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pcs">Pcs</SelectItem>
                  <SelectItem value="Nos">Nos</SelectItem>
                  <SelectItem value="Set">Set</SelectItem>
                  <SelectItem value="Pair">Pair</SelectItem>
                  <SelectItem value="Ltr">Ltr</SelectItem>
                  <SelectItem value="Kg">Kg</SelectItem>
                  <SelectItem value="Box">Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Standard Rate</Label>
            <Input
              type="number"
              step="any"
              min="0"
              value={standardRate}
              onChange={(e) => setStandardRate(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Part description..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving || loadingGroups}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Spare Part'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}