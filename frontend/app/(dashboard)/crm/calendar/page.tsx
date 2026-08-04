'use client';

import { useMemo, useState } from 'react';
import useSWR from 'swr';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { apiRequest } from '@/services/apiClient';
import { useNavigation } from '@/contexts/navigation-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalendarEvent = {
  id: string;
  title: string;
  start?: string | null;
  type: 'activity' | 'appointment' | 'sales_appointment' | 'test_drive' | 'lead' | 'opportunity' | string;
  subtype?: string;
  status?: string;
  ref_doctype?: string;
  ref_name?: string;
  opportunity?: string;
};

async function fetchCalendarEvents(
  fromDate: string,
  toDate: string,
  filters?: {
    branch?: string;
    advisor?: string;
    bay?: string;
    appointment_type?: string;
    event_types?: string;
  }
) {
  return apiRequest<{ events: CalendarEvent[]; from_date: string; to_date: string }>(
    '/api/method/dms.crm_api.calendar.get_calendar_events',
    {
      method: 'POST',
      body: JSON.stringify({
        from_date: fromDate,
        to_date: toDate,
        branch: filters?.branch || null,
        advisor: filters?.advisor || null,
        bay: filters?.bay || null,
        appointment_type: filters?.appointment_type || null,
        event_types: filters?.event_types || null,
      }),
    }
  );
}

const TYPE_STYLE: Record<string, string> = {
  appointment: 'bg-sky-500/15 text-foreground border-l-2 border-sky-500',
  sales_appointment: 'bg-cyan-500/15 text-foreground border-l-2 border-cyan-500',
  test_drive: 'bg-emerald-500/15 text-foreground border-l-2 border-emerald-500',
  activity: 'bg-primary/15 text-foreground border-l-2 border-primary',
  lead: 'bg-secondary/15 text-foreground border-l-2 border-secondary',
  opportunity: 'bg-amber-500/15 text-foreground border-l-2 border-amber-500',
};

export default function CrmCalendarPage() {
  const { navigate } = useNavigation();
  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [branch, setBranch] = useState('');
  const [advisor, setAdvisor] = useState('');
  const [bay, setBay] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const rangeStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const rangeEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const fromDate = format(rangeStart, 'yyyy-MM-dd');
  const toDate = format(rangeEnd, 'yyyy-MM-dd');

  const eventTypes =
    typeFilter === 'all'
      ? undefined
      : typeFilter === 'service'
        ? 'appointment'
        : typeFilter === 'sales'
          ? 'sales_appointment,test_drive'
          : typeFilter;

  const { data, isLoading } = useSWR(
    ['crm-calendar', fromDate, toDate, branch, advisor, bay, appointmentType, typeFilter],
    () =>
      fetchCalendarEvents(fromDate, toDate, {
        branch: branch || undefined,
        advisor: advisor || undefined,
        bay: bay || undefined,
        appointment_type: appointmentType || undefined,
        event_types: eventTypes,
      })
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: rangeStart, end: rangeEnd }),
    [rangeStart.getTime(), rangeEnd.getTime()]
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of data?.events || []) {
      if (!ev.start) continue;
      const key = format(new Date(ev.start), 'yyyy-MM-dd');
      const list = map.get(key) || [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [data?.events]);

  const selectedDayKey = format(new Date(), 'yyyy-MM-dd');
  const [focusDay, setFocusDay] = useState(selectedDayKey);
  const dayEvents = eventsByDay.get(focusDay) || [];

  const openEvent = (ev: CalendarEvent) => {
    if (ev.type === 'appointment') {
      navigate('appointment-detail', { id: ev.ref_name || ev.id });
      return;
    }
    if (ev.type === 'sales_appointment') {
      if (ev.opportunity) navigate('crm-opportunity-detail', { id: String(ev.opportunity) });
      else navigate('crm-opportunities');
      return;
    }
    if (ev.type === 'test_drive') {
      navigate('crm-test-drive-detail', { id: ev.ref_name || ev.id });
      return;
    }
    if (ev.type === 'lead') {
      navigate('crm-lead-detail', { id: ev.ref_name || '' });
      return;
    }
    if (ev.type === 'opportunity') {
      navigate('crm-opportunity-detail', { id: ev.ref_name || '' });
      return;
    }
    navigate('crm-activities');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setCursor((d) => subMonths(d, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="min-w-[10rem] text-center text-base font-semibold tracking-tight">
            {format(cursor, 'MMMM yyyy')}
          </h2>
          <Button variant="outline" size="icon" onClick={() => setCursor((d) => addMonths(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCursor(startOfMonth(new Date()))}>
            Today
          </Button>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-sky-500" /> Service
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-cyan-500" /> Sales Appt
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Test Drive
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-primary" /> Activity
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-secondary" /> Lead
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Deal
          </span>
        </div>
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardContent className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder="Branch…"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
          <Input
            placeholder="Advisor / assignee…"
            value={advisor}
            onChange={(e) => setAdvisor(e.target.value)}
          />
          <Input placeholder="Bay…" value={bay} onChange={(e) => setBay(e.target.value)} />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={appointmentType}
            onChange={(e) => setAppointmentType(e.target.value)}
          >
            <option value="">All appointment types</option>
            <option value="Service">Service</option>
            <option value="Mobile Service">Mobile Service</option>
            <option value="Delivery">Delivery</option>
            <option value="Complaint Review">Complaint Review</option>
            <option value="Fleet Visit">Fleet Visit</option>
          </select>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="all">All event kinds</option>
            <option value="service">Service appointments</option>
            <option value="sales">Sales + test drives</option>
            <option value="activity">Activities</option>
            <option value="lead,opportunity">Lead / deal follow-ups</option>
          </select>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <Card className="border-border/70 shadow-sm">
          <CardContent className="p-2 sm:p-3">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>
            {isLoading ? (
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 35 }).map((_, i) => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, 'yyyy-MM-dd');
                  const dayEvs = eventsByDay.get(key) || [];
                  const inMonth = isSameMonth(day, cursor);
                  const isToday = isSameDay(day, new Date());
                  const isFocus = key === focusDay;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFocusDay(key)}
                      className={cn(
                        'min-h-24 rounded-lg border p-1.5 text-left transition-colors',
                        inMonth ? 'bg-card' : 'bg-muted/30 opacity-60',
                        isFocus ? 'border-primary' : 'border-border/60',
                        isToday && 'ring-1 ring-primary/40'
                      )}
                    >
                      <div
                        className={cn(
                          'mb-1 text-xs font-medium',
                          isToday ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {format(day, 'd')}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvs.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className={cn(
                              'truncate rounded px-1 py-0.5 text-[10px] leading-tight',
                              TYPE_STYLE[ev.type] || 'bg-muted'
                            )}
                            title={ev.title}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvs.length > 3 ? (
                          <div className="px-1 text-[10px] text-muted-foreground">
                            +{dayEvs.length - 3} more
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">
              {format(new Date(focusDay + 'T12:00:00'), 'EEE d MMM')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dayEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No events this day.</p>
            ) : (
              dayEvents.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => openEvent(ev)}
                  className={cn(
                    'w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/60',
                    TYPE_STYLE[ev.type] || 'bg-muted'
                  )}
                >
                  <p className="text-sm font-medium">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {ev.subtype || ev.type}
                    {ev.start ? ` · ${format(new Date(ev.start), 'HH:mm')}` : ''}
                    {ev.status ? ` · ${ev.status}` : ''}
                  </p>
                </button>
              ))
            )}
            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => navigate('crm-activities')}>
                Open activities
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('appointments')}>
                Open appointments
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
