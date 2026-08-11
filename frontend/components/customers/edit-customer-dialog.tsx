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
import { fetchCustomerCreateOptions, updateCustomer } from '@/services/crm';

export type EditableCustomer = {
  name: string;
  customer_name?: string;
  customer_type?: string;
  customer_group?: string;
  mobile_no?: string;
  email_id?: string;
  territory?: string;
  tax_id?: string;
  website?: string;
};

export interface EditCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: EditableCustomer | null;
  onUpdated?: (name: string) => void;
}

export function EditCustomerDialog({
  open,
  onOpenChange,
  customer,
  onUpdated,
}: EditCustomerDialogProps) {
  const { mutate } = useSWRConfig();
  const { data: options } = useSWR(
    open ? 'crm-customer-create-options' : null,
    fetchCustomerCreateOptions
  );
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customer_name: '',
    customer_type: 'Individual',
    customer_group: '',
    mobile_no: '',
    email_id: '',
    territory: '',
    tax_id: '',
    website: '',
  });

  useEffect(() => {
    if (!open || !customer) return;
    setForm({
      customer_name: customer.customer_name || '',
      customer_type: customer.customer_type || 'Individual',
      customer_group: customer.customer_group || '',
      mobile_no: customer.mobile_no || '',
      email_id: customer.email_id || '',
      territory: customer.territory || '',
      tax_id: customer.tax_id || '',
      website: customer.website || '',
    });
  }, [open, customer]);

  const typeOptions = useMemo(
    () => (options?.customer_types || ['Individual', 'Company']).map((t) => ({ value: t, label: t })),
    [options]
  );
  const groupOptions = useMemo(
    () => (options?.customer_groups || []).map((g) => ({ value: g, label: g })),
    [options]
  );
  const territoryOptions = useMemo(
    () => (options?.territories || []).map((t) => ({ value: t, label: t })),
    [options]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!customer?.name) return;
    if (!form.customer_name.trim()) {
      toast.error('Customer name is required');
      return;
    }
    setSaving(true);
    try {
      await updateCustomer(customer.name, {
        customer_name: form.customer_name.trim(),
        customer_type: form.customer_type,
        customer_group: form.customer_group || null,
        mobile_no: form.mobile_no.trim() || null,
        email_id: form.email_id.trim() || null,
        territory: form.territory || null,
        tax_id: form.tax_id.trim() || null,
        website: form.website.trim() || null,
      });
      await mutate(
        (key) =>
          (Array.isArray(key) &&
            (key[0] === 'customers' ||
              key[0] === 'customers-paginated' ||
              key[0] === 'crm-customers' ||
              key[0] === 'crm-customer-360' ||
              key[0] === 'customer-360')) ||
          key === 'customers',
        undefined,
        { revalidate: true }
      );
      toast.success('Customer updated');
      onUpdated?.(customer.name);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update customer');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
            <DialogDescription>
              Update customer master details used across DMS and CRM.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="space-y-1">
              <Label>Customer name *</Label>
              <Input
                value={form.customer_name}
                onChange={(e) => setForm((p) => ({ ...p, customer_name: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Type</Label>
                <SearchableSelect
                  options={typeOptions}
                  value={form.customer_type}
                  onValueChange={(v) => setForm((p) => ({ ...p, customer_type: v }))}
                  placeholder="Type"
                />
              </div>
              <div className="space-y-1">
                <Label>Customer group</Label>
                <SearchableSelect
                  options={groupOptions}
                  value={form.customer_group}
                  onValueChange={(v) => setForm((p) => ({ ...p, customer_group: v }))}
                  placeholder="Group"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input
                  type="tel"
                  value={form.mobile_no}
                  onChange={(e) => setForm((p) => ({ ...p, mobile_no: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={form.email_id}
                  onChange={(e) => setForm((p) => ({ ...p, email_id: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Territory</Label>
              <SearchableSelect
                options={territoryOptions}
                value={form.territory}
                onValueChange={(v) => setForm((p) => ({ ...p, territory: v }))}
                placeholder="Territory"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Tax ID</Label>
                <Input
                  value={form.tax_id}
                  onChange={(e) => setForm((p) => ({ ...p, tax_id: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Website</Label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
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
