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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect, type SearchableSelectProps } from '@/components/searchable-select';
import * as stockSvc from '@/services/stockOperations';

export interface SupplierCreatedPayload {
  name: string;
  supplier_name: string;
}

export interface SupplierLinkWithCreateProps
  extends Omit<SearchableSelectProps, 'onCreateNew' | 'createNewLabel'> {
  initialSupplierName?: string;
  onSupplierCreated?: (supplier: SupplierCreatedPayload) => void;
}

export function SupplierLinkWithCreate({
  initialSupplierName,
  onSupplierCreated,
  onValueChange,
  className,
  disabled,
  ...selectProps
}: SupplierLinkWithCreateProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [supplierName, setSupplierName] = useState('');
  const [supplierType, setSupplierType] = useState('Company');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!open) return;
    setSaving(false);
    setSupplierName((initialSupplierName || selectProps.value || '').trim());
    setSupplierType('Company');
    setMobile('');
    setEmail('');
  }, [open, initialSupplierName, selectProps.value]);

  async function handleSubmit() {
    const name = supplierName.trim();
    if (!name) {
      toast.error('Supplier name is required');
      return;
    }

    setSaving(true);
    try {
      const result = await stockSvc.createSupplier({
        supplier_name: name,
        supplier_type: supplierType,
        mobile_no: mobile || undefined,
        email_id: email || undefined,
      });
      const payload: SupplierCreatedPayload = {
        name: result.name,
        supplier_name: result.supplier_name || result.label || result.name,
      };
      onValueChange(payload.name);
      onSupplierCreated?.(payload);
      toast.success(`Created supplier ${payload.supplier_name}`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create supplier');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SearchableSelect
        {...selectProps}
        className={className}
        disabled={disabled}
        onValueChange={onValueChange}
        onCreateNew={disabled ? undefined : () => setOpen(true)}
        createNewLabel="New supplier"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New supplier</DialogTitle>
            <DialogDescription>
              Creates a spare-parts supplier in ERPNext and selects it on this receipt.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Supplier name *</Label>
              <Input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="e.g. ABC Parts Ltd"
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={supplierType} onValueChange={setSupplierType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Company">Company</SelectItem>
                  <SelectItem value="Individual">Individual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Mobile</Label>
              <Input value={mobile} onChange={(e) => setMobile(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
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
