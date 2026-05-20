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

const SKILL_LEVELS = [
  'Trainee',
  'Junior',
  'Intermediate',
  'Senior',
  'Master Technician',
  'EV/PHEV Certified',
  'Expert',
] as const;

const LABOR_RATE_GROUPS = [
  'Standard',
  'Senior',
  'Specialist',
  'Warranty',
  'Internal',
  'Training',
] as const;

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export interface CreateTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (name: string, label?: string) => void;
}

export function CreateTechnicianDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateTechnicianDialogProps) {
  const { mutate } = useSWRConfig();
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState(todayISO);
  const [skillLevel, setSkillLevel] = useState<string>('Junior');
  const [laborRateGroup, setLaborRateGroup] = useState<string>('Standard');

  useEffect(() => {
    if (!open) return;
    setFirstName('');
    setLastName('');
    setPhone('');
    setDateOfJoining(todayISO());
    setSkillLevel('Junior');
    setLaborRateGroup('Standard');
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !phone.trim()) {
      toast.error('First name and personal phone are required');
      return;
    }
    setSaving(true);
    try {
      const res = await quickCreateDoc('Technician', {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        personal_phone: phone.trim(),
        date_of_joining: dateOfJoining || todayISO(),
        skill_level: skillLevel,
        labor_rate_group: laborRateGroup,
      });
      await mutate(
        (key) => {
          if (typeof key === 'string' && key === 'technicians') return true;
          if (Array.isArray(key) && typeof key[0] === 'string') {
            const k0 = key[0];
            return (
              k0 === 'technicians' ||
              k0 === 'technicians-list' ||
              k0 === 'technicians-availability'
            );
          }
          return false;
        },
        undefined,
        { revalidate: true }
      );
      toast.success(`Technician ${res.label || res.name} created`);
      onCreated?.(res.name, res.label);
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create technician');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New technician</DialogTitle>
            <DialogDescription>
              Add a technician for job cards, scheduling, and workshop assignments.
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
                <Label>Last name</Label>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Personal phone *</Label>
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Date of joining</Label>
              <Input
                type="date"
                value={dateOfJoining}
                onChange={(e) => setDateOfJoining(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Skill level</Label>
                <Select value={skillLevel} onValueChange={setSkillLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_LEVELS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Labor rate group</Label>
                <Select value={laborRateGroup} onValueChange={setLaborRateGroup}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LABOR_RATE_GROUPS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
