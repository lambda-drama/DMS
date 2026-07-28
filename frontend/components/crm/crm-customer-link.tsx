'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { listCustomers } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { SearchableSelect } from '@/components/searchable-select';

type Props = {
  value: string;
  onValueChange: (value: string, label?: string) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
};

/**
 * CRM Customer link — same searchable UX as DMS item/customer pickers.
 */
export function CrmCustomerLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search customers…',
  disabled,
  className,
  allowCreate = true,
}: Props) {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const { data, isLoading } = useSWR(['crm-link-customers', search], () =>
    listCustomers({ search: search || undefined, limit: 50 })
  );

  const options = useMemo(
    () =>
      (data?.data || []).map((c: Record<string, unknown>) => ({
        value: String(c.name),
        label: String(c.customer_name || c.name),
        description: [c.mobile_no, c.customer_group, c.name]
          .filter(Boolean)
          .map(String)
          .join(' · '),
      })),
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
        const opt = options.find((o) => o.value === next);
        const label = opt?.label || '';
        setLocalLabel(label);
        onValueChange(next, label || undefined);
      }}
      onSearchChange={setSearch}
      placeholder={placeholder}
      emptyMessage={data?.message || 'No customers found'}
      isLoading={isLoading}
      disabled={disabled}
      onCreateNew={allowCreate ? () => navigate('crm-customer-new') : undefined}
      createNewLabel="Create customer"
    />
  );
}
