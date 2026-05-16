'use client';

import { cloneElement, isValidElement, useEffect, useState } from 'react';
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
import { cn } from '@/lib/utils';
import { fetchVehicleCustomerGroups } from '@/services/common';
import { quickCreateDoc, type QuickCreateDocType } from '@/services/quickCreate';

function invalidateAfterCreate(
  mutate: ReturnType<typeof useSWRConfig>['mutate'],
  doctype: QuickCreateDocType
) {
  return mutate(
    (key) => {
      if (typeof key === 'string') {
        if (doctype === 'Customer' && key === 'customers-paginated') return true;
        if (doctype === 'Service Advisor' && key === 'service-advisors') return true;
        if (doctype === 'Technician' && key === 'technicians') return true;
        return false;
      }
      if (Array.isArray(key) && typeof key[0] === 'string') {
        const k0 = key[0];
        if (doctype === 'Customer' && (k0 === 'customers' || k0 === 'customers-paginated')) return true;
        if (doctype === 'Color' && k0 === 'colors') return true;
        if (doctype === 'Vehicle Service Type' && k0 === 'vehicle-service-types') return true;
        if (doctype === 'Technician' && (k0 === 'technicians' || k0 === 'technicians-list')) return true;
      }
      return false;
    },
    undefined,
    { revalidate: true }
  );
}

const TECH_SKILL_LEVELS = [
  'Trainee',
  'Junior',
  'Intermediate',
  'Senior',
  'Master Technician',
  'EV/PHEV Certified',
  'Expert',
] as const;

const TECH_LABOR_GROUPS = [
  'Standard',
  'Senior',
  'Specialist',
  'Warranty',
  'Internal',
  'Training',
] as const;

export interface LinkWithCreateProps {
  doctype: QuickCreateDocType;
  onCreated: (name: string, label?: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function LinkWithCreate({
  doctype,
  onCreated,
  children,
  className,
  disabled = false,
}: LinkWithCreateProps) {
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [customerName, setCustomerName] = useState('');
  const [customerType, setCustomerType] = useState('Individual');
  const [customerGroup, setCustomerGroup] = useState('');
  const [customerGroups, setCustomerGroups] = useState<string[]>([]);
  const [customerMobile, setCustomerMobile] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [colorName, setColorName] = useState('');

  const [advFirst, setAdvFirst] = useState('');
  const [advLast, setAdvLast] = useState('');
  const [advPhone, setAdvPhone] = useState('');
  const [advEmail, setAdvEmail] = useState('');

  const [svcName, setSvcName] = useState('');
  const [svcDesc, setSvcDesc] = useState('');
  const [svcHours, setSvcHours] = useState('');

  const [techFirst, setTechFirst] = useState('');
  const [techLast, setTechLast] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [techDoj, setTechDoj] = useState('');
  const [techSkill, setTechSkill] = useState<string>(TECH_SKILL_LEVELS[1]);
  const [techLabor, setTechLabor] = useState<string>(TECH_LABOR_GROUPS[0]);

  useEffect(() => {
    if (!open) return;
    setSaving(false);

    if (doctype === 'Customer') {
      setCustomerName('');
      setCustomerType('Individual');
      setCustomerMobile('');
      setCustomerEmail('');
      let cancelled = false;
      (async () => {
        try {
          const g = await fetchVehicleCustomerGroups();
          if (cancelled) return;
          setCustomerGroups(g);
          setCustomerGroup(g[0] || '');
        } catch {
          if (!cancelled) {
            setCustomerGroups([]);
            setCustomerGroup('');
          }
        }
      })();
      return () => {
        cancelled = true;
      };
    }

    if (doctype === 'Color') {
      setColorName('');
    } else if (doctype === 'Service Advisor') {
      setAdvFirst('');
      setAdvLast('');
      setAdvPhone('');
      setAdvEmail('');
    } else if (doctype === 'Vehicle Service Type') {
      setSvcName('');
      setSvcDesc('');
      setSvcHours('');
    } else if (doctype === 'Technician') {
      setTechFirst('');
      setTechLast('');
      setTechPhone('');
      setTechDoj('');
      setTechSkill(TECH_SKILL_LEVELS[1]);
      setTechLabor(TECH_LABOR_GROUPS[0]);
    }
    return undefined;
  }, [open, doctype]);

  async function handleSubmit() {
    setSaving(true);
    try {
      let values: Record<string, unknown> = {};
      if (doctype === 'Customer') {
        values = {
          customer_name: customerName,
          customer_type: customerType,
          customer_group: customerGroup || customerGroups[0] || '',
          mobile_no: customerMobile || undefined,
          email_id: customerEmail || undefined,
        };
        if (!customerName.trim()) {
          toast.error('Customer name is required');
          setSaving(false);
          return;
        }
        if (!customerGroups.length) {
          toast.error('Configure vehicle customer groups in ERPNext first');
          setSaving(false);
          return;
        }
      } else if (doctype === 'Color') {
        values = { color_name: colorName };
        if (!colorName.trim()) {
          toast.error('Color name is required');
          setSaving(false);
          return;
        }
      } else if (doctype === 'Service Advisor') {
        values = {
          first_name: advFirst,
          last_name: advLast,
          phone: advPhone,
          email: advEmail,
        };
        if (!advFirst.trim() || !advLast.trim() || !advPhone.trim() || !advEmail.trim()) {
          toast.error('First name, last name, phone, and email are required');
          setSaving(false);
          return;
        }
      } else if (doctype === 'Vehicle Service Type') {
        values = {
          service_type_name: svcName,
          description: svcDesc || undefined,
          default_estimated_hours: svcHours ? parseFloat(svcHours) : undefined,
        };
        if (!svcName.trim()) {
          toast.error('Service type name is required');
          setSaving(false);
          return;
        }
      } else if (doctype === 'Technician') {
        values = {
          first_name: techFirst,
          last_name: techLast,
          personal_phone: techPhone,
          date_of_joining: techDoj || undefined,
          skill_level: techSkill,
          labor_rate_group: techLabor,
        };
        if (!techFirst.trim() || !techPhone.trim()) {
          toast.error('First name and phone are required');
          setSaving(false);
          return;
        }
      }

      const res = await quickCreateDoc(doctype, values);
      const display = res.label?.trim() || res.name?.trim();
      if (!res.name?.trim()) {
        toast.error('Create failed: server did not return a document name');
        return;
      }
      await invalidateAfterCreate(mutate, doctype);
      onCreated(res.name, res.label);
      toast.success(display ? `Created: ${display}` : `Created ${doctype}`);
      setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not create record');
    } finally {
      setSaving(false);
    }
  }

  const titles: Record<QuickCreateDocType, string> = {
    Customer: 'New customer',
    Color: 'New color',
    'Service Advisor': 'New service advisor',
    'Vehicle Service Type': 'New vehicle service type',
    Technician: 'New technician',
  };

  const childDisabled =
    isValidElement(children) && Boolean((children as React.ReactElement<{ disabled?: boolean }>).props?.disabled);
  const canCreate = !disabled && !childDisabled;

  const childWithCreate =
    isValidElement(children) && canCreate
      ? cloneElement(
          children as React.ReactElement<{
            onCreateNew?: () => void;
            createNewLabel?: string;
            className?: string;
          }>,
          {
            onCreateNew: () => setOpen(true),
            createNewLabel: `New ${doctype}`,
            className: cn(className, (children as React.ReactElement).props?.className),
          }
        )
      : isValidElement(children)
        ? cloneElement(children as React.ReactElement<{ className?: string }>, {
            className: cn(className, (children as React.ReactElement).props?.className),
          })
        : children;

  return (
    <>
      {childWithCreate}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{titles[doctype]}</DialogTitle>
            <DialogDescription>
              Creates the record in ERPNext and selects it in this form.
            </DialogDescription>
          </DialogHeader>

          {doctype === 'Customer' && (
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Customer name *</Label>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Type</Label>
                  <Select value={customerType} onValueChange={setCustomerType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Individual">Individual</SelectItem>
                      <SelectItem value="Company">Company</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Customer group *</Label>
                  <Select
                    value={customerGroup || customerGroups[0] || ''}
                    onValueChange={setCustomerGroup}
                    disabled={!customerGroups.length}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Group" />
                    </SelectTrigger>
                    <SelectContent>
                      {customerGroups.map((g) => (
                        <SelectItem key={g} value={g}>
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1">
                <Label>Mobile</Label>
                <Input value={customerMobile} onChange={(e) => setCustomerMobile(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
              </div>
            </div>
          )}

          {doctype === 'Color' && (
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Color name *</Label>
                <Input
                  value={colorName}
                  onChange={(e) => setColorName(e.target.value)}
                  placeholder="e.g. Pearl White"
                />
              </div>
            </div>
          )}

          {doctype === 'Service Advisor' && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>First name *</Label>
                  <Input value={advFirst} onChange={(e) => setAdvFirst(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Last name *</Label>
                  <Input value={advLast} onChange={(e) => setAdvLast(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Phone *</Label>
                <Input value={advPhone} onChange={(e) => setAdvPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input type="email" value={advEmail} onChange={(e) => setAdvEmail(e.target.value)} />
              </div>
            </div>
          )}

          {doctype === 'Vehicle Service Type' && (
            <div className="grid gap-3 py-2">
              <div className="space-y-1">
                <Label>Service type name *</Label>
                <Input value={svcName} onChange={(e) => setSvcName(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Description</Label>
                <Input value={svcDesc} onChange={(e) => setSvcDesc(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Default hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={svcHours}
                  onChange={(e) => setSvcHours(e.target.value)}
                />
              </div>
            </div>
          )}

          {doctype === 'Technician' && (
            <div className="grid gap-3 py-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>First name *</Label>
                  <Input value={techFirst} onChange={(e) => setTechFirst(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>Last name</Label>
                  <Input value={techLast} onChange={(e) => setTechLast(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Personal phone *</Label>
                <Input value={techPhone} onChange={(e) => setTechPhone(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Date of joining</Label>
                <Input type="date" value={techDoj} onChange={(e) => setTechDoj(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Skill level</Label>
                  <Select value={techSkill} onValueChange={setTechSkill}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TECH_SKILL_LEVELS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Labor rate group</Label>
                  <Select value={techLabor} onValueChange={setTechLabor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TECH_LABOR_GROUPS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create & select'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export type { QuickCreateDocType } from '@/services/quickCreate';