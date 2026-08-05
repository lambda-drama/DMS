'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  fetchAccountFormOptions,
  fetchCrmVehicleModels,
  getAccount,
  getFleetAftersales,
  updateAccount,
} from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft, Loader2, Plus, Trash2 } from 'lucide-react';

type Stakeholder = {
  contact?: string;
  person_name: string;
  role: string;
  email: string;
  phone: string;
  is_primary: number;
  notes: string;
};

type FleetUnit = {
  vehicle_vin: string;
  model: string;
  model_name: string;
  quantity: number;
  average_age_years: string;
  average_mileage: string;
  replacement_cycle_years: string;
  notes: string;
};

function FleetModelSelect({
  value,
  modelName,
  onChange,
}: {
  value: string;
  modelName?: string;
  onChange: (model: string, modelName: string) => void;
}) {
  const [search, setSearch] = useState('');
  const { data: models, isLoading } = useSWR(
    ['crm-account-fleet-models', search],
    () => fetchCrmVehicleModels(search || undefined),
    { dedupingInterval: 4000 }
  );

  const options = useMemo(() => {
    const rows = (models || []).map((vm) => ({
      value: vm.name,
      label: vm.model_name || vm.model_code || vm.name,
      description: [vm.brand_label || vm.brand, vm.variant, vm.model_code]
        .filter(Boolean)
        .join(' · '),
    }));
    // Keep current selection visible even if not in the latest search page
    if (value && !rows.some((r) => r.value === value)) {
      rows.unshift({
        value,
        label: modelName || value,
        description: 'Current selection',
      });
    }
    return rows;
  }, [models, value, modelName]);

  return (
    <div className="sm:col-span-2">
      <SearchableSelect
        options={options}
        value={value}
        valueLabel={modelName || undefined}
        onValueChange={(v) => {
          const hit = options.find((o) => o.value === v);
          onChange(v || '', hit?.label || modelName || '');
        }}
        onSearchChange={setSearch}
        placeholder="Search vehicle models…"
        emptyMessage="No vehicle models found"
        isLoading={isLoading}
      />
    </div>
  );
}

export default function CrmAccountDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: options } = useSWR('crm-account-form-options', fetchAccountFormOptions);
  const { data, isLoading, mutate } = useSWR(id ? ['crm-account', id] : null, () =>
    getAccount(id)
  );
  const { data: fleetSnap } = useSWR(
    data?.customer ? ['crm-fleet-aftersales', data.customer] : null,
    () => getFleetAftersales({ customer: String(data.customer), limit: 50 })
  );
  const [saving, setSaving] = useState(false);
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [form, setForm] = useState({
    account_name: '',
    account_type: '',
    status: '',
    industry: '',
    territory: '',
    legal_name: '',
    tax_id: '',
    registration_number: '',
    parent_account: '',
    credit_terms: '',
    payment_behavior: '',
    contracts_summary: '',
    account_plan: '',
    competitor_presence: '',
    growth_potential: '',
    relationship_health: '',
    replacement_notes: '',
    notes: '',
  });
  const [stakeholders, setStakeholders] = useState<Stakeholder[]>([]);
  const [fleetUnits, setFleetUnits] = useState<FleetUnit[]>([]);

  useEffect(() => {
    if (!data) return;
    setForm({
      account_name: String(data.account_name || ''),
      account_type: String(data.account_type || ''),
      status: String(data.status || ''),
      industry: String(data.industry || ''),
      territory: String(data.territory || ''),
      legal_name: String(data.legal_name || ''),
      tax_id: String(data.tax_id || ''),
      registration_number: String(data.registration_number || ''),
      parent_account: String(data.parent_account || ''),
      credit_terms: String(data.credit_terms || ''),
      payment_behavior: String(data.payment_behavior || ''),
      contracts_summary: String(data.contracts_summary || ''),
      account_plan: String(data.account_plan || ''),
      competitor_presence: String(data.competitor_presence || ''),
      growth_potential: String(data.growth_potential || ''),
      relationship_health: String(data.relationship_health || ''),
      replacement_notes: String(data.replacement_notes || ''),
      notes: String(data.notes || ''),
    });
    setStakeholders(
      (Array.isArray(data.stakeholders) ? data.stakeholders : []).map(
        (row: Record<string, unknown>) => ({
          contact: String(row.contact || ''),
          person_name: String(row.person_name || ''),
          role: String(row.role || 'Other'),
          email: String(row.email || ''),
          phone: String(row.phone || ''),
          is_primary: Number(row.is_primary || 0),
          notes: String(row.notes || ''),
        })
      )
    );
    setFleetUnits(
      (Array.isArray(data.fleet_units) ? data.fleet_units : []).map(
        (row: Record<string, unknown>) => ({
          vehicle_vin: String(row.vehicle_vin || ''),
          model: String(row.model || ''),
          model_name: String(row.model_name || ''),
          quantity: Number(row.quantity || 1),
          average_age_years:
            row.average_age_years != null ? String(row.average_age_years) : '',
          average_mileage: row.average_mileage != null ? String(row.average_mileage) : '',
          replacement_cycle_years:
            row.replacement_cycle_years != null
              ? String(row.replacement_cycle_years)
              : '',
          notes: String(row.notes || ''),
        })
      )
    );
  }, [data]);

  const selectOpts = (values?: string[]) =>
    (values || []).map((v) => ({ value: v, label: v }));

  const roleOptions = useMemo(() => selectOpts(options?.stakeholder_roles), [options]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async () => {
    if (!id) return;
    clear();
    if (!form.account_name.trim()) {
      showError('Account name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateAccount(id, {
        ...form,
        account_name: form.account_name.trim(),
        parent_account: form.parent_account || null,
        stakeholders: stakeholders.filter((s) => s.person_name || s.contact),
        fleet_units: fleetUnits.filter((u) => u.model || u.model_name || u.vehicle_vin),
      });
      await mutate();
      showSuccess('Account saved.');
    } catch (e: unknown) {
      showError(e, 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  if (!id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No account selected.
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return <Skeleton className="h-48" />;
  }

  const summary = (fleetSnap?.summary || {}) as Record<string, number>;

  return (
    <div className="dms-form-page space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('crm-accounts')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Accounts
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              navigate('crm-fleet-aftersales', {
                account: id,
                customer: String(data.customer || ''),
              })
            }
          >
            Fleet aftersales
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('crm-tender-new', { account: id })}
          >
            New tender
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Fleet size</p>
            <p className="text-2xl font-semibold">{String(data.fleet_size ?? 0)}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Outstanding</p>
            <p className="text-2xl font-semibold">
              {data.outstanding_balance != null
                ? Number(data.outstanding_balance).toLocaleString()
                : '—'}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Service overdue</p>
            <p className="text-2xl font-semibold">{summary.overdue ?? 0}</p>
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Due in 30 days</p>
            <p className="text-2xl font-semibold">{summary.due_soon ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Account record</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Account name
            </label>
            <Input
              value={form.account_name}
              onChange={(e) => set('account_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Customer</label>
            <p className="text-sm font-medium">
              {String(data.customer_name || data.customer)}
            </p>
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={selectOpts(options?.account_types)}
              value={form.account_type}
              onValueChange={(v) => set('account_type', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Status</label>
            <SearchableSelect
              options={selectOpts(options?.statuses)}
              value={form.status}
              onValueChange={(v) => set('status', v || '')}
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
            <Input
              value={form.legal_name}
              onChange={(e) => set('legal_name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Tax ID</label>
            <Input value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Registration
            </label>
            <Input
              value={form.registration_number}
              onChange={(e) => set('registration_number', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Parent account
            </label>
            <Input
              value={form.parent_account}
              onChange={(e) => set('parent_account', e.target.value)}
              placeholder="CRM-ACC-…"
            />
            {data.parent_account_name ? (
              <p className="text-xs text-muted-foreground">{String(data.parent_account_name)}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Credit terms
            </label>
            <Input
              value={form.credit_terms}
              onChange={(e) => set('credit_terms', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Payment behavior
            </label>
            <SearchableSelect
              options={selectOpts(options?.payment_behaviors)}
              value={form.payment_behavior}
              onValueChange={(v) => set('payment_behavior', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Growth potential
            </label>
            <SearchableSelect
              options={selectOpts(options?.growth_potentials)}
              value={form.growth_potential}
              onValueChange={(v) => set('growth_potential', v || '')}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Relationship health
            </label>
            <SearchableSelect
              options={selectOpts(options?.relationship_health)}
              value={form.relationship_health}
              onValueChange={(v) => set('relationship_health', v || '')}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Contracts / SLAs
            </label>
            <Textarea
              rows={2}
              value={form.contracts_summary}
              onChange={(e) => set('contracts_summary', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Account plan
            </label>
            <Textarea
              rows={3}
              value={form.account_plan}
              onChange={(e) => set('account_plan', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Competitor presence
            </label>
            <Textarea
              rows={2}
              value={form.competitor_presence}
              onChange={(e) => set('competitor_presence', e.target.value)}
            />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Replacement cycle notes
            </label>
            <Textarea
              rows={2}
              value={form.replacement_notes}
              onChange={(e) => set('replacement_notes', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Stakeholders</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setStakeholders((prev) => [
                ...prev,
                {
                  person_name: '',
                  role: 'Other',
                  email: '',
                  phone: '',
                  is_primary: 0,
                  notes: '',
                },
              ])
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {stakeholders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Add decision makers, procurement, finance, fleet and drivers.
            </p>
          ) : (
            stakeholders.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-6"
              >
                <Input
                  className="sm:col-span-2"
                  placeholder="Name"
                  value={row.person_name}
                  onChange={(e) =>
                    setStakeholders((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], person_name: e.target.value };
                      return next;
                    })
                  }
                />
                <SearchableSelect
                  options={roleOptions}
                  value={row.role}
                  onValueChange={(v) =>
                    setStakeholders((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], role: v || 'Other' };
                      return next;
                    })
                  }
                />
                <Input
                  placeholder="Email"
                  value={row.email}
                  onChange={(e) =>
                    setStakeholders((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], email: e.target.value };
                      return next;
                    })
                  }
                />
                <Input
                  placeholder="Phone"
                  value={row.phone}
                  onChange={(e) =>
                    setStakeholders((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], phone: e.target.value };
                      return next;
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() =>
                    setStakeholders((prev) => prev.filter((_, i) => i !== idx))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Existing fleet (by model)</CardTitle>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setFleetUnits((prev) => [
                ...prev,
                {
                  vehicle_vin: '',
                  model: '',
                  model_name: '',
                  quantity: 1,
                  average_age_years: '',
                  average_mileage: '',
                  replacement_cycle_years: '',
                  notes: '',
                },
              ])
            }
          >
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {fleetUnits.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Capture fleet composition by model, age, mileage and replacement cycle.
            </p>
          ) : (
            fleetUnits.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-lg border border-border/60 p-3 sm:grid-cols-6"
              >
                <FleetModelSelect
                  value={row.model}
                  modelName={row.model_name}
                  onChange={(model, modelName) =>
                    setFleetUnits((prev) => {
                      const next = [...prev];
                      next[idx] = { ...next[idx], model, model_name: modelName };
                      return next;
                    })
                  }
                />
                <Input
                  type="number"
                  placeholder="Qty"
                  value={row.quantity}
                  onChange={(e) =>
                    setFleetUnits((prev) => {
                      const next = [...prev];
                      next[idx] = {
                        ...next[idx],
                        quantity: Number(e.target.value || 1),
                      };
                      return next;
                    })
                  }
                />
                <Input
                  placeholder="Avg age (yrs)"
                  value={row.average_age_years}
                  onChange={(e) =>
                    setFleetUnits((prev) => {
                      const next = [...prev];
                      next[idx] = {
                        ...next[idx],
                        average_age_years: e.target.value,
                      };
                      return next;
                    })
                  }
                />
                <Input
                  placeholder="Avg mileage"
                  value={row.average_mileage}
                  onChange={(e) =>
                    setFleetUnits((prev) => {
                      const next = [...prev];
                      next[idx] = {
                        ...next[idx],
                        average_mileage: e.target.value,
                      };
                      return next;
                    })
                  }
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setFleetUnits((prev) => prev.filter((_, i) => i !== idx))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Tenders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Array.isArray(data.tenders) ? data.tenders : []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No tenders linked.</p>
            ) : (
              (data.tenders as Record<string, unknown>[]).map((t) => (
                <button
                  key={String(t.name)}
                  type="button"
                  className="flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-left text-sm hover:bg-muted/40"
                  onClick={() => navigate('crm-tender-detail', { id: String(t.name) })}
                >
                  <span className="font-medium">{String(t.title || t.name)}</span>
                  <Badge variant="secondary">{String(t.status || '')}</Badge>
                </button>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Framework agreements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(Array.isArray(data.agreements) ? data.agreements : []).length === 0 ? (
              <p className="text-sm text-muted-foreground">No agreements linked.</p>
            ) : (
              (data.agreements as Record<string, unknown>[]).map((a) => (
                <div
                  key={String(a.name)}
                  className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-sm"
                >
                  <span className="font-medium">
                    {String(a.agreement_title || a.name)}
                  </span>
                  <Badge variant="secondary">{String(a.status || '')}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {(Array.isArray(data.child_accounts) ? data.child_accounts : []).length > 0 ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Subsidiaries</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.child_accounts as Record<string, unknown>[]).map((c) => (
              <button
                key={String(c.name)}
                type="button"
                className="flex w-full items-center justify-between rounded-lg border border-border/60 px-3 py-2 text-left text-sm hover:bg-muted/40"
                onClick={() => navigate('crm-account-detail', { id: String(c.name) })}
              >
                <span>{String(c.account_name || c.name)}</span>
                <Badge variant="secondary">{String(c.account_type || '')}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <FormActionsBar>
        <Button onClick={() => void onSave()} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save account
        </Button>
      </FormActionsBar>
    </div>
  );
}
