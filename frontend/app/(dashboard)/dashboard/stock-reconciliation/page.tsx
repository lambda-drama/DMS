'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import { SearchableSelect } from '@/components/searchable-select';
import { StockItemLinkWithCreate } from '@/components/stock-item-link-with-create';
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
import { Badge } from '@/components/ui/badge';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { useCompanies, useAutofillSingleCompany } from '@/hooks/use-dms';
import * as stockSvc from '@/services/stockOperations';
import { formatDmsWarehouseLabel } from '@/services/stockOperations';
import { ClipboardList, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type LineRow = {
  id: string;
  item_code: string;
  item_name: string;
  qty: string;
  qty_on_hand?: number;
  valuation_rate?: string;
};

function docStatusLabel(docstatus?: number) {
  if (docstatus === 1) return 'Submitted';
  if (docstatus === 2) return 'Cancelled';
  return 'Draft';
}

function emptyLine(): LineRow {
  return { id: crypto.randomUUID(), item_code: '', item_name: '', qty: '0' };
}

export default function StockReconciliationPage() {
  const { canCreate } = usePermissions();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const [company, setCompany] = useState('');
  const [defaults, setDefaults] = useState<stockSvc.StockOperationDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [warehouse, setWarehouse] = useState('');
  const [postingDate, setPostingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemOptions, setItemOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [recent, setRecent] = useState<stockSvc.StockReconciliationListRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useAutofillSingleCompany(companies, companiesLoading, company, (c) => setCompany(c.name));

  const loadDefaults = useCallback(async (co: string) => {
    setDefaultsLoading(true);
    try {
      const result = await stockSvc.fetchStockOperationDefaults(co || undefined);
      setDefaults(result);
      if (!company && result.company) setCompany(result.company);
      if (!warehouse && result.default_warehouse) setWarehouse(result.default_warehouse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load stock defaults');
    } finally {
      setDefaultsLoading(false);
    }
  }, [company, warehouse]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      setRecent(await stockSvc.listStockReconciliations({ limit: 20 }));
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
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setItemsLoading(true);
      try {
        const rows = await stockSvc.searchStockItems(itemSearch || undefined, warehouse || undefined, 25);
        if (cancelled) return;
        setItemOptions(
          rows.map((r) => ({
            value: r.item_code,
            label: r.item_name || r.item_code,
            description: [
              r.item_code,
              r.qty_on_hand != null ? `System qty: ${r.qty_on_hand}` : '',
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
  }, [itemSearch, warehouse]);

  const warehouseOptions = useMemo(
    () =>
      (defaults?.warehouses ?? []).map((w) => ({
        value: w.name,
        label: formatDmsWarehouseLabel(w),
      })),
    [defaults?.warehouses]
  );

  const pickItem = (idx: number, value: string) => {
    const opt = itemOptions.find((o) => o.value === value);
    const onHandMatch = opt?.description?.match(/System qty:\s*([0-9.]+)/);
    const onHand = onHandMatch ? onHandMatch[1] : undefined;
    setLines((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              item_code: value,
              item_name: opt?.label || value,
              qty: onHand ?? row.qty,
            }
          : row
      )
    );
  };

  const handleSubmit = async () => {
    if (!canCreate('stock-reconciliation')) return;
    const payloadLines = lines
      .filter((l) => l.item_code && l.qty !== '')
      .map((l) => ({
        item_code: l.item_code,
        qty: Number(l.qty),
        valuation_rate: l.valuation_rate ? Number(l.valuation_rate) : undefined,
      }));
    if (!company) {
      toast.error('Select a company');
      return;
    }
    if (!warehouse) {
      toast.error('Select a warehouse');
      return;
    }
    if (!payloadLines.length) {
      toast.error('Add at least one item');
      return;
    }
    setSubmitting(true);
    try {
      const result = await stockSvc.createStockReconciliation({
        company,
        warehouse,
        posting_date: postingDate,
        expense_account: defaults?.stock_adjustment_account || undefined,
        remarks: remarks || undefined,
        submit: true,
        items: payloadLines,
      });
      toast.success(`Stock Reconciliation ${result.name} submitted`);
      setLines([emptyLine()]);
      setRemarks('');
      void loadRecent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create stock reconciliation');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="h-6 w-6" />
          Stock Reconciliation
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New reconciliation</CardTitle>
          <CardDescription>
            Enter the counted quantity per item. ERPNext compares it with system stock and books the difference.
            {defaults?.stock_adjustment_account
              ? ` Account: ${defaults.stock_adjustment_account}.`
              : ' Set Stock Adjustment Account on DMS Settings → Company Defaults.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Company *</Label>
              <SearchableSelect
                options={(companies ?? []).map((c) => ({ value: c.name, label: c.name }))}
                value={company}
                onValueChange={setCompany}
                placeholder="Select company"
                isLoading={companiesLoading}
              />
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <SearchableSelect
                options={warehouseOptions}
                value={warehouse}
                onValueChange={setWarehouse}
                placeholder={defaultsLoading ? 'Loading…' : 'Select warehouse'}
                disabled={defaultsLoading || warehouseOptions.length === 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Posting date *</Label>
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
                  <Label className="text-xs">Item</Label>
                  <StockItemLinkWithCreate
                    options={itemOptions}
                    value={line.item_code}
                    onValueChange={(value) => pickItem(idx, value)}
                    onItemCreated={(item) => {
                      setLines((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? {
                                ...row,
                                item_code: item.item_code,
                                item_name: item.item_name,
                                valuation_rate:
                                  item.standard_rate != null && item.standard_rate > 0
                                    ? String(item.standard_rate)
                                    : row.valuation_rate,
                              }
                            : row
                        )
                      );
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
                  <Label className="text-xs">Physical qty</Label>
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
                  <Label className="text-xs">Valuation rate (optional)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={line.valuation_rate || ''}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, valuation_rate: e.target.value } : row))
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
              disabled={submitting || !canCreate('stock-reconciliation')}
            >
              {submitting ? 'Submitting…' : 'Submit reconciliation'}
            </Button>
          </FormActionsBar>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent reconciliations</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No stock reconciliations yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell>{row.posting_date}</TableCell>
                    <TableCell>
                      <Badge variant={row.docstatus === 1 ? 'default' : 'secondary'}>
                        {docStatusLabel(row.docstatus)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
