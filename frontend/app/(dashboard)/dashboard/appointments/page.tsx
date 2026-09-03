'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { format } from 'date-fns';
import { mutate } from 'swr';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Search,
  Filter,
  Phone,
  Mail,
  Car,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  CalendarClock,
  Ban,
  MessageCircle,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import { ListRowActions } from '@/components/list-row-actions';
import { cn, vehicleListingLines } from '@/lib/utils';
import {
  CancelAppointmentDialog,
  ConfirmAppointmentDialog,
  RescheduleAppointmentDialog,
  SendReminderDialog,
} from '@/components/appointments/appointment-action-dialogs';
import { useAppointments, useAppointment } from '@/hooks/use-dms';
import { DetailSheet, DetailSection, DetailRow } from '@/components/detail-sheet';
import * as appointmentsSvc from '@/services/appointments';
import type { AppointmentStatus, Priority, ServiceAppointment } from '@/types/dms';
import {
  ARRIVED_STATUSES,
  TERMINAL_STATUSES,
  normalizeDocstatus,
  sendReminderBlockReason,
  shouldShowSendReminderAction,
  getAppointmentPhone,
} from '@/lib/appointment-workflow';


function canConfirmAppointment(apt: ServiceAppointment) {
  return (
    normalizeDocstatus(apt.docstatus) === 0 &&
    !TERMINAL_STATUSES.has(apt.status) &&
    !ARRIVED_STATUSES.has(apt.status)
  );
}

function canMarkArrived(apt: ServiceAppointment) {
  return (
    normalizeDocstatus(apt.docstatus) === 1 &&
    ['Requested', 'Scheduled', 'Confirmed', 'Booked', 'Reminder Sent', 'Rescheduled'].includes(
      apt.status
    )
  );
}

function canReschedule(apt: ServiceAppointment) {
  return (
    apt.docstatus < 2 &&
    !TERMINAL_STATUSES.has(apt.status) &&
    !ARRIVED_STATUSES.has(apt.status)
  );
}

function canCancel(apt: ServiceAppointment) {
  return normalizeDocstatus(apt.docstatus) < 2 && apt.status !== 'Completed';
}

function getStatusConfig(status: AppointmentStatus | string | undefined) {
  const configs: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
    'Draft': { color: 'bg-muted text-muted-foreground border-muted-foreground/20', icon: Clock },
    'Requested': { color: 'bg-sky-500/10 text-sky-800 border-sky-500/20', icon: Calendar },
    'Scheduled': { color: 'bg-chart-1/10 text-chart-1 border-chart-1/20', icon: Calendar },
    'Confirmed': { color: 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20', icon: CheckCircle2 },
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
  const { navigate, viewParams } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionTarget, setActionTarget] = useState<ServiceAppointment | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [showMobileStats, setShowMobileStats] = useState(false);

  const { data: selectedAppointment, isLoading: detailLoading } = useAppointment(selectedId);

  const refreshAppointments = useCallback(async () => {
    await mutate((key) => Array.isArray(key) && key[0] === 'appointments');
    if (selectedId) {
      await mutate(['appointment', selectedId]);
    }
  }, [selectedId]);

  useEffect(() => {
    const date = viewParams.get('date');
    if (date) {
      setDateFilter(date);
    }
  }, [viewParams]);

  const { data: result, isLoading, error } = useAppointments({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    date: dateFilter || undefined,
    search: searchQuery || undefined,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  const appointments = result?.data;
  const totalItems = result?.total || 0;

  useEffect(() => {
    setPage(1);
  }, [statusFilter, priorityFilter, searchQuery, dateFilter]);

  const filteredAppointments = (appointments || []).filter((apt) => {
    const matchesSearch =
      searchQuery === '' ||
      apt.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vehicle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vehicle_model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vin_chassis?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vin_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.license_plate?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === 'all' || apt.priority === priorityFilter;

    return matchesSearch && matchesPriority;
  });

  const todayCount = (appointments || []).filter((apt) => {
    if (!apt.appointment_date_time) return false;
    const d = new Date(apt.appointment_date_time);
    return !Number.isNaN(d.getTime()) && format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  }).length;

  const arrivedCount = (appointments || []).filter((apt) =>
    ARRIVED_STATUSES.has(apt.status)
  ).length;
  const pendingCount = (appointments || []).filter(
    (apt) =>
      normalizeDocstatus(apt.docstatus) === 0 &&
      (apt.status === 'Draft' ||
        apt.status === 'Requested' ||
        apt.status === 'Scheduled' ||
        apt.status === 'Confirmed' ||
        apt.status === 'Booked')
  ).length;

  const handleConfirm = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      await appointmentsSvc.confirmAppointment(actionTarget.name);
      toast.success('Appointment confirmed');
      setConfirmOpen(false);
      await refreshAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkArrived = async (apt: ServiceAppointment) => {
    setActionLoading(true);
    try {
      await appointmentsSvc.markArrived(apt.name);
      toast.success('Marked as arrived');
      await refreshAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to mark as arrived');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (payload: { reason?: string; notes?: string }) => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      await appointmentsSvc.cancelAppointment(actionTarget.name, payload);
      toast.success('Appointment cancelled');
      setCancelOpen(false);
      await refreshAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (payload: {
    appointment_date_time: string;
    promised_delivery_date_time?: string;
  }) => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      await appointmentsSvc.rescheduleAppointment(actionTarget.name, payload);
      toast.success('Appointment rescheduled');
      setRescheduleOpen(false);
      await refreshAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reschedule appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminder = async () => {
    if (!actionTarget) return;
    setActionLoading(true);
    try {
      await appointmentsSvc.sendAppointmentReminder(actionTarget.name);
      toast.success('WhatsApp reminder sent');
      setReminderOpen(false);
      await refreshAppointments();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reminder');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-4 sm:gap-6">
      {/* Main listing — first on mobile */}
      <Card className="order-1 md:order-2">
        <CardHeader className="flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <CardTitle className="hidden md:block">Service Appointments</CardTitle>
            {!isLoading && totalItems > 0 ? (
              <p className="mt-1 text-sm text-muted-foreground md:hidden">
                {filteredAppointments.length === totalItems
                  ? `${totalItems} appointment${totalItems === 1 ? '' : 's'}`
                  : `${filteredAppointments.length} of ${totalItems} shown`}
              </p>
            ) : null}
          </div>
          <PermittedCreateButton
            module="appointments"
            label="New Appointment"
            onClick={() => navigate('appointment-new')}
          />
        </CardHeader>
        <CardContent className="min-w-0">
          {dateFilter && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                Date: {format(new Date(`${dateFilter}T12:00:00`), 'MMM d, yyyy')}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDateFilter('');
                  navigate('appointments');
                }}
              >
                Clear date
              </Button>
            </div>
          )}

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
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-40"
                aria-label="Filter by date"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Requested">Requested</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Confirmed">Confirmed</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Reminder Sent">Reminder Sent</SelectItem>
                  <SelectItem value="Arrived">Arrived</SelectItem>
                  <SelectItem value="In Inspection">In Inspection</SelectItem>
                  <SelectItem value="In Workshop">In Workshop</SelectItem>
                  <SelectItem value="Ready for Pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Rescheduled">Rescheduled</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                  <SelectItem value="No-Show">No-Show</SelectItem>
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
              <div className="rounded-lg border border-dashed py-10 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground/40" />
                <p className="mt-3 text-sm font-medium">No appointments found</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Try adjusting search or filters, or create a new appointment
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Tap a row for details
                </p>
                {filteredAppointments.map((apt) => {
                const statusConfig = getStatusConfig(apt.status);
                const priorityConfig = getPriorityConfig(apt.priority);
                const StatusIcon = statusConfig.icon;
                const { date: aptDate, time: aptTime } = formatAppointmentDateTime(apt.appointment_date_time);
                const serviceTypes = (apt.service_type_requested || [])
                  .map((s) => s.service_type)
                  .filter(Boolean)
                  .join(', ');
                const vehicle = vehicleListingLines({
                  vin: apt.vin_number || apt.vin_chassis,
                  model: apt.vehicle_model || apt.vehicle,
                  license: apt.license_plate,
                });
                return (
                  <div
                    key={apt.name}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <div className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedId(apt.name)}
                        className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
                      >
                        <p className="font-medium">{apt.customer_name}</p>
                        <p className="truncate text-sm text-muted-foreground">{apt.name}</p>
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">{vehicle.primary}</p>
                          {vehicle.secondary ? <p>{vehicle.secondary}</p> : null}
                          <p>{aptDate}{aptTime ? ` · ${aptTime}` : ''}</p>
                          {serviceTypes ? <p className="truncate">{serviceTypes}</p> : null}
                        </div>
                        <Badge variant="outline" className={`mt-2 ${priorityConfig.color}`}>
                          {priorityConfig.label}
                        </Badge>
                      </button>
                      <div className="flex shrink-0 flex-col items-end gap-2 self-stretch">
                        <Badge
                          variant="outline"
                          className={`max-w-38 justify-end text-[11px] leading-tight ${statusConfig.color}`}
                        >
                          <StatusIcon className="mr-1 h-3 w-3 shrink-0" />
                          <span className="truncate">{apt.status}</span>
                        </Badge>
                        <div className="mt-auto">
                          <ListRowActions doctype="Service Appointment" docName={apt.name}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() =>
                                    navigate('appointment-new', { id: apt.name })
                                  }
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {canConfirmAppointment(apt) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setActionTarget(apt);
                                      setConfirmOpen(true);
                                    }}
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Confirm appointment
                                  </DropdownMenuItem>
                                )}
                                {shouldShowSendReminderAction(apt) && (
                                  <DropdownMenuItem
                                    disabled={Boolean(sendReminderBlockReason(apt)) || actionLoading}
                                    title={sendReminderBlockReason(apt) || undefined}
                                    onClick={() => {
                                      if (sendReminderBlockReason(apt)) return;
                                      setActionTarget(apt);
                                      setReminderOpen(true);
                                    }}
                                  >
                                    <MessageCircle className="h-4 w-4 mr-2" />
                                    Send reminder
                                  </DropdownMenuItem>
                                )}
                                {canMarkArrived(apt) && (
                                  <DropdownMenuItem
                                    disabled={actionLoading}
                                    onClick={() => void handleMarkArrived(apt)}
                                  >
                                    <Car className="h-4 w-4 mr-2" />
                                    Mark as arrived
                                  </DropdownMenuItem>
                                )}
                                {apt.status === 'Arrived' && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      navigate('inspection-new', { appointment: apt.name })
                                    }
                                  >
                                    <Car className="h-4 w-4 mr-2" />
                                    Start inspection
                                  </DropdownMenuItem>
                                )}
                                {canReschedule(apt) && (
                                  <DropdownMenuItem
                                    onClick={() => {
                                      setActionTarget(apt);
                                      setRescheduleOpen(true);
                                    }}
                                  >
                                    <CalendarClock className="h-4 w-4 mr-2" />
                                    Reschedule
                                  </DropdownMenuItem>
                                )}
                                {canCancel(apt) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => {
                                        setActionTarget(apt);
                                        setCancelOpen(true);
                                      }}
                                    >
                                      <Ban className="h-4 w-4 mr-2" />
                                      Cancel appointment
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </ListRowActions>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </>
            )}
          </div>

          {filteredAppointments.length > 0 ? (
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
                  const statusConfig = getStatusConfig(apt.status);
                  const priorityConfig = getPriorityConfig(apt.priority);
                  const StatusIcon = statusConfig.icon;
                  const { date: aptDate, time: aptTime } = formatAppointmentDateTime(apt.appointment_date_time);
                  const serviceTypes = (apt.service_type_requested || [])
                    .map((s) => s.service_type)
                    .filter(Boolean)
                    .join(', ');
                  const vehicle = vehicleListingLines({
                    vin: apt.vin_number || apt.vin_chassis,
                    model: apt.vehicle_model || apt.vehicle,
                    license: apt.license_plate,
                  });

                  return (
                    <TableRow key={apt.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Calendar className="h-3.5 w-3.5 text-primary" />
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
                              <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
                              {getAppointmentPhone(apt) || '—'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{vehicle.primary}</p>
                          {vehicle.secondary ? (
                            <p className="text-sm text-muted-foreground">{vehicle.secondary}</p>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          <p className="truncate text-sm">
                            {serviceTypes || '—'}
                          </p>
                          <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
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
                          {apt.status}
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
                              <DropdownMenuItem onClick={() => navigate('appointment-new', { id: apt.name })}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {canConfirmAppointment(apt) && (
                                <DropdownMenuItem
                                  className="text-primary"
                                  onClick={() => {
                                    setActionTarget(apt);
                                    setConfirmOpen(true);
                                  }}
                                >
                                  <CheckCircle2 className="h-4 w-4 mr-2" />
                                  Confirm appointment
                                </DropdownMenuItem>
                              )}
                              {shouldShowSendReminderAction(apt) && (
                                <DropdownMenuItem
                                  disabled={Boolean(sendReminderBlockReason(apt)) || actionLoading}
                                  title={sendReminderBlockReason(apt) || undefined}
                                  onClick={() => {
                                    if (sendReminderBlockReason(apt)) return;
                                    setActionTarget(apt);
                                    setReminderOpen(true);
                                  }}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Send reminder
                                  {sendReminderBlockReason(apt) ? (
                                    <span className="ml-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                                      ({sendReminderBlockReason(apt)})
                                    </span>
                                  ) : null}
                                </DropdownMenuItem>
                              )}
                              {canMarkArrived(apt) && (
                                <DropdownMenuItem
                                  className="text-chart-3"
                                  disabled={actionLoading}
                                  onClick={() => void handleMarkArrived(apt)}
                                >
                                  <Car className="h-4 w-4 mr-2" />
                                  Mark as arrived
                                </DropdownMenuItem>
                              )}
                              {apt.status === 'Arrived' && (
                                <DropdownMenuItem
                                  className="text-primary"
                                  onClick={() =>
                                    navigate('inspection-new', { appointment: apt.name })
                                  }
                                >
                                  <Car className="h-4 w-4 mr-2" />
                                  Start inspection
                                </DropdownMenuItem>
                              )}
                              {canReschedule(apt) && (
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionTarget(apt);
                                    setRescheduleOpen(true);
                                  }}
                                >
                                  <CalendarClock className="h-4 w-4 mr-2" />
                                  Reschedule
                                </DropdownMenuItem>
                              )}
                              {canCancel(apt) && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={() => {
                                      setActionTarget(apt);
                                      setCancelOpen(true);
                                    }}
                                  >
                                    <Ban className="h-4 w-4 mr-2" />
                                    Cancel appointment
                                  </DropdownMenuItem>
                                </>
                              )}
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
            <div className="hidden py-12 text-center md:block">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No appointments found</p>
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

      {/* Summary stats — hidden on mobile by default */}
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
              <div className="shrink-0 rounded-full bg-primary/10 p-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">{todayCount}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Today&apos;s Appointments
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="shrink-0 rounded-full bg-chart-3/10 p-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">{arrivedCount}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Arrived</p>
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="shrink-0 rounded-full bg-chart-4/10 p-1.5">
                <Clock className="h-3.5 w-3.5 text-chart-4" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">{pendingCount}</p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                  Pending Arrival
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="dms-kpi-card">
            <CardContent className="flex items-center gap-2.5 px-3.5 py-3">
              <div className="shrink-0 rounded-full bg-destructive/10 p-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              </div>
              <div className="min-w-0">
                <p className="dms-stat-value text-xl sm:text-2xl">
                  {(appointments || []).filter((apt) => apt.priority === 'VIP' || apt.priority === 'Urgent').length}
                </p>
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Priority</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        title={selectedId || ""}
        subtitle={selectedAppointment?.customer_name}
        badge={selectedAppointment ? { label: selectedAppointment.status } : undefined}
        isLoading={detailLoading}
        onOpenInDesk={() => window.open(`/app/service-appointment/${selectedId}`, '_blank')}
      >
        {selectedAppointment && (
          <>
            <DetailSection title="Appointment Info">
              <DetailRow label="Status" value={selectedAppointment.status} />
              <DetailRow label="Booking Source" value={selectedAppointment.booking_source} />
              <DetailRow label="Priority" value={selectedAppointment.priority} />
              <DetailRow label="Date & Time" value={selectedAppointment.appointment_date_time ? new Date(selectedAppointment.appointment_date_time).toLocaleString() : undefined} />
              <DetailRow label="Promised Delivery" value={selectedAppointment.promised_delivery_date_time ? new Date(selectedAppointment.promised_delivery_date_time).toLocaleString() : undefined} />
              <DetailRow label="Est. Duration" value={selectedAppointment.estimated_duration_hours ? `${selectedAppointment.estimated_duration_hours} hrs` : undefined} />
            </DetailSection>
            <DetailSection title="Customer">
              <DetailRow label="Name" value={selectedAppointment.customer_name} />
              <DetailRow label="Phone" value={getAppointmentPhone(selectedAppointment) || undefined} />
              {selectedAppointment.mobile_no &&
                selectedAppointment.mobile_no !== selectedAppointment.primary_phone ? (
                <DetailRow label="Mobile No" value={selectedAppointment.mobile_no} />
              ) : null}
              <DetailRow label="Email" value={selectedAppointment.customer_email} />
            </DetailSection>
            <DetailSection title="Vehicle">
              <DetailRow label="VIN" value={selectedAppointment.vin_number || selectedAppointment.vin_chassis} />
              <DetailRow label="Model" value={selectedAppointment.vehicle_model || selectedAppointment.vehicle} />
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
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              {selectedAppointment && canConfirmAppointment(selectedAppointment) && (
                <Button
                  size="sm"
                  onClick={() => {
                    setActionTarget(selectedAppointment);
                    setConfirmOpen(true);
                  }}
                >
                  Confirm
                </Button>
              )}
              {selectedAppointment && shouldShowSendReminderAction(selectedAppointment) && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={Boolean(sendReminderBlockReason(selectedAppointment))}
                  title={sendReminderBlockReason(selectedAppointment) || undefined}
                  onClick={() => {
                    if (sendReminderBlockReason(selectedAppointment)) return;
                    setActionTarget(selectedAppointment);
                    setReminderOpen(true);
                  }}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Send reminder
                </Button>
              )}
              {selectedAppointment && canMarkArrived(selectedAppointment) && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={actionLoading}
                  onClick={() => void handleMarkArrived(selectedAppointment)}
                >
                  Mark arrived
                </Button>
              )}
              {selectedAppointment?.status === 'Arrived' && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    navigate('inspection-new', { appointment: selectedAppointment.name })
                  }
                >
                  Start inspection
                </Button>
              )}
            </div>
          </>
        )}
      </DetailSheet>

      <ConfirmAppointmentDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleConfirm}
        loading={actionLoading}
      />
      <CancelAppointmentDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        onCancel={handleCancel}
        loading={actionLoading}
      />
      <RescheduleAppointmentDialog
        open={rescheduleOpen}
        onOpenChange={setRescheduleOpen}
        initialAppointmentDateTime={actionTarget?.appointment_date_time}
        initialPromisedDateTime={actionTarget?.promised_delivery_date_time}
        onReschedule={handleReschedule}
        loading={actionLoading}
      />
      <SendReminderDialog
        open={reminderOpen}
        onOpenChange={setReminderOpen}
        onSend={handleSendReminder}
        loading={actionLoading}
        customerName={actionTarget?.customer_name}
        phone={actionTarget ? getAppointmentPhone(actionTarget) : undefined}
      />
    </div>
  );
}
