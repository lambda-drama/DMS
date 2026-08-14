'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { listLeads } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { SearchableSelect } from '@/components/searchable-select';

export type CrmLeadOption = {
  value: string;
  label: string;
  description?: string;
  mobile?: string;
};

type Props = {
  value: string;
  onValueChange: (value: string, label?: string, meta?: { mobile?: string }) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
  /** Prefetched options (e.g. from call-log form options) — shown immediately. */
  presetOptions?: CrmLeadOption[];
};

/** Searchable DMS CRM Lead picker — select only, no free typing of IDs. */
export function CrmLeadLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Select a lead (optional)…',
  disabled,
  className,
  allowCreate = true,
  presetOptions,
}: Props) {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const { data, isLoading } = useSWR(['crm-link-leads', search], () =>
    listLeads({ search: search || undefined, limit: 50 })
  );

  const searched = useMemo<CrmLeadOption[]>(
    () =>
      ((data as { data?: Record<string, unknown>[] } | undefined)?.data || []).map((l) => ({
        value: String(l.name),
        label: String(l.lead_name || l.organization_name || l.name),
        description: [l.mobile_no || l.phone, l.status, l.name].filter(Boolean).map(String).join(' · '),
        mobile: String(l.mobile_no || l.phone || ''),
      })),
    [data]
  );

  const options = useMemo(() => {
    const byValue = new Map<string, CrmLeadOption>();
    for (const opt of presetOptions || []) {
      if (opt?.value) byValue.set(opt.value, opt);
    }
    for (const opt of searched) {
      byValue.set(opt.value, opt);
    }
    const list = Array.from(byValue.values());
    if (!search.trim()) return list;
    const q = search.trim().toLowerCase();
    return list.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q) ||
        (o.description || '').toLowerCase().includes(q)
    );
  }, [presetOptions, searched, search]);

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  return (
    <SearchableSelect
      className={className}
      options={options}
      value={value}
      valueLabel={selectedLabel}
      onValueChange={(next) => {
        // Clearing is allowed; free-text IDs are not — only option values.
        if (!next) {
          setLocalLabel('');
          onValueChange('', undefined, { mobile: '' });
          return;
        }
        const opt = options.find((o) => o.value === next);
        if (!opt) return;
        setLocalLabel(opt.label);
        onValueChange(opt.value, opt.label, { mobile: opt.mobile });
      }}
      onSearchChange={setSearch}
      placeholder={placeholder}
      emptyMessage="No leads found — create a lead first or clear search"
      isLoading={isLoading}
      disabled={disabled}
      onCreateNew={allowCreate ? () => navigate('crm-lead-new') : undefined}
      createNewLabel="Create lead"
    />
  );
}
