"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RotateCcw, X } from "lucide-react";
import { toast } from "sonner";
import * as returnsSvc from "@/services/partsReturns";
import type { JobCardPartItem } from "@/types/dms";

interface PartsReturnSectionProps {
  jobCardId: string;
  parts?: JobCardPartItem[];
  leadTechnician?: string;
  canCreate?: boolean;
  canApprove?: boolean;
  onUpdated?: () => void;
}

export function PartsReturnSection({
  jobCardId,
  parts = [],
  leadTechnician,
  canCreate = true,
  canApprove = true,
  onUpdated,
}: PartsReturnSectionProps) {
  const [returns, setReturns] = useState<returnsSvc.PartsReturnSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const returnableParts = useMemo(
    () =>
      parts.filter((p) => {
        const issued = p.quantity_issued ?? 0;
        const returned = p.quantity_returned ?? 0;
        return issued > returned && p.name;
      }),
    [parts]
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await returnsSvc.listPartsReturns(jobCardId);
      setReturns(rows || []);
    } catch {
      setReturns([]);
    } finally {
      setLoading(false);
    }
  }, [jobCardId]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      await load();
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  const openReturnDialog = () => {
    const initial: Record<string, number> = {};
    for (const p of returnableParts) {
      if (p.name) {
        const max = (p.quantity_issued ?? 0) - (p.quantity_returned ?? 0);
        initial[p.name] = max;
      }
    }
    setQuantities(initial);
    setShowDialog(true);
  };

  const statusColor = (s: string) => {
    if (s === "Completed") return "bg-green-600";
    if (s === "Submitted") return "bg-amber-500";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <RotateCcw className="h-4 w-4" />
            Parts return
          </CardTitle>
          <CardDescription>
            Return unused issued parts back to the warehouse.
          </CardDescription>
        </div>
        {canCreate && returnableParts.length > 0 && (
          <Button size="sm" variant="outline" onClick={openReturnDialog} disabled={busy}>
            Return unused parts
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : returns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No parts return notes yet.</p>
        ) : (
          returns.map((rtn) => (
            <div
              key={rtn.name}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{rtn.name}</p>
                {rtn.stock_entry && (
                  <p className="text-xs text-muted-foreground">Stock entry: {rtn.stock_entry}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusColor(rtn.status)}>{rtn.status}</Badge>
                {rtn.status === "Draft" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => run(() => returnsSvc.submitPartsReturn(rtn.name), "Submitted")}
                  >
                    Submit
                  </Button>
                )}
                {canApprove && rtn.status === "Submitted" && (
                  <Button
                    size="sm"
                    disabled={busy}
                    onClick={() => run(() => returnsSvc.approvePartsReturn(rtn.name), "Return completed")}
                  >
                    Approve return
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Return unused parts</DialogTitle>
            <DialogDescription>
              Specify quantities to return. Parts go back to warehouse stock on approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {returnableParts
              .filter((p) => p.name && p.name in quantities)
              .map((p) => {
              const max = (p.quantity_issued ?? 0) - (p.quantity_returned ?? 0);
              return (
                <div key={p.name} className="flex items-center gap-2 rounded border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm">{p.part_name || p.item_code}</p>
                    <p className="text-xs text-muted-foreground">
                      Issued: {p.quantity_issued} · Already returned: {p.quantity_returned ?? 0} · Max: {max}
                    </p>
                  </div>
                  <div className="w-24 shrink-0">
                    <Label className="sr-only">Qty to return</Label>
                    <Input
                      type="number"
                      min={0}
                      max={max}
                      step="any"
                      value={quantities[p.name!] ?? 0}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [p.name!]: Math.min(max, Math.max(0, Number(e.target.value) || 0)),
                        }))
                      }
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${p.part_name || p.item_code} from return`}
                    onClick={() =>
                      setQuantities((prev) => {
                        const next = { ...prev };
                        delete next[p.name!];
                        return next;
                      })
                    }
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
            {returnableParts.filter((p) => p.name && p.name in quantities).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No parts selected. Close and reopen to start over.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={
                busy ||
                !Object.entries(quantities).some(([, qty]) => qty > 0)
              }
              onClick={() => {
                const items = Object.entries(quantities)
                  .filter(([, qty]) => qty > 0)
                  .map(([job_card_part_row, quantity_returned]) => ({
                    job_card_part_row,
                    quantity_returned,
                  }));
                void run(async () => {
                  const res = await returnsSvc.createPartsReturn(
                    jobCardId,
                    items,
                    leadTechnician
                  );
                  await returnsSvc.submitPartsReturn(res.name);
                  setShowDialog(false);
                }, "Return note submitted");
              }}
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit return"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
