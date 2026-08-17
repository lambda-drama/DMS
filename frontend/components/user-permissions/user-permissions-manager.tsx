'use client';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/searchable-select';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Plus, Pencil, Trash2, Search, Users, ChevronDown } from 'lucide-react';
import * as svc from '@/services/userPermissions';

const SECTION_FIELDS = [
  ['view_executive_report', 'Executive Report'],
  ['view_workshop', 'Workshop Report'],
  ['view_service_advisor_report', 'Service Advisor Report'],
  ['view_technician_report', 'Technician Report'],
  ['view_parts_and_inventory', 'Parts & Inventory'],
  ['view_warranty', 'Warranty'],
  ['view_quality_control', 'Quality Control'],
  ['view_customer_and_crm', 'Customer & CRM'],
  ['view_finance', 'Finance'],
  ['view_compliance', 'Compliance'],
] as const;

export function UserPermissionsManager() {
  const { data, isLoading, mutate } = useSWR('up-settings', () => svc.getUserPermissionSettings());
  const [search, setSearch] = useState('');
  const [row, setRow] = useState<svc.UserPermissionRow | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const rows = data?.permission_rows || [];
  const whitelist = data?.whitelisted_users || [];
  const filtered = rows.filter(r => !search || ((r.user || '') + ' ' + (r.full_name || '')).toLowerCase().includes(search.toLowerCase()));

  function save(payload: Record<string, unknown>) {
    setSaving(true);
    svc.saveUserPermission(payload).then(() => {
      toast.success('Permission saved'); setOpen(false); void mutate();
    }).catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to save'))
      .finally(() => setSaving(false));
  }
  function remove(r: svc.UserPermissionRow) {
    svc.deleteUserPermission(r.name).then(() => { toast.success('Permission removed'); void mutate(); })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to delete'));
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">User Permissions</h1>
          <p className="text-muted-foreground">DMS CRM User Settings — per-user access control</p>
        </div>
        <Button onClick={() => { setRow(null); setOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" /> Add Permission
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search user…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>
            : filtered.length === 0 ? <p className="text-sm text-muted-foreground text-center py-12">No permission rows found</p>
              : <div className="space-y-2">
                {filtered.map((r) => (
                  <div key={r.name} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold">{r.full_name || r.user}</span>
                        <span className="text-xs text-muted-foreground font-mono">{r.user}</span>
                        {r.access_limited_to === 'DMS' ? <Badge variant="outline">DMS Only</Badge>
                          : r.access_limited_to === 'CRM' ? <Badge variant="outline">CRM Only</Badge>
                            : <Badge variant="outline">DMS + CRM</Badge>}
                        {r.can_edit_price ? <Badge variant="secondary">Edit Price</Badge> : null}
                        {r.can_view_dms_dashboard ? <Badge variant="secondary">Dashboard</Badge> : null}
                        {r.can_view_dms_report ? <Badge variant="secondary">Reports</Badge> : null}
                      </div>
                      {r.can_view_dms_report ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {SECTION_FIELDS.filter(([k]) => r[k as keyof svc.UserPermissionRow]).map(([k, label]) => (
                            <Badge key={k} variant="outline" className="text-[10px] px-1.5">{label}</Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button variant="ghost" size="icon" onClick={() => { setRow(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => void remove(r)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>}
        </CardContent>
      </Card>
      {open && <Dialog row={row} whitelist={whitelist} saving={saving} onClose={() => setOpen(false)} onSave={save} />}
    </div>
  );
}

function Dialog({ row, whitelist, saving, onClose, onSave }: {
  row: svc.UserPermissionRow | null; whitelist: { user: string; full_name?: string }[];
  saving: boolean; onClose: () => void; onSave: (d: Record<string, unknown>) => void;
}) {
  const [user, setUser] = useState(row?.user || '');
  const [access, setAccess] = useState(row?.access_limited_to || 'both');
  const [flags, setFlags] = useState<Record<string, boolean>>(() => {
    const f: Record<string, boolean> = {
      can_edit_price: false, can_view_dms_dashboard: false, can_view_dms_report: false, lead_sales_person: false
    };
    if (row) {
      f.can_edit_price = !!row.can_edit_price;
      f.can_view_dms_dashboard = !!row.can_view_dms_dashboard;
      f.can_view_dms_report = !!row.can_view_dms_report;
      f.lead_sales_person = !!row.lead_sales_person;
      for (const [k] of SECTION_FIELDS) f[k] = !!row[k as keyof svc.UserPermissionRow];
    }
    return f;
  });
  const [reportsOpen, setReportsOpen] = useState(Boolean(row?.can_view_dms_report));
  const opts = useMemo(() => whitelist.map(u => ({ value: u.user, label: u.full_name || u.user })), [whitelist]);
  const toggle = (k: string, v: boolean) => setFlags(f => ({ ...f, [k]: v }));
  const submit = () => {
    if (!user) { toast.error('Select a user'); return; }
    onSave({
      ...(row?.name ? { name: row.name } : {}),
      user,
      access_limited_to: access === 'both' ? '' : access,
      ...flags
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-lg bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold mb-4">{row ? 'Edit User Permission' : 'Add User Permission'}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>User *</Label>
            <SearchableSelect options={opts} value={user} onValueChange={setUser} placeholder="Select whitelisted user…" disabled={!!row} />
            <p className="text-xs text-muted-foreground">Only users in the DMS CRM User Settings whitelist are shown here.</p>
          </div>

          <div className="space-y-2">
            <Label>Workspace Access</Label>
            <Select value={access} onValueChange={setAccess}>
              <SelectTrigger>
                <SelectValue placeholder="Access to DMS and CRM workspaces" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Access to DMS and CRM</SelectItem>
                <SelectItem value="DMS">DMS only</SelectItem>
                <SelectItem value="CRM">CRM only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Choose which workspaces this user can open. DMS only hides CRM; CRM only hides DMS.
            </p>
          </div>

          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-3">
              <Checkbox id="up-dashboard" checked={!!flags.can_view_dms_dashboard} onCheckedChange={(c) => toggle('can_view_dms_dashboard', Boolean(c))} />
              <Label htmlFor="up-dashboard" className="text-sm font-medium cursor-pointer">Can view DMS Dashboard</Label>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Checkbox id="up-edit-price" checked={!!flags.can_edit_price} onCheckedChange={(c) => toggle('can_edit_price', Boolean(c))} />
              <Label htmlFor="up-edit-price" className="text-sm font-medium cursor-pointer">Can Edit Price (unit prices / rates)</Label>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <Checkbox id="up-lead" checked={!!flags.lead_sales_person} onCheckedChange={(c) => toggle('lead_sales_person', Boolean(c))} />
              <Label htmlFor="up-lead" className="text-sm font-medium cursor-pointer">Lead Sales Person</Label>
            </div>
          </div>

          <div className="rounded-lg border p-3">
            <button
              type="button"
              className="flex w-full items-center justify-between"
              onClick={() => { setReportsOpen(!reportsOpen); if (!flags.can_view_dms_report) toggle('can_view_dms_report', true); }}
            >
              <div className="flex items-center gap-3">
                <Checkbox
                  id="up-reports"
                  checked={!!flags.can_view_dms_report}
                  onCheckedChange={(c) => { toggle('can_view_dms_report', Boolean(c)); setReportsOpen(Boolean(c)); }}
                />
                <Label htmlFor="up-reports" className="text-sm font-medium cursor-pointer">Can view DMS Reports</Label>
              </div>
              <ChevronDown className={`h-4 w-4 transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
            </button>
            {reportsOpen && flags.can_view_dms_report ? (
              <div className="mt-3 space-y-1.5 border-t pt-3">
                <p className="text-xs text-muted-foreground mb-2">Allowed report sections (tick the ones this user can view):</p>
                {SECTION_FIELDS.map(([k, label]) => (
                  <div key={k} className="flex items-center gap-2">
                    <Checkbox id={`up-${k}`} checked={!!flags[k]} onCheckedChange={(c) => toggle(k, Boolean(c))} />
                    <Label htmlFor={`up-${k}`} className="text-sm font-normal cursor-pointer">{label}</Label>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}{row ? 'Update' : 'Add'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}