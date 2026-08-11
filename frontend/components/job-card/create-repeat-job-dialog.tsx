"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/searchable-select";
import { AddLineButton } from "@/components/ui/add-line-button";
import { CreateSparePartDialog } from "@/components/create-spare-part-dialog";
import { CreateServiceItemDialog } from "@/components/create-service-item-dialog";
import { useSpareParts, useVehicleServiceItems } from "@/hooks/use-dms";
import {
  fetchLabourRate,
  fetchSparePartPrice,
  fetchVehicleServiceItemLineDefaults,
  formatVehicleServiceItemLabel,
  sparePartToSelectOption,
  vehicleServiceItemEstimatedHours,
} from "@/services/common";
import * as jobCardsSvc from "@/services/jobCards";
import { htmlToPlainText } from "@/lib/plain-text";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

type RepeatLabourRow = {
  vehicle_service_item: string;
  service_name: string;
  estimated_hours: number;
  rate_per_hour: number;
};

type RepeatPartRow = {
  item_code: string;
  item_name: string;
  quantity_requested: number;
  unit_price: number;
};

function emptyLabourRow(): RepeatLabourRow {
  return {
    vehicle_service_item: "",
    service_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
  };
}

function emptyPartRow(): RepeatPartRow {
  return {
    item_code: "",
    item_name: "",
    quantity_requested: 1,
    unit_price: 0,
  };
}

interface CreateRepeatJobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceJobCard: string;
  defaultComplaint?: string | null;
  vehicleVin?: string | null;
  vehicleModel?: string | null;
  company?: string | null;
  daysRemaining?: number | null;
  onCreated: (name: string) => void;
}

export function CreateRepeatJobDialog({
  open,
  onOpenChange,
  sourceJobCard,
  defaultComplaint,
  vehicleVin,
  vehicleModel,
  company,
  daysRemaining,
  onCreated,
}: CreateRepeatJobDialogProps) {
  const [complaint, setComplaint] = useState("");
  const [labourRows, setLabourRows] = useState<RepeatLabourRow[]>([emptyLabourRow()]);
  const [partRows, setPartRows] = useState<RepeatPartRow[]>([emptyPartRow()]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCreateSparePartDialog, setShowCreateSparePartDialog] = useState(false);
  const [showCreateServiceItemDialog, setShowCreateServiceItemDialog] = useState(false);
  const [createLabourIdx, setCreateLabourIdx] = useState(0);
  const [createPartIdx, setCreatePartIdx] = useState(0);

  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(
    serviceSearch,
    vehicleModel || undefined,
    vehicleVin || undefined
  );
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(
    partSearch,
    undefined,
    company || undefined,
    vehicleModel || undefined,
    vehicleVin || undefined
  );

  useEffect(() => {
    if (!open) return;
    setComplaint(htmlToPlainText(defaultComplaint || "").trim());
    setLabourRows([emptyLabourRow()]);
    setPartRows([emptyPartRow()]);
    setServiceSearch("");
    setPartSearch("");
    setShowCreateSparePartDialog(false);
    setShowCreateServiceItemDialog(false);
    setCreateLabourIdx(0);
    setCreatePartIdx(0);
  }, [open, defaultComplaint, sourceJobCard]);

  const handleServiceSelect = async (idx: number, itemName: string) => {
    if (!itemName) {
      setLabourRows((prev) =>
        prev.map((row, i) => (i === idx ? emptyLabourRow() : row))
      );
      return;
    }
    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    let hours = vehicleServiceItemEstimatedHours(item) || 1;
    let label = formatVehicleServiceItemLabel(item) || itemName;

    try {
      const defaults = await fetchVehicleServiceItemLineDefaults(itemName);
      if (defaults.estimated_hours > 0) hours = defaults.estimated_hours;
      if (defaults.rate_per_hour > 0) rate = defaults.rate_per_hour;
      if (defaults.service_name || defaults.service_code) {
        label = defaults.service_code
          ? `${defaults.service_code}: ${defaults.service_name || itemName}`
          : defaults.service_name || label;
      }
    } catch {
      if (!rate) {
        try {
          rate = await fetchLabourRate(itemName);
        } catch {
          /* ignore */
        }
      }
    }

    setLabourRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              vehicle_service_item: itemName,
              service_name: label,
              estimated_hours: hours || 1,
              rate_per_hour: rate || 0,
            }
          : row
      )
    );
  };

  const handlePartSelect = async (idx: number, partName: string) => {
    if (!partName) {
      setPartRows((prev) =>
        prev.map((row, i) => (i === idx ? emptyPartRow() : row))
      );
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let price = 0;
    try {
      price = await fetchSparePartPrice(partName);
    } catch {
      toast.error("Could not load part price");
    }
    setPartRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              item_code: partName,
              item_name: part?.item_name || partName,
              unit_price: price,
            }
          : row
      )
    );
  };

  const updateLabourRow = (idx: number, patch: Partial<RepeatLabourRow>) => {
    setLabourRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const updatePartRow = (idx: number, patch: Partial<RepeatPartRow>) => {
    setPartRows((prev) =>
      prev.map((row, i) => (i === idx ? { ...row, ...patch } : row))
    );
  };

  const addLabourRow = () => {
    setLabourRows((prev) => [...prev, emptyLabourRow()]);
  };

  const addPartRow = () => {
    setPartRows((prev) => [...prev, emptyPartRow()]);
  };

  const removeLabourRow = (idx: number) => {
    setLabourRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyLabourRow()];
    });
  };

  const removePartRow = (idx: number) => {
    setPartRows((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyPartRow()];
    });
  };

  const handleCreate = async () => {
    const filledLabour = labourRows.filter((r) => r.vehicle_service_item);
    const filledParts = partRows.filter((r) => r.item_code);

    setBusy(true);
    try {
      const created = await jobCardsSvc.createRepeatJobCard(sourceJobCard, {
        customerComplaintSummary: complaint.trim() || undefined,
        labour: filledLabour.map((row) => ({
          vehicle_service_item: row.vehicle_service_item,
          service_name: row.service_name,
          estimated_hours: row.estimated_hours,
          rate_per_hour: row.rate_per_hour,
          complaint: complaint.trim() || undefined,
        })),
        parts: filledParts.map((row) => ({
          item_code: row.item_code,
          quantity_requested: row.quantity_requested,
          unit_price: row.unit_price,
        })),
      });
      const lineNote =
        (created.labour_count || 0) > 0 || (created.parts_count || 0) > 0
          ? ` (${created.labour_count || 0} service, ${created.parts_count || 0} parts)`
          : "";
      toast.success(`Repeat job ${created.name} created${lineNote}`);
      onOpenChange(false);
      onCreated(created.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create repeat job");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Create Repeat Job</DialogTitle>
          <DialogDescription>
            Opens a new job card linked to {sourceJobCard} for the same vehicle. Warranty and
            billing stay yours to set on the new card.
            {daysRemaining != null
              ? ` Comeback window: ${daysRemaining} day(s) remaining.`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="repeat-complaint">Customer complaint (optional)</Label>
            <Textarea
              id="repeat-complaint"
              placeholder="Leave blank to copy from the original job card"
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              rows={3}
              disabled={busy}
            />
          </div>

          <div className="space-y-3 rounded-lg border border-dashed p-3">
            <div>
              <p className="text-sm font-medium">Service lines (optional)</p>
              <p className="text-xs text-muted-foreground">
                Add labour now, or later on the Services tab of the new job card.
              </p>
            </div>

            {labourRows.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-md border p-2 sm:grid-cols-12 sm:items-end"
              >
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Service item</Label>
                  <SearchableSelect
                    options={
                      serviceItems?.map((si) => ({
                        value: si.name,
                        label: formatVehicleServiceItemLabel(si),
                      })) || []
                    }
                    value={row.vehicle_service_item}
                    valueLabel={row.service_name || undefined}
                    onValueChange={(v) => void handleServiceSelect(idx, v)}
                    onSearchChange={setServiceSearch}
                    placeholder="Search services…"
                    isLoading={serviceItemsLoading}
                    disabled={busy}
                    onCreateNew={() => {
                      setCreateLabourIdx(idx);
                      setShowCreateServiceItemDialog(true);
                    }}
                    createNewLabel="New Service Item"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Hours</Label>
                  <DecimalInput
                    min={0}
                    value={row.estimated_hours}
                    onValueChange={(estimated_hours) =>
                      updateLabourRow(idx, { estimated_hours })
                    }
                    disabled={busy}
                  />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Rate/hr</Label>
                  <DecimalInput
                    min={0}
                    value={row.rate_per_hour}
                    onValueChange={(rate_per_hour) =>
                      updateLabourRow(idx, { rate_per_hour })
                    }
                    disabled={busy}
                  />
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={busy}
                    onClick={() => removeLabourRow(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <AddLineButton onClick={addLabourRow} disabled={busy} />
          </div>

          <div className="space-y-3 rounded-lg border border-dashed p-3">
            <div>
              <p className="text-sm font-medium">Parts (optional)</p>
              <p className="text-xs text-muted-foreground">
                Add parts now, or later on the Parts tab of the new job card.
              </p>
            </div>

            {partRows.map((row, idx) => (
              <div
                key={idx}
                className="grid gap-2 rounded-md border p-2 sm:grid-cols-12 sm:items-end"
              >
                <div className="space-y-1 sm:col-span-5">
                  <Label className="text-xs">Spare part</Label>
                  <SearchableSelect
                    options={spareParts?.map(sparePartToSelectOption) || []}
                    value={row.item_code}
                    valueLabel={row.item_name || undefined}
                    onValueChange={(v) => void handlePartSelect(idx, v)}
                    onSearchChange={setPartSearch}
                    placeholder="Search parts…"
                    isLoading={sparePartsLoading}
                    disabled={busy}
                    onCreateNew={() => {
                      setCreatePartIdx(idx);
                      setShowCreateSparePartDialog(true);
                    }}
                    createNewLabel="New Spare Part"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs">Qty</Label>
                  <DecimalInput
                    min={0}
                    value={row.quantity_requested}
                    onValueChange={(quantity_requested) =>
                      updatePartRow(idx, { quantity_requested })
                    }
                    disabled={busy}
                  />
                </div>
                <div className="space-y-1 sm:col-span-3">
                  <Label className="text-xs">Unit price</Label>
                  <DecimalInput
                    min={0}
                    value={row.unit_price}
                    onValueChange={(unit_price) =>
                      updatePartRow(idx, { unit_price })
                    }
                    disabled={busy}
                  />
                </div>
                <div className="flex justify-end sm:col-span-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive"
                    disabled={busy}
                    onClick={() => removePartRow(idx)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            <AddLineButton onClick={addPartRow} disabled={busy} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={() => void handleCreate()}>
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Create Repeat Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

      <CreateSparePartDialog
        open={showCreateSparePartDialog}
        onOpenChange={setShowCreateSparePartDialog}
        onCreated={(itemCode, itemName) => {
          updatePartRow(createPartIdx, {
            item_code: itemCode,
            item_name: itemName,
          });
          setPartSearch(itemCode);
          toast.success(`Spare part ${itemName} created and selected.`);
        }}
      />
      <CreateServiceItemDialog
        open={showCreateServiceItemDialog}
        onOpenChange={setShowCreateServiceItemDialog}
        onCreated={(serviceItemName) => {
          void handleServiceSelect(createLabourIdx, serviceItemName);
          setServiceSearch(serviceItemName);
          toast.success(`Service item created and selected.`);
        }}
      />
    </>
  );
}
