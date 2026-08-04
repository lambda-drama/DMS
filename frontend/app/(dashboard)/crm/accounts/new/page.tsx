'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { createAccount, fetchAccountFormOptions } from '@/services/crm';
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

export default function CrmAccountNewPage() {
  const { navigate } = useNavigation();
  const { data: options } = useSWR('crm-account-form-options', fetchAccountFormOptions);
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    account_name: '',
    customer: '',
    account_type: 'Corporate',
    status: 'Active',
    industry: '',
    territory: '',
    legal_name: '',
    tax_id: '',
    registration_number: '',
    credit_terms: '',
    account_plan: '',
    notes: '',
  });

  const typeOptions = useMemo(
    () => (options?.account_types || []).map((t) => ({ value: t, label: t })),
    [options]
  );
  const statusOptions = useMemo(
    () => (options?.statuses || []).map((t) => ({ value: t, label: t })),
    [options]
  );

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    clear();
    if (!form.customer) {
      showError('Customer is required.');
      return;
    }
    if (!form.account_name.trim()) {
      showError('Account name is required.');
      return;
    }
    setSaving(true);
    try {
      const result = await createAccount({
        account_name: form.account_name.trim(),
        customer: form.customer,
        account_type: form.account_type,
        status: form.status,
        industry: form.industry || null,
        territory: form.territory || null,
        legal_name: form.legal_name || null,
        tax_id: form.tax_id || null,
        registration_number: form.registration_number || null,
        credit_terms: form.credit_terms || null,
        account_plan: form.account_plan || null,
        notes: form.notes || null,
      });
      const id = result?.name;
      if (id) navigate('crm-account-detail', { id: String(id) });
      else navigate('crm-accounts');
    } catch (e: unknown) {
      showError(e, 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Corporate / fleet account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer *</label>
            <CrmCustomerLink
              value={form.customer}
              onValueChange={(v) => set('customer', v || '')}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Account name *
            </label>
            <Input
              value={form.account_name}
              onChange={(e) => set('account_name', e.target.value)}
              placeholder="Legal / trading name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={typeOptions}
              value={form.account_type}
              onValueChange={(v) => set('account_type', v || 'Corporate')}
              placeholder="Type…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Status</label>
            <SearchableSelect
              options={statusOptions}
              value={form.status}
              onValueChange={(v) => set('status', v || 'Active')}
              placeholder="Status…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Industry</label>
            <Input value={form.industry} onChange={(e) => set('industry', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Territory</label>
            <Input value={form.territory} onChange={(e) => set('territory', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Legal name</label>
            <Input value={form.legal_name} onChange={(e) => set('legal_name', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Tax ID</label>
            <Input value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Registration number
            </label>
            <Input
              value={form.registration_number}
              onChange={(e) => set('registration_number', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Credit terms</label>
            <Input
              value={form.credit_terms}
              onChange={(e) => set('credit_terms', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Account plan</label>
            <Textarea
              rows={3}
              value={form.account_plan}
              onChange={(e) => set('account_plan', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-accounts')}>
          Cancel
        </Button>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create account
        </Button>
      </FormActionsBar>
    </div>
  );
}
