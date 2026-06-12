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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle, FileText } from "lucide-react";
import { toast } from "sonner";
import { useNavigation } from "@/contexts/navigation-context";
import * as partsSvc from "@/services/partsRequests";
import type { AdditionalWorkRequestSummary } from "@/services/partsRequests";

interface AdditionalWorkSectionProps {
  jobCardId: string;
  leadTechnician?: string;
  canCreate?: boolean;
  canCreateEstimate?: boolean;
  onUpdated?: () => void;
}

export function AdditionalWorkSection({
  jobCardId,
  leadTechnician,
  canCreate = true,
  canCreateEstimate = true,
  onUpdated,
}: AdditionalWorkSectionProps) {
  const { navigate } = useNavigation();
  const [requests, setRequests] = useState<AdditionalWorkRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [description, setDescription] = useState("");
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await partsSvc.listAdditionalWorkRequests(jobCardId);
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

  const statusColor = (s: string) => {
    if (s === "Approved") return "bg-green-600";
    if (s === "Pending Customer Approval") return "bg-amber-500";
    if (s === "Rejected") return "bg-destructive";
    return "secondary";
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4" />
            Additional work
          </CardTitle>
          <CardDescription>
            Extra issues found during repair — customer approval via supplementary estimate.
          </CardDescription>
        </div>
        {canCreate && (
          <Button size="sm" variant="outline" onClick={() => setShowDialog(true)} disabled={busy}>
            Report additional work
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">No additional work requests yet.</p>
        ) : (
          requests.map((awr) => (
            <div
              key={awr.name}
              className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="font-medium">{awr.name}</p>
                <p className="text-sm text-muted-foreground line-clamp-2">{awr.description}</p>
                {awr.reason && (
                  <p className="text-xs text-muted-foreground mt-1">Reason: {awr.reason}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Badge className={statusColor(awr.status)}>{awr.status}</Badge>
                {awr.supplementary_estimate ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate("estimate-detail", { id: awr.supplementary_estimate! })}
                  >
                    <FileText className="mr-1 h-4 w-4" />
                    View estimate
                  </Button>
                ) : (
                  canCreateEstimate &&
                  awr.status === "Pending Customer Approval" && (
                    <Button
                      size="sm"
                      disabled={busy}
                      onClick={() =>
                        run(async () => {
                          const res = await partsSvc.createSupplementaryEstimate(awr.name);
                          navigate("estimate-detail", { id: res.name });
                        }, "Supplementary estimate created")
                      }
                    >
                      Create estimate
                    </Button>
                  )
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Additional work request</DialogTitle>
            <DialogDescription>
              Describe the extra work found. The job card will pause for customer approval.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Work description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Brake pads below minimum thickness"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Reason / findings</Label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Technical findings supporting the request"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              disabled={!description.trim() || busy}
              onClick={() =>
                run(async () => {
                  await partsSvc.createAdditionalWorkRequest(jobCardId, {
                    description: description.trim(),
                    reason: reason.trim() || undefined,
                    raised_by: leadTechnician,
                  });
                  setShowDialog(false);
                  setDescription("");
                  setReason("");
                }, "Additional work request created")
              }
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
