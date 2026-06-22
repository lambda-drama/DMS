'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/searchable-select';
import type { MaterialRequestFulfillmentAction } from '@/services/stockOperations';
import * as stockSvc from '@/services/stockOperations';
import { ArrowDownUp, Loader2, PackageCheck, Warehouse } from 'lucide-react';

export interface MaterialRequestFulfillmentContext {
  company?: string;
  material_request_type?: string;
  warehouse?: string;
  from_warehouse?: string;
  pending_lines?: number;
  pending_qty?: number;
}

function actionMeta(action: MaterialRequestFulfillmentAction['action']) {
  if (action === 'purchase_receipt') {
    return {
      title: 'Create Purchase Receipt',
      verb: 'Create & submit purchase receipt',
      summary:
        'A purchase receipt will be created for all pending lines and submitted. Stock will be received into the requested warehouse and linked to this material request.',
      Icon: PackageCheck,
    };
  }
  return {
    title: 'Create Stock Entry',
    verb: 'Create & submit stock entry',
    summary:
      'A stock entry will be created for all pending lines and submitted. Quantities will be moved or issued according to the material request purpose.',
    Icon: ArrowDownUp,
  };
}

function warehouseLabel(context?: MaterialRequestFulfillmentContext) {
  if (!context) return null;
  if (context.material_request_type === 'Material Transfer' && context.from_warehouse) {
    return `${context.from_warehouse} → ${context.warehouse || '—'}`;
  }
  return context.warehouse || null;
}

export function MaterialRequestFulfillmentConfirmDialog({
  open,
  onOpenChange,
  action,
  materialRequestName,
  context,
  loading,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: MaterialRequestFulfillmentAction | null;
  materialRequestName: string;
  context?: MaterialRequestFulfillmentContext;
  loading?: boolean;
  onConfirm: (options?: { supplier?: string }) => void | Promise<void>;
}) {
  const [supplier, setSupplier] = useState('');
  const [supplierOptions, setSupplierOptions] = useState<{ value: string; label: string }[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState(false);
  const [defaultsLoading, setDefaultsLoading] = useState(false);

  const isPurchaseReceipt = action?.action === 'purchase_receipt';

  useEffect(() => {
    if (!open || !isPurchaseReceipt) return;

    let cancelled = false;
    const load = async () => {
      setDefaultsLoading(true);
      setSuppliersLoading(true);
      try {
        const [defaults, suppliers] = await Promise.all([
          stockSvc.fetchPurchaseReceiptDefaults(context?.company || undefined),
          stockSvc.searchSuppliers(undefined, 50),
        ]);
        if (cancelled) return;
        setSupplierOptions(
          suppliers.map((s) => ({
            value: s.name,
            label: s.supplier_name || s.name,
          }))
        );
        if (defaults.default_supplier) {
          setSupplier(defaults.default_supplier);
        } else if (suppliers.length === 1) {
          setSupplier(suppliers[0].name);
        } else {
          setSupplier('');
        }
      } catch {
        if (!cancelled) {
          setSupplierOptions([]);
          setSupplier('');
        }
      } finally {
        if (!cancelled) {
          setDefaultsLoading(false);
          setSuppliersLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, isPurchaseReceipt, context?.company]);

  useEffect(() => {
    if (!open) {
      setSupplier('');
      setSupplierOptions([]);
    }
  }, [open]);

  if (!action) return null;

  const meta = actionMeta(action.action);
  const wh = warehouseLabel(context);
  const submitDisabled = loading || (isPurchaseReceipt && (!supplier || defaultsLoading));

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <div className="border-b bg-muted/40 px-6 py-5">
          <AlertDialogHeader className="space-y-2 text-left">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <meta.Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 space-y-1">
                <AlertDialogTitle className="text-lg">{meta.title}</AlertDialogTitle>
                <AlertDialogDescription className="text-sm leading-relaxed">
                  {meta.summary}
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-lg border bg-card p-4 shadow-sm">
            <dl className="space-y-3 text-sm">
              <div className="flex items-start justify-between gap-4">
                <dt className="text-muted-foreground shrink-0">Material request</dt>
                <dd className="font-mono font-medium text-right break-all">{materialRequestName}</dd>
              </div>
              {context?.material_request_type && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0">Purpose</dt>
                  <dd className="font-medium text-right">{context.material_request_type}</dd>
                </div>
              )}
              {wh && (
                <div className="flex items-start justify-between gap-4">
                  <dt className="text-muted-foreground shrink-0 flex items-center gap-1.5">
                    <Warehouse className="h-3.5 w-3.5" />
                    Warehouse
                  </dt>
                  <dd className="font-medium text-right break-all">{wh}</dd>
                </div>
              )}
              {(context?.pending_lines != null || context?.pending_qty != null) && (
                <div className="flex items-start justify-between gap-4 border-t pt-3">
                  <dt className="text-muted-foreground shrink-0">Pending</dt>
                  <dd className="font-medium text-right">
                    {context.pending_lines != null ? `${context.pending_lines} line(s)` : ''}
                    {context.pending_lines != null && context.pending_qty != null ? ' · ' : ''}
                    {context.pending_qty != null ? `${context.pending_qty} qty` : ''}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {isPurchaseReceipt && (
            <div className="space-y-2">
              <Label>Spare-parts supplier *</Label>
              <SearchableSelect
                options={supplierOptions}
                value={supplier}
                onValueChange={setSupplier}
                placeholder={defaultsLoading ? 'Loading suppliers…' : 'Select supplier'}
                isLoading={suppliersLoading || defaultsLoading}
              />
              <p className="text-xs text-muted-foreground">
                Uses DMS default supplier when configured. Override here if needed.
              </p>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            This action submits the document immediately. You can review it in ERPNext if needed.
          </p>
        </div>

        <AlertDialogFooter className="border-t bg-muted/20 px-6 py-4 sm:justify-end">
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            type="button"
            disabled={submitDisabled}
            onClick={() =>
              void onConfirm(isPurchaseReceipt ? { supplier: supplier || undefined } : undefined)
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Submitting…
              </>
            ) : (
              meta.verb
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
