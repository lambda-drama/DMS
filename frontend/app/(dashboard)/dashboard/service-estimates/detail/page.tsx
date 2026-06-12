"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { SearchableSelect } from "@/components/searchable-select";
import { SignaturePad } from "@/components/signature-pad";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Loader2,
  Plus,
  Stethoscope,
  Trash2,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import * as estimatesSvc from "@/services/serviceEstimates";
import { fetchSparePartPrice, fetchLabourRate, uploadFile } from "@/services/common";
import { useServiceEstimate, useSpareParts, useVehicleServiceItems } from "@/hooks/use-dms";

type EstimateLabourRow = {
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  estimated_hours: number;
  rate_per_hour: number;
};

type EstimatePartRow = {
  item_code: string;
  item_name: string;
  quantity_requested: number;
  unit_price: number;
};

export default function ServiceEstimateDetailPage() {
  const { viewParams, navigate } = useNavigation();
  const id = viewParams.get("id") || "";
  const { data: estimate, isLoading, error, mutate } = useServiceEstimate(id || null);

  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("diagnosis");
  const [diagnosisFindings, setDiagnosisFindings] = useState("");
  const [recommendedRepairs, setRecommendedRepairs] = useState("");
  const [labourRows, setLabourRows] = useState<EstimateLabourRow[]>([]);
  const [partRows, setPartRows] = useState<EstimatePartRow[]>([]);
  const [newLabour, setNewLabour] = useState<EstimateLabourRow>({
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
  });
  const [newPart, setNewPart] = useState<EstimatePartRow>({
    item_code: "",
    item_name: "",
    quantity_requested: 1,
    unit_price: 0,
  });
  const [serviceItemSearch, setServiceItemSearch] = useState("");
  const [sparePartSearch, setSparePartSearch] = useState("");
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(serviceItemSearch);
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(sparePartSearch);
  const [acceptSignature, setAcceptSignature] = useState("");
  const [rejectSignature, setRejectSignature] = useState("");
  const [signatureUploading, setSignatureUploading] = useState(false);
  const [startRepair, setStartRepair] = useState(false);

  useEffect(() => {
    if (!estimate) return;
    setDiagnosisFindings(estimate.diagnosis_findings || "");
    setRecommendedRepairs(estimate.recommended_repairs || "");
    setLabourRows(
      (estimate.labour || []).map((row) => ({
        vehicle_service_item: row.vehicle_service_item || "",
        vehicle_service_item_name:
          row.service_name || row.vehicle_service_item || "",
        estimated_hours: row.estimated_hours ?? 1,
        rate_per_hour: row.rate_per_hour ?? 0,
      }))
    );
    setPartRows(
      (estimate.parts || []).map((row) => ({
        item_code: row.item_code || "",
        item_name: row.part_name || row.item_code || "",
        quantity_requested: row.quantity_requested ?? 1,
        unit_price: row.unit_price ?? 0,
      }))
    );
  }, [estimate]);

  const editable = useMemo(
    () => estimate && !["Accepted", "Rejected", "Cancelled"].includes(estimate.status),
    [estimate]
  );

  const runAction = useCallback(
    async (label: string, fn: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await fn();
        await mutate();
        toast.success(label);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `Failed: ${label}`);
      } finally {
        setBusy(false);
      }
    },
    [mutate]
  );

  const saveEstimate = async () => {
    if (!id) return;
    setBusy(true);
    try {
      await estimatesSvc.updateServiceEstimate(id, {
        diagnosis_findings: diagnosisFindings,
        recommended_repairs: recommendedRepairs,
        labour: labourRows.map((row) => ({
          vehicle_service_item: row.vehicle_service_item,
          service_name: row.vehicle_service_item_name,
          estimated_hours: row.estimated_hours,
          rate_per_hour: row.rate_per_hour,
          amount: (row.estimated_hours || 0) * (row.rate_per_hour || 0),
        })),
        parts: partRows.map((row) => ({
          item_code: row.item_code,
          part_name: row.item_name,
          quantity_requested: row.quantity_requested,
          unit_price: row.unit_price,
          total_amount: (row.quantity_requested || 0) * (row.unit_price || 0),
        })),
      });
      await mutate();
      toast.success("Estimate saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  };

  const handleServiceItemSelect = async (itemName: string) => {
    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    if (!rate && itemName) {
      try {
        rate = await fetchLabourRate(itemName);
      } catch {
        /* ignore */
      }
    }
    const estMinutes = parseFloat(item?.custom_estimated_timemin || "0") || 0;
    const estHours = estMinutes > 0 ? Math.round((estMinutes / 60) * 10) / 10 : 0;
    setNewLabour((prev) => ({
      ...prev,
      vehicle_service_item: itemName,
      vehicle_service_item_name:
        item?.service_item || item?.custom_item_name || itemName,
      estimated_hours: estHours || prev.estimated_hours || 1,
      rate_per_hour: rate || prev.rate_per_hour,
    }));
  };

  const handleSparePartSelect = async (partName: string) => {
    if (!partName) {
      setNewPart({ item_code: "", item_name: "", quantity_requested: 1, unit_price: 0 });
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let unitPrice = 0;
    try {
      unitPrice = await fetchSparePartPrice(partName);
    } catch {
      toast.error("Could not load spare part unit price");
    }
    setNewPart({
      item_code: partName,
      item_name: part?.item_name || partName,
      quantity_requested: 1,
      unit_price: unitPrice,
    });
  };

  const addLabourRow = () => {
    if (!newLabour.vehicle_service_item) {
      toast.error("Please select a service item");
      return;
    }
    setLabourRows((prev) => [...prev, { ...newLabour }]);
    setNewLabour({
      vehicle_service_item: "",
      vehicle_service_item_name: "",
      estimated_hours: 0,
      rate_per_hour: 0,
    });
  };

  const removeLabourRow = (idx: number) => {
    setLabourRows((prev) => prev.filter((_, i) => i !== idx));
  };

  const addPartRow = () => {
    if (!newPart.item_code) {
      toast.error("Please select a spare part");
      return;
    }
    setPartRows((prev) => [...prev, { ...newPart }]);
    setNewPart({ item_code: "", item_name: "", quantity_requested: 1, unit_price: 0 });
  };

  const removePartRow = (idx: number) => {
    setPartRows((prev) => prev.filter((_, i) => i !== idx));
  };

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-muted-foreground">No estimate ID provided</p>
        <Button variant="outline" onClick={() => navigate("service-estimates")}>
          Back to estimates
        </Button>
      </div>
    );
  }

  if (isLoading || !estimate) {
    return (
      <div className="flex justify-center py-24">
        {error ? (
          <p className="text-destructive">Failed to load estimate</p>
        ) : (
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        )}
      </div>
    );
  }

  const status = estimate.status;
  const labourTotal = labourRows.reduce(
    (sum, row) => sum + (row.estimated_hours || 0) * (row.rate_per_hour || 0),
    0
  );
  const partsTotal = partRows.reduce(
    (sum, row) => sum + (row.quantity_requested || 0) * (row.unit_price || 0),
    0
  );

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate("service-estimates")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold sm:text-2xl">{estimate.name}</h1>
              <Badge variant="outline">{status}</Badge>
              {estimate.diagnostic_fee_voided ? (
                <Badge className="bg-green-600">Diagnostic fee voided</Badge>
              ) : null}
            </div>
            <p className="mt-1 truncate text-muted-foreground">
              {estimate.customer_name || estimate.customer} — {estimate.license_plate || estimate.vehicle_vin}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <PrintFormatDropdown doctype="DMS Service Estimate" docName={id} />
          {estimate.job_card && (
            <Button variant="outline" size="sm" onClick={() => navigate("job-card-detail", { id: estimate.job_card! })}>
              View Job Card
            </Button>
          )}
          {estimate.inspection && (
            <Button variant="outline" size="sm" onClick={() => navigate("inspection-detail", { id: estimate.inspection! })}>
              View Inspection
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Diagnostic fee</p>
            <p className="text-lg font-semibold">{(estimate.diagnostic_fee || 0).toLocaleString()} ETB</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Before VAT</p>
            <p className="text-lg font-semibold">{(estimate.total_before_vat || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">VAT ({estimate.vat_rate || 15}%)</p>
            <p className="text-lg font-semibold">{(estimate.vat_amount || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Grand total</p>
            <p className="text-lg font-semibold">{(estimate.grand_total || 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="dms-tabs-scroll w-full justify-start">
          <TabsTrigger value="diagnosis">
            <Stethoscope className="mr-2 h-4 w-4" />
            Diagnosis
          </TabsTrigger>
          <TabsTrigger value="estimation">
            <ClipboardList className="mr-2 h-4 w-4" />
            Estimation
          </TabsTrigger>
          <TabsTrigger value="approval">Customer approval</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diagnosis report</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The mechanic performs the diagnosis. The service advisor records what was found and what is
                recommended to fix it.
              </p>

              <div className="space-y-2">
                <Label>Problems found</Label>
                <Textarea
                  value={diagnosisFindings}
                  onChange={(e) => setDiagnosisFindings(e.target.value)}
                  disabled={!editable}
                  rows={5}
                  placeholder="List all problems identified during diagnosis..."
                />
              </div>

              <div className="space-y-2">
                <Label>Recommended repairs</Label>
                <Textarea
                  value={recommendedRepairs}
                  onChange={(e) => setRecommendedRepairs(e.target.value)}
                  disabled={!editable}
                  rows={5}
                  placeholder="Describe the recommended work to resolve the problems..."
                />
              </div>

              {editable && (
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={saveEstimate} disabled={busy}>
                    Save diagnosis
                  </Button>
                  {["Diagnosis In Progress", "Draft"].includes(status) && (
                    <Button
                      onClick={() =>
                        runAction("Diagnosis completed", async () => {
                          await saveEstimate();
                          await estimatesSvc.completeDiagnosis(id, {
                            diagnosis_findings: diagnosisFindings,
                            recommended_repairs: recommendedRepairs,
                          });
                          setActiveTab("estimation");
                        })
                      }
                      disabled={busy || (!diagnosisFindings.trim() && !recommendedRepairs.trim())}
                    >
                      Complete diagnosis
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}
                  {status === "Diagnosis Complete" && (
                    <Button
                      onClick={() =>
                        runAction("Estimation started", () => estimatesSvc.startEstimation(id))
                      }
                      disabled={busy}
                    >
                      Start estimation
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estimation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Labour Lines
              </CardTitle>
              <CardDescription>Add labour operations for the repair estimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {labourRows.length > 0 && (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[40rem] text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Service Item</th>
                        <th className="p-3 text-right">Hours</th>
                        <th className="p-3 text-right">Rate/Hr</th>
                        <th className="p-3 text-right">Amount</th>
                        {editable && <th className="w-10 p-3" />}
                      </tr>
                    </thead>
                    <tbody>
                      {labourRows.map((row, idx) => (
                        <tr key={`${row.vehicle_service_item}-${idx}`} className="border-t">
                          <td className="p-3">
                            {row.vehicle_service_item_name || row.vehicle_service_item}
                          </td>
                          <td className="p-3 text-right">{row.estimated_hours}</td>
                          <td className="p-3 text-right">
                            {row.rate_per_hour.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {(row.estimated_hours * row.rate_per_hour).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          {editable && (
                            <td className="p-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLabourRow(idx)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/40">
                        <td colSpan={3} className="p-3 text-right font-medium">
                          Labour subtotal
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        {editable && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {editable && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-2">
                  <div className="space-y-1 sm:col-span-4">
                    <Label className="text-xs">Service Item *</Label>
                    <SearchableSelect
                      options={
                        serviceItems?.map((si) => ({
                          value: si.name,
                          label: si.service_item || si.custom_item_name || si.name,
                          description: si.custom_rate ? `Rate: ${si.custom_rate}` : undefined,
                        })) || []
                      }
                      value={newLabour.vehicle_service_item}
                      onValueChange={handleServiceItemSelect}
                      onSearchChange={setServiceItemSearch}
                      placeholder="Search items..."
                      isLoading={serviceItemsLoading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:contents">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Hours</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min={0}
                        placeholder="0"
                        value={newLabour.estimated_hours || ""}
                        onChange={(e) =>
                          setNewLabour((prev) => ({
                            ...prev,
                            estimated_hours: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Rate/Hr</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={newLabour.rate_per_hour || ""}
                        onChange={(e) =>
                          setNewLabour((prev) => ({
                            ...prev,
                            rate_per_hour: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" onClick={addLabourRow} className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {labourRows.length === 0 && !editable && (
                <p className="text-sm text-muted-foreground">No labour lines added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parts Required</CardTitle>
              <CardDescription>Add spare parts needed for this estimate</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {partRows.length > 0 && (
                <div className="border rounded-lg overflow-x-auto">
                  <table className="w-full min-w-[36rem] text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="p-3 text-left">Part</th>
                        <th className="p-3 text-right">Qty</th>
                        <th className="p-3 text-right">Unit Price</th>
                        <th className="p-3 text-right">Total</th>
                        {editable && <th className="w-10 p-3" />}
                      </tr>
                    </thead>
                    <tbody>
                      {partRows.map((row, idx) => (
                        <tr key={`${row.item_code}-${idx}`} className="border-t">
                          <td className="p-3">{row.item_name || row.item_code}</td>
                          <td className="p-3 text-right">{row.quantity_requested}</td>
                          <td className="p-3 text-right">
                            {row.unit_price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-medium">
                            {(row.quantity_requested * row.unit_price).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                            })}
                          </td>
                          {editable && (
                            <td className="p-3">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removePartRow(idx)}
                                className="h-8 w-8 text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t bg-muted/40">
                        <td colSpan={3} className="p-3 text-right font-medium">
                          Parts subtotal
                        </td>
                        <td className="p-3 text-right font-semibold">
                          {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        {editable && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {editable && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end sm:gap-2">
                  <div className="space-y-1 sm:col-span-5">
                    <Label className="text-xs">Spare Part *</Label>
                    <SearchableSelect
                      options={
                        spareParts?.map((sp) => ({
                          value: sp.name,
                          label: sp.item_name || sp.name,
                          description: sp.oem_part_number || sp.part_category || undefined,
                        })) || []
                      }
                      value={newPart.item_code}
                      onValueChange={handleSparePartSelect}
                      onSearchChange={setSparePartSearch}
                      placeholder="Search parts..."
                      isLoading={sparePartsLoading}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:contents">
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs">Quantity</Label>
                      <Input
                        type="number"
                        min={1}
                        placeholder="1"
                        value={newPart.quantity_requested || ""}
                        onChange={(e) =>
                          setNewPart((prev) => ({
                            ...prev,
                            quantity_requested: parseInt(e.target.value, 10) || 1,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1 sm:col-span-3">
                      <Label className="text-xs">Unit Price</Label>
                      <Input
                        type="number"
                        min={0}
                        placeholder="0"
                        value={newPart.unit_price || ""}
                        onChange={(e) =>
                          setNewPart((prev) => ({
                            ...prev,
                            unit_price: parseFloat(e.target.value) || 0,
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Button type="button" onClick={addPartRow} className="w-full">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              )}

              {partRows.length === 0 && !editable && (
                <p className="text-sm text-muted-foreground">No parts added yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Labour</p>
                <p className="text-lg font-semibold">
                  {labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Parts</p>
                <p className="text-lg font-semibold">
                  {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Before VAT</p>
                <p className="text-lg font-semibold">
                  {(labourTotal + partsTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </CardContent>
          </Card>

          {editable && ["Diagnosis Complete", "Estimation In Progress"].includes(status) && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={saveEstimate} disabled={busy}>
                Save estimation
              </Button>
              <Button
                onClick={() =>
                  runAction("Sent to customer", async () => {
                    await saveEstimate();
                    await estimatesSvc.submitForCustomerApproval(id);
                    setActiveTab("approval");
                  })
                }
                disabled={busy}
              >
                Submit for customer approval
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="approval" className="space-y-4">
          {status === "Pending Customer Approval" && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Estimate summary for customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p>
                    Repair estimate (before VAT):{" "}
                    <strong>{(estimate.total_before_vat || 0).toLocaleString()} ETB</strong>
                  </p>
                  <p>
                    VAT: <strong>{(estimate.vat_amount || 0).toLocaleString()} ETB</strong>
                  </p>
                  <p>
                    Grand total: <strong>{(estimate.grand_total || 0).toLocaleString()} ETB</strong>
                  </p>
                  <p className="text-muted-foreground">
                    If accepted, the diagnostic fee of {(estimate.diagnostic_fee || 0).toLocaleString()}{" "}
                    ETB will be voided and not added to the final invoice.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <CheckCircle2 className="h-5 w-5" />
                    Customer accepts estimate
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SignaturePad
                    existingUrl={acceptSignature || undefined}
                    uploading={signatureUploading}
                    onSave={async (file) => {
                      setSignatureUploading(true);
                      try {
                        const url = await uploadFile(file);
                        setAcceptSignature(url);
                      } finally {
                        setSignatureUploading(false);
                      }
                    }}
                    onClear={() => setAcceptSignature("")}
                    className="max-w-full"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="start-repair"
                      checked={startRepair}
                      onCheckedChange={(v) => setStartRepair(Boolean(v))}
                    />
                    <Label htmlFor="start-repair">Start repair immediately on job card</Label>
                  </div>
                  <Button
                    disabled={!acceptSignature || busy}
                    onClick={() =>
                      runAction("Estimate accepted — job card created", async () => {
                        const res = await estimatesSvc.acceptEstimate(id, {
                          customer_signature: acceptSignature,
                          start_repair: startRepair,
                        });
                        navigate("job-card-detail", { id: res.job_card });
                      })
                    }
                  >
                    Accept & create job card
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <XCircle className="h-5 w-5" />
                    Customer declines repair
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    A diagnostic invoice for {(estimate.diagnostic_fee || 0).toLocaleString()} ETB will
                    be created automatically.
                  </p>
                  <SignaturePad
                    existingUrl={rejectSignature || undefined}
                    uploading={signatureUploading}
                    onSave={async (file) => {
                      setSignatureUploading(true);
                      try {
                        const url = await uploadFile(file);
                        setRejectSignature(url);
                      } finally {
                        setSignatureUploading(false);
                      }
                    }}
                    onClear={() => setRejectSignature("")}
                    className="max-w-full"
                  />
                  <Button
                    variant="destructive"
                    disabled={!rejectSignature || busy}
                    onClick={() =>
                      runAction("Estimate rejected — diagnostic invoice created", () =>
                        estimatesSvc.rejectEstimate(id, rejectSignature)
                      )
                    }
                  >
                    Reject & invoice diagnostic fee
                  </Button>
                </CardContent>
              </Card>
            </>
          )}

          {status === "Accepted" && (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <Badge className="bg-green-600">Accepted</Badge>
                <p>Job card: {estimate.job_card || "—"}</p>
                {estimate.job_card && (
                  <Button onClick={() => navigate("job-card-detail", { id: estimate.job_card! })}>
                    Open job card
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {status === "Rejected" && (
            <Card>
              <CardContent className="flex flex-col items-start gap-3 p-6">
                <Badge variant="destructive">Rejected</Badge>
                <p>Diagnostic invoice: {estimate.diagnostic_invoice || "—"}</p>
              </CardContent>
            </Card>
          )}

          {!["Pending Customer Approval", "Accepted", "Rejected"].includes(status) && (
            <Card>
              <CardContent className="p-6 text-sm text-muted-foreground">
                Complete diagnosis and estimation, then submit for customer approval to enable
                signatures here.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
