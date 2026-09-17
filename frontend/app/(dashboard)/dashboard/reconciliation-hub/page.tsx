'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SearchableSelect } from '@/components/searchable-select';
import {
  AlertTriangle,
  ArrowLeftRight,
  Banknote,
  FileText,
  Loader2,
  RefreshCw,
  Scale,
  Wallet,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCompanies, useCustomers, useAutofillSingleCompany } from '@/hooks/use-dms';
import * as reconSvc from '@/services/paymentEntries';
import type {
  ReconciliationOverview,
  ReconciliationPlan,
} from '@/types/dms';

function formatMoney(amount: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export default function ReconciliationHubPage() {
  const { canWrite } = usePermissions();

  const [customer, setCustomer] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [company, setCompany] = useState('');
  const [data, setData] = useState<ReconciliationOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [invoiceSel, setInvoiceSel] = useState<string[]>([]);
  const [paymentSel, setPaymentSel] = useState<string[]>([]);
  const [plan, setPlan] = useState<ReconciliationPlan | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [reconciling, setReconciling] = useState(false);

  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);

  useAutofillSingleCompany(companies, companiesLoading, company, (c) => setCompany(c.name));

  // Default to the first DMS company (same order as DMS Settings).
  useEffect(() => {
    if (!company && companies?.length) setCompany(companies[0].name);
  }, [companies, company]);

  const customerOptions = useMemo(
    () =>
      (customers ?? []).map((c) => ({
        value: c.name,
        label: c.customer_name || c.name,
        description: c.customer_name ? c.name : undefined,
      })),
    [customers]
  );

  const load = useCallback(async () => {
    if (!customer) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const overview = await reconSvc.getReconciliationOverview(customer, company || undefined);
      setData(overview);
      if (!company && overview.company) setCompany(overview.company);
      setInvoiceSel([]);
      setPaymentSel([]);
    } catch (err) {
      setData(null);
      toast.error(err instanceof Error ? err.message : 'Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  }, [customer, company]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = (key: string, selected: string[], setSelected: (keys: string[]) => void) => {
    setSelected(selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key]);
  };

  const invoices = data?.invoices ?? [];
  const payments = data?.payments ?? [];
  const missingDimensions = data?.missing_dimensions ?? [];

  const selectedInvoices = useMemo(
    () => invoices.filter((row) => invoiceSel.includes(row.key)),
    [invoices, invoiceSel]
  );
  const selectedPayments = useMemo(
    () => payments.filter((row) => paymentSel.includes(row.key)),
    [payments, paymentSel]
  );
  const selectedInvoiceTotal = selectedInvoices.reduce((sum, row) => sum + row.outstanding, 0);
  const selectedPaymentTotal = selectedPayments.reduce((sum, row) => sum + row.amount, 0);

  const currency = invoices[0]?.currency || payments[0]?.currency;
  const canReconcile =
    canWrite('reconciliation-hub') &&
    Boolean(data) &&
    invoiceSel.length > 0 &&
    paymentSel.length > 0 &&
    missingDimensions.length === 0;

  const openPlan = async () => {
    if (!data) return;
    setPlanLoading(true);
    try {
      setPlan(await reconSvc.previewAllocation(data.customer, data.company, invoiceSel, paymentSel));
      setShowPlan(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to preview the allocation');
    } finally {
      setPlanLoading(false);
    }
  };

  const confirmReconcile = async () => {
    if (!data) return;
    setReconciling(true);
    try {
      const result = await reconSvc.reconcilePayments(
        data.customer,
        data.company,
        invoiceSel,
        paymentSel
      );
      toast.success(
        `Reconciled ${formatMoney(result.allocated_total, currency)} across ${
          result.invoice_count
        } invoice(s)`
      );
      setShowPlan(false);
      setPlan(null);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reconcile');
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Scale className="h-6 w-6" />
          Reconciliation Hub
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a customer, then tick the unpaid invoices and the payments / advances that settle
          them.
        </p>
      </div>

      <Card>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Customer *</Label>
              <SearchableSelect
                options={customerOptions}
                value={customer}
                onValueChange={setCustomer}
                onSearchChange={setCustomerSearch}
                placeholder="Search customers..."
                isLoading={customersLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Company *</Label>
              <SearchableSelect
                options={(companies ?? []).map((c) => ({ value: c.name, label: c.name }))}
                value={company}
                onValueChange={setCompany}
                placeholder="Select company"
                isLoading={companiesLoading}
              />
            </div>
          </div>

          {data ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
                <span>
                  <span className="text-muted-foreground">Account: </span>
                  {data.account}
                </span>
                <span>
                  <span className="text-muted-foreground">Unpaid: </span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {formatMoney(data.totals.invoice_outstanding, currency)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({invoices.length})
                  </span>
                </span>
                <span>
                  <span className="text-muted-foreground">Available: </span>
                  <span className="font-medium text-[#2E7D32]">
                    {formatMoney(data.totals.payment_available, currency)}
                  </span>
                  <span className="ml-1 text-xs text-muted-foreground">
                    ({payments.length})
                  </span>
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
          ) : null}

          {missingDimensions.length > 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <span>
                Set <strong>{missingDimensions.join(', ')}</strong> for{' '}
                <strong>{data?.company}</strong> in DMS Settings → Company Defaults before
                reconciling — ERPNext requires it as an accounting dimension on this company’s
                Balance Sheet accounts.
              </span>
            </div>
          ) : null}
        </CardContent>
      </Card>



      <div className="grid gap-4 lg:grid-cols-2">
        {/* Unpaid invoices */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Unpaid invoices
                </CardTitle>
                <CardDescription>{invoices.length} outstanding</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!invoices.length}
                  onClick={() => setInvoiceSel(invoices.map((row) => row.key))}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!invoiceSel.length}
                  onClick={() => setInvoiceSel([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !customer ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Choose a customer to load unpaid invoices.
              </p>
            ) : invoices.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No unpaid invoices for this customer.
              </p>
            ) : (
              <div className="max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
                {invoices.map((row) => (
                  <label
                    key={row.key}
                    className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={invoiceSel.includes(row.key)}
                      onCheckedChange={() => toggle(row.key, invoiceSel, setInvoiceSel)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{row.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.date || '—'} · {row.type}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">
                        {formatMoney(row.outstanding, row.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        of {formatMoney(row.amount, row.currency)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Unallocated payments / advances */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Banknote className="h-4 w-4" />
                  Unallocated payments
                </CardTitle>
                <CardDescription>{payments.length} available to allocate</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!payments.length}
                  onClick={() => setPaymentSel(payments.map((row) => row.key))}
                >
                  All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={!paymentSel.length}
                  onClick={() => setPaymentSel([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !customer ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                Choose a customer to load payments.
              </p>
            ) : payments.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">
                No unallocated payments or advances for this customer.
              </p>
            ) : (
              <div className="max-h-[26rem] space-y-1.5 overflow-y-auto pr-1">
                {payments.map((row) => (
                  <label
                    key={row.key}
                    className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/40"
                  >
                    <Checkbox
                      checked={paymentSel.includes(row.key)}
                      onCheckedChange={() => toggle(row.key, paymentSel, setPaymentSel)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate text-sm font-medium">
                        <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        {row.name}
                        {row.is_advance ? (
                          <Badge className="bg-[#F9A825]/10 text-[#F9A825]">Advance</Badge>
                        ) : null}
                        {row.is_dms ? <Badge variant="secondary">DMS</Badge> : null}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {row.date || '—'} · {row.type}
                        {row.job_card ? ` · ${row.job_card}` : ''}
                        {row.service_estimate ? ` · ${row.service_estimate}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium">{formatMoney(row.amount, row.currency)}</p>
                      <p className="text-xs text-muted-foreground">available</p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Action bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-muted-foreground">Invoices ticked: </span>
              <span className="font-medium">{invoiceSel.length}</span>
              <span className="text-muted-foreground"> · {formatMoney(selectedInvoiceTotal, currency)}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Payments ticked: </span>
              <span className="font-medium">{paymentSel.length}</span>
              <span className="text-muted-foreground"> · {formatMoney(selectedPaymentTotal, currency)}</span>
            </span>
          </div>
          <Button onClick={openPlan} disabled={!canReconcile || planLoading}>
            {planLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ArrowLeftRight className="mr-2 h-4 w-4" />
            )}
            Reconcile
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={showPlan}
        onOpenChange={(open) => {
          setShowPlan(open);
          if (!open) setPlan(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirm reconciliation</DialogTitle>
            <DialogDescription>
              {plan
                ? `${formatMoney(plan.allocated_total, currency)} will be allocated across ${
                    plan.invoice_count
                  } invoice(s).`
                : 'Nothing to allocate — the ticked payments do not cover any ticked invoice.'}
            </DialogDescription>
          </DialogHeader>

          {plan ? (
            <div className="space-y-3">
              <div className="max-h-[22rem] overflow-y-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payment</TableHead>
                      <TableHead>Invoice</TableHead>
                      <TableHead className="text-right">Allocated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plan.allocations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-6 text-center text-muted-foreground">
                          Nothing to allocate.
                        </TableCell>
                      </TableRow>
                    ) : (
                      plan.allocations.map((row, index) => (
                        <TableRow key={`${row.payment}-${row.invoice}-${index}`}>
                          <TableCell className="font-medium">{row.payment}</TableCell>
                          <TableCell>{row.invoice}</TableCell>
                          <TableCell className="text-right">
                            {formatMoney(row.allocated, row.currency || currency)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
                <span>
                  <span className="text-muted-foreground">Invoices ticked: </span>
                  {formatMoney(plan.invoice_outstanding_total, currency)}
                </span>
                <span>
                  <span className="text-muted-foreground">Payments ticked: </span>
                  {formatMoney(plan.payment_available_total, currency)}
                </span>
                <span>
                  <span className="text-muted-foreground">Unapplied after: </span>
                  {formatMoney(
                    Math.max(plan.payment_available_total - plan.allocated_total, 0),
                    currency
                  )}
                </span>
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setShowPlan(false)} disabled={reconciling}>
              Cancel
            </Button>
            <Button
              onClick={confirmReconcile}
              disabled={reconciling || !plan || plan.allocations.length === 0}
            >
              {reconciling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reconciling…
                </>
              ) : (
                'Reconcile'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

