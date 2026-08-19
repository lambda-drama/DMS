'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Search, ScrollText } from 'lucide-react';
import * as mastersSvc from '@/services/masters';
import { htmlToPlainText } from '@/lib/plain-text';

type JobCardTermsRow = {
  name: string;
  title: string;
  default?: number | boolean;
  terms_and_conditions?: string;
};

function emptyForm() {
  return { name: '', title: '', terms_and_conditions: '', default: false };
}

export function JobCardTermsManager() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  const { data, isLoading, mutate } = useSWR(
    ['job-card-terms-master', debounced],
    () =>
      mastersSvc.listJobCardTerms({
        search: debounced || undefined,
        limit: 100,
        offset: 0,
      })
  );

  const rows: JobCardTermsRow[] = data?.data || [];

  function openCreate() {
    setEditing(false);
    setForm(emptyForm());
    setOpen(true);
  }

  function openEdit(row: JobCardTermsRow) {
    setEditing(true);
    setForm({
      name: row.name,
      title: row.title,
      terms_and_conditions: htmlToPlainText(row.terms_and_conditions || ''),
      default: Boolean(row.default),
    });
    setOpen(true);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    setSaving(true);
    try {
      if (editing && form.name) {
        await mastersSvc.updateJobCardTerms(form.name, {
          title: form.title.trim(),
          terms_and_conditions: form.terms_and_conditions,
          default: form.default ? 1 : 0,
        });
        toast.success('Job Card Terms updated');
      } else {
        await mastersSvc.createJobCardTerms({
          title: form.title.trim(),
          terms_and_conditions: form.terms_and_conditions,
          default: form.default ? 1 : 0,
        });
        toast.success('Job Card Terms created');
      }
      setOpen(false);
      void mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save Job Card Terms');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(row: JobCardTermsRow) {
    setDeleting(row.name);
    try {
      await mastersSvc.deleteJobCardTerms(row.name);
      toast.success('Job Card Terms deleted');
      void mutate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete Job Card Terms');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">Job Card Terms</h1>
          <p className="text-muted-foreground">
            Master templates for Terms & Conditions used on new job cards
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Terms Template
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search terms titles…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <ScrollText className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No Job Card Terms templates found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row) => (
                <div
                  key={row.name}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{row.title}</span>
                      {row.default ? <Badge variant="secondary">Default</Badge> : null}
                    </div>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground whitespace-pre-line">
                      {htmlToPlainText(row.terms_and_conditions).slice(0, 300)}
                      {htmlToPlainText(row.terms_and_conditions).length > 300 ? '…' : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      disabled={deleting === row.name}
                      onClick={() => void handleDelete(row)}
                    >
                      {deleting === row.name ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
          <DialogHeader className="shrink-0">
            <DialogTitle>{editing ? 'Edit Job Card Terms' : 'New Job Card Terms'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Update the template title and content.'
                : 'Create a new Terms & Conditions template used on new job cards.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 overflow-y-auto min-h-0">
            <div className="space-y-2">
              <Label htmlFor="terms-title">Title *</Label>
              <Input
                id="terms-title"
                placeholder="e.g. Standard Service Terms"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="terms-content">Terms & Conditions Content</Label>
              <Textarea
                id="terms-content"
                rows={12}
                placeholder={'1- ...\n2- ...\n3- ...'}
                value={form.terms_and_conditions}
                onChange={(e) =>
                  setForm((f) => ({ ...f, terms_and_conditions: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                Type the terms as plain text — points 1, 2, 3, etc. This will appear on the new
                job card and can be edited per job by the user.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="terms-default"
                checked={form.default}
                onCheckedChange={(v) => setForm((f) => ({ ...f, default: Boolean(v) }))}
              />
              <Label htmlFor="terms-default" className="text-sm font-normal cursor-pointer">
                Set as default template (auto-selected on new job cards)
              </Label>
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t pt-4">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              {editing ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}