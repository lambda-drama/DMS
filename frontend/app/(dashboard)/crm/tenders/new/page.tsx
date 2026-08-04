'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { createTender, fetchTenderFormOptions, listAccounts } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

export default function CrmTenderNewPage() {
  const { navigate, viewParams } = useNavigation();
  const presetAccount = viewParams.get('account') || '';
  const { data: options } = useSWR('crm-tender-form-options', fetchTenderFormOptions);
  const [accountSearch, setAccountSearch] = useState('');
  const { data: accounts } = useSWR(['crm-accounts-pick', accountSearch], () =>
    listAccounts({ search: accountSearch || undefined, limit: 30 })
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    title: '',
    account: presetAccount,
    customer: '',
    issuing_body: '',
    tender_category: 'Corporate',
    status: 'Draft',
    bid_deadline: '',
    estimated_value: '',
    financing_method: '',
    technical_requirements: '',
    commercial_requirements: '',
    delivery_schedule_notes: '',
    aftersales_commitments: '',
    notes: '',
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const categoryOptions = useMemo(
    () => (options?.categories || []).map((c) => ({ value: c, label: c })),
    [options]
  );
  const statusOptions = useMemo(
    () => (options?.statuses || []).map((c) => ({ value: c, label: c })),
    [options]
  );
  const financingOptions = useMemo(
    () => (options?.financing_methods || []).map((c) => ({ value: c, label: c })),
    [options]
  );
  const accountOptions = useMemo(
    () =>
      ((accounts?.data as Record<string, unknown>[]) || []).map((a) => ({
        value: String(a.name),
        label: String(a.account_name || a.name),
        description: String(a.customer_name || a.customer || ''),
      })),
    [accounts]
  );

  const onSave = async () => {
    clear();
    if (!form.title.trim()) {
      showError('Title is required.');
      return;
    }
    if (!form.customer && !form.account) {
      showError('Customer or Account is required.');
      return;
    }
    setSaving(true);
    try {
      const result = await createTender({
        title: form.title.trim(),
        account: form.account || null,
        customer: form.customer || null,
        issuing_body: form.issuing_body || null,
        tender_category: form.tender_category,
        status: form.status,
        bid_deadline: form.bid_deadline || null,
        estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
        financing_method: form.financing_method || null,
        technical_requirements: form.technical_requirements || null,
        commercial_requirements: form.commercial_requirements || null,
        delivery_schedule_notes: form.delivery_schedule_notes || null,
        aftersales_commitments: form.aftersales_commitments || null,
        notes: form.notes || null,
      });
      const id = result?.name;
      if (id) navigate('crm-tender-detail', { id: String(id) });
      else navigate('crm-tenders');
    } catch (e: unknown) {
      showError(e, 'Failed to create tender');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Fleet / government tender</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Account</label>
            <SearchableSelect
              options={accountOptions}
              value={form.account}
              onValueChange={(v) => {
                const selected = ((accounts?.data as Record<string, unknown>[]) || []).find(
                  (a) => String(a.name) === v
                );
                setForm((prev) => ({
                  ...prev,
                  account: v || '',
                  customer: prev.customer || String(selected?.customer || ''),
                }));
              }}
              onSearchChange={setAccountSearch}
              placeholder="Link account…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <CrmCustomerLink
              value={form.customer}
              onValueChange={(v) => set('customer', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Category</label>
            <SearchableSelect
              options={categoryOptions}
              value={form.tender_category}
              onValueChange={(v) => set('tender_category', v || 'Corporate')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Status</label>
            <SearchableSelect
              options={statusOptions}
              value={form.status}
              onValueChange={(v) => set('status', v || 'Draft')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Issuing body
            </label>
            <Input
              value={form.issuing_body}
              onChange={(e) => set('issuing_body', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Bid deadline
            </label>
            <Input
              type="datetime-local"
              value={form.bid_deadline}
              onChange={(e) => set('bid_deadline', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Estimated value
            </label>
            <Input
              type="number"
              value={form.estimated_value}
              onChange={(e) => set('estimated_value', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Financing / LC
            </label>
            <SearchableSelect
              options={financingOptions}
              value={form.financing_method}
              onValueChange={(v) => set('financing_method', v || '')}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Technical requirements
            </label>
            <Textarea
              rows={3}
              value={form.technical_requirements}
              onChange={(e) => set('technical_requirements', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Commercial requirements
            </label>
            <Textarea
              rows={3}
              value={form.commercial_requirements}
              onChange={(e) => set('commercial_requirements', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Delivery schedule
            </label>
            <Textarea
              rows={2}
              value={form.delivery_schedule_notes}
              onChange={(e) => set('delivery_schedule_notes', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Aftersales commitments
            </label>
            <Textarea
              rows={2}
              value={form.aftersales_commitments}
              onChange={(e) => set('aftersales_commitments', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-tenders')}>
          Cancel
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create tender
        </Button>
      </FormActionsBar>
    </div>
  );
}
