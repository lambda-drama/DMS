'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { createCustomer, fetchCustomerCreateOptions } from '@/services/crm';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmTerritoryLink } from '@/components/crm/crm-territory-link';
import { Loader2 } from 'lucide-react';

export type CreateCustomerDefaults = {
  customer_name?: string;
  customer_type?: string;
  customer_group?: string;
  mobile_no?: string;
  email_id?: string;
  territory?: string;
  tax_id?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaults?: CreateCustomerDefaults;
  onCreated: (name: string, label: string) => void;
};

export function CreateCustomerDialog({ open, onOpenChange, defaults, onCreated }: Props) {
  const { data: options, isLoading: optionsLoading } = useSWR(
    open ? 'crm-customer-create-options' : null,
    fetchCustomerCreateOptions
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({
    customer_name: '',
    customer_type: 'Individual',
    customer_group: '',
    mobile_no: '',
    email_id: '',
    territory: '',
    tax_id: '',
  });

  // Apply lead/parent defaults only when the dialog opens (not on every parent re-render).
  useEffect(() => {
    if (!open) return;
    setError('');
    setDuplicates([]);
    setForm({
      customer_name: defaults?.customer_name || '',
      customer_type: defaults?.customer_type || 'Individual',
      customer_group: defaults?.customer_group || '',
      mobile_no: defaults?.mobile_no || '',
      email_id: defaults?.email_id || '',
      territory: defaults?.territory || '',
      tax_id: defaults?.tax_id || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only on open
  }, [open]);

  useEffect(() => {
    if (!open || !options) return;
    setForm((prev) => ({
      ...prev,
      customer_group: prev.customer_group || options.default_customer_group || '',
      customer_type: prev.customer_type || options.customer_types?.[0] || 'Individual',
    }));
  }, [open, options]);

  const typeOptions = useMemo(
    () => (options?.customer_types || ['Individual', 'Company']).map((t) => ({ value: t, label: t })),
    [options]
  );
  const groupOptions = useMemo(
    () => (options?.customer_groups || []).map((g) => ({ value: g, label: g })),
    [options]
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async (force = false) => {
    setError('');
    if (!form.customer_name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!form.customer_group) {
      setError('Select a DMS customer group.');
      return;
    }
    setSaving(true);
    try {
      const result = await createCustomer(
        {
          customer_name: form.customer_name.trim(),
          customer_type: form.customer_type,
          customer_group: form.customer_group,
          mobile_no: form.mobile_no.trim() || undefined,
          email_id: form.email_id.trim() || undefined,
          territory: form.territory || undefined,
          tax_id: form.tax_id.trim() || undefined,
        },
        force
      );

      if (result?.error === 'possible_duplicates') {
        setDuplicates(result.duplicates || []);
        setError(result.message || 'Possible duplicate customers found.');
        return;
      }

      const name = result?.name;
      if (!name) {
        setError('Customer was created but no id was returned.');
        return;
      }
      onCreated(name, result.customer_name || form.customer_name.trim() || name);
      onOpenChange(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create customer</DialogTitle>
          <DialogDescription>
            Create an ERPNext customer here, then continue without leaving this page.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <label className="text-xs font-medium text-muted-foreground">Customer name</label>
            <Input
              value={form.customer_name}
              onChange={(e) => set('customer_name', e.target.value)}
              placeholder="Legal or display name"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={typeOptions}
              value={form.customer_type}
              onValueChange={(v) => set('customer_type', v || 'Individual')}
              placeholder="Select type…"
              isLoading={optionsLoading}
              portaled
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Customer group</label>
            <SearchableSelect
              options={groupOptions}
              value={form.customer_group}
              onValueChange={(v) => set('customer_group', v || '')}
              placeholder="Search customer group…"
              emptyMessage="No DMS customer groups configured"
              isLoading={optionsLoading}
              portaled
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Mobile</label>
            <Input value={form.mobile_no} onChange={(e) => set('mobile_no', e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              value={form.email_id}
              onChange={(e) => set('email_id', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Territory</label>
            <CrmTerritoryLink
              value={form.territory}
              onValueChange={(v) => set('territory', v)}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tax ID</label>
            <Input value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {duplicates.length > 0 ? (
          <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
            <p className="text-sm font-medium">Possible duplicates</p>
            <ul className="space-y-2 text-sm">
              {duplicates.map((d) => (
                <li key={String(d.name)} className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{String(d.customer_name || d.name)}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[d.mobile_no, d.email_id, d.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      onCreated(String(d.name), String(d.customer_name || d.name));
                      onOpenChange(false);
                    }}
                  >
                    Use this
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={saving}
              onClick={() => void onSave(true)}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create anyway
            </Button>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void onSave(false)} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
