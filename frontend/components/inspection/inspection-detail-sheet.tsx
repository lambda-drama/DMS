"use client";

import { useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { DetailSection, DetailRow } from "@/components/detail-sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, Stethoscope } from "lucide-react";
import { canStartDiagnosis } from "@/lib/inspection-workflow";
import type { VehicleInspection } from "@/types/dms";

type ChecklistRow = {
  name?: string;
  component?: string;
  area?: string;
  condition?: string;
  severity?: string;
  comments?: string;
  photo?: string;
};

function checklistLabel(row: ChecklistRow): string {
  return row.component || row.area || "—";
}

function isChecklistIssue(condition?: string): boolean {
  return !!condition && condition !== "OK" && condition !== "Not Checked";
}

function conditionBadgeClass(condition?: string): string {
  if (!condition || condition === "OK") {
    return "bg-chart-3/10 text-chart-3 border-chart-3/20";
  }
  if (condition === "Not Checked") {
    return "bg-muted text-muted-foreground border-border";
  }
  return "bg-transparent text-foreground border-destructive";
}

function warningLightLabel(light: Record<string, unknown>): string {
  return String(
    light.vehicle_warning_light ||
      light.warning_light ||
      light.warning_light_name ||
      "Warning light",
  );
}

function ChecklistTable({ rows, showSeverity }: { rows: ChecklistRow[]; showSeverity?: boolean }) {
  const issues = rows.filter((row) => isChecklistIssue(row.condition));

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No checklist items recorded.</p>;
  }

  return (
    <div className="space-y-3">
      {issues.length > 0 ? (
        <p className="text-xs text-muted-foreground">
          {issues.length} issue{issues.length === 1 ? "" : "s"} of {rows.length} components
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">All {rows.length} components marked OK.</p>
      )}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component</TableHead>
              <TableHead>Condition</TableHead>
              {showSeverity ? <TableHead>Severity</TableHead> : null}
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, idx) => (
              <TableRow key={row.name || `${checklistLabel(row)}-${idx}`}>
                <TableCell className="font-medium">{checklistLabel(row)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={conditionBadgeClass(row.condition)}>
                    {row.condition || "—"}
                  </Badge>
                </TableCell>
                {showSeverity ? (
                  <TableCell className="text-sm text-muted-foreground">{row.severity || "—"}</TableCell>
                ) : null}
                <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">
                  {row.comments || "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface InspectionDetailSheetContentProps {
  inspection: VehicleInspection;
  onStartDiagnosis?: () => void;
  startingDiagnosis?: boolean;
}

export function InspectionDetailSheetContent({
  inspection,
  onStartDiagnosis,
  startingDiagnosis,
}: InspectionDetailSheetContentProps) {
  const { navigate } = useNavigation();
  const [tab, setTab] = useState("overview");

  const exteriorRows = (inspection.exterior_checklist || []) as ChecklistRow[];
  const interiorRows = (inspection.interior_checklist || []) as ChecklistRow[];
  const warningLights = inspection.warning_lights || [];
  const complaints = inspection.customer_complaints || [];
  const dtcCodes = inspection.dtc_codes || [];
  const tires = inspection.tires_checklist || [];

  const exteriorIssueCount = exteriorRows.filter((row) => isChecklistIssue(row.condition)).length;
  const interiorIssueCount = interiorRows.filter((row) => isChecklistIssue(row.condition)).length;
  const tireIssueCount = tires.filter(
    (row) =>
      isChecklistIssue(row.tire_condition) ||
      isChecklistIssue(row.rim_condition) ||
      isChecklistIssue(row.brake_visual),
  ).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 -mx-4 border-b border-border/60 bg-background px-4 pb-2 pt-1">
          <div className="dms-tabs-scroll">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="exterior" className="gap-1.5 text-xs sm:text-sm">
                Exterior
                {exteriorIssueCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                    {exteriorIssueCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="interior" className="gap-1.5 text-xs sm:text-sm">
                Interior
                {interiorIssueCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                    {interiorIssueCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
          <TabsContent value="overview" className="mt-0 space-y-4 data-[state=inactive]:hidden">
            <DetailSection title="Inspection Info">
              <DetailRow
                label="Date"
                value={
                  inspection.inspection_date
                    ? new Date(inspection.inspection_date).toLocaleString()
                    : undefined
                }
              />
              <DetailRow label="Company" value={inspection.company_name || inspection.company} />
              <DetailRow
                label="Service Advisor"
                value={inspection.service_advisor_name || inspection.service_advisor}
              />
              <DetailRow label="Job Card" value={inspection.job_card} />
              <DetailRow label="Service Estimate" value={inspection.service_estimate} />
            </DetailSection>

            <DetailSection title="Customer & Vehicle">
              <DetailRow label="Customer" value={inspection.customer} />
              <DetailRow label="Vehicle" value={inspection.customer_vehicle} />
              <DetailRow label="VIN / Chassis" value={inspection.vin_chassis} />
              <DetailRow label="License Plate" value={inspection.license_plate} />
              <DetailRow label="Model Year" value={inspection.model_year?.toString()} />
              <DetailRow
                label="Odometer"
                value={
                  inspection.odometer
                    ? `${inspection.odometer.toLocaleString()} ${inspection.odometer_unit || "km"}`
                    : undefined
                }
              />
              <DetailRow label="Fuel Level" value={inspection.fuel_level} />
              <DetailRow label="Arrival" value={inspection.arrival_method} />
              <DetailRow label="Keys Received" value={inspection.keys_received ? "Yes" : "No"} />
              <DetailRow label="Remote Condition" value={inspection.remote_condition} />
            </DetailSection>

            <DetailSection title="Warning Lights">
              {warningLights.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {warningLights.map((light, idx) => (
                    <Badge
                      key={(light as { name?: string }).name || idx}
                      variant="outline"
                      className="border-destructive bg-transparent text-foreground"
                    >
                      <AlertTriangle className="mr-1.5 h-3.5 w-3.5 text-destructive" />
                      {warningLightLabel(light as Record<string, unknown>)}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No warning lights recorded.</p>
              )}
              {inspection.scan_performed ? (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <DetailRow label="Scan Performed" value="Yes" />
                  <DetailRow label="Scan Tool" value={inspection.scan_tool_used} />
                  {dtcCodes.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">DTC Codes</p>
                      {dtcCodes.map((code, idx) => (
                        <div key={code.name || idx} className="rounded-md border bg-muted/20 p-2 text-sm">
                          <p className="font-medium">{code.code}</p>
                          {code.description ? (
                            <p className="text-xs text-muted-foreground">{code.description}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No DTC codes recorded.</p>
                  )}
                </div>
              ) : null}
            </DetailSection>

            <DetailSection title="Customer Complaints">
              {complaints.length > 0 ? (
                <div className="space-y-3">
                  {complaints.map((complaint, idx) => (
                    <div key={complaint.name || idx} className="rounded-md border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        #{complaint.complaint_sequence || idx + 1}
                        {complaint.symptom_category || complaint.category
                          ? ` · ${complaint.symptom_category || complaint.category}`
                          : ""}
                        {complaint.severity ? ` · ${complaint.severity}` : ""}
                        {complaint.frequency ? ` · ${complaint.frequency}` : ""}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">
                        {complaint.customer_exact_words || complaint.complaint || "—"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No customer complaints recorded.</p>
              )}
            </DetailSection>

            {tires.length > 0 ? (
              <DetailSection title="Tires & Wheels">
                <p className="mb-3 text-xs text-muted-foreground">
                  {tireIssueCount > 0
                    ? `${tireIssueCount} issue${tireIssueCount === 1 ? "" : "s"} across ${tires.length} positions`
                    : `All ${tires.length} tire positions OK`}
                </p>
                <div className="space-y-2">
                  {tires.map((tire, idx) => (
                    <div
                      key={tire.name || idx}
                      className="flex flex-col gap-1 rounded-md border bg-muted/10 p-2 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <span className="text-sm font-medium">{tire.position}</span>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={conditionBadgeClass(tire.tire_condition)}>
                          Tire: {tire.tire_condition || "—"}
                        </Badge>
                        {tire.tread_depth_mm ? (
                          <Badge variant="outline" className="text-xs">
                            {tire.tread_depth_mm} mm tread
                          </Badge>
                        ) : null}
                        {tire.tire_pressure_psi ? (
                          <Badge variant="outline" className="text-xs">
                            {tire.tire_pressure_psi} PSI
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </DetailSection>
            ) : null}

            {(inspection.service_advisor_notes || inspection.internal_notes || inspection.personal_items) && (
              <DetailSection title="Notes">
                {inspection.personal_items ? (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Personal items</p>
                    <p className="text-sm whitespace-pre-wrap">{inspection.personal_items}</p>
                  </div>
                ) : null}
                {inspection.service_advisor_notes ? (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Advisor notes</p>
                    <p className="text-sm whitespace-pre-wrap">{inspection.service_advisor_notes}</p>
                  </div>
                ) : null}
                {inspection.internal_notes ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Internal notes</p>
                    <p className="text-sm whitespace-pre-wrap">{inspection.internal_notes}</p>
                  </div>
                ) : null}
              </DetailSection>
            )}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
              {canStartDiagnosis(inspection) && onStartDiagnosis ? (
                <Button disabled={startingDiagnosis} onClick={onStartDiagnosis}>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  {startingDiagnosis ? "Creating…" : "Start diagnosis"}
                </Button>
              ) : null}
              {inspection.service_estimate ? (
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate("estimate-detail", { id: inspection.service_estimate! })
                  }
                >
                  View service estimate
                </Button>
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="exterior" className="mt-0 data-[state=inactive]:hidden">
            <DetailSection title="Exterior Inspection">
              <ChecklistTable rows={exteriorRows} showSeverity />
            </DetailSection>
          </TabsContent>

          <TabsContent value="interior" className="mt-0 data-[state=inactive]:hidden">
            <DetailSection title="Interior Inspection">
              <ChecklistTable rows={interiorRows} />
            </DetailSection>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
