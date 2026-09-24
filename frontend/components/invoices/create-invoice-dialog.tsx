'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { GroupDiscountFields } from '@/components/group-discount-fields';
import { InvoiceTaxBreakdown } from '@/components/invoices/invoice-tax-breakdown';
import {
  buildGroupDiscountPayload,
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from '@/lib/invoice-discount';
import * as invoicesSvc from '@/services/invoices';
import type { InvoicePreview, WarrantyApplicationType } from '@/types/dms';

const WARRANTY_OPTIONS: { value: string; label: string }[] = [
  { value: 'none', label: 'None (bill full amounts)' },
  { value: 'All Invoice', label: 'All Invoice (warranty — zero rates)' },
  { value: 'Labour', label: 'Labour (parts billed, labour at 0)' },
  { value: 'Spare Part', label: 'Spare Part (labour billed, parts at 0)' },
  { value: 'Discount', label: 'Discount' },
];

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function warrantyFromPreview(preview: InvoicePreview): string {
  const w = preview.warranty_application_type;
  return w ? String(w) : 'none';
}

function discountModeFromApi(
  d?: { type: string; value: number } | null
): InvoiceDiscountMode {
  if (!d?.type) return 'none';
  const t = String(d.type).toLowerCase();
  if (t === 'percentage' || t === 'amount') return t;
  return 'none';
}

function discountInputFromApi(d?: { type: string; value: number } | null): string {
  if (!d?.value) return '';
  return String(d.value);
}

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobCardId: string;
  onCreated: (invoiceName: string) => void;
}

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  jobCardId,
  onCreated,
}: CreateInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [preview, setPreview] = useState<InvoicePreview | null>(null);
  const [warrantyType, setWarrantyType] = useState('none');
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [labourDiscountInput, setLabourDiscountInput] = useState('');
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [partsDiscountInput, setPartsDiscountInput] = useState('');
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [postingDate, setPostingDate] = useState(todayLocalDate);
  const [submitInvoice, setSubmitInvoice] = useState(true);
  const [applyTaxes, setApplyTaxes] = useState(false);
  const [applyTaxWithholding, setApplyTaxWithholding] = useState(false);
  const [remark, setRemark] = useState('');
  const [taxPreview, setTaxPreview] = useState<invoicesSvc.InvoiceTaxPreview | null>(null);
  const [taxPreviewLoading, setTaxPreviewLoading] = useState(false);
  const [editedRates, setEditedRates] = useState<Record<string, number>>({});
  const [excludedRows, setExcludedRows] = useState<string[]>([]);
  const [editedQty, setEditedQty] = useState<Record<string, number>>({});
  const skipWarrantyRefetch = useRef(true);

  const applyDiscountsFromPreview = useCallback((data: InvoicePreview) => {
    if (data.labour_discount) {
      setLabourDiscountMode(discountModeFromApi(data.labour_discount));
      setLabourDiscountInput(discountInputFromApi(data.labour_discount));
    } else {
      setLabourDiscountMode('none');
      setLabourDiscountInput('');
    }
    if (data.parts_discount) {
      setPartsDiscountMode(discountModeFromApi(data.parts_discount));
      setPartsDiscountInput(discountInputFromApi(data.parts_discount));
    } else {
      setPartsDiscountMode('none');
      setPartsDiscountInput('');
    }
  }, []);

  const loadPreview = useCallback(
    async (
      warranty: string,
      labourMode: InvoiceDiscountMode,
      labourInput: string,
      partsMode: InvoiceDiscountMode,
      partsInput: string,
      rates: Record<string, number>,
      excluded: string[],
      qty: Record<string, number>
    ) => {
      const warrantyApplicationType =
        warranty === 'none' ? '' : (warranty as WarrantyApplicationType);
      const labourDiscount =
        warranty === 'Discount'
          ? buildGroupDiscountPayload(labourMode, labourInput)
          : undefined;
      const partsDiscount =
        warranty === 'Discount'
          ? buildGroupDiscountPayload(partsMode, partsInput)
          : undefined;
      const rateOverrides =
        Object.keys(rates).length > 0 ? rates : undefined;
      return invoicesSvc.getInvoicePreviewFromJobCard(jobCardId, {
        warrantyApplicationType: warrantyApplicationType || undefined,
        labourDiscount,
        partsDiscount,
        rateOverrides,
        excludeRows: excluded.length ? excluded : undefined,
        qtyOverrides: Object.keys(qty).length > 0 ? qty : undefined,
      });
    },
    [jobCardId]
  );

  useEffect(() => {
    if (!preview) return;
    setEditedRates((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const line of preview.lines) {
        if (line.source_row && next[line.source_row] === undefined) {
          next[line.source_row] = line.base_rate ?? line.rate;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [preview]);

  useEffect(() => {
    if (!open || !jobCardId) return;

    let cancelled = false;
    skipWarrantyRefetch.current = true;
    setLoading(true);
    setPreview(null);
    setEditedRates({});
    setExcludedRows([]);
    setEditedQty({});
    setDueDate(defaultDueDate());
    setPostingDate(todayLocalDate());
    setSubmitInvoice(true);
    setApplyTaxes(false);
    setRemark('');

    invoicesSvc
      .getInvoicePreviewFromJobCard(jobCardId)
      .then((data) => {
        if (cancelled) return;
        setPreview(data);
        setWarrantyType(warrantyFromPreview(data));
        applyDiscountsFromPreview(data);
        // Prefill with the remark already on the Job Card (if any).
        setRemark(data.remark || '');
      })
      .catch((err: Error) => {
        if (!cancelled) {
          toast.error(err.message || 'Failed to load invoice preview');
          onOpenChange(false);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          skipWarrantyRefetch.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [open, jobCardId, onOpenChange, applyDiscountsFromPreview]);

  // VAT / tax-withholding amounts for the lines above — recalculated whenever a
  // checkbox, a line or the posting date changes, so the total is visible before
  // the invoice is created.
  useEffect(() => {
    if (!open || !preview || preview.lines.length === 0) {
      setTaxPreview(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setTaxPreviewLoading(true);
      invoicesSvc
        .getInvoiceTaxPreview({
          company: preview.company,
          customer: preview.customer,
          currency: preview.currency,
          posting_date: postingDate,
          apply_taxes: applyTaxes,
          apply_tax_withholding: applyTaxWithholding,
          lines: preview.lines.map((line) => ({
            item_code: line.item_code,
            qty: line.qty,
            rate: line.rate,
            description: line.description,
          })),
        })
        .then((data) => {
          if (!cancelled) setTaxPreview(data);
        })
        .catch(() => {
          if (!cancelled) setTaxPreview(null);
        })
        .finally(() => {
          if (!cancelled) setTaxPreviewLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [open, preview, postingDate, applyTaxes, applyTaxWithholding]);

  useEffect(() => {
    if (!open || !jobCardId || skipWarrantyRefetch.current) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      setLoading(true);
      loadPreview(
        warrantyType,
        labourDiscountMode,
        labourDiscountInput,
        partsDiscountMode,
        partsDiscountInput,
        editedRates,
        excludedRows,
        editedQty
      )
        .then((data) => {
          if (!cancelled) setPreview(data);
        })
        .catch((err: Error) => {
          if (!cancelled) {
            toast.error(err.message || 'Failed to update invoice preview');
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    warrantyType,
    labourDiscountMode,
    labourDiscountInput,
    partsDiscountMode,
    partsDiscountInput,
    editedRates,
    excludedRows,
    editedQty,
    open,
    jobCardId,
    loadPreview,
  ]);

  const handleRemovePart = (sourceRow?: string) => {
    if (!sourceRow || !preview) return;
    // Only parts lines can be dropped — the job card itself is left untouched.
    if (!preview.lines.some((line) => line.source_row === sourceRow && line.line_type === 'Parts')) {
      return;
    }
    if (preview.lines.length <= 1) {
      toast.error('Keep at least one billable line on the invoice');
      return;
    }
    setExcludedRows((prev) => (prev.includes(sourceRow) ? prev : [...prev, sourceRow]));
  };

  const handleRestoreRemoved = () => {
    if (!excludedRows.length) return;
    setExcludedRows([]);
    setEditedQty((prev) => {
      const next = { ...prev };
      for (const row of excludedRows) delete next[row];
      return next;
    });
  };

  const handleCreate = async () => {
    if (!preview) return;

    if (preview.has_labour && !dueDate) {
      toast.error('Due date is required when labour items are on the invoice');
      return;
    }

    if (!postingDate) {
      toast.error('Posting date is required');
      return;
    }

    const labourDiscount = buildGroupDiscountPayload(
      labourDiscountMode,
      labourDiscountInput
    );
    const partsDiscount = buildGroupDiscountPayload(
      partsDiscountMode,
      partsDiscountInput
    );

    if (warrantyType === 'Discount') {
      const labourVal = parseDiscountValue(labourDiscountMode, labourDiscountInput);
      const partsVal = parseDiscountValue(partsDiscountMode, partsDiscountInput);
      const totalDisc =
        groupDiscountAmount(preview.labour_total, labourDiscountMode, labourVal) +
        groupDiscountAmount(preview.parts_total, partsDiscountMode, partsVal);
      if (totalDisc < 1) {
        toast.error(
          'Set a labour and/or parts discount (total at least 1) when warranty type is Discount'
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const warrantyApplicationType =
        warrantyType === 'none' ? '' : (warrantyType as WarrantyApplicationType);
      const invoiceName = await invoicesSvc.createInvoiceFromJobCard(jobCardId, {
        dueDate: preview.has_labour ? dueDate : dueDate || undefined,
        postingDate,
        submit: submitInvoice,
        applyTaxes,
        applyTaxWithholding,
        warrantyApplicationType: warrantyApplicationType || undefined,
        labourDiscount: warrantyType === 'Discount' ? labourDiscount : undefined,
        partsDiscount: warrantyType === 'Discount' ? partsDiscount : undefined,
        rateOverrides:
          Object.keys(editedRates).length > 0 ? editedRates : undefined,
        excludeRows: excludedRows.length ? excludedRows : undefined,
        qtyOverrides: Object.keys(editedQty).length > 0 ? editedQty : undefined,
        // Always send (even when empty) so clearing the field clears it on the job card.
        remarks: remark,
      });
      toast.success(
        submitInvoice
          ? 'Sales invoice created and submitted'
          : 'Sales invoice created as draft'
      );
      onCreated(invoiceName);
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create invoice');
    } finally {
      setSubmitting(false);
    }
  };

  const currency = preview?.currency;
  const neverRequestedCount =
    preview?.lines.filter((line) => line.never_requested).length || 0;
  const labourDiscountVal = parseDiscountValue(labourDiscountMode, labourDiscountInput);
  const partsDiscountVal = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const previewLabourDisc =
    preview && warrantyType === 'Discount'
      ? groupDiscountAmount(preview.labour_total, labourDiscountMode, labourDiscountVal)
      : 0;
  const previewPartsDisc =
    preview && warrantyType === 'Discount'
      ? groupDiscountAmount(preview.parts_total, partsDiscountMode, partsDiscountVal)
      : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Sales Invoice</DialogTitle>
          <DialogDescription>
            Review billable items from job card {jobCardId}. Warranty from the job card is
            pre-filled — change it here if needed before creating the invoice.
          </DialogDescription>
        </DialogHeader>

        {loading && !preview ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : preview ? (
          <>
            <div className="space-y-1 text-sm">
              <p>
                <span className="text-muted-foreground">Customer: </span>
                <span className="font-medium">{preview.customer_name}</span>
              </p>
              {preview.existing_invoice && (
                <p className="text-amber-600 text-xs">
                  This job card already has invoice {preview.existing_invoice} linked
                  (creating another may be blocked).
                </p>
              )}
              {preview.job_card_warranty_application_type &&
                preview.job_card_warranty_application_type !== preview.warranty_application_type && (
                  <p className="text-xs text-muted-foreground">
                    Job card warranty: {preview.job_card_warranty_application_type} (overridden
                    below)
                  </p>
                )}
              {neverRequestedCount > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p className="text-xs">
                    {neverRequestedCount} spare part
                    {neverRequestedCount === 1 ? ' was' : 's were'} never requested on a parts
                    requisition. You can still reduce the billed quantity or remove
                    {neverRequestedCount === 1 ? ' it' : ' them'} from this invoice — the job
                    card is updated too.
                  </p>
                </div>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                Reducing a spare part quantity or removing a part line also updates the job
                card (billable qty and totals) when the invoice is created — even after the job
                card is Completed. A removed part that was already issued is marked Returned on
                the card; return the physical part with Parts Return or a manual Stock Entry.
              </p>
              {excludedRows.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {excludedRows.length} part line{excludedRows.length === 1 ? '' : 's'} removed
                  from this invoice.{' '}
                  <button
                    type="button"
                    className="font-medium text-primary underline underline-offset-2"
                    onClick={handleRestoreRemoved}
                  >
                    Restore {excludedRows.length === 1 ? 'it' : 'them'}
                  </button>
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Warranty application type</Label>
                <Select
                  value={warrantyType}
                  onValueChange={(v) => {
                    setWarrantyType(v);
                    if (v !== 'Discount') {
                      setLabourDiscountMode('none');
                      setLabourDiscountInput('');
                      setPartsDiscountMode('none');
                      setPartsDiscountInput('');
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warranty application" />
                  </SelectTrigger>
                  <SelectContent>
                    {WARRANTY_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {preview.add_full_warranty_item_on_invoice
                    ? 'Warranty-covered lines are included at full selling rate. Warranty is taken off the invoice total so the customer outstanding is 0 (or parts/labour only).'
                    : 'Warranty-covered lines are omitted from the invoice (DMS Settings). Billable lines only.'}
                </p>
              </div>

              {warrantyType === 'Discount' && (
                <div className="space-y-4 sm:col-span-2">
                  <GroupDiscountFields
                    label="Labour"
                    mode={labourDiscountMode}
                    onModeChange={setLabourDiscountMode}
                    value={labourDiscountInput}
                    onValueChange={setLabourDiscountInput}
                    subtotal={preview.labour_total}
                  />
                  <GroupDiscountFields
                    label="Parts"
                    mode={partsDiscountMode}
                    onModeChange={setPartsDiscountMode}
                    value={partsDiscountInput}
                    onValueChange={setPartsDiscountInput}
                    subtotal={preview.parts_total}
                  />
                  <p className="text-xs text-muted-foreground">
                    Discounts apply to labour and parts separately (same as standalone invoice).
                    Each billable line gets a net rate; DMS Discount on the Sales Invoice is for
                    audit only.
                  </p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Recommended prices are pre-filled from the item master — adjust the Rate column
              when the customer agrees to a different selling price. Spare part quantities can be
              reduced (parts only), and any part line can be removed — the job card is updated to
              match when you create the invoice.
            </p>

            <div className="dms-table-panel rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    {warrantyType === 'Discount' && preview.discount_amount > 0 ? (
                      <TableHead className="text-right">DMS disc.</TableHead>
                    ) : null}
                    <TableHead className="w-10">
                      <span className="sr-only">Remove</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.lines.map((line, idx) => (
                    <TableRow
                      key={`${line.item_code}-${idx}`}
                      className={
                        line.never_requested
                          ? 'bg-amber-50/80 dark:bg-amber-950/20'
                          : line.is_warranty_covered
                            ? 'bg-muted/40'
                            : undefined
                      }
                    >
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline">{line.line_type}</Badge>
                          {line.is_warranty_covered && (
                            <Badge variant="secondary" className="w-fit text-xs">
                              {line.discount_percentage && line.discount_percentage >= 100
                                ? 'Warranty (100% disc.)'
                                : 'Warranty'}
                            </Badge>
                          )}
                          {line.never_requested && (
                            <Badge
                              variant="outline"
                              className="w-fit border-amber-400 bg-amber-100 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200"
                            >
                              Not requested
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className="max-w-[200px] truncate"
                        title={line.issue || line.description}
                      >
                        {line.description}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.line_type === 'Parts' && line.source_row ? (
                          <DecimalInput
                            min={0}
                            max={line.max_qty ?? undefined}
                            className="ml-auto h-8 w-20 text-right"
                            blankWhenZero={false}
                            value={editedQty[line.source_row] ?? line.qty}
                            onValueChange={(value) => {
                              const rowKey = line.source_row!;
                              const maxQty = line.max_qty ?? line.qty;
                              const next = Math.min(Math.max(value, 0), maxQty);
                              setEditedQty((prev) => ({ ...prev, [rowKey]: next }));
                              // Zero quantity bills nothing — drop the line and let the user
                              // restore it from the removed-lines notice.
                              setExcludedRows((prev) => {
                                if (next > 0) {
                                  return prev.filter((row) => row !== rowKey);
                                }
                                return prev.includes(rowKey) ? prev : [...prev, rowKey];
                              });
                            }}
                            onBlur={() => {
                              skipWarrantyRefetch.current = false;
                            }}
                            title={
                              line.max_qty != null
                                ? `Bill up to ${line.max_qty} (job card quantity)`
                                : undefined
                            }
                          />
                        ) : (
                          line.qty
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.source_row ? (
                          <DecimalInput
                            min={0}
                            className="ml-auto h-8 w-28 text-right"
                            blankWhenZero={false}
                            value={
                              editedRates[line.source_row] ??
                              line.base_rate ??
                              line.rate
                            }
                            onValueChange={(value) => {
                              setEditedRates((prev) => ({
                                ...prev,
                                [line.source_row!]: value,
                              }));
                            }}
                            onBlur={() => {
                              skipWarrantyRefetch.current = false;
                            }}
                          />
                        ) : line.is_warranty_covered &&
                        (line.discount_percentage ?? 0) >= 100 &&
                        line.base_rate != null ? (
                          <span>{formatMoney(line.base_rate, currency)}</span>
                        ) : line.is_warranty_covered &&
                          line.base_rate != null &&
                          line.base_rate > line.rate ? (
                          <span className="space-x-1">
                            <span className="text-muted-foreground line-through">
                              {formatMoney(line.base_rate, currency)}
                            </span>
                            <span>{formatMoney(line.rate, currency)}</span>
                          </span>
                        ) : (
                          formatMoney(line.rate, currency)
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMoney(line.amount, currency)}
                      </TableCell>
                      {warrantyType === 'Discount' && preview.discount_amount > 0 ? (
                        <TableCell className="text-right text-destructive text-xs">
                          {line.dms_discount && line.dms_discount > 0
                            ? `−${formatMoney(line.dms_discount, currency)}`
                            : '—'}
                        </TableCell>
                      ) : null}
                      <TableCell className="text-right">
                        {line.line_type === 'Parts' && line.source_row ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-destructive hover:text-destructive"
                            onClick={() => handleRemovePart(line.source_row)}
                            title={
                              line.never_requested
                                ? 'Remove this unrequested part from the invoice and the job card'
                                : 'Remove this part from the invoice and the job card'
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only sm:ml-1">Remove</span>
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="flex justify-between sm:block">
                <span className="text-muted-foreground">Labour</span>
                <span className="font-medium sm:ml-2">
                  {formatMoney(preview.labour_total, currency)}
                </span>
              </div>
              <div className="flex justify-between sm:block">
                <span className="text-muted-foreground">Parts</span>
                <span className="font-medium sm:ml-2">
                  {formatMoney(preview.parts_total, currency)}
                </span>
              </div>
              {warrantyType === 'Discount' && previewLabourDisc > 0 && (
                <div className="flex justify-between sm:block">
                  <span className="text-muted-foreground">Labour discount</span>
                  <span className="font-medium text-destructive sm:ml-2">
                    −{formatMoney(previewLabourDisc, currency)}
                  </span>
                </div>
              )}
              {warrantyType === 'Discount' && previewPartsDisc > 0 && (
                <div className="flex justify-between sm:block">
                  <span className="text-muted-foreground">Parts discount</span>
                  <span className="font-medium text-destructive sm:ml-2">
                    −{formatMoney(previewPartsDisc, currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between border-t pt-2 sm:col-span-2 sm:block">
                <span className="text-muted-foreground">Estimated subtotal (excl. tax)</span>
                <span className="font-semibold sm:ml-2">
                  {formatMoney(preview.estimated_total, currency)}
                </span>
              </div>
              {warrantyType === 'Discount' && preview.discount_amount > 0 && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Tax and grand total are calculated in ERPNext on save from discounted line
                  rates (not a separate header discount).
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="invoice-posting-date">Posting date</Label>
                <Input
                  id="invoice-posting-date"
                  type="date"
                  value={postingDate}
                  onChange={(e) => setPostingDate(e.target.value)}
                  required
                />
              </div>
              {preview.has_labour ? (
                <div className="space-y-2">
                  <Label htmlFor="invoice-due-date">Due payment date *</Label>
                  <Input
                    id="invoice-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="invoice-due-date">Due payment date</Label>
                  <Input
                    id="invoice-due-date"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoice-remark">Remarks</Label>
              <Textarea
                id="invoice-remark"
                rows={2}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="e.g. notes about this billing / agreed price"
              />
              <p className="text-xs text-muted-foreground">
                Saved on the Job Card and shown in the invoice detail.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="submit-invoice"
                checked={submitInvoice}
                onCheckedChange={(c) => setSubmitInvoice(c === true)}
              />
              <Label htmlFor="submit-invoice" className="font-normal cursor-pointer">
                Submit invoice after creation
              </Label>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="apply-taxes"
                  checked={applyTaxes}
                  onCheckedChange={(c) => setApplyTaxes(c === true)}
                />
                <Label htmlFor="apply-taxes" className="font-normal cursor-pointer">
                  Include VAT
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Uses the Default Taxes and Charges Template from DMS Settings. Leave unchecked
                to create the invoice without VAT.
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="apply-tax-withholding"
                  checked={applyTaxWithholding}
                  onCheckedChange={(c) => setApplyTaxWithholding(c === true)}
                />
                <Label htmlFor="apply-tax-withholding" className="font-normal cursor-pointer">
                  Include tax withholding (TCS)
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                Applies the Default Tax Withholding Category from DMS Settings — with Use
                Withholding Group ticked the group goes on the invoice, otherwise the category is
                saved on the customer. ERPNext fills the Tax Withholding Entries on save.
              </p>
            </div>

            <InvoiceTaxBreakdown
              subtotal={preview.estimated_total}
              currency={preview.currency}
              applyTaxes={applyTaxes}
              applyTaxWithholding={applyTaxWithholding}
              preview={taxPreview}
              isLoading={taxPreviewLoading}
            />
          </>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!preview || submitting || loading}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create invoice'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function todayLocalDate() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
