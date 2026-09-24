"use client";

import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { useNavigation } from "@/contexts/navigation-context";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { useVehicles, useVehicle } from "@/hooks/use-dms";
import { usePermissions } from "@/contexts/permissions-context";
import { PaginationControls } from "@/components/pagination-controls";
import { LOAD_MORE_PAGE_SIZE, useLoadMore } from "@/hooks/use-load-more";
import { usePersistedFilter } from "@/hooks/use-persisted-filter";
import * as vehiclesSvc from "@/services/vehicles";
import type { VINNoListItem } from "@/types/dms";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { EditVehicleDialog } from "@/components/vehicles/edit-vehicle-dialog";
import { ListRowActions } from "@/components/list-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Search,
  Car,
  Shield,
  AlertTriangle,
  Gauge,
  Loader2,
  Filter,
  Fuel,
  Pencil,
  Building2,
  MoreHorizontal,
  Eye,
  ExternalLink,
  Trash2,
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
  { value: "Inactive", label: "Inactive (expired)" },
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
    Inactive: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    "Expired by Time": "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    "Expired by Mileage": "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300",
    Void: "bg-muted text-muted-foreground",
    "Pending Verification": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  };
  return m[status || ""] || "";
}

export default function VehiclesPage() {
  const { navigate, viewParams } = useNavigation();
  const { canWrite, canDelete } = usePermissions();
  const customerFromUrl = viewParams.get("customer");
  const [search, setSearch] = usePersistedFilter("vehicles", "search", "");
  const [statusFilter, setStatusFilter] = usePersistedFilter("vehicles", "status", "all");
  const [warrantyFilter, setWarrantyFilter] = usePersistedFilter("vehicles", "warranty", "all");
  const [otherCompanies, setOtherCompanies] = usePersistedFilter("vehicles", "other_companies", "0");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  // Row-level edit: the slide-over stays closed and the full VIN record is loaded by name.
  const [editRowId, setEditRowId] = useState<string | null>(null);
  // Vehicle queued for deletion (row action or slide-over footer).
  const [deleteTarget, setDeleteTarget] = useState<{ name: string; vin_number?: string } | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);

  // "Show other companies" — vehicles belonging to companies outside DMS Settings.
  const includeOtherCompanies = otherCompanies === "1";

  const activeVehicleId = selectedId ?? editRowId;
  const {
    data: selectedVehicle,
    isLoading: detailLoading,
    error: vehicleError,
    mutate: mutateVehicle,
  } = useVehicle(activeVehicleId);

  // Open the edit dialog only once the full record has loaded, so every field
  // (interior colour, warranty dates, notes) is pre-filled when it appears.
  useEffect(() => {
    if (!editRowId || selectedVehicle?.name !== editRowId) return;
    setEditOpen(true);
  }, [editRowId, selectedVehicle]);

  useEffect(() => {
    if (!editRowId || !vehicleError) return;
    toast.error("Could not load this vehicle for editing");
    setEditRowId(null);
  }, [editRowId, vehicleError]);

  const listFilters = {
    customer: customerFromUrl || undefined,
    search: search || undefined,
    vehicle_status: statusFilter !== "all" ? statusFilter : undefined,
    warranty_status: warrantyFilter !== "all" ? warrantyFilter : undefined,
    include_other_companies: includeOtherCompanies ? 1 : 0,
  };

  const { data: result, isLoading, error, mutate: mutateVehicles } = useVehicles({
    ...listFilters,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const totalItems = result?.total || 0;
  const {
    items: vehicles,
    loadedCount,
    isLoadingMore,
    loadMore,
  } = useLoadMore<VINNoListItem>({
    items: result?.data,
    total: totalItems,
    offset: (page - 1) * pageSize,
    resetKey: [search, statusFilter, warrantyFilter, customerFromUrl ?? "", otherCompanies, page, pageSize].join("|"),
    enabled: pageSize >= LOAD_MORE_PAGE_SIZE,
    fetchMore: async (offset, limit) =>
      (await vehiclesSvc.listVehicles({ ...listFilters, limit, offset })).data,
  });

  useEffect(() => {
    const id = viewParams.get("id");
    if (id) setSelectedId(id);
  }, [viewParams]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, warrantyFilter, customerFromUrl, otherCompanies]);

  function openEditFromRow(row: VINNoListItem) {
    // Close the slide-over when a different vehicle is being edited from the list,
    // so the dialog always loads the row that was clicked.
    setSelectedId((prev) => (prev && prev !== row.name ? null : prev));
    setEditRowId(row.name);
  }

  function requestDeleteVehicle(name: string, vinNumber?: string) {
    setDeleteTarget({ name, vin_number: vinNumber });
  }

  async function handleDeleteVehicle() {
    if (!deleteTarget) return;
    const { name } = deleteTarget;
    setDeleting(true);
    try {
      await vehiclesSvc.deleteVehicle(name);
      toast.success("Vehicle deleted");
      setSelectedId((prev) => (prev === name ? null : prev));
      setEditRowId((prev) => (prev === name ? null : prev));
      setDeleteTarget(null);
      void mutateVehicles();
    } catch (err: unknown) {
      // Documents that still reference the vehicle (estimates, job cards, …) block
      // the delete; Frappe names them in the message.
      toast.error(err instanceof Error ? err.message : "Failed to delete vehicle");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

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
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="dms-stat-value text-xl tracking-tight">Vehicles</h1>
          <p
            className={
              customerFromUrl
                ? "text-muted-foreground"
                : "mt-1 hidden text-muted-foreground sm:block"
            }
          >
            {customerFromUrl
              ? `Vehicles for ${customerFromUrl}`
              : "Manage vehicle inventory (VIN records)"}
          </p>
        </div>
        <PermittedCreateButton
          module="vehicles"
          label="New Vehicle"
          onClick={() => navigate("vehicle-new")}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-1.5">
                <Car className="h-3.5 w-3.5 text-primary" />
              </div>
              <div>
                <p className="dms-stat-value text-xl">{stats.total}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Total Vehicles</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-1.5 dark:bg-blue-900/30">
                <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="dms-stat-value text-xl">{stats.inStock}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">In Stock</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-green-100 p-1.5 dark:bg-green-900/30">
                <Car className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="dms-stat-value text-xl">{stats.delivered}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="dms-kpi-card">
          <CardContent className="px-3.5 py-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-1.5 dark:bg-amber-900/30">
                <Car className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="dms-stat-value text-xl">{stats.inService}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">In Service</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="dms-toolbar-card">
        <CardContent className="px-3.5 py-3">
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
            {canWrite("vehicles") ? (
              <Button
                variant={includeOtherCompanies ? "default" : "outline"}
                className="gap-2"
                onClick={() => setOtherCompanies(includeOtherCompanies ? "0" : "1")}
                title="Include vehicles whose company is not selected in DMS Settings"
              >
                <Building2 className="h-4 w-4 shrink-0" />
                {includeOtherCompanies ? "Showing other companies" : "Show other companies"}
              </Button>
            ) : null}
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
                    {includeOtherCompanies ? <TableHead>Company</TableHead> : null}
                    <TableHead className="w-[1%] text-right">Actions</TableHead>
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
                            {(v.warranty_status === "Inactive" ||
                              v.warranty_status?.startsWith("Expired") ||
                              v.warranty_status === "Void") && (
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
                      {includeOtherCompanies ? (
                        <TableCell className="text-muted-foreground text-xs">
                          <span
                            className="block max-w-[160px] truncate"
                            title={v.company || undefined}
                          >
                            {v.company || "—"}
                          </span>
                        </TableCell>
                      ) : null}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ListRowActions doctype="VIN No" docName={v.name}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Actions</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(v.name)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              {canWrite("vehicles") ? (
                                <DropdownMenuItem onClick={() => openEditFromRow(v)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit Vehicle
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                onClick={() => window.open(`/app/vin-no/${v.name}`, "_blank")}
                              >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Open in Desk
                              </DropdownMenuItem>
                              {canDelete("vehicles") ? (
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => requestDeleteVehicle(v.name, v.vin_number)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </ListRowActions>
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
            loadedCount={loadedCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onLoadMore={loadMore}
            isLoadingMore={isLoadingMore}
          />
        </CardContent>
      </Card>

      {/* Detail slide-over */}
      <DetailSheet
        open={!!selectedId && !editOpen}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selectedVehicle?.vin_number || selectedId || ""}
        subtitle={selectedVehicle?.model_name ? `${selectedVehicle.model_name} ${selectedVehicle.model_year || ""}`.trim() : undefined}
        badge={selectedVehicle?.vehicle_status ? { label: selectedVehicle.vehicle_status } : undefined}
        isLoading={detailLoading}
        onOpenInDesk={() => window.open(`/app/vin-no/${selectedId}`, "_blank")}
        footer={
          selectedVehicle &&
          (canWrite("vehicles") || canDelete("vehicles")) ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {canDelete("vehicles") ? (
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive sm:w-auto"
                  onClick={() =>
                    requestDeleteVehicle(selectedVehicle.name, selectedVehicle.vin_number)
                  }
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Vehicle
                </Button>
              ) : null}
              {canWrite("vehicles") ? (
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => setEditOpen(true)}
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Vehicle
                </Button>
              ) : null}
            </div>
          ) : null
        }
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
              <DetailRow label="Mobile" value={selectedVehicle.owner_mobile} />
              <DetailRow label="Email" value={selectedVehicle.owner_email} />
              <DetailRow label="TIN No" value={selectedVehicle.owner_tax_id} />
              {(selectedVehicle.customer_history?.length ?? 0) > 0 && (
                <div className="mt-2 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Previous customers</p>
                  {selectedVehicle.customer_history
                    ?.filter((r) => !r.is_current)
                    .map((r) => (
                      <div
                        key={r.name || `${r.customer}-${r.from_date}`}
                        className="rounded-md border px-3 py-2 text-sm"
                      >
                        <p className="font-medium">{r.customer_name || r.customer}</p>
                        <p className="text-muted-foreground">
                          {[r.mobile_no, r.from_date && `from ${r.from_date}`, r.to_date && `to ${r.to_date}`]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      </div>
                    ))}
                </div>
              )}
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

      <EditVehicleDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditRowId(null);
        }}
        vehicle={selectedVehicle || null}
        onUpdated={() => {
          void mutateVehicle();
        }}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete vehicle</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <strong>{deleteTarget?.vin_number || deleteTarget?.name}</strong>? The VIN
              record is removed permanently. Documents that still reference it — service estimates,
              job cards, appointments, invoices — must be deleted first.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep vehicle</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                void handleDeleteVehicle();
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting…
                </>
              ) : (
                "Delete vehicle"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
