'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  createOpportunity,
  fetchCrmBrands,
  fetchCrmBranches,
  fetchCrmColors,
  fetchCrmVehicleModels,
  fetchOpportunityFormOptions,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

const FALLBACK_STAGES = [
  'New',
  'Qualified',
  'Test Drive',
  'Quotation Submitted',
  'Negotiation',
  'Booking / Deposit',
  'Won',
  'Lost',
];

export default function CrmOpportunityNewPage() {
  const { navigate } = useNavigation();
  const [saving, setSaving] = useState(false);
  const { error, success, showError, clear } = useCrmFeedback();
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [form, setForm] = useState({
    title: '',
    customer: '',
    stage: 'New',
    expected_value: '',
    model: '',
    brand: '',
    preferred_color: '',
    company: '',
    branch: '',
    next_action: 'Qualify opportunity',
    expected_close_date: '',
  });

  const { data: options } = useSWR('crm-opp-form-options', fetchOpportunityFormOptions);
  const stageOptions = useMemo(
    () => (options?.stages || FALLBACK_STAGES).map((s) => ({ value: s, label: s })),
    [options]
  );
  const companyOptions = useMemo(
    () => (options?.companies || []).map((c) => ({ value: c, label: c })),
    [options]
  );

  useEffect(() => {
    if (options?.default_company && !form.company) {
      setForm((prev) => ({ ...prev, company: options.default_company || '' }));
    }
  }, [options, form.company]);

  const { data: brands, isLoading: brandsLoading } = useSWR(
    ['crm-opp-brands', brandSearch],
    () => fetchCrmBrands(brandSearch),
    { keepPreviousData: true }
  );
  const { data: models, isLoading: modelsLoading } = useSWR(
    ['crm-opp-models', modelSearch, form.brand],
    () => fetchCrmVehicleModels(modelSearch, form.brand || undefined),
    { keepPreviousData: true }
  );
  const { data: colors, isLoading: colorsLoading } = useSWR(
    ['crm-opp-colors', colorSearch],
    () => fetchCrmColors(colorSearch),
    { keepPreviousData: true }
  );
  const { data: branches } = useSWR(
    ['crm-opp-branches', form.company],
    () => fetchCrmBranches(form.company || undefined),
    { keepPreviousData: true }
  );

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    clear();
    if (!form.title.trim()) {
      showError('Title is required.');
      return;
    }
    if (!form.customer) {
      showError('Select a customer.');
      return;
    }
    if (!form.company) {
      showError('Company is required.');
      return;
    }
    setSaving(true);
    try {
      const created = (await createOpportunity({
        title: form.title.trim(),
        customer: form.customer,
        stage: form.stage,
        expected_value: form.expected_value ? Number(form.expected_value) : 0,
        model: form.model || undefined,
        brand: form.brand || undefined,
        preferred_color: form.preferred_color || undefined,
        company: form.company,
        branch: form.branch || undefined,
        next_action: form.next_action || undefined,
        expected_close_date: form.expected_close_date || undefined,
        status: form.stage === 'Won' ? 'Won' : form.stage === 'Lost' ? 'Lost' : 'Open',
      })) as { name?: string };
      if (created?.name) {
        navigate('crm-opportunity-detail', { id: created.name });
      } else {
        navigate('crm-opportunities');
      }
    } catch (e: unknown) {
      showError(e, 'Failed to create deal');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Opportunity</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Title *</label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer *</label>
            <CrmCustomerLink
              value={form.customer}
              onValueChange={(v) => set('customer', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Company *</label>
            <SearchableSelect
              options={companyOptions}
              value={form.company}
              onValueChange={(v) =>
                setForm((prev) => ({ ...prev, company: v || '', branch: '' }))
              }
              placeholder="Company…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Branch</label>
            <SearchableSelect
              options={(branches || []).map((b) => ({
                value: b.name,
                label: b.branch || b.name,
              }))}
              value={form.branch}
              onValueChange={(v) => set('branch', v || '')}
              placeholder="Branch…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Pipeline stage</label>
            <SearchableSelect
              options={stageOptions}
              value={form.stage}
              onValueChange={(v) => set('stage', v || 'New')}
              placeholder="Stage…"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Expected close
            </label>
            <Input
              type="date"
              value={form.expected_close_date}
              onChange={(e) => set('expected_close_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Opportunity amount
              {options?.currency_symbol ? ` (${options.currency_symbol})` : ''}
            </label>
            <Input
              type="number"
              value={form.expected_value}
              onChange={(e) => set('expected_value', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Brand</label>
            <SearchableSelect
              options={(brands || []).map((b) => ({
                value: b.name,
                label: b.label || b.name,
              }))}
              value={form.brand}
              onValueChange={(v) =>
                setForm((prev) => ({
                  ...prev,
                  brand: v || '',
                  model: v && prev.brand && v !== prev.brand ? '' : prev.model,
                }))
              }
              onSearchChange={setBrandSearch}
              placeholder="Search brand…"
              isLoading={brandsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Model</label>
            <SearchableSelect
              options={(models || []).map((vm) => ({
                value: vm.name,
                label: vm.model_code || vm.name,
                description:
                  [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
              }))}
              value={form.model}
              onValueChange={(v) => {
                const selected = (models || []).find((m) => m.name === v);
                setForm((prev) => ({
                  ...prev,
                  model: v || '',
                  brand: prev.brand || selected?.brand || '',
                }));
              }}
              onSearchChange={setModelSearch}
              placeholder="Search vehicle models…"
              isLoading={modelsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Color</label>
            <SearchableSelect
              options={(colors || []).map((c) => ({
                value: c.name,
                label: c.label || c.name,
              }))}
              value={form.preferred_color}
              onValueChange={(v) => set('preferred_color', v || '')}
              onSearchChange={setColorSearch}
              placeholder="Preferred color…"
              isLoading={colorsLoading}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Next Action
            </label>
            <Input value={form.next_action} onChange={(e) => set('next_action', e.target.value)} />
          </div>
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
