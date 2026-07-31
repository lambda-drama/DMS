'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { createLead, fetchLeadFormOptions } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import {
  LeadFormSections,
  emptyLeadForm,
  leadPayload,
  type LeadFormState,
} from '@/components/crm/lead-form';
import { Loader2 } from 'lucide-react';

export default function CrmLeadNewPage() {
  const { navigate } = useNavigation();
  const { data: options } = useSWR('crm-lead-form-options', fetchLeadFormOptions);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<LeadFormState>(emptyLeadForm);

  useEffect(() => {
    if (!options) return;
    setForm((prev) => ({
      ...prev,
      company: prev.company || options.default_company || '',
      source: prev.source || options.sources?.[0] || 'Showroom Walk-in',
    }));
  }, [options]);

  const onSave = async () => {
    setError('');
    if (!form.lead_name.trim() && !form.first_name.trim() && !form.mobile_no.trim()) {
      setError('Enter a lead name, first name, or mobile number.');
      return;
    }
    if (!form.source) {
      setError('Lead source is required.');
      return;
    }
    setSaving(true);
    try {
      const created = (await createLead(leadPayload(form))) as { name?: string };
      if (created?.name) {
        navigate('crm-lead-detail', { id: created.name });
      } else {
        navigate('crm-leads');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create lead');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dms-form-page space-y-4">
      <LeadFormSections form={form} setForm={setForm} options={options} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
