"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/searchable-select";
import { useSpareParts } from "@/hooks/use-dms";
import { fetchSparePartPrice, sparePartToSelectOption } from "@/services/common";
import * as partsSvc from "@/services/partsRequests";
import { Loader2, Plus, Package } from "lucide-react";
import { toast } from "sonner";

interface AddExtraPartSectionProps {
  jobCardId: string;
  leadTechnician?: string;
  warehouse?: string;
  company?: string;
  disabled?: boolean;
  onAdded?: (result?: { parts_request?: string }) => void;
}

export function AddExtraPartSection({
  jobCardId,
  leadTechnician,
  warehouse,
  company,
  disabled = false,
  onAdded,
}: AddExtraPartSectionProps) {
  const [sparePartSearch, setSparePartSearch] = useState("");
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(
    sparePartSearch,
    undefined,
    company || undefined
  );
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [notes, setNotes] = useState("");
  const [requestImmediately, setRequestImmediately] = useState(true);
  const [busy, setBusy] = useState(false);

  const handlePartSelect = async (partName: string) => {
    if (!partName) {
      setItemCode("");
      setItemName("");
      setUnitPrice(0);
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let price = 0;
    try {
      price = await fetchSparePartPrice(partName);
    } catch {
      toast.error("Could not load part price");
    }
    setItemCode(partName);
    setItemName(part?.item_name || partName);
    setUnitPrice(price);
  };

  const resetForm = () => {
    setItemCode("");
    setItemName("");
    setQuantity(1);
    setUnitPrice(0);
    setNotes("");
    setSparePartSearch("");
  };

  const handleSubmit = async () => {
    if (!itemCode) {
      toast.error("Select a spare part");
      return;
    }
    if (quantity <= 0) {
      toast.error("Quantity must be greater than zero");
      return;
    }

    setBusy(true);
    try {
      const result = await partsSvc.addPartLineToJobCard(jobCardId, {
        item_code: itemCode,
        quantity_requested: quantity,
        unit_price: unitPrice || undefined,
        notes: notes.trim() || undefined,
        request_immediately: requestImmediately,
        requested_by: leadTechnician,
      });
      toast.success(
        requestImmediately && result.parts_request
          ? "Part added and request sent to warehouse"
          : "Part added to job card"
      );
      resetForm();
      onAdded?.(result);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add part");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Plus className="h-4 w-4" />
          Add part found during repair
        </CardTitle>
        <CardDescription>
          Add a spare part that was not on the original estimate. Cost is added to this job card.
          For customer approval before fitting, use Additional work below. Recommended selling
          price is pre-filled — edit the unit price when needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-12 sm:items-end">
          <div className="space-y-1 sm:col-span-5">
            <Label className="text-xs">Spare part *</Label>
            <SearchableSelect
              options={spareParts?.map(sparePartToSelectOption) || []}
              value={itemCode}
              onValueChange={(v) => void handlePartSelect(v)}
              onSearchChange={setSparePartSearch}
              placeholder="Search parts…"
              isLoading={sparePartsLoading}
              disabled={disabled || busy}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Qty</Label>
            <Input
              type="number"
              min={0.01}
              step="any"
              value={quantity || ""}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
              disabled={disabled || busy}
            />
          </div>
          <div className="space-y-1 sm:col-span-2">
            <Label className="text-xs">Unit price (editable)</Label>
            <Input
              type="number"
              min={0}
              step="any"
              value={unitPrice || ""}
              onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
              disabled={disabled || busy}
            />
          </div>
          <div className="sm:col-span-3">
            <Button
              type="button"
              className="w-full"
              disabled={disabled || busy || !itemCode}
              onClick={() => void handleSubmit()}
            >
              {busy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Package className="h-4 w-4 mr-1" />
                  {requestImmediately ? "Add & request" : "Add part"}
                </>
              )}
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Notes (optional)</Label>
          <Textarea
            rows={2}
            placeholder="Why this part is needed…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={disabled || busy}
          />
        </div>
        <div className="flex items-center gap-2">
          <Checkbox
            id="request-immediately"
            checked={requestImmediately}
            onCheckedChange={(v) => setRequestImmediately(Boolean(v))}
            disabled={disabled || busy}
          />
          <Label htmlFor="request-immediately" className="text-sm font-normal cursor-pointer">
            Request from warehouse immediately after adding
          </Label>
        </div>
        {itemName && (
          <p className="text-xs text-muted-foreground">
            Line total preview:{" "}
            <strong>{(quantity * (unitPrice || 0)).toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
            {itemName ? ` · ${itemName}` : ""}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
