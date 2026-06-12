"use client";

import { useState, useEffect, useMemo } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCard, useJobCards, useCreateDelivery } from "@/hooks/use-dms";
import { SearchableSelect } from "@/components/searchable-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SignaturePad } from "@/components/signature-pad";
import { FormActionsBar } from "@/components/layout/form-actions-bar";
import { uploadFile } from "@/services/common";
import * as deliveriesSvc from "@/services/deliveries";
import { ArrowLeft, Truck, Car, User, FileText, CheckCircle2, PenLine, Loader2 } from "lucide-react";
import { toast } from "sonner";

const FUEL_LEVELS = ["Empty", "1/8", "1/4", "3/8", "1/2", "5/8", "3/4", "7/8", "Full"];
const VEHICLE_CONDITIONS = ["Excellent", "Good", "Fair", "Customer Reported New Damage"];
const SATISFACTION_OPTIONS = ["Happy", "Neutral", "Unhappy"];
const PAYMENT_METHODS = [
  "Cash",
  "Card",
  "Bank Transfer",
  "Credit Account",
  "Warranty",
  "Insurance",
  "Fleet Account",
];

function toFrappeDatetime(date: string, time: string) {
  if (!date) return "";
  const t = time || "00:00";
  return `${date} ${t}:00`;
}

function jobCardIdFromParams(params: URLSearchParams) {
  return (
    params.get("jobcard") ||
    params.get("job_card") ||
    params.get("id") ||
    ""
  );
}

export default function NewDeliveryPage() {
  const { navigate, viewParams } = useNavigation();
  const urlJobCardId = jobCardIdFromParams(viewParams);
  const [selectedJobCardId, setSelectedJobCardId] = useState(urlJobCardId);

  useEffect(() => {
    setSelectedJobCardId(urlJobCardId);
  }, [urlJobCardId]);

  const effectiveJobCardId = selectedJobCardId || urlJobCardId;

  const { data: jobCard, isLoading: jobCardLoading } = useJobCard(effectiveJobCardId || null);
  const { data: completedJobCardsResult, isLoading: jobCardsListLoading } = useJobCards({
    status: "Completed",
    limit: 100,
  });
  const { trigger: createDelivery, isMutating } = useCreateDelivery();

  const completedJobCards = completedJobCardsResult?.data ?? [];
  const jobCardOptions = completedJobCards.map((jc) => ({
    value: jc.name,
    label: jc.name,
    description: [jc.license_plate, jc.customer_name || jc.customer].filter(Boolean).join(" · "),
  }));

  const [deliveryDate, setDeliveryDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );
  const [deliveryTime, setDeliveryTime] = useState(
    () => new Date().toTimeString().slice(0, 5)
  );
  const [receivedBy, setReceivedBy] = useState("");
  const [customerMobileOverride, setCustomerMobileOverride] = useState("");
  const [finalOdometerKm, setFinalOdometerKm] = useState("");
  const [finalFuelLevel, setFinalFuelLevel] = useState("1/2");
  const [vehicleCondition, setVehicleCondition] = useState("Good");
  const [newDamageNotes, setNewDamageNotes] = useState("");
  const [invoiceExplained, setInvoiceExplained] = useState(true);
  const [invoiceCopyGiven, setInvoiceCopyGiven] = useState(true);
  const [paymentCleared, setPaymentCleared] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [customerSatisfaction, setCustomerSatisfaction] = useState("Happy");
  const [customerComments, setCustomerComments] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [customerSignatureUrl, setCustomerSignatureUrl] = useState("");
  const [deliveredBySignatureUrl, setDeliveredBySignatureUrl] = useState("");
  const [signatureUploading, setSignatureUploading] = useState<"customer" | "staff" | null>(null);

  const [checklistTemplates, setChecklistTemplates] = useState<
    deliveriesSvc.DeliveryChecklistTemplateOption[]
  >([]);
  const [checklistTemplateId, setChecklistTemplateId] = useState("");
  const [checklistItemLabels, setChecklistItemLabels] = useState<string[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(true);
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setChecklistLoading(true);
    Promise.all([
      deliveriesSvc.fetchDeliveryChecklistTemplates(),
      deliveriesSvc.fetchDeliveryChecklistTemplateItems(),
    ])
      .then(([templates, defaultItems]) => {
        if (cancelled) return;
        setChecklistTemplates(templates);
        const defaultTpl =
          templates.find((t) => Boolean(t.is_default)) || templates[0];
        const templateId = defaultTpl?.name || defaultItems.template || "";
        setChecklistTemplateId(templateId);
        const labels = defaultItems.items || [];
        setChecklistItemLabels(labels);
        setChecklistItems(Object.fromEntries(labels.map((item) => [item, false])));
      })
      .catch(() => {
        if (!cancelled) toast.error("Failed to load delivery checklist template");
      })
      .finally(() => {
        if (!cancelled) setChecklistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadChecklistFromTemplate = async (templateId: string) => {
    setChecklistLoading(true);
    try {
      const result = await deliveriesSvc.fetchDeliveryChecklistTemplateItems(
        templateId || undefined
      );
      const labels = result.items || [];
      setChecklistItemLabels(labels);
      setChecklistItems(Object.fromEntries(labels.map((item) => [item, false])));
      setChecklistTemplateId(result.template || templateId);
    } catch {
      toast.error("Failed to load checklist from template");
    } finally {
      setChecklistLoading(false);
    }
  };

  const customerDisplayName = jobCard?.customer_name || jobCard?.customer || "";
  const customerMobile =
    jobCard?.customer_mobile?.trim() || customerMobileOverride.trim() || "";
  const showMobileField = Boolean(jobCard && !jobCard.customer_mobile?.trim());

  useEffect(() => {
    if (jobCard?.current_odometer) {
      setFinalOdometerKm(String(jobCard.current_odometer));
    }
  }, [jobCard?.name, jobCard?.current_odometer]);

  const allChecklistCompleted = useMemo(
    () =>
      checklistItemLabels.length > 0 &&
      checklistItemLabels.every((item) => checklistItems[item]),
    [checklistItemLabels, checklistItems]
  );

  const canSubmit =
    // Boolean(effectiveJobCardId && jobCard) &&
    allChecklistCompleted &&
    Boolean(customerSignatureUrl) &&
    Boolean(deliveredBySignatureUrl) &&
    Boolean(customerSatisfaction) &&
    Boolean(finalOdometerKm) &&
    invoiceExplained &&
    paymentCleared;

  const handleSignatureSave = async (which: "customer" | "staff", file: File) => {
    setSignatureUploading(which);
    try {
      const url = await uploadFile(file);
      if (which === "customer") setCustomerSignatureUrl(url);
      else setDeliveredBySignatureUrl(url);
      toast.success(which === "customer" ? "Customer signature saved" : "Staff signature saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save signature");
    } finally {
      setSignatureUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobCard) {
      toast.error("Job card is required");
      return;
    }
    if (!allChecklistCompleted) {
      toast.error("Please complete all checklist items");
      return;
    }
    if (!customerSignatureUrl || !deliveredBySignatureUrl) {
      toast.error("Customer and staff signatures are required");
      return;
    }

    try {
      await createDelivery({
        job_card: jobCard.name,
        customer: jobCard.customer,
        vehicle_vin: jobCard.vehicle_vin,
        delivery_date_time: toFrappeDatetime(deliveryDate, deliveryTime),
        delivered_by: undefined,
        received_by: receivedBy.trim() || undefined,
        customer_mobile: showMobileField ? customerMobileOverride.trim() : undefined,
        final_odometer_km: parseInt(finalOdometerKm, 10) || 0,
        final_fuel_level: finalFuelLevel,
        vehicle_condition: vehicleCondition,
        new_damage_notes:
          vehicleCondition === "Customer Reported New Damage" ? newDamageNotes : undefined,
        invoice_explained: invoiceExplained,
        invoice_copy_given: invoiceCopyGiven,
        payment_cleared: paymentCleared,
        payment_method: paymentCleared ? paymentMethod : undefined,
        customer_satisfaction_initial: customerSatisfaction,
        customer_comments: customerComments || undefined,
        customer_signature: customerSignatureUrl,
        delivered_by_signature: deliveredBySignatureUrl,
        delivery_notes: deliveryNotes || undefined,
        delivery_checklist_template: checklistTemplateId || undefined,
        checklist_completed: checklistItems,
        submit: true,
      });
      toast.success("Vehicle delivery recorded");
      navigate("deliveries");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record delivery");
    }
  };

  if (effectiveJobCardId && jobCardLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("deliveries")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Vehicle Delivery</h1>
          <p className="text-muted-foreground mt-1">Record vehicle handover to customer</p>
        </div>
      </div>

      <form
        id="new-delivery-form"
        onSubmit={handleSubmit}
        className="dms-form-page min-w-0 space-y-4 sm:space-y-6"
      >
        <Card className={jobCard ? "border-primary/30 bg-primary/5" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Job card *
            </CardTitle>
            <CardDescription>
              Link this delivery to a completed job card. Opening from a job card pre-fills this field.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 max-w-lg">
              <Label htmlFor="job_card">Job card ID</Label>
              {urlJobCardId && jobCard ? (
                <Input
                  id="job_card"
                  value={jobCard.name}
                  readOnly
                  className="bg-muted font-medium"
                />
              ) : (
                <SearchableSelect
                  value={selectedJobCardId}
                  onValueChange={setSelectedJobCardId}
                  options={jobCardOptions}
                  placeholder="Search completed job cards…"
                  isLoading={jobCardsListLoading}
                />
              )}
            </div>
            {effectiveJobCardId && !jobCard && !jobCardLoading && (
              <p className="text-sm text-destructive">
                Job card &quot;{effectiveJobCardId}&quot; was not found.
              </p>
            )}
            {!effectiveJobCardId && (
              <p className="text-sm text-muted-foreground">
                Select a job card to enable Record delivery.
              </p>
            )}
            {jobCard && (
              <div className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground pt-1">
                <span>
                  {jobCard.license_plate} · {jobCard.vehicle_model}
                </span>
                {jobCard.net_amount != null && (
                  <span>Amount: {Number(jobCard.net_amount).toLocaleString()}</span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>License plate</Label>
                <Input value={jobCard?.license_plate || ""} readOnly className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="final_odometer_km">Final odometer (km) *</Label>
                <Input
                  id="final_odometer_km"
                  type="number"
                  min={0}
                  value={finalOdometerKm}
                  onChange={(e) => setFinalOdometerKm(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Final fuel level *</Label>
                <Select value={finalFuelLevel} onValueChange={setFinalFuelLevel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUEL_LEVELS.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Condition at delivery</Label>
                <Select value={vehicleCondition} onValueChange={setVehicleCondition}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VEHICLE_CONDITIONS.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {vehicleCondition === "Customer Reported New Damage" && (
                <div className="space-y-2">
                  <Label htmlFor="new_damage_notes">New damage notes</Label>
                  <Textarea
                    id="new_damage_notes"
                    rows={2}
                    value={newDamageNotes}
                    onChange={(e) => setNewDamageNotes(e.target.value)}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
              <CardDescription>
                Name and contact come from the customer record linked to the job card.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer name</Label>
                <Input value={customerDisplayName} readOnly className="bg-muted" />
              </div>
              {showMobileField ? (
                <div className="space-y-2">
                  <Label htmlFor="customer_mobile">Contact number</Label>
                  <Input
                    id="customer_mobile"
                    type="tel"
                    placeholder="Customer has no mobile on file — add one"
                    value={customerMobileOverride}
                    onChange={(e) => setCustomerMobileOverride(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Saved to the customer record if missing.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Contact number</Label>
                  <Input value={customerMobile} readOnly className="bg-muted" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="received_by">Received by (customer / representative)</Label>
                <Input
                  id="received_by"
                  placeholder="Name of person receiving the vehicle"
                  value={receivedBy}
                  onChange={(e) => setReceivedBy(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery date *</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_time">Delivery time *</Label>
                <Input
                  id="delivery_time"
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Delivered by is recorded as the logged-in user when the delivery is submitted.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={invoiceExplained} onCheckedChange={(v) => setInvoiceExplained(!!v)} />
                <span className="text-sm">Invoice explained to customer *</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={invoiceCopyGiven} onCheckedChange={(v) => setInvoiceCopyGiven(!!v)} />
                <span className="text-sm">Invoice copy given</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={paymentCleared} onCheckedChange={(v) => setPaymentCleared(!!v)} />
                <span className="text-sm">Payment cleared *</span>
              </label>
            </div>
            {paymentCleared && (
              <div className="space-y-2 max-w-xs">
                <Label>Payment method</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Delivery checklist
            </CardTitle>
            <CardDescription>Complete all items before handing over the vehicle</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 max-w-lg">
              <Label>Checklist template</Label>
              <Select
                value={checklistTemplateId}
                onValueChange={(value) => {
                  setChecklistTemplateId(value);
                  void loadChecklistFromTemplate(value);
                }}
                disabled={checklistLoading || checklistTemplates.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select checklist template" />
                </SelectTrigger>
                <SelectContent>
                  {checklistTemplates.map((tpl) => (
                    <SelectItem key={tpl.name} value={tpl.name}>
                      {tpl.template_name}
                      {tpl.is_default ? " (Default)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {checklistLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading checklist…
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-3">
                  {checklistItemLabels.map((item) => (
                    <label
                      key={item}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={checklistItems[item]}
                        onCheckedChange={(checked) =>
                          setChecklistItems((prev) => ({ ...prev, [item]: !!checked }))
                        }
                      />
                      <span className="text-sm leading-snug">{item}</span>
                    </label>
                  ))}
                </div>
                <Separator className="my-4" />
                <p className="text-sm text-muted-foreground">
                  {Object.values(checklistItems).filter(Boolean).length} of{" "}
                  {checklistItemLabels.length} completed
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenLine className="h-5 w-5" />
              Signatures
            </CardTitle>
            <CardDescription>
              Customer confirms receipt; staff confirms handover (required on desk checkout).
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4 sm:space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Customer signature *</Label>
                <SignaturePad
                  existingUrl={customerSignatureUrl || undefined}
                  uploading={signatureUploading === "customer"}
                  onSave={(file) => handleSignatureSave("customer", file)}
                  onClear={() => setCustomerSignatureUrl("")}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivered by signature (staff) *</Label>
                <SignaturePad
                  existingUrl={deliveredBySignatureUrl || undefined}
                  uploading={signatureUploading === "staff"}
                  onSave={(file) => handleSignatureSave("staff", file)}
                  onClear={() => setDeliveredBySignatureUrl("")}
                />
              </div>
            </div>
            <div className="space-y-2 max-w-md">
              <Label>Customer satisfaction *</Label>
              <Select value={customerSatisfaction} onValueChange={setCustomerSatisfaction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SATISFACTION_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer_comments">Customer comments</Label>
              <Textarea
                id="customer_comments"
                rows={2}
                placeholder="Optional feedback at delivery"
                value={customerComments}
                onChange={(e) => setCustomerComments(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Delivery notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={3}
              placeholder="Special instructions or notes…"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
            />
          </CardContent>
        </Card>

        <FormActionsBar>
          <Button type="button" variant="outline" onClick={() => navigate("deliveries")}>
            Cancel
          </Button>
          <Button type="submit" form="new-delivery-form" disabled={isMutating || !canSubmit}>
            <Truck className="h-4 w-4 mr-2" />
            {isMutating ? "Recording…" : "Record delivery"}
          </Button>
        </FormActionsBar>
      </form>
    </div>
  );
}
