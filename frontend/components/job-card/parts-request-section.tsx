"use client";

import { useCallback, useEffect, useState } from "react";
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
import { SignaturePad } from "@/components/signature-pad";
import { Loader2, Package, CheckCircle2, Truck } from "lucide-react";
import { toast } from "sonner";
import * as partsSvc from "@/services/partsRequests";
import type { PartsRequestSummary } from "@/services/partsRequests";
import { hasRequestableParts } from "@/lib/parts-request-eligibility";
import type { JobCardPartItem } from "@/types/dms";
import { uploadFile } from "@/services/common";

interface PartsRequestSectionProps {
  jobCardId: string;
  leadTechnician?: string;
  parts?: JobCardPartItem[];
  canRequest?: boolean;
  canApprove?: boolean;
  onUpdated?: () => void;
}

export function PartsRequestSection({
  jobCardId,
  leadTechnician,
  parts,
  canRequest = true,
  canApprove = true,
  onUpdated,
}: PartsRequestSectionProps) {
  const [requests, setRequests] = useState<PartsRequestSummary[]>([]);
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
      setRequests([]);
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

  const handleRequestParts = () =>
    run(
      () => partsSvc.createPartsRequest(jobCardId, leadTechnician),
      "Parts request created"
    );

  const statusColor = (s: string) => {
    if (s === "Received" || s === "Issued") return "bg-green-600";
    if (s === "Ready for Issue" || s === "Approved") return "bg-blue-600";
    if (s === "Pending Approval") return "bg-amber-500";
    return "secondary";
  };

  const canSubmitRequest = canRequest && hasRequestableParts(parts);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Parts acquisition
          </CardTitle>
          <CardDescription>
            Request parts from warehouse, approve, issue, and confirm receipt.
          </CardDescription>
        </div>
        {canSubmitRequest && (
          <Button size="sm" onClick={handleRequestParts} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Request parts"}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading parts requests…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {canSubmitRequest
              ? "No parts requests yet. Click Request parts when the job card has part lines."
              : "No parts requests yet."}
          </p>
        ) : (
          requests.map((pr) => (
            <div
              key={pr.name}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{pr.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pr.pick_slip ? `Pick slip: ${pr.pick_slip}` : "No pick slip"}
                  {pr.stock_entry ? ` · Stock entry: ${pr.stock_entry}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={statusColor(pr.status)}>{pr.status}</Badge>
                {canApprove && pr.status === "Pending Approval" && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => run(() => partsSvc.approvePartsRequest(pr.name), "Approved")}
                  >
                    Approve
                  </Button>
                )}
                {pr.status === "Ready for Issue" && (
                  <Button size="sm" variant="outline" disabled={busy} onClick={() => setIssueDialog(pr)}>
                    Issue parts
                  </Button>
                )}
                {pr.status === "Issued" && (
                  <Button size="sm" disabled={busy} onClick={() => setReceiveDialog(pr)}>
                    <Truck className="mr-1 h-4 w-4" />
                    Receive
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={!!issueDialog} onOpenChange={(o) => !o && setIssueDialog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Issue parts — {issueDialog?.name}</DialogTitle>
            <DialogDescription>
              Picker and parts staff signatures are required to release parts from the warehouse.
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
                  () =>
                    partsSvc.issuePartsRequest(issueDialog.name, pickerSig, staffSig),
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
    </Card>
  );
}
