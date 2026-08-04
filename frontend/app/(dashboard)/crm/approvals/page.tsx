'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  createApproval,
  decideApproval,
  fetchApprovalFormOptions,
  listApprovals,
} from '@/services/crm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

export default function CrmApprovalsPage() {
  const { data: options } = useSWR('crm-approval-form-options', fetchApprovalFormOptions);
  const [status, setStatus] = useState('Pending');
  const { data, isLoading, mutate } = useSWR(['crm-approvals', status], () =>
    listApprovals({ status, limit: 50 })
  );
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    title: '',
    approval_type: 'Sales Discount / Commercial Support',
    reason: '',
    amount: '',
  });

  const selectOpts = (values?: string[]) =>
    (values || []).filter(Boolean).map((v) => ({ value: v, label: v }));

  const onCreate = async () => {
    clear();
    if (!form.title.trim() || !form.reason.trim()) {
      showError('Title and reason are required.');
      return;
    }
    setCreating(true);
    try {
      await createApproval({
        title: form.title.trim(),
        approval_type: form.approval_type,
        reason: form.reason.trim(),
        amount: form.amount ? Number(form.amount) : null,
      });
      setForm({
        title: '',
        approval_type: form.approval_type,
        reason: '',
        amount: '',
      });
      await mutate();
      showSuccess('Approval request submitted.');
    } catch (e: unknown) {
      showError(e, 'Failed to create approval');
    } finally {
      setCreating(false);
    }
  };

  const onDecide = async (name: string, decision: 'Approved' | 'Rejected') => {
    clear();
    try {
      await decideApproval(name, decision);
      await mutate();
      showSuccess(`Request ${decision.toLowerCase()}.`);
    } catch (e: unknown) {
      showError(e, 'Decision failed');
    }
  };

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Pending: <span className="font-medium text-foreground">{Number(data?.pending || 0)}</span>
        </p>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">All</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New approval request (§15.3)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Input
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            />
          </div>
          <SearchableSelect
            options={selectOpts(options?.approval_types)}
            value={form.approval_type}
            onValueChange={(v) =>
              setForm((p) => ({ ...p, approval_type: v || p.approval_type }))
            }
          />
          <Input
            type="number"
            placeholder="Amount (optional)"
            value={form.amount}
            onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
          />
          <div className="sm:col-span-2 space-y-2">
            <Textarea
              rows={2}
              placeholder="Reason *"
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
            />
          </div>
          <Button onClick={() => void onCreate()} disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit request
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="pt-4">
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="space-y-3">
              {(data?.data || []).length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">No approval requests.</p>
              ) : (
                (data?.data || []).map((row: Record<string, unknown>) => (
                  <div
                    key={String(row.name)}
                    className="rounded-md border border-border/70 p-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{String(row.title)}</p>
                        <p className="text-xs text-muted-foreground">
                          {String(row.approval_type)} · {String(row.requester_name || '')}
                        </p>
                      </div>
                      <Badge variant="secondary">{String(row.status)}</Badge>
                    </div>
                    {row.status === 'Pending' && data?.can_approve ? (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => void onDecide(String(row.name), 'Approved')}>
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void onDecide(String(row.name), 'Rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
