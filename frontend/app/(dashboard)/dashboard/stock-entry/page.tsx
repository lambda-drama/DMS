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
import { useCompanies, useAutofillSingleCompany } from '@/hooks/use-dms';
import * as stockSvc from '@/services/stockOperations';
import { formatDmsWarehouseLabel } from '@/services/stockOperations';
import { ArrowDownUp, Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type LineRow = {
  id: string;
  item_code: string;
  item_name: string;
  qty: string;
  qty_on_hand?: number;
  basic_rate?: string;
};

function docStatusLabel(docstatus?: number) {
  if (docstatus === 1) return 'Submitted';
  if (docstatus === 2) return 'Cancelled';
  return 'Draft';
}

function emptyLine(): LineRow {
  return { id: crypto.randomUUID(), item_code: '', item_name: '', qty: '1' };
}

export default function StockEntryPage() {
  const { canCreate } = usePermissions();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const [company, setCompany] = useState('');
  const [defaults, setDefaults] = useState<stockSvc.StockOperationDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [entryType, setEntryType] = useState('Material Issue');
  const [postingDate, setPostingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sWarehouse, setSWarehouse] = useState('');
  const [tWarehouse, setTWarehouse] = useState('');
  const [remarks, setRemarks] = useState('');
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemOptions, setItemOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [recent, setRecent] = useState<stockSvc.StockEntryListRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useAutofillSingleCompany(companies, companiesLoading, company, (c) => setCompany(c.name));

  const loadDefaults = useCallback(async (co: string) => {
    setDefaultsLoading(true);
    try {
      const result = await stockSvc.fetchStockOperationDefaults(co || undefined);
      setDefaults(result);
      if (!company && result.company) setCompany(result.company);
      if (!sWarehouse && result.default_warehouse) setSWarehouse(result.default_warehouse);
      if (!tWarehouse && result.default_warehouse) setTWarehouse(result.default_warehouse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load stock defaults');
    } finally {
      setDefaultsLoading(false);
    }
  }, [company, sWarehouse, tWarehouse]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      setRecent(await stockSvc.listStockEntries({ limit: 20 }));
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
        const rows = await stockSvc.searchStockItems(
          itemSearch || undefined,
          sWarehouse || tWarehouse || defaults?.default_warehouse || undefined,
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
  }, [itemSearch, sWarehouse, tWarehouse, defaults?.default_warehouse]);

  const warehouseOptions = useMemo(
    () =>
      (defaults?.warehouses ?? []).map((w) => ({
        value: w.name,
        label: formatDmsWarehouseLabel(w),
      })),
    [defaults?.warehouses]
  );

  const showSource = entryType === 'Material Issue' || entryType === 'Material Transfer';
  const showTarget = entryType === 'Material Receipt' || entryType === 'Material Transfer';

  const handleSubmit = async () => {
    if (!canCreate('stock-entry')) return;
    const payloadLines = lines
      .filter((l) => l.item_code && Number(l.qty) > 0)
      .map((l) => ({
        item_code: l.item_code,
        qty: Number(l.qty),
        basic_rate: l.basic_rate ? Number(l.basic_rate) : undefined,
      }));
    if (!company) {
      toast.error('Select a company');
      return;
    }
    if (!payloadLines.length) {
      toast.error('Add at least one item');
      return;
    }
    setSubmitting(true);
    try {
      const result = await stockSvc.createStockEntry({
        company,
        stock_entry_type: entryType,
        posting_date: postingDate,
        s_warehouse: showSource ? sWarehouse : undefined,
        t_warehouse: showTarget ? tWarehouse : undefined,
        expense_account: defaults?.stock_adjustment_account || undefined,
        remarks: remarks || undefined,
        submit: true,
        items: payloadLines,
      });
      toast.success(`Stock Entry ${result.name} submitted`);
      setLines([emptyLine()]);
      setRemarks('');
      void loadRecent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create stock entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <ArrowDownUp className="h-6 w-6" />
          Stock Entry
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Issue, receive, or transfer stock between DMS-configured warehouses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New stock entry</CardTitle>
          <CardDescription>
            Warehouses are limited to DMS Settings (parts store, WIP, workshops, DMS-flagged warehouses).
            {defaults?.stock_adjustment_account
              ? ` Adjustment account: ${defaults.stock_adjustment_account}.`
              : ' Configure Stock Adjustment Account on DMS Settings → Company Defaults.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
              <Label>Entry type *</Label>
              <Select value={entryType} onValueChange={setEntryType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(defaults?.stock_entry_types ?? []).map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Posting date *</Label>
              <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
            </div>
            {showSource && (
              <div className="space-y-2">
                <Label>Source warehouse *</Label>
                <SearchableSelect
                  options={warehouseOptions}
                  value={sWarehouse}
                  onValueChange={setSWarehouse}
                  placeholder={defaultsLoading ? 'Loading…' : 'Select warehouse'}
                  disabled={defaultsLoading || warehouseOptions.length === 0}
                />
              </div>
            )}
            {showTarget && (
              <div className="space-y-2">
                <Label>Target warehouse *</Label>
                <SearchableSelect
                  options={warehouseOptions}
                  value={tWarehouse}
                  onValueChange={setTWarehouse}
                  placeholder={defaultsLoading ? 'Loading…' : 'Select warehouse'}
                  disabled={defaultsLoading || warehouseOptions.length === 0}
                />
              </div>
            )}
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
                    onValueChange={(value) => {
                      const opt = itemOptions.find((o) => o.value === value);
                      setLines((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? { ...row, item_code: value, item_name: opt?.label || value }
                            : row
                        )
                      );
                    }}
                    onItemCreated={(item) => {
                      setLines((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? {
                                ...row,
                                item_code: item.item_code,
                                item_name: item.item_name,
                                basic_rate:
                                  item.standard_rate != null && item.standard_rate > 0
                                    ? String(item.standard_rate)
                                    : row.basic_rate,
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
                  <Label className="text-xs">Qty</Label>
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
                {entryType === 'Material Receipt' && (
                  <div className="md:col-span-3 space-y-2">
                    <Label className="text-xs">Rate (optional)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={line.basic_rate || ''}
                      onChange={(e) =>
                        setLines((prev) =>
                          prev.map((row, i) => (i === idx ? { ...row, basic_rate: e.target.value } : row))
                        )
                      }
                    />
                  </div>
                )}
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
              disabled={submitting || !canCreate('stock-entry')}
            >
              {submitting ? 'Submitting…' : 'Submit stock entry'}
            </Button>
          </FormActionsBar>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent stock entries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No stock entries yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.stock_entry_type}</TableCell>
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
