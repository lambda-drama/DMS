"use client";

import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCard, useCreateDelivery } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Truck, Car, User, FileText, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import type { Delivery } from "@/types/dms";

const deliveryChecklist = [
  "Vehicle cleaned inside and out",
  "All personal belongings returned",
  "Service documents provided",
  "Invoice explained to customer",
  "Warranty information explained",
  "Next service date advised",
  "Customer signature obtained",
  "Keys handed over",
];

export default function NewDeliveryPage() {
  const { navigate, viewParams } = useNavigation();
  const jobCardId = viewParams.get("jobcard");
  
  const { data: jobCard } = useJobCard(jobCardId || "");
  const { trigger: createDelivery, isMutating } = useCreateDelivery();

  const [formData, setFormData] = useState<Partial<Delivery>>({
    job_card: "",
    vehicle_registration: "",
    customer_name: "",
    contact_number: "",
    delivery_date: new Date().toISOString().split("T")[0],
    delivery_time: "",
    delivered_by: "",
    received_by: "",
    odometer_at_delivery: 0,
    fuel_level_at_delivery: "",
    delivery_notes: "",
    checklist_completed: false,
  });

  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>(
    Object.fromEntries(deliveryChecklist.map((item) => [item, false]))
  );

  // Prefill from job card
  useEffect(() => {
    if (jobCard) {
      setFormData((prev) => ({
        ...prev,
        job_card: jobCard.name,
        vehicle_registration: jobCard.vehicle_registration,
        vehicle_model: jobCard.vehicle_model,
        customer_name: jobCard.customer_name,
        contact_number: jobCard.contact_number || "",
        odometer_at_delivery: jobCard.odometer_reading || 0,
      }));
    }
  }, [jobCard]);

  const handleInputChange = (field: keyof Delivery, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleChecklistChange = (item: string, checked: boolean) => {
    setChecklistItems((prev) => ({ ...prev, [item]: checked }));
  };

  const allChecklistCompleted = Object.values(checklistItems).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.job_card) {
      toast.error("Please select a job card");
      return;
    }
    if (!allChecklistCompleted) {
      toast.error("Please complete all checklist items");
      return;
    }

    try {
      const result = await createDelivery({
        ...formData,
        checklist_completed: true,
        status: "Delivered",
      });
      toast.success("Delivery recorded successfully");
      navigate('deliveries');
    } catch {
      toast.error("Failed to record delivery");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('deliveries')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Vehicle Delivery</h1>
          <p className="text-muted-foreground mt-1">Record vehicle handover to customer</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Job Card Link */}
        {jobCard && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Job Card: {jobCard.name}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{jobCard.service_type}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle & Customer Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Vehicle Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_registration">Registration Number</Label>
                <Input
                  id="vehicle_registration"
                  value={formData.vehicle_registration}
                  onChange={(e) => handleInputChange("vehicle_registration", e.target.value)}
                  readOnly={!!jobCard}
                  className={jobCard ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="odometer_at_delivery">Odometer at Delivery (km)</Label>
                <Input
                  id="odometer_at_delivery"
                  type="number"
                  value={formData.odometer_at_delivery || ""}
                  onChange={(e) => handleInputChange("odometer_at_delivery", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_level_at_delivery">Fuel Level</Label>
                <Input
                  id="fuel_level_at_delivery"
                  placeholder="e.g., 1/2 tank, Full"
                  value={formData.fuel_level_at_delivery}
                  onChange={(e) => handleInputChange("fuel_level_at_delivery", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange("customer_name", e.target.value)}
                  readOnly={!!jobCard}
                  className={jobCard ? "bg-muted" : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  value={formData.contact_number}
                  onChange={(e) => handleInputChange("contact_number", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="received_by">Received By (Customer/Representative)</Label>
                <Input
                  id="received_by"
                  placeholder="Name of person receiving vehicle"
                  value={formData.received_by}
                  onChange={(e) => handleInputChange("received_by", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Delivery Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delivery_date">Delivery Date</Label>
                <Input
                  id="delivery_date"
                  type="date"
                  value={formData.delivery_date}
                  onChange={(e) => handleInputChange("delivery_date", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivery_time">Delivery Time</Label>
                <Input
                  id="delivery_time"
                  type="time"
                  value={formData.delivery_time}
                  onChange={(e) => handleInputChange("delivery_time", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="delivered_by">Delivered By (Staff)</Label>
                <Input
                  id="delivered_by"
                  placeholder="Staff member name"
                  value={formData.delivered_by}
                  onChange={(e) => handleInputChange("delivered_by", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Checklist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Delivery Checklist
            </CardTitle>
            <CardDescription>
              Complete all items before handing over the vehicle
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {deliveryChecklist.map((item) => (
                <div key={item} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                  <Checkbox
                    id={item}
                    checked={checklistItems[item]}
                    onCheckedChange={(checked) => handleChecklistChange(item, !!checked)}
                  />
                  <Label htmlFor={item} className="cursor-pointer flex-1">
                    {item}
                  </Label>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {Object.values(checklistItems).filter(Boolean).length} of {deliveryChecklist.length} completed
              </span>
              {allChecklistCompleted && (
                <Badge className="bg-[#2E7D32]/10 text-[#2E7D32]">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  All Complete
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery Notes</CardTitle>
            <CardDescription>Any additional notes about the delivery</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter any notes about the delivery..."
              rows={4}
              value={formData.delivery_notes}
              onChange={(e) => handleInputChange("delivery_notes", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('deliveries')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isMutating || !allChecklistCompleted}>
            <Truck className="h-4 w-4 mr-2" />
            {isMutating ? "Recording..." : "Record Delivery"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}
