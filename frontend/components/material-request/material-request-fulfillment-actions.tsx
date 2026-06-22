'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ListRowActions } from '@/components/list-row-actions';
import {
  MaterialRequestFulfillmentConfirmDialog,
  type MaterialRequestFulfillmentContext,
} from '@/components/material-request/material-request-fulfillment-confirm-dialog';
import * as stockSvc from '@/services/stockOperations';
import { ArrowDownUp, MoreHorizontal, PackageCheck } from 'lucide-react';
import { toast } from 'sonner';

export function MaterialRequestFulfillmentActions({
  name,
  actions,
  canStockEntry,
  canPurchaseReceipt,
  context,
  onDone,
}: {
  name: string;
  actions: stockSvc.MaterialRequestFulfillmentAction[];
  canStockEntry: boolean;
  canPurchaseReceipt: boolean;
  context?: MaterialRequestFulfillmentContext;
  onDone?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<stockSvc.MaterialRequestFulfillmentAction | null>(
    null
  );

  if (!actions.length) return null;

  const openConfirm = (action: stockSvc.MaterialRequestFulfillmentAction) => {
    if (action.action === 'stock_entry' && !canStockEntry) return;
    if (action.action === 'purchase_receipt' && !canPurchaseReceipt) return;
    setPendingAction(action);
    setConfirmOpen(true);
  };

  const runConfirmedAction = async (options?: { supplier?: string }) => {
    if (!pendingAction) return;

    setBusy(true);
    try {
      const result =
        pendingAction.action === 'stock_entry'
          ? await stockSvc.fulfillMaterialRequestStockEntry(name)
          : await stockSvc.fulfillMaterialRequestPurchaseReceipt(name, {
              supplier: options?.supplier,
            });
      toast.success(`${result.doctype || 'Document'} ${result.name} created`);
      setConfirmOpen(false);
      setPendingAction(null);
      onDone?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <ListRowActions doctype="Material Request" docName={name}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" disabled={busy}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {actions.map((action) => {
              const disabled =
                busy ||
                (action.action === 'stock_entry' && !canStockEntry) ||
                (action.action === 'purchase_receipt' && !canPurchaseReceipt);
              return (
                <DropdownMenuItem
                  key={action.action}
                  disabled={disabled}
                  onClick={() => openConfirm(action)}
                >
                  {action.action === 'stock_entry' ? (
                    <ArrowDownUp className="h-4 w-4 mr-2" />
                  ) : (
                    <PackageCheck className="h-4 w-4 mr-2" />
                  )}
                  {action.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </ListRowActions>

      <MaterialRequestFulfillmentConfirmDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open && !busy) setPendingAction(null);
        }}
        action={pendingAction}
        materialRequestName={name}
        context={context}
        loading={busy}
        onConfirm={runConfirmedAction}
      />
    </>
  );
}
