'use client';

import { useCallback, useEffect, useState } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DetailSheet, DetailRow, DetailSection } from '@/components/detail-sheet';
import { PrintFormatDropdown } from '@/components/print-format-dropdown';
import { ListRowActions } from '@/components/list-row-actions';
import * as sparePartSalesSvc from '@/services/sparePartSales';
import type { SparePartProformaDetail, SparePartProformaListItem } from '@/services/sparePartSales';
import { FileText, Loader2, Receipt, Search } from 'lucide-react';
import { toast } from 'sonner';

function formatMoney(amount?: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'ETB',
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

export default function ProformaInvoicesPage() {
  const { navigate } = useNavigation();
  const { canCreate } = usePermissions();

  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<SparePartProformaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SparePartProformaDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [convertTarget, setConvertTarget] = useState<SparePartProformaListItem | null>(null);
  const [converting, setConverting] = useState(false);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const result = await sparePartSalesSvc.listSparePartProformas({
        search: search || undefined,
        limit: 100,
      });
      setRows(result.data || []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load proformas');
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
    setDetailLoading(true);
    try {
      setSelected(await sparePartSalesSvc.getSparePartProforma(name));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load proforma');
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleConvert = async () => {
    if (!convertTarget) return;
    setConverting(true);
    try {
      const result = await sparePartSalesSvc.convertProformaToSalesInvoice(convertTarget.name, {
        submit: true,
      });
      toast.success(`Sales Invoice ${result.name} created from proforma`);
      setConvertTarget(null);
      setSelected(null);
      await loadRows();
      navigate('invoices');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to convert proforma');
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Proforma Invoices
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Spare part quotes saved as Sales Orders — convert to sales invoice after approval.
          </p>
        </div>
        <PermittedCreateButton
          module="proforma-invoices"
          onClick={() => navigate('proforma-invoice-new')}
        >
          New proforma
        </PermittedCreateButton>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Saved proformas</CardTitle>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                placeholder="Search proforma or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading…
            </div>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No proforma invoices yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proforma</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.name}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell>{row.customer_name || row.customer}</TableCell>
                    <TableCell>{row.transaction_date || '—'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="outline">{row.status || 'Draft'}</Badge>
                        {row.converted ? (
                          <Badge className="bg-emerald-600/10 text-emerald-700">Invoiced</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatMoney(row.grand_total, row.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ListRowActions doctype="Sales Order" docName={row.name}>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void openDetail(row.name)}>
                          View
                        </Button>
                        {!row.converted && row.docstatus === 1 && canCreate('invoices') ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setConvertTarget(row)}
                          >
                            <Receipt className="h-3.5 w-3.5 mr-1" />
                            To invoice
                          </Button>
                        ) : null}
                      </ListRowActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <DetailSheet
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.name || 'Proforma'}
        subtitle={selected?.customer_name}
        isLoading={detailLoading}
        onOpenInDesk={
          selected ? () => window.open(`/app/sales-order/${selected.name}`, '_blank') : undefined
        }
        footer={
          selected ? (
            <div className="flex flex-col gap-2 w-full">
              <PrintFormatDropdown
                doctype="Sales Order"
                docName={selected.name}
                className="w-full"
              />
              {!selected.converted && selected.docstatus === 1 && canCreate('invoices') ? (
                <Button type="button" className="w-full" onClick={() => setConvertTarget(selected)}>
                  Convert to sales invoice
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      >
        {selected ? (
          <>
            <DetailSection title="Summary">
              <DetailRow label="Customer" value={selected.customer_name || selected.customer} />
              <DetailRow label="Company" value={selected.company} />
              <DetailRow label="Date" value={selected.transaction_date} />
              <DetailRow label="Delivery date" value={selected.delivery_date} />
              <DetailRow label="Status" value={selected.status} />
              <DetailRow label="Total" value={formatMoney(selected.grand_total, selected.currency)} />
              {selected.sales_invoices?.length ? (
                <DetailRow label="Sales invoice(s)" value={selected.sales_invoices.join(', ')} />
              ) : null}
            </DetailSection>
            <DetailSection title="Lines">
              {(selected.items || []).map((line, idx) => (
                <DetailRow
                  key={`${line.spare_part}-${idx}`}
                  label={line.item_name || line.spare_part || line.item_code}
                  value={`${line.qty} × ${line.rate} = ${formatMoney(line.amount, selected.currency)}`}
                />
              ))}
            </DetailSection>
          </>
        ) : null}
      </DetailSheet>

      <AlertDialog open={Boolean(convertTarget)} onOpenChange={(open) => !open && setConvertTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Convert to sales invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Proforma {convertTarget?.name} will be converted to a submitted sales invoice. Stock
              will be checked at conversion time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={converting}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={converting} onClick={() => void handleConvert()}>
              {converting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Convert
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
