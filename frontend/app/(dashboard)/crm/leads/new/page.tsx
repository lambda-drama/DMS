'use client';

import { useState } from 'react';
import { createLead } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { Loader2 } from 'lucide-react';

export default function CrmLeadNewPage() {
  const { navigate } = useNavigation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    lead_name: '',
    first_name: '',
    last_name: '',
    mobile_no: '',
    email: '',
    organization_name: '',
    source: 'Showroom Walk-in',
    priority: 'Standard',
    model: '',
    brand: '',
    next_action: 'First contact call',
    notes: '',
  });

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    setError('');
    if (!form.lead_name.trim() && !form.first_name.trim() && !form.mobile_no.trim()) {
      setError('Enter a lead name or mobile number.');
      return;
    }
    setSaving(true);
    try {
      const leadName =
        form.lead_name.trim() ||
        [form.first_name, form.last_name].filter(Boolean).join(' ') ||
        form.organization_name ||
        form.mobile_no;
      await createLead({ ...form, lead_name: leadName });
      navigate('crm-leads');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Prospect</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Lead Name</label>
            <Input value={form.lead_name} onChange={(e) => set('lead_name', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">First Name</label>
            <Input value={form.first_name} onChange={(e) => set('first_name', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Last Name</label>
            <Input value={form.last_name} onChange={(e) => set('last_name', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Mobile</label>
            <Input value={form.mobile_no} onChange={(e) => set('mobile_no', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Email</label>
            <Input value={form.email} onChange={(e) => set('email', e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Organization</label>
            <Input
              value={form.organization_name}
              onChange={(e) => set('organization_name', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Source</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
            >
              <option>Showroom Walk-in</option>
              <option>Website Form</option>
              <option>WhatsApp</option>
              <option>Phone Call</option>
              <option>Referral</option>
              <option>Facebook</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Priority</label>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
            >
              <option>Hot</option>
              <option>Warm</option>
              <option>Standard</option>
              <option>Fleet / Tender</option>
            </select>
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
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Next Action</label>
            <Input value={form.next_action} onChange={(e) => set('next_action', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes</label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} />
          </div>
          {error ? <p className="sm:col-span-2 text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-leads')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={onSave} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save Lead
        </Button>
      </FormActionsBar>
    </div>
  );
}
