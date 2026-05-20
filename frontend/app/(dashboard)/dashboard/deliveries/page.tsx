"use client";

import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { useDeliveries } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  DetailSheet,
  DetailSection,
  DetailRow,
} from "@/components/detail-sheet";
import {
  Search,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
  ExternalLink,
} from "lucide-react";
import { ListRowActions } from "@/components/list-row-actions";

const docstatusMap: Record<number, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  0: { label: "Draft", variant: "secondary" },
  1: { label: "Submitted", variant: "default" },
  2: { label: "Cancelled", variant: "destructive" },
};

export default function DeliveriesPage() {
  const { navigate, viewParams } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const id = viewParams.get("id");
    if (id) setSelectedId(id);
  }, [viewParams]);
  const { data: deliveries, isLoading, error } = useDeliveries({
    search: searchQuery || undefined,
  });

  const selectedDelivery = deliveries?.find((d) => d.name === selectedId);

  const stats = {
    total: deliveries?.length || 0,
    draft: deliveries?.filter((d) => d.docstatus === 0).length || 0,
    submitted: deliveries?.filter((d) => d.docstatus === 1).length || 0,
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicle Deliveries</h1>
          <p className="text-muted-foreground mt-1">Manage vehicle delivery and handover</p>
        </div>
        <PermittedCreateButton
          module="deliveries"
          label="New Delivery"
          onClick={() => navigate("delivery-new")}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Draft</p>
                <p className="text-2xl font-bold">{stats.draft}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#F9A825]/10">
                <Clock className="h-5 w-5 text-[#F9A825]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="text-2xl font-bold">{stats.submitted}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#2E7D32]/10">
                <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by delivery ID, vehicle, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deliveries List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Failed to load deliveries
            </div>
          ) : deliveries && deliveries.length > 0 ? (
            <div className="dms-table-panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery ID</TableHead>
                    <TableHead>Job Card</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => {
                    const ds = docstatusMap[delivery.docstatus] || docstatusMap[0];
                    return (
                      <TableRow key={delivery.name}>
                        <TableCell>
                          <button
                            onClick={() => setSelectedId(delivery.name)}
                            className="font-medium text-primary hover:underline"
                          >
                            {delivery.name}
                          </button>
                        </TableCell>
                        <TableCell>
                          {delivery.job_card ? (
                            <button
                              onClick={() => navigate("job-card-detail", { id: delivery.job_card })}
                              className="text-muted-foreground hover:text-primary hover:underline"
                            >
                              {delivery.job_card}
                            </button>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{delivery.license_plate || "—"}</p>
                            <p className="text-xs text-muted-foreground">{delivery.vehicle_model}</p>
                          </div>
                        </TableCell>
                        <TableCell>{delivery.customer || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={ds.variant}>{ds.label}</Badge>
                        </TableCell>
                        <TableCell>
                          {delivery.delivery_date_time
                            ? new Date(delivery.delivery_date_time).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <ListRowActions doctype="Vehicle Delivery Note" docName={delivery.name}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setSelectedId(delivery.name)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    window.open(`/app/vehicle-delivery-note/${delivery.name}`, "_blank")
                                  }
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Open in Desk
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </ListRowActions>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Truck className="h-12 w-12 mb-4 opacity-50" />
              <p>No deliveries found</p>
            </div>
          )}
        </CardContent>
      </Card>

      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        title={selectedId || ""}
        subtitle={selectedDelivery?.customer}
        badge={
          selectedDelivery
            ? {
                label: docstatusMap[selectedDelivery.docstatus]?.label || "Draft",
                variant: docstatusMap[selectedDelivery.docstatus]?.variant,
              }
            : undefined
        }
        onOpenInDesk={() =>
          window.open(`/app/vehicle-delivery-note/${selectedId}`, "_blank")
        }
      >
        {selectedDelivery && (
          <>
            <DetailSection title="Delivery Info">
              <DetailRow label="Job Card" value={selectedDelivery.job_card} />
              <DetailRow label="Customer" value={selectedDelivery.customer} />
              <DetailRow label="Delivered By" value={selectedDelivery.delivered_by} />
              <DetailRow
                label="Delivery Date"
                value={
                  selectedDelivery.delivery_date_time
                    ? new Date(selectedDelivery.delivery_date_time).toLocaleString()
                    : undefined
                }
              />
            </DetailSection>
            <DetailSection title="Vehicle">
              <DetailRow label="VIN" value={selectedDelivery.vehicle_vin} />
              <DetailRow label="Model" value={selectedDelivery.vehicle_model} />
              <DetailRow label="License Plate" value={selectedDelivery.license_plate} />
              <DetailRow
                label="Final Odometer"
                value={
                  selectedDelivery.final_odometer_km
                    ? `${selectedDelivery.final_odometer_km} km`
                    : undefined
                }
              />
            </DetailSection>
            <DetailSection title="Next Service">
              <DetailRow
                label="Due KM"
                value={
                  selectedDelivery.next_service_due_km
                    ? `${selectedDelivery.next_service_due_km} km`
                    : undefined
                }
              />
              <DetailRow
                label="Due Date"
                value={
                  selectedDelivery.next_service_due_date
                    ? new Date(selectedDelivery.next_service_due_date).toLocaleDateString()
                    : undefined
                }
              />
            </DetailSection>
          </>
        )}
      </DetailSheet>
    </div>
  );
}
