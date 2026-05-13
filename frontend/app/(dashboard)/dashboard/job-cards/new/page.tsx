"use client";

import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useCreateJobCard, useInspection, useAppointment } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, Car, User, Wrench, Calendar, FileText } from "lucide-react";
import { toast } from "sonner";
import type { JobCard, JobCardServiceLine, JobCardPartLine } from "@/types/dms";

const serviceTypes = [
  "Periodic Service",
  "General Repair",
  "Body Repair",
  "Accident Repair",
  "Warranty Repair",
  "Running Repair",
  "Pre-Delivery Inspection",
  "Insurance Claim",
];

const repairCategories = [
  "Mechanical",
  "Electrical",
  "Body & Paint",
  "AC & Cooling",
  "Suspension",
  "Engine",
  "Transmission",
  "Brakes",
  "Steering",
  "Interior",
  "Exterior",
  "Safety Systems",
];

export default function NewJobCardPage() {
  const { navigate, viewParams } = useNavigation();
  const inspectionId = viewParams.get("inspection");
  const appointmentId = viewParams.get("appointment");
  
  const { data: inspection } = useInspection(inspectionId || "");
  const { data: appointment } = useAppointment(appointmentId || "");
  const { trigger: createJobCard, isMutating } = useCreateJobCard();

  const [formData, setFormData] = useState<Partial<JobCard>>({
    service_type: "",
    vehicle_registration: "",
    vehicle_model: "",
    vin_number: "",
    customer: "",
    customer_name: "",
    contact_number: "",
    email: "",
    odometer_reading: 0,
    fuel_level: "",
    customer_complaints: "",
    internal_notes: "",
    is_warranty: false,
    is_insurance_claim: false,
    expected_completion_date: "",
    assigned_technician: "",
    assigned_service_advisor: "",
    service_lines: [],
    part_lines: [],
  });

  const [serviceLine, setServiceLine] = useState<Partial<JobCardServiceLine>>({
    service_description: "",
    repair_category: "",
    estimated_hours: 0,
    labour_rate: 0,
    estimated_amount: 0,
  });

  const [partLine, setPartLine] = useState<Partial<JobCardPartLine>>({
    part_number: "",
    part_name: "",
    quantity: 1,
    unit_price: 0,
    amount: 0,
  });

  // Prefill from inspection
  useEffect(() => {
    if (inspection) {
      setFormData((prev) => ({
        ...prev,
        vehicle_inspection: inspection.name,
        vehicle_registration: inspection.vehicle_registration,
        vehicle_model: inspection.vehicle_model,
        vin_number: inspection.vin_number || "",
        customer_name: inspection.customer_name,
        odometer_reading: inspection.odometer_reading,
        fuel_level: `${inspection.fuel_level_percentage}%`,
      }));
    }
  }, [inspection]);

  // Prefill from appointment
  useEffect(() => {
    if (appointment) {
      setFormData((prev) => ({
        ...prev,
        service_appointment: appointment.name,
        vehicle_registration: appointment.vehicle_registration,
        vehicle_model: appointment.vehicle_model || "",
        customer: appointment.customer,
        customer_name: appointment.customer_name,
        contact_number: appointment.contact_number,
        email: appointment.email,
        service_type: appointment.service_type,
        customer_complaints: appointment.service_requests?.map(r => r.request_description).join("\n") || "",
      }));
    }
  }, [appointment]);

  const handleInputChange = (field: keyof JobCard, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addServiceLine = () => {
    if (!serviceLine.service_description) {
      toast.error("Please enter a service description");
      return;
    }
    const newLine: JobCardServiceLine = {
      idx: (formData.service_lines?.length || 0) + 1,
      service_description: serviceLine.service_description || "",
      repair_category: serviceLine.repair_category || "",
      estimated_hours: serviceLine.estimated_hours || 0,
      labour_rate: serviceLine.labour_rate || 0,
      estimated_amount: (serviceLine.estimated_hours || 0) * (serviceLine.labour_rate || 0),
    };
    setFormData((prev) => ({
      ...prev,
      service_lines: [...(prev.service_lines || []), newLine],
    }));
    setServiceLine({
      service_description: "",
      repair_category: "",
      estimated_hours: 0,
      labour_rate: 0,
      estimated_amount: 0,
    });
  };

  const removeServiceLine = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      service_lines: prev.service_lines?.filter((_, i) => i !== idx) || [],
    }));
  };

  const addPartLine = () => {
    if (!partLine.part_name) {
      toast.error("Please enter a part name");
      return;
    }
    const newPart: JobCardPartLine = {
      idx: (formData.part_lines?.length || 0) + 1,
      part_number: partLine.part_number || "",
      part_name: partLine.part_name || "",
      quantity: partLine.quantity || 1,
      unit_price: partLine.unit_price || 0,
      amount: (partLine.quantity || 1) * (partLine.unit_price || 0),
    };
    setFormData((prev) => ({
      ...prev,
      part_lines: [...(prev.part_lines || []), newPart],
    }));
    setPartLine({
      part_number: "",
      part_name: "",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    });
  };

  const removePartLine = (idx: number) => {
    setFormData((prev) => ({
      ...prev,
      part_lines: prev.part_lines?.filter((_, i) => i !== idx) || [],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.service_type) {
      toast.error("Please select a service type");
      return;
    }
    if (!formData.vehicle_registration) {
      toast.error("Please enter vehicle registration");
      return;
    }
    if (!formData.customer_name) {
      toast.error("Please enter customer name");
      return;
    }

    try {
      const result = await createJobCard(formData);
      toast.success("Job card created successfully");
      navigate('job-card-detail', { id: result.name });
    } catch {
      toast.error("Failed to create job card");
    }
  };

  // Calculate totals
  const totalLabour = formData.service_lines?.reduce((sum, line) => sum + (line.estimated_amount || 0), 0) || 0;
  const totalParts = formData.part_lines?.reduce((sum, line) => sum + (line.amount || 0), 0) || 0;
  const grandTotal = totalLabour + totalParts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('job-cards')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Job Card</h1>
          <p className="text-muted-foreground mt-1">Create a new workshop job card</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Info */}
        {(inspection || appointment) && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <span className="font-medium">
                  {inspection ? `Linked to Inspection: ${inspection.name}` : `Linked to Appointment: ${appointment?.name}`}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Service Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Service Type *</Label>
                <Select
                  value={formData.service_type}
                  onValueChange={(v) => handleInputChange("service_type", v)}
                >
                  <SelectTrigger id="service_type">
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="expected_completion_date">Expected Completion Date</Label>
                <Input
                  id="expected_completion_date"
                  type="date"
                  value={formData.expected_completion_date}
                  onChange={(e) => handleInputChange("expected_completion_date", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_warranty"
                  checked={formData.is_warranty}
                  onCheckedChange={(v) => handleInputChange("is_warranty", v)}
                />
                <Label htmlFor="is_warranty" className="cursor-pointer">Warranty Repair</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="is_insurance_claim"
                  checked={formData.is_insurance_claim}
                  onCheckedChange={(v) => handleInputChange("is_insurance_claim", v)}
                />
                <Label htmlFor="is_insurance_claim" className="cursor-pointer">Insurance Claim</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_registration">Registration Number *</Label>
                <Input
                  id="vehicle_registration"
                  placeholder="e.g., KAA 123A"
                  value={formData.vehicle_registration}
                  onChange={(e) => handleInputChange("vehicle_registration", e.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_model">Vehicle Model</Label>
                <Input
                  id="vehicle_model"
                  placeholder="e.g., Toyota Corolla 2020"
                  value={formData.vehicle_model}
                  onChange={(e) => handleInputChange("vehicle_model", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin_number">VIN Number</Label>
                <Input
                  id="vin_number"
                  placeholder="Vehicle Identification Number"
                  value={formData.vin_number}
                  onChange={(e) => handleInputChange("vin_number", e.target.value.toUpperCase())}
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="odometer_reading">Odometer Reading (km)</Label>
                <Input
                  id="odometer_reading"
                  type="number"
                  placeholder="0"
                  value={formData.odometer_reading || ""}
                  onChange={(e) => handleInputChange("odometer_reading", parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fuel_level">Fuel Level</Label>
                <Select
                  value={formData.fuel_level}
                  onValueChange={(v) => handleInputChange("fuel_level", v)}
                >
                  <SelectTrigger id="fuel_level">
                    <SelectValue placeholder="Select fuel level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Empty">Empty</SelectItem>
                    <SelectItem value="25%">1/4 Tank</SelectItem>
                    <SelectItem value="50%">1/2 Tank</SelectItem>
                    <SelectItem value="75%">3/4 Tank</SelectItem>
                    <SelectItem value="100%">Full Tank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  placeholder="Full name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange("customer_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number</Label>
                <Input
                  id="contact_number"
                  type="tel"
                  placeholder="+254 700 000 000"
                  value={formData.contact_number}
                  onChange={(e) => handleInputChange("contact_number", e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="customer@example.com"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Customer Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Complaints / Work Description</CardTitle>
            <CardDescription>Describe what the customer reported or what work needs to be done</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter customer complaints or work description..."
              rows={4}
              value={formData.customer_complaints}
              onChange={(e) => handleInputChange("customer_complaints", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Service Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Service Lines (Labour)
            </CardTitle>
            <CardDescription>Add estimated labour items for this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Lines */}
            {formData.service_lines && formData.service_lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Description</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-right p-3">Hours</th>
                      <th className="text-right p-3">Rate</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.service_lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">{line.service_description}</td>
                        <td className="p-3">{line.repair_category || "-"}</td>
                        <td className="p-3 text-right">{line.estimated_hours}</td>
                        <td className="p-3 text-right">{line.labour_rate?.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">{line.estimated_amount?.toLocaleString()}</td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeServiceLine(idx)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Line */}
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Service description"
                  value={serviceLine.service_description}
                  onChange={(e) => setServiceLine((prev) => ({ ...prev, service_description: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Category</Label>
                <Select
                  value={serviceLine.repair_category}
                  onValueChange={(v) => setServiceLine((prev) => ({ ...prev, repair_category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {repairCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="0"
                  value={serviceLine.estimated_hours || ""}
                  onChange={(e) => setServiceLine((prev) => ({ ...prev, estimated_hours: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Rate/Hr</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={serviceLine.labour_rate || ""}
                  onChange={(e) => setServiceLine((prev) => ({ ...prev, labour_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={addServiceLine} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parts Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Parts Required
            </CardTitle>
            <CardDescription>Add parts needed for this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Parts */}
            {formData.part_lines && formData.part_lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Part Number</th>
                      <th className="text-left p-3">Part Name</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Unit Price</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.part_lines.map((part, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3 font-mono text-sm">{part.part_number || "-"}</td>
                        <td className="p-3">{part.part_name}</td>
                        <td className="p-3 text-right">{part.quantity}</td>
                        <td className="p-3 text-right">{part.unit_price?.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">{part.amount?.toLocaleString()}</td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removePartLine(idx)}
                            className="h-8 w-8 text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Add New Part */}
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Part Number</Label>
                <Input
                  placeholder="Part #"
                  value={partLine.part_number}
                  onChange={(e) => setPartLine((prev) => ({ ...prev, part_number: e.target.value }))}
                  className="font-mono"
                />
              </div>
              <div className="col-span-4 space-y-1">
                <Label className="text-xs">Part Name</Label>
                <Input
                  placeholder="Part description"
                  value={partLine.part_name}
                  onChange={(e) => setPartLine((prev) => ({ ...prev, part_name: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  placeholder="1"
                  value={partLine.quantity || ""}
                  onChange={(e) => setPartLine((prev) => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Unit Price</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={partLine.unit_price || ""}
                  onChange={(e) => setPartLine((prev) => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={addPartLine} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Labour Total:</span>
                <span className="font-medium w-32 text-right">{totalLabour.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Parts Total:</span>
                <span className="font-medium w-32 text-right">{totalParts.toLocaleString()}</span>
              </div>
              <Separator className="w-48" />
              <div className="flex items-center gap-8">
                <span className="font-semibold">Estimated Total:</span>
                <span className="font-bold text-lg w-32 text-right text-primary">{grandTotal.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Internal Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Internal Notes</CardTitle>
            <CardDescription>Notes visible only to workshop staff</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter internal notes..."
              rows={3}
              value={formData.internal_notes}
              onChange={(e) => handleInputChange("internal_notes", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('job-cards')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isMutating}>
            {isMutating ? "Creating..." : "Create Job Card"}
          </Button>
        </div>
      </form>
    </div>
  );
}
