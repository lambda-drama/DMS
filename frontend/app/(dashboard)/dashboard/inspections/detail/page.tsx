"use client";

import { useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useInspection, useUpdateInspection } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Car,
  User,
  Calendar,
  Fuel,
  Gauge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Pencil,
  Printer,
  ClipboardCheck,
} from "lucide-react";
import { toast } from "sonner";
import { PrintFormatDropdown } from "@/components/print-format-dropdown";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Draft: { label: "Draft", variant: "secondary" },
  Submitted: { label: "Submitted", variant: "default" },
  Approved: { label: "Approved", variant: "default" },
};

const conditionConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  Good: { icon: CheckCircle2, color: "text-[#2E7D32]", label: "Good" },
  Fair: { icon: AlertCircle, color: "text-[#F9A825]", label: "Fair" },
  Poor: { icon: XCircle, color: "text-[#D32F2F]", label: "Poor" },
  "N/A": { icon: AlertCircle, color: "text-muted-foreground", label: "N/A" },
};

function ConditionBadge({ condition }: { condition: string }) {
  const config = conditionConfig[condition] || conditionConfig["N/A"];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-1.5 ${config.color}`}>
      <Icon className="h-4 w-4" />
      <span className="text-sm font-medium">{config.label}</span>
    </div>
  );
}

function InspectionItem({ label, condition, notes }: { label: string; condition: string; notes?: string }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-border last:border-0">
      <div className="flex-1">
        <p className="font-medium text-foreground">{label}</p>
        {notes && <p className="text-sm text-muted-foreground mt-1">{notes}</p>}
      </div>
      <ConditionBadge condition={condition} />
    </div>
  );
}

export default function InspectionDetailPage() {
  const { viewParams, navigate } = useNavigation();
  const id = viewParams.get("id") || "";
  const { data: inspection, isLoading, error, mutate } = useInspection(id);
  const { trigger: updateInspection, isMutating } = useUpdateInspection(id);
  const [activeTab, setActiveTab] = useState("overview");

  if (!id) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">No inspection ID provided</p>
        <Button variant="outline" onClick={() => navigate('inspections')}>
          Back to Inspections
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    try {
      await updateInspection({ docstatus: 1 });
      toast.success("Inspection submitted successfully");
      mutate();
    } catch {
      toast.error("Failed to submit inspection");
    }
  };

  const handleCreateJobCard = () => {
    navigate('job-card-new', { inspection: id });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <p className="text-lg text-muted-foreground">Failed to load inspection</p>
        <Button variant="outline" onClick={() => navigate('inspections')}>
          Go Back
        </Button>
      </div>
    );
  }

  const fuelLevelPercent = inspection.fuel_level_percentage || 0;

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('inspections')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{inspection.name}</h1>
              <Badge variant={statusConfig[inspection.status]?.variant || "secondary"}>
                {inspection.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">
              {inspection.vehicle_registration} - {inspection.vehicle_model}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {id && (
            <PrintFormatDropdown doctype="Vehicle Inspection" docName={id} />
          )}
          {inspection.status === "Draft" && (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('inspection-detail', { id, mode: 'edit' })}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button size="sm" onClick={handleSubmit} disabled={isMutating}>
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Submit
              </Button>
            </>
          )}
          {inspection.status === "Submitted" && (
            <Button size="sm" onClick={handleCreateJobCard}>
              <FileText className="h-4 w-4 mr-2" />
              Create Job Card
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Gauge className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Odometer</p>
                <p className="text-lg font-semibold">{inspection.odometer_reading?.toLocaleString() || "N/A"} km</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Fuel className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fuel Level</p>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full" 
                      style={{ width: `${fuelLevelPercent}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{fuelLevelPercent}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inspector</p>
                <p className="text-lg font-semibold truncate">{inspection.inspected_by || "N/A"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Inspection Date</p>
                <p className="text-lg font-semibold">
                  {inspection.inspection_date 
                    ? new Date(inspection.inspection_date).toLocaleDateString() 
                    : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/50">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="exterior">Exterior</TabsTrigger>
          <TabsTrigger value="interior">Interior</TabsTrigger>
          <TabsTrigger value="tires">Tires & Wheels</TabsTrigger>
          <TabsTrigger value="warnings">Warning Lights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Registration</p>
                    <p className="font-medium">{inspection.vehicle_registration}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Model</p>
                    <p className="font-medium">{inspection.vehicle_model}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">VIN</p>
                    <p className="font-medium font-mono text-sm">{inspection.vin_number || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{inspection.vehicle_color || "N/A"}</p>
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Customer Name</p>
                    <p className="font-medium">{inspection.customer_name || inspection.customer}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{inspection.contact_number || "N/A"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Customer Remarks</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  {inspection.customer_remarks || "No remarks provided"}
                </p>
              </CardContent>
            </Card>

            {inspection.items_in_vehicle && inspection.items_in_vehicle.length > 0 && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Items in Vehicle</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {inspection.items_in_vehicle.map((item, idx) => (
                      <Badge key={idx} variant="outline">
                        {item.item_name}
                        {item.quantity && item.quantity > 1 && ` (${item.quantity})`}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="exterior" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Exterior Inspection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <InspectionItem label="Body Condition" condition={inspection.body_condition || "N/A"} notes={inspection.body_damage_notes} />
                <InspectionItem label="Paint Condition" condition={inspection.paint_condition || "N/A"} notes={inspection.paint_damage_notes} />
                <InspectionItem label="Windshield" condition={inspection.windshield_condition || "N/A"} notes={inspection.windshield_notes} />
                <InspectionItem label="Headlights" condition={inspection.headlights_condition || "N/A"} />
                <InspectionItem label="Tail Lights" condition={inspection.taillights_condition || "N/A"} />
                <InspectionItem label="Side Mirrors" condition={inspection.side_mirrors_condition || "N/A"} />
                <InspectionItem label="Wipers" condition={inspection.wipers_condition || "N/A"} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interior" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Interior Inspection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <InspectionItem label="Dashboard" condition={inspection.dashboard_condition || "N/A"} />
                <InspectionItem label="Seats" condition={inspection.seats_condition || "N/A"} notes={inspection.seats_notes} />
                <InspectionItem label="Upholstery" condition={inspection.upholstery_condition || "N/A"} />
                <InspectionItem label="Floor Mats" condition={inspection.floor_mats_condition || "N/A"} />
                <InspectionItem label="AC/Ventilation" condition={inspection.ac_ventilation_condition || "N/A"} />
                <InspectionItem label="Audio System" condition={inspection.audio_system_condition || "N/A"} />
                <InspectionItem label="Steering Wheel" condition={inspection.steering_wheel_condition || "N/A"} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tires" className="mt-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Front Tires</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <InspectionItem label="Front Left Tire" condition={inspection.front_left_tire_condition || "N/A"} />
                  <InspectionItem label="Front Right Tire" condition={inspection.front_right_tire_condition || "N/A"} />
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">FL Tread Depth</p>
                    <p className="font-medium">{inspection.front_left_tread_depth || "N/A"} mm</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">FR Tread Depth</p>
                    <p className="font-medium">{inspection.front_right_tread_depth || "N/A"} mm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Rear Tires</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <InspectionItem label="Rear Left Tire" condition={inspection.rear_left_tire_condition || "N/A"} />
                  <InspectionItem label="Rear Right Tire" condition={inspection.rear_right_tire_condition || "N/A"} />
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">RL Tread Depth</p>
                    <p className="font-medium">{inspection.rear_left_tread_depth || "N/A"} mm</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">RR Tread Depth</p>
                    <p className="font-medium">{inspection.rear_right_tread_depth || "N/A"} mm</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="md:col-span-2">
              <CardHeader><CardTitle>Spare Tire & Wheels</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Spare Tire</p>
                    <ConditionBadge condition={inspection.spare_tire_condition || "N/A"} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Wheel Condition</p>
                    <ConditionBadge condition={inspection.wheel_condition || "N/A"} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Hubcaps</p>
                    <ConditionBadge condition={inspection.hubcaps_condition || "N/A"} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="warnings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Warning Lights Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inspection.warning_lights && inspection.warning_lights.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inspection.warning_lights.map((light, idx) => (
                    <div 
                      key={idx} 
                      className={`p-4 rounded-lg border ${
                        light.is_on 
                          ? "border-destructive/50 bg-destructive/5" 
                          : "border-border bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{light.warning_light_name}</span>
                        {light.is_on ? (
                          <Badge variant="destructive">ON</Badge>
                        ) : (
                          <Badge variant="outline">OFF</Badge>
                        )}
                      </div>
                      {light.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{light.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No warning lights recorded</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {(inspection.customer_signature || inspection.inspector_signature) && (
        <Card>
          <CardHeader>
            <CardTitle>Signatures</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {inspection.customer_signature && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Customer Signature</p>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <img src={inspection.customer_signature} alt="Customer Signature" className="max-h-24 mx-auto" />
                  </div>
                </div>
              )}
              {inspection.inspector_signature && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Inspector Signature</p>
                  <div className="border rounded-lg p-4 bg-muted/30">
                    <img src={inspection.inspector_signature} alt="Inspector Signature" className="max-h-24 mx-auto" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
