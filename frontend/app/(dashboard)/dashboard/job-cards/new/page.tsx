"use client";

import { useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import {
  useCreateJobCard,
  useCustomers,
  useVINs,
  useServiceAdvisors,
  useTechnicians,
  useServiceBays,
  useSpareParts,
  useVehicleServiceItems,
  useWarehouses,
  useInspections,
  useCompanies,
} from "@/hooks/use-dms";
import { SearchableSelect } from "@/components/searchable-select";
import { LinkWithCreate } from "@/components/link-with-create";
import { FormActionsBar } from "@/components/layout/form-actions-bar";
import {
  fetchSparePartPrice,
  fetchLabourRate,
  fetchServiceBayDetail,
} from "@/services/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, Trash2, Car, User, Wrench } from "lucide-react";
import { toast } from "sonner";
import type { DMSJobCard, JobCardType, Priority } from "@/types/dms";

const jobCardTypes: JobCardType[] = [
  "Customer Paid",
  "Warranty",
  "Internal",
  "PDI",
  "Campaign/Recall",
  "Insurance",
  "Goodwill",
  "Fleet Contract",
];

const priorities: Priority[] = [
  "Normal",
  "VIP",
  "Comeback/Repeat Repair",
  "Safety Critical",
  "Immobilized",
  "Fleet Priority",
  "Emergency",
  "Urgent",
];

interface JobItemRow {
  complaint_description: string;
  symptom_category: string;
  severity: string;
  labor_operation: string;
}

interface LabourRow {
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  technician: string;
  technician_name: string;
  estimated_hours: number;
  rate_per_hour: number;
  complaint: string;
}

interface PartRow {
  item_code: string;
  item_name: string;
  quantity_requested: number;
  unit_price: number;
}

export default function NewJobCardPage() {
  const { navigate, viewParams } = useNavigation();
  const { trigger: createJobCard, isMutating } = useCreateJobCard();

  // Search states for searchable selects
  const [customerSearch, setCustomerSearch] = useState("");
  const [vinSearch, setVinSearch] = useState("");
  const [serviceItemSearch, setServiceItemSearch] = useState("");
  const [sparePartSearch, setSparePartSearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [company, setCompany] = useState("");
  const [warehouse, setWarehouse] = useState("");

  // Lookup hooks
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: serviceAdvisors, isLoading: advisorsLoading } = useServiceAdvisors();
  const { data: technicians, isLoading: techniciansLoading } = useTechnicians();
  const { data: serviceBays, isLoading: baysLoading } = useServiceBays();
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(serviceItemSearch);
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(sparePartSearch);
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses(
    warehouseSearch,
    company || undefined
  );
  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);

  // Main form state
  const [jobCardType, setJobCardType] = useState<string>("");
  const [priority, setPriority] = useState<string>("Normal");
  const [estimatedDurationHours, setEstimatedDurationHours] = useState<number>(0);
  const [promisedDelivery, setPromisedDelivery] = useState<string>("");

  const [customer, setCustomer] = useState("");
  const [vehicleVin, setVehicleVin] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [warrantyStatus, setWarrantyStatus] = useState("");

  const [serviceAdvisor, setServiceAdvisor] = useState("");
  const [leadTechnician, setLeadTechnician] = useState("");
  const [assignedBay, setAssignedBay] = useState("");
  const [workshop, setWorkshop] = useState("");

  const [warrantyApplicationType, setWarrantyApplicationType] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  const [customerComplaintSummary, setCustomerComplaintSummary] = useState("");
  const [serviceAdvisorNotes, setServiceAdvisorNotes] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const appointment = viewParams.get("appointment") || "";
  const [inspectionId, setInspectionId] = useState(viewParams.get("inspection") || "");

  // Inspections filtered by selected customer
  const { data: inspectionsData } = useInspections({ customer: customer || undefined });

  // VINs filtered by selected customer
  const { data: vins, isLoading: vinsLoading } = useVINs(customer || undefined, vinSearch);

  // Child table: Job Items
  const [jobItems, setJobItems] = useState<JobItemRow[]>([]);
  const [newJobItem, setNewJobItem] = useState<JobItemRow>({
    complaint_description: "",
    symptom_category: "",
    severity: "",
    labor_operation: "",
  });

  // Child table: Labour
  const [labourRows, setLabourRows] = useState<LabourRow[]>([]);
  const [newLabour, setNewLabour] = useState<LabourRow>({
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    technician: "",
    technician_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
    complaint: "",
  });

  // Child table: Parts
  const [partRows, setPartRows] = useState<PartRow[]>([]);
  const [newPart, setNewPart] = useState<PartRow>({
    item_code: "",
    item_name: "",
    quantity_requested: 1,
    unit_price: 0,
  });

  // --- Auto-fill handlers ---

  const handleVinSelect = (vinName: string) => {
    setVehicleVin(vinName);
    const vin = vins?.find((v) => v.name === vinName);
    if (vin) {
      setLicensePlate(vin.plate_number || "");
      setCurrentOdometer(vin.current_odometer || 0);
      setWarrantyStatus(vin.warranty_status || "");
      if (vin.current_customer) {
        setCustomer(vin.current_customer);
      }
    }
  };

  const handleBaySelect = async (bayName: string) => {
    setAssignedBay(bayName);
    if (bayName) {
      try {
        const detail = await fetchServiceBayDetail(bayName);
        if (detail?.branch) {
          setWorkshop(detail.branch);
        }
      } catch { /* ignore */ }
    }
  };

  const handleServiceItemSelect = async (itemName: string) => {
    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    if (!rate && itemName) {
      try {
        rate = await fetchLabourRate(itemName);
      } catch { /* ignore */ }
    }
    const estMinutes = parseFloat(item?.custom_estimated_timemin || "0") || 0;
    const estHours = estMinutes > 0 ? Math.round((estMinutes / 60) * 10) / 10 : 0;
    setNewLabour((prev) => ({
      ...prev,
      vehicle_service_item: itemName,
      vehicle_service_item_name: item?.service_item || item?.custom_item_name || itemName,
      estimated_hours: estHours || prev.estimated_hours,
      rate_per_hour: rate || prev.rate_per_hour,
    }));
  };

  const handleSparePartSelect = async (partName: string) => {
    const part = spareParts?.find((p) => p.name === partName);
    let price = 0;
    if (partName) {
      try {
        price = await fetchSparePartPrice(partName);
      } catch { /* ignore */ }
    }
    setNewPart((prev) => ({
      ...prev,
      item_code: partName,
      item_name: part?.item_name || partName,
      unit_price: price || prev.unit_price,
    }));
  };

  // --- Child table add/remove ---

  const addJobItem = () => {
    if (!newJobItem.complaint_description) {
      toast.error("Please enter a complaint description");
      return;
    }
    setJobItems((prev) => [...prev, { ...newJobItem }]);
    setNewJobItem({ complaint_description: "", symptom_category: "", severity: "", labor_operation: "" });
  };

  const removeJobItem = (idx: number) => {
    setJobItems((prev) => prev.filter((_, i) => i !== idx));
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
      technician: "",
      technician_name: "",
      estimated_hours: 0,
      rate_per_hour: 0,
      complaint: "",
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

  // --- Totals (include current row being edited) ---

  const labourRowsTotal = labourRows.reduce(
    (sum, r) => sum + r.estimated_hours * r.rate_per_hour,
    0
  );
  const currentLabourAmount = newLabour.estimated_hours * newLabour.rate_per_hour;
  const labourTotal = labourRowsTotal + currentLabourAmount;

  const partsRowsTotal = partRows.reduce(
    (sum, r) => sum + r.quantity_requested * r.unit_price,
    0
  );
  const currentPartAmount = newPart.quantity_requested * newPart.unit_price;
  const partsTotal = partsRowsTotal + currentPartAmount;

  const totalAmount = labourTotal + partsTotal;

  const netAmount = (() => {
    if (warrantyApplicationType === "All Invoice") return 0;
    if (warrantyApplicationType === "Spare Part") return labourTotal;
    if (warrantyApplicationType === "Labour") return partsTotal;
    if (warrantyApplicationType === "Discount") return Math.max(totalAmount - discountAmount, 0);
    return totalAmount - discountAmount;
  })();

  // --- Submit ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobCardType) {
      toast.error("Please select a job card type");
      return;
    }
    if (!customer) {
      toast.error("Please select a customer");
      return;
    }
    if (!vehicleVin) {
      toast.error("Please select a vehicle VIN");
      return;
    }
    if (!inspectionId) {
      toast.error("Please select a vehicle inspection");
      return;
    }
    if (jobItems.length === 0) {
      toast.error("Please add at least one job item");
      return;
    }

    const payload: Partial<DMSJobCard> = {
      job_card_type: jobCardType as JobCardType,
      priority: priority as Priority,
      estimated_duration_hours: estimatedDurationHours || undefined,
      promised_delivery_date_time: promisedDelivery || undefined,
      customer,
      vehicle_vin: vehicleVin,
      license_plate: licensePlate || undefined,
      current_odometer: currentOdometer || undefined,
      warranty_status: warrantyStatus || undefined,
      service_advisor: serviceAdvisor || undefined,
      lead_technician: leadTechnician || undefined,
      assigned_bay: assignedBay || undefined,
      workshop: workshop || undefined,
      warehouse: warehouse || undefined,
      company: company || undefined,
      warranty_application_type: (warrantyApplicationType && warrantyApplicationType !== "none") ? warrantyApplicationType : undefined,
      discount_amount: discountAmount || undefined,
      customer_complaint_summary: customerComplaintSummary || undefined,
      service_advisor_notes: serviceAdvisorNotes || undefined,
      internal_notes: internalNotes || undefined,
      appointment: appointment || undefined,
      inspection: inspectionId || undefined,
      job_items: jobItems.map((ji) => ({
        name: "",
        complaint_description: ji.complaint_description,
        symptom_category: ji.symptom_category || undefined,
        severity: ji.severity || undefined,
        labor_operation: ji.labor_operation || undefined,
      })),
      labour: labourRows.map((lr) => ({
        vehicle_service_item: lr.vehicle_service_item,
        technician: lr.technician || undefined,
        estimated_hours: lr.estimated_hours,
        rate_per_hour: lr.rate_per_hour,
        complaint: lr.complaint || undefined,
      })),
      parts: partRows.map((pr) => ({
        item_code: pr.item_code,
        quantity_requested: pr.quantity_requested,
        unit_price: pr.unit_price,
      })),
    } as Partial<DMSJobCard>;

    try {
      const result = await createJobCard(payload);
      toast.success("Job card created successfully");
      navigate("job-card-detail", { id: result.name });
    } catch {
      toast.error("Failed to create job card");
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("job-cards")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Job Card</h1>
          <p className="text-muted-foreground mt-1">
            Create a new workshop job card
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="dms-form-page min-w-0 space-y-4 sm:space-y-6">
        {/* 1. Service Details */}
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
                <Label htmlFor="job_card_type">Job Card Type *</Label>
                <Select value={jobCardType} onValueChange={setJobCardType}>
                  <SelectTrigger id="job_card_type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobCardTypes.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="estimated_duration_hours">
                  Estimated Duration (hours)
                </Label>
                <Input
                  id="estimated_duration_hours"
                  type="number"
                  step="0.5"
                  min={0}
                  placeholder="0"
                  value={estimatedDurationHours || ""}
                  onChange={(e) =>
                    setEstimatedDurationHours(parseFloat(e.target.value) || 0)
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promised_delivery">
                  Promised Delivery Date/Time
                </Label>
                <Input
                  id="promised_delivery"
                  type="datetime-local"
                  value={promisedDelivery}
                  onChange={(e) => setPromisedDelivery(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="warranty_application_type">
                  Warranty Application Type
                </Label>
                <Select value={warrantyApplicationType} onValueChange={setWarrantyApplicationType}>
                  <SelectTrigger id="warranty_application_type">
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="All Invoice">All Invoice</SelectItem>
                    <SelectItem value="Labour">Labour</SelectItem>
                    <SelectItem value="Spare Part">Spare Part</SelectItem>
                    <SelectItem value="Discount">Discount</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {warrantyApplicationType === "Discount" && (
                <div className="space-y-2">
                  <Label htmlFor="discount_amount">Discount Amount</Label>
                  <Input
                    id="discount_amount"
                    type="number"
                    min={1}
                    step="0.01"
                    value={discountAmount || ""}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Customer & Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Customer & Vehicle
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label>Vehicle (VIN) *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("vehicle-new")}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Register new vehicle
                  </Button>
                </div>
                <SearchableSelect
                  options={
                    vins?.map((v) => ({
                      value: v.name,
                      label: v.vin_number,
                      description: [v.model_name, v.plate_number, v.current_customer]
                        .filter(Boolean)
                        .join(" · "),
                    })) || []
                  }
                  value={vehicleVin}
                  onValueChange={handleVinSelect}
                  onSearchChange={setVinSearch}
                  placeholder="Type at least 3 characters of VIN, chassis, or plate..."
                  isLoading={vinsLoading}
                />
                <p className="text-xs text-muted-foreground">
                  Registered VINs appear after 3+ characters. Pick one to load the owner customer
                  (you can change customer if needed). Use Register new vehicle if not in the system.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Customer *</Label>
                <LinkWithCreate doctype="Customer" onCreated={setCustomer}>
                  <SearchableSelect
                    options={
                      customers?.map((c) => ({
                        value: c.name,
                        label: c.customer_name,
                        description: c.mobile_no || undefined,
                      })) || []
                    }
                    value={customer}
                    onValueChange={setCustomer}
                    onSearchChange={setCustomerSearch}
                    placeholder="Search customers..."
                    isLoading={customersLoading}
                  />
                </LinkWithCreate>
              </div>

              <div className="space-y-2">
                <Label htmlFor="license_plate">License plate</Label>
                <Input
                  id="license_plate"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
                  placeholder="Editable — confirm or update for this visit"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_odometer">Current Odometer (km)</Label>
                <Input
                  id="current_odometer"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={currentOdometer || ""}
                  onChange={(e) =>
                    setCurrentOdometer(parseInt(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            {warrantyStatus && (
              <div className="text-sm text-muted-foreground">
                Warranty Status:{" "}
                <span className="font-medium text-foreground">
                  {warrantyStatus}
                </span>
              </div>
            )}

            <Separator />

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Vehicle Inspection *</Label>
                <SearchableSelect
                  options={
                    (inspectionsData?.data || []).map((insp) => ({
                      value: insp.name!,
                      label: insp.name!,
                      description: [insp.vehicle_vin, insp.customer].filter(Boolean).join(" · "),
                    }))
                  }
                  value={inspectionId}
                  onValueChange={setInspectionId}
                  placeholder="Search inspections..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Service Advisor</Label>
                <LinkWithCreate doctype="Service Advisor" onCreated={setServiceAdvisor}>
                  <SearchableSelect
                    options={
                      serviceAdvisors?.map((sa) => ({
                        value: sa.name,
                        label: sa.full_name,
                      })) || []
                    }
                    value={serviceAdvisor}
                    onValueChange={setServiceAdvisor}
                    placeholder="Search advisors..."
                    isLoading={advisorsLoading}
                  />
                </LinkWithCreate>
              </div>

              <div className="space-y-2">
                <Label>Lead Technician</Label>
                <LinkWithCreate doctype="Technician" onCreated={setLeadTechnician}>
                  <SearchableSelect
                    options={
                      technicians?.map((t) => ({
                        value: t.name,
                        label: t.full_name,
                      })) || []
                    }
                    value={leadTechnician}
                    onValueChange={setLeadTechnician}
                    placeholder="Search technicians..."
                    isLoading={techniciansLoading}
                  />
                </LinkWithCreate>
              </div>

              <div className="space-y-2">
                <Label>Assigned Bay</Label>
                <SearchableSelect
                  options={
                    serviceBays?.map((b) => ({
                      value: b.name,
                      label: b.bay_name || b.bay_number || b.name,
                      description: b.branch || undefined,
                    })) || []
                  }
                  value={assignedBay}
                  onValueChange={handleBaySelect}
                  placeholder="Search bays..."
                  isLoading={baysLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Workshop</Label>
                <Input
                  value={workshop}
                  readOnly
                  placeholder="Auto-filled from service bay"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Company *</Label>
                <SearchableSelect
                  value={company}
                  onValueChange={(val) => {
                    setCompany(val);
                    setWarehouse("");
                    setWarehouseSearch("");
                  }}
                  onSearchChange={setCompanySearch}
                  placeholder="Select company..."
                  isLoading={companiesLoading}
                  options={(companies || []).map((c) => ({
                    value: c.name,
                    label: c.company_name || c.name,
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Warehouse</Label>
                <SearchableSelect
                  options={
                    warehouses?.map((w: { name: string; warehouse_name?: string }) => ({
                      value: w.name,
                      label: w.warehouse_name || w.name,
                    })) || []
                  }
                  value={warehouse}
                  onValueChange={setWarehouse}
                  onSearchChange={setWarehouseSearch}
                  placeholder={company ? "Search warehouses..." : "Select company first"}
                  isLoading={warehousesLoading}
                  disabled={!company}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 4. Customer Complaints */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Complaints</CardTitle>
            <CardDescription>
              Summarize the customer&apos;s reported issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter customer complaint summary..."
              rows={4}
              value={customerComplaintSummary}
              onChange={(e) => setCustomerComplaintSummary(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* 5. Job Items (Complaint / Cause / Correction) */}
        <Card>
          <CardHeader>
            <CardTitle>Job Items</CardTitle>
            <CardDescription>
              Complaint, Cause, and Correction lines
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {jobItems.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Complaint Description</th>
                      <th className="text-left p-3">Symptom Category</th>
                      <th className="text-left p-3">Severity</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobItems.map((ji, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">{ji.complaint_description}</td>
                        <td className="p-3">{ji.symptom_category || "—"}</td>
                        <td className="p-3">{ji.severity || "—"}</td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeJobItem(idx)}
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

            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5 space-y-1">
                <Label className="text-xs">Complaint Description *</Label>
                <Input
                  placeholder="Customer complaint / work description"
                  value={newJobItem.complaint_description}
                  onChange={(e) =>
                    setNewJobItem((prev) => ({
                      ...prev,
                      complaint_description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Symptom Category</Label>
                <Input
                  placeholder="e.g. Engine, Brakes"
                  value={newJobItem.symptom_category}
                  onChange={(e) =>
                    setNewJobItem((prev) => ({
                      ...prev,
                      symptom_category: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Severity</Label>
                <Input
                  placeholder="e.g. High, Low"
                  value={newJobItem.severity}
                  onChange={(e) =>
                    setNewJobItem((prev) => ({
                      ...prev,
                      severity: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={addJobItem} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 6. Labour Lines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Labour Lines
            </CardTitle>
            <CardDescription>
              Add labour items for this job card
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {labourRows.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Service Item</th>
                      <th className="text-left p-3">Technician</th>
                      <th className="text-right p-3">Hours</th>
                      <th className="text-right p-3">Rate/Hr</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {labourRows.map((lr, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">
                          {lr.vehicle_service_item_name ||
                            lr.vehicle_service_item}
                        </td>
                        <td className="p-3">
                          {lr.technician_name || lr.technician || "-"}
                        </td>
                        <td className="p-3 text-right">{lr.estimated_hours}</td>
                        <td className="p-3 text-right">
                          {lr.rate_per_hour.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {(
                            lr.estimated_hours * lr.rate_per_hour
                          ).toLocaleString()}
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Service Item *</Label>
                <SearchableSelect
                  options={
                    serviceItems?.map((si) => ({
                      value: si.name,
                      label: si.service_item || si.name,
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
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Technician</Label>
                <LinkWithCreate
                  doctype="Technician"
                  onCreated={(name, label) => {
                    setNewLabour((prev) => ({
                      ...prev,
                      technician: name,
                      technician_name: label || name,
                    }));
                  }}
                >
                  <SearchableSelect
                    options={
                      technicians?.map((t) => ({
                        value: t.name,
                        label: t.full_name,
                      })) || []
                    }
                    value={newLabour.technician}
                    onValueChange={(val) => {
                      const tech = technicians?.find((t) => t.name === val);
                      setNewLabour((prev) => ({
                        ...prev,
                        technician: val,
                        technician_name: tech?.full_name || val,
                      }));
                    }}
                    placeholder="Search technicians..."
                    isLoading={techniciansLoading}
                  />
                </LinkWithCreate>
              </div>
              <div className="col-span-2 space-y-1">
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
              <div className="col-span-2 space-y-1">
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
              <div className="col-span-2">
                <Button
                  type="button"
                  onClick={addLabourRow}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 7. Parts */}
        <Card>
          <CardHeader>
            <CardTitle>Parts Required</CardTitle>
            <CardDescription>Add spare parts needed for this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partRows.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Part</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Unit Price</th>
                      <th className="text-right p-3">Total</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {partRows.map((pr, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">
                          {pr.item_name || pr.item_code}
                        </td>
                        <td className="p-3 text-right">
                          {pr.quantity_requested}
                        </td>
                        <td className="p-3 text-right">
                          {pr.unit_price.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {(
                            pr.quantity_requested * pr.unit_price
                          ).toLocaleString()}
                        </td>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5 space-y-1">
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
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="1"
                  value={newPart.quantity_requested || ""}
                  onChange={(e) =>
                    setNewPart((prev) => ({
                      ...prev,
                      quantity_requested: parseInt(e.target.value) || 1,
                    }))
                  }
                />
              </div>
              <div className="col-span-3 space-y-1">
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
              <div className="col-span-2">
                <Button type="button" onClick={addPartRow} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 8. Totals */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Labour Total:</span>
                <span className="font-medium w-32 text-right">
                  {labourTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Parts Total:</span>
                <span className="font-medium w-32 text-right">
                  {partsTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <Separator className="w-64" />
              <div className="flex items-center gap-8">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-medium w-32 text-right">
                  {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              {warrantyApplicationType && warrantyApplicationType !== "none" && (
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground text-sm">
                    Warranty ({warrantyApplicationType}):
                  </span>
                  <span className="font-medium w-32 text-right text-orange-600">
                    -{(totalAmount - netAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              {discountAmount > 0 && warrantyApplicationType !== "All Invoice" && warrantyApplicationType !== "Spare Part" && warrantyApplicationType !== "Labour" && (
                <div className="flex items-center gap-8">
                  <span className="text-muted-foreground text-sm">Discount:</span>
                  <span className="font-medium w-32 text-right text-orange-600">
                    -{discountAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <Separator className="w-64" />
              <div className="flex items-center gap-8">
                <span className="font-semibold">Net Amount:</span>
                <span className="font-bold text-lg w-32 text-right text-primary">
                  {netAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 9. Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service_advisor_notes">
                Service Advisor Notes
              </Label>
              <Textarea
                id="service_advisor_notes"
                placeholder="Notes from the service advisor..."
                rows={3}
                value={serviceAdvisorNotes}
                onChange={(e) => setServiceAdvisorNotes(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="internal_notes">Internal Notes</Label>
              <Textarea
                id="internal_notes"
                placeholder="Internal workshop notes..."
                rows={3}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <FormActionsBar>
          <Button type="button" variant="outline" onClick={() => navigate("job-cards")}>
            Cancel
          </Button>
          <Button type="submit" disabled={isMutating}>
            {isMutating ? "Creating..." : "Create Job Card"}
          </Button>
        </FormActionsBar>
      </form>
    </div>
  );
}
