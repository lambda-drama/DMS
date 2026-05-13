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

const workflowStages: { key: string; label: string; icon: React.ElementType }[] = [
  { key: "Open", label: "Open", icon: Clock },
  { key: "Estimation", label: "Estimation", icon: ClipboardList },
  { key: "Approval", label: "Approval", icon: Shield },
  { key: "Repair", label: "Repair", icon: Wrench },
  { key: "Road Test", label: "Road Test", icon: Car },
  { key: "QC", label: "QC", icon: Settings2 },
  { key: "Completed", label: "Completed", icon: CheckCircle2 },
];

function getStageIndex(status: JobCardStatus): number {
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

export function WorkflowStepper({ status }: { status: JobCardStatus }) {
  const currentIndex = getStageIndex(status);

  if (status === "Draft" || status === "Cancelled") {
    return null;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between overflow-x-auto">
          {workflowStages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = stage.icon;
            return (
              <div key={stage.key} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5 min-w-[80px]">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                      isCompleted
                        ? "bg-primary border-primary text-primary-foreground"
                        : isCurrent
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted bg-muted/30 text-muted-foreground"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
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

export { getStageIndex };
