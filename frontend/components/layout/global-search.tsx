'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calendar,
  Car,
  ClipboardCheck,
  FileText,
  HardHat,
  Loader2,
  Search,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';
import { globalSearch, type GlobalSearchGroup, type GlobalSearchResultItem } from '@/services/search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

const DOCTYPE_ICONS: Record<string, React.ElementType> = {
  'Service Appointment': Calendar,
  'DMS Job Card': Wrench,
  'Vehicle Inspection': ClipboardCheck,
  Customer: Users,
  'VIN No': Car,
  'Vehicle Delivery Note': Truck,
  'Sales Invoice': FileText,
  Technician: HardHat,
};

function groupIcon(label: string) {
  if (label.includes('Appointment')) return Calendar;
  if (label.includes('Job')) return Wrench;
  if (label.includes('Inspection')) return ClipboardCheck;
  if (label.includes('Customer')) return Users;
  if (label.includes('Vehicle')) return Car;
  if (label.includes('Deliver')) return Truck;
  if (label.includes('Invoice')) return FileText;
  if (label.includes('Technician')) return HardHat;
  return Search;
}

function ResultRow({
  item,
  onSelect,
}: {
  item: GlobalSearchResultItem;
  onSelect: (item: GlobalSearchResultItem) => void;
}) {
  const Icon = DOCTYPE_ICONS[item.doctype] || Search;
  return (
    <CommandItem
      value={`${item.doctype}-${item.name}-${item.title}`}
      onSelect={() => onSelect(item)}
      className="flex cursor-pointer items-start gap-3 py-2.5"
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.title}</p>
        {item.subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
        ) : null}
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">{item.doctype}</p>
      </div>
    </CommandItem>
  );
}

function SearchResults({
  groups,
  loading,
  query,
  onSelect,
}: {
  groups: GlobalSearchGroup[];
  loading: boolean;
  query: string;
  onSelect: (item: GlobalSearchResultItem) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Searching…
      </div>
    );
  }
  if (query.length < 2) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        Type at least 2 characters to search appointments, job cards, customers, vehicles…
      </p>
    );
  }
  if (groups.length === 0) {
    return <CommandEmpty>No results for &ldquo;{query}&rdquo;</CommandEmpty>;
  }
  return (
    <>
      {groups.map((group) => {
        const Icon = groupIcon(group.label);
        return (
          <CommandGroup
            key={group.label}
            heading={
              <span className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                {group.label}
              </span>
            }
          >
            {group.items.map((item) => (
              <ResultRow key={`${group.label}-${item.name}`} item={item} onSelect={onSelect} />
            ))}
          </CommandGroup>
        );
      })}
    </>
  );
}

export function GlobalSearch({ className }: { className?: string }) {
  const { navigate } = useNavigation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [groups, setGroups] = useState<GlobalSearchGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setGroups([]);
      setLoading(false);
      return;
    }
    const id = ++requestIdRef.current;
    setLoading(true);
    try {
      const res = await globalSearch(trimmed, 6);
      if (id === requestIdRef.current) {
        setGroups(res.groups || []);
      }
    } catch {
      if (id === requestIdRef.current) {
        setGroups([]);
      }
    } finally {
      if (id === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!open) return;
    debounceRef.current = setTimeout(() => runSearch(query), 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, runSearch]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleSelect = (item: GlobalSearchResultItem) => {
    setOpen(false);
    setQuery('');
    setGroups([]);
    navigate(item.view, item.params);
  };

  return (
    <>
      {/* Desktop inline trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'relative hidden h-9 w-full max-w-xs items-center rounded-md border border-input bg-muted/50 pl-9 pr-3 text-left text-sm text-muted-foreground md:flex lg:max-w-sm',
          className,
        )}
      >
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
        <span className="truncate">Search appointments, job cards…</span>
        <kbd className="pointer-events-none absolute right-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 lg:flex">
          ⌘K
        </kbd>
      </button>

      {/* Mobile */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Search"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Search DMS"
        description="Search across appointments, job cards, inspections, customers, and more"
        className="max-w-lg"
      >
        <Command shouldFilter={false} className="rounded-lg border-0">
          <CommandInput
            placeholder="Search by ID, customer, plate, VIN…"
            value={query}
            onValueChange={setQuery}
          />
          <CommandList className="max-h-[min(60vh,400px)]">
            <SearchResults
              groups={groups}
              loading={loading}
              query={query}
              onSelect={handleSelect}
            />
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
