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
import { Label } from '@/components/ui/label';
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
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { GroupDiscountFields } from '@/components/group-discount-fields';
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
  const [submitInvoice, setSubmitInvoice] = useState(true);
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
      partsInput: string
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
      return invoicesSvc.getInvoicePreviewFromJobCard(jobCardId, {
        warrantyApplicationType: warrantyApplicationType || undefined,
        labourDiscount,
        partsDiscount,
      });
    },
    [jobCardId]
  );

  useEffect(() => {
    if (!open || !jobCardId) return;

    let cancelled = false;
    skipWarrantyRefetch.current = true;
    setLoading(true);
    setPreview(null);
    setDueDate(defaultDueDate());
    setSubmitInvoice(true);

    invoicesSvc
      .getInvoicePreviewFromJobCard(jobCardId)
      .then((data) => {
        if (cancelled) return;
        setPreview(data);
        setWarrantyType(warrantyFromPreview(data));
        applyDiscountsFromPreview(data);
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
        partsDiscountInput
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
    open,
    jobCardId,
    loadPreview,
  ]);

  const handleCreate = async () => {
    if (!preview) return;

    if (preview.has_labour && !dueDate) {
      toast.error('Due date is required when labour items are on the invoice');
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
        submit: submitInvoice,
        warrantyApplicationType: warrantyApplicationType || undefined,
        labourDiscount: warrantyType === 'Discount' ? labourDiscount : undefined,
        partsDiscount: warrantyType === 'Discount' ? partsDiscount : undefined,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
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
                    ? 'Warranty-covered lines are included at full rate with 100% line discount (DMS Settings).'
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.lines.map((line, idx) => (
                    <TableRow
                      key={`${line.item_code}-${idx}`}
                      className={line.is_warranty_covered ? 'bg-muted/40' : undefined}
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
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate" title={line.description}>
                        {line.description}
                      </TableCell>
                      <TableCell className="text-right">{line.qty}</TableCell>
                      <TableCell className="text-right">
                        {line.is_warranty_covered &&
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

            {preview.has_labour && (
              <div className="space-y-2">
                <Label htmlFor="invoice-due-date">Due payment date *</Label>
                <Input
                  id="invoice-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            )}

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

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}
