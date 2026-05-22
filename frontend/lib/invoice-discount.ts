export type InvoiceDiscountMode = 'none' | 'percentage' | 'amount';

export type InvoiceGroupDiscount = {
  type: 'percentage' | 'amount';
  value: number;
};

export function parseDiscountValue(mode: InvoiceDiscountMode, raw: string): number {
  if (mode === 'none') return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/** Discount amount for a group subtotal (UI preview). */
export function groupDiscountAmount(
  subtotal: number,
  mode: InvoiceDiscountMode,
  value: number
): number {
  if (mode === 'none' || subtotal <= 0 || value <= 0) return 0;
  if (mode === 'percentage') return subtotal * (Math.min(value, 100) / 100);
  return Math.min(value, subtotal);
}

export function buildGroupDiscountPayload(
  mode: InvoiceDiscountMode,
  raw: string
): InvoiceGroupDiscount | undefined {
  const value = parseDiscountValue(mode, raw);
  if (mode === 'none' || value <= 0) return undefined;
  return { type: mode, value };
}
