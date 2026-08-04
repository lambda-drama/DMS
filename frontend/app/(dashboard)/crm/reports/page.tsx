'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ReportViewer } from '@/components/reports/report-viewer';
import { CrmSectionDashboard } from '@/components/crm/reports/crm-section-dashboard';
import { useNavigation } from '@/contexts/navigation-context';
import * as crmReports from '@/services/crm/reports';
import type { CrmReportFilters, CrmReportResult } from '@/services/crm/reports';
import type { ReportSection, SectionDashboard } from '@/services/reports';
import {
  exportReportCsv,
  exportReportExcel,
  buildReportPdfHtml,
} from '@/lib/report-export';
import { PdfPreviewDialog } from '@/components/reports/pdf-preview-dialog';
import { useBranches, useCompanies, useAutofillSingleCompany } from '@/hooks/use-dms';
import { SearchableSelect } from '@/components/searchable-select';
import { FileSpreadsheet, FileText, HelpCircle, Loader2, RefreshCw, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { reportActionBtnClass } from '@/components/reports/dashboards/shared';
import { cn } from '@/lib/utils';

const PERIOD_OPTIONS = [
  { value: 'custom', label: 'Custom range' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
] as const;

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return isoDate(d);
}

function datesForPeriod(period: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (period === 'daily') {
    const s = isoDate(today);
    return { from: s, to: s };
  }
  if (period === 'weekly') {
    const start = new Date(today);
    const day = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (period === 'monthly') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (period === 'quarterly') {
    const q = Math.floor(today.getMonth() / 3);
    const start = new Date(today.getFullYear(), q * 3, 1);
    const end = new Date(today.getFullYear(), q * 3 + 3, 0);
    return { from: isoDate(start), to: isoDate(end) };
  }
  if (period === 'yearly') {
    return {
      from: isoDate(new Date(today.getFullYear(), 0, 1)),
      to: isoDate(new Date(today.getFullYear(), 11, 31)),
    };
  }
  return { from: defaultFromDate(), to: isoDate(today) };
}

export default function CrmReportsPage() {
  const { viewParams, navigate } = useNavigation();
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const sectionId = viewParams.get('section') || '';
  const reportId = viewParams.get('report') || 'dashboard';

  const [period, setPeriod] = useState('monthly');
  const [fromDate, setFromDate] = useState(() => datesForPeriod('monthly').from);
  const [toDate, setToDate] = useState(() => datesForPeriod('monthly').to);
  const [company, setCompany] = useState('');
  const [branch, setBranch] = useState('');
  const [owner, setOwner] = useState('');
  const [source, setSource] = useState('');
  const [model, setModel] = useState('');
  const [campaign, setCampaign] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrmReportResult | null>(null);
  const [sectionDash, setSectionDash] = useState<SectionDashboard | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, unknown>[]>([]);

  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: branches, isLoading: branchesLoading } = useBranches(branchSearch);
  useAutofillSingleCompany(companies, companiesLoading, company, (c) => setCompany(c.name), {
    search: companySearch,
    enabled: true,
  });

  const activeSection = useMemo(
    () => sections.find((s) => s.id === sectionId) || null,
    [sections, sectionId]
  );

  const applyPeriod = (value: string) => {
    setPeriod(value);
    if (value === 'custom') return;
    const range = datesForPeriod(value);
    setFromDate(range.from);
    setToDate(range.to);
  };

  useEffect(() => {
    crmReports
      .listCrmReports()
      .then((catalog) => setSections(catalog.sections || []))
      .catch(() => toast.error('Failed to load CRM reports'))
      .finally(() => setLoadingCatalog(false));
  }, []);

  useEffect(() => {
    if (loadingCatalog || sectionId || !sections.length) return;
    navigate('crm-reports', { section: sections[0].id, report: 'dashboard' });
  }, [loadingCatalog, sectionId, sections, navigate]);

  const openReportTab = (id: string) => {
    if (!sectionId) return;
    navigate('crm-reports', { section: sectionId, report: id });
  };

  const buildFilters = useCallback((): CrmReportFilters => {
    return {
      from_date: fromDate,
      to_date: toDate,
      ...(period && period !== 'custom' ? { period } : {}),
      ...(company ? { company } : {}),
      ...(branch ? { branch } : {}),
      ...(owner ? { owner } : {}),
      ...(source ? { source } : {}),
      ...(model ? { model } : {}),
      ...(campaign ? { campaign } : {}),
    };
  }, [fromDate, toDate, period, company, branch, owner, source, model, campaign]);

  const refresh = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      if (reportId === 'dashboard') {
        setSectionDash(await crmReports.getCrmSectionDashboard(sectionId, buildFilters()));
        setResult(null);
        try {
          const snap = await crmReports.getCrmReportSnapshots(sectionId, 8);
          setSnapshots(snap.data || []);
        } catch {
          setSnapshots([]);
        }
      } else {
        setResult(await crmReports.getCrmReport(reportId, buildFilters()));
        setSectionDash(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load report');
      setResult(null);
      setSectionDash(null);
    } finally {
      setLoading(false);
    }
  }, [sectionId, reportId, buildFilters]);

  useEffect(() => {
    if (!loadingCatalog && sectionId) {
      void refresh();
    }
  }, [loadingCatalog, sectionId, reportId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onExport = async (kind: 'csv' | 'excel' | 'pdf') => {
    if (!result) {
      toast.error('Open a report tab first, then export.');
      return;
    }
    try {
      await crmReports.logCrmReportExport({
        report_id: result.report_id,
        format: kind,
        row_count: result.rows?.length || 0,
        filters: buildFilters(),
      });
    } catch {
      /* non-blocking */
    }
    if (kind === 'csv') exportReportCsv(result);
    else if (kind === 'excel') exportReportExcel(result);
    else {
      setPdfPreviewHtml(buildReportPdfHtml(result));
      setPdfPreviewOpen(true);
    }
  };

  const onSnapshot = async () => {
    try {
      await crmReports.saveCrmPipelineSnapshot(buildFilters());
      const snap = await crmReports.getCrmReportSnapshots(sectionId || 'crm_executive', 8);
      setSnapshots(snap.data || []);
      toast.success('Pipeline snapshot saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Snapshot failed');
    }
  };

  if (loadingCatalog || !sectionId) {
    return (
      <div className="space-y-3 p-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const tabValue = reportId === 'dashboard' ? 'dashboard' : reportId;

  return (
    <div className="space-y-3">
      <PdfPreviewDialog
        open={pdfPreviewOpen}
        onOpenChange={(open) => {
          setPdfPreviewOpen(open);
          if (!open) setPdfPreviewHtml(null);
        }}
        title={result?.title || 'Report'}
        html={pdfPreviewHtml}
      />

      <div className="flex flex-wrap items-center justify-end gap-1.5">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={reportActionBtnClass}
          onClick={() => void refresh()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="h-3.5 w-3.5" />
          )}
          Refresh
        </Button>
        {(sectionId === 'crm_executive' || sectionId === 'crm_sales') && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className={reportActionBtnClass}
            onClick={() => void onSnapshot()}
          >
            <Camera className="h-3.5 w-3.5" />
            Snapshot
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={reportActionBtnClass}
          onClick={() => void onExport('excel')}
          disabled={!result}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Excel
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={reportActionBtnClass}
          onClick={() => void onExport('pdf')}
          disabled={!result}
        >
          <FileText className="h-3.5 w-3.5" />
          PDF
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={reportActionBtnClass}
          onClick={() => void onExport('csv')}
          disabled={!result}
        >
          CSV
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={reportActionBtnClass}
          onClick={() => setShowHelp((v) => !v)}
          disabled={!result?.help_text}
        >
          <HelpCircle className="h-3.5 w-3.5" />
          Help
        </Button>
      </div>

      <Tabs value={tabValue} onValueChange={openReportTab}>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          <TabsTrigger
            value="dashboard"
            className={cn(
              'rounded-md border px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary/10'
            )}
          >
            Overview
          </TabsTrigger>
          {(activeSection?.reports || []).map((r) => (
            <TabsTrigger
              key={r.id}
              value={r.id}
              className={cn(
                'rounded-md border px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary/10'
              )}
              title={r.description}
            >
              {r.title}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Period</Label>
            <Select value={period} onValueChange={applyPeriod}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              className="h-9"
              value={fromDate}
              onChange={(e) => {
                setPeriod('custom');
                setFromDate(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              className="h-9"
              value={toDate}
              onChange={(e) => {
                setPeriod('custom');
                setToDate(e.target.value);
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Company</Label>
                  <SearchableSelect
              options={(companies || []).map((c) => ({
                value: c.name,
                label: c.company_name || c.name,
              }))}
              value={company}
              onValueChange={(v) => setCompany(v || '')}
              onSearchChange={setCompanySearch}
              placeholder="All companies"
              isLoading={companiesLoading}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Branch</Label>
            <SearchableSelect
              options={(branches || []).map((b) => ({
                value: b.name,
                label: (b as { branch?: string; branch_name?: string }).branch_name ||
                  (b as { branch?: string }).branch ||
                  b.name,
              }))}
              value={branch}
              onValueChange={(v) => setBranch(v || '')}
              onSearchChange={setBranchSearch}
              placeholder="All branches"
              isLoading={branchesLoading}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Owner (email)</Label>
            <Input
              className="h-9"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="User email"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Source</Label>
            <Input
              className="h-9"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="Lead source"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Model / Campaign</Label>
            <div className="flex gap-2">
              <Input
                className="h-9"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Model"
              />
              <Input
                className="h-9"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="Campaign"
              />
            </div>
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            <Button size="sm" onClick={() => void refresh()} disabled={loading}>
              Apply filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {showHelp && result?.help_text ? (
        <Card className="border-border/70 bg-muted/30 shadow-sm">
          <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Definitions &amp; formulas</p>
            <p>{result.help_text}</p>
            {result.definitions && Object.keys(result.definitions).length > 0 ? (
              <ul className="list-disc space-y-1 pl-5">
                {Object.entries(result.definitions).map(([k, v]) => (
                  <li key={k}>
                    <span className="font-medium text-foreground">{k}:</span> {v}
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {loading ? (
        <div className="grid gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      ) : reportId === 'dashboard' && sectionDash ? (
        <div className="space-y-3">
          <CrmSectionDashboard data={sectionDash} />
          {snapshots.length > 0 ? (
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4">
                <p className="mb-2 text-sm font-medium">Snapshot history (§17.5)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="py-1.5 pr-3">When</th>
                        <th className="py-1.5 pr-3">Pipeline</th>
                        <th className="py-1.5 pr-3">Weighted</th>
                        <th className="py-1.5">Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {snapshots.map((s) => (
                        <tr key={String(s.name)} className="border-b border-border/50">
                          <td className="py-1.5 pr-3">{String(s.snapshot_on || '').slice(0, 16)}</td>
                          <td className="py-1.5 pr-3 tabular-nums">
                            {Number(s.open_pipeline_value || 0).toLocaleString()}
                          </td>
                          <td className="py-1.5 pr-3 tabular-nums">
                            {Number(s.weighted_forecast || 0).toLocaleString()}
                          </td>
                          <td className="py-1.5 text-muted-foreground">
                            {String(s.from_date || '')} → {String(s.to_date || '')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : result ? (
        <ReportViewer data={result} />
      ) : (
        <p className="py-8 text-center text-sm text-muted-foreground">No data loaded.</p>
      )}
    </div>
  );
}
