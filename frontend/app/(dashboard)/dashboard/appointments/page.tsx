'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { PermittedCreateButton } from '@/components/permitted-create-button';
import { format } from 'date-fns';
import { mutate } from 'swr';
import { toast } from 'sonner';
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
} from 'lucide-react';
import { PaginationControls } from '@/components/pagination-controls';
import { ListRowActions } from '@/components/list-row-actions';
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
    ['Booked', 'Reminder Sent', 'Rescheduled'].includes(apt.status)
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

function hasMobileMenuActions(apt: ServiceAppointment) {
  return (
    canConfirmAppointment(apt) ||
    shouldShowSendReminderAction(apt) ||
    canMarkArrived(apt)
  );
}

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
    (apt) => normalizeDocstatus(apt.docstatus) === 0 && apt.status === 'Booked'
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
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="shrink-0 rounded-lg bg-primary/10 p-2 sm:p-3">
              <Calendar className="h-4 w-4 text-primary sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold sm:text-2xl">{todayCount}</p>
              <p className="text-[13px] leading-snug text-muted-foreground sm:text-sm">
                Today&apos;s Appointments
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="shrink-0 rounded-lg bg-chart-3/10 p-2 sm:p-3">
              <CheckCircle2 className="h-4 w-4 text-chart-3 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold sm:text-2xl">{arrivedCount}</p>
              <p className="text-[13px] leading-snug text-muted-foreground sm:text-sm">Arrived</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="shrink-0 rounded-lg bg-chart-4/10 p-2 sm:p-3">
              <Clock className="h-4 w-4 text-chart-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold sm:text-2xl">{pendingCount}</p>
              <p className="text-[13px] leading-snug text-muted-foreground sm:text-sm">
                Pending Arrival
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-3 sm:gap-4 sm:p-4">
            <div className="shrink-0 rounded-lg bg-destructive/10 p-2 sm:p-3">
              <AlertTriangle className="h-4 w-4 text-destructive sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold sm:text-2xl">
                {(appointments || []).filter((apt) => apt.priority === 'VIP' || apt.priority === 'Urgent').length}
              </p>
              <p className="text-[13px] leading-snug text-muted-foreground sm:text-sm">Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <CardTitle>Service Appointments</CardTitle>
            <CardDescription className="hidden sm:block">
              Manage customer service appointments
            </CardDescription>
          </div>
          <PermittedCreateButton
            module="appointments"
            label="New Appointment"
            onClick={() => navigate('appointment-new')}
          />
        </CardHeader>
        <CardContent>
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
                const statusConfig = getStatusConfig(apt.status);
                const priorityConfig = getPriorityConfig(apt.priority);
                const StatusIcon = statusConfig.icon;
                const { date: aptDate, time: aptTime } = formatAppointmentDateTime(apt.appointment_date_time);
                const serviceTypes = (apt.service_type_requested || [])
                  .map((s) => s.service_type)
                  .filter(Boolean)
                  .join(', ');
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
                          <p>{apt.vehicle} · {apt.license_plate}</p>
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
                            {hasMobileMenuActions(apt) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
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
                              </DropdownMenuContent>
                            </DropdownMenu>
                            )}
                          </ListRowActions>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  const statusConfig = getStatusConfig(apt.status);
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
                              {getAppointmentPhone(apt) || '—'}
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
                              <DropdownMenuItem onClick={() => navigate('appointment-detail', { id: apt.name, mode: 'edit' })}>
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
                                    <span className="ml-1 text-xs text-muted-foreground">
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
