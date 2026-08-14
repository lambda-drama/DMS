'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetchCrmTerritories, quickCreateTerritory } from '@/services/crm';
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

/** Territory master picker — Link field with + to create if missing. */
export function CrmTerritoryLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search territory…',
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
  const [parent, setParent] = useState('');
  const { data, isLoading } = useSWR(['crm-link-territories', search], () =>
    fetchCrmTerritories(search || undefined)
  );
  const { data: groups } = useSWR(open ? ['crm-link-territory-groups'] : null, () =>
    fetchCrmTerritories(undefined, 1)
  );

  const options = useMemo(
    () =>
      (data || []).map((t) => ({
        value: String(t.name),
        label: String(t.label || t.name),
        description: t.parent_territory ? String(t.parent_territory) : undefined,
      })),
    [data]
  );
  const parentOptions = useMemo(
    () =>
      (groups || []).map((t) => ({
        value: String(t.name),
        label: String(t.label || t.name),
      })),
    [groups]
  );

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  const onCreated = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Territory name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await quickCreateTerritory(name, parent || undefined);
      await mutate(
        (key) => Array.isArray(key) && String(key[0]).startsWith('crm-link-territor'),
        undefined,
        { revalidate: true }
      );
      setLocalLabel(res.label || res.name);
      onValueChange(res.name);
      setOpen(false);
      setNewName('');
      toast.success(`Created: ${res.label || res.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create territory');
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
        emptyMessage="No territories found"
        isLoading={isLoading}
        disabled={disabled}
        onCreateNew={allowCreate && !disabled ? () => setOpen(true) : undefined}
        createNewLabel="Create territory"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New territory</DialogTitle>
            <DialogDescription>
              Creates a Territory master and selects it on this form.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Territory name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Manama"
              />
            </div>
            {parentOptions.length ? (
              <div className="space-y-1">
                <Label>Parent territory</Label>
                <SearchableSelect
                  options={parentOptions}
                  value={parent}
                  onValueChange={setParent}
                  placeholder="Optional parent…"
                />
              </div>
            ) : null}
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
