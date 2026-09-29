'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Building2, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { SearchableSelect } from '@/components/searchable-select';
import { usePermissions } from '@/contexts/permissions-context';
import * as svc from '@/services/branches';
import * as commonSvc from '@/services/common';

export function BranchesManager() {
  const { canWrite, canDelete } = usePermissions();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<svc.BranchMaster | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading, error, mutate } = useSWR(
    ['branch-master', debounced],
    () => svc.listBranches({ search: debounced || undefined, limit: 200 })
  );

  const rows = data?.data || [];

  function openCreate() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(row: svc.BranchMaster) {
    setEditing(row);
    setOpen(true);
  }

  async function remove(row: svc.BranchMaster) {
    if (!window.confirm(`Delete branch ${row.branch}? This cannot be undone.`)) return;
    setDeleting(row.name);
    try {
      await svc.deleteBranch(row.name);
      toast.success('Branch deleted');
      void mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to delete branch');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="dms-stat-value text-xl tracking-tight">Branches</h1>
          <p className="mt-1 hidden text-muted-foreground sm:block">
            Dealer branches. Assign them to users as Frappe User Permissions so lists stay
            scoped to that branch.
          </p>
        </div>
        <PermittedCreateButton module="branches" label="New branch" onClick={openCreate} />
      </div>

      <Card className="dms-kpi-card">
        <CardContent className="px-3.5 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-1.5">
              <Building2 className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="dms-stat-value text-xl">{data?.total ?? rows.length}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Branches
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dms-toolbar-card">
        <CardContent className="space-y-4 px-3.5 py-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search branch…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">Failed to load branches</p>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Building2 className="mx-auto mb-3 h-12 w-12 opacity-40" />
              <p>No branches yet</p>
              {canWrite('branches') ? (
                <Button variant="link" className="mt-2" onClick={openCreate}>
                  Create your first branch
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{row.branch}</span>
                      {row.company_name || row.company ? (
                        <Badge variant="outline">{row.company_name || row.company}</Badge>
                      ) : null}
                    </div>
                    {row.name !== row.branch ? (
                      <p className="text-xs text-muted-foreground font-mono">{row.name}</p>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    {canWrite('branches') ? (
                      <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    ) : null}
                    {canDelete('branches') ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        disabled={deleting === row.name}
                        onClick={() => void remove(row)}
                      >
                        {deleting === row.name ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {open ? (
        <BranchFormDialog
          open={open}
          branch={editing}
          onOpenChange={(o) => {
            setOpen(o);
            if (!o) setEditing(null);
          }}
          saving={saving}
          onSave={async (payload) => {
            setSaving(true);
            try {
              if (editing) {
                await svc.updateBranch(editing.name, payload);
                toast.success('Branch updated');
              } else {
                await svc.createBranch({
                  branch: payload.branch,
                  company: payload.company || undefined,
                });
                toast.success('Branch created');
              }
              setOpen(false);
              setEditing(null);
              void mutate();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : 'Failed to save branch');
            } finally {
              setSaving(false);
            }
          }}
        />
      ) : null}
    </div>
  );
}

function BranchFormDialog({
  open,
  branch,
  onOpenChange,
  saving,
  onSave,
}: {
  open: boolean;
  branch: svc.BranchMaster | null;
  onOpenChange: (open: boolean) => void;
  saving: boolean;
  onSave: (data: { branch: string; company?: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(branch?.branch || '');
  const [company, setCompany] = useState(branch?.company || '');
  const [companySearch, setCompanySearch] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(branch?.branch || '');
    setCompany(branch?.company || '');
    setCompanySearch('');
  }, [open, branch]);

  const { data: companies, isLoading: companiesLoading } = useSWR(
    open ? ['dms-companies-for-branch', companySearch] : null,
    () => commonSvc.fetchCompanies(companySearch)
  );

  const companyOptions = useMemo(
    () =>
      (companies || []).map((c) => ({
        value: c.name,
        label: c.company_name || c.name,
      })),
    [companies]
  );

  function submit() {
    if (!name.trim()) {
      toast.error('Branch name is required');
      return;
    }
    void onSave({ branch: name.trim(), company: company || null });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{branch ? 'Edit Branch' : 'New Branch'}</DialogTitle>
          <DialogDescription>
            Branches are used on job cards, inspections and estimates. Assign them to users as
            User Permissions to restrict what they can see.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label>Branch name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mogadishu Workshop"
              autoFocus
            />
          </div>
          <div className="space-y-1">
            <Label>Company</Label>
            <SearchableSelect
              options={companyOptions}
              value={company}
              onValueChange={setCompany}
              onSearchChange={setCompanySearch}
              isLoading={companiesLoading}
              placeholder="Select company…"
              emptyMessage="No companies in DMS Settings"
              portaled
            />
            <p className="text-xs text-muted-foreground">
              Only companies listed on DMS Settings are shown.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            {branch ? 'Save' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
