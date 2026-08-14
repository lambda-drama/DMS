'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetchCrmBrands, quickCreateBrand } from '@/services/crm';
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
  onValueChange: (value: string) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
};

export function CrmBrandLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search brand…',
  disabled,
  className,
  allowCreate = true,
}: Props) {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const { data, isLoading } = useSWR(['crm-link-brands', search], () =>
    fetchCrmBrands(search || undefined)
  );

  const options = useMemo(
    () =>
      (data || []).map((b) => ({
        value: String(b.name),
        label: String(b.label || b.name),
      })),
    [data]
  );

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  const onCreated = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Brand name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await quickCreateBrand(name);
      await mutate(
        (key) => Array.isArray(key) && String(key[0]).includes('brand'),
        undefined,
        { revalidate: true }
      );
      setLocalLabel(res.label || res.name);
      onValueChange(res.name);
      setOpen(false);
      setNewName('');
      toast.success(`Created: ${res.label || res.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create brand');
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
          onValueChange(next || '');
        }}
        onSearchChange={setSearch}
        placeholder={placeholder}
        emptyMessage="No brands found"
        isLoading={isLoading}
        disabled={disabled}
        onCreateNew={allowCreate && !disabled ? () => setOpen(true) : undefined}
        createNewLabel="Create brand"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New brand</DialogTitle>
            <DialogDescription>Creates a Brand master and selects it on this form.</DialogDescription>
          </DialogHeader>
          <div className="space-y-1 py-2">
            <Label>Brand name *</Label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Jetour"
            />
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
