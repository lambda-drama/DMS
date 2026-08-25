'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  fetchSparePartPrice,
  fetchSpareParts,
  formatSparePartLabel,
  formatSparePartSelectDescription,
} from '@/services/common';
import { SearchableSelect } from '@/components/searchable-select';

type Props = {
  value: string;
  onValueChange: (
    value: string,
    meta?: { item_name?: string; uom?: string; rate?: number }
  ) => void;
  valueLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

export function CrmSparePartLink({
  value,
  onValueChange,
  valueLabel,
  placeholder = 'Search spare parts…',
  disabled,
  className,
}: Props) {
  const [search, setSearch] = useState('');
  const [localLabel, setLocalLabel] = useState(valueLabel || '');

  const { data, isLoading } = useSWR(['crm-link-spare-parts', search], () =>
    fetchSpareParts(search || undefined)
  );

  const options = useMemo(
    () =>
      (data || [])
        .map((part) => {
          const erpItem = String(part.spare_part_item || part.item_code || '').trim();
          if (!erpItem) return null;
          return {
            value: erpItem,
            label: formatSparePartLabel(part),
            description: formatSparePartSelectDescription(part),
            item_name: String(part.item_name || ''),
            uom: 'Nos',
            selling_price: Number((part as { selling_price?: number }).selling_price || 0),
            spare_part_name: part.name,
          };
        })
        .filter(Boolean) as Array<{
        value: string;
        label: string;
        description?: string;
        item_name: string;
        uom: string;
        selling_price: number;
        spare_part_name: string;
      }>,
    [data]
  );

  const selectedLabel =
    (value && (localLabel || valueLabel)) ||
    options.find((o) => o.value === value)?.label ||
    undefined;

  const pickPart = async (erpItem: string) => {
    const opt = options.find((o) => o.value === erpItem);
    if (!opt) {
      setLocalLabel(erpItem);
      onValueChange(erpItem || '', { item_name: erpItem || '' });
      return;
    }

    setLocalLabel(opt.label);

    let rate = opt.selling_price;
    if (!rate && opt.spare_part_name) {
      try {
        rate = await fetchSparePartPrice(opt.spare_part_name);
      } catch {
        rate = 0;
      }
    }

    onValueChange(erpItem, {
      item_name: opt.item_name || opt.label,
      uom: opt.uom,
      rate,
    });
  };

  return (
    <SearchableSelect
      className={className}
      options={options}
      value={value}
      valueLabel={selectedLabel}
      onValueChange={(next) => void pickPart(next || '')}
      onSearchChange={setSearch}
      placeholder={placeholder}
      emptyMessage="No spare parts found"
      isLoading={isLoading}
      disabled={disabled}
    />
  );
}
