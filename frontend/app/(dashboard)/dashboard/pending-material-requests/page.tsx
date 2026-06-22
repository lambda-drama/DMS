'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { DetailSheet, DetailSection, DetailRow } from '@/components/detail-sheet';
import { MaterialRequestFulfillmentActions } from '@/components/material-request/material-request-fulfillment-actions';
import {
  MaterialRequestFulfillmentConfirmDialog,
} from '@/components/material-request/material-request-fulfillment-confirm-dialog';
import * as stockSvc from '@/services/stockOperations';
import {
  ArrowDownUp,
  Clock,
  Loader2,
  PackageCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

export default function PendingMaterialRequestsPage() {
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<stockSvc.PendingMaterialRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<stockSvc.MaterialRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<stockSvc.MaterialRequestFulfillmentAction | null>(null);
  const [fulfilling, setFulfilling] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      setRows(await stockSvc.listPendingMaterialRequests({ search: search || undefined, limit: 100 }));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load pending requests');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadRows();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadRows]);

  const openDetail = async (name: string) => {
    setSelectedId(name);
    setDetailLoading(true);
    try {
      setDetail(await stockSvc.fetchMaterialRequestDetail(name));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load details');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const runFulfillment = async (options?: { supplier?: string }) => {
    if (!selectedId || !pendingAction || pendingAction.allowed === false) return;

    setFulfilling(true);
    try {
      const result =
        pendingAction.action === 'stock_entry'
          ? await stockSvc.fulfillMaterialRequestStockEntry(selectedId)
          : await stockSvc.fulfillMaterialRequestPurchaseReceipt(selectedId, {
              supplier: options?.supplier,
            });
      toast.success(`${result.doctype || 'Document'} ${result.name} created`);
      setConfirmOpen(false);
      setPendingAction(null);
      setSelectedId(null);
      setDetail(null);
      void loadRows();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setFulfilling(false);
    }
  };

  const detailContext = detail
    ? {
        company: detail.company,
        material_request_type: detail.material_request_type,
        warehouse: detail.set_warehouse,
        from_warehouse: detail.set_from_warehouse,
        pending_lines: detail.items.filter((i) => (i.pending_qty ?? 0) > 0).length,
        pending_qty: detail.items.reduce((sum, i) => sum + (i.pending_qty ?? 0), 0),
      }
    : undefined;

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Clock className="h-6 w-6" />
            Pending Material Requests
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Submitted spare-part requests waiting for transfer, issue, or receipt into the target warehouse.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void loadRows()} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Open requests</CardTitle>
          <CardDescription>
            Use Actions to create a Stock Entry (transfer/issue) or Purchase Receipt (purchase) for the requested warehouse.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search request ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">No pending material requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Purpose</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Required by</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.name}
                    className="cursor-pointer"
                    onClick={() => void openDetail(row.name)}
                  >
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.material_request_type}</TableCell>
                    <TableCell>{row.company}</TableCell>
                    <TableCell>{row.schedule_date || row.transaction_date}</TableCell>
                    <TableCell className="max-w-[160px] truncate">
                      {row.material_request_type === 'Material Transfer'
                        ? [row.from_warehouse, row.warehouse].filter(Boolean).join(' → ')
                        : row.warehouse || '—'}
                    </TableCell>
                    <TableCell>
                      {row.pending_lines ?? 0} line(s)
                      {row.pending_qty != null ? ` · ${row.pending_qty}` : ''}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{row.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {row.actions?.length ? (
                        <MaterialRequestFulfillmentActions
                          name={row.name}
                          actions={row.actions}
                          context={{
                            company: row.company,
                            material_request_type: row.material_request_type,
                            warehouse: row.warehouse,
                            from_warehouse: row.from_warehouse,
                            pending_lines: row.pending_lines,
                            pending_qty: row.pending_qty,
                          }}
                          onDone={() => void loadRows()}
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DetailSheet
        open={Boolean(selectedId)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setDetail(null);
          }
        }}
        title={detail?.name || selectedId || 'Material Request'}
        description={detail?.material_request_type}
        loading={detailLoading}
      >
        {detail && (
          <>
            <DetailSection title="Request">
              <DetailRow label="Purpose" value={detail.material_request_type} />
              <DetailRow label="Company" value={detail.company} />
              <DetailRow label="Required by" value={detail.schedule_date} />
              <DetailRow label="Status" value={detail.status} />
              {detail.set_from_warehouse && (
                <DetailRow label="From warehouse" value={detail.set_from_warehouse} />
              )}
              {detail.set_warehouse && (
                <DetailRow label="To warehouse" value={detail.set_warehouse} />
              )}
            </DetailSection>

            <DetailSection title="Items">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Requested</TableHead>
                    <TableHead className="text-right">Pending</TableHead>
                    <TableHead>Warehouse</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detail.items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <div className="font-medium">{item.item_name || item.item_code}</div>
                        <div className="text-xs text-muted-foreground">{item.item_code}</div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.stock_qty}
                        {item.uom ? ` ${item.uom}` : ''}
                      </TableCell>
                      <TableCell className="text-right font-medium">{item.pending_qty}</TableCell>
                      <TableCell className="text-sm">{item.warehouse || detail.set_warehouse || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DetailSection>

            {(detail.actions?.length ?? 0) > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {detail.actions!.map((action) => (
                  <Button
                    key={action.action}
                    type="button"
                    disabled={fulfilling || action.allowed === false}
                    onClick={() => {
                      setPendingAction(action);
                      setConfirmOpen(true);
                    }}
                  >
                    {action.action === 'stock_entry' ? (
                      <ArrowDownUp className="h-4 w-4 mr-2" />
                    ) : (
                      <PackageCheck className="h-4 w-4 mr-2" />
                    )}
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </>
        )}
      </DetailSheet>

      <MaterialRequestFulfillmentConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open && !fulfilling) setPendingAction(null);
        }}
        action={pendingAction}
        materialRequestName={selectedId || detail?.name || ''}
        context={detailContext}
        loading={fulfilling}
        onConfirm={runFulfillment}
      />
    </div>
  );
}
