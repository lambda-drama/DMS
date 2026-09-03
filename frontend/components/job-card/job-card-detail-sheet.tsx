"use client";

import { useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useServiceEstimate } from "@/hooks/use-dms";
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
import { Separator } from "@/components/ui/separator";
import { htmlToPlainText } from "@/lib/plain-text";
import type { DMSJobCard, JobCardItem } from "@/types/dms";
import { QCResultsGroupedList } from "@/components/job-card/qc-grouped-list";

function jobItemComplaintText(item: JobCardItem): string {
  return htmlToPlainText(item.complaint_description || item.complaint || "").trim();
}

function resultBadgeVariant(result?: string) {
  if (result === "Pass") return "default" as const;
  if (result === "Fail") return "destructive" as const;
  return "secondary" as const;
}

interface JobCardDetailSheetContentProps {
  jobCard: DMSJobCard;
  onOpenFullDetails: () => void;
}

export function JobCardDetailSheetContent({
  jobCard,
  onOpenFullDetails,
}: JobCardDetailSheetContentProps) {
  const { navigate } = useNavigation();
  const [tab, setTab] = useState("overview");
  const { data: linkedEstimate } = useServiceEstimate(jobCard.service_estimate || null);

  const qcCount = jobCard.qc_results?.length || 0;
  const rtCount = jobCard.road_test_results?.length || 0;
  const complaintCount = jobCard.job_items?.length || 0;

  const estimateDiagnosis = htmlToPlainText(linkedEstimate?.diagnosis_findings || "").trim();
  const estimateRecommended = htmlToPlainText(linkedEstimate?.recommended_repairs || "").trim();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 -mx-4 border-b border-border/60 bg-background px-4 pb-2 pt-1">
          <div className="dms-tabs-scroll">
            <TabsList className="h-auto w-full flex-wrap justify-start gap-1 bg-muted/50 p-1">
              <TabsTrigger value="overview" className="text-xs sm:text-sm">
                Overview
              </TabsTrigger>
              <TabsTrigger value="qc" className="text-xs sm:text-sm gap-1.5">
                QC checklist
                {qcCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                    {qcCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="road-test" className="text-xs sm:text-sm gap-1.5">
                Road test
                {rtCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                    {rtCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="diagnosis" className="text-xs sm:text-sm gap-1.5">
                Diagnosis
                {complaintCount > 0 && (
                  <Badge variant="secondary" className="h-5 px-1.5 text-[10px] font-normal">
                    {complaintCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain py-4">
        <TabsContent value="overview" className="mt-0 space-y-4 data-[state=inactive]:hidden">
          <DetailSection title="Customer & Vehicle">
            <DetailRow label="Customer" value={jobCard.customer_name} />
            <DetailRow label="Vehicle" value={jobCard.vehicle_model} />
            <DetailRow label="License Plate" value={jobCard.license_plate} />
            <DetailRow label="VIN" value={jobCard.vehicle_vin} />
            <DetailRow
              label="Odometer"
              value={
                jobCard.current_odometer ? `${jobCard.current_odometer.toLocaleString()} km` : undefined
              }
            />
          </DetailSection>
          <DetailSection title="Service Details">
            <DetailRow label="Type" value={jobCard.job_card_type} />
            <DetailRow label="Priority" value={jobCard.priority} />
            <DetailRow
              label="Service Advisor"
              value={jobCard.service_advisor_name || jobCard.service_advisor}
            />
            <DetailRow
              label="Lead Technician"
              value={jobCard.lead_technician_name || jobCard.lead_technician}
            />
            <DetailRow label="Service Bay" value={jobCard.assigned_bay} />
            <DetailRow label="Warranty" value={jobCard.warranty_status} />
          </DetailSection>
          <DetailSection title="Timing">
            <DetailRow
              label="Opened"
              value={
                jobCard.opened_date_time
                  ? new Date(jobCard.opened_date_time).toLocaleString()
                  : undefined
              }
            />
            <DetailRow
              label="Promised Delivery"
              value={
                jobCard.promised_delivery_date_time
                  ? new Date(jobCard.promised_delivery_date_time).toLocaleString()
                  : undefined
              }
            />
            <DetailRow
              label="Completed"
              value={
                jobCard.completed_date_time
                  ? new Date(jobCard.completed_date_time).toLocaleString()
                  : undefined
              }
            />
            <DetailRow
              label="Est. Duration"
              value={
                jobCard.estimated_duration_hours
                  ? `${jobCard.estimated_duration_hours} hrs`
                  : undefined
              }
            />
            <DetailRow
              label="Actual Duration"
              value={
                jobCard.actual_duration_hours
                  ? `${jobCard.actual_duration_hours} hrs`
                  : undefined
              }
            />
          </DetailSection>
          <DetailSection title="Financials">
            <DetailRow label="Labor Cost" value={jobCard.total_labor_cost?.toLocaleString()} />
            <DetailRow label="Parts Cost" value={jobCard.total_parts_cost?.toLocaleString()} />
            <DetailRow label="Total Amount" value={jobCard.total_amount?.toLocaleString()} />
            <DetailRow label="Approval Status" value={jobCard.customer_approval_status} />
            <DetailRow label="Payment Status" value={jobCard.payment_status} />
            <DetailRow label="Invoice" value={jobCard.invoice} />
          </DetailSection>
        </TabsContent>

        <TabsContent value="qc" className="mt-0 space-y-4 data-[state=inactive]:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {jobCard.qc_checklist_template && (
              <Badge variant="outline">Template: {jobCard.qc_checklist_template}</Badge>
            )}
            {jobCard.qc_result && (
              <Badge variant={resultBadgeVariant(jobCard.qc_result)}>{jobCard.qc_result}</Badge>
            )}
            {jobCard.qc_inspector && (
              <span className="text-xs text-muted-foreground">Inspector: {jobCard.qc_inspector}</span>
            )}
          </div>

          {jobCard.qc_results && jobCard.qc_results.length > 0 ? (
            <QCResultsGroupedList rows={jobCard.qc_results} />
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No QC checklist recorded yet.
            </p>
          )}

          {jobCard.qc_fail_reason && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Failure reason</p>
                <p className="text-sm text-destructive">{jobCard.qc_fail_reason}</p>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="road-test" className="mt-0 space-y-4 data-[state=inactive]:hidden">
          <div className="flex flex-wrap items-center gap-2">
            {jobCard.road_test_template && (
              <Badge variant="outline">Template: {jobCard.road_test_template}</Badge>
            )}
            {jobCard.rt_result && (
              <Badge variant={resultBadgeVariant(jobCard.rt_result)}>{jobCard.rt_result}</Badge>
            )}
          </div>

          {jobCard.road_test_results && jobCard.road_test_results.length > 0 ? (
            <div className="rounded-lg border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test item</TableHead>
                    <TableHead>Result</TableHead>
                    <TableHead>Observations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobCard.road_test_results.map((row, idx) => (
                    <TableRow key={row.name || idx}>
                      <TableCell className="font-medium text-sm">
                        {row.test_description || row.test_item || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={resultBadgeVariant(row.result)}>{row.result || "—"}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.observations || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-6 text-center">
              No road test checklist recorded yet.
            </p>
          )}

          {jobCard.road_test_note && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Road test notes</p>
                <p className="text-sm whitespace-pre-wrap">{jobCard.road_test_note}</p>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="diagnosis" className="mt-0 space-y-4 data-[state=inactive]:hidden">
          <DetailSection title="Links">
            <DetailRow label="Inspection" value={jobCard.inspection} />
            <DetailRow label="Service estimate" value={jobCard.service_estimate} />
            <DetailRow label="Appointment" value={jobCard.appointment} />
          </DetailSection>

          <DetailSection title="Customer complaints">
            {jobCard.job_items && jobCard.job_items.length > 0 ? (
              <div className="space-y-3">
                {jobCard.job_items.map((item, idx) => {
                  const text = jobItemComplaintText(item);
                  return (
                    <div key={item.name || idx} className="rounded-md border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground mb-1">
                        #{idx + 1}
                        {item.symptom_category ? ` · ${item.symptom_category}` : ""}
                        {item.severity ? ` · ${item.severity}` : ""}
                      </p>
                      <p className="text-sm whitespace-pre-wrap">{text || "—"}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No complaints on this job card.</p>
            )}
          </DetailSection>

          {(estimateDiagnosis || estimateRecommended || linkedEstimate) && (
            <DetailSection title="Estimate & diagnosis">
              {jobCard.service_estimate && (
                <div className="mb-3">
                  <Button
                    type="button"
                    variant="link"
                    className="h-auto p-0 text-sm"
                    onClick={() =>
                      navigate("estimate-detail", { id: jobCard.service_estimate! })
                    }
                  >
                    Open estimate {jobCard.service_estimate}
                  </Button>
                  {linkedEstimate?.status && (
                    <Badge variant="outline" className="ml-2">
                      {linkedEstimate.status}
                    </Badge>
                  )}
                </div>
              )}
              {estimateDiagnosis && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Problems found</p>
                  <p className="text-sm whitespace-pre-wrap">{estimateDiagnosis}</p>
                </div>
              )}
              {estimateRecommended && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    Recommended repairs
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{estimateRecommended}</p>
                </div>
              )}
            </DetailSection>
          )}

          {(jobCard.service_advisor_notes || jobCard.internal_notes) && (
            <DetailSection title="Notes">
              {jobCard.service_advisor_notes && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Advisor notes</p>
                  <p className="text-sm whitespace-pre-wrap">{jobCard.service_advisor_notes}</p>
                </div>
              )}
              {jobCard.internal_notes && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Workshop notes</p>
                  <p className="text-sm whitespace-pre-wrap">{jobCard.internal_notes}</p>
                </div>
              )}
            </DetailSection>
          )}

          <DetailSection title="Promised delivery">
            <DetailRow
              label="Date & time"
              value={
                jobCard.promised_delivery_date_time
                  ? new Date(jobCard.promised_delivery_date_time).toLocaleString()
                  : undefined
              }
            />
          </DetailSection>
        </TabsContent>
        </div>
      </Tabs>

      <div className="shrink-0 -mx-4 border-t border-border/60 bg-background px-4 py-3">
        <div className="flex justify-end">
          <Button variant="outline" onClick={onOpenFullDetails}>
            Open full job card
          </Button>
        </div>
      </div>
    </div>
  );
}
