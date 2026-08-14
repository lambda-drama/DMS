'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { listCrmVehicles } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { SearchableSelect } from '@/components/searchable-select';

export type CrmVinPick = {
  vin: string;
  customer?: string;
  customerName?: string;
  plate?: string;
  model?: string;
};

type Props = {
  value: string;
  onValueChange: (vin: string, picked?: CrmVinPick) => void;
  customer?: string;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  allowCreate?: boolean;
};

/**
 * VIN No picker — searchable dropdown, not a free-text document name.
 * With a customer and no search, lists that buyer's vehicles first.
 * Typing searches all VINs (plate, model, chassis).
 */
export function CrmVinLink({
  value,
  onValueChange,
  customer,
  valueLabel,
  placeholder = 'Search VIN, plate, or model…',
  disabled,
  className,
  allowCreate = true,
}: Props) {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');
  const { data, isLoading } = useSWR(
    ['crm-link-vins', search, customer || ''],
    () =>
      listCrmVehicles({
        search: search || undefined,
        customer: search ? undefined : customer || undefined,
        limit: 50,
      })
  );

  const options = useMemo(
    () =>
      (data?.data || []).map((v: Record<string, unknown>) => {
        const vin = String(v.vin_number || v.name);
        const model = [v.brand, v.model_name || v.model, v.model_year]
          .filter(Boolean)
          .map(String)
          .join(' · ');
        return {
          value: String(v.name || vin),
          label: vin,
          description: [v.plate_number, model, v.customer_name].filter(Boolean).map(String).join(' · '),
          customer: String(v.current_customer || ''),
          customerName: String(v.customer_name || ''),
          plate: String(v.plate_number || ''),
          model,
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
        const opt = options.find((o) => o.value === next);
        setLocalLabel(opt?.label || next || '');
        onValueChange(
          next,
          opt
            ? {
                vin: opt.value,
                customer: opt.customer || undefined,
                customerName: opt.customerName || undefined,
                plate: opt.plate || undefined,
                model: opt.model || undefined,
              }
            : undefined
        );
      }}
      onSearchChange={setSearch}
      placeholder={placeholder}
      emptyMessage={
        customer && !search
          ? 'No vehicles for this customer. Type a VIN to search all units.'
          : 'No vehicles found'
      }
      isLoading={isLoading}
      disabled={disabled}
      onCreateNew={allowCreate && !disabled ? () => navigate('vehicle-new') : undefined}
      createNewLabel="Register vehicle"
    />
  );
}
