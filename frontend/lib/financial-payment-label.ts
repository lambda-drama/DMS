/**
 * Financials UI label only — does not change Job Card.payment_status in the backend.
 *
 * Warranty job cards (and All Invoice warranty application) → Warranty Paid.
 * Discount warranty application (settled) → Discount.
 * Otherwise Paid / Partially Paid / Unpaid from invoice + stored status.
 */
export function getFinancialPaymentLabel(opts: {
  jobCardType?: string | null;
  paymentStatus?: string | null;
  warrantyApplicationType?: string | null;
  hasActiveInvoice?: boolean;
  invoiceOutstanding?: number | null;
  invoiceGrandTotal?: number | null;
  invoiceStatus?: string | null;
}): string {
  const type = (opts.jobCardType || "").trim();
  const stored = (opts.paymentStatus || "").trim();
  const wt = (opts.warrantyApplicationType || "").trim();

  if (type === "Internal" || stored === "Internal") return "Internal";

  // Warranty jobs are not customer-paid — always show Warranty Paid in Financials.
  if (type === "Warranty") return "Warranty Paid";

  if (!opts.hasActiveInvoice) {
    return stored || "Unpaid";
  }

  const outstanding = Number(opts.invoiceOutstanding ?? NaN);
  const grand = Number(opts.invoiceGrandTotal ?? NaN);
  const invStatus = String(opts.invoiceStatus || "").toLowerCase();
  const settled =
    (Number.isFinite(outstanding) && outstanding <= 0.01) ||
    invStatus === "paid" ||
    stored === "Paid" ||
    stored === "Warranty";

  if (!settled) {
    if (
      (Number.isFinite(outstanding) &&
        outstanding > 0.01 &&
        Number.isFinite(grand) &&
        grand - outstanding > 0.01) ||
      invStatus.includes("partly") ||
      stored === "Partially Paid"
    ) {
      return "Partially Paid";
    }
    return stored || "Unpaid";
  }

  if (wt === "All Invoice") return "Warranty Paid";
  if (wt === "Discount") return "Discount";
  if ((wt === "Labour" || wt === "Spare Part") && Number.isFinite(grand) && grand <= 0.01) {
    return "Warranty Paid";
  }
  if (stored === "Warranty") return "Warranty Paid";
  return "Paid";
}
