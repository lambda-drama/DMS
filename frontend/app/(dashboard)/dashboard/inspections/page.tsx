'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { useInspections, useInspection } from '@/hooks/use-dms';
import { DetailSheet } from '@/components/detail-sheet';
import { InspectionDetailSheetContent } from '@/components/inspection/inspection-detail-sheet';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import * as estimatesSvc from '@/services/serviceEstimates';
import { canStartDiagnosis, normalizeInspectionDocstatus } from '@/lib/inspection-workflow';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ClipboardCheck,
  MoreHorizontal,
  Search,
  Filter,
  Car,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  ChevronDown,
  BarChart3,
  Stethoscope,
} from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import { ListRowActions } from '@/components/list-row-actions';
import { cn } from '@/lib/utils';

export default function InspectionsPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [startingDiagnosisId, setStartingDiagnosisId] = useState<string | null>(null);

  const handleStartDiagnosis = useCallback(
    async (inspectionId: string) => {
      setStartingDiagnosisId(inspectionId);
      try {
        const estimateName = await estimatesSvc.makeFromInspection(inspectionId);
        toast.success('Service estimate created — add diagnosis findings');
        setSelectedId(null);
        navigate('estimate-detail', { id: estimateName });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to start diagnosis');
      } finally {
        setStartingDiagnosisId(null);
      }
    },
    [navigate]
  );

  const { data: selectedInspection, isLoading: detailLoading } = useInspection(selectedId);

  const { data: result, isLoading, error } = useInspections({
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const inspections = result?.data ?? [];
  const totalItems = result?.total || 0;

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  const filteredInspections = inspections.filter((insp) => {
    const matchesSearch =
      (insp.customer_vehicle ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (insp.license_plate ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'draft' && normalizeInspectionDocstatus(insp.docstatus) === 0) ||
      (statusFilter === 'submitted' && normalizeInspectionDocstatus(insp.docstatus) === 1);

    return matchesSearch && matchesStatus;
  });

  const todayCount = inspections.filter(
    (insp) =>
      format(new Date(insp.inspection_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const pendingCount = inspections.filter((insp) => normalizeInspectionDocstatus(insp.docstatus) === 0).length;
  const issuesCount = inspections.reduce(
    (acc, insp) => acc + (insp.customer_complaints?.length || 0),
    0
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {/* Main listing — first on mobile so inspections are visible immediately */}
      <Card className="order-1 md:order-2">
        <CardHeader className="flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <CardTitle className="hidden md:block">Vehicle Inspections</CardTitle>
            {!isLoading && totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground md:hidden">
                {filteredInspections.length === totalItems
                  ? `${totalItems} inspection${totalItems === 1 ? '' : 's'}`
                  : `${filteredInspections.length} of ${totalItems} shown`}
              </p>
            ) : null}
          </div>
          <PermittedCreateButton
            module="inspections"
            label="New Inspection"
            onClick={() => navigate('inspection-new')}
          />
        </CardHeader>
        <CardContent className="min-w-0">
          {/* Filters */}
          <div className="mb-4 flex flex-col gap-4 sm:mb-6 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, ID, vehicle, or plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mobile list */}
          <div className="space-y-3 md:hidden">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : filteredInspections.length === 0 ? (
              <div className="rounded-lg border border-dashed py-10 text-center">
                <ClipboardCheck className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No inspections found</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Try adjusting search or filters, or create a new inspection
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tap a row for details
                </p>
                {filteredInspections.map((insp) => (
                <div
                  key={insp.name}
                  className="rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedId(insp.name)}
                      className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
                    >
                      <p className="font-medium">{insp.customer_vehicle || insp.customer}</p>
                      <p className="truncate text-sm text-muted-foreground">{insp.name}</p>
                      <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                        <p>{insp.customer}</p>
                        {insp.license_plate ? <p>{insp.license_plate}</p> : null}
                        <p>{format(new Date(insp.inspection_date), 'MMM d, yyyy · h:mm a')}</p>
                        <p>
                          {(insp.customer_complaints?.length || 0)} issue
                          {(insp.customer_complaints?.length || 0) === 1 ? '' : 's'} found
                        </p>
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-2 self-stretch">
                      <Badge
                        variant="outline"
                        className={
                          normalizeInspectionDocstatus(insp.docstatus) === 1
                            ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                            : 'bg-chart-4/10 text-chart-4 border-chart-4/20'
                        }
                      >
                        {normalizeInspectionDocstatus(insp.docstatus) === 1 ? 'Submitted' : 'Draft'}
                      </Badge>
                      {(insp.warning_lights?.length || 0) > 0 ? (
                        <Badge
                          variant="outline"
                          className="max-w-36 justify-end text-[11px] leading-tight border-destructive bg-transparent text-foreground"
                        >
                          {insp.warning_lights!.length} warning
                          {insp.warning_lights!.length > 1 ? 's' : ''}
                        </Badge>
                      ) : null}
                      <div className="mt-auto">
                        <ListRowActions doctype="Vehicle Inspection" docName={insp.name}>
                          {(normalizeInspectionDocstatus(insp.docstatus) === 0 || (normalizeInspectionDocstatus(insp.docstatus) === 1 && !insp.job_card)) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {normalizeInspectionDocstatus(insp.docstatus) === 0 && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate('inspection-detail', { id: insp.name, mode: 'edit' })
                                    }
                                  >
                                    Continue Editing
                                  </DropdownMenuItem>
                                )}
                                {canStartDiagnosis(insp) && (
                                  <DropdownMenuItem
                                    className="text-primary"
                                    onClick={() => handleStartDiagnosis(insp.name)}
                                  >
                                    Start diagnosis
                                  </DropdownMenuItem>
                                )}
                                {insp.service_estimate && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate('estimate-detail', { id: insp.service_estimate! })
                                    }
                                  >
                                    View service estimate
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </ListRowActions>
                      </div>
                    </div>
                  </div>
                  {insp.job_card ? (
                    <button
                      type="button"
                      onClick={() => navigate('job-card-detail', { id: insp.job_card ?? '' })}
                      className="mt-3 flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <FileText className="h-4 w-4" />
                      {insp.job_card}
                    </button>
                  ) : null}
                  {canStartDiagnosis(insp) ? (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      disabled={startingDiagnosisId === insp.name}
                      onClick={() => handleStartDiagnosis(insp.name)}
                    >
                      <Stethoscope className="mr-2 h-4 w-4" />
                      {startingDiagnosisId === insp.name ? 'Creating…' : 'Start diagnosis'}
                    </Button>
                  ) : null}
                  {insp.service_estimate && !insp.job_card ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => navigate('estimate-detail', { id: insp.service_estimate! })}
                    >
                      View service estimate
                    </Button>
                  ) : null}
                </div>
                ))}
              </>
            )}
          </div>

          {filteredInspections.length > 0 ? (
            <div className="mt-4 md:hidden">
              <PaginationControls
                page={page}
                pageSize={pageSize}
                totalItems={totalItems}
                onPageChange={setPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          ) : null}

          {/* Table — tablet/desktop */}
          <div className="dms-table-panel hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inspection</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Job Card</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((insp) => (
                  <TableRow key={insp.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <button
                            onClick={() => setSelectedId(insp.name)}
                            className="font-medium hover:text-primary"
                          >
                            {insp.name}
                          </button>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {format(new Date(insp.inspection_date), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{insp.customer}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{insp.customer_vehicle}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{insp.license_plate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {(insp.warning_lights?.length || 0) > 0 ? (
                            <Badge variant="outline" className="bg-transparent text-foreground border-destructive">
                              {insp.warning_lights.length} Warning Light
                              {insp.warning_lights.length > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-chart-3/10 text-chart-3 border-chart-3/20"
                            >
                              No Warnings
                            </Badge>
                          )}
                        </div>
                        <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                          {insp.customer_complaints?.length || 0} issues found
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          normalizeInspectionDocstatus(insp.docstatus) === 1
                            ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                            : 'bg-chart-4/10 text-chart-4 border-chart-4/20'
                        }
                      >
                        {normalizeInspectionDocstatus(insp.docstatus) === 1 ? 'Submitted' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {insp.job_card ? (
                        <button
                          onClick={() => navigate('job-card-detail', { id: insp.job_card ?? '' })}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {insp.job_card}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <ListRowActions doctype="Vehicle Inspection" docName={insp.name}>
                        {(normalizeInspectionDocstatus(insp.docstatus) === 0 || (normalizeInspectionDocstatus(insp.docstatus) === 1 && !insp.job_card)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {normalizeInspectionDocstatus(insp.docstatus) === 0 && (
                                <DropdownMenuItem onClick={() => navigate('inspection-detail', { id: insp.name, mode: 'edit' })}>
                                  Continue Editing
                                </DropdownMenuItem>
                              )}
                              {canStartDiagnosis(insp) && (
                                <DropdownMenuItem
                                  className="text-primary"
                                  onClick={() => handleStartDiagnosis(insp.name)}
                                >
                                  Start diagnosis
                                </DropdownMenuItem>
                              )}
                              {insp.service_estimate && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate('estimate-detail', { id: insp.service_estimate! })
                                  }
                                >
                                  View service estimate
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </ListRowActions>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInspections.length === 0 && !isLoading && (
            <div className="hidden py-12 text-center md:block">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No inspections found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}

          <div className="hidden md:block">
            <PaginationControls
              page={page}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary stats — hidden on mobile by default; always visible on md+ */}
      <div className="order-2 space-y-3 md:order-1">
        <div className="flex items-center justify-between md:hidden">
          <p className="text-sm font-medium text-muted-foreground">Summary</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => setShowMobileStats((open) => !open)}
          >
            <BarChart3 className="mr-2 h-3.5 w-3.5" />
            {showMobileStats ? 'Hide stats' : 'Show stats'}
            <ChevronDown
              className={cn('ml-2 h-3.5 w-3.5 transition-transform', showMobileStats && 'rotate-180')}
            />
          </Button>
        </div>
        <div
          className={cn(
            'grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4',
            showMobileStats ? 'grid' : 'hidden md:grid',
          )}
        >
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="rounded-full bg-primary/10 p-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">{todayCount}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Today&apos;s Inspections
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="rounded-full bg-chart-4/10 p-1.5">
                <Clock className="h-3.5 w-3.5 text-chart-4" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">{pendingCount}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Pending Submission
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="rounded-full bg-destructive/10 p-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">{issuesCount}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Issues Found
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="rounded-full bg-chart-3/10 p-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">
                  {inspections.filter((insp) => insp.job_card).length}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Job Cards Created
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        title={selectedId || ""}
        subtitle={selectedInspection?.customer_vehicle || selectedInspection?.customer}
        badge={selectedInspection ? { label: normalizeInspectionDocstatus(selectedInspection.docstatus) === 1 ? "Submitted" : "Draft" } : undefined}
        isLoading={detailLoading}
        contentScroll="inner"
        onOpenInDesk={() => window.open(`/app/vehicle-inspection/${selectedId}`, '_blank')}
      >
        {selectedInspection && selectedId && (
          <InspectionDetailSheetContent
            key={selectedId}
            inspection={selectedInspection}
            onStartDiagnosis={() => handleStartDiagnosis(selectedId)}
            startingDiagnosis={startingDiagnosisId === selectedId}
          />
        )}
      </DetailSheet>
    </div>
  );
}
