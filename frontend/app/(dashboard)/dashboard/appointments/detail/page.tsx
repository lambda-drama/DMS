'use client';

import { useState } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  Edit,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Play,
  User,
  Wrench,
  AlertTriangle,
  FileText,
  ClipboardCheck,
} from 'lucide-react';
import type { AppointmentStatus, ServiceAppointment } from '@/types/dms';
import { useAppointment } from '@/hooks/use-dms';
import * as appointmentsSvc from '@/services/appointments';
import { getAppointmentPhone, normalizeDocstatus } from '@/lib/appointment-workflow';
import { vehicleListingLines } from '@/lib/utils';

function parseDateTime(value?: string | null) {
  if (!value) return null;
  const normalized = value.includes('T') ? value : value.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatMoney(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return Number(value).toLocaleString();
}

function getStatusConfig(status: AppointmentStatus) {
  const configs: Record<AppointmentStatus, { color: string; bgColor: string }> = {
    Draft: { color: 'text-muted-foreground', bgColor: 'bg-muted border-muted-foreground/20' },
    Requested: { color: 'text-sky-800', bgColor: 'bg-sky-500/10 border-sky-500/20' },
    Scheduled: { color: 'text-chart-1', bgColor: 'bg-chart-1/10 border-chart-1/20' },
    Confirmed: { color: 'text-emerald-800', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
    Booked: { color: 'text-chart-1', bgColor: 'bg-chart-1/10 border-chart-1/20' },
    'Reminder Sent': { color: 'text-chart-4', bgColor: 'bg-chart-4/10 border-chart-4/20' },
    Arrived: { color: 'text-chart-3', bgColor: 'bg-chart-3/10 border-chart-3/20' },
    'In Inspection': { color: 'text-primary', bgColor: 'bg-primary/10 border-primary/20' },
    'In Workshop': { color: 'text-primary', bgColor: 'bg-primary/10 border-primary/20' },
    'Ready for Pickup': { color: 'text-chart-3', bgColor: 'bg-chart-3/10 border-chart-3/20' },
    Completed: { color: 'text-chart-3', bgColor: 'bg-chart-3/10 border-chart-3/20' },
    'No-Show': { color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/20' },
    Cancelled: { color: 'text-destructive', bgColor: 'bg-destructive/10 border-destructive/20' },
    Rescheduled: { color: 'text-chart-4', bgColor: 'bg-chart-4/10 border-chart-4/20' },
  };
  return configs[status] || configs.Booked;
}

function canMarkArrived(apt: ServiceAppointment) {
  return (
    normalizeDocstatus(apt.docstatus) === 1 &&
    ['Requested', 'Scheduled', 'Confirmed', 'Booked', 'Reminder Sent', 'Rescheduled'].includes(
      apt.status
    )
  );
}

function vehicleLabel(appointment: ServiceAppointment) {
  return vehicleListingLines({
    vin: appointment.vin_number || appointment.vin_chassis,
    model: appointment.vehicle_model || appointment.vehicle,
    license: appointment.license_plate,
  });
}

export default function AppointmentDetailPage() {
  const { viewParams, navigate } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data: appointment, isLoading, error, mutate } = useAppointment(id || null);
  const [isStartingInspection, setIsStartingInspection] = useState(false);
  const [isMarkingArrived, setIsMarkingArrived] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">No appointment ID provided</p>
        <Button variant="outline" onClick={() => navigate('appointments')}>
          Back to Appointments
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">Failed to load appointment</p>
        <Button variant="outline" onClick={() => navigate('appointments')}>
          Back to Appointments
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(appointment.status);
  const vehicle = vehicleLabel(appointment);
  const phone = getAppointmentPhone(appointment);
  const appointmentAt = parseDateTime(appointment.appointment_date_time);
  const promisedAt = parseDateTime(appointment.promised_delivery_date_time);
  const arrivedAt = parseDateTime(appointment.arrived_date_time);
  const advisorName =
    appointment.assigned_service_advisor_name ||
    appointment.assigned_service_advisor ||
    appointment.preferred_advisor ||
    'Not assigned';
  const services = appointment.service_type_requested || [];
  const canCancel =
    appointment.status !== 'Cancelled' &&
    appointment.status !== 'Completed' &&
    appointment.status !== 'No-Show';

  async function handleStartInspection() {
    setIsStartingInspection(true);
    try {
      navigate('inspection-new', { appointment: appointment.name });
    } finally {
      setIsStartingInspection(false);
    }
  }

  async function handleMarkArrived() {
    setIsMarkingArrived(true);
    try {
      await appointmentsSvc.markArrived(appointment.name);
      toast.success('Customer marked as arrived');
      await mutate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to mark arrived');
    } finally {
      setIsMarkingArrived(false);
    }
  }

  async function handleCancel() {
    setIsCancelling(true);
    try {
      await appointmentsSvc.cancelAppointment(appointment.name);
      toast.success('Appointment cancelled');
      setShowCancelDialog(false);
      await mutate();
      navigate('appointments');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to cancel appointment');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('appointments')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{appointment.name}</h1>
              <Badge variant="outline" className={statusConfig.bgColor}>
                {appointment.status}
              </Badge>
              {appointment.priority && appointment.priority !== 'Normal' && (
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                  {appointment.priority}
                </Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {appointment.booking_source ? `Created via ${appointment.booking_source}` : 'Service appointment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {appointment.status !== 'Cancelled' && appointment.status !== 'Completed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('appointment-new', { id: appointment.name })}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          )}
          {canMarkArrived(appointment) && (
            <Button size="sm" onClick={handleMarkArrived} disabled={isMarkingArrived}>
              {isMarkingArrived ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Mark Arrived
            </Button>
          )}
          {appointment.status === 'Arrived' && !appointment.inspection && (
            <Button size="sm" onClick={handleStartInspection} disabled={isStartingInspection}>
              {isStartingInspection ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Start Inspection
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-3.5 w-3.5 text-primary" />
                Customer & Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Customer Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{appointment.customer_name || appointment.customer || '—'}</p>
                        {appointment.customer_name && appointment.customer ? (
                          <p className="text-sm text-muted-foreground">{appointment.customer}</p>
                        ) : null}
                      </div>
                    </div>
                    {phone ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${phone}`} className="hover:text-primary">
                          {phone}
                        </a>
                      </div>
                    ) : null}
                    {appointment.customer_email ? (
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${appointment.customer_email}`} className="hover:text-primary">
                          {appointment.customer_email}
                        </a>
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-muted-foreground">Vehicle Information</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Car className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{vehicle.primary}</p>
                        {vehicle.secondary ? (
                          <p className="text-sm text-muted-foreground">{vehicle.secondary}</p>
                        ) : null}
                      </div>
                    </div>
                    {appointment.current_odometer ? (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Odometer: </span>
                        <span>{appointment.current_odometer.toLocaleString()} km</span>
                      </div>
                    ) : null}
                    {appointment.warranty_status ? (
                      <Badge
                        variant="outline"
                        className={
                          appointment.warranty_status === 'Active'
                            ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        Warranty: {appointment.warranty_status}
                      </Badge>
                    ) : null}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Wrench className="h-3.5 w-3.5 text-primary" />
                Service Details
              </CardTitle>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4 sm:space-y-6">
              <div>
                <h4 className="mb-3 text-sm font-medium text-muted-foreground">Requested Services</h4>
                {services.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {services.map((service, i) => (
                      <Badge key={`${service.service_type || i}`} variant="secondary" className="py-1.5">
                        {service.service_type}
                        {service.estimated_hours ? (
                          <span className="ml-1 text-muted-foreground">({service.estimated_hours}h)</span>
                        ) : null}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No services recorded</p>
                )}
              </div>

              <div>
                <h4 className="mb-2 text-sm font-medium text-muted-foreground">Customer Complaint</h4>
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm leading-relaxed">
                    {appointment.customer_complaint_summary || '—'}
                  </p>
                </div>
              </div>

              {appointment.special_instructions ? (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-muted-foreground">
                    Special Instructions
                  </h4>
                  <div className="flex items-start gap-2 rounded-lg border border-chart-4/20 bg-chart-4/5 p-4">
                    <AlertTriangle className="mt-0.5 h-4 w-4 text-chart-4" />
                    <p className="text-sm">{appointment.special_instructions}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-3.5 w-3.5 text-primary" />
                Linked Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-lg border p-4 ${
                    appointment.inspection ? 'border-chart-3/20 bg-chart-3/5' : 'border-dashed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardCheck
                      className={`h-5 w-5 ${
                        appointment.inspection ? 'text-chart-3' : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="font-medium">Vehicle Inspection</p>
                      {appointment.inspection ? (
                        <button
                          type="button"
                          onClick={() => navigate('inspection-detail', { id: appointment.inspection! })}
                          className="text-sm text-primary hover:underline"
                        >
                          {appointment.inspection}
                        </button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not created yet</p>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-lg border p-4 ${
                    appointment.job_card ? 'border-chart-3/20 bg-chart-3/5' : 'border-dashed'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Wrench
                      className={`h-5 w-5 ${
                        appointment.job_card ? 'text-chart-3' : 'text-muted-foreground'
                      }`}
                    />
                    <div>
                      <p className="font-medium">Job Card</p>
                      {appointment.job_card ? (
                        <button
                          type="button"
                          onClick={() => navigate('job-card-detail', { id: appointment.job_card! })}
                          className="text-sm text-primary hover:underline"
                        >
                          {appointment.job_card}
                        </button>
                      ) : (
                        <p className="text-sm text-muted-foreground">Not created yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="min-w-0 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-primary" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Appointment</p>
                {appointmentAt ? (
                  <>
                    <p className="font-medium">{format(appointmentAt, 'MMM d, yyyy')}</p>
                    <p className="text-sm">{format(appointmentAt, 'h:mm a')}</p>
                  </>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Promised Delivery</p>
                {promisedAt ? (
                  <>
                    <p className="font-medium">{format(promisedAt, 'MMM d, yyyy')}</p>
                    <p className="text-sm">{format(promisedAt, 'h:mm a')}</p>
                  </>
                ) : (
                  <p className="font-medium">—</p>
                )}
              </div>
              {arrivedAt ? (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground">Arrived</p>
                    <p className="font-medium">{format(arrivedAt, 'h:mm a')}</p>
                  </div>
                </>
              ) : null}
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground">Estimated Duration</p>
                <p className="font-medium">
                  {appointment.estimated_duration_hours
                    ? `${appointment.estimated_duration_hours} hours`
                    : '—'}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4 text-primary" />
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Service Advisor</p>
                <p className="font-medium">{advisorName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Service Bay</p>
                <p className="font-medium">{appointment.assigned_bay || 'Not assigned'}</p>
              </div>
            </CardContent>
          </Card>

          {(appointment.estimated_labor_cost ||
            appointment.estimated_parts_cost ||
            appointment.estimated_total_cost) ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Estimated Cost</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Labor</span>
                  <span>{formatMoney(appointment.estimated_labor_cost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parts</span>
                  <span>{formatMoney(appointment.estimated_parts_cost)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatMoney(appointment.estimated_total_cost)}</span>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {appointment.status_history ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-primary" />
                  Status History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground">
                  {appointment.status_history}
                </pre>
              </CardContent>
            </Card>
          ) : null}

          {canCancel ? (
            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <Button
                  variant="outline"
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel Appointment
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>

      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Appointment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Keep Appointment</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                void handleCancel();
              }}
              disabled={isCancelling}
            >
              {isCancelling ? 'Cancelling…' : 'Cancel Appointment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
