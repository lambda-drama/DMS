'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SearchableSelect } from '@/components/searchable-select';
import { AddLineButton } from '@/components/ui/add-line-button';
import { Loader2, Trash2, Wallet } from 'lucide-react';
import { toast } from 'sonner';
import * as paymentSvc from '@/services/paymentEntries';
import * as invoicesSvc from '@/services/invoices';
import { useCompanies, useCustomers, useAutofillSingleCompany } from '@/hooks/use-dms';
import type { PaymentEntryListItem } from '@/types/dms';

type ModeOption = {
  name: string;
  type?: string;
  account?: string | null;
  account_name?: string | null;
};

type AdvanceRow = {
  id: string;
  mode_of_payment: string;
  amount: number;
  reference_no: string;
};

function newAdvanceRow(mode = '', amount = 0): AdvanceRow {
  return { id: crypto.randomUUID(), mode_of_payment: mode, amount, reference_no: '' };
}

export interface CreateAdvancePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-selected customer (Job Card / Service Estimate). When omitted the user picks one. */
  customer?: string;
  customerName?: string;
  /** Company of the source document; falls back to the first DMS company. */
  company?: string;
  jobCard?: string;
  serviceEstimate?: string;
  defaultAmount?: number;
  /**
   * Cancelled advance being replaced. Pre-fills amount / mode(s) / date so the
   * user can edit them, and links the new entry as the amendment.
   */
  amendEntry?: PaymentEntryListItem | null;
  onCreated?: (result: {
    name: string;
    payment_entries?: string[];
    paid_amount: number;
    customer?: string;
  }) => void;
}

export function CreateAdvancePaymentDialog({
  open,
  onOpenChange,
  customer: customerProp,
  customerName: customerNameProp,
  company: companyProp,
  jobCard,
  serviceEstimate,
  defaultAmount,
  amendEntry,
  onCreated,
}: CreateAdvancePaymentDialogProps) {
  const amending = Boolean(amendEntry?.name);
  const lockedCustomer = Boolean(customerProp);
  const lockedCompany = Boolean(companyProp);

  const [customer, setCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [company, setCompany] = useState('');
  const [rows, setRows] = useState<AdvanceRow[]>([newAdvanceRow()]);
  const [postingDate, setPostingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [modes, setModes] = useState<ModeOption[]>([]);
  const [modesLoading, setModesLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);

  useAutofillSingleCompany(companies, companiesLoading, company, (c) => setCompany(c.name), {
    enabled: !lockedCompany,
  });

  const customerOptions = useMemo(
    () =>
      (customers ?? []).map((c) => ({
        value: c.name,
        label: c.customer_name || c.name,
        description: c.customer_name ? c.name : undefined,
      })),
    [customers]
  );

  // Destructured so the reset effect does not depend on object identity.
  const amendName = amendEntry?.name || '';
  const amendMode = amendEntry?.mode_of_payment || '';
  const amendAmount = Number(amendEntry?.paid_amount) || 0;
  const amendPostingDate = amendEntry?.posting_date || '';
  const amendRemarks = amendEntry?.remarks || '';

  // Reset fields each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setCustomer(customerProp || '');
    setCustomerSearch('');
    setCompany(companyProp || '');
    if (amendName) {
      setRows([newAdvanceRow(amendMode, amendAmount)]);
      setPostingDate(amendPostingDate || new Date().toISOString().split('T')[0]);
      setRemarks(amendRemarks);
    } else {
      setRows([newAdvanceRow('', Number(defaultAmount) > 0 ? Number(defaultAmount) : 0)]);
      setPostingDate(new Date().toISOString().split('T')[0]);
      setRemarks('');
    }
  }, [
    open,
    customerProp,
    companyProp,
    defaultAmount,
    amendName,
    amendMode,
    amendAmount,
    amendPostingDate,
    amendRemarks,
  ]);

  // Load modes of payment for the chosen company.
  useEffect(() => {
    if (!open || !company) return;
    let cancelled = false;
    setModesLoading(true);
    invoicesSvc
      .listModesOfPayment(company)
      .then((paymentModes) => {
        if (cancelled) return;
        setModes(paymentModes);
        const defaultMode = paymentModes[0]?.name || '';
        setRows((prev) =>
          prev.map((row, index) =>
            index === 0 && !row.mode_of_payment ? { ...row, mode_of_payment: defaultMode } : row
          )
        );
      })
      .catch(() => {
        if (!cancelled) setModes([]);
      })
      .finally(() => {
        if (!cancelled) setModesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, company]);

  const updateRow = (id: string, patch: Partial<AdvanceRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const addRow = () => {
    setRows((prev) => {
      const nextMode =
        modes.find((m) => !prev.some((r) => r.mode_of_payment === m.name))?.name ||
        modes[0]?.name ||
        '';
      return [...prev, newAdvanceRow(nextMode)];
    });
  };

  const removeRow = (id: string) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((row) => row.id !== id)));
  };

  const totalAdvance = useMemo(
    () => rows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0),
    [rows]
  );

  const contextLabel = jobCard
    ? `Job Card ${jobCard}`
    : serviceEstimate
      ? `Service Estimate ${serviceEstimate}`
      : null;

  const handleSubmit = async () => {
    const targetCustomer = lockedCustomer ? (customerProp as string) : customer;
    if (!targetCustomer) {
      toast.error('Select a customer');
      return;
    }
    if (!company) {
      toast.error('Select a company');
      return;
    }

    const payments = rows
      .filter((row) => Number(row.amount) > 0)
      .map((row) => ({
        mode_of_payment: row.mode_of_payment,
        amount: Number(row.amount),
        reference_no: row.reference_no.trim() || undefined,
      }));

    if (!payments.length) {
      toast.error('Add at least one advance amount greater than zero');
      return;
    }
    if (payments.length > 1 && payments.some((row) => !row.mode_of_payment)) {
      toast.error('Select a mode of payment for each row');
      return;
    }

    setSubmitting(true);
    try {
      const result = await paymentSvc.createAdvancePayment({
        customer: targetCustomer,
        company,
        amount: payments.length === 1 ? payments[0].amount : undefined,
        mode_of_payment: payments.length === 1 ? payments[0].mode_of_payment || undefined : undefined,
        reference_no: payments.length === 1 ? payments[0].reference_no : undefined,
        payments,
        posting_date: postingDate || undefined,
        remarks: remarks || undefined,
        job_card: jobCard || undefined,
        service_estimate: serviceEstimate || undefined,
        amended_from: amendName || undefined,
      });
      const created = result.payment_entries || [result.name];
      toast.success(
        created.length > 1
          ? `Downpayment recorded (${created.length} entries: ${created.join(', ')})`
          : amendName
            ? `Amended as ${result.name}`
            : `Advance ${result.name} recorded`
      );
      onCreated?.({
        name: result.name,
        payment_entries: created,
        paid_amount: result.paid_amount,
        customer: result.customer,
      });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to record advance payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {amending ? 'Amend advance payment' : 'Record advance payment'}
          </DialogTitle>
          <DialogDescription>
            {amending
              ? `Replaces cancelled ${amendName}. Change the amount or mode(s) of payment, then record the amendment.`
              : contextLabel
                ? `Customer advance / downpayment for ${contextLabel}. It stays available until an invoice is raised.`
                : 'Standalone customer advance / downpayment. It stays available until an invoice is raised.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {lockedCustomer ? (
            <div className="space-y-1.5">
              <Label>Customer</Label>
              <p className="text-sm font-medium">
                {customerNameProp || customerProp}
                {customerNameProp ? (
                  <span className="ml-2 text-xs text-muted-foreground">{customerProp}</span>
                ) : null}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <SearchableSelect
                options={customerOptions}
                value={customer}
                onValueChange={setCustomer}
                onSearchChange={setCustomerSearch}
                placeholder="Search customers..."
                isLoading={customersLoading}
                portaled
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Company *</Label>
              {lockedCompany ? (
                <p className="text-sm font-medium">{companyProp}</p>
              ) : (
                <SearchableSelect
                  options={(companies ?? []).map((c) => ({ value: c.name, label: c.name }))}
                  value={company}
                  onValueChange={setCompany}
                  placeholder="Select company"
                  isLoading={companiesLoading}
                  portaled
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Posting date *</Label>
              <Input
                type="date"
                value={postingDate}
                onChange={(e) => setPostingDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <Label>Downpayment modes *</Label>
              <span className="text-xs text-muted-foreground">
                {amending ? 'Change the amount or mode' : 'Split across cash / bank as needed'}
              </span>
            </div>

            <div className="hidden items-center gap-2 px-1 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(0,1fr)_2.25rem]">
              <span>Mode *</span>
              <span>Amount *</span>
              <span>Reference (optional)</span>
              <span className="sr-only">Remove</span>
            </div>

            {rows.map((row) => (
              <div
                key={row.id}
                className="grid items-center gap-2 rounded-lg border p-2 sm:grid-cols-[minmax(0,1.4fr)_minmax(7rem,0.7fr)_minmax(0,1fr)_2.25rem] sm:border-0 sm:p-0"
              >
                <div className="space-y-1 sm:space-y-0">
                  <Label className="text-xs sm:hidden">Mode *</Label>
                  <Select
                    value={row.mode_of_payment || undefined}
                    onValueChange={(value) => updateRow(row.id, { mode_of_payment: value })}
                    disabled={modesLoading || modes.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={modesLoading ? 'Loading…' : 'Select mode'} />
                    </SelectTrigger>
                    <SelectContent>
                      {modes.map((mode) => (
                        <SelectItem key={mode.name} value={mode.name}>
                          {mode.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 sm:space-y-0">
                  <Label className="text-xs sm:hidden">Amount *</Label>
                  <DecimalInput
                    min={0}
                    blankWhenZero={false}
                    value={row.amount}
                    onValueChange={(value) => updateRow(row.id, { amount: value })}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-1 sm:space-y-0">
                  <Label className="text-xs sm:hidden">Reference</Label>
                  <Input
                    value={row.reference_no}
                    onChange={(e) => updateRow(row.id, { reference_no: e.target.value })}
                    placeholder="Cheque / txn ref"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 justify-self-end text-destructive sm:justify-self-center"
                  disabled={rows.length <= 1 || amending}
                  onClick={() => removeRow(row.id)}
                  aria-label="Remove payment mode"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {amending ? (
              <p className="text-xs text-muted-foreground">
                One payment entry is amended at a time. Record any other modes as new advances.
              </p>
            ) : (
              <AddLineButton onClick={addRow} label="Add mode" />
            )}

            <div className="flex justify-between gap-2 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
              <span className="text-muted-foreground">
                Total downpayment
                {rows.filter((row) => Number(row.amount) > 0).length > 1 ? ' (split)' : ''}
              </span>
              <span className="font-medium">{totalAdvance.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Remarks</Label>
            <Textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional note"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || modesLoading}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {amending ? 'Amending…' : 'Recording…'}
              </>
            ) : amending ? (
              'Amend advance'
            ) : (
              'Record advance'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

