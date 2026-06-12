"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignaturePad } from "@/components/signature-pad";
import {
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Package,
  Send,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import * as partsSvc from "@/services/partsRequests";
import type { PartsRequestDetail } from "@/services/partsRequests";
import { uploadFile } from "@/services/common";
import { cn } from "@/lib/utils";
import {
  PARTS_REQUEST_FLOW_STEPS,
  partsRequestFlowProgress,
  partsRequestStatusHint,
} from "@/lib/parts-request-flow";

const FLOW_ICONS = [Send, ClipboardCheck, Package, Truck] as const;

interface PartsRequestWorkflowPanelProps {
  request: PartsRequestDetail;
  canApprove?: boolean;
  canIssue?: boolean;
  onUpdated?: () => void;
}

export function PartsRequestWorkflowPanel({
  request,
  canApprove = true,
  canIssue = true,
  onUpdated,
}: PartsRequestWorkflowPanelProps) {
  const [busy, setBusy] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [pickerSig, setPickerSig] = useState("");
  const [staffSig, setStaffSig] = useState("");
  const [sigUploading, setSigUploading] = useState(false);

  const { completedThrough, current } = partsRequestFlowProgress(request.status);
  const hint = partsRequestStatusHint(request.status);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      onUpdated?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  };

  if (request.status === "Cancelled") {
    return (
      <Card className="border-muted">
        <CardContent className="p-4 text-sm text-muted-foreground">This request was cancelled.</CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="min-w-0 overflow-hidden border-primary/30 bg-primary/5">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-primary shrink-0" />
                Parts requisition process
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {request.pick_slip ? `Pick slip ${request.pick_slip}` : "No pick slip yet"}
                {request.stock_entry ? ` · Stock entry ${request.stock_entry}` : ""}
              </p>
            </div>
            <Badge variant="outline" className="bg-background shrink-0">
              {request.status}
            </Badge>
          </div>

          <div className="dms-tabs-scroll flex items-center justify-between gap-1">
            {PARTS_REQUEST_FLOW_STEPS.map((step, index) => {
              const isCompleted = index <= completedThrough;
              const isCurrent = index === current;
              const Icon = FLOW_ICONS[index];
              return (
                <div key={step.key} className="flex items-center flex-1 min-w-0">
                  <div className="flex flex-col items-center gap-1 min-w-[4.5rem] sm:min-w-[5.5rem]">
                    <div
                      className={cn(
                        "flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-colors",
                        isCompleted
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCurrent
                            ? "border-primary bg-primary/15 text-primary animate-pulse"
                            : "border-muted bg-muted/30 text-muted-foreground"
                      )}
                    >
                      {isCompleted && !isCurrent ? (
                        <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs text-center leading-tight",
                        isCurrent ? "font-semibold text-primary" : "text-muted-foreground"
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < PARTS_REQUEST_FLOW_STEPS.length - 1 && (
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 shrink-0 mx-0.5",
                        index < completedThrough ? "text-primary" : "text-muted-foreground/40"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-row flex-wrap items-center gap-2 border-t border-primary/10 pt-3">
            {canApprove && request.status === "Pending Approval" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => run(() => partsSvc.approvePartsRequest(request.name), "Parts approved")}
              >
                {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
                Approve request
              </Button>
            )}
            {canIssue && (request.status === "Ready for Issue" || request.status === "Partially Issued") && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setIssueOpen(true)}>
                Issue parts
              </Button>
            )}
            {request.status === "Issued" && (
              <p className="text-xs text-muted-foreground">
                Parts issued — technician confirms receipt on the job card.
              </p>
            )}
            {request.status === "Received" && (
              <p className="text-xs text-green-700 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Completed — parts received at workshop
              </p>
            )}
            {hint && request.status !== "Received" && (
              <p className="text-xs text-muted-foreground sm:ml-auto">{hint}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue parts — {request.name}</DialogTitle>
            <DialogDescription>
              Picker and parts staff signatures required to release parts from the warehouse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium">Picker signature</p>
              <SignaturePad
                existingUrl={pickerSig || undefined}
                uploading={sigUploading}
                onSave={async (file) => {
                  setSigUploading(true);
                  try {
                    setPickerSig(await uploadFile(file));
                  } finally {
                    setSigUploading(false);
                  }
                }}
                onClear={() => setPickerSig("")}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Parts staff signature</p>
              <SignaturePad
                existingUrl={staffSig || undefined}
                uploading={sigUploading}
                onSave={async (file) => {
                  setSigUploading(true);
                  try {
                    setStaffSig(await uploadFile(file));
                  } finally {
                    setSigUploading(false);
                  }
                }}
                onClear={() => setStaffSig("")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!pickerSig || !staffSig || busy}
              onClick={() => {
                void run(
                  () => partsSvc.issuePartsRequest(request.name, pickerSig, staffSig),
                  "Parts issued"
                ).then(() => {
                  setIssueOpen(false);
                  setPickerSig("");
                  setStaffSig("");
                });
              }}
            >
              <CheckCircle2 className="mr-1 h-4 w-4" />
              Confirm issue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
