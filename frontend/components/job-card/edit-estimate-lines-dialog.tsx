"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Package, Trash2, Wrench } from "lucide-react";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/searchable-select";
import { AddLineButton } from "@/components/ui/add-line-button";
import { CreateServiceItemDialog } from "@/components/create-service-item-dialog";
import { CreateSparePartDialog } from "@/components/create-spare-part-dialog";
import { GroupDiscountFields } from "@/components/group-discount-fields";
import {
  useServiceEstimate,
  useServicePackagesForVin,
  useSpareParts,
  useTechnicians,
  useVehicleServiceItems,
} from "@/hooks/use-dms";
import { LinkWithCreate } from "@/components/link-with-create";
import { technicianNameFromList } from "@/lib/technician-label";
import {
  fetchLabourRate,
  fetchSparePartPrice,
  fetchVehicleServiceItemLineDefaults,
  formatVehicleServiceItemLabel,
  sparePartToSelectOption,
  vehicleServiceItemEstimatedHours,
} from "@/services/common";
import { fetchServicePackageLines } from "@/services/service-packages";
import * as estimatesSvc from "@/services/serviceEstimates";
import {
  buildGroupDiscountPayload,
  type InvoiceDiscountMode,
} from "@/lib/invoice-discount";

type LabourRow = {
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  display_name: string;
  technician: string;
  technician_name: string;
  estimated_hours: number;
  rate_per_hour: number;
};

type PartRow = {
  item_code: string;
  item_name: string;
  bin_location?: string;
  quantity_requested: number;
  unit_price: number;
};

function emptyLabourRow(): LabourRow {
  return {
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    display_name: "",
    technician: "",
    technician_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
  };
}

function emptyPartRow(): PartRow {
  return {
    item_code: "",
    item_name: "",
    quantity_requested: 1,
    unit_price: 0,
  };
}

function discountModeFromBackend(type?: string | null): InvoiceDiscountMode {
  if (!type) return "none";
  const t = type.toLowerCase();
  if (t === "percentage") return "percentage";
  if (t === "amount") return "amount";
  return "none";
}

interface EditEstimateLinesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimateName: string;
  vehicleVin?: string;
  vehicleModel?: string;
  onSaved?: () => void;
}

export function EditEstimateLinesDialog({
  open,
  onOpenChange,
  estimateName,
  vehicleVin,
  vehicleModel,
  onSaved,
}: EditEstimateLinesDialogProps) {
  const { data: estimate, isLoading, mutate } = useServiceEstimate(
    open && estimateName ? estimateName : null
  );
  const [busy, setBusy] = useState(false);
  const [labourRows, setLabourRows] = useState<LabourRow[]>([emptyLabourRow()]);
  const [partRows, setPartRows] = useState<PartRow[]>([emptyPartRow()]);
  const [serviceItemSearch, setServiceItemSearch] = useState("");
  const [sparePartSearch, setSparePartSearch] = useState("");
  const [selectedServicePackage, setSelectedServicePackage] = useState("");
  const [warrantyApplicationType, setWarrantyApplicationType] = useState("");
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [labourDiscountInput, setLabourDiscountInput] = useState("");
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [partsDiscountInput, setPartsDiscountInput] = useState("");
  const [isLoadingPackageLines, setIsLoadingPackageLines] = useState(false);
  const [showCreateServiceItemDialog, setShowCreateServiceItemDialog] = useState(false);
  const [showCreateSparePartDialog, setShowCreateSparePartDialog] = useState(false);
  const [createLabourIdx, setCreateLabourIdx] = useState(0);
  const [createPartIdx, setCreatePartIdx] = useState(0);
  const lastAppliedPackageRef = useRef<string | null>(null);
  const hydratedRef = useRef<string | null>(null);

  const vin = estimate?.vehicle_vin || vehicleVin || "";
  const model = estimate?.vehicle_model || vehicleModel || "";

  // Match extra-labour picker: VIN is enough for the backend to resolve model.
  // Passing a display label as vehicle_model can filter out every item.
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(
    serviceItemSearch,
    undefined,
    vin || undefined
  );
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(
    sparePartSearch,
    undefined,
    estimate?.company || undefined,
    model || undefined,
    vin || undefined
  );
  const { data: servicePackagesForVin, isLoading: servicePackagesLoading } =
    useServicePackagesForVin(vin || null, model || null);
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();

  useEffect(() => {
    if (!open || !estimate) return;
    if (hydratedRef.current === estimate.name) return;
    hydratedRef.current = estimate.name;

    const loadedLabour = (estimate.labour || []).map((row) => ({
      vehicle_service_item: row.vehicle_service_item || "",
      vehicle_service_item_name: row.service_name || row.vehicle_service_item || "",
      display_name:
        row.custom_display_name ||
        row.display_name ||
        row.service_name ||
        row.vehicle_service_item ||
        "",
      technician: row.technician || "",
      technician_name: row.technician_name || "",
      estimated_hours: row.estimated_hours ?? 1,
      rate_per_hour: row.rate_per_hour ?? 0,
    }));
    const loadedParts = (estimate.parts || []).map((row) => ({
      item_code: row.item_code || "",
      item_name: row.part_name || row.item_code || "",
      bin_location: row.bin_location || "",
      quantity_requested: row.quantity_requested ?? 1,
      unit_price: row.unit_price ?? 0,
    }));
    setLabourRows(loadedLabour.length ? loadedLabour : [emptyLabourRow()]);
    setPartRows(loadedParts.length ? loadedParts : [emptyPartRow()]);
    setSelectedServicePackage(estimate.service_package || "");
    lastAppliedPackageRef.current = estimate.service_package || null;
    setWarrantyApplicationType(estimate.warranty_application_type || "");
    setLabourDiscountMode(discountModeFromBackend(estimate.labour_discount_type));
    setLabourDiscountInput(
      estimate.labour_discount_value ? String(estimate.labour_discount_value) : ""
    );
    setPartsDiscountMode(discountModeFromBackend(estimate.parts_discount_type));
    setPartsDiscountInput(
      estimate.parts_discount_value ? String(estimate.parts_discount_value) : ""
    );
  }, [open, estimate]);

  useEffect(() => {
    if (!open) hydratedRef.current = null;
  }, [open]);

  const populateFromServicePackage = useCallback(
    async (packageName: string) => {
      setIsLoadingPackageLines(true);
      try {
        const lines = await fetchServicePackageLines(packageName, {
          vin,
          vehicleModel: model,
        });
        setLabourRows(
          lines.labour.length
            ? lines.labour.map((row) => {
                const label = row.service_code
                  ? `${row.service_code}: ${row.service_name || row.vehicle_service_item}`
                  : row.service_name || row.vehicle_service_item;
                return {
                  vehicle_service_item: row.vehicle_service_item,
                  vehicle_service_item_name: label,
                  display_name: label,
                  technician: "",
                  technician_name: "",
                  estimated_hours: row.estimated_hours,
                  rate_per_hour: row.rate_per_hour,
                };
              })
            : [emptyLabourRow()]
        );
        setPartRows(
          lines.parts.length
            ? lines.parts.map((row) => ({
                item_code: row.item_code,
                item_name: row.item_name || row.item_code,
                bin_location: row.bin_location,
                quantity_requested: row.quantity_requested,
                unit_price: row.unit_price,
              }))
            : [emptyPartRow()]
        );
        if ((lines.labour_discount_amount || 0) > 0) {
          setLabourDiscountMode("amount");
          setLabourDiscountInput(String(lines.labour_discount_amount));
        }
        toast.success(
          `Loaded "${lines.package_name || packageName}": ${lines.labour.length} labour, ${lines.parts.length} parts`
        );
      } catch (err) {
        lastAppliedPackageRef.current = null;
        toast.error(err instanceof Error ? err.message : "Could not load service package");
      } finally {
        setIsLoadingPackageLines(false);
      }
    },
    [vin, model]
  );

  const servicePackageOptions = useMemo(
    () =>
      servicePackagesForVin?.packages?.map((p) => ({
        value: p.name,
        label: p.package_id
          ? `${p.package_id} — ${p.description || p.package_name}`
          : p.description || p.package_name,
      })) || [],
    [servicePackagesForVin]
  );

  const handlePackageChange = (value: string) => {
    setSelectedServicePackage(value);
    if (!value) {
      lastAppliedPackageRef.current = null;
      return;
    }
    if (lastAppliedPackageRef.current === value) return;
    lastAppliedPackageRef.current = value;
    void populateFromServicePackage(value);
  };

  const handleServiceItemSelect = async (idx: number, itemName: string) => {
    if (!itemName) {
      setLabourRows((prev) => prev.map((row, i) => (i === idx ? emptyLabourRow() : row)));
      return;
    }
    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    let estHours = vehicleServiceItemEstimatedHours(item);
    let serviceLabel = formatVehicleServiceItemLabel(item) || itemName;
    try {
      const defaults = await fetchVehicleServiceItemLineDefaults(itemName);
      if (defaults.estimated_hours > 0) estHours = defaults.estimated_hours;
      if (defaults.rate_per_hour > 0) rate = defaults.rate_per_hour;
      if (defaults.service_name || defaults.service_code) {
        serviceLabel = defaults.service_code
          ? `${defaults.service_code}: ${defaults.service_name || itemName}`
          : defaults.service_name || serviceLabel;
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
              ...row,
              vehicle_service_item: itemName,
              vehicle_service_item_name: serviceLabel,
              display_name: serviceLabel,
              estimated_hours: estHours > 0 ? estHours : row.estimated_hours || 1,
              rate_per_hour: rate || row.rate_per_hour,
            }
          : row
      )
    );
  };

  const handleSparePartSelect = async (idx: number, partName: string) => {
    if (!partName) {
      setPartRows((prev) => prev.map((row, i) => (i === idx ? emptyPartRow() : row)));
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let unitPrice = 0;
    try {
      unitPrice = await fetchSparePartPrice(partName);
    } catch {
      toast.error("Could not load spare part unit price");
    }
    setPartRows((prev) =>
      prev.map((row, i) =>
        i === idx
          ? {
              ...row,
              item_code: partName,
              item_name: part?.item_name || partName,
              bin_location: part?.bin_location || "",
              unit_price: unitPrice,
            }
          : row
      )
    );
  };

  const updateLabourRow = (idx: number, patch: Partial<LabourRow>) => {
    setLabourRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const updatePartRow = (idx: number, patch: Partial<PartRow>) => {
    setPartRows((prev) => prev.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const blocked = Boolean(
    estimate && ["Rejected", "Cancelled"].includes(estimate.status)
  );

  const handleSave = async () => {
    if (!estimateName || blocked) return;
    const filledLabour = labourRows.filter((r) => r.vehicle_service_item);
    const filledParts = partRows.filter((r) => r.item_code);
    setBusy(true);
    try {
      await estimatesSvc.updateServiceEstimate(estimateName, {
        service_package: selectedServicePackage || undefined,
        warranty_application_type:
          warrantyApplicationType && warrantyApplicationType !== "none"
            ? warrantyApplicationType
            : "",
        ...(warrantyApplicationType === "Discount"
          ? {
              labour_discount: buildGroupDiscountPayload(
                labourDiscountMode,
                labourDiscountInput
              ),
              parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
            }
          : {}),
        labour: filledLabour.map((row) => ({
          vehicle_service_item: row.vehicle_service_item,
          service_name: row.vehicle_service_item_name,
          custom_display_name: row.display_name.trim() || row.vehicle_service_item_name,
          technician: row.technician || undefined,
          estimated_hours: row.estimated_hours,
          rate_per_hour: row.rate_per_hour,
          amount: (row.estimated_hours || 0) * (row.rate_per_hour || 0),
        })),
        parts: filledParts.map((row) => ({
          item_code: row.item_code,
          part_name: row.item_name,
          bin_location: row.bin_location,
          quantity_requested: row.quantity_requested,
          unit_price: row.unit_price,
          total_amount: (row.quantity_requested || 0) * (row.unit_price || 0),
        })),
      } as Parameters<typeof estimatesSvc.updateServiceEstimate>[1]);
      await mutate();
      toast.success("Estimate updated");
      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update estimate");
    } finally {
      setBusy(false);
    }
  };

  const showPackage = Boolean(selectedServicePackage || servicePackageOptions.length);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit estimate lines</DialogTitle>
            <DialogDescription>
              Change labour, parts
              {showPackage ? ", service package" : ""}
              , and warranty application on {estimateName || "this estimate"} only.
            </DialogDescription>
          </DialogHeader>

          {isLoading || !estimate ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : blocked ? (
            <p className="text-sm text-muted-foreground">
              This estimate is {estimate.status.toLowerCase()} and cannot be edited.
            </p>
          ) : (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Warranty application type</Label>
                <Select
                  value={warrantyApplicationType || "none"}
                  onValueChange={(value) => {
                    setWarrantyApplicationType(value === "none" ? "" : value);
                    if (value !== "Discount") {
                      setLabourDiscountMode("none");
                      setLabourDiscountInput("");
                      setPartsDiscountMode("none");
                      setPartsDiscountInput("");
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="None (customer pays all)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (customer pays all)</SelectItem>
                    <SelectItem value="All Invoice">All Invoice</SelectItem>
                    <SelectItem value="Labour">Labour</SelectItem>
                    <SelectItem value="Spare Part">Spare Part</SelectItem>
                    <SelectItem value="Discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {warrantyApplicationType === "Discount" && (
                <div className="grid gap-4 md:grid-cols-2">
                  <GroupDiscountFields
                    label="Labour"
                    mode={labourDiscountMode}
                    onModeChange={setLabourDiscountMode}
                    value={labourDiscountInput}
                    onValueChange={setLabourDiscountInput}
                    subtotal={labourRows.reduce(
                      (sum, row) =>
                        sum + (row.estimated_hours || 0) * (row.rate_per_hour || 0),
                      0
                    )}
                  />
                  <GroupDiscountFields
                    label="Parts"
                    mode={partsDiscountMode}
                    onModeChange={setPartsDiscountMode}
                    value={partsDiscountInput}
                    onValueChange={setPartsDiscountInput}
                    subtotal={partRows.reduce(
                      (sum, row) =>
                        sum + (row.quantity_requested || 0) * (row.unit_price || 0),
                      0
                    )}
                  />
                </div>
              )}

              {showPackage && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Service package
                  </Label>
                  <SearchableSelect
                    portaled
                    options={servicePackageOptions}
                    value={selectedServicePackage}
                    onValueChange={handlePackageChange}
                    placeholder={
                      servicePackagesLoading || isLoadingPackageLines
                        ? "Loading…"
                        : "Select service package…"
                    }
                    isLoading={servicePackagesLoading || isLoadingPackageLines}
                    disabled={isLoadingPackageLines}
                  />
                </div>
              )}

              <div className="space-y-3">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <Wrench className="h-4 w-4" />
                  Labour
                </p>
                {labourRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end"
                  >
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Service item</Label>
                      <SearchableSelect
                        portaled
                        options={(Array.isArray(serviceItems) ? serviceItems : []).map((si) => ({
                          value: si.name,
                          label: formatVehicleServiceItemLabel(si),
                        }))}
                        value={row.vehicle_service_item}
                        valueLabel={row.vehicle_service_item_name || undefined}
                        onValueChange={(val) => void handleServiceItemSelect(idx, val)}
                        onSearchChange={setServiceItemSearch}
                        placeholder="Search items…"
                        isLoading={serviceItemsLoading}
                        onCreateNew={() => {
                          setCreateLabourIdx(idx);
                          setShowCreateServiceItemDialog(true);
                        }}
                        createNewLabel="New Service Item"
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Technician</Label>
                      <LinkWithCreate
                        doctype="Technician"
                        onCreated={(name, label) => {
                          updateLabourRow(idx, {
                            technician: name,
                            technician_name: label || name,
                          });
                        }}
                      >
                        <SearchableSelect
                          portaled
                          options={
                            technicians?.map((t) => ({
                              value: t.name,
                              label: t.full_name || t.name,
                            })) || []
                          }
                          value={row.technician}
                          valueLabel={
                            row.technician_name ||
                            technicianNameFromList(row.technician, technicians)
                          }
                          onValueChange={(val) => {
                            const tech = technicians?.find((t) => t.name === val);
                            updateLabourRow(idx, {
                              technician: val,
                              technician_name: tech?.full_name || val,
                            });
                          }}
                          placeholder="Search technicians…"
                          isLoading={techniciansLoading}
                        />
                      </LinkWithCreate>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Hours</Label>
                      <DecimalInput
                        min={0}
                        value={row.estimated_hours}
                        onValueChange={(estimated_hours) =>
                          updateLabourRow(idx, { estimated_hours })
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Rate/hr</Label>
                      <DecimalInput
                        min={0}
                        value={row.rate_per_hour}
                        onValueChange={(rate_per_hour) =>
                          updateLabourRow(idx, { rate_per_hour })
                        }
                      />
                    </div>
                    <div className="flex justify-end sm:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          setLabourRows((prev) => {
                            const next = prev.filter((_, i) => i !== idx);
                            return next.length ? next : [emptyLabourRow()];
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-1 sm:col-span-12">
                      <Label className="text-xs">Display name</Label>
                      <Input
                        value={row.display_name}
                        placeholder="Name on this estimate only"
                        disabled={!row.vehicle_service_item}
                        onChange={(e) =>
                          updateLabourRow(idx, { display_name: e.target.value })
                        }
                      />
                    </div>
                  </div>
                ))}
                <AddLineButton onClick={() => setLabourRows((prev) => [...prev, emptyLabourRow()])} />
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium">Parts</p>
                {partRows.map((row, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-12 sm:items-end"
                  >
                    <div className="space-y-1 sm:col-span-5">
                      <Label className="text-xs">Spare part</Label>
                      <SearchableSelect
                        portaled
                        options={(Array.isArray(spareParts) ? spareParts : []).map(
                          sparePartToSelectOption
                        )}
                        value={row.item_code}
                        valueLabel={row.item_name || undefined}
                        onValueChange={(val) => void handleSparePartSelect(idx, val)}
                        onSearchChange={setSparePartSearch}
                        placeholder="Search parts…"
                        isLoading={sparePartsLoading}
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
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Unit price</Label>
                      <DecimalInput
                        min={0}
                        value={row.unit_price}
                        onValueChange={(unit_price) => updatePartRow(idx, { unit_price })}
                      />
                    </div>
                    <div className="flex justify-end sm:col-span-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() =>
                          setPartRows((prev) => {
                            const next = prev.filter((_, i) => i !== idx);
                            return next.length ? next : [emptyPartRow()];
                          })
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <AddLineButton onClick={() => setPartRows((prev) => [...prev, emptyPartRow()])} />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={busy || isLoading || blocked}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save estimate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateServiceItemDialog
        open={showCreateServiceItemDialog}
        onOpenChange={setShowCreateServiceItemDialog}
        onCreated={(serviceItemName) => {
          void handleServiceItemSelect(createLabourIdx, serviceItemName);
          setServiceItemSearch(serviceItemName);
        }}
      />
      <CreateSparePartDialog
        open={showCreateSparePartDialog}
        onOpenChange={setShowCreateSparePartDialog}
        onCreated={(itemCode, itemName) => {
          updatePartRow(createPartIdx, { item_code: itemCode, item_name: itemName });
          setSparePartSearch(itemCode);
        }}
      />
    </>
  );
}
