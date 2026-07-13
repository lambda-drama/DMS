'use client';

import { useState } from 'react';
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

interface CreateSparePartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (itemCode: string, itemName: string) => void;
}

export function CreateSparePartDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateSparePartDialogProps) {
  const [saving, setSaving] = useState(false);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemGroup, setItemGroup] = useState('Spare Parts');
  const [uom, setUom] = useState('Nos');
  const [standardRate, setStandardRate] = useState('');
  const [description, setDescription] = useState('');

  const handleClose = () => {
    if (!saving) {
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setItemCode('');
    setItemName('');
    setItemGroup('Spare Parts');
    setUom('Nos');
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

    setSaving(true);
    try {
      const payload = {
        doctype: 'Item',
        item_code: itemCode.trim(),
        item_name: itemName.trim(),
        item_group: itemGroup,
        stock_uom: uom,
        is_stock_item: 1,
        include_item_in_manufacturing: 0,
        description: description.trim() || itemName.trim(),
        ...(standardRate ? { standard_rate: parseFloat(standardRate) } : {}),
      };

      await apiRequest('/api/resource/Item', {
        method: 'POST',
        body: JSON.stringify(payload),
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
              <Select value={itemGroup} onValueChange={setItemGroup}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Spare Parts">Spare Parts</SelectItem>
                  <SelectItem value="Consumables">Consumables</SelectItem>
                  <SelectItem value="Service Parts">Service Parts</SelectItem>
                  <SelectItem value="Accessories">Accessories</SelectItem>
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
                  <SelectItem value="Nos">Nos</SelectItem>
                  <SelectItem value="Pcs">Pcs</SelectItem>
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
              step="0.01"
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
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Spare Part'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
