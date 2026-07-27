'use client';

import { useState } from 'react';
import { createOpportunity } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { Loader2 } from 'lucide-react';

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

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    setError('');
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    try {
      await createOpportunity({
        ...form,
        expected_value: form.expected_value ? Number(form.expected_value) : 0,
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
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Title</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Customer (ERPNext ID)
            </label>
            <Input value={form.customer} onChange={(e) => set('customer', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Stage</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.stage}
              onChange={(e) => set('stage', e.target.value)}
            >
              <option>New</option>
              <option>Qualified</option>
              <option>Test Drive</option>
              <option>Quotation Submitted</option>
              <option>Negotiation</option>
              <option>Booking / Deposit</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Expected Value
            </label>
            <Input
              type="number"
              value={form.expected_value}
              onChange={(e) => set('expected_value', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Brand</label>
            <Input value={form.brand} onChange={(e) => set('brand', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Model</label>
            <Input value={form.model} onChange={(e) => set('model', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
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
