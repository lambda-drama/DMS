'use client';

import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from '@/components/job-card/status-badge';
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Wrench,
  Users,
  ArrowRight,
  Timer,
  Loader2,
  BarChart3,
  DollarSign,
} from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';
import { usePermissions } from '@/contexts/permissions-context';
import { useDashboard } from '@/hooks/use-dms';
import { cn } from '@/lib/utils';
import type { JobCardStatus } from '@/types/dms';

function getAppointmentStatusColor(status: string) {
  const colors: Record<string, string> = {
    Booked: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    'Reminder Sent': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    Arrived: 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    'In Inspection': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    'In Workshop': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    'Ready for Pickup': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    Completed: 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    Rescheduled: 'bg-muted text-muted-foreground border-muted',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    VIP: 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    Urgent: 'bg-destructive/10 text-destructive border-destructive/20',
    Normal: 'bg-muted text-muted-foreground border-muted',
  };
  return colors[priority] || 'bg-muted text-muted-foreground';
}

function formatAppointmentsDelta(delta: number) {
  if (delta > 0) return `+${delta} from yesterday`;
  if (delta < 0) return `${delta} from yesterday`;
  return 'Same as yesterday';
}

function formatMoney(amount: number, currency?: string) {
  const selectedCurrency = (currency || '').trim();
  try {
    if (selectedCurrency) {
      return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: selectedCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount || 0);
    }
  } catch {
    // Fall back to numeric rendering when currency code is invalid.
  }
  return (amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function DashboardPage() {
  const { navigate } = useNavigation();
  const { canCreate, canAccessView } = usePermissions();
  const canUseReports = canAccessView('reports');
  const { data, isLoading, error } = useDashboard();

  const stats = data?.stats;
  const brd = data?.brd_kpis;
  const activeJobs = data?.active_job_cards ?? [];
  const todayAppointments = data?.today_appointments ?? [];
  const serviceBays = data?.service_bays ?? [];

  const todayDate = format(new Date(), 'yyyy-MM-dd');

  const statCards = stats
    ? [
        {
          title: "Today's Appointments",
          value: String(stats.today_appointments),
          change: formatAppointmentsDelta(stats.appointments_delta),
          icon: Calendar,
          color: 'text-primary',
          bgColor: 'bg-primary/10',
          onClick: canAccessView('appointments')
            ? () => navigate('appointments', { date: todayDate })
            : undefined,
        },
        {
          title: 'Active Job Cards',
          value: String(stats.active_job_cards),
          change:
            stats.in_repair > 0
              ? `${stats.in_repair} in repair`
              : 'No jobs in repair',
          icon: Wrench,
          color: 'text-chart-3',
          bgColor: 'bg-chart-3/10',
          onClick: canAccessView('job-cards')
            ? () => navigate('job-cards', { filter: 'active' })
            : undefined,
        },
        {
          title: 'Pending QC',
          value: String(stats.pending_qc),
          change:
            stats.urgent_qc > 0
              ? `${stats.urgent_qc} urgent`
              : stats.pending_qc > 0
                ? 'Awaiting quality check'
                : 'All clear',
          icon: CheckCircle2,
          color: 'text-chart-4',
          bgColor: 'bg-chart-4/10',
          onClick: canAccessView('job-cards')
            ? () => navigate('job-cards', { filter: 'qc' })
            : undefined,
        },
        {
          title: 'Ready for Delivery',
          value: String(stats.ready_for_delivery),
          change:
            stats.awaiting_payment > 0
              ? `${stats.awaiting_payment} awaiting payment`
              : stats.ready_for_delivery > 0
                ? 'Ready to hand over'
                : 'None waiting',
          icon: Car,
          color: 'text-chart-1',
          bgColor: 'bg-chart-1/10',
          onClick: canAccessView('job-cards')
            ? () => navigate('job-cards', { status: 'Completed' })
            : undefined,
        },
      ]
    : [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive" />
        <p className="text-muted-foreground">Could not load dashboard data.</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-3 sm:space-y-4">
      <div className="mb-0.5">
        <p className="section-label mb-1">Overview</p>
        <h1 className="font-serif-display text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Dashboard
        </h1>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="gap-0 py-0">
                <CardContent className="px-3.5 py-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-7 w-12" />
                  <Skeleton className="mt-1.5 h-2.5 w-20" />
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => (
              <Card
                key={stat.title}
                className={cn(
                  'gap-0 py-0',
                  stat.onClick && 'cursor-pointer transition-colors hover:bg-muted/40'
                )}
                onClick={stat.onClick}
                role={stat.onClick ? 'button' : undefined}
                tabIndex={stat.onClick ? 0 : undefined}
                onKeyDown={
                  stat.onClick
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          stat.onClick?.();
                        }
                      }
                    : undefined
                }
              >
                <CardContent className="px-3.5 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                        {stat.title}
                      </p>
                      <p className="dms-stat-value mt-1 text-xl sm:text-2xl">{stat.value}</p>
                      <p className="mt-0.5 text-[11px] font-normal leading-snug text-muted-foreground">
                        {stat.change}
                      </p>
                    </div>
                    <div className={`shrink-0 rounded-full p-1.5 ${stat.bgColor}`}>
                      <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      {brd && (
        <Card className="gap-2 py-3">
          <CardHeader className="flex flex-row items-center justify-between px-3.5 py-0 pb-1">
            <div>
              <p className="section-label mb-1">Performance</p>
              <CardTitle className="text-base">Management KPIs (last 30 days)</CardTitle>
            </div>
            {canUseReports ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('reports', { section: 'executive', report: 'dashboard' })}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
            ) : null}
          </CardHeader>
          <CardContent className="px-3.5 pt-0">
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-border/80 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Open WIP</p>
                <p className="dms-stat-value mt-0.5 text-xl">{brd.open_job_cards ?? 0}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{brd.overdue_promised ?? 0} overdue</p>
              </div>
              <div className="rounded-xl border border-border/80 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Net revenue</p>
                <p className="dms-stat-value mt-0.5 text-xl">{formatMoney(brd.net_revenue ?? 0, brd.revenue_currency)}</p>
              </div>
              <div className="rounded-xl border border-border/80 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">Appointment arrival</p>
                <p className="dms-stat-value mt-0.5 text-xl">{brd.appointment_arrival_rate ?? 0}%</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{brd.warranty_jobs ?? 0} warranty jobs</p>
              </div>
              <div className="rounded-xl border border-border/80 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">QC fail rate</p>
                <p className="dms-stat-value mt-0.5 text-xl">{brd.qc_fail_rate_pct ?? 0}%</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Parts fill {brd.parts_fill_rate_pct ?? 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-3 lg:grid-cols-3">
        {/* Active Job Cards */}
        <Card className="gap-2 py-3 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between px-3.5 py-0 pb-1">
            <div>
              <p className="section-label mb-1">Workshop</p>
              <CardTitle className="text-base">Active Job Cards</CardTitle>
              <CardDescription className="text-xs">Currently in progress</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('job-cards', { filter: 'active' })}
              className="flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-3.5 pt-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : activeJobs.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No active job cards. Create one from an inspection or appointment.
              </p>
            ) : (
              <div className="space-y-2">
                {activeJobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex flex-col gap-2 rounded-xl border border-border px-3 py-2.5 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Wrench className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => navigate('job-card-detail', { id: job.id })}
                            className="text-[13px] font-medium tracking-tight hover:text-primary"
                          >
                            {job.id}
                          </button>
                          <Badge variant="outline" className={getPriorityColor(job.priority)}>
                            {job.priority}
                          </Badge>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {[job.customer, job.vehicle].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:gap-3">
                      <StatusBadge status={job.status as JobCardStatus} />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Timer className="h-3.5 w-3.5" />
                        {job.eta}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card className="gap-2 py-3">
          <CardHeader className="flex flex-row items-center justify-between px-3.5 py-0 pb-1">
            <div>
              <p className="section-label mb-1">Schedule</p>
              <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
              <CardDescription className="text-xs">Upcoming appointments</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('appointments', { date: todayDate })}
              className="flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-3.5 pt-0">
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : todayAppointments.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No appointments scheduled for today.
              </p>
            ) : (
              <div className="space-y-2.5">
                {todayAppointments.map((apt, i) => (
                  <div key={apt.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="flex h-7 min-w-14 items-center justify-center rounded-md bg-muted px-1 text-[11px] font-medium tracking-tight">
                        {apt.time || '—'}
                      </div>
                      {i < todayAppointments.length - 1 && (
                        <div className="mt-1.5 h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="flex-1 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => navigate('appointment-detail', { id: apt.id })}
                          className="text-[13px] font-medium tracking-tight hover:text-primary"
                        >
                          {apt.customer || 'Customer'}
                        </button>
                        <Badge variant="outline" className={getAppointmentStatusColor(apt.status)}>
                          {apt.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{apt.vehicle || '—'}</p>
                      <p className="text-[11px] text-muted-foreground">{apt.service}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bay Occupancy */}
      <Card className="gap-2 py-3">
        <CardHeader className="px-3.5 py-0 pb-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="section-label mb-1">Floor</p>
              <CardTitle className="text-base">Service Bay Status</CardTitle>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-chart-3" />
                <span className="whitespace-nowrap text-muted-foreground">Available</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-chart-1" />
                <span className="whitespace-nowrap text-muted-foreground">Occupied</span>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="h-2 w-2 shrink-0 rounded-full bg-destructive" />
                <span className="whitespace-nowrap text-muted-foreground">Maintenance</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3.5 pt-0">
          {isLoading ? (
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : serviceBays.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No service bays configured. Add bays in ERPNext.
            </p>
          ) : (
            <div className="grid gap-2.5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {serviceBays.map((bay) => (
                <div
                  key={bay.id}
                  className={`rounded-xl border px-3 py-2.5 ${
                    bay.status === 'available'
                      ? 'border-chart-3/30 bg-chart-3/5'
                      : bay.status === 'maintenance'
                        ? 'border-destructive/30 bg-destructive/5'
                        : 'border-chart-1/30 bg-chart-1/5'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium tracking-tight">{bay.bay}</span>
                    {bay.status === 'occupied' ? (
                      <Clock className="h-3.5 w-3.5 text-chart-1" />
                    ) : bay.status === 'maintenance' ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-chart-3" />
                    )}
                  </div>
                  {bay.vehicle ? (
                    <>
                      <p className="mt-1.5 truncate text-xs text-muted-foreground">{bay.vehicle}</p>
                      <Progress value={bay.progress} className="mt-1.5 h-1" />
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{bay.progress}% complete</p>
                    </>
                  ) : (
                    <p className="mt-1.5 truncate text-xs capitalize text-muted-foreground">
                      {bay.erp_status || bay.status}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {canCreate('appointments') && (
          <Button
            className="h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight"
            onClick={() => navigate('appointment-new')}
          >
            <Calendar className="h-5 w-5" />
            <span>New Appointment</span>
          </Button>
        )}
        {canCreate('inspections') && (
          <Button
            variant="outline"
            className="h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight"
            onClick={() => navigate('inspection-new')}
          >
            <Users className="h-5 w-5" />
            <span>Walk-in Inspection</span>
          </Button>
        )}
        {canAccessView('job-cards') && (
          <Button
            variant="outline"
            className="h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight"
            onClick={() => navigate('job-cards')}
          >
            <Wrench className="h-5 w-5" />
            <span>View Job Cards</span>
          </Button>
        )}
        {canAccessView('deliveries') && (
          <Button
            variant="outline"
            className="h-auto rounded-xl flex-col gap-1.5 px-4 py-3.5 text-[13px] font-medium tracking-tight"
            onClick={() => navigate('deliveries')}
          >
            <TrendingUp className="h-5 w-5" />
            <span>Pending Deliveries</span>
          </Button>
        )}
      </div>
    </div>
  );
}
