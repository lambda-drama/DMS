'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { listContacts, quickCreateContact } from '@/services/crm';
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
  onValueChange: (value: string, label?: string, meta?: { mobile?: string }) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
};

/** Searchable ERPNext Contact picker with + create for CRM forms. */
export function CrmContactLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search contacts…',
  disabled,
  className,
  allowCreate = true,
}: Props) {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const { data, isLoading } = useSWR(['crm-link-contacts', search], () =>
    listContacts({ search: search || undefined, limit: 50 })
  );

  const options = useMemo(
    () =>
      ((data as { data?: Record<string, unknown>[] } | undefined)?.data || []).map((c) => {
        const name = [c.first_name, c.last_name].filter(Boolean).join(' ') || String(c.name);
        return {
          value: String(c.name),
          label: name,
          description: [c.mobile_no || c.phone, c.email_id, c.name]
            .filter(Boolean)
            .map(String)
            .join(' · '),
          mobile: String(c.mobile_no || c.phone || ''),
        };
      }),
    [data]
  );

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  const onCreated = async () => {
    if (!firstName.trim() && !lastName.trim()) {
      toast.error('First name or last name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await quickCreateContact({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile_no: mobile.trim() || undefined,
        email_id: email.trim() || undefined,
      });
      await mutate(
        (key) => Array.isArray(key) && String(key[0]).includes('contact'),
        undefined,
        { revalidate: true }
      );
      setLocalLabel(res.label || res.name);
      onValueChange(res.name, res.label, { mobile: res.mobile || mobile.trim() });
      setOpen(false);
      setFirstName('');
      setLastName('');
      setMobile('');
      setEmail('');
      toast.success(`Created: ${res.label || res.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create contact');
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
          const label = opt?.label || '';
          setLocalLabel(label);
          onValueChange(next, label || undefined, { mobile: opt?.mobile });
        }}
        onSearchChange={setSearch}
        placeholder={placeholder}
        emptyMessage="No contacts found"
        isLoading={isLoading}
        disabled={disabled}
        onCreateNew={allowCreate && !disabled ? () => setOpen(true) : undefined}
        createNewLabel="Create contact"
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>New contact</DialogTitle>
            <DialogDescription>Creates a Contact and selects it on this form.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>First name</Label>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
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
            <Button type="button" onClick={() => void onCreated()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
