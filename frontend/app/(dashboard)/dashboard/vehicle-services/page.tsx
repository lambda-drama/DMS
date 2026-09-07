"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { PaginationControls } from "@/components/pagination-controls";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { EditServiceItemDialog } from "@/components/services/edit-service-item-dialog";
import { AddServiceItemModelDialog } from "@/components/services/add-service-item-model-dialog";
import { CreateServiceItemDialog } from "@/components/create-service-item-dialog";
import { ImportServiceItemsButton } from "@/components/services/import-service-items-button";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { ListRowActions } from "@/components/list-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Wrench,
  Loader2,
  Pencil,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
  Plus,
} from "lucide-react";
import * as mastersSvc from "@/services/masters";
import type { VehicleServiceItemMaster } from "@/services/masters";
import { usePermissions } from "@/contexts/permissions-context";

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

type ActiveFilter = "active" | "all" | "inactive";

function serviceItemId(row: VehicleServiceItemMaster | null | undefined): string {
  if (!row) return "";
  return (
    (row.name || "").trim() ||
    (row.custom_service_code || "").trim() ||
    (row.custom_erpnext_item || "").trim() ||
    (row.service_item || "").trim()
  );
}

function isServiceActive(row: VehicleServiceItemMaster | null | undefined): boolean {
  if (!row) return false;
  if (row.custom_active != null) return Number(row.custom_active) === 1;
  return !row.disabled;
}

export default function VehicleServicesPage() {
  const { canCreate, canWrite } = usePermissions();
  const canAddModel = canCreate("vehicle-services");
  const canToggleActive = canWrite("vehicle-services");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("active");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VehicleServiceItemMaster | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [addModelOpen, setAddModelOpen] = useState(false);
  const [addModelTarget, setAddModelTarget] = useState<VehicleServiceItemMaster | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, activeFilter]);

  const { data, isLoading, error, mutate } = useSWR(
    ["vehicle-service-items-master", debounced, activeFilter, page, pageSize],
    () =>
      mastersSvc.listVehicleServiceItems({
        search: debounced || undefined,
        active_filter: activeFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
  );

  const { data: selected, isLoading: detailLoading, mutate: mutateDetail } = useSWR(
    selectedId ? ["vehicle-service-item", selectedId] : null,
    () => mastersSvc.getVehicleServiceItem(selectedId!)
  );

  const rows = data?.data || [];
  const total = data?.total || 0;

  function openEdit(row: VehicleServiceItemMaster) {
    const id = serviceItemId(row);
    setSelectedId(id || null);
    setEditTarget({ ...row, name: id || row.name });
    setEditOpen(true);
  }

  function openAddModel(row: VehicleServiceItemMaster) {
    const id = serviceItemId(row);
    setAddModelTarget({ ...row, name: id || row.name });
    setAddModelOpen(true);
  }

  async function toggleActive(row: VehicleServiceItemMaster) {
    if (!canToggleActive) return;
    const id = serviceItemId(row);
    if (!id) {
      toast.error("Cannot identify this service item");
      return;
    }
    const next = isServiceActive(row) ? 0 : 1;
    setTogglingId(id);
    try {
      await mastersSvc.updateVehicleServiceItem(id, { custom_active: next });
      toast.success(next ? "Service enabled" : "Service disabled");
      void mutate();
      if (selectedId === id) void mutateDetail();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">Services</h1>
          <p className="text-muted-foreground">Vehicle service / labour item masters</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportServiceItemsButton onImported={() => void mutate()} />
          <PermittedCreateButton
            module="vehicle-services"
            label="New Service Item"
            onClick={() => setCreateOpen(true)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search service name, code, FRT…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs
              value={activeFilter}
              onValueChange={(value) => setActiveFilter(value as ActiveFilter)}
              className="w-full sm:w-auto"
            >
              <TabsList className="w-full sm:w-auto">
                <TabsTrigger value="active" className="flex-1 sm:flex-none">
                  Active
                </TabsTrigger>
                <TabsTrigger value="all" className="flex-1 sm:flex-none">
                  All
                </TabsTrigger>
                <TabsTrigger value="inactive" className="flex-1 sm:flex-none">
                  Inactive
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive py-8 text-center">
              {(error as Error).message || "Failed to load service items"}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Wrench className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No service items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[1%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => {
                    const id = serviceItemId(row) || `row-${idx}`;
                    return (
                      <TableRow
                        key={id}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(serviceItemId(row) || null)}
                      >
                        <TableCell>
                          <div className="font-medium">
                            {row.service_item || row.custom_item_name || row.name}
                          </div>
                          {row.custom_erpnext_item ? (
                            <div className="text-xs text-muted-foreground">
                              {row.custom_erpnext_item}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.custom_service_code || row.custom_frt || "—"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {row.custom_vehicle_model || "—"}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {row.custom_estimated_timehours ?? "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatMoney(row.custom_rate)}
                        </TableCell>
                        <TableCell>
                          {isServiceActive(row) ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <ListRowActions
                            doctype="Vehicle Service Item"
                            docName={serviceItemId(row)}
                            showPrint={false}
                          >
                            {canAddModel ? (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8"
                                onClick={() => openAddModel(row)}
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add Model
                              </Button>
                            ) : null}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  disabled={togglingId === serviceItemId(row)}
                                >
                                  {togglingId === serviceItemId(row) ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreHorizontal className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setSelectedId(serviceItemId(row) || null)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                {canAddModel ? (
                                  <DropdownMenuItem onClick={() => openAddModel(row)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Model
                                  </DropdownMenuItem>
                                ) : null}
                                <DropdownMenuItem onClick={() => openEdit(row)}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                {canToggleActive ? (
                                <DropdownMenuItem
                                  className={
                                    isServiceActive(row)
                                      ? "text-destructive focus:text-destructive"
                                      : undefined
                                  }
                                  onClick={() => void toggleActive(row)}
                                >
                                  {isServiceActive(row) ? (
                                    <>
                                      <Ban className="mr-2 h-4 w-4" />
                                      Disable
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Enable
                                    </>
                                  )}
                                </DropdownMenuItem>
                                ) : null}
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
          )}

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <DetailSheet
        open={Boolean(selectedId) && !editOpen}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.service_item || selectedId || "Service Item"}
        subtitle={selected?.custom_service_code || selected?.name}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {canAddModel && (selected || editTarget) ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => openAddModel(selected || editTarget!)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Model
              </Button>
            ) : null}
            <Button
              className="w-full sm:w-auto"
              onClick={() =>
                openEdit(selected || editTarget || { name: selectedId || "" })
              }
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {canToggleActive && (selected || editTarget) ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void toggleActive(selected || editTarget!)}
              >
                {isServiceActive(selected || editTarget) ? "Disable" : "Enable"}
              </Button>
            ) : null}
          </div>
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : selected ? (
          <>
            <DetailSection title="Service">
              <DetailRow label="Name" value={selected.service_item} />
              <DetailRow label="Code" value={selected.custom_service_code} />
              <DetailRow label="Linked Item" value={selected.custom_erpnext_item} />
              <DetailRow
                label="Status"
                value={isServiceActive(selected) ? "Active" : "Inactive"}
              />
            </DetailSection>
            <DetailSection title="Classification">
              <DetailRow label="Vehicle model" value={selected.custom_vehicle_model} />
              <DetailRow label="Category" value={selected.custom_category} />
              <DetailRow label="FRT" value={selected.custom_frt} />
              <DetailRow
                label="Cat / Sub"
                value={
                  [selected.custom_cat_code, selected.custom_sub_code]
                    .filter(Boolean)
                    .join(" / ") || undefined
                }
              />
            </DetailSection>
            <DetailSection title="Pricing">
              <DetailRow
                label="Hours"
                value={
                  selected.custom_estimated_timehours != null
                    ? String(selected.custom_estimated_timehours)
                    : undefined
                }
              />
              <DetailRow label="Rate" value={formatMoney(selected.custom_rate)} />
              <DetailRow
                label="Item price"
                value={
                  selected.item_price
                    ? `${formatMoney(selected.item_price.price_list_rate)} (${selected.item_price.price_list})`
                    : undefined
                }
              />
            </DetailSection>
            <DetailSection title="Description">
              <DetailRow label="Notes" value={selected.custom_description} />
            </DetailSection>
          </>
        ) : null}
      </DetailSheet>

      <EditServiceItemDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        serviceItem={
          editTarget && selected && selected.name === editTarget.name
            ? selected
            : editTarget || selected || null
        }
        onUpdated={() => {
          void mutate();
          void mutateDetail();
        }}
      />

      <AddServiceItemModelDialog
        open={addModelOpen}
        onOpenChange={(open) => {
          setAddModelOpen(open);
          if (!open) setAddModelTarget(null);
        }}
        serviceItem={
          addModelTarget && selected && selected.name === addModelTarget.name
            ? selected
            : addModelTarget
        }
        onCreated={() => {
          void mutate();
          void mutateDetail();
        }}
      />

      <CreateServiceItemDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void mutate();
        }}
      />
    </div>
  );
}
