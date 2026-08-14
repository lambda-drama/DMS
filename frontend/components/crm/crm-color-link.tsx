'use client';

import { useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { fetchCrmColors } from '@/services/crm';
import { SearchableSelect } from '@/components/searchable-select';
import { LinkWithCreate } from '@/components/link-with-create';

type Props = {
  value: string;
  onValueChange: (value: string) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
};

export function CrmColorLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search color…',
  disabled,
  className,
  allowCreate = true,
}: Props) {
  const { mutate } = useSWRConfig();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const { data, isLoading } = useSWR(['crm-link-colors', search], () =>
    fetchCrmColors(search || undefined)
  );

  const options = useMemo(
    () =>
      (data || []).map((c) => ({
        value: String(c.name),
        label: String(c.label || c.name),
      })),
    [data]
  );

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  const select = (
    <SearchableSelect
      className={className}
      options={options}
      value={value}
      valueLabel={selectedLabel}
      onValueChange={(next) => {
        const opt = options.find((o) => o.value === next);
        setLocalLabel(opt?.label || next || '');
        onValueChange(next || '');
      }}
      onSearchChange={setSearch}
      placeholder={placeholder}
      emptyMessage="No colors found"
      isLoading={isLoading}
      disabled={disabled}
    />
  );

  if (!allowCreate || disabled) return select;

  return (
    <LinkWithCreate
      doctype="Color"
      onCreated={(name, label) => {
        setLocalLabel(label || name);
        onValueChange(name);
        void mutate(
          (key) => Array.isArray(key) && String(key[0]).includes('color'),
          undefined,
          { revalidate: true }
        );
      }}
    >
      {select}
    </LinkWithCreate>
  );
}
