'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { createCustomer, fetchCustomerCreateOptions } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { SearchableSelect } from '@/components/searchable-select';
import { Loader2 } from 'lucide-react';

export default function CrmCustomerNewPage() {
  const { navigate } = useNavigation();
  const { data: options, isLoading: optionsLoading } = useSWR(
    'crm-customer-create-options',
    fetchCustomerCreateOptions
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [duplicates, setDuplicates] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState({
    customer_name: '',
    customer_type: 'Individual',
    customer_group: '',
    mobile_no: '',
    email_id: '',
    territory: '',
    tax_id: '',
    website: '',
  });

  useEffect(() => {
    if (!options) return;
    setForm((prev) => ({
      ...prev,
      customer_group: prev.customer_group || options.default_customer_group || '',
      customer_type: prev.customer_type || options.customer_types?.[0] || 'Individual',
    }));
  }, [options]);

  const typeOptions = useMemo(
    () => (options?.customer_types || ['Individual', 'Company']).map((t) => ({ value: t, label: t })),
    [options]
  );
  const groupOptions = useMemo(
    () => (options?.customer_groups || []).map((g) => ({ value: g, label: g })),
    [options]
  );
  const territoryOptions = useMemo(
    () => (options?.territories || []).map((t) => ({ value: t, label: t })),
    [options]
  );

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const onSave = async (force = false) => {
    setError('');
    if (!form.customer_name.trim()) {
      setError('Customer name is required.');
      return;
    }
    if (!form.customer_group) {
      setError('Select a DMS customer group.');
      return;
    }
    setSaving(true);
    try {
      const result = await createCustomer(
        {
          customer_name: form.customer_name.trim(),
          customer_type: form.customer_type,
          customer_group: form.customer_group,
          mobile_no: form.mobile_no.trim() || undefined,
          email_id: form.email_id.trim() || undefined,
          territory: form.territory || undefined,
          tax_id: form.tax_id.trim() || undefined,
          website: form.website.trim() || undefined,
        },
        force
      );

      if (result?.error === 'possible_duplicates') {
        setDuplicates(result.duplicates || []);
        setError(result.message || 'Possible duplicate customers found.');
        return;
      }

      const id = result?.name;
      if (id) {
        navigate('crm-customer-detail', { id });
      } else {
        navigate('crm-customers');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create customer');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Customer details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Customer name
            </label>
            <Input
              value={form.customer_name}
              onChange={(e) => set('customer_name', e.target.value)}
              placeholder="Legal or display name"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Type</label>
            <SearchableSelect
              options={typeOptions}
              value={form.customer_type}
              onValueChange={(v) => set('customer_type', v || 'Individual')}
              placeholder="Select type…"
              isLoading={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">
              Customer group
            </label>
            <SearchableSelect
              options={groupOptions}
              value={form.customer_group}
              onValueChange={(v) => set('customer_group', v)}
              placeholder="Search customer group…"
              emptyMessage="No DMS customer groups configured"
              isLoading={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Mobile</label>
            <Input value={form.mobile_no} onChange={(e) => set('mobile_no', e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Email</label>
            <Input
              type="email"
              value={form.email_id}
              onChange={(e) => set('email_id', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Territory</label>
            <SearchableSelect
              options={territoryOptions}
              value={form.territory}
              onValueChange={(v) => set('territory', v)}
              placeholder="Search territory…"
              isLoading={optionsLoading}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Tax ID</label>
            <Input value={form.tax_id} onChange={(e) => set('tax_id', e.target.value)} />
          </div>
          <div className="sm:col-span-2 space-y-2">
            <label className="block text-xs font-medium text-muted-foreground">Website</label>
            <Input value={form.website} onChange={(e) => set('website', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {duplicates.length > 0 ? (
        <Card className="border-amber-500/40 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Possible duplicates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {duplicates.map((d) => (
                <li key={String(d.name)} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{String(d.customer_name || d.name)}</p>
                    <p className="text-xs text-muted-foreground">
                      {[d.mobile_no, d.email_id, d.name].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('crm-customer-detail', { id: String(d.name) })}
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
            <Button type="button" variant="secondary" disabled={saving} onClick={() => onSave(true)}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create anyway
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <FormActionsBar>
        <Button variant="outline" onClick={() => navigate('crm-customers')} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={() => onSave(false)} disabled={saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Create customer
        </Button>
      </FormActionsBar>
    </div>
  );
}
