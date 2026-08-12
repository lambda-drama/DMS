"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { toast } from "sonner";
import { PaginationControls } from "@/components/pagination-controls";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { EditSparePartDialog } from "@/components/spare-parts/edit-spare-part-dialog";
import { CreateSparePartDialog } from "@/components/create-spare-part-dialog";
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
import {
  Search,
  Package,
  Loader2,
  Pencil,
  MoreHorizontal,
  Eye,
  Ban,
  CheckCircle2,
} from "lucide-react";
import * as mastersSvc from "@/services/masters";
import type { SparePartMaster } from "@/services/masters";

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

export default function SparePartsPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SparePartMaster | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [includeDiscontinued, setIncludeDiscontinued] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced, includeDiscontinued]);

  const { data, isLoading, error, mutate } = useSWR(
    ["spare-parts-master", debounced, includeDiscontinued, page, pageSize],
    () =>
      mastersSvc.listSpareParts({
        search: debounced || undefined,
        include_discontinued: includeDiscontinued,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
  );

  const { data: selected, isLoading: detailLoading, mutate: mutateDetail } = useSWR(
    selectedId ? ["spare-part", selectedId] : null,
    () => mastersSvc.getSparePart(selectedId!)
  );

  const rows = data?.data || [];
  const total = data?.total || 0;

  function openEdit(row: SparePartMaster) {
    const id =
      (row.name || "").trim() ||
      (row.oem_part_number || "").trim() ||
      (row.spare_part_item || "").trim() ||
      (row.item_code || "").trim();
    setSelectedId(id || null);
    setEditTarget({ ...row, name: id || row.name });
    setEditOpen(true);
  }

  async function toggleDiscontinued(row: SparePartMaster) {
    const next = row.discontinued ? 0 : 1;
    setTogglingId(row.name);
    try {
      await mastersSvc.updateSparePart(row.name, { discontinued: next });
      toast.success(next ? "Spare part disabled" : "Spare part enabled");
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
          <h1 className="dms-stat-value text-xl tracking-tight">Spare Parts</h1>
          <p className="text-muted-foreground">Item / spare part masters and selling prices</p>
        </div>
        <PermittedCreateButton
          module="spare-parts"
          label="New Spare Part"
          onClick={() => setCreateOpen(true)}
        />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search code, name, OEM#, bin…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeDiscontinued}
                onChange={(e) => setIncludeDiscontinued(e.target.checked)}
                className="rounded border"
              />
              Include discontinued
            </label>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive py-8 text-center">
              {(error as Error).message || "Failed to load spare parts"}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Package className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No spare parts found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>OEM #</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Bin</TableHead>
                    <TableHead className="text-right">Selling</TableHead>
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
                        <div className="font-medium">{row.item_code || row.spare_part_item}</div>
                        <div className="text-xs text-muted-foreground">{row.item_name}</div>
                      </TableCell>
                      <TableCell className="text-sm">{row.oem_part_number || "—"}</TableCell>
                      <TableCell className="text-sm">{row.part_category || "—"}</TableCell>
                      <TableCell className="text-sm">{row.bin_location || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.selling_price)}
                      </TableCell>
                      <TableCell>
                        {row.discontinued ? (
                          <Badge variant="outline" className="text-muted-foreground">
                            Disabled
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ListRowActions doctype="Spare Part" docName={row.name || row.oem_part_number || ""} showPrint={false}>
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
                              <DropdownMenuItem
                                className={
                                  row.discontinued
                                    ? undefined
                                    : "text-destructive focus:text-destructive"
                                }
                                onClick={() => void toggleDiscontinued(row)}
                              >
                                {row.discontinued ? (
                                  <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Enable
                                  </>
                                ) : (
                                  <>
                                    <Ban className="mr-2 h-4 w-4" />
                                    Disable
                                  </>
                                )}
                              </DropdownMenuItem>
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
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <DetailSheet
        open={Boolean(selectedId) && !editOpen}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.item_name || selected?.item_code || selectedId || "Spare Part"}
        subtitle={selected?.item_code || selected?.spare_part_item || undefined}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              className="w-full sm:w-auto"
              onClick={() => openEdit(selected || editTarget || { name: selectedId! })}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
            {selected ? (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void toggleDiscontinued(selected)}
              >
                {selected.discontinued ? "Enable" : "Disable"}
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
            <DetailSection title="Identification">
              <DetailRow label="Item code" value={selected.item_code || selected.spare_part_item} />
              <DetailRow label="OEM part #" value={selected.oem_part_number} />
              <DetailRow label="Manufacturer #" value={selected.manufacturer_part_number} />
              <DetailRow label="Barcode" value={selected.barcode} />
            </DetailSection>
            <DetailSection title="Classification">
              <DetailRow label="Category" value={selected.part_category} />
              <DetailRow label="Type" value={selected.part_type} />
              <DetailRow label="Bin" value={selected.bin_location} />
            </DetailSection>
            <DetailSection title="Pricing">
              <DetailRow label="Selling price" value={formatMoney(selected.selling_price)} />
              <DetailRow label="Wholesale" value={formatMoney(selected.wholesale_price)} />
              <DetailRow
                label="Item price"
                value={
                  selected.item_price
                    ? `${formatMoney(selected.item_price.price_list_rate)} (${selected.item_price.price_list})`
                    : undefined
                }
              />
            </DetailSection>
            <DetailSection title="Stock">
              <DetailRow label="Min stock" value={selected.minimum_stock_level?.toString()} />
              <DetailRow label="Reorder qty" value={selected.reorder_quantity?.toString()} />
            </DetailSection>
          </>
        ) : null}
      </DetailSheet>

      <EditSparePartDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        sparePart={
          editTarget && selected && selected.name === editTarget.name
            ? selected
            : editTarget || selected || null
        }
        onUpdated={() => {
          void mutate();
          void mutateDetail();
        }}
      />

      <CreateSparePartDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          void mutate();
        }}
      />
    </div>
  );
}
