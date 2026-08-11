"use client";

import { useMemo, useState } from "react";
import { usePartsAdvisorsList, usePartsAdvisorDetail } from "@/hooks/use-dms";
import { usePermissions } from "@/contexts/permissions-context";
import { CreatePartsAdvisorDialog } from "@/components/parts-advisors/create-parts-advisor-dialog";
import { DetailSheet, DetailSection, DetailRow } from "@/components/detail-sheet";
import { PermittedCreateButton } from "@/components/permitted-create-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Users,
  Phone,
  Mail,
  Loader2,
  UserCircle,
  Pencil,
} from "lucide-react";
import type { PartsAdvisorListItem } from "@/services/partsAdvisors";

const statusOptions = [
  { value: "all", label: "All statuses" },
  { value: "Active", label: "Active" },
  { value: "On Leave", label: "On Leave" },
  { value: "Inactive", label: "Inactive" },
];

function statusBadgeClass(status?: string) {
  switch (status) {
    case "Active":
      return "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300";
    case "On Leave":
      return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300";
    case "Inactive":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export default function PartsAdvisorsPage() {
  const { canWrite } = usePermissions();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: advisors, isLoading, error } = usePartsAdvisorsList(search, statusFilter);
  const { data: selected, isLoading: detailLoading, mutate: mutateAdvisor } =
    usePartsAdvisorDetail(selectedId);

  const filtered = useMemo(() => {
    if (!advisors) return [];
    const s = search.trim().toLowerCase();
    if (!s) return advisors;
    return advisors.filter(
      (a) =>
        a.full_name?.toLowerCase().includes(s) ||
        a.name?.toLowerCase().includes(s) ||
        a.phone?.toLowerCase().includes(s) ||
        a.email?.toLowerCase().includes(s)
    );
  }, [advisors, search]);

  const activeCount = advisors?.filter((a) => a.status === "Active").length ?? 0;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="dms-stat-value text-xl tracking-tight">Parts Advisors</h1>
          <p className="mt-1 hidden text-muted-foreground sm:block">
            Manage advisors for spare parts counter sales and requisitions
          </p>
        </div>
        <PermittedCreateButton
          module="parts-advisors"
          label="New advisor"
          onClick={() => setCreateOpen(true)}
        />
      </div>

      <Card className="dms-kpi-card">
        <CardContent className="px-3.5 py-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-1.5">
              <Users className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <p className="dms-stat-value text-xl">{advisors?.length ?? 0}</p>
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                {activeCount} active
                {statusFilter !== "all" ? ` · filter: ${statusFilter}` : ""}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="dms-toolbar-card">
        <CardContent className="space-y-3 px-3.5 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or email..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading && (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <p className="text-center text-sm text-destructive py-8">
              Failed to load parts advisors
            </p>
          )}

          {!isLoading && !error && filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No parts advisors found</p>
              <Button variant="link" className="mt-2" onClick={() => setCreateOpen(true)}>
                Create your first advisor
              </Button>
            </div>
          )}

          {!isLoading && filtered.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((advisor) => (
                <AdvisorCard
                  key={advisor.name}
                  advisor={advisor}
                  onSelect={() => setSelectedId(advisor.name)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePartsAdvisorDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => setCreateOpen(false)}
      />
      <CreatePartsAdvisorDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        advisor={selected}
        onUpdated={() => {
          void mutateAdvisor();
        }}
      />

      <DetailSheet
        open={Boolean(selectedId)}
        onOpenChange={(open) => !open && setSelectedId(null)}
        title={selected?.full_name || selectedId || "Parts Advisor"}
        subtitle={selectedId || undefined}
        footer={
          canWrite("parts-advisors") && selected ? (
            <Button className="w-full sm:w-auto" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : null
        }
      >
        {detailLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {selected && !detailLoading && (
          <>
            <DetailSection title="Contact">
              <DetailRow label="Phone" value={selected.phone} />
              <DetailRow label="Email" value={selected.email} />
            </DetailSection>
            <DetailSection title="Employment">
              <DetailRow label="Status" value={selected.status} />
              <DetailRow label="Advisor code" value={selected.advisor_code} />
              <DetailRow label="Internal employee" value={selected.internal_employee} />
              <DetailRow label="Linked employee" value={selected.employee_id} />
              <DetailRow
                label="Date of joining"
                value={
                  selected.date_of_joining
                    ? new Date(selected.date_of_joining).toLocaleDateString()
                    : undefined
                }
              />
            </DetailSection>
          </>
        )}
      </DetailSheet>
    </div>
  );
}

function AdvisorCard({
  advisor,
  onSelect,
}: {
  advisor: PartsAdvisorListItem;
  onSelect: () => void;
}) {
  const initials =
    advisor.full_name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={onSelect}>
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <Avatar className="h-11 w-11">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold truncate">{advisor.full_name}</h3>
              <Badge
                variant="outline"
                className={`shrink-0 ${statusBadgeClass(advisor.status)} border-0`}
              >
                {advisor.status || "—"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{advisor.name}</p>
            <div className="mt-3 space-y-1 text-sm text-muted-foreground">
              {advisor.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {advisor.phone}
                </span>
              )}
              {advisor.email && (
                <span className="flex items-center gap-1.5 truncate">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {advisor.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
