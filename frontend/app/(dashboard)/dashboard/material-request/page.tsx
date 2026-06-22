'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import { SearchableSelect } from '@/components/searchable-select';
import { StockItemLinkWithCreate } from '@/components/stock-item-link-with-create';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { MaterialRequestFulfillmentActions } from '@/components/material-request/material-request-fulfillment-actions';
import { Loader2, PackagePlus, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type LineRow = {
  id: string;
  item_code: string;
  item_name: string;
  qty: string;
  uom: string;
  uomOptions: stockSvc.ItemUomOption[];
};

function docStatusLabel(docstatus?: number) {
  if (docstatus === 1) return 'Submitted';
  if (docstatus === 2) return 'Cancelled';
  return 'Draft';
}

function emptyLine(): LineRow {
  return {
    id: crypto.randomUUID(),
    item_code: '',
    item_name: '',
    qty: '1',
    uom: '',
    uomOptions: [],
  };
}

export default function MaterialRequestPage() {
  const { canCreate } = usePermissions();
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const [company, setCompany] = useState('');
  const [defaults, setDefaults] = useState<stockSvc.StockOperationDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [requestType, setRequestType] = useState('Purchase');
  const [transactionDate, setTransactionDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [scheduleDate, setScheduleDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sWarehouse, setSWarehouse] = useState('');
  const [tWarehouse, setTWarehouse] = useState('');
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemOptions, setItemOptions] = useState<{ value: string; label: string; description?: string }[]>([]);
  const [itemStockUom, setItemStockUom] = useState<Record<string, string>>({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [recent, setRecent] = useState<stockSvc.MaterialRequestListRow[]>([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const canStockEntry = canCreate('stock-entry');
  const canPurchaseReceipt = canCreate('purchase-receipt');

  useAutofillSingleCompany(companies, companiesLoading, company, (c) => setCompany(c.name));

  const loadDefaults = useCallback(async (co: string) => {
    setDefaultsLoading(true);
    try {
      const result = await stockSvc.fetchMaterialRequestDefaults(co || undefined);
      setDefaults(result);
      if (!company && result.company) setCompany(result.company);
      if (!tWarehouse && result.default_warehouse) setTWarehouse(result.default_warehouse);
      if (!sWarehouse && result.default_warehouse) setSWarehouse(result.default_warehouse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load material request defaults');
    } finally {
      setDefaultsLoading(false);
    }
  }, [company, sWarehouse, tWarehouse]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try {
      setRecent(await stockSvc.listMaterialRequests({ limit: 20 }));
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
          tWarehouse || sWarehouse || defaults?.default_warehouse || undefined,
          25
        );
        if (cancelled) return;
        const stockUomMap: Record<string, string> = {};
        setItemOptions(
          rows.map((r) => {
            if (r.stock_uom) stockUomMap[r.item_code] = r.stock_uom;
            return {
              value: r.item_code,
              label: r.item_name || r.item_code,
              description: [
                r.item_code,
                r.stock_uom ? `UOM: ${r.stock_uom}` : '',
                r.qty_on_hand != null ? `On hand: ${r.qty_on_hand}` : '',
              ]
                .filter(Boolean)
                .join(' · '),
            };
          })
        );
        setItemStockUom((prev) => ({ ...prev, ...stockUomMap }));
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
        label: w.warehouse_name || w.name,
      })),
    [defaults?.warehouses]
  );

  const showSource = requestType === 'Material Transfer';
  const showTarget = requestType === 'Purchase' || requestType === 'Material Transfer' || requestType === 'Material Issue';

  const applyItemToLine = useCallback(async (idx: number, itemCode: string, itemName: string) => {
    const fallbackUom = itemStockUom[itemCode] || 'Nos';
    setLines((prev) =>
      prev.map((row, i) =>
        i === idx
          ? { ...row, item_code: itemCode, item_name: itemName, uom: fallbackUom, uomOptions: [] }
          : row
      )
    );
    try {
      const uomDefaults = await stockSvc.fetchItemUoms(itemCode);
      const options = uomDefaults.uoms.length
        ? uomDefaults.uoms
        : [{ value: fallbackUom, label: fallbackUom }];
      setLines((prev) =>
        prev.map((row, i) =>
          i === idx
            ? {
                ...row,
                uom: uomDefaults.stock_uom || fallbackUom,
                uomOptions: options,
              }
            : row
        )
      );
    } catch {
      setLines((prev) =>
        prev.map((row, i) =>
          i === idx
            ? { ...row, uom: fallbackUom, uomOptions: [{ value: fallbackUom, label: fallbackUom }] }
            : row
        )
      );
    }
  }, [itemStockUom]);

  const handleSubmit = async () => {
    if (!canCreate('material-request')) return;
    const payloadLines = lines
      .filter((l) => l.item_code && Number(l.qty) > 0)
      .map((l) => ({
        item_code: l.item_code,
        qty: Number(l.qty),
        uom: l.uom || undefined,
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
      const result = await stockSvc.createMaterialRequest({
        company,
        material_request_type: requestType,
        transaction_date: transactionDate,
        schedule_date: scheduleDate,
        set_warehouse: showTarget ? tWarehouse : undefined,
        set_from_warehouse: showSource ? sWarehouse : undefined,
        submit: true,
        items: payloadLines,
      });
      toast.success(`Material Request ${result.name} submitted`);
      setLines([emptyLine()]);
      void loadRecent();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create material request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <PackagePlus className="h-6 w-6" />
          Material Request
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Request spare parts for purchase, transfer, or issue from DMS-configured warehouses.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New material request</CardTitle>
          <CardDescription>
            Warehouses are limited to DMS Settings (parts store, WIP, workshops, DMS-flagged warehouses).
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
              <Label>Purpose *</Label>
              <Select value={requestType} onValueChange={setRequestType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(defaults?.material_request_types ?? []).map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction date *</Label>
              <Input type="date" value={transactionDate} onChange={(e) => setTransactionDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Required by *</Label>
              <Input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)} />
            </div>
            {showSource && (
              <div className="space-y-2">
                <Label>From warehouse *</Label>
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
                <Label>{requestType === 'Material Issue' ? 'Warehouse *' : 'To warehouse *'}</Label>
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
                      void applyItemToLine(idx, value, opt?.label || value);
                    }}
                    onItemCreated={(item) => {
                      void applyItemToLine(idx, item.item_code, item.item_name);
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
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">UOM</Label>
                  <Select
                    value={line.uom || undefined}
                    onValueChange={(value) =>
                      setLines((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, uom: value } : row))
                      )
                    }
                    disabled={!line.item_code}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={line.item_code ? 'Select UOM' : 'Pick item first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {(line.uomOptions.length
                        ? line.uomOptions
                        : line.uom
                          ? [{ value: line.uom, label: line.uom }]
                          : []
                      ).map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

          <FormActionsBar>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !canCreate('material-request')}
            >
              {submitting ? 'Submitting…' : 'Submit material request'}
            </Button>
          </FormActionsBar>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent material requests</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">No material requests yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.material_request_type}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell>{row.transaction_date}</TableCell>
                    <TableCell>
                      <Badge variant={row.docstatus === 1 ? 'default' : 'secondary'}>
                        {row.status || docStatusLabel(row.docstatus)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {row.has_pending && row.actions?.length ? (
                        <MaterialRequestFulfillmentActions
                          name={row.name}
                          actions={row.actions}
                          canStockEntry={canStockEntry}
                          canPurchaseReceipt={canPurchaseReceipt}
                          context={{
                            company: row.company,
                            material_request_type: row.material_request_type,
                            warehouse: row.set_warehouse,
                            from_warehouse: row.set_from_warehouse,
                          }}
                          onDone={() => void loadRecent()}
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
