'use client';

import { useMemo, useState } from 'react';
import { createOpportunity } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { Loader2 } from 'lucide-react';

const STAGES = [
  'New',
  'Qualified',
  'Test Drive',
  'Quotation Submitted',
  'Negotiation',
  'Booking / Deposit',
];

export default function CrmOpportunityNewPage() {
  const { navigate } = useNavigation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    customer: '',
    stage: 'New',
    expected_value: '',
    model: '',
    brand: '',
    next_action: 'Qualify opportunity',
  });

  const stageOptions = useMemo(
    () => STAGES.map((s) => ({ value: s, label: s })),
    []
  );

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    setError('');
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    if (!form.customer) {
      setError('Select a customer.');
      return;
    }
    setSaving(true);
    try {
      await createOpportunity({
        title: form.title.trim(),
        customer: form.customer,
        stage: form.stage,
        expected_value: form.expected_value ? Number(form.expected_value) : 0,
        model: form.model || undefined,
        brand: form.brand || undefined,
        next_action: form.next_action || undefined,
        status: 'Open',
      });
      navigate('crm-opportunities');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Title</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <CrmCustomerLink
              value={form.customer}
              onValueChange={(v) => set('customer', v)}
              placeholder="Search customers by name, mobile, or ID…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Stage</label>
            <SearchableSelect
              options={stageOptions}
              value={form.stage}
              onValueChange={(v) => set('stage', v || 'New')}
              placeholder="Select stage…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Expected Value
            </label>
            <Input
              type="number"
              value={form.expected_value}
              onChange={(e) => set('expected_value', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Brand</label>
            <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Model</label>
            <Input value={form.model} onChange={(e) => set('model', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Next Action
            </label>
            <Input value={form.next_action} onChange={(e) => set('next_action', e.target.value)} />
          </div>
          {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-opportunities')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Deal
        </Button>
      </FormActionsBar>
    </div>
  );
}
