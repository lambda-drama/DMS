"use client";

import { useState, useMemo } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useTechniciansAvailability, useTechnicianDetail } from "@/hooks/use-dms";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Wrench,
  Phone,
  MapPin,
  TrendingUp,
  Eye,
  Loader2,
  UserCheck,
  UserX,
  Activity,
} from "lucide-react";
import type { TechnicianAvailability } from "@/types/dms";

const skillLevelOptions = [
  { value: "all", label: "All Skill Levels" },
  { value: "Trainee", label: "Trainee" },
  { value: "Junior", label: "Junior" },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Senior", label: "Senior" },
  { value: "Master Technician", label: "Master Technician" },
  { value: "EV/PHEV Certified", label: "EV/PHEV Certified" },
  { value: "Expert", label: "Expert" },
];

const availabilityFilterOptions = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "busy", label: "Busy" },
  { value: "unavailable", label: "Unavailable" },
];

function getSkillBadgeColor(level: string) {
  const m: Record<string, string> = {
    Trainee: "bg-muted text-muted-foreground border-muted",
    Junior: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
    Intermediate: "bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300",
    Senior: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300",
    "Master Technician": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
    "EV/PHEV Certified": "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300",
    Expert: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  };
  return m[level] || "bg-muted text-muted-foreground";
}

function getAvailabilityInfo(tech: TechnicianAvailability) {
  if (tech.attendance_today === "Absent" || tech.attendance_today === "On Leave") {
    return { label: "Unavailable", color: "text-destructive", bg: "bg-destructive/10", icon: UserX };
  }
  if (tech.currently_working) {
    return { label: "Busy", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-100 dark:bg-amber-900/30", icon: Wrench };
  }
  if (tech.is_available) {
    return { label: "Available", color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30", icon: UserCheck };
  }
  return { label: "At Capacity", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", icon: AlertCircle };
}

export default function TechniciansPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: technicians, isLoading, error } = useTechniciansAvailability();
  const { data: selectedTechnician, isLoading: detailLoading } = useTechnicianDetail(selectedId);

  const filtered = useMemo(() => {
    if (!technicians) return [];
    return technicians.filter((t) => {
      if (search) {
        const s = search.toLowerCase();
        if (
          !t.full_name?.toLowerCase().includes(s) &&
          !t.name?.toLowerCase().includes(s) &&
          !t.personal_phone?.toLowerCase().includes(s)
        ) {
          return false;
        }
      }
      if (skillFilter !== "all" && t.skill_level !== skillFilter) return false;
      if (availabilityFilter !== "all") {
        const info = getAvailabilityInfo(t);
        if (availabilityFilter === "available" && info.label !== "Available") return false;
        if (availabilityFilter === "busy" && info.label !== "Busy") return false;
        if (availabilityFilter === "unavailable" && info.label !== "Unavailable" && info.label !== "At Capacity") return false;
      }
      return true;
    });
  }, [technicians, search, skillFilter, availabilityFilter]);

  const stats = useMemo(() => {
    if (!technicians) return { total: 0, available: 0, busy: 0, unavailable: 0 };
    let available = 0, busy = 0, unavailable = 0;
    technicians.forEach((t) => {
      const info = getAvailabilityInfo(t);
      if (info.label === "Available") available++;
      else if (info.label === "Busy") busy++;
      else unavailable++;
    });
    return { total: technicians.length, available, busy, unavailable };
  }, [technicians]);

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Technicians</h1>
          <p className="text-muted-foreground">
            View technician availability & schedules
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2.5">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2.5 dark:bg-green-900/30">
                <UserCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.available}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2.5 dark:bg-amber-900/30">
                <Wrench className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.busy}</p>
                <p className="text-xs text-muted-foreground">Busy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-destructive/10 p-2.5">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.unavailable}</p>
                <p className="text-xs text-muted-foreground">Unavailable</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={skillFilter} onValueChange={setSkillFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {skillLevelOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availabilityFilterOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Technician Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <p className="text-destructive">Failed to load technicians</p>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="mb-3 h-12 w-12 text-muted-foreground/50" />
            <p className="text-lg font-medium text-muted-foreground">No technicians found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((tech) => {
            const avail = getAvailabilityInfo(tech);
            const AvailIcon = avail.icon;
            return (
              <Card
                key={tech.name}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() => setSelectedId(tech.name)}
              >
                <CardContent className="p-5">
                  {/* Top row: avatar + name + availability */}
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      {tech.profile_photo && (
                        <AvatarImage src={tech.profile_photo} alt={tech.full_name} />
                      )}
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {tech.full_name
                          ?.split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold truncate">{tech.full_name}</h3>
                        <Badge
                          variant="outline"
                          className={`shrink-0 gap-1 ${avail.bg} ${avail.color} border-0`}
                        >
                          <AvailIcon className="h-3 w-3" />
                          {avail.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{tech.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <Badge variant="outline" className={getSkillBadgeColor(tech.skill_level)}>
                          {tech.skill_level}
                        </Badge>
                        {tech.branch && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {tech.branch}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active Jobs */}
                  {tech.active_jobs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Active Jobs ({tech.active_job_count})
                      </p>
                      {tech.active_jobs.slice(0, 2).map((job) => (
                        <div
                          key={job.name}
                          className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="font-medium">{job.name}</span>
                            {job.customer_name && (
                              <span className="text-muted-foreground ml-1.5">
                                — {job.customer_name}
                              </span>
                            )}
                          </div>
                          <Badge variant="outline" className="ml-2 shrink-0 text-[10px]">
                            {job.status}
                          </Badge>
                        </div>
                      ))}
                      {tech.active_jobs.length > 2 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{tech.active_jobs.length - 2} more
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" />
                      {tech.work_shift || "—"}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      {tech.efficiency_rating != null && tech.efficiency_rating > 0 && (
                        <span className="flex items-center gap-1" title="Efficiency">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {Math.round(tech.efficiency_rating)}%
                        </span>
                      )}
                      {tech.total_jobs_completed != null && tech.total_jobs_completed > 0 && (
                        <span className="flex items-center gap-1" title="Jobs completed">
                          <Activity className="h-3.5 w-3.5" />
                          {tech.total_jobs_completed}
                        </span>
                      )}
                      {tech.personal_phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {tech.personal_phone}
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      <DetailSheet
        open={!!selectedId}
        onOpenChange={(open) => { if (!open) setSelectedId(null); }}
        title={selectedTechnician?.full_name || selectedId || ""}
        subtitle={selectedTechnician?.status}
        badge={selectedTechnician ? { label: selectedTechnician.skill_level || "—" } : undefined}
        isLoading={detailLoading}
        onOpenInDesk={() => window.open(`/app/technician/${selectedId}`, '_blank')}
      >
        {selectedTechnician && (
          <>
            <DetailSection title="Personal Info">
              <DetailRow label="Full Name" value={selectedTechnician.full_name} />
              <DetailRow label="Employee Code" value={selectedTechnician.employee_code} />
              <DetailRow label="Status" value={selectedTechnician.status} />
              <DetailRow label="Phone" value={selectedTechnician.personal_phone} />
            </DetailSection>
            <DetailSection title="Employment">
              <DetailRow label="Skill Level" value={selectedTechnician.skill_level} />
              <DetailRow label="Date of Joining" value={selectedTechnician.date_of_joining ? new Date(selectedTechnician.date_of_joining).toLocaleDateString() : undefined} />
              <DetailRow label="Branch" value={selectedTechnician.branch} />
            </DetailSection>
            {selectedTechnician.specializations && selectedTechnician.specializations.length > 0 && (
              <DetailSection title="Specializations">
                <div className="flex flex-wrap gap-1">
                  {selectedTechnician.specializations.map((s: any, i: number) => (
                    <span key={i} className="text-xs bg-muted px-2 py-1 rounded">{s.specialization || s.name}</span>
                  ))}
                </div>
              </DetailSection>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => { setSelectedId(null); navigate('technician-detail', { id: selectedId! }); }}>
                View Full Profile
              </Button>
            </div>
          </>
        )}
      </DetailSheet>
    </div>
  );
}
