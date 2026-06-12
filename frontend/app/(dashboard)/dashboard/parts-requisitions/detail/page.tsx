"use client";

import { useNavigation } from "@/contexts/navigation-context";
import { usePartsRequisition } from "@/hooks/use-dms";
import { usePermissions } from "@/contexts/permissions-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Package,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { PartsRequestWorkflowPanel } from "@/components/parts-request/parts-request-workflow-panel";
import { partsRequestStatusHint } from "@/lib/parts-request-flow";

function lineStatusClass(status?: string) {
  if (status === "Ready for Issue" || status === "Issued" || status === "Received") {
    return "bg-green-600";
  }
  if (status === "Backordered") return "bg-destructive";
  if (status === "Pending Approval") return "bg-amber-500";
  return "secondary";
}

export default function PartsRequisitionDetailPage() {
  const { viewParams, navigate } = useNavigation();
  const { canWrite } = usePermissions();
  const id = viewParams.get("id") || "";
  const { data: request, isLoading, error, mutate } = usePartsRequisition(id);

  const canManage = canWrite("parts-requisitions");

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">No parts requisition ID provided</p>
        <Button variant="outline" onClick={() => navigate("parts-requisitions")}>
          Back to Parts Requisition
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">Parts requisition not found</p>
        <Button variant="outline" onClick={() => navigate("parts-requisitions")}>
          Back to Parts Requisition
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("parts-requisitions")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <Package className="h-5 w-5" />
              {request.name}
            </h1>
            <p className="text-sm text-muted-foreground">{partsRequestStatusHint(request.status)}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-12 sm:pl-0">
          <Badge variant="outline">{request.status}</Badge>
          {request.job_card && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("job-card-detail", { id: request.job_card! })}
            >
              <Wrench className="mr-1 h-4 w-4" />
              Job card {request.job_card}
            </Button>
          )}
        </div>
      </div>

      <PartsRequestWorkflowPanel
        request={request}
        canApprove={canManage}
        canIssue={canManage}
        onUpdated={() => void mutate()}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Car className="h-4 w-4" />
              Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Plate:</span> {request.license_plate || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">VIN:</span> {request.vehicle_vin || "—"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Request details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Customer:</span> {request.customer || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Requested by:</span>{" "}
              {request.requested_by || "—"}
            </p>
            <p className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              {request.posting_date
                ? new Date(request.posting_date).toLocaleDateString()
                : "—"}
            </p>
            {request.pick_slip && (
              <p>
                <span className="text-muted-foreground">Pick slip:</span> {request.pick_slip}
              </p>
            )}
            {request.stock_entry && (
              <p>
                <span className="text-muted-foreground">Stock entry:</span> {request.stock_entry}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parts requested</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          {request.items && request.items.length > 0 ? (
            <div className="dms-table-panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part</TableHead>
                    <TableHead className="text-right">Qty requested</TableHead>
                    <TableHead className="text-right">Stock</TableHead>
                    <TableHead>Bin</TableHead>
                    <TableHead>Line status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {request.items.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        <p className="font-medium">{item.item_code}</p>
                        {item.part_name && (
                          <p className="text-xs text-muted-foreground">{item.part_name}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right">{item.quantity_requested}</TableCell>
                      <TableCell className="text-right">
                        {item.stock_available != null ? item.stock_available : "—"}
                      </TableCell>
                      <TableCell>{item.bin_location || "—"}</TableCell>
                      <TableCell>
                        <Badge className={lineStatusClass(item.line_status)}>
                          {item.line_status || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No line items on this request.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
