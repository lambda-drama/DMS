'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { listCrmDrivers } from '@/services/crm';
import { SearchableSelect } from '@/components/searchable-select';

export type CrmDriverPick = {
  license?: string;
  phone?: string;
  issuingDate?: string;
  expiryDate?: string;
};

type Props = {
  value: string;
  onValueChange: (value: string, label?: string, meta?: CrmDriverPick) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

/** Searchable ERPNext Driver picker for test-drive forms. */
export function CrmDriverLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search drivers…',
  disabled,
  className,
}: Props) {
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const { data, isLoading } = useSWR(['crm-link-drivers', search], () =>
    listCrmDrivers({ search: search || undefined, limit: 50 })
  );

  const options = useMemo(
    () =>
      (data || []).map((d: Record<string, unknown>) => {
        const label = String(d.full_name || d.name);
        return {
          value: String(d.name),
          label,
          description: [d.license_number, d.cell_number, d.name]
            .filter(Boolean)
            .map(String)
            .join(' · '),
          license: String(d.license_number || ''),
          phone: String(d.cell_number || ''),
          issuingDate: String(d.issuing_date || '').slice(0, 10),
          expiryDate: String(d.expiry_date || '').slice(0, 10),
        };
      }),
    [data]
  );

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
        if (!next) {
          setLocalLabel('');
          onValueChange('', undefined, { license: '', phone: '', issuingDate: '', expiryDate: '' });
          return;
        }
        const opt = options.find((o) => o.value === next);
        if (!opt) return;
        setLocalLabel(opt.label);
        onValueChange(opt.value, opt.label, {
          license: opt.license,
          phone: opt.phone,
          issuingDate: opt.issuingDate,
          expiryDate: opt.expiryDate,
        });
      }}
      onSearchChange={setSearch}
      placeholder={placeholder}
      emptyMessage="No drivers found"
      isLoading={isLoading}
      disabled={disabled}
    />
  );
}
