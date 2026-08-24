"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { PaginationControls } from "@/components/pagination-controls";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { EditItemPriceDialog } from "@/components/item-prices/edit-item-price-dialog";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { ListRowActions } from "@/components/list-row-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  Banknote,
  Loader2,
  Pencil,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import * as mastersSvc from "@/services/masters";
import type { ItemPriceMaster } from "@/services/masters";

function formatMoney(n?: number | null) {
  if (n == null || Number.isNaN(Number(n))) return "—";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n));
}

export default function ItemPricesPage() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemPriceMaster | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(search.trim()), 250);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debounced]);

  const { data, isLoading, error, mutate } = useSWR(
    ["item-prices-master", debounced, page, pageSize],
    () =>
      mastersSvc.listItemPrices({
        search: debounced || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
  );

  const { data: selected, isLoading: detailLoading, mutate: mutateDetail } = useSWR(
    selectedId ? ["item-price", selectedId] : null,
    () => mastersSvc.getItemPrice(selectedId!)
  );

  const rows = data?.data || [];
  const total = data?.total || 0;

  function openEdit(row: ItemPriceMaster) {
    setSelectedId(row.name);
    setEditTarget(row);
    setEditOpen(true);
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="dms-stat-value text-xl tracking-tight">Item Prices</h1>
          <p className="text-muted-foreground">
            Selling prices for items in vehicle or after-sales spare part groups
            {data?.default_price_list ? ` · ${data.default_price_list}` : ""}
          </p>
        </div>
        <PermittedCreateButton
          module="item-prices"
          label="New Item Price"
          onClick={() => setCreateOpen(true)}
        />
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search item code…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive py-8 text-center">
              {(error as Error).message || "Failed to load item prices"}
            </p>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-muted-foreground">
              <Banknote className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm">No item prices found</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Price list</TableHead>
                    <TableHead>UOM</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead>Valid</TableHead>
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
                        <div className="font-medium">{row.item_code}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.item_name || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{row.price_list || "—"}</TableCell>
                      <TableCell className="text-sm">{row.uom || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatMoney(row.price_list_rate)}
                        {row.currency ? (
                          <span className="text-xs text-muted-foreground ml-1">
                            {row.currency}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {row.valid_from || row.valid_upto
                          ? `${row.valid_from || "…"} → ${row.valid_upto || "…"}`
                          : "—"}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ListRowActions doctype="Item Price" docName={row.name} showPrint={false}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                                <MoreHorizontal className="h-4 w-4" />
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
        title={selected?.item_code || selectedId || "Item Price"}
        subtitle={selected?.price_list || undefined}
        footer={
          <Button
            className="w-full sm:w-auto"
            onClick={() => openEdit(selected || editTarget || { name: selectedId! })}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Button>
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : selected ? (
          <DetailSection title="Price">
            <DetailRow label="Item" value={selected.item_code} />
            <DetailRow label="Item name" value={selected.item_name} />
            <DetailRow label="Price list" value={selected.price_list} />
            <DetailRow label="Rate" value={formatMoney(selected.price_list_rate)} />
            <DetailRow label="Currency" value={selected.currency} />
            <DetailRow label="UOM" value={selected.uom} />
            <DetailRow label="Valid from" value={selected.valid_from} />
            <DetailRow label="Valid upto" value={selected.valid_upto} />
          </DetailSection>
        ) : null}
      </DetailSheet>

      <EditItemPriceDialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        itemPrice={
          editTarget && selected && selected.name === editTarget.name
            ? selected
            : editTarget || selected || null
        }
        onUpdated={() => {
          void mutate();
          void mutateDetail();
        }}
      />

      <EditItemPriceDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        itemPrice={null}
        createMode
        onUpdated={() => {
          void mutate();
        }}
      />
    </div>
  );
}
