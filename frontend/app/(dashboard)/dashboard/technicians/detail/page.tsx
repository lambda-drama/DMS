"use client";

import { useState, useMemo } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import {
  useTechnicianDetail,
  useTechnicianSchedule,
  useTechnicianWeeklySchedule,
} from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Clock,
  Calendar,
  Wrench,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle2,
  User,
  Briefcase,
  Timer,
  Target,
  Star,
  Activity,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { TechnicianScheduleJob } from "@/types/dms";

function getStatusColor(status: string) {
  const m: Record<string, string> = {
    "Repair In Progress": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "Road Test In Progress": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "QC In Progress": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
    Scheduled: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    "Estimation Pending": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "Estimation Approved": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    "Repair Completed": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    Completed: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    "Waiting Parts": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    Open: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
  };
  return m[status] || "bg-muted text-muted-foreground";
}

function getPriorityColor(priority: string) {
  const m: Record<string, string> = {
    Emergency: "bg-red-100 text-red-700 border-red-200",
    Urgent: "bg-orange-100 text-orange-700 border-orange-200",
    VIP: "bg-purple-100 text-purple-700 border-purple-200",
    "Safety Critical": "bg-red-100 text-red-700 border-red-200",
  };
  return m[priority] || "";
}

function formatTime(time?: string) {
  if (!time) return "—";
  try {
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour > 12 ? hour - 12 : hour || 12}:${m} ${ampm}`;
  } catch {
    return time;
  }
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function ScheduleJobCard({ job, onNavigate }: { job: TechnicianScheduleJob; onNavigate: (id: string) => void }) {
  return (
    <div
      className="rounded-lg border p-3 transition-colors hover:bg-muted/50 cursor-pointer"
      onClick={() => onNavigate(job.name)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{job.name}</span>
            {job.role === "Assistant" && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                Assistant
              </Badge>
            )}
            {job.priority && job.priority !== "Normal" && (
              <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getPriorityColor(job.priority)}`}>
                {job.priority}
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {job.customer_name || "—"}
            {job.vehicle_model && ` • ${job.vehicle_model}`}
          </p>
        </div>
        <Badge variant="secondary" className={`shrink-0 text-[11px] ${getStatusColor(job.status)}`}>
          {job.status}
        </Badge>
      </div>
      <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
        {(job.schedule_start_time || job.schedule_end_time) && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatTime(job.schedule_start_time)} – {formatTime(job.schedule_end_time)}
          </span>
        )}
        {job.assigned_bay && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {job.assigned_bay}
          </span>
        )}
        {job.estimated_duration_hours != null && (
          <span className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            Est. {job.estimated_duration_hours}h
          </span>
        )}
      </div>
    </div>
  );
}

export default function TechnicianDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const techId = viewParams.get("id");
  const [weekStart, setWeekStart] = useState(getTodayISO());
  const [selectedDate, setSelectedDate] = useState(getTodayISO());

  const { data: tech, isLoading, error } = useTechnicianDetail(techId);
  const { data: todaySchedule } = useTechnicianSchedule(techId, selectedDate);
  const { data: weeklySchedule } = useTechnicianWeeklySchedule(techId, weekStart);

  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(addDays(weekStart, i));
    }
    return days;
  }, [weekStart]);

  if (!techId) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">No technician selected</p>
        <Button variant="ghost" className="mt-2" onClick={() => navigate("technicians")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Technicians
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tech) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-destructive">Failed to load technician details</p>
        <Button variant="ghost" className="mt-2" onClick={() => navigate("technicians")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
      </div>
    );
  }

  const initials = tech.full_name
    ?.split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" onClick={() => navigate("technicians")}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Technicians
      </Button>

      {/* Profile Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Avatar className="h-20 w-20">
              {tech.profile_photo && (
                <AvatarImage src={tech.profile_photo} alt={tech.full_name} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold">{tech.full_name}</h1>
                  <p className="text-sm text-muted-foreground">{tech.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className={
                        tech.status === "Active"
                          ? "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300"
                          : tech.status === "On Leave"
                          ? "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300"
                          : "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300"
                      }
                    >
                      {tech.status}
                    </Badge>
                    <Badge variant="outline">{tech.skill_level}</Badge>
                    {tech.labor_rate_group && (
                      <Badge variant="secondary">{tech.labor_rate_group}</Badge>
                    )}
                  </div>
                </div>
                <div className="text-right hidden sm:block">
                  {tech.attendance_today && (
                    <Badge
                      variant="outline"
                      className={
                        tech.attendance_today === "Present"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30"
                      }
                    >
                      {tech.attendance_today}
                    </Badge>
                  )}
                  {(tech.clock_in_time || tech.clock_out_time) && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {tech.clock_in_time && `In: ${formatTime(tech.clock_in_time)}`}
                      {tech.clock_out_time && ` • Out: ${formatTime(tech.clock_out_time)}`}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                {tech.personal_phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-4 w-4" /> {tech.personal_phone}
                  </span>
                )}
                {tech.branch && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> {tech.branch}
                  </span>
                )}
                {tech.work_shift && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {tech.work_shift}
                  </span>
                )}
                {tech.weekly_off_days && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> Off: {tech.weekly_off_days}
                  </span>
                )}
                {tech.years_of_experience != null && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="h-4 w-4" /> {tech.years_of_experience} yrs exp
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schedule" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="skills">Skills & Certifications</TabsTrigger>
        </TabsList>

        {/* Schedule Tab */}
        <TabsContent value="schedule" className="space-y-4">
          {/* Weekly Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Weekly Schedule</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWeekStart(addDays(weekStart, -7))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={() => {
                      setWeekStart(getTodayISO());
                      setSelectedDate(getTodayISO());
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setWeekStart(addDays(weekStart, 7))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const jobs = weeklySchedule?.[day] || [];
                  const isToday = day === getTodayISO();
                  const isSelected = day === selectedDate;
                  return (
                    <button
                      key={day}
                      onClick={() => setSelectedDate(day)}
                      className={`rounded-lg border p-3 text-center transition-colors ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : isToday
                          ? "border-primary/30 bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <p className="text-xs font-medium text-muted-foreground">
                        {formatDate(day).split(",")[0]}
                      </p>
                      <p className={`text-lg font-bold ${isToday ? "text-primary" : ""}`}>
                        {new Date(day).getDate()}
                      </p>
                      {jobs.length > 0 ? (
                        <div className="mt-1 flex justify-center">
                          <Badge
                            variant="secondary"
                            className="h-5 text-[10px] px-1.5"
                          >
                            {jobs.length} job{jobs.length !== 1 ? "s" : ""}
                          </Badge>
                        </div>
                      ) : (
                        <p className="mt-1 text-[10px] text-muted-foreground">Free</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {formatDate(selectedDate)} — Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!todaySchedule || todaySchedule.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-muted-foreground">
                  <CheckCircle2 className="mb-2 h-8 w-8 text-green-500" />
                  <p className="font-medium">No jobs scheduled</p>
                  <p className="text-sm">This day is currently free</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedule.map((job) => (
                    <ScheduleJobCard
                      key={job.name}
                      job={job}
                      onNavigate={(id) =>
                        navigate("job-card-detail", { id })
                      }
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-100 p-2.5 dark:bg-blue-900/30">
                    <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tech.efficiency_rating != null ? `${Math.round(tech.efficiency_rating)}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Efficiency</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                    <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tech.productivity_score != null ? tech.productivity_score.toFixed(1) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Productivity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
                    <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tech.first_time_fix_rate != null ? `${Math.round(tech.first_time_fix_rate)}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">First-Time Fix</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-100 p-2.5 dark:bg-purple-900/30">
                    <Star className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {tech.customer_satisfaction_score != null
                        ? tech.customer_satisfaction_score.toFixed(1)
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Satisfaction (out of 5)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hours Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Labor Hours</span>
                    <span className="font-medium">{tech.total_labor_hours?.toFixed(1) || 0}h</span>
                  </div>
                  <Progress
                    value={Math.min(
                      ((tech.total_labor_hours || 0) / Math.max(tech.total_sold_hours || 1, 1)) * 100,
                      100
                    )}
                    className="h-2"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Sold Hours</span>
                    <span className="font-medium">{tech.total_sold_hours?.toFixed(1) || 0}h</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Idle Hours</span>
                    <span className="font-medium">{tech.total_idle_hours?.toFixed(1) || 0}h</span>
                  </div>
                  <Progress
                    value={Math.min(
                      ((tech.total_idle_hours || 0) /
                        Math.max((tech.total_labor_hours || 0) + (tech.total_idle_hours || 0), 1)) *
                        100,
                      100
                    )}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Work Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-3xl font-bold">{tech.total_jobs_completed || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Total Jobs</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-3xl font-bold">{tech.today_scheduled_jobs || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Today&apos;s Jobs</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-3xl font-bold">
                      {tech.experience_at_suweys || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Years at Company</p>
                  </div>
                  <div className="rounded-lg border p-4 text-center">
                    <p className="text-3xl font-bold">
                      {tech.years_of_experience || 0}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Years Experience</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Skills & Certifications Tab */}
        <TabsContent value="skills" className="space-y-4">
          {/* Specializations */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Wrench className="h-4 w-4" /> Specializations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tech.specialization && tech.specialization.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {tech.specialization.map((s, i) => (
                    <div
                      key={s.name || i}
                      className="rounded-lg border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{s.specialization}</p>
                        {s.proficiency_level && (
                          <Badge variant="outline" className="text-[10px]">
                            {s.proficiency_level}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                        {s.years_experience_in_area != null && (
                          <span>{s.years_experience_in_area} yrs</span>
                        )}
                        {s.certification_held && (
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            {s.certification_held}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No specializations recorded
                </p>
              )}
            </CardContent>
          </Card>

          {/* Certifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Award className="h-4 w-4" /> Certifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tech.certifications && tech.certifications.length > 0 ? (
                <div className="space-y-3">
                  {tech.certifications.map((c, i) => {
                    const isExpiring =
                      c.expiry_date &&
                      new Date(c.expiry_date).getTime() - Date.now() <
                        30 * 24 * 60 * 60 * 1000;
                    const isExpired =
                      c.expiry_date && new Date(c.expiry_date) < new Date();
                    return (
                      <div
                        key={c.name || i}
                        className={`rounded-lg border p-3 ${
                          isExpired
                            ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                            : isExpiring
                            ? "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20"
                            : ""
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium text-sm">{c.certification_name}</p>
                            {c.issuing_authority && (
                              <p className="text-xs text-muted-foreground">
                                {c.issuing_authority}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {c.is_active ? (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-700 border-green-200 text-[10px]"
                              >
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px]">
                                Inactive
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge variant="destructive" className="text-[10px]">
                                Expired
                              </Badge>
                            )}
                            {isExpiring && !isExpired && (
                              <Badge
                                variant="outline"
                                className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] gap-1"
                              >
                                <AlertTriangle className="h-3 w-3" />
                                Expiring Soon
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                          {c.certification_date && (
                            <span>Issued: {c.certification_date}</span>
                          )}
                          {c.expiry_date && (
                            <span>Expires: {c.expiry_date}</span>
                          )}
                          {c.certificate_number && (
                            <span>#{c.certificate_number}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No certifications recorded
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
