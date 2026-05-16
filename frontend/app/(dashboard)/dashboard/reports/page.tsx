'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { SearchableSelect } from '@/components/searchable-select';
import { ReportViewer } from '@/components/reports/report-viewer';
import { useNavigation } from '@/contexts/navigation-context';
import * as reportsSvc from '@/services/reports';
import { PRINTABLE_DOCUMENTS } from '@/services/reports';
import type { ReportMeta, ReportResult } from '@/services/reports';
import { fetchVINs } from '@/services/common';
import type { VINNo } from '@/types/dms';
import { BarChart3, ChevronDown, Download, FileText, Filter, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function vinOptionLabel(v: VINNo) {
  const plate = v.plate_number ? ` · ${v.plate_number}` : '';
  const model = v.model_name ? `${v.model_name}${plate}` : v.plate_number || v.name;
  return model;
}

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().split('T')[0];
}

function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function exportReportCsv(result: ReportResult) {
  const keys = result.columns.map((c) => c.key);
  const header = result.columns.map((c) => escapeCsvCell(c.label)).join(',');
  const body = result.rows
    .map((row) => keys.map((k) => escapeCsvCell(row[k])).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${result.report_id || 'report'}_export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const { navigate } = useNavigation();
  const [catalog, setCatalog] = useState<ReportMeta[]>([]);
  const [selectedId, setSelectedId] = useState('daily_wip');
  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [vinNo, setVinNo] = useState('');
  const [vinLabel, setVinLabel] = useState('');
  const [draftFrom, setDraftFrom] = useState(defaultFromDate);
  const [draftTo, setDraftTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [draftVinNo, setDraftVinNo] = useState('');
  const [draftVinLabel, setDraftVinLabel] = useState('');
  const [vinSearch, setVinSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [result, setResult] = useState<ReportResult | null>(null);

  useEffect(() => {
    reportsSvc
      .listReports()
      .then(setCatalog)
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const vinQuery = vinSearch.trim();
  const { data: vinOptions = [], isLoading: vinsLoading } = useSWR<VINNo[]>(
    filtersOpen ? ['report-filter-vins', vinQuery] : null,
    () => fetchVINs(undefined, vinQuery || undefined),
    { dedupingInterval: 3000 }
  );

  const runReport = useCallback(
    async (reportId: string, opts?: { from?: string; to?: string; vinNo?: string }) => {
      const from = opts?.from ?? fromDate;
      const to = opts?.to ?? toDate;
      const selectedVin = opts?.vinNo ?? vinNo;
      setLoading(true);
      setSelectedId(reportId);
      try {
        setResult(
          await reportsSvc.getReport(reportId, {
            from_date: from,
            to_date: to,
            ...(selectedVin ? { vin_no: selectedVin } : {}),
          })
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to run report');
        setResult(null);
      } finally {
        setLoading(false);
      }
    },
    [fromDate, toDate, vinNo]
  );

  useEffect(() => {
    if (!loadingCatalog) runReport('daily_wip');
  }, [loadingCatalog]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (filtersOpen) {
      setDraftFrom(fromDate);
      setDraftTo(toDate);
      setDraftVinNo(vinNo);
      setDraftVinLabel(vinLabel);
      setVinSearch('');
    }
  }, [filtersOpen, fromDate, toDate, vinNo, vinLabel]);

  const selectedMeta = catalog.find((r) => r.id === selectedId);

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (fromDate !== defaultFromDate()) n += 1;
    if (toDate !== new Date().toISOString().split('T')[0]) n += 1;
    if (vinNo) n += 1;
    return n;
  }, [fromDate, toDate, vinNo]);

  const vinSelectOptions = useMemo(() => {
    const fromApi = (vinOptions || []).map((v) => ({
      value: v.name,
      label: vinOptionLabel(v),
      description: v.vin_number,
    }));
    if (draftVinNo && !fromApi.some((o) => o.value === draftVinNo)) {
      return [
        {
          value: draftVinNo,
          label: draftVinLabel || draftVinNo,
          description: draftVinLabel || undefined,
        },
        ...fromApi,
      ];
    }
    return fromApi;
  }, [vinOptions, draftVinNo, draftVinLabel]);

  const applyFilters = () => {
    setFromDate(draftFrom);
    setToDate(draftTo);
    setVinNo(draftVinNo);
    setVinLabel(draftVinLabel);
    setFiltersOpen(false);
    void runReport(selectedId, { from: draftFrom, to: draftTo, vinNo: draftVinNo });
  };

  const resetFilters = () => {
    const from = defaultFromDate();
    const to = new Date().toISOString().split('T')[0];
    setDraftFrom(from);
    setDraftTo(to);
    setDraftVinNo('');
    setDraftVinLabel('');
    setVinSearch('');
    setFromDate(from);
    setToDate(to);
    setVinNo('');
    setVinLabel('');
    void runReport(selectedId, { from, to, vinNo: '' });
  };

  const handleExport = () => {
    if (!result?.rows?.length) {
      toast.error('No data to export. Run the report first.');
      return;
    }
    exportReportCsv(result);
    toast.success('Exported as CSV');
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-3">

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between shrink-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
            {selectedMeta?.description || 'Select a report below'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button
            type="button"
            variant={filtersOpen ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFiltersOpen((o) => !o)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => runReport(selectedId)} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={handleExport} disabled={!result?.rows?.length} className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
        <CollapsibleContent className="shrink-0 data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <Card className="border-dashed shadow-none">
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="space-y-1.5 min-w-[14rem] sm:min-w-[20rem] sm:flex-[1.5]">
                <Label htmlFor="rvin">VIN / chassis no.</Label>
                <SearchableSelect
                  options={vinSelectOptions}
                  value={draftVinNo}
                  valueLabel={draftVinLabel || undefined}
                  onValueChange={(val) => {
                    const picked = vinOptions?.find((v) => v.name === val);
                    setDraftVinNo(val);
                    setDraftVinLabel(
                      picked
                        ? `${picked.vin_number}${picked.plate_number ? ` · ${picked.plate_number}` : ''}`
                        : ''
                    );
                  }}
                  onSearchChange={setVinSearch}
                  placeholder="Search VIN, plate, or model…"
                  emptyMessage={vinQuery ? 'No vehicles found' : 'Type to search vehicles'}
                  isLoading={vinsLoading}
                />
              </div>
              <div className="space-y-1.5 min-w-[10rem]">
                <Label htmlFor="rf">From date</Label>
                <Input id="rf" type="date" value={draftFrom} onChange={(e) => setDraftFrom(e.target.value)} />
              </div>
              <div className="space-y-1.5 min-w-[10rem]">
                <Label htmlFor="rt">To date</Label>
                <Input id="rt" type="date" value={draftTo} onChange={(e) => setDraftTo(e.target.value)} />
              </div>
              <div className="flex gap-2 pb-0.5"><Button type="button" size="sm" onClick={applyFilters}>Apply</Button><Button type="button" size="sm" variant="ghost" onClick={resetFilters}>Reset</Button></div>
            </CardContent>
          </Card>
        </CollapsibleContent>
      </Collapsible>

      <div className="shrink-0 overflow-hidden rounded-lg border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reports</span>
        </div>
        <div className="flex gap-1.5 overflow-x-auto p-2 scrollbar-thin">
          {loadingCatalog ? (
            <Skeleton className="h-9 w-40 shrink-0" />
          ) : (
            catalog.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => runReport(r.id)}
                className={cn(
                  'shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap',
                  selectedId === r.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {r.title}
              </button>
            ))
          )}
        </div>
      </div>

      <Card className="min-h-0 flex-1 flex flex-col overflow-hidden border shadow-sm">
        <CardContent className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading && !result ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : result ? (
            <ReportViewer data={result} />
          ) : (
            <p className="py-20 text-center text-muted-foreground">Choose a report tab and click Refresh</p>
          )}
        </CardContent>
      </Card>

      <div className="shrink-0">
        <button
          type="button"
          onClick={() => setDocsOpen((o) => !o)}
          className="flex w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-sm font-medium hover:bg-muted/50"
        >
          <span className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Printable documents
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', docsOpen && 'rotate-180')} />
        </button>
        {docsOpen && (
          <div className="mt-2 grid gap-2 rounded-lg border bg-card p-3 sm:grid-cols-2 lg:grid-cols-4">
            {PRINTABLE_DOCUMENTS.map((doc) => (
              <Button
                key={doc.label}
                variant="outline"
                size="sm"
                className="h-auto justify-start py-2 text-left text-xs"
                onClick={() => navigate(doc.view)}
              >
                {doc.label}
              </Button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
