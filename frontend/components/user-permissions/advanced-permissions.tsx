'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Loader2, Plus, RotateCcw, Shield, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
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
import { SearchableSelect } from '@/components/searchable-select';
import * as svc from '@/services/advancedPermissions';
import type { PermRow } from '@/services/advancedPermissions';

const RIGHT_LABELS: Record<string, string> = {
  select: 'Select',
  read: 'Read',
  write: 'Write',
  create: 'Create',
  delete: 'Delete',
  submit: 'Submit',
  cancel: 'Cancel',
  amend: 'Amend',
  print: 'Print',
  email: 'Email',
  report: 'Report',
  import: 'Import',
  export: 'Export',
  share: 'Share',
  if_owner: 'If Owner',
};

const GRID_RIGHTS = [
  'select',
  'read',
  'write',
  'create',
  'delete',
  'submit',
  'cancel',
  'amend',
  'print',
  'email',
  'report',
  'import',
  'export',
  'share',
  'if_owner',
] as const;

function ChipMultiSelect({
  label,
  hint,
  options,
  value,
  onChange,
  placeholder,
  onCreate,
  createLabel,
  allowAdd = true,
  allowRemove = true,
  onChipClick,
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  onCreate?: () => void;
  createLabel?: string;
  allowAdd?: boolean;
  allowRemove?: boolean;
  onChipClick?: (item: string) => void;
}) {
  const remaining = allowAdd ? options.filter((o) => !value.includes(o)) : [];
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {onCreate ? (
          <Button type="button" variant="outline" size="sm" className="h-7" onClick={onCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            {createLabel || 'New'}
          </Button>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex min-h-10 flex-wrap gap-1.5 rounded-xl border bg-background px-2 py-2">
        {value.length === 0 ? (
          <span className="px-1 text-xs text-muted-foreground">{placeholder}</span>
        ) : (
          value.map((item) => (
            <span
              key={item}
              className={`inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs ${
                onChipClick ? 'cursor-pointer hover:bg-muted' : ''
              }`}
              onClick={() => onChipClick?.(item)}
            >
              {item}
              {allowRemove ? (
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(value.filter((v) => v !== item));
                  }}
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </span>
          ))
        )}
      </div>
      {remaining.length > 0 ? (
        <SearchableSelect
          options={remaining.map((o) => ({ value: o, label: o }))}
          value=""
          onValueChange={(v) => {
            if (v && !value.includes(v)) onChange([...value, v]);
          }}
          placeholder={`Add ${label.toLowerCase()}…`}
        />
      ) : null}
    </div>
  );
}

function CreateRoleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (name: string, selectedRoles: string[]) => void;
}) {
  const [name, setName] = useState('');
  const [deskAccess, setDeskAccess] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setDeskAccess(true);
    }
  }, [open]);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await svc.createRole(trimmed, deskAccess ? 1 : 0);
      onCreated(res.name, res.selected_roles || []);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create role');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Role</DialogTitle>
          <DialogDescription>
            Creates a Frappe Role and adds it to the list used on this screen.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Role name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Service Advisor"
              autoFocus
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={deskAccess} onCheckedChange={(c) => setDeskAccess(Boolean(c))} />
            Desk access
          </label>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Role
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateRoleProfileDialog({
  open,
  onOpenChange,
  roleOptions,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleOptions: string[];
  onCreated: (name: string, selectedProfiles: string[]) => void;
}) {
  const [name, setName] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName('');
      setRoles([]);
    }
  }, [open]);

  async function submit() {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Role Profile name is required');
      return;
    }
    setSaving(true);
    try {
      const res = await svc.createRoleProfile({ role_profile: trimmed, roles });
      onCreated(res.name, res.selected_role_profiles || []);
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to create role profile');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Role Profile</DialogTitle>
          <DialogDescription>
            Creates a Role Profile you can assign to users. The role list is the same Roles
            Table MultiSelect on DMS CRM User Settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label>Profile name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aftersales Staff"
              autoFocus
            />
          </div>
          <ChipMultiSelect
            label="Roles in this profile"
            hint="Only roles already on DMS CRM User Settings → Roles."
            options={roleOptions}
            value={roles}
            onChange={setRoles}
            placeholder={
              roleOptions.length
                ? "Add roles from DMS CRM User Settings…"
                : "No roles on DMS CRM User Settings yet — create or select roles first"
            }
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" disabled={saving} onClick={() => void submit()}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Role Profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleProfileRolesDialog({
  profile,
  roleOptions,
  onOpenChange,
}: {
  profile: string | null;
  roleOptions: string[];
  onOpenChange: (open: boolean) => void;
}) {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const remaining = roleOptions.filter((o) => !roles.includes(o));

  useEffect(() => {
    if (!profile) {
      setRoles([]);
      setPickerOpen(false);
      return;
    }
    setPickerOpen(false);
    setLoading(true);
    svc
      .getRoleProfile(profile)
      .then((d) => setRoles(d.roles || []))
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load role profile'))
      .finally(() => setLoading(false));
  }, [profile]);

  async function addRole(role: string) {
    if (!profile || !role) return;
    setAdding(true);
    try {
      const d = await svc.addRoleToProfile(profile, role);
      setRoles(d.roles || []);
      toast.success(`Added ${role}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add role');
    } finally {
      setAdding(false);
    }
  }

  async function removeRole(role: string) {
    if (!profile) return;
    setRemoving(role);
    try {
      const d = await svc.removeRoleFromProfile(profile, role);
      setRoles(d.roles || []);
      toast.success(`Removed ${role}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove role');
    } finally {
      setRemoving(null);
    }
  }

  return (
    <Dialog open={Boolean(profile)} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-visible sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{profile || 'Role Profile'}</DialogTitle>
          <DialogDescription>
            Roles in this profile. Adding or removing a role here updates the Role Profile; it does
            not assign the profile to any user.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-24 space-y-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <Label>Roles</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              disabled={loading || adding || remaining.length === 0}
              onClick={() => setPickerOpen((open) => !open)}
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add
            </Button>
          </div>
          {pickerOpen && remaining.length > 0 ? (
            <SearchableSelect
              options={remaining.map((o) => ({ value: o, label: o }))}
              value=""
              onValueChange={(v) => {
                if (v) void addRole(v);
              }}
              placeholder="Choose a role…"
              emptyMessage="No more roles on DMS CRM User Settings"
              disabled={adding}
            />
          ) : null}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No roles in this profile.{remaining.length ? ' Use Add to choose roles.' : ''}
            </p>
          ) : (
            <ul className="max-h-64 space-y-1.5 overflow-y-auto">
              {roles.map((role) => (
                <li
                  key={role}
                  className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                >
                  <span>{role}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-destructive hover:text-destructive"
                    disabled={removing === role || adding}
                    onClick={() => void removeRole(role)}
                  >
                    {removing === role ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          {!loading && remaining.length === 0 && roleOptions.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              All roles from DMS CRM User Settings are already in this profile.
            </p>
          ) : null}
          {!loading && roleOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              No roles on DMS CRM User Settings yet — create or select roles first.
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function AdvancedPermissionsPanel() {
  const { data, isLoading, mutate } = useSWR('advanced-perm-bootstrap', () =>
    svc.getAdvancedPermissionBootstrap()
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data?.can_manage) return null;

  return <AdvancedBody data={data} onRefresh={() => void mutate()} />;
}

function AdvancedBody({
  data,
  onRefresh,
}: {
  data: svc.AdvancedBootstrap;
  onRefresh: () => void;
}) {
  const shownRoles = data.selected_roles || [];
  const shownProfiles = data.selected_role_profiles || [];
  const [createRoleOpen, setCreateRoleOpen] = useState(false);
  const [createProfileOpen, setCreateProfileOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState<string | null>(null);

  return (
    <div className="space-y-4 border-t pt-8">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
          <Shield className="h-5 w-5" />
          Advanced Permission
        </h2>
        <p className="text-sm text-muted-foreground">
          Role Permission Manager for DMS and CRM documents. Only Dealer Manager, System Manager,
          and Administrator can use this section.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Roles &amp; Role Profiles on this screen</CardTitle>
          <CardDescription>
            These lists come from DMS CRM User Settings. Roles are maintained from Desk. Role
            Profiles are created here (or on Desk) and stored on that same settings document.
            Click a Role Profile to see its roles and add more.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ChipMultiSelect
              label="Roles"
              hint="Only these roles appear in Role Permission Manager. Same list as Roles on DMS CRM User Settings. Add or remove roles from Desk."
              options={shownRoles}
              value={shownRoles}
              onChange={() => {}}
              allowAdd={false}
              allowRemove={false}
              placeholder="No roles on DMS CRM User Settings yet"
              onCreate={() => setCreateRoleOpen(true)}
              createLabel="New Role"
            />
            <ChipMultiSelect
              label="Role Profiles"
              hint="Role Profiles work like ERPNext: applying a profile sets that user’s roles. Click a profile to view, add, or remove its roles."
              options={shownProfiles}
              value={shownProfiles}
              onChange={() => {}}
              allowAdd={false}
              allowRemove={false}
              onChipClick={setViewProfile}
              placeholder="No role profiles on DMS CRM User Settings yet"
              onCreate={() => setCreateProfileOpen(true)}
              createLabel="New Role Profile"
            />
          </div>
        </CardContent>
      </Card>

      <CreateRoleDialog
        open={createRoleOpen}
        onOpenChange={setCreateRoleOpen}
        onCreated={() => {
          toast.success('Role created and added to DMS CRM User Settings');
          onRefresh();
        }}
      />
      <CreateRoleProfileDialog
        open={createProfileOpen}
        onOpenChange={setCreateProfileOpen}
        roleOptions={[...shownRoles].sort()}
        onCreated={() => {
          toast.success('Role Profile created and added to DMS CRM User Settings');
          onRefresh();
        }}
      />
      <RoleProfileRolesDialog
        profile={viewProfile}
        roleOptions={[...shownRoles].sort()}
        onOpenChange={(open) => {
          if (!open) setViewProfile(null);
        }}
      />

      <AssignUserRoles
        users={data.whitelisted_users || []}
        roles={shownRoles}
        profiles={shownProfiles}
      />

      <RolePermissionGrid doctypes={data.doctypes || []} roles={shownRoles} />
    </div>
  );
}

function AssignUserRoles({
  users,
  roles,
  profiles,
}: {
  users: { user: string; full_name?: string }[];
  roles: string[];
  profiles: string[];
}) {
  const [user, setUser] = useState('');
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [userProfiles, setUserProfiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const userOpts = useMemo(
    () => users.map((u) => ({ value: u.user, label: u.full_name || u.user })),
    [users]
  );

  useEffect(() => {
    if (!user) {
      setUserRoles([]);
      setUserProfiles([]);
      return;
    }
    setLoading(true);
    svc
      .getUserRoles(user)
      .then((d) => {
        setUserRoles(d.roles || []);
        setUserProfiles(d.role_profiles || []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Failed to load user roles'))
      .finally(() => setLoading(false));
  }, [user]);

  async function save() {
    if (!user) {
      toast.error('Select a user');
      return;
    }
    setSaving(true);
    try {
      const d = await svc.saveUserRoles({
        user,
        roles: userRoles,
        role_profiles: userProfiles,
      });
      setUserRoles(d.roles);
      setUserProfiles(d.role_profiles);
      toast.success('User roles updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save user roles');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Give users roles</CardTitle>
        <CardDescription>
          Assign Role Profiles (ERPNext style) or individual roles to a whitelisted DMS user. If a
          Role Profile is set, Frappe applies that profile’s roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>User</Label>
          <SearchableSelect
            options={userOpts}
            value={user}
            onValueChange={setUser}
            placeholder="Select whitelisted user…"
          />
        </div>
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : user ? (
          <>
            <ChipMultiSelect
              label="Role Profiles"
              options={profiles}
              value={userProfiles}
              onChange={setUserProfiles}
              placeholder="No role profile"
            />
            <ChipMultiSelect
              label="Roles"
              hint={
                userProfiles.length
                  ? 'Role Profile is set — extra roles may be overwritten when the User is saved in Desk.'
                  : undefined
              }
              options={roles}
              value={userRoles}
              onChange={setUserRoles}
              placeholder="No extra roles"
            />
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save user roles
            </Button>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function RolePermissionGrid({
  doctypes,
  roles,
}: {
  doctypes: svc.AdvancedDoctype[];
  roles: string[];
}) {
  const [doctype, setDoctype] = useState('');
  const [role, setRole] = useState('');
  const [rows, setRows] = useState<PermRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  const dtOpts = useMemo(
    () => doctypes.map((d) => ({ value: d.name, label: `${d.name} (${d.module})` })),
    [doctypes]
  );
  const roleOpts = useMemo(() => roles.map((r) => ({ value: r, label: r })), [roles]);

  async function load() {
    if (!doctype && !role) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await svc.getRolePermissions(doctype || undefined, role || undefined);
      setRows(data || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load permissions');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctype, role]);

  async function toggle(row: PermRow, ptype: string, checked: boolean) {
    try {
      await svc.updateRolePermission({
        doctype: row.parent,
        role: row.role,
        permlevel: row.permlevel || 0,
        ptype,
        value: checked ? 1 : 0,
        if_owner: row.if_owner || 0,
      });
      setRows((prev) =>
        prev.map((r) =>
          r.parent === row.parent && r.role === row.role && r.permlevel === row.permlevel
            ? { ...r, [ptype]: checked ? 1 : 0 }
            : r
        )
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    }
  }

  async function addRule() {
    if (!doctype || !role) {
      toast.error('Select a Document Type and a Role');
      return;
    }
    setAdding(true);
    try {
      await svc.addRolePermission(doctype, role, 0);
      toast.success('Permission rule added');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to add');
    } finally {
      setAdding(false);
    }
  }

  async function remove(row: PermRow) {
    try {
      await svc.removeRolePermission(row.parent, row.role, row.permlevel || 0, row.if_owner || 0);
      toast.success('Rule removed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to remove');
    }
  }

  async function reset() {
    if (!doctype) {
      toast.error('Select a Document Type to reset');
      return;
    }
    if (!window.confirm(`Restore original permissions for ${doctype}?`)) return;
    try {
      await svc.resetRolePermissions(doctype);
      toast.success('Permissions reset');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to reset');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Role Permission Manager</CardTitle>
        <CardDescription>
          Only DocTypes used in DMS and CRM are listed. Roles come only from the Roles Table
          MultiSelect on DMS CRM User Settings. Select a Document Type to see each of those roles
          and tick Read, Write, Create, and so on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Document Type</Label>
            <SearchableSelect
              options={dtOpts}
              value={doctype}
              onValueChange={setDoctype}
              placeholder="Select doctype…"
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <SearchableSelect
              options={roleOpts}
              value={role}
              onValueChange={setRole}
              placeholder={roles.length ? 'All listed roles' : 'No CRM roles configured'}
              emptyMessage="No roles in DMS CRM User Settings"
            />
          </div>
        </div>
        {roles.length === 0 ? (
          <p className="rounded-lg border border-dashed px-3 py-3 text-sm text-muted-foreground">
            Add roles on DMS CRM User Settings (Roles Table MultiSelect), then save. Only those
            roles are shown here.
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void addRule()} disabled={adding || !doctype || !role}>
            {adding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Add rule
          </Button>
          <Button variant="outline" onClick={() => void reset()} disabled={!doctype}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restore original
          </Button>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : !doctype && !role ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Select a Document Type to see each CRM role and tick permissions.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No CRM roles to show. Add roles on DMS CRM User Settings first.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-muted/40 text-left text-xs">
                <tr>
                  <th className="px-3 py-2 font-medium">DocType</th>
                  <th className="px-3 py-2 font-medium">Role</th>
                  <th className="px-3 py-2 font-medium">Lvl</th>
                  {GRID_RIGHTS.map((r) => (
                    <th key={r} className="px-1 py-2 text-center font-medium">
                      {RIGHT_LABELS[r]}
                    </th>
                  ))}
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={`${row.parent}-${row.role}-${row.permlevel}-${row.if_owner || 0}`}
                    className="border-t"
                  >
                    <td className="px-3 py-2 font-medium">{row.parent}</td>
                    <td className="px-3 py-2">{row.role}</td>
                    <td className="px-3 py-2 text-muted-foreground">{row.permlevel || 0}</td>
                    {GRID_RIGHTS.map((r) => {
                      const hideSubmit =
                        !row.is_submittable && ['submit', 'cancel', 'amend'].includes(r);
                      if (hideSubmit) {
                        return (
                          <td key={r} className="px-1 py-2 text-center text-muted-foreground">
                            —
                          </td>
                        );
                      }
                      return (
                        <td key={r} className="px-1 py-2 text-center">
                          <Checkbox
                            checked={Boolean(row[r as keyof PermRow])}
                            onCheckedChange={(c) => void toggle(row, r, Boolean(c))}
                          />
                        </td>
                      );
                    })}
                    <td className="px-2 py-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => void remove(row)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
