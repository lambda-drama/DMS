'use client';

import { useMemo, useState } from 'react';
import useSWR, { mutate as globalMutate } from 'swr';
import { listCustomers } from '@/services/crm';
import { SearchableSelect } from '@/components/searchable-select';
import {
  CreateCustomerDialog,
  type CreateCustomerDefaults,
} from '@/components/crm/create-customer-dialog';

type Props = {
  value: string;
  onValueChange: (value: string, label?: string) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
  /** Prefill create-customer modal (e.g. from a lead). */
  createDefaults?: CreateCustomerDefaults;
};

/**
 * CRM Customer link — same searchable UX as DMS item/customer pickers.
 * "Create customer" opens an in-place modal and auto-selects the new record.
 */
export function CrmCustomerLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search customers…',
  disabled,
  className,
  allowCreate = true,
  createDefaults,
}: Props) {
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const [createOpen, setCreateOpen] = useState(false);
  const { data, isLoading, mutate } = useSWR(['crm-link-customers', search], () =>
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
    <>
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
        onCreateNew={allowCreate ? () => setCreateOpen(true) : undefined}
        createNewLabel="Create customer"
      />
      {allowCreate ? (
        <CreateCustomerDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaults={createDefaults}
          onCreated={(name, label) => {
            setLocalLabel(label);
            onValueChange(name, label);
            void mutate();
            void globalMutate(
              (key) => Array.isArray(key) && key[0] === 'crm-link-customers',
              undefined,
              { revalidate: true }
            );
          }}
        />
      ) : null}
    </>
  );
}
