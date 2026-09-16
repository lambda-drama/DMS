"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Page size at which listings switch from classic paging to "Load more".
 * Once a listing fetches this many rows it keeps appending the next window
 * instead of replacing the current one.
 */
export const LOAD_MORE_PAGE_SIZE = 2500;

export interface UseLoadMoreOptions<T> {
  /** Rows returned for the current page (the first window). */
  items: T[] | undefined;
  /** Total rows matching the active filters, as counted by the server. */
  total: number;
  /** Absolute server offset of the first row in `items`. */
  offset: number;
  /** Changing this string discards any accumulated rows (filters/page changed). */
  resetKey: string;
  /** Only accumulate when the listing is in load-more mode (page size >= 2500). */
  enabled: boolean;
  /** Fetch the next window. `offset` is the absolute server offset. */
  fetchMore: (offset: number, limit: number) => Promise<T[]>;
}

/**
 * Appends extra windows on top of the current page so the user can scroll
 * through more than one page of results without losing what is on screen.
 */
export function useLoadMore<T>({
  items,
  total,
  offset,
  resetKey,
  enabled,
  fetchMore,
}: UseLoadMoreOptions<T>) {
  const baseItems = items ?? [];
  const [state, setState] = useState<{ key: string; extra: T[] }>({
    key: resetKey,
    extra: [],
  });
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);

  // Derived state: when the query changes, drop rows accumulated for the old query.
  if (state.key !== resetKey) {
    setState({ key: resetKey, extra: [] });
  }
  const extra = state.key === resetKey ? state.extra : [];
  const loadedItems = extra.length > 0 ? [...baseItems, ...extra] : baseItems;

  const hasMore =
    enabled && baseItems.length > 0 && offset + loadedItems.length < total;

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setIsLoadingMore(true);
    try {
      const nextOffset = offset + loadedItems.length;
      const next = await fetchMore(nextOffset, LOAD_MORE_PAGE_SIZE);
      if (next.length > 0) {
        setState((prev) =>
          prev.key === resetKey ? { key: prev.key, extra: [...prev.extra, ...next] } : prev,
        );
      }
    } catch (err) {
      // Keep the list usable — the caller can retry with the button.
      console.error("[useLoadMore] Failed to load more rows", err);
    } finally {
      loadingRef.current = false;
      setIsLoadingMore(false);
    }
  }, [enabled, fetchMore, hasMore, loadedItems.length, offset, resetKey]);

  // A query change mid-flight must not leave the button stuck spinning.
  useEffect(() => {
    loadingRef.current = false;
    setIsLoadingMore(false);
  }, [resetKey]);

  return {
    items: loadedItems,
    loadedCount: loadedItems.length,
    hasMore,
    isLoadingMore,
    loadMore,
  };
}
