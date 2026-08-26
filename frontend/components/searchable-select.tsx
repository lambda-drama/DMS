"use client";

import { useState, useRef, useEffect, useCallback, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, X, Loader2, Plus } from "lucide-react";

export interface SearchableSelectOption {
  value: string;
  label: string;
  description?: string;
}

/** Portaled dropdown marker — Dialog ignores outside clicks on this element. */
export const SEARCHABLE_SELECT_DROPDOWN_ATTR = "data-searchable-select-dropdown";

export function isSearchableSelectDropdownTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest(`[${SEARCHABLE_SELECT_DROPDOWN_ATTR}]`));
}

export interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  onSearchChange?: (search: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  /** Render dropdown in a portal (use inside modals / overflow containers). */
  portaled?: boolean;
  /** Opens create-new flow (e.g. from LinkWithCreate); shows + inside the field */
  onCreateNew?: () => void;
  /** Accessible label for the create button */
  createNewLabel?: string;
  /** Shown when `value` is set but not found in `options` (e.g. programmatic selection) */
  valueLabel?: string;
  /** Keep the list open after a pick (multi-select add). */
  keepOpenOnSelect?: boolean;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  onSearchChange,
  placeholder = "Search...",
  emptyMessage = "No results found",
  isLoading = false,
  disabled = false,
  className,
  portaled = false,
  onCreateNew,
  createNewLabel = "Create new",
  valueLabel,
  keepOpenOnSelect = false,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const closedDisplayLabel =
    selectedOption?.label || (value && valueLabel ? valueLabel : "");

  const filtered = search
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()) ||
          (o.description?.toLowerCase().includes(search.toLowerCase()) ?? false)
      )
    : options;

  const updateDropdownPosition = useCallback(() => {
    if (!portaled || !inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 200,
    });
  }, [portaled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (dropdownRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [search, open]);

  useEffect(() => {
    if (!open || !portaled) return;
    updateDropdownPosition();
    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);
    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [open, portaled, search, options.length, updateDropdownPosition]);

  const handleSearchChange = useCallback(
    (val: string) => {
      setSearch(val);
      onSearchChange?.(val);
    },
    [onSearchChange]
  );

  const selectOption = useCallback(
    (opt: SearchableSelectOption) => {
      onValueChange(opt.value);
      setSearch("");
      onSearchChange?.("");
      if (keepOpenOnSelect) {
        setOpen(true);
        requestAnimationFrame(() => {
          inputRef.current?.focus();
          updateDropdownPosition();
        });
        return;
      }
      setOpen(false);
    },
    [onValueChange, onSearchChange, keepOpenOnSelect, updateDropdownPosition]
  );

  const clear = useCallback(() => {
    onValueChange("");
    setSearch("");
    handleSearchChange("");
    setOpen(false);
    inputRef.current?.focus();
  }, [onValueChange, handleSearchChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectOption(filtered[highlightedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightedIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const showCreate = Boolean(onCreateNew) && !disabled;
  const inputPadRight = showCreate
    ? value
      ? "pr-[7.5rem] sm:pr-[5.25rem]"
      : "pr-24 sm:pr-20"
    : value
      ? "pr-24 sm:pr-16"
      : "pr-12 sm:pr-10";

  const dropdownPanel = (
    <div
      ref={dropdownRef}
      {...{ [SEARCHABLE_SELECT_DROPDOWN_ATTR]: "" }}
      className={cn(
        "rounded-md border border-(--dms-green)/30 bg-popover shadow-lg",
        portaled ? "pointer-events-auto" : "absolute z-50 mt-1 w-full"
      )}
      style={portaled ? dropdownStyle : undefined}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        ref={listRef}
        className="max-h-60 overflow-y-auto overscroll-contain p-1 touch-pan-y"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-4 text-center text-sm text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          filtered.map((option, idx) => (
            <button
              key={option.value}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                selectOption(option);
              }}
              className={cn(
                "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer",
                "hover:bg-dms-green-light hover:text-foreground",
                highlightedIndex === idx && "bg-dms-green-light",
                value === option.value && "font-medium text-dms-green"
              )}
            >
              <Check
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  value === option.value ? "opacity-100 text-dms-green" : "opacity-0"
                )}
              />
              <div className="flex flex-col items-start text-left min-w-0">
                <span className="truncate">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground truncate">
                    {option.description}
                  </span>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={closedDisplayLabel || placeholder}
          value={open ? search : closedDisplayLabel}
          onChange={(e) => {
            handleSearchChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (selectedOption && !keepOpenOnSelect) setSearch("");
            if (portaled) updateDropdownPosition();
          }}
          onClick={() => {
            if (!open) {
              setOpen(true);
              if (portaled) updateDropdownPosition();
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className={cn(
            inputPadRight,
            "transition-colors",
            !open && selectedOption && "text-foreground",
            open && "border-dms-green ring-1 ring-dms-green"
          )}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {value && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                clear();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground touch-manipulation sm:h-7 sm:w-7"
              tabIndex={-1}
              aria-label="Clear selection"
            >
              <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          )}
          {showCreate && (
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false);
                onCreateNew?.();
              }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-dms-green hover:text-dms-green touch-manipulation sm:h-7 sm:w-7"
              tabIndex={-1}
              aria-label={createNewLabel}
              title={createNewLabel}
            >
              <Plus className="h-4 w-4 stroke-[2.5] sm:h-3.5 sm:w-3.5" />
            </button>
          )}
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(!open);
              if (!open) inputRef.current?.focus();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted text-muted-foreground touch-manipulation sm:h-7 sm:w-7"
            tabIndex={-1}
            aria-label="Toggle options"
          >
            <ChevronsUpDown className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          </button>
        </div>
      </div>

      {open &&
        (portaled && typeof document !== "undefined"
          ? createPortal(dropdownPanel, document.body)
          : dropdownPanel)}
    </div>
  );
}
