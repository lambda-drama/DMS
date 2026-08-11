'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
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
import { SearchableSelect } from '@/components/searchable-select';
import { ReportViewer } from '@/components/reports/report-viewer';
import { SectionDashboardView } from '@/components/reports/section-dashboard';
import { useNavigation } from '@/contexts/navigation-context';
import * as reportsSvc from '@/services/reports';
import { isStockReportId } from '@/services/reports';
import type { ReportResult, ReportSection, SectionDashboard } from '@/services/reports';
import {
  exportReportCsv,
  exportReportExcel,
  buildReportPdfHtml,
} from '@/lib/report-export';
import { PdfPreviewDialog } from '@/components/reports/pdf-preview-dialog';
import { fetchVINs, fetchSpareParts, sparePartToSelectOption } from '@/services/common';
import type { JobCardType, VINNo } from '@/types/dms';
import {
  useCompanies,
  useBranches,
  useWarehouses,
  useAutofillSingleCompany,
  useServiceAdvisors,
  useTechnicians,
  useVehicleModels,
} from '@/hooks/use-dms';
import { Checkbox } from '@/components/ui/checkbox';
import { RequiredLabel } from '@/components/required-label';
import { FileSpreadsheet, FileText, Loader2, RefreshCw } from 'lucide-react';
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

const JOB_CARD_TYPES: JobCardType[] = [
  'Customer Paid',
  'Warranty',
  'Internal',
  'PDI',
  'Campaign/Recall',
  'Insurance',
  'Goodwill',
  'Fleet Contract',
];

function vinOptionLabel(v: VINNo) {
  const plate = v.plate_number ? ` · ${v.plate_number}` : '';
  const model = v.model_name ? `${v.model_name}${plate}` : v.plate_number || v.name;
  return model;
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function defaultFromDate() {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return isoDate(d);
}

/** Client-side date range for period presets (matches server logic for display). */
function datesForPeriod(period: string): { from: string; to: string } {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  if (period === 'daily') {
    const s = isoDate(today);
    return { from: s, to: s };
  }
  if (period === 'weekly') {
    const start = new Date(today);
    const day = (start.getDay() + 6) % 7; // Monday=0
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

export default function ReportsPage() {
  const { viewParams, navigate } = useNavigation();
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const sectionId = viewParams.get('section') || '';
  const reportId = viewParams.get('report') || 'dashboard';

  const [period, setPeriod] = useState<string>('monthly');
  const [fromDate, setFromDate] = useState(() => datesForPeriod('monthly').from);
  const [toDate, setToDate] = useState(() => datesForPeriod('monthly').to);
  const [vinNo, setVinNo] = useState('');
  const [vinLabel, setVinLabel] = useState('');
  const [vinSearch, setVinSearch] = useState('');
  const [serviceAdvisor, setServiceAdvisor] = useState('');
  const [technician, setTechnician] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleModelLabel, setVehicleModelLabel] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [jobCardType, setJobCardType] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [sectionDash, setSectionDash] = useState<SectionDashboard | null>(null);
  const [pdfPreviewOpen, setPdfPreviewOpen] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState<string | null>(null);

  const [company, setCompany] = useState('');
  const [branch, setBranch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [sparePart, setSparePart] = useState('');
  const [sparePartLabel, setSparePartLabel] = useState('');
  const [belowMinimumOnly, setBelowMinimumOnly] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [sparePartSearch, setSparePartSearch] = useState('');

  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: branches, isLoading: branchesLoading } = useBranches(branchSearch);
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses(
    warehouseSearch,
    company || undefined
  );
  const { data: advisors, isLoading: advisorsLoading } = useServiceAdvisors();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();
  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);

  const activeSection = useMemo(
    () => sections.find((s) => s.id === sectionId) || null,
    [sections, sectionId]
  );
  const isStockReport = isStockReportId(reportId);

  useAutofillSingleCompany(companies, companiesLoading, company, (c) => setCompany(c.name), {
    search: companySearch,
    enabled: isStockReport,
  });

  const applyPeriod = (value: string) => {
    setPeriod(value);
    if (value === 'custom') return;
    const range = datesForPeriod(value);
    setFromDate(range.from);
    setToDate(range.to);
  };

  useEffect(() => {
    reportsSvc
      .listReports()
      .then((catalog) => setSections(catalog.sections || []))
      .catch(() => toast.error('Failed to load reports'))
      .finally(() => setLoadingCatalog(false));
  }, []);

  // Default into first section when opened without params (sidebar always sends section)
  useEffect(() => {
    if (loadingCatalog || !sections.length) return;
    if (!sectionId) {
      navigate('reports', { section: sections[0].id, report: 'dashboard' });
      return;
    }
    if (!sections.some((s) => s.id === sectionId)) {
      navigate('reports', { section: sections[0].id, report: 'dashboard' });
    }
  }, [loadingCatalog, sectionId, sections, navigate]);

  const sparePartQuery = sparePartSearch.trim();
  const { data: sparePartOptions = [], isLoading: sparePartsLoading } = useSWR(
    isStockReport
      ? ['report-spare-parts', sparePartQuery, warehouse || null, company || null]
      : null,
    () => fetchSpareParts(sparePartQuery || undefined, warehouse || undefined, company || undefined),
    { dedupingInterval: 3000 }
  );

  const vinQuery = vinSearch.trim();
  const { data: vinOptions = [], isLoading: vinsLoading } = useSWR<VINNo[]>(
    sectionId && !isStockReport ? ['report-filter-vins', vinQuery] : null,
    () => fetchVINs(undefined, vinQuery || undefined),
    { dedupingInterval: 3000 }
  );

  const openReportTab = (id: string) => {
    if (!sectionId) return;
    navigate('reports', { section: sectionId, report: id });
  };

  const buildFilters = useCallback((): reportsSvc.ReportFilters => {
    if (isStockReport) {
      return {
        company: company || undefined,
        warehouse: warehouse || undefined,
        spare_part: sparePart || undefined,
        below_minimum_only: belowMinimumOnly ? 1 : 0,
        include_zero_stock: 1,
      };
    }
    return {
      from_date: fromDate,
      to_date: toDate,
      ...(period && period !== 'custom' ? { period } : {}),
      ...(branch ? { branch } : {}),
      ...(serviceAdvisor ? { service_advisor: serviceAdvisor } : {}),
      ...(technician ? { technician } : {}),
      ...(vehicleModel
        ? { vehicle_model: vehicleModel, vehicle_model_label: vehicleModelLabel || undefined }
        : {}),
      ...(jobCardType ? { job_card_type: jobCardType } : {}),
      ...(vinNo ? { vin_no: vinNo } : {}),
    };
  }, [
    isStockReport,
    company,
    warehouse,
    sparePart,
    belowMinimumOnly,
    fromDate,
    toDate,
    period,
    branch,
    serviceAdvisor,
    technician,
    vehicleModel,
    vehicleModelLabel,
    jobCardType,
    vinNo,
  ]);

  const refresh = useCallback(async () => {
    if (!sectionId) return;
    setLoading(true);
    try {
      if (reportId === 'dashboard') {
        setSectionDash(await reportsSvc.getSectionDashboard(sectionId, buildFilters()));
        setResult(null);
      } else {
        if (isStockReport && (!company || !warehouse)) {
          toast.error('Select company and warehouse, then refresh.');
          setResult(null);
          return;
        }
        setResult(await reportsSvc.getReport(reportId, buildFilters()));
        setSectionDash(null);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load report');
      setResult(null);
      setSectionDash(null);
    } finally {
      setLoading(false);
    }
  }, [sectionId, reportId, buildFilters, isStockReport, company, warehouse]);

  useEffect(() => {
    if (!loadingCatalog && sectionId) {
      void refresh();
    }
  }, [loadingCatalog, sectionId, reportId]); // eslint-disable-line react-hooks/exhaustive-deps

  const onExport = (kind: 'csv' | 'excel' | 'pdf') => {
    if (!result) {
      toast.error('Open a report tab first, then export.');
      return;
    }
    if (kind === 'csv') exportReportCsv(result);
    else if (kind === 'excel') exportReportExcel(result);
    else {
      setPdfPreviewHtml(buildReportPdfHtml(result));
      setPdfPreviewOpen(true);
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
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={reportActionBtnClass}
          onClick={() => onExport('excel')}
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
          onClick={() => onExport('pdf')}
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
          onClick={() => onExport('csv')}
          disabled={!result}
        >
          CSV
        </Button>
      </div>

      <Tabs value={reportId} onValueChange={openReportTab}>
        <div className="overflow-x-auto pb-0.5">
          <TabsList className="h-11 w-max max-w-none justify-start gap-1 rounded-xl bg-muted/50 p-1.5">
            <TabsTrigger
              value="dashboard"
              className={cn(
                'font-serif-display h-8 rounded-lg border border-transparent px-3.5 text-[14px] font-normal tracking-wide',
                'text-muted-foreground transition-colors',
                'data-[state=active]:border-dms-gold/60 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                'data-[state=active]:font-normal'
              )}
            >
              Overview
            </TabsTrigger>
            {(activeSection?.reports || []).map((r) => (
              <TabsTrigger
                key={r.id}
                value={r.id}
                className={cn(
                  'font-serif-display h-8 rounded-lg border border-transparent px-3.5 text-[14px] font-normal tracking-wide',
                  'text-muted-foreground transition-colors',
                  'data-[state=active]:border-dms-gold/60 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm',
                  'data-[state=active]:font-normal'
                )}
              >
                {r.title}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <Card className="border-border/80 shadow-none">
        <CardContent className="space-y-3 pt-4">
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
            {isStockReport ? (
              <>
                <div className="space-y-1">
                  <RequiredLabel className="text-xs">Company</RequiredLabel>
                  <SearchableSelect
                    options={(companies || []).map((c) => ({
                      value: c.name,
                      label: c.company_name || c.name,
                    }))}
                    value={company}
                    onValueChange={(v) => {
                      setCompany(v);
                      setWarehouse('');
                    }}
                    onSearchChange={setCompanySearch}
                    placeholder="Select company"
                    isLoading={companiesLoading}
                  />
                </div>
                <div className="space-y-1">
                  <RequiredLabel className="text-xs">Warehouse</RequiredLabel>
                  <SearchableSelect
                    options={(warehouses || []).map((w) => ({
                      value: w.name,
                      label: w.warehouse_name || w.name,
                    }))}
                    value={warehouse}
                    onValueChange={setWarehouse}
                    onSearchChange={setWarehouseSearch}
                    placeholder="Select warehouse"
                    isLoading={warehousesLoading}
                    disabled={!company}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Spare part</Label>
                  <SearchableSelect
                    options={sparePartOptions.map(sparePartToSelectOption)}
                    value={sparePart}
                    valueLabel={sparePartLabel}
                    onValueChange={(v) => {
                      setSparePart(v);
                      const opt = sparePartOptions.find((p) => p.name === v);
                      setSparePartLabel(opt ? sparePartToSelectOption(opt).label : '');
                    }}
                    onSearchChange={setSparePartSearch}
                    placeholder="All parts"
                    isLoading={sparePartsLoading}
                  />
                </div>
                <div className="flex items-end gap-2 pb-1.5">
                  <Checkbox
                    id="below-min"
                    checked={belowMinimumOnly}
                    onCheckedChange={(c) => setBelowMinimumOnly(c === true)}
                  />
                  <Label htmlFor="below-min" className="cursor-pointer text-xs font-normal">
                    Below minimum only
                  </Label>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <Label className="text-xs">Period</Label>
                  <Select value={period} onValueChange={applyPeriod}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Period" />
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
                <div className="space-y-1">
                  <Label className="text-xs">From</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={fromDate}
                    disabled={period !== 'custom'}
                    onChange={(e) => {
                      setPeriod('custom');
                      setFromDate(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">To</Label>
                  <Input
                    type="date"
                    className="h-9"
                    value={toDate}
                    disabled={period !== 'custom'}
                    onChange={(e) => {
                      setPeriod('custom');
                      setToDate(e.target.value);
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Branch</Label>
                  <SearchableSelect
                    options={(branches || []).map((b) => ({
                      value: b.name,
                      label: b.branch || b.name,
                    }))}
                    value={branch}
                    onValueChange={setBranch}
                    onSearchChange={setBranchSearch}
                    placeholder="All branches"
                    isLoading={branchesLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Advisor</Label>
                  <SearchableSelect
                    options={(advisors || []).map((a) => ({
                      value: a.name,
                      label: a.full_name || a.name,
                    }))}
                    value={serviceAdvisor}
                    onValueChange={setServiceAdvisor}
                    placeholder="All advisors"
                    isLoading={advisorsLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Technician</Label>
                  <SearchableSelect
                    options={(technicians || []).map((t) => ({
                      value: t.name,
                      label: t.full_name || t.name,
                    }))}
                    value={technician}
                    onValueChange={setTechnician}
                    placeholder="All technicians"
                    isLoading={techniciansLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Model</Label>
                  <SearchableSelect
                    options={(vehicleModels || []).map((m) => ({
                      value: m.name,
                      label: m.model_name || m.name,
                      description: m.brand_label || m.brand,
                    }))}
                    value={vehicleModel}
                    valueLabel={vehicleModelLabel}
                    onValueChange={(v) => {
                      setVehicleModel(v);
                      const hit = (vehicleModels || []).find((m) => m.name === v);
                      setVehicleModelLabel(hit?.model_name || hit?.name || '');
                    }}
                    onSearchChange={setModelSearch}
                    placeholder="All models"
                    isLoading={modelsLoading}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Job type</Label>
                  <Select
                    value={jobCardType || '__all__'}
                    onValueChange={(v) => setJobCardType(v === '__all__' ? '' : v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All types</SelectItem>
                      {JOB_CARD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">VIN</Label>
                  <SearchableSelect
                    options={vinOptions.map((v) => ({
                      value: v.name,
                      label: v.vin_number || v.name,
                      description: vinOptionLabel(v),
                    }))}
                    value={vinNo}
                    valueLabel={vinLabel}
                    onValueChange={(v) => {
                      setVinNo(v);
                      const hit = vinOptions.find((x) => x.name === v);
                      setVinLabel(hit?.vin_number || hit?.name || '');
                    }}
                    onSearchChange={setVinSearch}
                    placeholder="Optional filter…"
                    isLoading={vinsLoading}
                  />
                </div>
              </>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-dms-gold" />
            </div>
          ) : reportId === 'dashboard' && sectionDash ? (
            <SectionDashboardView data={sectionDash} />
          ) : result ? (
            <ReportViewer data={result} />
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Adjust filters and click Refresh.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
