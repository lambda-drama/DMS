"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Clock,
  ClipboardList,
  Shield,
  Wrench,
  Car,
  Settings2,
  CheckCircle2,
} from "lucide-react";
import type { JobCardStatus } from "@/types/dms";
import { resolveJobCardWorkflowStatus } from "@/lib/job-card-workflow";

const customerWorkflowStages: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "Open", label: "Open", icon: Clock },
  { key: "Estimation", label: "Estimation", icon: ClipboardList },
  { key: "Approval", label: "Approval", icon: Shield },
  { key: "Repair", label: "Repair", icon: Wrench },
  { key: "Road Test", label: "Road Test", icon: Car },
  { key: "QC", label: "QC", icon: Settings2 },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
];

const internalWorkflowStages: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "Repair", label: "Repair", icon: Wrench },
  { key: "Road Test", label: "Road Test", icon: Car },
  { key: "QC", label: "QC", icon: Settings2 },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
];

function getCustomerStageIndex(status: JobCardStatus): number {
  const stageMap: Record<string, number> = {
    Draft: -1,
    Open: 0,
    "Estimation Pending": 1,
    "Estimation Approved": 2,
    "Waiting Customer Approval": 2,
    Scheduled: 2,
    "Repair In Progress": 3,
    "Repair Completed": 3,
    "Waiting Parts": 3,
    "Road Test In Progress": 4,
    "Road Test Completed": 4,
    "QC In Progress": 5,
    "QC Failed": 5,
    Rework: 3,
    Completed: 6,
    Delivered: 7,
    Cancelled: -2,
  };
  return stageMap[status] ?? -1;
}

function getInternalStageIndex(status: JobCardStatus): number {
  const stageMap: Record<string, number> = {
    Draft: 0,
    Open: 0,
    Scheduled: 0,
    "Estimation Pending": 0,
    "Estimation Approved": 0,
    "Waiting Customer Approval": 0,
    "Repair In Progress": 0,
    "Repair Completed": 0,
    "Waiting Parts": 0,
    Rework: 0,
    "Road Test In Progress": 1,
    "Road Test Completed": 1,
    "QC In Progress": 2,
    "QC Failed": 2,
    Completed: 3,
    Delivered: 3,
    Cancelled: -2,
  };
  return stageMap[status] ?? 0;
}

export function WorkflowStepper({
  status,
  jobCardType,
  docstatus,
  editMode = false,
  onStageClick,
  onContinueDraft,
}: {
  status: JobCardStatus;
  jobCardType?: string;
  docstatus?: number;
  editMode?: boolean;
  onStageClick?: (stageKey: string) => void;
  /** When status is Draft, clicking the progress bar continues editing the form. */
  onContinueDraft?: () => void;
}) {
  const workflowStatus = resolveJobCardWorkflowStatus(status, docstatus);
  const isInternal = jobCardType === "Internal";
  const workflowStages = isInternal ? internalWorkflowStages : customerWorkflowStages;
  const currentIndex = isInternal
    ? getInternalStageIndex(workflowStatus)
    : getCustomerStageIndex(workflowStatus);

  if (workflowStatus === "Cancelled") {
    return null;
  }

  if (workflowStatus === "Draft") {
    const draftStages = isInternal
      ? ["Draft", "Repair", "Road Test", "QC", "Done"]
      : ["Draft", "Estimate", "Approval", "Repair", "Road Test", "QC", "Done"];
    return (
      <Card className="min-w-0 overflow-hidden">
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => onContinueDraft?.()}
            disabled={!onContinueDraft}
            title={onContinueDraft ? "Continue editing draft job card" : undefined}
            className={`dms-tabs-scroll flex w-full items-center justify-between rounded-md p-1 text-left ${
              onContinueDraft
                ? "cursor-pointer hover:bg-muted/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                : "cursor-default"
            }`}
          >
            {draftStages.map((label, index) => (
              <div key={label} className="flex items-center">
                <div className="flex min-w-[72px] flex-col items-center gap-1.5">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full border-2 ${
                      index === 0
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-muted bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {index === 0 ? (
                      <ClipboardList className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`text-center text-xs font-medium ${
                      index === 0 ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {index < draftStages.length - 1 ? (
                  <div className="mx-1 h-0.5 w-8 bg-muted" />
                ) : null}
              </div>
            ))}
          </button>
          {onContinueDraft ? (
            <p className="mt-3 text-center text-sm text-muted-foreground">
              Draft — click the progress bar to continue editing
            </p>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="p-4">
        <div className="dms-tabs-scroll flex items-center justify-between">
          {workflowStages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = stage.icon;
            const canOpenStage =
              editMode &&
              Boolean(onStageClick) &&
              stage.key !== "Completed" &&
              (isCompleted || isCurrent);
            return (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <button
                    type="button"
                    disabled={!canOpenStage}
                    onClick={() => canOpenStage && onStageClick?.(stage.key)}
                    title={
                      canOpenStage
                        ? `Edit ${stage.label}`
                        : editMode && stage.key !== "Completed"
                          ? `${stage.label} has not started yet`
                          : undefined
                    }
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-muted/30 text-muted-foreground"
                    } ${canOpenStage ? "cursor-pointer hover:ring-2 hover:ring-primary/40" : "cursor-default"}`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </button>
                  <span
                    className={`text-xs font-medium text-center ${
                      isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                  </span>
                </div>
                {index < workflowStages.length - 1 && (
                  <div
                    className={`h-0.5 w-8 mx-1 ${
                      isCompleted ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export { getCustomerStageIndex as getStageIndex };
