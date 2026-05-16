'use client';

import { useState, useEffect } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Car,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import { ListRowActions } from '@/components/list-row-actions';
import { useAppointments, useAppointment } from '@/hooks/use-dms';
import { DetailSheet, DetailSection, DetailRow } from '@/components/detail-sheet';
import type { AppointmentStatus, Priority } from '@/types/dms';

function getStatusConfig(status: AppointmentStatus | string | undefined) {
  const configs: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    'Booked': { color: 'bg-chart-1/10 text-chart-1 border-chart-1/20', icon: Calendar },
    'Reminder Sent': { color: 'bg-chart-4/10 text-chart-4 border-chart-4/20', icon: Clock },
    'Arrived': { color: 'bg-chart-3/10 text-chart-3 border-chart-3/20', icon: CheckCircle2 },
    'In Inspection': { color: 'bg-primary/10 text-primary border-primary/20', icon: Car },
    'In Workshop': { color: 'bg-primary/10 text-primary border-primary/20', icon: Car },
    'Ready for Pickup': { color: 'bg-chart-3/10 text-chart-3 border-chart-3/20', icon: CheckCircle2 },
    'Completed': { color: 'bg-chart-3/10 text-chart-3 border-chart-3/20', icon: CheckCircle2 },
    'No-Show': { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
    'Cancelled': { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
    'Rescheduled': { color: 'bg-chart-4/10 text-chart-4 border-chart-4/20', icon: Clock },
  };
  return configs[status || 'Booked'] || configs['Booked'];
}

function formatAppointmentDateTime(value: string | undefined) {
  if (!value) return { date: '—', time: '' };
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return { date: value, time: '' };
  return { date: format(d, 'MMM d, yyyy'), time: format(d, 'h:mm a') };
}

function getPriorityConfig(priority: Priority) {
  const configs: Record<string, { color: string; label: string }> = {
    'Normal': { color: 'bg-muted text-muted-foreground', label: 'Normal' },
    'VIP': { color: 'bg-chart-4/10 text-chart-4 border-chart-4/20', label: 'VIP' },
    'Urgent': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Urgent' },
    'Comeback/Repeat Repair': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Comeback' },
    'Safety Critical': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Safety' },
    'Immobilized': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Immobilized' },
    'Fleet Priority': { color: 'bg-chart-1/10 text-chart-1 border-chart-1/20', label: 'Fleet' },
    'Emergency': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Emergency' },
  };
  return configs[priority] || configs['Normal'];
}

export default function AppointmentsPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: selectedAppointment, isLoading: detailLoading } = useAppointment(selectedId);

  const { data: result, isLoading, error } = useAppointments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const appointments = result?.data;
  const totalItems = result?.total || 0;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, searchQuery]);

  const filteredAppointments = (appointments || []).filter((apt) => {
    const matchesSearch =
      searchQuery === '' ||
      apt.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || apt.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const todayCount = (appointments || []).filter((apt) => {
    if (!apt.appointment_date_time) return false;
    const d = new Date(apt.appointment_date_time);
    return !Number.isNaN(d.getTime()) && format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  }).length;

  const arrivedCount = (appointments || []).filter((apt) => apt.appointment_status === 'Arrived').length;
  const pendingCount = (appointments || []).filter((apt) => apt.appointment_status === 'Booked').length;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today&apos;s Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-chart-3/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">{arrivedCount}</p>
              <p className="text-sm text-muted-foreground">Arrived</p>
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
              <p className="text-sm text-muted-foreground">Pending Arrival</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {(appointments || []).filter((apt) => apt.priority === 'VIP' || apt.priority === 'Urgent').length}
              </p>
              <p className="text-sm text-muted-foreground">Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Service Appointments</CardTitle>
            <CardDescription>Manage customer service appointments</CardDescription>
          </div>
          <Button onClick={() => navigate('appointment-new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
          </Button>
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
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Arrived">Arrived</SelectItem>
                  <SelectItem value="In Inspection">In Inspection</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="No-Show">No-Show</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-36">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Mobile list */}
          <div className="space-y-3 md:hidden">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
            ) : filteredAppointments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No appointments found</p>
            ) : (
              filteredAppointments.map((apt) => {
                const statusConfig = getStatusConfig(apt.appointment_status);
                const priorityConfig = getPriorityConfig(apt.priority);
                const StatusIcon = statusConfig.icon;
                const { date: aptDate, time: aptTime } = formatAppointmentDateTime(apt.appointment_date_time);
                const serviceTypes = (apt.service_type_requested || [])
                  .map((s) => s.service_type)
                  .filter(Boolean)
                  .join(', ');
                return (
                  <button
                    key={apt.name}
                    type="button"
                    onClick={() => setSelectedId(apt.name)}
                    className="w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium">{apt.customer_name}</p>
                        <p className="truncate text-sm text-muted-foreground">{apt.name}</p>
                      </div>
                      <Badge variant="outline" className={statusConfig.color}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {apt.appointment_status}
                      </Badge>
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <p>{apt.vehicle} · {apt.license_plate}</p>
                      <p>{aptDate}{aptTime ? ` · ${aptTime}` : ''}</p>
                      {serviceTypes ? <p className="truncate">{serviceTypes}</p> : null}
                    </div>
                    <Badge variant="outline" className={`mt-2 ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>

          {/* Table — tablet/desktop */}
          <div className="dms-table-panel hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => {
                  const statusConfig = getStatusConfig(apt.appointment_status);
                  const priorityConfig = getPriorityConfig(apt.priority);
                  const StatusIcon = statusConfig.icon;
                  const { date: aptDate, time: aptTime } = formatAppointmentDateTime(apt.appointment_date_time);
                  const serviceTypes = (apt.service_type_requested || [])
                    .map((s) => s.service_type)
                    .filter(Boolean)
                    .join(', ');

                  return (
                    <TableRow key={apt.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); setSelectedId(apt.name); }}
                              className="font-medium hover:text-primary"
                            >
                              {apt.name}
                            </a>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={priorityConfig.color}>
                                {priorityConfig.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {apt.booking_source}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apt.customer_name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {apt.primary_phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apt.vehicle}</p>
                          <p className="text-sm text-muted-foreground">{apt.license_plate}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          <p className="truncate text-sm">
                            {serviceTypes || '—'}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {apt.customer_complaint_summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{aptDate}</p>
                          {aptTime ? (
                            <p className="text-muted-foreground">{aptTime}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {apt.appointment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <ListRowActions doctype="Service Appointment" docName={apt.name}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setSelectedId(apt.name)}>
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate('appointment-detail', { id: apt.name, mode: 'edit' })}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {apt.appointment_status === 'Booked' && (
                                <DropdownMenuItem className="text-chart-3">
                                  Mark as Arrived
                                </DropdownMenuItem>
                              )}
                              {apt.appointment_status === 'Arrived' && (
                                <DropdownMenuItem className="text-primary">
                                  Start Inspection
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                Cancel Appointment
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </ListRowActions>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAppointments.length === 0 && !isLoading && (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No appointments found</p>
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
        subtitle={selectedAppointment?.customer_name}
        badge={selectedAppointment ? { label: selectedAppointment.appointment_status } : undefined}
        isLoading={detailLoading}
        onOpenInDesk={() => window.open(`/app/service-appointment/${selectedId}`, '_blank')}
      >
        {selectedAppointment && (
          <>
            <DetailSection title="Appointment Info">
              <DetailRow label="Status" value={selectedAppointment.appointment_status} />
              <DetailRow label="Booking Source" value={selectedAppointment.booking_source} />
              <DetailRow label="Priority" value={selectedAppointment.priority} />
              <DetailRow label="Date & Time" value={selectedAppointment.appointment_date_time ? new Date(selectedAppointment.appointment_date_time).toLocaleString() : undefined} />
              <DetailRow label="Promised Delivery" value={selectedAppointment.promised_delivery_date_time ? new Date(selectedAppointment.promised_delivery_date_time).toLocaleString() : undefined} />
              <DetailRow label="Est. Duration" value={selectedAppointment.estimated_duration_hours ? `${selectedAppointment.estimated_duration_hours} hrs` : undefined} />
            </DetailSection>
            <DetailSection title="Customer">
              <DetailRow label="Name" value={selectedAppointment.customer_name} />
              <DetailRow label="Phone" value={selectedAppointment.primary_phone} />
              <DetailRow label="Email" value={selectedAppointment.customer_email} />
            </DetailSection>
            <DetailSection title="Vehicle">
              <DetailRow label="VIN" value={selectedAppointment.vin_chassis} />
              <DetailRow label="License Plate" value={selectedAppointment.license_plate} />
              <DetailRow label="Odometer" value={selectedAppointment.current_odometer ? `${selectedAppointment.current_odometer} km` : undefined} />
              <DetailRow label="Warranty" value={selectedAppointment.warranty_status} />
            </DetailSection>
            <DetailSection title="Assignment">
              <DetailRow label="Service Advisor" value={selectedAppointment.assigned_service_advisor} />
              <DetailRow label="Service Bay" value={selectedAppointment.assigned_bay} />
              <DetailRow label="Arrival Status" value={selectedAppointment.vehicle_arrival_status} />
            </DetailSection>
            {selectedAppointment.customer_complaint_summary && (
              <DetailSection title="Complaints">
                <p className="text-sm">{selectedAppointment.customer_complaint_summary}</p>
              </DetailSection>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setSelectedId(null); navigate('appointment-detail', { id: selectedId! }); }}>
                Open Full Details
              </Button>
            </div>
          </>
        )}
      </DetailSheet>
    </div>
  );
}
