'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { SearchableSelect } from '@/components/searchable-select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertTriangle,
  ArrowDownUp,
  BarChart3,
  BookOpen,
  ChevronDown,
  Filter,
  Loader2,
  Package,
  RefreshCw,
  TrendingDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { searchStockItems } from '@/services/stockOperations';
import * as inventorySvc from '@/services/inventory';
import { useAutofillSingleCompany } from '@/hooks/use-dms';
import type {
  InventoryInsightsReport,
  StockBalanceReport,
  StockLedgerReport,
} from '@/services/inventory';

type InventoryView = 'balance' | 'ledger' | 'insights';

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function formatQty(value: number, uom?: string) {
  const n = Number(value || 0);
  const formatted = n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  return uom ? `${formatted} ${uom}` : formatted;
}

export default function InventoryDashboardPage() {
  const [activeView, setActiveView] = useState<InventoryView>('insights');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [company, setCompany] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [itemGroup, setItemGroup] = useState('');
  const [itemCode, setItemCode] = useState('');
  const [search, setSearch] = useState('');
  const [asOnDate, setAsOnDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const prevCompanyRef = useRef('');

  const [balanceData, setBalanceData] = useState<StockBalanceReport | null>(null);
  const [ledgerData, setLedgerData] = useState<StockLedgerReport | null>(null);
  const [insightsData, setInsightsData] = useState<InventoryInsightsReport | null>(null);

  const [itemSearch, setItemSearch] = useState('');

  const itemQuery = itemSearch.trim();
  const { data: stockItemRows = [], isLoading: itemsLoading } = useSWR(
    ['inventory-stock-items', itemQuery, warehouse],
    () => searchStockItems(itemQuery || undefined, warehouse || undefined),
    { dedupingInterval: 3000 }
  );

  const itemOptions = useMemo(
    () =>
      stockItemRows.map((r) => ({
        value: r.item_code,
        label: r.item_name || r.item_code,
      })),
    [stockItemRows]
  );

  const { data: defaults, isLoading: loadingDefaults } = useSWR(
    ['inventory-defaults', company || ''],
    () => inventorySvc.fetchInventoryDefaults(company || undefined),
    { revalidateOnFocus: false }
  );

  const companyOptions = useMemo(
    () => (defaults?.companies ?? []).map((c) => ({ value: c, label: c })),
    [defaults?.companies]
  );

  useAutofillSingleCompany(
    companyOptions.map((c) => ({ name: c.value, company_name: c.label })),
    loadingDefaults,
    company,
    (c) => setCompany(c.name)
  );

  useEffect(() => {
    if (!defaults) return;
    if (!company && defaults.company) {
      setCompany(defaults.company);
    }
    if (defaults.as_on_date) {
      setAsOnDate((current) => current || defaults.as_on_date);
    }
  }, [defaults, company]);

  useEffect(() => {
    if (!company || !defaults?.default_warehouse) return;
    if (prevCompanyRef.current === company) return;
    prevCompanyRef.current = company;
    setWarehouse(defaults.default_warehouse);
  }, [company, defaults?.default_warehouse]);

  const warehouseOptions = useMemo(() => defaults?.warehouses ?? [], [defaults?.warehouses]);

  const itemGroupOptions = useMemo(
    () => (defaults?.item_groups ?? []).map((g) => ({ value: g, label: g })),
    [defaults?.item_groups]
  );

  const warehouseSelectOptions = useMemo(
    () =>
      warehouseOptions.map((w) => ({
        value: w.name,
        label: w.warehouse_name || w.name,
      })),
    [warehouseOptions]
  );

  const loadBalance = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventorySvc.fetchStockBalanceReport({
        company: company || undefined,
        warehouse: warehouse || undefined,
        item_code: itemCode || undefined,
        item_group: itemGroup || undefined,
        search: search.trim() || undefined,
        as_on_date: asOnDate,
        sort_order: sortOrder,
      });
      setBalanceData(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load stock balance');
    } finally {
      setLoading(false);
    }
  }, [company, warehouse, itemCode, itemGroup, search, asOnDate, sortOrder]);

  const loadLedger = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventorySvc.fetchStockLedgerReport({
        company: company || undefined,
        warehouse: warehouse || undefined,
        item_code: itemCode || undefined,
        item_group: itemGroup || undefined,
        search: search.trim() || undefined,
        from_date: fromDate,
        to_date: toDate,
      });
      setLedgerData(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load stock ledger');
    } finally {
      setLoading(false);
    }
  }, [company, warehouse, itemCode, itemGroup, search, fromDate, toDate]);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    try {
      const result = await inventorySvc.fetchInventoryInsights({
        company: company || undefined,
        warehouse: warehouse || undefined,
        from_date: fromDate,
        to_date: toDate,
      });
      setInsightsData(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to load inventory insights');
    } finally {
      setLoading(false);
    }
  }, [company, warehouse, fromDate, toDate]);

  const refresh = useCallback(() => {
    if (activeView === 'balance') return loadBalance();
    if (activeView === 'ledger') return loadLedger();
    return loadInsights();
  }, [activeView, loadBalance, loadLedger, loadInsights]);

  useEffect(() => {
    if (!defaults || loadingDefaults) return;
    refresh();
  }, [activeView, defaults, loadingDefaults, sortOrder]); // eslint-disable-line react-hooks/exhaustive-deps

  const summary = balanceData?.summary;

  const viewCards = [
    {
      id: 'insights' as const,
      title: 'Insights',
      icon: BarChart3,
    },
    {
      id: 'balance' as const,
      title: 'Stock Balance',
      icon: Package,
    },
    {
      id: 'ledger' as const,
      title: 'Stock Ledger',
      icon: BookOpen,
    },
  ];

  return (
    <div className="-mt-1 space-y-3 sm:-mt-2">
      <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3 lg:w-3/4">
        {viewCards.map((card) => {
          const Icon = card.icon;
          const selected = activeView === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setActiveView(card.id)}
              className="w-full text-left"
            >
              <Card
                className={cn(
                  'gap-0 rounded-lg py-0 shadow-none transition-colors hover:border-primary/40',
                  selected && 'border-primary ring-1 ring-primary/20'
                )}
              >
                <CardContent className="flex items-center gap-2 px-3 py-1.5">
                  <div className="shrink-0 rounded bg-primary/10 p-1">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <p className="text-sm font-medium leading-none">{card.title}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              <ChevronDown className={cn('h-4 w-4 transition-transform', filtersOpen && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
          <div className="flex flex-wrap items-center gap-2">
            {activeView === 'balance' ? (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => setSortOrder((s) => (s === 'asc' ? 'desc' : 'asc'))}
              >
                <ArrowDownUp className="h-4 w-4" />
                Qty {sortOrder === 'asc' ? '↑ Low first' : '↓ High first'}
              </Button>
            ) : null}
            <Button variant="outline" size="sm" className="gap-2" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
          </div>
        </div>

        <CollapsibleContent className="mt-4">
          <Card>
            <CardContent className="grid gap-4 pt-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <SearchableSelect
                  value={company}
                  onValueChange={(v) => {
                    setCompany(v);
                    setWarehouse('');
                    setItemCode('');
                  }}
                  options={companyOptions}
                  placeholder="Company"
                  disabled={loadingDefaults}
                />
              </div>

              <div className="space-y-2">
                <Label>Warehouse</Label>
                <SearchableSelect
                  value={warehouse}
                  onValueChange={setWarehouse}
                  options={warehouseSelectOptions}
                  placeholder="All warehouses"
                  disabled={loadingDefaults}
                />
              </div>

              <div className="space-y-2">
                <Label>Item group</Label>
                <SearchableSelect
                  value={itemGroup}
                  onValueChange={setItemGroup}
                  options={itemGroupOptions}
                  placeholder="All groups"
                  disabled={loadingDefaults}
                />
              </div>

              <div className="space-y-2">
                <Label>Item</Label>
                <SearchableSelect
                  value={itemCode}
                  onValueChange={setItemCode}
                  options={itemOptions}
                  onSearchChange={setItemSearch}
                  placeholder="All spare parts"
                  isLoading={itemsLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Part name, code, OEM…"
                />
              </div>

              {activeView === 'balance' ? (
                <div className="space-y-2">
                  <Label>As on date</Label>
                  <Input type="date" value={asOnDate} onChange={(e) => setAsOnDate(e.target.value)} />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>From date</Label>
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>To date</Label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                </>
              )}

              <div className="flex items-end sm:col-span-2 lg:col-span-1">
                <Button className="w-full" onClick={refresh} disabled={loading}>
                  Apply filters
                </Button>
              </div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      {activeView === 'balance' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Stock balance — spare parts</CardTitle>
            {summary ? (
              <Badge variant="outline" className="font-normal">
                As on {summary.as_on_date}
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent className="p-0">
            {loadingDefaults || (loading && !balanceData) ? (
              <div className="space-y-2 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Item group</TableHead>
                      <TableHead>OEM #</TableHead>
                      <TableHead className="text-right">Min level</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(balanceData?.rows ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No spare parts found for the selected filters.
                        </TableCell>
                      </TableRow>
                    ) : (
                      balanceData?.rows.map((row) => (
                        <TableRow key={row.item_code}>
                          <TableCell>
                            <div className="font-medium">{row.item_name}</div>
                            <div className="text-xs text-muted-foreground">{row.item_code}</div>
                          </TableCell>
                          <TableCell>{row.item_group || '—'}</TableCell>
                          <TableCell>{row.oem_part_number || '—'}</TableCell>
                          <TableCell className="text-right">{formatQty(row.minimum_stock_level, row.stock_uom)}</TableCell>
                          <TableCell className="text-right font-medium">{formatQty(row.qty, row.stock_uom)}</TableCell>
                          <TableCell>
                            {row.is_low_stock ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Low
                              </Badge>
                            ) : (
                              <Badge variant="secondary">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeView === 'ledger' ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Stock ledger — spare parts</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading && !ledgerData ? (
              <div className="space-y-2 p-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Warehouse</TableHead>
                      <TableHead className="text-right">Qty change</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead>Voucher</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(ledgerData?.rows ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                          No ledger entries in this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      ledgerData?.rows.map((row, idx) => (
                        <TableRow key={`${row.voucher_no}-${idx}`}>
                          <TableCell>{row.posting_date}</TableCell>
                          <TableCell>
                            <div className="font-medium">{row.item_name}</div>
                            <div className="text-xs text-muted-foreground">{row.item_code}</div>
                          </TableCell>
                          <TableCell>{row.warehouse || '—'}</TableCell>
                          <TableCell
                            className={cn(
                              'text-right font-medium',
                              row.actual_qty < 0 ? 'text-destructive' : 'text-chart-3'
                            )}
                          >
                            {row.actual_qty > 0 ? '+' : ''}
                            {formatQty(row.actual_qty, row.stock_uom)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatQty(row.qty_after_transaction, row.stock_uom)}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{row.voucher_type}</div>
                            <div className="text-xs text-muted-foreground">{row.voucher_no}</div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {activeView === 'insights' ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <CardTitle className="text-lg">Low stock spare parts</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Min</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(insightsData?.low_stock ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                          No low-stock spare parts.
                        </TableCell>
                      </TableRow>
                    ) : (
                      insightsData?.low_stock.map((row) => (
                        <TableRow key={row.item_code}>
                          <TableCell>
                            <div className="font-medium">{row.item_name}</div>
                            <div className="text-xs text-muted-foreground">{row.item_code}</div>
                          </TableCell>
                          <TableCell className="text-right">{formatQty(row.minimum_stock_level, row.stock_uom)}</TableCell>
                          <TableCell className="text-right font-medium text-destructive">
                            {formatQty(row.qty, row.stock_uom)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Most consumed ({fromDate} → {toDate})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="text-right">Consumed qty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(insightsData?.most_consumed ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                          No consumption in this period.
                        </TableCell>
                      </TableRow>
                    ) : (
                      insightsData?.most_consumed.map((row) => (
                        <TableRow key={row.item_code}>
                          <TableCell>
                            <div className="font-medium">{row.item_name}</div>
                            <div className="text-xs text-muted-foreground">{row.item_code}</div>
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatQty(row.consumed_qty)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
