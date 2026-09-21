"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { PaginationControls } from "@/components/pagination-controls";
import { LOAD_MORE_PAGE_SIZE, useLoadMore } from "@/hooks/use-load-more";
import { usePersistedFilter } from "@/hooks/use-persisted-filter";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { ListRowActions } from "@/components/list-row-actions";
import { CreateVehicleModelDialog } from "@/components/vehicle-models/create-vehicle-model-dialog";
import { EditVehicleModelDialog } from "@/components/vehicle-models/edit-vehicle-model-dialog";
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
  Car,
  Loader2,
  Pencil,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
} from "lucide-react";
import * as mastersSvc from "@/services/masters";
import type { VehicleModelMaster } from "@/services/masters";
import { usePermissions } from "@/contexts/permissions-context";

type ActiveFilter = "active" | "all" | "inactive";

function isModelActive(row: VehicleModelMaster | null | undefined): boolean {
  if (!row) return false;
  return Number(row.is_active ?? 1) === 1;
}

function modelSubtitle(row: VehicleModelMaster | null | undefined): string | undefined {
  if (!row) return undefined;
  return [row.model_code, row.variant, row.model_year].filter(Boolean).join(" · ") || undefined;
}

export default function VehicleModelsPage() {
  const { canWrite } = usePermissions();
  const canToggleActive = canWrite("vehicle-models");
  const [search, setSearch] = usePersistedFilter("vehicle-models", "search", "");
  const [debounced, setDebounced] = useState(search);
  const [activeFilter, setActiveFilter] = usePersistedFilter<ActiveFilter>(
    "vehicle-models",
    "active_filter",
    "active"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<VehicleModelMaster | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, activeFilter]);

  const { data, isLoading, error, mutate } = useSWR(
    ["vehicle-models-master", debounced, activeFilter, page, pageSize],
    () =>
      mastersSvc.listVehicleModels({
        search: debounced || undefined,
        active_filter: activeFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
  );

  const { data: selected, isLoading: detailLoading, mutate: mutateDetail } = useSWR(
    selectedId ? ["vehicle-model", selectedId] : null,
    () => mastersSvc.getVehicleModel(selectedId!)
  );

  const total = data?.total || 0;
  const {
    items: rows,
    loadedCount,
    isLoadingMore,
    loadMore,
  } = useLoadMore<VehicleModelMaster>({
    items: data?.data,
    total,
    offset: (page - 1) * pageSize,
    resetKey: [debounced, activeFilter, page, pageSize].join("|"),
    enabled: pageSize >= LOAD_MORE_PAGE_SIZE,
    fetchMore: async (offset, limit) =>
      (
        await mastersSvc.listVehicleModels({
          search: debounced || undefined,
          active_filter: activeFilter,
          limit,
          offset,
        })
      ).data,
  });

  function openEdit(row: VehicleModelMaster) {
    setEditTarget({ ...row, name: (row.name || "").trim() });
    setEditOpen(true);
  }

  async function toggleActive(row: VehicleModelMaster) {
    const next = isModelActive(row) ? 0 : 1;
    setTogglingId(row.name);
    try {
      await mastersSvc.updateVehicleModel(row.name, { is_active: next });
      toast.success(next ? "Vehicle model enabled" : "Vehicle model disabled");
      void mutate();
      if (selectedId === row.name) void mutateDetail();
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
          <h1 className="dms-stat-value text-xl tracking-tight">Vehicle Models</h1>
          <p className="text-muted-foreground">
            Vehicle model masters — each model links to its own vehicle Item
          </p>
        </div>
        <PermittedCreateButton
          module="vehicle-models"
          label="New Vehicle Model"
          onClick={() => setCreateOpen(true)}
        />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search model name, code, variant…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs value={activeFilter} onValueChange={(v) => setActiveFilter(v as ActiveFilter)}>
              <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="py-8 text-center text-sm text-destructive">
              {(error as Error).message || "Failed to load vehicle models"}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Car className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No vehicle models found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Brand</TableHead>
                    <TableHead>Variant</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Fuel / Transmission</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.name}
                      className="cursor-pointer"
                      onClick={() => setSelectedId(row.name)}
                    >
                      <TableCell>
                        <div className="font-medium">{row.model_name || row.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.model_code || row.model || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.brand_label || row.brand || "—"}
                      </TableCell>
                      <TableCell className="text-sm">{row.variant || "—"}</TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {row.model_year || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {[row.fuel_type, row.transmission].filter(Boolean).join(" / ") || "—"}
                      </TableCell>
                      <TableCell>
                        {isModelActive(row) ? (
                          <Badge variant="secondary">Active</Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ListRowActions
                          doctype="Vehicle Model"
                          docName={row.name}
                          showPrint={false}
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 shrink-0"
                                disabled={togglingId === row.name}
                              >
                                {togglingId === row.name ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(row.name)}>
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(row)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              {canToggleActive ? (
                                <DropdownMenuItem
                                  className={
                                    isModelActive(row)
                                      ? "text-destructive focus:text-destructive"
                                      : undefined
                                  }
                                  onClick={() => void toggleActive(row)}
                                >
                                  {isModelActive(row) ? (
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
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={total}
            loadedCount={loadedCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onLoadMore={loadMore}
            isLoadingMore={isLoadingMore}
          />
        </CardContent>
      </Card>

      <DetailSheet
        open={Boolean(selectedId) && !editOpen}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.model_name || selectedId || "Vehicle Model"}
        subtitle={modelSubtitle(selected)}
        badge={
          selected
            ? isModelActive(selected)
              ? { label: "Active", variant: "secondary" }
              : { label: "Inactive", variant: "outline" }
            : undefined
        }
        footer={
          selected ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button className="w-full sm:w-auto" onClick={() => openEdit(selected)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
              {canToggleActive ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => void toggleActive(selected)}
                  disabled={togglingId === selected.name}
                >
                  {isModelActive(selected) ? "Disable" : "Enable"}
                </Button>
              ) : null}
            </div>
          ) : null
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : selected ? (
          <>
            <DetailSection title="Identification">
              <DetailRow label="Model name" value={selected.model_name} />
              <DetailRow label="Model code" value={selected.model_code} />
              <DetailRow label="Linked item" value={selected.model || selected.name} />
              <DetailRow label="Item group" value={selected.item_group} />
              <DetailRow label="Brand" value={selected.brand_label || selected.brand} />
            </DetailSection>
            <DetailSection title="Specification">
              <DetailRow label="Variant" value={selected.variant} />
              <DetailRow
                label="Model year"
                value={selected.model_year != null ? String(selected.model_year) : undefined}
              />
              <DetailRow label="Fuel type" value={selected.fuel_type} />
              <DetailRow label="Transmission" value={selected.transmission} />
              <DetailRow label="Drive type" value={selected.drive_type} />
              <DetailRow label="Engine code" value={selected.engine_code} />
            </DetailSection>
            <DetailSection title="Notes">
              <DetailRow label="Notes" value={selected.notes} />
            </DetailSection>
          </>
        ) : null}
      </DetailSheet>

      <CreateVehicleModelDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(name) => {
          void mutate();
          setSelectedId(name);
        }}
      />

      <EditVehicleModelDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        vehicleModel={
          editTarget && selected && selected.name === editTarget.name ? selected : editTarget
        }
        onUpdated={() => {
          void mutate();
          void mutateDetail();
        }}
      />
    </div>
  );
}
