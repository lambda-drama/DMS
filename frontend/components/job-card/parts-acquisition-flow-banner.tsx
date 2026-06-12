"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { PartsRequestSummary } from "@/services/partsRequests";
import { uploadFile } from "@/services/common";
import { cn } from "@/lib/utils";

import { partsRequestFlowProgress } from "@/lib/parts-request-flow";

const FLOW_STEPS = [
  { key: "request", label: "Requested", icon: Send },
  { key: "approve", label: "Approved", icon: ClipboardCheck },
  { key: "issue", label: "Issued", icon: Package },
  { key: "receive", label: "Received", icon: Truck },
] as const;

const TERMINAL_STATUSES = new Set(["Received", "Cancelled"]);

interface PartsAcquisitionFlowBannerProps {
  jobCardId: string;
  requests?: PartsRequestSummary[];
  leadTechnician?: string;
  canApprove?: boolean;
  onUpdated?: () => void;
  onViewDetails?: () => void;
  /** Bump after creating a request from the header so we refetch if list is stale */
  refreshKey?: number;
}

export function PartsAcquisitionFlowBanner({
  jobCardId,
  requests: requestsProp,
  leadTechnician,
  canApprove = true,
  onUpdated,
  onViewDetails,
  refreshKey = 0,
}: PartsAcquisitionFlowBannerProps) {
  const [requests, setRequests] = useState<PartsRequestSummary[]>(requestsProp || []);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [issueDialog, setIssueDialog] = useState<PartsRequestSummary | null>(null);
  const [receiveDialog, setReceiveDialog] = useState<PartsRequestSummary | null>(null);
  const [pickerSig, setPickerSig] = useState("");
  const [staffSig, setStaffSig] = useState("");
  const [receiveSig, setReceiveSig] = useState("");
  const [sigUploading, setSigUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await partsSvc.listPartsRequests(jobCardId);
      setRequests(rows || []);
    } catch {
      setRequests(requestsProp || []);
    } finally {
      setLoading(false);
    }
  }, [jobCardId, requestsProp]);

  useEffect(() => {
    if (requestsProp?.length) {
      setRequests(requestsProp);
    }
  }, [requestsProp]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const activeRequest = useMemo(
    () => requests.find((pr) => !TERMINAL_STATUSES.has(pr.status)),
    [requests]
  );

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

  if (!activeRequest && !loading) {
    return null;
  }

  if (!activeRequest) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading parts request…
        </CardContent>
      </Card>
    );
  }

  const { completedThrough, current } = partsRequestFlowProgress(activeRequest.status);

  return (
    <>
      <Card className="min-w-0 overflow-hidden border-primary/30 bg-primary/5">
        <CardContent className="space-y-4 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium flex items-center gap-2">
                <Package className="h-4 w-4 text-primary shrink-0" />
                Parts acquisition in progress
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {activeRequest.name}
                {activeRequest.pick_slip ? ` · Pick slip ${activeRequest.pick_slip}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="bg-background">
                {activeRequest.status}
              </Badge>
              {onViewDetails && (
                <Button type="button" variant="ghost" size="sm" className="h-8 text-xs" onClick={onViewDetails}>
                  Full details
                </Button>
              )}
            </div>
          </div>

          <div className="dms-tabs-scroll flex items-center justify-between gap-1">
            {FLOW_STEPS.map((step, index) => {
              const isCompleted = index <= completedThrough;
              const isCurrent = index === current;
              const Icon = step.icon;
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
                  {index < FLOW_STEPS.length - 1 && (
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
            {canApprove && activeRequest.status === "Pending Approval" && (
              <Button
                size="sm"
                disabled={busy}
                onClick={() => run(() => partsSvc.approvePartsRequest(activeRequest.name), "Parts approved")}
              >
                Approve request
              </Button>
            )}
            {activeRequest.status === "Ready for Issue" && (
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setIssueDialog(activeRequest)}>
                Issue parts
              </Button>
            )}
            {activeRequest.status === "Issued" && (
              <Button size="sm" disabled={busy} onClick={() => setReceiveDialog(activeRequest)}>
                <Truck className="mr-1 h-4 w-4" />
                Confirm received
              </Button>
            )}
            {(activeRequest.status === "Pending Approval" ||
              activeRequest.status === "Ready for Issue" ||
              activeRequest.status === "Issued") && (
              <p className="text-xs text-muted-foreground sm:ml-auto">
                {activeRequest.status === "Pending Approval" && "Waiting for parts advisor approval"}
                {activeRequest.status === "Ready for Issue" && "Warehouse can pick and issue parts"}
                {activeRequest.status === "Issued" && "Technician confirms parts at the bay"}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!issueDialog} onOpenChange={(o) => !o && setIssueDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue parts — {issueDialog?.name}</DialogTitle>
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
                if (!issueDialog) return;
                void run(
                  () => partsSvc.issuePartsRequest(issueDialog.name, pickerSig, staffSig),
                  "Parts issued"
                ).then(() => {
                  setIssueDialog(null);
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

      <Dialog open={!!receiveDialog} onOpenChange={(o) => !o && setReceiveDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Receive parts — {receiveDialog?.name}</DialogTitle>
            <DialogDescription>Technician confirms parts received at the bay.</DialogDescription>
          </DialogHeader>
          <SignaturePad
            existingUrl={receiveSig || undefined}
            uploading={sigUploading}
            onSave={async (file) => {
              setSigUploading(true);
              try {
                setReceiveSig(await uploadFile(file));
              } finally {
                setSigUploading(false);
              }
            }}
            onClear={() => setReceiveSig("")}
          />
          <DialogFooter>
            <Button
              disabled={!receiveSig || busy}
              onClick={() => {
                if (!receiveDialog) return;
                void run(
                  () => partsSvc.receivePartsRequest(receiveDialog.name, receiveSig),
                  "Parts received"
                ).then(() => {
                  setReceiveDialog(null);
                  setReceiveSig("");
                });
              }}
            >
              Confirm receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
