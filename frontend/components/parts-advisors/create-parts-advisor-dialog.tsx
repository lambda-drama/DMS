'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
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
import { quickCreateDoc } from '@/services/quickCreate';
import * as partsAdvisorsSvc from '@/services/partsAdvisors';
import type { PartsAdvisorFull, PartsAdvisorListItem } from '@/services/partsAdvisors';

const STATUSES = ['Active', 'Inactive', 'On Leave'] as const;

type AdvisorSeed = Partial<PartsAdvisorFull | PartsAdvisorListItem> & { name?: string };

export interface CreatePartsAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (name: string, label?: string) => void;
  advisor?: AdvisorSeed | null;
  onUpdated?: (name: string) => void;
}

export function CreatePartsAdvisorDialog({
  open,
  onOpenChange,
  onCreated,
  advisor,
  onUpdated,
}: CreatePartsAdvisorDialogProps) {
  const { mutate } = useSWRConfig();
  const isEdit = Boolean(advisor?.name);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('Active');

  useEffect(() => {
    if (!open) return;
    if (advisor?.name) {
      setFirstName(advisor.first_name || '');
      setLastName(advisor.last_name || '');
      setPhone(advisor.phone || '');
      setEmail(advisor.email || '');
      setStatus(advisor.status || 'Active');
      return;
    }
    setFirstName('');
    setLastName('');
    setPhone('');
    setEmail('');
    setStatus('Active');
  }, [open, advisor]);

  async function revalidate() {
    await mutate(
      (key) =>
        key === 'parts-advisors' ||
        key === 'parts-advisors-list' ||
        (Array.isArray(key) &&
          (key[0] === 'parts-advisors-list' || key[0] === 'parts-advisor')),
      undefined,
      { revalidate: true }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !phone.trim() || !email.trim()) {
      toast.error('First name, last name, phone, and email are required');
      return;
    }
    setSaving(true);
    try {
      if (isEdit && advisor?.name) {
        await partsAdvisorsSvc.updatePartsAdvisor(advisor.name, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          status,
        });
        await revalidate();
        toast.success('Parts advisor updated');
        onUpdated?.(advisor.name);
        onOpenChange(false);
        return;
      }

      const res = await quickCreateDoc('Parts Advisor', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
      });
      await revalidate();
      toast.success(`Parts advisor ${res.label || res.name} created`);
      onCreated?.(res.name, res.label);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error
          ? err.message
          : isEdit
            ? 'Failed to update parts advisor'
            : 'Failed to create parts advisor'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit parts advisor' : 'New parts advisor'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? 'Update parts advisor contact and status details.'
                : 'Add a parts advisor for counter sales and parts requisitions.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>First name *</Label>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <Label>Last name *</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Phone *</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Email *</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            {isEdit ? (
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
