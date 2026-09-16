"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Loader2, Plus } from "lucide-react";
import { LOAD_MORE_PAGE_SIZE } from "@/hooks/use-load-more";

/** Page sizes offered by every listing UI. */
export const DEFAULT_PAGE_SIZE_OPTIONS = [50, 100, 500, 2500];

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  pageSizeOptions?: number[];
  /** Rows currently rendered (current page + any rows appended by "Load more"). */
  loadedCount?: number;
  /** Enables the "Load more" button while more rows are available. */
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
}

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  loadedCount,
  onLoadMore,
  isLoadingMore = false,
}: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const windowSize = loadedCount ?? pageSize;
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min((page - 1) * pageSize + windowSize, totalItems);
  const showLoadMore =
    Boolean(onLoadMore) && pageSize >= LOAD_MORE_PAGE_SIZE && windowSize < totalItems;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Show</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => {
            onPageSizeChange(Number(v));
            onPageChange(1);
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>per page</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {totalItems > 0
            ? `${start}–${end} of ${totalItems}`
            : "No results"}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageSize < LOAD_MORE_PAGE_SIZE ? (
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              disabled={page >= totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}
          {showLoadMore ? (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              disabled={isLoadingMore}
              onClick={onLoadMore}
            >
              {isLoadingMore ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Load more
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
