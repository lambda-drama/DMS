'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import { useNavigation } from '@/contexts/navigation-context';
import {
  useAutofillSingleCompany,
  useAutofillDefaultCustomer,
  useDmsCustomerDefaults,
  useCompanies,
  useCustomers,
} from '@/hooks/use-dms';
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from '@/lib/customer-default';
import { SearchableSelect } from '@/components/searchable-select';
import { LinkWithCreate } from '@/components/link-with-create';
import { GroupDiscountFields } from '@/components/group-discount-fields';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import {
  buildGroupDiscountPayload,
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from '@/lib/invoice-discount';
import * as sparePartSalesSvc from '@/services/sparePartSales';
import { Loader2, Package, Plus, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type LineRow = {
  id: string;
  spare_part: string;
  item_name: string;
  qty: string;
  unit_price: string;
  qty_on_hand?: number;
};

function emptyLine(): LineRow {
  return { id: crypto.randomUUID(), spare_part: '', item_name: '', qty: '1', unit_price: '' };
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

export default function SparePartSalesPage() {
  const { canCreate } = usePermissions();
  const { navigate } = useNavigation();

  const [company, setCompany] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [defaults, setDefaults] = useState<sparePartSalesSvc.SparePartSalesDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [warehouse, setWarehouse] = useState('');
  const [customer, setCustomer] = useState('');
  const [customerMeta, setCustomerMeta] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [postingDate, setPostingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [remarks, setRemarks] = useState('');
  const [submitInvoice, setSubmitInvoice] = useState(true);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [partSearch, setPartSearch] = useState('');
  const [partOptions, setPartOptions] = useState<
    { value: string; label: string; description?: string }[]
  >([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [partsDiscountInput, setPartsDiscountInput] = useState('');

  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: dmsCustomerDefaults } = useDmsCustomerDefaults();

  const loadDefaults = useCallback(async (co: string) => {
    setDefaultsLoading(true);
    try {
      const result = await sparePartSalesSvc.fetchSparePartSalesDefaults(co || undefined);
      setDefaults(result);
      if (!company && result.company) setCompany(result.company);
      if (!warehouse && result.default_warehouse) setWarehouse(result.default_warehouse);
      if (!customer && result.default_customer) {
        setCustomer(result.default_customer);
        setCustomerMeta({
          name: result.default_customer,
          customer_name: result.default_customer_name || result.default_customer,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load spare part sales defaults');
    } finally {
      setDefaultsLoading(false);
    }
  }, [company, warehouse]);

  useEffect(() => {
    void loadDefaults(company);
  }, [company, loadDefaults]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPartsLoading(true);
      try {
        const rows = await sparePartSalesSvc.searchSparePartsForSale({
          search: partSearch || undefined,
          warehouse: warehouse || defaults?.default_warehouse || undefined,
          inStockOnly,
          limit: 30,
        });
        if (cancelled) return;
        setPartOptions(
          rows.map((p) => ({
            value: p.name,
            label: p.item_name || p.name,
            description: [
              p.item_code,
              p.qty_on_hand != null ? `Stock: ${p.qty_on_hand}` : null,
              p.unit_price != null ? `Price: ${p.unit_price}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          }))
        );
      } catch {
        if (!cancelled) setPartOptions([]);
      } finally {
        if (!cancelled) setPartsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [partSearch, warehouse, defaults?.default_warehouse, inStockOnly]);

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    company,
    (c) => setCompany(c.name),
    { search: companySearch }
  );

  useAutofillDefaultCustomer(customer, (d) => {
    setCustomer(d.default_customer!);
    setCustomerMeta({
      name: d.default_customer!,
      customer_name: d.customer_name || d.default_customer!,
      mobile_no: d.mobile_no || undefined,
    });
  });

  const companyOptions = useMemo(() => {
    const names = defaults?.companies?.length
      ? defaults.companies
      : defaults?.company
        ? [defaults.company]
        : [];
    return names.map((name) => ({ value: name, label: name }));
  }, [defaults?.companies, defaults?.company]);

  const warehouseOptions = useMemo(
    () =>
      (defaults?.warehouses ?? []).map((w) => ({
        value: w.name,
        label: w.warehouse_name || w.name,
      })),
    [defaults?.warehouses]
  );

  const customerOptions = useMemo(
    () => buildCustomerSelectOptions(customers, customer, customerMeta),
    [customers, customer, customerMeta]
  );

  const handleCustomerChange = (id: string) => {
    const next = resolveCustomerFieldChange(id, customers, dmsCustomerDefaults);
    setCustomer(next.customer);
    setCustomerMeta(next.meta);
  };

  const handleCustomerCreated = (name: string, label?: string) => {
    setCustomer(name);
    setCustomerMeta({ name, customer_name: label || name });
  };

  const partsTotal = lines.reduce((sum, row) => {
    const qty = Number(row.qty) || 0;
    const rate = Number(row.unit_price) || 0;
    return sum + qty * rate;
  }, 0);

  const partsDiscountValue = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const partsDiscountTotal = groupDiscountAmount(partsTotal, partsDiscountMode, partsDiscountValue);
  const grandTotal = partsTotal - partsDiscountTotal;

  const handleSubmit = async () => {
    if (!canCreate('spare-part-sales')) return;
    if (!customer) {
      toast.error('Select a customer');
      return;
    }
    if (!warehouse) {
      toast.error('Select a warehouse');
      return;
    }

    const payloadLines = lines
      .filter((l) => l.spare_part && Number(l.qty) > 0)
      .map((l) => ({
        spare_part: l.spare_part,
        qty: Number(l.qty),
        unit_price: Number(l.unit_price || 0),
      }));

    if (!payloadLines.length) {
      toast.error('Add at least one spare part with quantity');
      return;
    }

    setSubmitting(true);
    try {
      const result = await sparePartSalesSvc.createSparePartSale({
        customer,
        company: company || defaults?.company || '',
        warehouse,
        parts: payloadLines,
        posting_date: postingDate,
        due_date: dueDate,
        remarks: remarks || undefined,
        submit: submitInvoice,
        parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
      });
      toast.success(
        submitInvoice
          ? `Sales Invoice ${result.name} submitted (${result.grand_total})`
          : `Sales Invoice ${result.name} saved as draft`
      );
      setLines([emptyLine()]);
      setRemarks('');
      if (dmsCustomerDefaults?.default_customer) {
        const next = resolveCustomerFieldChange('', customers, dmsCustomerDefaults);
        setCustomer(next.customer);
        setCustomerMeta(next.meta);
      } else {
        setCustomer('');
        setCustomerMeta(null);
      }
      navigate('invoices');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create sales invoice');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Spare Part Sales
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sell spare parts directly to walk-in customers without a service job. Stock is drawn from
          the parts warehouse (same stock received via Purchase Receipt).
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Counter sale</CardTitle>
          <CardDescription>
            Creates a Sales Invoice and issues stock from the selected warehouse.
            {defaults?.default_warehouse
              ? ` Default warehouse: ${defaults.default_warehouse}.`
              : ' Configure Purchase Receipt / Parts Warehouse on DMS Settings.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <SearchableSelect
                options={companyOptions}
                value={company || defaults?.company || ''}
                onValueChange={setCompany}
                placeholder={defaultsLoading ? 'Loading…' : 'Company'}
                disabled={defaultsLoading || companyOptions.length <= 1}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer *</Label>
              <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                <SearchableSelect
                  options={customerOptions}
                  value={customer}
                  valueLabel={customerMeta?.customer_name}
                  onValueChange={handleCustomerChange}
                  onSearchChange={setCustomerSearch}
                  placeholder="Search customer"
                  isLoading={customersLoading}
                />
              </LinkWithCreate>
              {defaults?.default_customer ? (
                <p className="text-xs text-muted-foreground">
                  Default: {defaults.default_customer_name || defaults.default_customer}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <SearchableSelect
                options={warehouseOptions}
                value={warehouse}
                onValueChange={setWarehouse}
                placeholder={defaultsLoading ? 'Loading…' : 'Parts warehouse'}
                disabled={defaultsLoading || warehouseOptions.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Posting date</Label>
              <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="in-stock-only"
              checked={inStockOnly}
              onCheckedChange={(v) => setInStockOnly(Boolean(v))}
            />
            <Label htmlFor="in-stock-only" className="text-sm font-normal cursor-pointer">
              Show only parts in stock at selected warehouse
            </Label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Spare parts *</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
                <Plus className="h-4 w-4 mr-1" />
                Add line
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div key={line.id} className="grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3">
                <div className="md:col-span-5 space-y-2">
                  <Label className="text-xs">Spare part *</Label>
                  <SearchableSelect
                    options={partOptions}
                    value={line.spare_part}
                    onValueChange={async (value) => {
                      const opt = partOptions.find((o) => o.value === value);
                      let unitPrice = line.unit_price;
                      let qtyOnHand = line.qty_on_hand;
                      try {
                        const rows = await sparePartSalesSvc.searchSparePartsForSale({
                          search: value,
                          warehouse: warehouse || defaults?.default_warehouse || undefined,
                          limit: 1,
                        });
                        const match = rows.find((r) => r.name === value);
                        if (match) {
                          if (!unitPrice && match.unit_price != null) {
                            unitPrice = String(match.unit_price);
                          }
                          qtyOnHand = match.qty_on_hand ?? undefined;
                        }
                      } catch {
                        /* ignore */
                      }
                      setLines((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? {
                                ...row,
                                spare_part: value,
                                item_name: opt?.label || value,
                                unit_price: unitPrice,
                                qty_on_hand: qtyOnHand,
                              }
                            : row
                        )
                      );
                    }}
                    onSearchChange={setPartSearch}
                    placeholder="Search spare part"
                    isLoading={partsLoading}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Qty *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={line.qty}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, qty: e.target.value } : row))
                      )
                    }
                  />
                  {line.qty_on_hand != null && (
                    <p className="text-xs text-muted-foreground">In stock: {line.qty_on_hand}</p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Unit price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={line.unit_price}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, unit_price: e.target.value } : row
                        )
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    readOnly
                    value={(
                      (Number(line.qty) || 0) * (Number(line.unit_price) || 0)
                    ).toFixed(2)}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={lines.length <= 1}
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <GroupDiscountFields
            label="Parts"
            mode={partsDiscountMode}
            onModeChange={setPartsDiscountMode}
            value={partsDiscountInput}
            onValueChange={setPartsDiscountInput}
            subtotal={partsTotal}
          />

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes for this counter sale"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="submit-invoice"
              checked={submitInvoice}
              onCheckedChange={(v) => setSubmitInvoice(Boolean(v))}
            />
            <Label htmlFor="submit-invoice" className="text-sm font-normal cursor-pointer">
              Submit invoice immediately
            </Label>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>
                {lines.filter((l) => l.spare_part).length} line(s)
                {partsDiscountTotal > 0 ? ` · discount: ${partsDiscountTotal.toFixed(2)}` : ''}
              </span>
            </div>
            <p className="text-xl font-semibold">Total: {grandTotal.toFixed(2)}</p>
          </div>

          <FormActionsBar>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !canCreate('spare-part-sales')}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Create sales invoice
            </Button>
          </FormActionsBar>
        </CardContent>
      </Card>

      {lines.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines
                  .filter((l) => l.spare_part)
                  .map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>{l.item_name || l.spare_part}</TableCell>
                      <TableCell className="text-right">{l.qty}</TableCell>
                      <TableCell className="text-right">{l.unit_price}</TableCell>
                      <TableCell className="text-right">
                        {((Number(l.qty) || 0) * (Number(l.unit_price) || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
