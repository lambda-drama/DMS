"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type EditableLabourLineValues = {
  name: string;
  estimated_hours?: number;
  rate_per_hour?: number;
  custom_display_name?: string;
  display_name?: string;
  service_name?: string;
  vehicle_service_item?: string;
};

interface EditLabourLineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: EditableLabourLineValues | null;
  canEditPrice?: boolean;
  busy?: boolean;
  onSave: (payload: {
    estimated_hours: number;
    rate_per_hour: number;
    display_name: string;
  }) => void;
}

function lineDisplayName(line: EditableLabourLineValues | null) {
  if (!line) return "";
  return (
    line.custom_display_name ||
    line.display_name ||
    line.service_name ||
    line.vehicle_service_item ||
    ""
  );
}

export function EditLabourLineDialog({
  open,
  onOpenChange,
  line,
  canEditPrice = true,
  busy = false,
  onSave,
}: EditLabourLineDialogProps) {
  const [hours, setHours] = useState(0);
  const [rate, setRate] = useState(0);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!open || !line) return;
    setHours(line.estimated_hours || 0);
    setRate(line.rate_per_hour || 0);
    setDisplayName(lineDisplayName(line));
  }, [open, line]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit service line</DialogTitle>
          <DialogDescription>
            Update hours, rate, or display name for{" "}
            {lineDisplayName(line) || "this service line"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Hours</Label>
              <DecimalInput
                min={0}
                value={hours}
                onValueChange={setHours}
                disabled={busy}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">
                {canEditPrice ? "Rate/hr" : "Rate/hr (fixed)"}
              </Label>
              <DecimalInput
                min={0}
                value={rate}
                onValueChange={canEditPrice ? setRate : () => {}}
                disabled={busy || !canEditPrice}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Display name</Label>
            <Input
              value={displayName}
              placeholder="Name on this job card only"
              disabled={busy}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              onSave({
                estimated_hours: hours,
                rate_per_hour: rate,
                display_name: displayName.trim(),
              })
            }
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
