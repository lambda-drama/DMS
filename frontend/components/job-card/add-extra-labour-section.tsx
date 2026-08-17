"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DecimalInput } from "@/components/ui/decimal-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SearchableSelect } from "@/components/searchable-select";
import { useVehicleServiceItems } from "@/hooks/use-dms";
import {
  fetchLabourRate,
  fetchVehicleServiceItemLineDefaults,
  formatVehicleServiceItemLabel,
  vehicleServiceItemEstimatedHours,
} from "@/services/common";
import * as jobCardsSvc from "@/services/jobCards";
import { Loader2, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";

interface AddExtraLabourSectionProps {
  jobCardId: string;
  vehicleVin?: string;
  vehicleModel?: string;
  disabled?: boolean;
  /** When false (user lacks Edit Price role), service selection remains enabled but the rate input is read-only. */
  canEditPrice?: boolean;
  onAdded?: () => void;
}

export function AddExtraLabourSection({
  jobCardId,
  vehicleVin,
  vehicleModel,
  disabled = false,
  canEditPrice = true,
  onAdded,
}: AddExtraLabourSectionProps) {
  const [serviceSearch, setServiceSearch] = useState("");
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(
    serviceSearch,
    vehicleModel || undefined,
    vehicleVin || undefined
  );
  const [vehicleServiceItem, setVehicleServiceItem] = useState("");
  const [serviceLabel, setServiceLabel] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(1);
  const [ratePerHour, setRatePerHour] = useState(0);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const handleServiceSelect = async (itemName: string) => {
    if (!itemName) {
      setVehicleServiceItem("");
      setServiceLabel("");
      setEstimatedHours(1);
      setRatePerHour(0);
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

    setVehicleServiceItem(itemName);
    setServiceLabel(label);
    setEstimatedHours(hours || 1);
    setRatePerHour(rate || 0);
  };

  const resetForm = () => {
    setVehicleServiceItem("");
    setServiceLabel("");
    setEstimatedHours(1);
    setRatePerHour(0);
    setNotes("");
    setServiceSearch("");
  };

  const handleSubmit = async () => {
    if (!vehicleServiceItem) {
      toast.error("Select a service item");
      return;
    }
    if (estimatedHours <= 0) {
      toast.error("Hours must be greater than zero");
      return;
    }

    setBusy(true);
    try {
      await jobCardsSvc.addLabourLineToJobCard(jobCardId, {
        vehicle_service_item: vehicleServiceItem,
        estimated_hours: estimatedHours,
        rate_per_hour: ratePerHour || undefined,
        notes: notes.trim() || undefined,
      });
      toast.success("Service line added");
      resetForm();
      onAdded?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add service line");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4" />
          Add service line
        </CardTitle>
        <CardDescription>
          Add labour that was not on the original estimate — useful for repeat / comeback jobs.
          Rate and hours are pre-filled from the service item; edit as needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
          <div className="space-y-1 sm:col-span-5">
            <Label className="text-xs">Service item *</Label>
            <SearchableSelect
              options={
                serviceItems?.map((si) => ({
                  value: si.name,
                  label: formatVehicleServiceItemLabel(si),
                })) || []
              }
              value={vehicleServiceItem}
              onValueChange={(v) => void handleServiceSelect(v)}
              onSearchChange={setServiceSearch}
              placeholder="Search services…"
              isLoading={serviceItemsLoading}
              disabled={disabled || busy}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Hours</Label>
            <DecimalInput
              min={0}
              value={estimatedHours}
              onValueChange={setEstimatedHours}
              disabled={disabled || busy}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">{canEditPrice ? "Rate/hr (editable)" : "Rate/hr (fixed)"}</Label>
            <DecimalInput
              min={0}
              value={ratePerHour}
              onValueChange={canEditPrice ? setRatePerHour : () => {}}
              disabled={disabled || busy || !canEditPrice}
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              type="button"
              className="w-full"
              disabled={disabled || busy || !vehicleServiceItem}
              onClick={() => void handleSubmit()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Wrench className="h-4 w-4 mr-1" />
                  Add service
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Notes (optional)</Label>
          <Textarea
            rows={2}
            placeholder="Why this service is needed…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled || busy}
          />
        </div>
        {serviceLabel ? (
          <p className="text-xs text-muted-foreground">
            Line total preview:{" "}
            <strong>
              {(estimatedHours * (ratePerHour || 0)).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </strong>
            {` · ${serviceLabel}`}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
