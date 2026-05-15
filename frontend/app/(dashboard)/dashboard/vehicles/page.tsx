"use client";

import { useState, useMemo, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useVehicles, useVehicle } from "@/hooks/use-dms";
import { PaginationControls } from "@/components/pagination-controls";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  Car,
  Shield,
  AlertTriangle,
  Gauge,
  Loader2,
  Filter,
  Fuel,
} from "lucide-react";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "In Stock", label: "In Stock" },
  { value: "Delivered to Customer", label: "Delivered" },
  { value: "In Service", label: "In Service" },
  { value: "In Transit", label: "In Transit" },
];

const warrantyOptions = [
  { value: "all", label: "All Warranty" },
  { value: "Active", label: "Active" },
  { value: "Expired by Time", label: "Expired (Time)" },
  { value: "Expired by Mileage", label: "Expired (Mileage)" },
  { value: "Void", label: "Void" },
];

function getStatusBadge(status?: string) {
  const m: Record<string, string> = {
    "In Stock": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    "Delivered to Customer": "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    "In Service": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    "In Transit": "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    "Total Loss": "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    Scrapped: "bg-muted text-muted-foreground",
  };
  return m[status || ""] || "bg-muted text-muted-foreground";
}

function getWarrantyBadge(status?: string) {
  const m: Record<string, string> = {
    Active: "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    "Expired by Time": "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    "Expired by Mileage": "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    Void: "bg-muted text-muted-foreground",
    "Pending Verification": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  };
  return m[status || ""] || "";
}

export default function VehiclesPage() {
  const { navigate, viewParams } = useNavigation();
  const customerFromUrl = viewParams.get("customer");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warrantyFilter, setWarrantyFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: selectedVehicle, isLoading: detailLoading } = useVehicle(selectedId);

  const { data: result, isLoading, error } = useVehicles({
    customer: customerFromUrl || undefined,
    search: search || undefined,
    vehicle_status: statusFilter !== "all" ? statusFilter : undefined,
    warranty_status: warrantyFilter !== "all" ? warrantyFilter : undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const vehicles = result?.data;
  const totalItems = result?.total || 0;

  useEffect(() => {
    const id = viewParams.get("id");
    if (id) setSelectedId(id);
  }, [viewParams]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, warrantyFilter, customerFromUrl]);

  const stats = useMemo(() => {
    if (!vehicles) return { total: 0, inStock: 0, delivered: 0, inService: 0 };
    return {
      total: vehicles.length,
      inStock: vehicles.filter((v) => v.vehicle_status === "In Stock").length,
      delivered: vehicles.filter((v) => v.vehicle_status === "Delivered to Customer").length,
      inService: vehicles.filter((v) => v.vehicle_status === "In Service").length,
    };
  }, [vehicles]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            {customerFromUrl
              ? `Vehicles for ${customerFromUrl}`
              : "Manage vehicle inventory (VIN records)"}
          </p>
        </div>
        <Button onClick={() => navigate("vehicle-new")}>
          <Plus className="h-4 w-4 mr-2" />
          New Vehicle
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Car className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
                <Car className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inStock}</p>
                <p className="text-xs text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                <Car className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
                <Car className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.inService}</p>
                <p className="text-xs text-muted-foreground">In Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by VIN, plate, model, customer..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {warrantyOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {customerFromUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("vehicles")}
              >
                Clear customer filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Inventory</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Failed to load vehicles
            </div>
          ) : vehicles && vehicles.length > 0 ? (
            <div className="dms-table-panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>VIN / Chassis</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Plate</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Odometer</TableHead>
                    <TableHead>Warranty</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map((v) => (
                    <TableRow key={v.name} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedId(v.name)}>
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm font-mono">
                            {v.vin_number}
                          </span>
                          {v.engine_number && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              Eng: {v.engine_number}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-medium text-sm">
                            {v.model_name || v.linked_item || "—"}
                          </span>
                          <div className="flex items-center gap-2 mt-0.5">
                            {v.model_year && (
                              <span className="text-xs text-muted-foreground">{v.model_year}</span>
                            )}
                            {v.fuel_type && (
                              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                                <Fuel className="h-2.5 w-2.5" />
                                {v.fuel_type}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {v.plate_number || "—"}
                      </TableCell>
                      <TableCell>
                        {v.customer_name ? (
                          <button
                            className="text-sm hover:text-primary hover:underline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("vehicles", { customer: v.current_customer! });
                            }}
                          >
                            {v.customer_name}
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-sm">No owner</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {v.current_odometer != null ? (
                          <span className="flex items-center gap-1 text-sm">
                            <Gauge className="h-3 w-3 text-muted-foreground" />
                            {v.current_odometer.toLocaleString()} {v.odometer_unit || "km"}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {v.warranty_status ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] gap-1 ${getWarrantyBadge(v.warranty_status)}`}
                          >
                            {v.warranty_status === "Active" && <Shield className="h-2.5 w-2.5" />}
                            {(v.warranty_status?.startsWith("Expired") || v.warranty_status === "Void") && (
                              <AlertTriangle className="h-2.5 w-2.5" />
                            )}
                            {v.warranty_status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {v.vehicle_status ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${getStatusBadge(v.vehicle_status)}`}
                          >
                            {v.vehicle_status}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Car className="h-12 w-12 mb-4 opacity-50" />
              <p>No vehicles found</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => navigate("vehicle-new")}
              >
                Register a new vehicle
              </Button>
            </div>
          )}
          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      {/* Detail slide-over */}
      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selectedVehicle?.vin_number || selectedId || ""}
        subtitle={selectedVehicle?.model_name ? `${selectedVehicle.model_name} ${selectedVehicle.model_year || ""}`.trim() : undefined}
        badge={selectedVehicle?.vehicle_status ? { label: selectedVehicle.vehicle_status } : undefined}
        isLoading={detailLoading}
        onOpenInDesk={() => window.open(`/app/vin-no/${selectedId}`, "_blank")}
      >
        {selectedVehicle && (
          <>
            <DetailSection title="Identification">
              <DetailRow label="VIN Number" value={selectedVehicle.vin_number} />
              <DetailRow label="Engine Number" value={selectedVehicle.engine_number} />
              <DetailRow label="Plate Number" value={selectedVehicle.plate_number} />
            </DetailSection>
            <DetailSection title="Specifications">
              <DetailRow label="Model" value={selectedVehicle.model_name} />
              <DetailRow label="Year" value={selectedVehicle.model_year} />
              <DetailRow label="Brand" value={selectedVehicle.brand} />
              <DetailRow label="Fuel Type" value={selectedVehicle.fuel_type} />
              <DetailRow label="Transmission" value={selectedVehicle.transmission} />
              <DetailRow label="Exterior Color" value={selectedVehicle.exterior_color} />
            </DetailSection>
            <DetailSection title="Ownership">
              <DetailRow label="Customer ID" value={selectedVehicle.current_customer} />
              <DetailRow label="Customer Name" value={selectedVehicle.customer_name} />
            </DetailSection>
            <DetailSection title="Status">
              <DetailRow label="Odometer" value={selectedVehicle.current_odometer != null ? `${selectedVehicle.current_odometer.toLocaleString()} km` : undefined} />
              <DetailRow label="Warranty Status" value={selectedVehicle.warranty_status} />
              <DetailRow label="Warranty End Date" value={selectedVehicle.warranty_end_date} />
              <DetailRow label="Vehicle Status" value={selectedVehicle.vehicle_status} />
            </DetailSection>
          </>
        )}
      </DetailSheet>
    </div>
  );
}
