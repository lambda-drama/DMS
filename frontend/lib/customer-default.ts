import type { DmsCustomerDefaults } from '@/services/common';
import type { Customer } from '@/types/dms';

export type CustomerFieldMeta = {
  name: string;
  customer_name: string;
  mobile_no?: string;
};

export function customerMetaFromDefaults(
  defaults: DmsCustomerDefaults | undefined
): CustomerFieldMeta | null {
  if (!defaults?.default_customer) return null;
  return {
    name: defaults.default_customer,
    customer_name: defaults.customer_name || defaults.default_customer,
    mobile_no: defaults.mobile_no || undefined,
  };
}

export function buildCustomerSelectOptions(
  customers: Customer[] | undefined,
  customer: string,
  customerMeta: CustomerFieldMeta | null
) {
  const mapped =
    customers?.map((c) => ({
      value: c.name,
      label: c.customer_name,
      description: c.mobile_no || undefined,
    })) || [];

  if (customer && customerMeta && !mapped.some((o) => o.value === customer)) {
    return [
      {
        value: customerMeta.name,
        label: customerMeta.customer_name,
        description: customerMeta.mobile_no,
      },
      ...mapped,
    ];
  }

  return mapped;
}

/** Apply DMS Settings default when cleared, otherwise set selected customer meta. */
export function resolveCustomerFieldChange(
  id: string,
  customers: Customer[] | undefined,
  defaults: DmsCustomerDefaults | undefined
): { customer: string; meta: CustomerFieldMeta | null } {
  if (!id) {
    const defaultMeta = customerMetaFromDefaults(defaults);
    if (defaultMeta) {
      return { customer: defaultMeta.name, meta: defaultMeta };
    }
    return { customer: '', meta: null };
  }

  const match = customers?.find((c) => c.name === id);
  if (match) {
    return {
      customer: match.name,
      meta: {
        name: match.name,
        customer_name: match.customer_name,
        mobile_no: match.mobile_no,
      },
    };
  }

  return { customer: id, meta: { name: id, customer_name: id } };
}
