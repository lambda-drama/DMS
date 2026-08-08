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
import { Loader2, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";

type RepeatLabourDraft = {
  key: string;
  vehicle_service_item: string;
  service_name: string;
  estimated_hours: number;
  rate_per_hour: number;
};

type RepeatPartDraft = {
  key: string;
  item_code: string;
  item_name: string;
  quantity_requested: number;
  unit_price: number;
};

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
  const [labourRows, setLabourRows] = useState<RepeatLabourDraft[]>([]);
  const [partRows, setPartRows] = useState<RepeatPartDraft[]>([]);
  const [serviceSearch, setServiceSearch] = useState("");
  const [partSearch, setPartSearch] = useState("");
  const [draftService, setDraftService] = useState("");
  const [draftLabel, setDraftLabel] = useState("");
  const [draftHours, setDraftHours] = useState(1);
  const [draftRate, setDraftRate] = useState(0);
  const [draftPart, setDraftPart] = useState("");
  const [draftPartName, setDraftPartName] = useState("");
  const [draftQty, setDraftQty] = useState(1);
  const [draftUnitPrice, setDraftUnitPrice] = useState(0);
  const [busy, setBusy] = useState(false);

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
    setLabourRows([]);
    setPartRows([]);
    setDraftService("");
    setDraftLabel("");
    setDraftHours(1);
    setDraftRate(0);
    setDraftPart("");
    setDraftPartName("");
    setDraftQty(1);
    setDraftUnitPrice(0);
    setServiceSearch("");
    setPartSearch("");
  }, [open, defaultComplaint, sourceJobCard]);

  const handleServiceSelect = async (itemName: string) => {
    if (!itemName) {
      setDraftService("");
      setDraftLabel("");
      setDraftHours(1);
      setDraftRate(0);
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

    setDraftService(itemName);
    setDraftLabel(label);
    setDraftHours(hours || 1);
    setDraftRate(rate || 0);
  };

  const handlePartSelect = async (partName: string) => {
    if (!partName) {
      setDraftPart("");
      setDraftPartName("");
      setDraftUnitPrice(0);
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let price = 0;
    try {
      price = await fetchSparePartPrice(partName);
    } catch {
      toast.error("Could not load part price");
    }
    setDraftPart(partName);
    setDraftPartName(part?.item_name || partName);
    setDraftUnitPrice(price);
  };

  const addLabourDraft = () => {
    if (!draftService) {
      toast.error("Select a service item");
      return;
    }
    if (draftHours <= 0) {
      toast.error("Hours must be greater than zero");
      return;
    }
    setLabourRows((prev) => [
      ...prev,
      {
        key: `${draftService}-${Date.now()}`,
        vehicle_service_item: draftService,
        service_name: draftLabel || draftService,
        estimated_hours: draftHours,
        rate_per_hour: draftRate,
      },
    ]);
    setDraftService("");
    setDraftLabel("");
    setDraftHours(1);
    setDraftRate(0);
    setServiceSearch("");
  };

  const addPartDraft = () => {
    if (!draftPart) {
      toast.error("Select a spare part");
      return;
    }
    if (draftQty <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }
    setPartRows((prev) => [
      ...prev,
      {
        key: `${draftPart}-${Date.now()}`,
        item_code: draftPart,
        item_name: draftPartName || draftPart,
        quantity_requested: draftQty,
        unit_price: draftUnitPrice,
      },
    ]);
    setDraftPart("");
    setDraftPartName("");
    setDraftQty(1);
    setDraftUnitPrice(0);
    setPartSearch("");
  };

  const handleCreate = async () => {
    // Include in-progress draft rows even if the user didn't click Add.
    const labourPayload = [...labourRows];
    if (draftService && draftHours > 0) {
      labourPayload.push({
        key: `draft-${draftService}`,
        vehicle_service_item: draftService,
        service_name: draftLabel || draftService,
        estimated_hours: draftHours,
        rate_per_hour: draftRate,
      });
    }
    const partsPayload = [...partRows];
    if (draftPart && draftQty > 0) {
      partsPayload.push({
        key: `draft-${draftPart}`,
        item_code: draftPart,
        item_name: draftPartName || draftPart,
        quantity_requested: draftQty,
        unit_price: draftUnitPrice,
      });
    }

    setBusy(true);
    try {
      const created = await jobCardsSvc.createRepeatJobCard(sourceJobCard, {
        customerComplaintSummary: complaint.trim() || undefined,
        labour: labourPayload.map((row) => ({
          vehicle_service_item: row.vehicle_service_item,
          service_name: row.service_name,
          estimated_hours: row.estimated_hours,
          rate_per_hour: row.rate_per_hour,
          complaint: complaint.trim() || undefined,
        })),
        parts: partsPayload.map((row) => ({
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

            {labourRows.length > 0 ? (
              <ul className="space-y-2">
                {labourRows.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.service_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.estimated_hours} hrs ·{" "}
                        {row.rate_per_hour.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                        /hr ·{" "}
                        {(row.estimated_hours * row.rate_per_hour).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={busy}
                      onClick={() =>
                        setLabourRows((prev) => prev.filter((r) => r.key !== row.key))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
              <div className="space-y-1 sm:col-span-6">
                <Label className="text-xs">Service item</Label>
                <SearchableSelect
                  options={
                    serviceItems?.map((si) => ({
                      value: si.name,
                      label: formatVehicleServiceItemLabel(si),
                    })) || []
                  }
                  value={draftService}
                  onValueChange={(v) => void handleServiceSelect(v)}
                  onSearchChange={setServiceSearch}
                  placeholder="Search services…"
                  isLoading={serviceItemsLoading}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Hours</Label>
                <DecimalInput
                  min={0}
                  value={draftHours}
                  onValueChange={setDraftHours}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Rate/hr</Label>
                <DecimalInput
                  min={0}
                  value={draftRate}
                  onValueChange={setDraftRate}
                  disabled={busy}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={busy || !draftService}
                  onClick={addLabourDraft}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-dashed p-3">
            <div>
              <p className="text-sm font-medium">Parts (optional)</p>
              <p className="text-xs text-muted-foreground">
                Add parts now, or later on the Parts tab of the new job card.
              </p>
            </div>

            {partRows.length > 0 ? (
              <ul className="space-y-2">
                {partRows.map((row) => (
                  <li
                    key={row.key}
                    className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.item_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {row.quantity_requested} ×{" "}
                        {row.unit_price.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}{" "}
                        ={" "}
                        {(row.quantity_requested * row.unit_price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      disabled={busy}
                      onClick={() =>
                        setPartRows((prev) => prev.filter((r) => r.key !== row.key))
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="grid gap-2 sm:grid-cols-12 sm:items-end">
              <div className="space-y-1 sm:col-span-6">
                <Label className="text-xs">Spare part</Label>
                <SearchableSelect
                  options={spareParts?.map(sparePartToSelectOption) || []}
                  value={draftPart}
                  onValueChange={(v) => void handlePartSelect(v)}
                  onSearchChange={setPartSearch}
                  placeholder="Search parts…"
                  isLoading={sparePartsLoading}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Qty</Label>
                <DecimalInput
                  min={0}
                  value={draftQty}
                  onValueChange={setDraftQty}
                  disabled={busy}
                />
              </div>
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs">Unit price</Label>
                <DecimalInput
                  min={0}
                  value={draftUnitPrice}
                  onValueChange={setDraftUnitPrice}
                  disabled={busy}
                />
              </div>
              <div className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  disabled={busy || !draftPart}
                  onClick={addPartDraft}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
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
  );
}
