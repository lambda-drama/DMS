/**
 * Orders service — customer orders (Sales Orders) for spare parts that are not
 * in stock yet: place the order, take a payment / advance, invoice it later.
 */
import { apiRequest } from './apiClient';
import type { InvoiceTaxPreview, StandaloneInvoiceGroupDiscount } from './invoices';

const API = 'dms.api.orders';

export type DmsOrderListItem = {
  name: string;
  sales_order?: string;
  customer?: string;
  customer_name?: string;
  company?: string;
  transaction_date?: string;
  delivery_date?: string;
  net_total?: number;
  total_taxes_and_charges?: number;
  grand_total?: number;
  advance_paid?: number;
  balance?: number;
  currency?: string;
  status?: string;
  docstatus?: number;
  per_billed?: number;
  converted?: boolean;
  /** 1 when the order was placed with tax withholding (TCS) for its invoice. */
  apply_tax_withholding?: number | boolean;
  /** Withholding category stamped on the order by the DMS Settings default. */
  tax_withholding_category?: string | null;
  tax_withholding_group?: string | null;
  /** Cancelled order that was amended into this one. */
  amended_from?: string | null;
  /** 1 when this cancelled order already has an amendment draft. */
  already_amended?: number | boolean;
  /** The amendment draft that replaced this cancelled order, if any. */
  amended_as?: string | null;
};

export type DmsOrderItem = {
  spare_part?: string;
  item_code?: string;
  item_name?: string;
  /** Sales Order Item description (Display Name typed on the order line). */
  description?: string;
  qty?: number;
  billed_qty?: number;
  rate?: number;
  amount?: number;
  warehouse?: string;
};

export type DmsOrderLabour = {
  vehicle_service_item?: string;
  vehicle_service_item_name?: string;
  /** Sales Order Item description (Display Name typed on the order line). */
  description?: string;
  hours?: number;
  rate_per_hour?: number;
  amount?: number;
};

export type DmsOrderPayment = {
  name: string;
  posting_date?: string;
  mode_of_payment?: string;
  paid_amount?: number;
  allocated_amount?: number;
  reference_no?: string;
  docstatus?: number;
};

export type DmsOrderDetail = DmsOrderListItem & {
  warehouse?: string | null;
  remarks?: string | null;
  /** 1 when the Sales Order carries tax rows (Include VAT ticked). */
  apply_taxes?: number | boolean;
  /**
   * 1 when the order's Sales Invoice must withhold tax (TCS). ERPNext applies
   * withholding on Sales Invoices only, so the intent is stored on the order and
   * used at conversion time.
   */
  apply_tax_withholding?: number | boolean;
  /** Tax Withholding Category the invoice will use (DMS Settings default). */
  tax_withholding_category?: string | null;
  /** Tax Withholding Group the invoice will use, when the category needs one. */
  tax_withholding_group?: string | null;
  items: DmsOrderItem[];
  /** Spare part lines (server-classified). */
  parts: DmsOrderItem[];
  /** Labour lines (Vehicle Service Item rows). */
  labour: DmsOrderLabour[];
  payments: DmsOrderPayment[];
  sales_invoices: string[];
};

export type DmsOrderPartLine = {
  spare_part: string;
  qty: number | string;
  unit_price?: number | string;
  /** Display Name typed on the order line → Sales Order Item description. */
  description?: string;
};

export type DmsOrderLabourLine = {
  vehicle_service_item: string;
  hours: number | string;
  rate_per_hour?: number | string;
  /** Display Name typed on the order line → Sales Order Item description. */
  description?: string;
};

export type DmsOrderInput = {
  name?: string;
  customer?: string;
  company?: string;
  warehouse?: string;
  currency?: string;
  transaction_date?: string;
  delivery_date?: string;
  remarks?: string;
  /** Include VAT — DMS Settings Default Taxes and Charges Template. */
  apply_taxes?: boolean;
  /**
   * Withhold tax (TCS) when the order is invoiced — DMS Settings Default Tax
   * Withholding Category. Stored on the order and applied to its Sales Invoice.
   */
  apply_tax_withholding?: boolean;
  labour_discount?: StandaloneInvoiceGroupDiscount;
  parts_discount?: StandaloneInvoiceGroupDiscount;
  submit?: number;
  parts?: DmsOrderPartLine[];
  labour?: DmsOrderLabourLine[];
};

export type DmsOrderSaveResult = {
  name: string;
  sales_order?: string;
  docstatus?: number;
  customer?: string;
  customer_name?: string;
  net_total?: number;
  total_taxes_and_charges?: number;
  grand_total?: number;
  advance_paid?: number;
  balance?: number;
  status?: string;
};

export type DmsOrderPaymentResult = {
  payment_entry: string;
  paid_amount?: number;
  grand_total?: number;
  advance_paid?: number;
  balance?: number;
  mode_of_payment?: string;
};

/**
 * Fields the payment / invoice dialogs need. Satisfied by both the list row and the
 * full order detail, so the same dialogs work from the table and the slide-over.
 */
export type DmsOrderPaymentSource = Pick<
  DmsOrderListItem,
  | 'name'
  | 'customer'
  | 'customer_name'
  | 'company'
  | 'currency'
  | 'grand_total'
  | 'advance_paid'
  | 'balance'
  | 'delivery_date'
  | 'docstatus'
>;

export type DmsOrderInvoiceResult = {
  name: string;
  sales_invoice?: string;
  docstatus?: number;
  grand_total?: number;
  outstanding_amount?: number;
  status?: string;
  sales_order?: string;
  per_billed?: number;
};

export async function listDmsOrders(options?: {
  search?: string;
  status?: string;
  customer?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}): Promise<{ data: DmsOrderListItem[]; total: number }> {
  return apiRequest(`/api/method/${API}.list_dms_orders`, {
    method: 'POST',
    body: JSON.stringify({
      search: options?.search || null,
      status: options?.status || null,
      customer: options?.customer || null,
      from_date: options?.from_date || null,
      to_date: options?.to_date || null,
      limit: options?.limit ?? 50,
      offset: options?.offset ?? 0,
    }),
  });
}

export async function getDmsOrder(name: string): Promise<DmsOrderDetail> {
  return apiRequest(`/api/method/${API}.get_dms_order`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function createDmsOrder(data: DmsOrderInput): Promise<DmsOrderSaveResult> {
  return apiRequest(`/api/method/${API}.create_dms_order`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function updateDmsOrder(data: DmsOrderInput): Promise<DmsOrderSaveResult> {
  return apiRequest(`/api/method/${API}.update_dms_order`, {
    method: 'POST',
    body: JSON.stringify({ data }),
  });
}

export async function submitDmsOrder(name: string): Promise<DmsOrderSaveResult> {
  return apiRequest(`/api/method/${API}.submit_dms_order`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function cancelDmsOrder(name: string): Promise<{ name: string; status?: string }> {
  return apiRequest(`/api/method/${API}.cancel_dms_order`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function deleteDraftDmsOrder(name: string): Promise<{ deleted: string }> {
  return apiRequest(`/api/method/${API}.delete_draft_dms_order`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

/** Amend a cancelled order — creates a new editable draft copy to re-submit. */
export async function amendDmsOrder(name: string): Promise<DmsOrderDetail> {
  return apiRequest(`/api/method/${API}.amend_dms_order`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export type DmsOrderPaymentRowInput = {
  mode_of_payment: string;
  amount: number | string;
  reference_no?: string | null;
  remarks?: string | null;
};

/** Payment / advance recorded against the order (allocated to the Sales Order). */
export async function recordDmsOrderPayment(
  name: string,
  data: {
    /** Multi-mode rows — one Payment Entry per mode (same modal as invoice collection). */
    payments?: DmsOrderPaymentRowInput[];
    /** Legacy single-mode shorthand. */
    amount?: number | string;
    mode_of_payment?: string | null;
    reference_no?: string | null;
    posting_date?: string | null;
    remarks?: string | null;
  }
): Promise<DmsOrderPaymentResult> {
  return apiRequest(`/api/method/${API}.record_dms_order_payment`, {
    method: 'POST',
    body: JSON.stringify({ name, data }),
  });
}

/** Raise the Sales Invoice for the order (stock is checked here). */
export async function createDmsOrderInvoice(
  name: string,
  data?: {
    warehouse?: string | null;
    posting_date?: string | null;
    due_date?: string | null;
    submit?: number;
  }
): Promise<DmsOrderInvoiceResult> {
  return apiRequest(`/api/method/${API}.create_dms_order_invoice`, {
    method: 'POST',
    body: JSON.stringify({ name, data: data || {} }),
  });
}

/**
 * Invoice-side tax preview for an order that has not been saved yet: the VAT the
 * Sales Order will carry plus the tax withholding (TCS) its Sales Invoice will
 * deduct. Comes from the same payload the save uses, so the numbers match.
 */
export type DmsOrderTaxPreview = InvoiceTaxPreview & {
  /** Totals stored on the Sales Order itself — withholding is invoice-only. */
  order_net_total?: number;
  order_total_taxes_and_charges?: number;
  order_grand_total?: number;
};

/**
 * VAT / withholding preview for the order form. The lines must already carry the
 * same quantities, rates and discounts that will be saved.
 */
export async function getOrderTaxPreview(params: {
  customer?: string | null;
  company?: string | null;
  warehouse?: string | null;
  currency?: string | null;
  transaction_date?: string | null;
  delivery_date?: string | null;
  apply_taxes?: boolean | number;
  apply_tax_withholding?: boolean | number;
  parts?: DmsOrderPartLine[];
  labour?: DmsOrderLabourLine[];
  labour_discount?: StandaloneInvoiceGroupDiscount | null;
  parts_discount?: StandaloneInvoiceGroupDiscount | null;
}): Promise<DmsOrderTaxPreview> {
  return apiRequest<DmsOrderTaxPreview>(`/api/method/${API}.get_order_tax_preview`, {
    method: 'POST',
    body: JSON.stringify({
      data: {
        customer: params.customer || null,
        company: params.company || null,
        warehouse: params.warehouse || null,
        currency: params.currency || null,
        transaction_date: params.transaction_date || null,
        delivery_date: params.delivery_date || null,
        apply_taxes: params.apply_taxes ? 1 : 0,
        apply_tax_withholding: params.apply_tax_withholding ? 1 : 0,
        parts: params.parts?.length ? params.parts : null,
        labour: params.labour?.length ? params.labour : null,
        labour_discount: params.labour_discount || null,
        parts_discount: params.parts_discount || null,
      },
    }),
  });
}
