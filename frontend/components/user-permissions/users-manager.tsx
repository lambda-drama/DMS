'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  UserCog,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SearchableSelect } from '@/components/searchable-select';
import * as svc from '@/services/users';

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = new Uint32Array(12);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 1e9);
  }
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
}

function MultiSelectChips({
  label,
  hint,
  options,
  value,
  onChange,
  placeholder,
  emptyMessage,
}: {
  label: string;
  hint?: string;
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
  emptyMessage?: string;
}) {
  const remaining = options.filter((o) => !value.includes(o));
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <div className="flex min-h-10 flex-wrap gap-1.5 rounded-xl border bg-background px-2 py-2">
        {value.length === 0 ? (
          <span className="px-1 text-xs text-muted-foreground">{placeholder}</span>
        ) : (
          value.map((item) => (
            <span
              key={item}
              className="inline-flex items-center gap-1 rounded-full border bg-muted/50 px-2 py-0.5 text-xs"
            >
              {item}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => onChange(value.filter((v) => v !== item))}
              >
                <X className="h-3 w-3" />
              </button>
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
          emptyMessage={emptyMessage || 'Nothing left to add'}
          portaled
        />
      ) : null}
    </div>
  );
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <Input
      id={id}
      type="password"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete="new-password"
    />
  );
}



function UserFormDialog({
  open,
  onOpenChange,
  user,
  bootstrap,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: svc.DmsUserRow | null;
  bootstrap: svc.UsersBootstrap;
  onSaved: () => void;
}) {
  const editing = Boolean(user);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState('System User');
  const [enabled, setEnabled] = useState(true);
  const [sendWelcome, setSendWelcome] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [roles, setRoles] = useState<string[]>([]);
  const [profiles, setProfiles] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setEmail(user?.email || user?.user || '');
    setUserType(user?.user_type || 'System User');
    setEnabled(user ? Boolean(user.enabled) : true);
    setSendWelcome(false);
    setPassword('');
    setConfirm('');
    setRoles(user?.roles || []);
    setProfiles(user?.role_profiles || []);
  }, [open, user]);

  const passwordMismatch = confirm.length > 0 && password !== confirm;

  async function submit() {
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }
    if (!editing && !email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!editing && password && password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!editing && password && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setSaving(true);
    try {
      if (editing && user) {
        await svc.updateUser({
          user: user.user,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          enabled: enabled ? 1 : 0,
          user_type: userType,
          roles,
          role_profiles: profiles,
        });
        toast.success('User updated');
      } else {
        const created = await svc.createUser({
          email: email.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          user_type: userType,
          enabled: enabled ? 1 : 0,
          send_welcome_email: sendWelcome ? 1 : 0,
          password: password || undefined,
          confirm_password: password ? confirm : undefined,
          roles,
          role_profiles: profiles,
        });
        toast.success(
          password
            ? `${created.full_name} created — they must change the password on first sign-in`
            : 'User created'
        );
      }
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? 'Edit User' : 'New User'}</DialogTitle>
          <DialogDescription>
            {editing
              ? 'Update the user details, status and access roles.'
              : 'Create a DMS user and set a temporary password. The user chooses their own password on first sign-in.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>First name</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Amina"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              <Label>Last name</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Yusuf"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Email / username</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@dealer.com"
              disabled={editing}
            />
            {editing ? (
              <p className="text-xs text-muted-foreground">
                The email is the username and cannot be changed here.
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label>User type</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(bootstrap.user_types?.length
                    ? bootstrap.user_types
                    : ['System User', 'Website User']
                  ).map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="mt-6 flex items-center gap-2 text-sm">
              <Checkbox checked={enabled} onCheckedChange={(c) => setEnabled(Boolean(c))} />
              Enabled
            </label>
          </div>


          {!editing ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="flex items-center justify-between">
                <Label>Temporary password</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7"
                  onClick={() => {
                    const p = generatePassword();
                    setPassword(p);
                    setConfirm(p);
                  }}
                >
                  <RefreshCw className="mr-1 h-3.5 w-3.5" />
                  Generate
                </Button>
              </div>
              <PasswordInput
                id="new-user-password"
                value={password}
                onChange={setPassword}
                placeholder="At least 8 characters"
              />
              <PasswordInput
                id="new-user-confirm"
                value={confirm}
                onChange={setConfirm}
                placeholder="Re-enter password"
              />
              {passwordMismatch ? (
                <p className="text-xs text-destructive">Passwords do not match</p>
              ) : null}
              <p className="text-xs text-muted-foreground">
                {password
                  ? 'Share this temporary password — the user is asked to change it on first sign-in.'
                  : 'Leave blank to send a welcome email instead (needs an outgoing email account).'}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={sendWelcome}
                  onCheckedChange={(c) => setSendWelcome(Boolean(c))}
                />
                Send welcome email
              </label>
            </div>
          ) : null}

          <MultiSelectChips
            label="Roles"
            options={bootstrap.assignable_roles || []}
            value={roles}
            onChange={setRoles}
            placeholder="No roles selected"
            emptyMessage="No roles configured on DMS CRM User Settings"
            hint="Only roles on DMS CRM User Settings can be assigned."
          />
          <MultiSelectChips
            label="Role profiles"
            options={bootstrap.role_profiles || []}
            value={profiles}
            onChange={setProfiles}
            placeholder="No role profiles selected"
            emptyMessage="No role profiles configured"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={saving || passwordMismatch}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {editing ? 'Save Changes' : 'Create User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: svc.DmsUserRow | null;
  onSaved: () => void;
}) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [logoutAll, setLogoutAll] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPassword('');
    setConfirm('');
    setLogoutAll(true);
  }, [open, user]);

  const mismatch = confirm.length > 0 && password !== confirm;

  async function submit() {
    if (!user) return;
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await svc.setUserPassword({
        user: user.user,
        new_password: password,
        confirm_password: confirm,
        logout_all_sessions: logoutAll ? 1 : 0,
      });
      toast.success(
        `Temporary password set for ${user.full_name || user.user}. They must change it on next sign-in.`
      );
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to set password');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Set Temporary Password</DialogTitle>
          <DialogDescription>
            {user ? `Set a password for ${user.full_name || user.user}. ` : ''}
            The user is asked to choose their own password the next time they sign in.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7"
              onClick={() => {
                const p = generatePassword();
                setPassword(p);
                setConfirm(p);
              }}
            >
              <RefreshCw className="mr-1 h-3.5 w-3.5" />
              Generate
            </Button>
          </div>
          <PasswordInput
            id="reset-user-password"
            value={password}
            onChange={setPassword}
            placeholder="New temporary password"
          />
          <PasswordInput
            id="reset-user-confirm"
            value={confirm}
            onChange={setConfirm}
            placeholder="Re-enter password"
          />
          {mismatch ? <p className="text-xs text-destructive">Passwords do not match</p> : null}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={logoutAll} onCheckedChange={(c) => setLogoutAll(Boolean(c))} />
            Sign the user out of all devices
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={saving || mismatch || !password}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Set Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



export function UsersManager({ embedded = false }: { embedded?: boolean }) {
  const { data, isLoading, mutate } = useSWR('dms-users-bootstrap', () => svc.getUsersBootstrap());
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<svc.DmsUserRow | null>(null);
  const [resetFor, setResetFor] = useState<svc.DmsUserRow | null>(null);

  const users = data?.users || [];
  const filtered = useMemo(
    () =>
      users.filter((u) =>
        `${u.full_name || ''} ${u.email || ''} ${u.user}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [users, search]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!data?.can_manage) return null;

  return (
    <div className={embedded ? 'space-y-4 border-t pt-8' : 'min-w-0 space-y-4'}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {embedded ? (
            <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <UserCog className="h-5 w-5" />
              Users
            </h2>
          ) : (
            <h1 className="dms-stat-value text-xl tracking-tight">Users</h1>
          )}
          <p className="text-sm text-muted-foreground">
            Create DMS users, assign roles and set temporary passwords. Dealer Manager, System
            Manager and Administrator only.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          New User
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">DMS Users</CardTitle>
          <CardDescription>
            {users.length} DMS user{users.length === 1 ? '' : 's'} from DMS CRM User Settings.
            A temporary password forces a password change on first sign-in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search user…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-muted/40 text-left text-xs">
                  <tr>
                    <th className="px-3 py-2 font-medium">User</th>
                    <th className="px-3 py-2 font-medium">Type</th>
                    <th className="px-3 py-2 font-medium">Roles</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>

                  {filtered.map((u) => (
                    <tr key={u.user} className="border-t">
                      <td className="px-3 py-2">
                        <div className="font-medium">{u.full_name || u.user}</div>
                        <div className="text-xs text-muted-foreground">{u.email || u.user}</div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {u.user_type || 'System User'}
                      </td>
                      <td className="px-3 py-2">
                        {u.roles.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {u.roles.slice(0, 3).map((r) => (
                              <Badge key={r} variant="secondary">
                                {r}
                              </Badge>
                            ))}
                            {u.roles.length > 3 ? (
                              <Badge variant="outline">+{u.roles.length - 3}</Badge>
                            ) : null}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant={u.enabled ? 'default' : 'outline'}>
                            {u.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {u.must_change_password ? (
                            <Badge variant="destructive">Must change password</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={u.protected}
                            onClick={() => {
                              setEditing(u);
                              setFormOpen(true);
                            }}
                          >
                            <Pencil className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8"
                            disabled={u.protected}
                            onClick={() => setResetFor(u)}
                          >
                            <KeyRound className="mr-1 h-3.5 w-3.5" />
                            Password
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>


      <UserFormDialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
        user={editing}
        bootstrap={data}
        onSaved={() => void mutate()}
      />
      <ResetPasswordDialog
        open={Boolean(resetFor)}
        onOpenChange={(o) => {
          if (!o) setResetFor(null);
        }}
        user={resetFor}
        onSaved={() => void mutate()}
      />
    </div>
  );
}

