'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { useInspections, useInspection } from '@/hooks/use-dms';
import { DetailSheet, DetailSection, DetailRow } from '@/components/detail-sheet';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import { ListRowActions } from '@/components/list-row-actions';

export default function InspectionsPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      (statusFilter === 'draft' && insp.docstatus === 0) ||
      (statusFilter === 'submitted' && insp.docstatus === 1);

    return matchesSearch && matchesStatus;
  });

  const todayCount = inspections.filter(
    (insp) =>
      format(new Date(insp.inspection_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const pendingCount = inspections.filter((insp) => insp.docstatus === 0).length;
  const issuesCount = inspections.reduce(
    (acc, insp) => acc + (insp.customer_complaints?.length || 0),
    0
  );

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today&apos;s Inspections</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-chart-4/10 p-3">
              <Clock className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Submission</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{issuesCount}</p>
              <p className="text-sm text-muted-foreground">Issues Found</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-chart-3/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {inspections.filter((insp) => insp.job_card).length}
              </p>
              <p className="text-sm text-muted-foreground">Job Cards Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <CardTitle>Vehicle Inspections</CardTitle>
            <CardDescription className="hidden sm:block">
              Vehicle intake inspections and condition reports
            </CardDescription>
          </div>
          <PermittedCreateButton
            module="inspections"
            label="New Inspection"
            onClick={() => navigate('inspection-new')}
          />
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
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
              <p className="py-8 text-center text-sm text-muted-foreground">No inspections found</p>
            ) : (
              filteredInspections.map((insp) => (
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
                          insp.docstatus === 1
                            ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                            : 'bg-chart-4/10 text-chart-4 border-chart-4/20'
                        }
                      >
                        {insp.docstatus === 1 ? 'Submitted' : 'Draft'}
                      </Badge>
                      {(insp.warning_lights?.length || 0) > 0 ? (
                        <Badge
                          variant="outline"
                          className="max-w-36 justify-end text-[11px] leading-tight bg-destructive/10 text-destructive border-destructive/20"
                        >
                          {insp.warning_lights!.length} warning
                          {insp.warning_lights!.length > 1 ? 's' : ''}
                        </Badge>
                      ) : null}
                      <div className="mt-auto">
                        <ListRowActions doctype="Vehicle Inspection" docName={insp.name}>
                          {(insp.docstatus === 0 || (insp.docstatus === 1 && !insp.job_card)) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {insp.docstatus === 0 && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate('inspection-detail', { id: insp.name, mode: 'edit' })
                                    }
                                  >
                                    Continue Editing
                                  </DropdownMenuItem>
                                )}
                                {insp.docstatus === 1 && !insp.job_card && (
                                  <DropdownMenuItem
                                    className="text-primary"
                                    onClick={() =>
                                      navigate('job-card-new', { inspection: insp.name })
                                    }
                                  >
                                    Create Job Card
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
                </div>
              ))
            )}
          </div>

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
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <ClipboardCheck className="h-5 w-5 text-primary" />
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
                            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
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
                        <p className="text-xs text-muted-foreground">
                          {insp.customer_complaints?.length || 0} issues found
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          insp.docstatus === 1
                            ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                            : 'bg-chart-4/10 text-chart-4 border-chart-4/20'
                        }
                      >
                        {insp.docstatus === 1 ? 'Submitted' : 'Draft'}
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
                        {(insp.docstatus === 0 || (insp.docstatus === 1 && !insp.job_card)) && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {insp.docstatus === 0 && (
                                <DropdownMenuItem onClick={() => navigate('inspection-detail', { id: insp.name, mode: 'edit' })}>
                                  Continue Editing
                                </DropdownMenuItem>
                              )}
                              {insp.docstatus === 1 && !insp.job_card && (
                                <DropdownMenuItem
                                  className="text-primary"
                                  onClick={() => navigate('job-card-new', { inspection: insp.name })}
                                >
                                  Create Job Card
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

          <PaginationControls
            page={page}
            pageSize={pageSize}
            totalItems={totalItems}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </CardContent>
      </Card>

      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        title={selectedId || ""}
        subtitle={selectedInspection?.customer}
        badge={selectedInspection ? { label: selectedInspection.docstatus === 1 ? "Submitted" : "Draft" } : undefined}
        isLoading={detailLoading}
        onOpenInDesk={() => window.open(`/app/vehicle-inspection/${selectedId}`, '_blank')}
      >
        {selectedInspection && (
          <>
            <DetailSection title="Inspection Info">
              <DetailRow label="Date" value={selectedInspection.inspection_date ? new Date(selectedInspection.inspection_date).toLocaleDateString() : undefined} />
              <DetailRow label="Company" value={selectedInspection.company_name || selectedInspection.company} />
              <DetailRow label="Service Advisor" value={selectedInspection.service_advisor} />
              <DetailRow label="Job Card" value={selectedInspection.job_card} />
            </DetailSection>
            <DetailSection title="Customer & Vehicle">
              <DetailRow label="Customer" value={selectedInspection.customer} />
              <DetailRow label="VIN / Chassis" value={selectedInspection.vin_chassis} />
              <DetailRow label="Model Year" value={selectedInspection.model_year?.toString()} />
              <DetailRow label="License Plate" value={selectedInspection.license_plate} />
              <DetailRow label="Odometer" value={selectedInspection.odometer ? `${selectedInspection.odometer} ${selectedInspection.odometer_unit || 'km'}` : undefined} />
              <DetailRow label="Fuel Level" value={selectedInspection.fuel_level} />
            </DetailSection>
            {selectedInspection.customer_complaints?.length ? (
              <DetailSection title="Customer Complaints">
                <div className="space-y-3">
                  {selectedInspection.customer_complaints.map((complaint, idx) => (
                    <div key={complaint.name || idx} className="text-sm">
                      <p className="font-medium">
                        {complaint.customer_exact_words || complaint.complaint || '—'}
                      </p>
                      {(complaint.symptom_category || complaint.category || complaint.severity) ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {[complaint.symptom_category || complaint.category, complaint.severity]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </DetailSection>
            ) : null}
            {selectedInspection.docstatus === 1 && !selectedInspection.job_card ? (
              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => {
                    const id = selectedId!;
                    setSelectedId(null);
                    navigate('job-card-new', { inspection: id });
                  }}
                >
                  Create Job Card
                </Button>
              </div>
            ) : null}
          </>
        )}
      </DetailSheet>
    </div>
  );
}
