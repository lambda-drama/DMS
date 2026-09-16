"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

const STORAGE_PREFIX = "dms:listFilters:";

function storageKeyFor(view: string, key: string) {
  return `${STORAGE_PREFIX}${view}:${key}`;
}

function readStored<T>(storageKey: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

/**
 * Listing filter state that survives a refresh.
 *
 * Works exactly like `useState`, but the value is restored from localStorage on
 * mount and saved on every change — so a choice such as "Inactive" on Vehicle
 * Services (or a status on Job Cards) is still applied after a reload.
 * Values equal to the fallback are removed, so "Clear filters" resets for good.
 */
export function usePersistedFilter<T>(
  view: string,
  key: string,
  fallback: T
): [T, Dispatch<SetStateAction<T>>] {
  const storageKey = storageKeyFor(view, key);
  const [value, setValue] = useState<T>(() => {
    const stored = readStored<T>(storageKey);
    return stored === undefined ? fallback : stored;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (JSON.stringify(value) === JSON.stringify(fallback)) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      }
    } catch {
      // Storage unavailable (private mode / quota) — filters just won't persist.
    }
  }, [storageKey, value, fallback]);

  return [value, setValue];
}
