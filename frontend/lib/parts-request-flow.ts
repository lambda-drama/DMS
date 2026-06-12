export const PARTS_REQUEST_FLOW_STEPS = [
  { key: "request", label: "Requested" },
  { key: "approve", label: "Approved" },
  { key: "issue", label: "Issued" },
  { key: "receive", label: "Received" },
] as const;

export function partsRequestFlowProgress(status: string): {
  completedThrough: number;
  current: number;
} {
  switch (status) {
    case "Draft":
    case "Pending Approval":
      return { completedThrough: 0, current: 1 };
    case "Approved":
    case "Ready for Issue":
    case "Partially Issued":
      return { completedThrough: 1, current: 2 };
    case "Issued":
      return { completedThrough: 2, current: 3 };
    case "Received":
      return { completedThrough: 3, current: 3 };
    default:
      return { completedThrough: 0, current: 0 };
  }
}

export function partsRequestStatusHint(status: string): string {
  switch (status) {
    case "Pending Approval":
      return "Waiting for parts advisor approval";
    case "Ready for Issue":
    case "Partially Issued":
      return "Warehouse can pick and issue parts";
    case "Issued":
      return "Waiting for technician to confirm receipt at the bay";
    case "Received":
      return "Parts received by workshop";
    case "Cancelled":
      return "Request cancelled";
    default:
      return "";
  }
}
