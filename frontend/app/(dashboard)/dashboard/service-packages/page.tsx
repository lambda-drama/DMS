"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { PaginationControls } from "@/components/pagination-controls";
import { LOAD_MORE_PAGE_SIZE, useLoadMore } from "@/hooks/use-load-more";
import { usePersistedFilter } from "@/hooks/use-persisted-filter";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { ServicePackageDialog } from "@/components/service-packages/service-package-dialog";
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
  Package,
  Loader2,
  Pencil,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
  Trash2,
} from "lucide-react";
import * as mastersSvc from "@/services/masters";
import type { ServicePackageMaster } from "@/services/masters";
import { usePermissions } from "@/contexts/permissions-context";

type ActiveFilter = "active" | "all" | "inactive";

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

function packageTotal(row: ServicePackageMaster | null | undefined): number {
  if (!row) return 0;
  return (
    Number(row.total_amount) ||
    Number(row.after_discount) ||
    Number(row.before_discount) ||
    0
  );
}

function modelLabels(row: ServicePackageMaster | null | undefined): string[] {
  if (!row) return [];
  const entries = row.applicable_vehicle_models || [];
  const labels = entries
    .map((entry) => (typeof entry === "string" ? entry : entry?.vehicle_model))
    .filter((value): value is string => Boolean(value));
  if (labels.length === 0 && row.vehicle_model) return [row.vehicle_model];
  return labels;
}

function isPackageActive(row: ServicePackageMaster | null | undefined): boolean {
  if (!row) return false;
  return Number(row.is_active ?? 0) === 1;
}

export default function ServicePackagesPage() {
  const { canDelete, canWrite, canCreate } = usePermissions();
  const canToggleActive = canWrite("service-packages");
  const canRemove = canDelete("service-packages");
  const canAdd = canCreate("service-packages");
  const canEdit = canWrite("service-packages");

  const [search, setSearch] = usePersistedFilter("service-packages", "search", "");
  const [debounced, setDebounced] = useState(search);
  const [activeFilter, setActiveFilter] = usePersistedFilter<ActiveFilter>(
    "service-packages",
    "active_filter",
    "active"
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, activeFilter]);

  const { data, isLoading, error, mutate } = useSWR(
    ["service-packages-master", debounced, activeFilter, page, pageSize],
    () =>
      mastersSvc.listVehicleServicePackages({
        search: debounced || undefined,
        active_filter: activeFilter,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
  );

  const { data: selected, isLoading: detailLoading, mutate: mutateDetail } = useSWR(
    selectedId ? ["service-package", selectedId] : null,
    () => mastersSvc.getVehicleServicePackage(selectedId!)
  );

  const total = data?.total || 0;
  const { items: rows, loadedCount, isLoadingMore, loadMore } =
    useLoadMore<ServicePackageMaster>({
      items: data?.data,
      total,
      offset: (page - 1) * pageSize,
      resetKey: [debounced, activeFilter, page, pageSize].join("|"),
      enabled: pageSize >= LOAD_MORE_PAGE_SIZE,
      fetchMore: async (offset, limit) =>
        (
          await mastersSvc.listVehicleServicePackages({
            search: debounced || undefined,
            active_filter: activeFilter,
            limit,
            offset,
          })
        ).data,
    });

  function openCreate() {
    setEditTarget(null);
    setDialogOpen(true);
  }

  function openEdit(row: ServicePackageMaster) {
    setEditTarget(row.name);
    setDialogOpen(true);
  }

  async function toggleActive(row: ServicePackageMaster) {
    if (!canToggleActive) return;
    const next = isPackageActive(row) ? 0 : 1;
    setTogglingId(row.name);
    try {
      await mastersSvc.updateVehicleServicePackage(row.name, { is_active: next });
      toast.success(next ? "Service package enabled" : "Service package disabled");
      void mutate();
      if (selectedId === row.name) void mutateDetail();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete(row: ServicePackageMaster) {
    setDeletingId(row.name);
    try {
      await mastersSvc.deleteVehicleServicePackage(row.name);
      toast.success("Service package deleted");
      if (selectedId === row.name) setSelectedId(null);
      void mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete service package");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">Service Packages</h1>
          <p className="text-muted-foreground">
            Bundled labour operations, parts, and pricing per service interval
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PermittedCreateButton
            module="service-packages"
            label="New Service Package"
            onClick={openCreate}
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
                placeholder="Search package name, ID, description…"
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
            <p className="py-8 text-center text-sm text-destructive">
              {(error as Error).message || "Failed to load service packages"}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Package className="mb-2 h-10 w-10 opacity-40" />
              <p className="text-sm">No service packages found</p>
              {canAdd ? (
                <Button variant="outline" size="sm" className="mt-4" onClick={openCreate}>
                  Create the first package
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Package</TableHead>
                    <TableHead>Package ID</TableHead>
                    <TableHead>Vehicle Models</TableHead>
                    <TableHead>Interval</TableHead>
                    <TableHead className="text-right">Labour Hours</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[1%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, idx) => {
                    const models = modelLabels(row);
                    const busy = togglingId === row.name || deletingId === row.name;
                    return (
                      <TableRow
                        key={row.name || `row-${idx}`}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(row.name)}
                      >
                        <TableCell>
                          <div className="font-medium">{row.package_name || row.name}</div>
                          {row.description ? (
                            <div className="line-clamp-1 text-xs text-muted-foreground">
                              {row.description}
                            </div>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-sm">{row.package_id || "—"}</TableCell>
                        <TableCell className="text-sm">
                          {models.length === 0 ? (
                            "—"
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {models.slice(0, 3).map((model) => (
                                <Badge key={model} variant="outline" className="font-normal">
                                  {model}
                                </Badge>
                              ))}
                              {models.length > 3 ? (
                                <Badge variant="outline" className="font-normal">
                                  +{models.length - 3}
                                </Badge>
                              ) : null}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">
                          {row.interval_km ? `${row.interval_km} km` : "—"}
                          {row.interval_months ? ` / ${row.interval_months} mo` : ""}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {row.total_labor_hours != null
                            ? Number(row.total_labor_hours).toFixed(2)
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums">
                          {formatMoney(packageTotal(row))}
                        </TableCell>
                        <TableCell>
                          {isPackageActive(row) ? (
                            <Badge variant="secondary">Active</Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <ListRowActions
                            doctype="Vehicle Service Package"
                            docName={row.name}
                            showPrint={false}
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 shrink-0"
                                  disabled={busy}
                                >
                                  {busy ? (
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
                                {canEdit ? (
                                  <DropdownMenuItem onClick={() => openEdit(row)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                ) : null}
                                {canToggleActive ? (
                                  <DropdownMenuItem
                                    className={
                                      isPackageActive(row)
                                        ? "text-destructive focus:text-destructive"
                                        : undefined
                                    }
                                    onClick={() => void toggleActive(row)}
                                  >
                                    {isPackageActive(row) ? (
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
                                {canRemove ? (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => void handleDelete(row)}
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
            loadedCount={loadedCount}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onLoadMore={loadMore}
            isLoadingMore={isLoadingMore}
          />
        </CardContent>
      </Card>

      <DetailSheet
        open={Boolean(selectedId) && !dialogOpen}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.package_name || selectedId || "Service Package"}
        subtitle={selected?.package_id || selected?.name}
        badge={
          selected
            ? {
                label: isPackageActive(selected) ? "Active" : "Inactive",
                variant: isPackageActive(selected) ? "secondary" : "outline",
              }
            : undefined
        }
        footer={
          selected ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              {canToggleActive ? (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={() => void toggleActive(selected)}
                >
                  {isPackageActive(selected) ? "Disable" : "Enable"}
                </Button>
              ) : null}
              <Button
                className="w-full sm:w-auto"
                disabled={!canEdit}
                onClick={() => openEdit(selected)}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Button>
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
            <DetailSection title="Package">
              <DetailRow label="Name" value={selected.package_name} />
              <DetailRow label="Package ID" value={selected.package_id} />
              <DetailRow
                label="Status"
                value={isPackageActive(selected) ? "Active" : "Inactive"}
              />
              <DetailRow label="Description" value={selected.description} />
            </DetailSection>
            <DetailSection title="Applicability">
              <DetailRow
                label="Vehicle models"
                value={
                  modelLabels(selected).length ? (
                    <div className="flex flex-wrap gap-1 sm:justify-end">
                      {modelLabels(selected).map((model) => (
                        <Badge key={model} variant="outline" className="font-normal">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  ) : null
                }
              />
              <DetailRow
                label="Service interval"
                value={
                  [
                    selected.interval_km ? `${selected.interval_km} km` : null,
                    selected.interval_months ? `${selected.interval_months} months` : null,
                  ]
                    .filter(Boolean)
                    .join(" / ") || null
                }
              />
            </DetailSection>
            <DetailSection title="Labour Operations">
              {(selected.labor_operations || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No labour operations</p>
              ) : (
                (selected.labor_operations || []).map((row) => (
                  <DetailRow
                    key={`${row.labor_operation}-${row.operation_name}`}
                    label={row.operation_name || row.labor_operation}
                    value={`${Number(row.total_hours || 0).toFixed(2)} h`}
                  />
                ))
              )}
            </DetailSection>
            <DetailSection title="Included Parts">
              {(selected.parts_included || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No parts included</p>
              ) : (
                (selected.parts_included || []).map((row) => (
                  <DetailRow
                    key={row.part_item}
                    label={row.part_name || row.part_item}
                    value={`${row.quantity ?? 1} × ${formatMoney(row.unit_price)}`}
                  />
                ))
              )}
            </DetailSection>
            <DetailSection title="Pricing">
              <DetailRow label="Before discount" value={formatMoney(selected.before_discount)} />
              <DetailRow label="After discount" value={formatMoney(selected.after_discount)} />
              <DetailRow
                label="Labour discount"
                value={formatMoney(selected.labour_discount_amount)}
              />
              <DetailRow label="Total" value={formatMoney(packageTotal(selected))} />
            </DetailSection>
          </>
        ) : null}
      </DetailSheet>

      <ServicePackageDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditTarget(null);
        }}
        packageName={editTarget}
        onSaved={() => {
          void mutate();
          if (selectedId) void mutateDetail();
        }}
      />
    </div>
  );
}
