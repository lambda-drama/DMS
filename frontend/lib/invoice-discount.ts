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

/** Backend stores "Percentage" / "Amount" on line rows. */
export type LineDiscountPayload = {
  discount_type: '' | 'Percentage' | 'Amount';
  discount_value: number;
};

export function discountModeFromBackend(type?: string | null): InvoiceDiscountMode {
  const t = (type || '').trim().toLowerCase();
  if (t === 'percentage' || t === 'percent') return 'percentage';
  if (t === 'amount') return 'amount';
  return 'none';
}

export function lineDiscountModeToBackend(mode: InvoiceDiscountMode): LineDiscountPayload['discount_type'] {
  if (mode === 'percentage') return 'Percentage';
  if (mode === 'amount') return 'Amount';
  return '';
}

/** Per-line discount payload sent to the job card / estimate / invoice APIs. */
export function buildLineDiscountPayload(
  mode: InvoiceDiscountMode,
  raw: string
): LineDiscountPayload {
  const value = parseDiscountValue(mode, raw);
  if (mode === 'none' || value <= 0) {
    return { discount_type: '', discount_value: 0 };
  }
  return { discount_type: lineDiscountModeToBackend(mode), discount_value: value };
}

/** Per-line discount — same math as a group discount, on one line's amount. */
export function lineDiscountAmount(
  lineAmount: number,
  mode: InvoiceDiscountMode,
  value: number
): number {
  return groupDiscountAmount(lineAmount, mode, value);
}

/** Short label for the compact line-discount button ('' when no discount). */
export function lineDiscountBadge(
  type?: string | null,
  value?: number | null
): string {
  const mode = discountModeFromBackend(type);
  const v = Number(value || 0);
  if (mode === 'none' || v <= 0) return '';
  return mode === 'percentage' ? `${v}%` : v.toLocaleString();
}
