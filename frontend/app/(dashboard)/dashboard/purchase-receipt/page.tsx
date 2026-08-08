'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import { SearchableSelect } from '@/components/searchable-select';
import { StockItemLinkWithCreate } from '@/components/stock-item-link-with-create';
import { SupplierLinkWithCreate } from '@/components/supplier-link-with-create';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { DetailSheet, DetailSection, DetailRow } from '@/components/detail-sheet';
import { ListRowActions } from '@/components/list-row-actions';
import { PrintFormatDropdown } from '@/components/print-format-dropdown';
import { useCurrencies } from '@/hooks/use-dms';
import * as stockSvc from '@/services/stockOperations';
import { formatDmsWarehouseLabel } from '@/services/stockOperations';
import { Loader2, PackageCheck, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type LineRow = {
  id: string;
  item_code: string;
  item_name: string;
  qty: string;
  rate: string;
  qty_on_hand?: number;
};

function docStatusLabel(docstatus?: number) {
  if (docstatus === 1) return 'Submitted';
  if (docstatus === 2) return 'Cancelled';
  return 'Draft';
}

function emptyLine(): LineRow {
  return { id: crypto.randomUUID(), item_code: '', item_name: '', qty: '1', rate: '' };
}

export default function PurchaseReceiptPage() {
  const { canCreate } = usePermissions();
  const { data: currencies } = useCurrencies();
  const [company, setCompany] = useState('');
  const [defaults, setDefaults] = useState<stockSvc.PurchaseReceiptDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [supplier, setSupplier] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [currency, setCurrency] = useState('ETB');
  const [priceList, setPriceList] = useState('');
  const [postingDate, setPostingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [itemSearch, setItemSearch] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [itemOptions, setItemOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [supplierOptions, setSupplierOptions] = useState<{ value: string; label: string }[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [recent, setRecent] = useState<stockSvc.PurchaseReceiptListRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [receiptDetail, setReceiptDetail] = useState<stockSvc.PurchaseReceiptDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadDefaults = useCallback(async (co: string) => {
    setDefaultsLoading(true);
    try {
      const result = await stockSvc.fetchPurchaseReceiptDefaults(co || undefined);
      setDefaults(result);
      if (!company && result.company) setCompany(result.company);
      if (!warehouse && result.default_warehouse) setWarehouse(result.default_warehouse);
      if (result.default_currency) setCurrency(result.default_currency);
      if (result.default_price_list) {
        setPriceList(result.default_price_list);
      } else {
        setPriceList('');
      }
      if (result.default_supplier) {
        setSupplier(result.default_supplier);
        setSupplierOptions((prev) => {
          if (prev.some((o) => o.value === result.default_supplier)) return prev;
          return [
            { value: result.default_supplier!, label: result.default_supplier! },
            ...prev,
          ];
        });
      } else {
        setSupplier('');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load purchase receipt defaults');
    } finally {
      setDefaultsLoading(false);
    }
  }, [company, warehouse]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      setRecent(await stockSvc.listPurchaseReceipts({ limit: 20 }));
    } catch {
      setRecent([]);
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDefaults(company);
  }, [company, loadDefaults]);

  useEffect(() => {
    void loadRecent();
  }, [loadRecent]);

  useEffect(() => {
    if (!selectedReceiptId) {
      setReceiptDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void (async () => {
      try {
        const detail = await stockSvc.fetchPurchaseReceiptDetail(selectedReceiptId);
        if (!cancelled) setReceiptDetail(detail);
      } catch (err) {
        if (!cancelled) {
          setReceiptDetail(null);
          toast.error(err instanceof Error ? err.message : 'Failed to load purchase receipt');
        }
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedReceiptId]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setItemsLoading(true);
      try {
        const rows = await stockSvc.searchStockItems(
          itemSearch || undefined,
          warehouse || defaults?.default_warehouse || undefined,
          25
        );
        if (cancelled) return;
        setItemOptions(
          rows.map((r) => ({
            value: r.item_code,
            label: r.item_name || r.item_code,
            description: [
              r.item_code,
              r.qty_on_hand != null ? `On hand: ${r.qty_on_hand}` : '',
              r.valuation_rate ? `Std rate: ${r.valuation_rate}` : '',
            ]
              .filter(Boolean)
              .join(' · '),
          }))
        );
      } catch {
        if (!cancelled) setItemOptions([]);
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [itemSearch, warehouse, defaults?.default_warehouse]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setSuppliersLoading(true);
      try {
        const rows = await stockSvc.searchSuppliers(supplierSearch || undefined, 25);
        if (cancelled) return;
        setSupplierOptions(
          rows.map((r) => ({
            value: r.name,
            label: r.supplier_name || r.name,
          }))
        );
      } catch {
        if (!cancelled) setSupplierOptions([]);
      } finally {
        if (!cancelled) setSuppliersLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [supplierSearch]);

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
        label: formatDmsWarehouseLabel(w),
      })),
    [defaults?.warehouses]
  );

  const priceListOptions = useMemo(() => {
    const rows = defaults?.price_lists ?? [];
    if (priceList && !rows.some((r) => r.name === priceList)) {
      return [{ name: priceList, currency: currency || null }, ...rows];
    }
    return rows;
  }, [defaults?.price_lists, priceList, currency]);

  const resolveItemRate = useCallback(
    async (itemCode: string, fallbackRate?: string) => {
      if (priceList) {
        try {
          const rate = await stockSvc.fetchItemPriceListRate(itemCode, priceList);
          if (rate > 0) return String(rate);
        } catch {
          // fall through to std rate
        }
      }
      return fallbackRate || '';
    },
    [priceList]
  );

  const handleSubmit = async () => {
    if (!canCreate('purchase-receipt')) return;
    const payloadLines = lines
      .filter((l) => l.item_code && Number(l.qty) > 0)
      .map((l) => ({
        item_code: l.item_code,
        qty: Number(l.qty),
        rate: Number(l.rate || 0),
      }));
    if (!payloadLines.length) {
      toast.error('Add at least one item with quantity and rate');
      return;
    }
    if (payloadLines.some((l) => l.rate < 0 || Number.isNaN(l.rate))) {
      toast.error('Enter a valid rate for each item');
      return;
    }
    setSubmitting(true);
    try {
      const result = await stockSvc.createPurchaseReceipt({
        company: company || defaults?.company || undefined,
        supplier: supplier || undefined,
        warehouse: warehouse || defaults?.default_warehouse || undefined,
        currency: currency || undefined,
        buying_price_list: priceList || undefined,
        price_list: priceList || undefined,
        posting_date: postingDate,
        remarks: remarks || undefined,
        submit: true,
        items: payloadLines,
      });
      toast.success(`Purchase Receipt ${result.name} submitted`);
      setLines([emptyLine()]);
      setRemarks('');
      void loadRecent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create purchase receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PackageCheck className="h-6 w-6" />
          Purchase Receipt
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New purchase receipt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <Label>Supplier</Label>
              <SupplierLinkWithCreate
                options={supplierOptions}
                value={supplier}
                onValueChange={setSupplier}
                onSupplierCreated={(created) => {
                  setSupplierOptions((prev) => {
                    if (prev.some((o) => o.value === created.name)) return prev;
                    return [
                      { value: created.name, label: created.supplier_name },
                      ...prev,
                    ];
                  });
                }}
                onSearchChange={setSupplierSearch}
                initialSupplierName={supplierSearch}
                placeholder={
                  defaults?.default_supplier
                    ? `Default: ${defaults.default_supplier}`
                    : 'Search spare-parts supplier'
                }
                isLoading={suppliersLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <SearchableSelect
                options={warehouseOptions}
                value={warehouse}
                onValueChange={setWarehouse}
                placeholder={defaultsLoading ? 'Loading…' : 'Default warehouse'}
                disabled={defaultsLoading || warehouseOptions.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Currency *</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  {(currencies?.length ? currencies : [currency || 'ETB']).map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Price List</Label>
              <Select
                value={priceList || undefined}
                onValueChange={(value) => {
                  setPriceList(value);
                  const match = priceListOptions.find((p) => p.name === value);
                  if (match?.currency) setCurrency(match.currency);
                }}
                disabled={defaultsLoading || priceListOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      defaultsLoading
                        ? 'Loading…'
                        : defaults?.default_price_list
                          ? `Default: ${defaults.default_price_list}`
                          : 'Select price list'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {priceListOptions.map((pl) => (
                    <SelectItem key={pl.name} value={pl.name}>
                      {pl.currency ? `${pl.name} (${pl.currency})` : pl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Posting date</Label>
              <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Items *</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
                <Plus className="h-4 w-4 mr-1" />
                Add line
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div key={line.id} className="grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3">
                <div className="md:col-span-5 space-y-2">
                  <Label className="text-xs">Item *</Label>
                  <StockItemLinkWithCreate
                    options={itemOptions}
                    value={line.item_code}
                    onValueChange={(value) => {
                      const opt = itemOptions.find((o) => o.value === value);
                      const stdRate = opt?.description?.match(/Std rate: ([\d.]+)/)?.[1];
                      void (async () => {
                        const rate = await resolveItemRate(value, stdRate);
                        setLines((prev) =>
                          prev.map((row, i) =>
                            i === idx
                              ? {
                                  ...row,
                                  item_code: value,
                                  item_name: opt?.label || value,
                                  rate: row.rate || rate || '',
                                }
                              : row
                          )
                        );
                      })();
                    }}
                    onItemCreated={(item) => {
                      void (async () => {
                        const fallback =
                          item.standard_rate != null && item.standard_rate > 0
                            ? String(item.standard_rate)
                            : '';
                        const rate = await resolveItemRate(item.item_code, fallback);
                        setLines((prev) =>
                          prev.map((row, i) =>
                            i === idx
                              ? {
                                  ...row,
                                  item_code: item.item_code,
                                  item_name: item.item_name,
                                  rate: row.rate || rate || fallback || '',
                                }
                              : row
                          )
                        );
                      })();
                      setItemOptions((prev) => {
                        if (prev.some((o) => o.value === item.item_code)) return prev;
                        return [
                          {
                            value: item.item_code,
                            label: item.item_name,
                            description: item.item_code,
                          },
                          ...prev,
                        ];
                      });
                    }}
                    onSearchChange={setItemSearch}
                    initialItemCode={itemSearch}
                    defaultItemGroup={defaults?.default_item_group}
                    autoCreateSpareParts={defaults?.auto_create_spare_parts}
                    placeholder="Search spare part"
                    isLoading={itemsLoading}
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
                </div>
                <div className="md:col-span-3 space-y-2">
                  <Label className="text-xs">Rate *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={line.rate}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, rate: e.target.value } : row))
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
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

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </div>

          <FormActionsBar>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !canCreate('purchase-receipt')}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit purchase receipt
            </Button>
          </FormActionsBar>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent spare-part receipts</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No purchase receipts yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right w-[52px]">Print</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((row) => (
                  <TableRow
                    key={row.name}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedReceiptId(row.name)}
                  >
                    <TableCell className="font-medium text-dms-green">{row.name}</TableCell>
                    <TableCell>{row.supplier || '—'}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell>{row.posting_date}</TableCell>
                    <TableCell>{row.grand_total != null ? row.grand_total.toLocaleString() : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={row.docstatus === 1 ? 'default' : 'secondary'}>
                        {docStatusLabel(row.docstatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <ListRowActions doctype="Purchase Receipt" docName={row.name} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DetailSheet
        open={!!selectedReceiptId}
        onOpenChange={(open) => {
          if (!open) setSelectedReceiptId(null);
        }}
        title={selectedReceiptId || ''}
        subtitle={receiptDetail?.supplier}
        badge={
          receiptDetail
            ? { label: docStatusLabel(receiptDetail.docstatus) }
            : undefined
        }
        isLoading={detailLoading}
        footer={
          selectedReceiptId ? (
            <div className="flex flex-col gap-2 w-full">
              <PrintFormatDropdown
                doctype="Purchase Receipt"
                docName={selectedReceiptId}
                className="w-full"
              />
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setSelectedReceiptId(null)}
              >
                Close
              </Button>
            </div>
          ) : null
        }
      >
        {receiptDetail && (
          <>
            <DetailSection title="Receipt">
              <DetailRow label="Supplier" value={receiptDetail.supplier} />
              <DetailRow label="Company" value={receiptDetail.company} />
              <DetailRow label="Currency" value={receiptDetail.currency} />
              <DetailRow label="Price List" value={receiptDetail.buying_price_list} />
              <DetailRow label="Posting date" value={receiptDetail.posting_date} />
              <DetailRow
                label="Grand total"
                value={
                  receiptDetail.grand_total != null
                    ? receiptDetail.grand_total.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : undefined
                }
              />
              {receiptDetail.remarks ? (
                <DetailRow label="Remarks" value={receiptDetail.remarks} />
              ) : null}
            </DetailSection>
            <DetailSection title="Items">
              {receiptDetail.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No items.</p>
              ) : (
                <div className="space-y-2">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Item</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {receiptDetail.items.map((item) => (
                        <TableRow key={`${item.item_code}-${item.warehouse || ''}-${item.qty}`}>
                          <TableCell>
                            <div className="font-medium">{item.item_name || item.item_code}</div>
                            <div className="text-xs text-muted-foreground">{item.item_code}</div>
                          </TableCell>
                          <TableCell className="text-right">{item.qty}</TableCell>
                          <TableCell className="text-right">
                            {item.rate != null ? item.rate.toLocaleString() : '—'}
                          </TableCell>
                          <TableCell className="text-right">
                            {item.amount != null ? item.amount.toLocaleString() : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </DetailSection>
          </>
        )}
      </DetailSheet>
    </div>
  );
}
