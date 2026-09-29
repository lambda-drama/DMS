'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { SearchableSelect, type SearchableSelectOption } from '@/components/searchable-select';
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
import { fetchCompanies, quickCreateBranch } from '@/services/common';
import { quickCreateCrmBranch } from '@/services/crm';

export type BranchSelectSource = 'dms' | 'crm';

type CreatedBranch = {
  name: string;
  branch: string;
  company?: string | null;
  company_name?: string | null;
};

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  /** Branch is created for this company. When empty, the dialog asks for a company. */
  company?: string;
  options: SearchableSelectOption[];
  isLoading?: boolean;
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  portaled?: boolean;
  valueLabel?: string;
  className?: string;
  source?: BranchSelectSource;
  allowCreate?: boolean;
  onCreated?: (created: CreatedBranch) => void;
};

function isBranchSWRKey(key: unknown): boolean {
  if (typeof key === 'string') {
    return /branch/i.test(key);
  }
  if (Array.isArray(key) && typeof key[0] === 'string') {
    return /branch/i.test(key[0]);
  }
  return false;
}

export function BranchSelect({
  value,
  onValueChange,
  company,
  options,
  isLoading,
  onSearchChange,
  placeholder = 'Select branch…',
  emptyMessage = 'No branches found',
  disabled,
  portaled,
  valueLabel,
  className,
  source = 'dms',
  allowCreate = true,
  onCreated,
}: Props) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newName, setNewName] = useState('');
  const [dialogCompany, setDialogCompany] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');

  const lockedCompany = (company || '').trim();
  const { data: companies, isLoading: companiesLoading } = useSWR(
    open && !lockedCompany ? 'dms-companies-for-branch-select' : null,
    () => fetchCompanies()
  );
  const companyOptions = useMemo(
    () => (companies || []).map((c) => ({ value: c.name, label: c.company_name || c.name })),
    [companies]
  );

  const onCreatedSubmit = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Branch name is required');
      return;
    }
    const forCompany = lockedCompany || dialogCompany.trim();
    if (!forCompany) {
      toast.error('Select a company first');
      return;
    }
    setSaving(true);
    try {
      const payload = { branch: name, company: forCompany };
      const created =
        source === 'crm' ? await quickCreateCrmBranch(payload) : await quickCreateBranch(payload);
      await mutate(isBranchSWRKey, undefined, { revalidate: true });
      setLocalLabel(created.branch || created.name);
      onValueChange(created.name);
      onCreated?.(created);
      setOpen(false);
      setNewName('');
      setDialogCompany('');
      toast.success(`Created: ${created.branch || created.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create branch');
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
        valueLabel={
          (value && (localLabel || valueLabel)) ||
          options.find((o) => o.value === value)?.label ||
          undefined
        }
        portaled={portaled}
        onValueChange={(next) => {
          const opt = options.find((o) => o.value === next);
          setLocalLabel(opt?.label || next || '');
          onValueChange(next || '');
        }}
        onSearchChange={onSearchChange}
        placeholder={placeholder}
        emptyMessage={emptyMessage}
        isLoading={isLoading}
        disabled={disabled}
        onCreateNew={allowCreate && !disabled ? () => setOpen(true) : undefined}
        createNewLabel="Create branch"
      />
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            setNewName('');
            setDialogCompany('');
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New branch</DialogTitle>
            <DialogDescription>
              {lockedCompany
                ? `Creates a branch for ${lockedCompany} and selects it on this form.`
                : 'Creates a branch for a DMS Settings company and selects it on this form.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <Label>Branch name *</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Hargeisa Workshop"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void onCreatedSubmit();
                  }
                }}
              />
            </div>
            {lockedCompany ? (
              <p className="text-xs text-muted-foreground">Company: {lockedCompany}</p>
            ) : (
              <div className="space-y-1">
                <Label>Company *</Label>
                <SearchableSelect
                  options={companyOptions}
                  value={dialogCompany}
                  onValueChange={setDialogCompany}
                  isLoading={companiesLoading}
                  placeholder="Select company…"
                  emptyMessage="No companies in DMS Settings"
                  portaled
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void onCreatedSubmit()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
