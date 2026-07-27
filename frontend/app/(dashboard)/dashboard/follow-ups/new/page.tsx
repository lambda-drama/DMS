"use client";

import { useMemo, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useCreateFollowUp, useCustomers, useJobCards, useVINs } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchableSelect } from "@/components/searchable-select";
import { ArrowLeft, CalendarPlus, Phone } from "lucide-react";
import { toast } from "sonner";

function defaultDueDate(daysAhead = 2) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function FollowUpNewPage() {
  const { navigate, viewParams } = useNavigation();
  const prefillJobCard = viewParams.get("jobcard") || viewParams.get("job_card") || "";
  const { trigger: createFollowUp, isMutating } = useCreateFollowUp();

  const [mode, setMode] = useState<"standalone" | "job_card">(
    prefillJobCard ? "job_card" : "standalone"
  );
  const [customerSearch, setCustomerSearch] = useState("");
  const [vinSearch, setVinSearch] = useState("");
  const [jobCardSearch, setJobCardSearch] = useState(prefillJobCard);
  const [customer, setCustomer] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [jobCard, setJobCard] = useState(prefillJobCard);
  const [dueDate, setDueDate] = useState(defaultDueDate(2));
  const [contactMethod, setContactMethod] = useState("Phone Call");
  const [notes, setNotes] = useState("");

  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: vins, isLoading: vinsLoading } = useVINs(
    mode === "standalone" ? customer || undefined : undefined,
    vinSearch
  );
  const { data: jobCardsResult, isLoading: jobCardsLoading } = useJobCards({
    search: jobCardSearch || undefined,
    status: undefined,
    limit: 30,
  });
  const jobCards = jobCardsResult?.data || [];

  const customerOptions = useMemo(
    () =>
      (customers || []).map((c) => ({
        value: c.name,
        label: c.customer_name || c.name,
        description: c.name !== c.customer_name ? c.name : undefined,
      })),
    [customers]
  );

  const vinOptions = useMemo(
    () =>
      (vins || []).map((v) => ({
        value: v.name,
        label: v.plate_number || v.vin_number || v.name,
        description: [v.model_name || v.model, v.name].filter(Boolean).join(" · "),
      })),
    [vins]
  );

  const jobCardOptions = useMemo(
    () =>
      (jobCards || []).map((jc) => ({
        value: jc.name,
        label: jc.name,
        description: [jc.customer_name, jc.license_plate || jc.vehicle_vin]
          .filter(Boolean)
          .join(" · "),
      })),
    [jobCards]
  );

  const handleSubmit = async () => {
    if (mode === "standalone" && !customer) {
      toast.error("Select a customer");
      return;
    }
    if (mode === "job_card" && !jobCard) {
      toast.error("Select a job card");
      return;
    }
    if (!dueDate) {
      toast.error("Set a follow-up due date");
      return;
    }

    try {
      const created = await createFollowUp({
        customer: mode === "standalone" ? customer : undefined,
        vehicle_vin: mode === "standalone" ? vehicleVin || undefined : undefined,
        job_card: mode === "job_card" ? jobCard : undefined,
        follow_up_due_date: dueDate,
        contact_method: contactMethod,
        contact_notes: notes.trim() || undefined,
        contact_status: "Pending",
        case_status: "Pending",
        issue_resolved: "N/A",
      });
      toast.success(`Follow-up ${created.name} scheduled`);
      navigate("follow-ups", { id: created.name });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create follow-up");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("follow-ups")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Schedule Follow-up</h1>
          <p className="text-sm text-muted-foreground">
            Create a standalone follow-up or link one to a job card
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4" />
            Follow-up details
          </CardTitle>
          <CardDescription>
            Pick who to contact and when. You can reschedule later from the list.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={mode}
              onValueChange={(v) => setMode(v as "standalone" | "job_card")}
              disabled={isMutating}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standalone">Standalone (customer)</SelectItem>
                <SelectItem value="job_card">Linked to Job Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === "standalone" ? (
            <>
              <div className="space-y-2">
                <Label>Customer *</Label>
                <SearchableSelect
                  options={customerOptions}
                  value={customer}
                  onValueChange={(v) => {
                    setCustomer(v);
                    setVehicleVin("");
                  }}
                  onSearchChange={setCustomerSearch}
                  placeholder="Search customers…"
                  isLoading={customersLoading}
                  disabled={isMutating}
                />
              </div>
              <div className="space-y-2">
                <Label>Vehicle (optional)</Label>
                <SearchableSelect
                  options={vinOptions}
                  value={vehicleVin}
                  onValueChange={setVehicleVin}
                  onSearchChange={setVinSearch}
                  placeholder={customer ? "Search vehicles…" : "Select customer first"}
                  isLoading={vinsLoading}
                  disabled={isMutating || !customer}
                />
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <Label>Job Card *</Label>
              <SearchableSelect
                options={jobCardOptions}
                value={jobCard}
                onValueChange={setJobCard}
                onSearchChange={setJobCardSearch}
                placeholder="Search job cards…"
                isLoading={jobCardsLoading}
                disabled={isMutating}
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="due">Follow-up due date *</Label>
              <Input
                id="due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                disabled={isMutating}
              />
            </div>
            <div className="space-y-2">
              <Label>Contact method</Label>
              <Select
                value={contactMethod}
                onValueChange={setContactMethod}
                disabled={isMutating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "Phone Call",
                    "WhatsApp",
                    "SMS",
                    "Email",
                    "In Person",
                    "Multiple Attempts",
                  ].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              placeholder="Reason for follow-up, what to ask…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isMutating}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => navigate("follow-ups")} disabled={isMutating}>
              Cancel
            </Button>
            <Button onClick={() => void handleSubmit()} disabled={isMutating}>
              <CalendarPlus className="mr-2 h-4 w-4" />
              Schedule Follow-up
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
