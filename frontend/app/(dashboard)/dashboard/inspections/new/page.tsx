'use client';

import { useState } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/searchable-select';
import { useCustomers, useVINs, useCreateInspection } from '@/hooks/use-dms';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Car,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  Gauge,
  Key,
  Loader2,
  Save,
  User,
  Wrench,
} from 'lucide-react';
import type { FuelLevel, ArrivalMethod, InspectionItemCondition } from '@/types/dms';

const fuelLevels: FuelLevel[] = ['Empty', '1/8', '1/4', '3/8', '1/2', '5/8', '3/4', '7/8', 'Full'];

const arrivalMethods: ArrivalMethod[] = ['Driven In', 'Towed In', 'Carried', 'PDI/Internal Transfer'];

const warningLights = [
  'Check Engine',
  'ABS',
  'Airbag',
  'Battery',
  'Brake',
  'Engine Temperature',
  'Oil Pressure',
  'Power Steering',
  'TPMS',
  'Traction Control',
  'None',
];

const exteriorAreas = [
  'Front Bumper',
  'Rear Bumper',
  'Hood',
  'Trunk/Tailgate',
  'Left Front Fender',
  'Right Front Fender',
  'Left Rear Fender',
  'Right Rear Fender',
  'Left Front Door',
  'Right Front Door',
  'Left Rear Door',
  'Right Rear Door',
  'Roof',
  'Windshield',
  'Rear Window',
  'Left Mirror',
  'Right Mirror',
  'Headlights',
  'Taillights',
];

const interiorAreas = [
  'Dashboard',
  'Steering Wheel',
  'Seats',
  'Carpet/Floor Mats',
  'Headliner',
  'Door Panels',
  'Center Console',
  'Radio/Infotainment',
  'AC/Heating',
  'Windows',
  'Mirrors',
  'Seat Belts',
];

const tirePositions = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right', 'Spare'];

const conditions: InspectionItemCondition[] = ['Good', 'Fair', 'Poor', 'Damaged', 'Missing', 'N/A'];


const steps = [
  { id: 1, name: 'Vehicle Info', icon: Car },
  { id: 2, name: 'Odometer & Fuel', icon: Gauge },
  { id: 3, name: 'Arrival & Keys', icon: Key },
  { id: 4, name: 'Warning Lights', icon: AlertTriangle },
  { id: 5, name: 'Exterior', icon: Car },
  { id: 6, name: 'Interior', icon: User },
  { id: 7, name: 'Tires', icon: Wrench },
  { id: 8, name: 'Complaints', icon: AlertTriangle },
];

export default function NewInspectionPage() {
  const { navigate, viewParams } = useNavigation();
  const appointmentId = viewParams.get('appointment');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Search states
  const [customerSearch, setCustomerSearch] = useState("");
  const [vinSearch, setVinSearch] = useState("");

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);

  // Real data hooks
  const { data: customers } = useCustomers(customerSearch);
  const { data: vins } = useVINs(selectedCustomer || undefined, vinSearch);
  const { trigger: createInspection } = useCreateInspection();
  const [customerPresent, setCustomerPresent] = useState(true);
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);
  const [exteriorConditions, setExteriorConditions] = useState<Record<string, string>>({});
  const [interiorConditions, setInteriorConditions] = useState<Record<string, string>>({});
  const [tireConditions, setTireConditions] = useState<Record<string, string>>({});
  const [complaints, setComplaints] = useState<string[]>(['']);

  const progress = (currentStep / steps.length) * 100;

  const handleWarningToggle = (warning: string) => {
    if (warning === 'None') {
      setSelectedWarnings(['None']);
    } else {
      const newWarnings = selectedWarnings.filter((w) => w !== 'None');
      if (selectedWarnings.includes(warning)) {
        setSelectedWarnings(newWarnings.filter((w) => w !== warning));
      } else {
        setSelectedWarnings([...newWarnings, warning]);
      }
    }
  };

  const addComplaint = () => {
    setComplaints([...complaints, '']);
  };

  const updateComplaint = (index: number, value: string) => {
    const newComplaints = [...complaints];
    newComplaints[index] = value;
    setComplaints(newComplaints);
  };

  async function handleSaveDraft() {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Draft saved');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    try {
      const formData = {
        customer: selectedCustomer,
        vehicle_vin: selectedVehicle,
        license_plate: licensePlate,
        current_odometer: currentOdometer,
        customer_present: customerPresent,
        warning_lights: selectedWarnings,
        exterior_conditions: exteriorConditions,
        interior_conditions: interiorConditions,
        tire_conditions: tireConditions,
        complaints: complaints.filter(c => c.trim()),
      };
      await createInspection(formData);
      toast.success('Inspection submitted successfully', {
        description: 'You can now create a job card.',
      });
      navigate('inspections');
    } catch {
      toast.error('Failed to submit inspection');
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Vehicle Information
              </CardTitle>
              <CardDescription>Select customer and vehicle details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {appointmentId && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm font-medium text-primary">
                    Linked to Appointment: {appointmentId}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Customer and vehicle information will be pre-filled.
                  </p>
                </div>
              )}

              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <SearchableSelect
                    options={(customers || []).map(c => ({ value: c.name, label: c.customer_name, description: c.mobile_no }))}
                    value={selectedCustomer}
                    onValueChange={(val) => setSelectedCustomer(val)}
                    onSearchChange={setCustomerSearch}
                    placeholder="Search customer..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vehicle (VIN)</Label>
                  <SearchableSelect
                    options={(vins || []).map(v => ({ value: v.name, label: `${v.model_name || v.name} - ${v.plate_number || ''}`, description: v.vin_number }))}
                    value={selectedVehicle}
                    onValueChange={(val) => {
                      setSelectedVehicle(val);
                      const vin = vins?.find(v => v.name === val);
                      if (vin) {
                        setLicensePlate(vin.plate_number || '');
                        setCurrentOdometer(vin.current_odometer || 0);
                      }
                    }}
                    onSearchChange={setVinSearch}
                    placeholder="Search vehicle..."
                    disabled={!selectedCustomer}
                  />
                </div>

                <div className="space-y-2">
                  <Label>License Plate</Label>
                  <Input
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    placeholder="Enter plate number"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="customer_present"
                  checked={customerPresent}
                  onCheckedChange={(checked) => setCustomerPresent(checked as boolean)}
                />
                <Label htmlFor="customer_present" className="cursor-pointer">
                  Customer present during inspection
                </Label>
              </div>

              {!customerPresent && (
                <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Received From (Name)</Label>
                    <Input placeholder="Name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input type="tel" placeholder="Phone" />
                  </div>
                  <div className="space-y-2">
                    <Label>Relationship</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Driver">Driver</SelectItem>
                        <SelectItem value="Family Member">Family Member</SelectItem>
                        <SelectItem value="Fleet Manager">Fleet Manager</SelectItem>
                        <SelectItem value="Towing Company">Towing Company</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gauge className="h-5 w-5 text-primary" />
                Odometer & Fuel
              </CardTitle>
              <CardDescription>Record current readings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Odometer Reading</Label>
                  <div className="flex gap-2">
                    <Input type="number" placeholder="Enter reading" className="flex-1" />
                    <Select defaultValue="km">
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="km">km</SelectItem>
                        <SelectItem value="miles">miles</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Odometer Photo</Label>
                  <Button variant="outline" className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Take Photo
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <Label>Fuel Level</Label>
                <div className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-muted-foreground" />
                  <div className="flex flex-1 gap-1">
                    {fuelLevels.map((level) => (
                      <button
                        key={level}
                        type="button"
                        className="flex-1 rounded border px-2 py-3 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground"
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Battery Voltage (V)</Label>
                <Input type="number" step="0.1" placeholder="e.g., 12.6" className="max-w-32" />
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Arrival & Keys
              </CardTitle>
              <CardDescription>Vehicle arrival information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Arrival Method</Label>
                  <Select defaultValue="Driven In">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {arrivalMethods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Number of Keys Received</Label>
                  <Input type="number" min="1" defaultValue="1" className="max-w-24" />
                </div>

                <div className="space-y-2">
                  <Label>Remote Key Condition</Label>
                  <Select defaultValue="Working">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Working">Working</SelectItem>
                      <SelectItem value="Weak Battery">Weak Battery</SelectItem>
                      <SelectItem value="Damaged">Damaged</SelectItem>
                      <SelectItem value="Not Available">Not Available</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Personal Items in Vehicle</Label>
                <Textarea placeholder="List any valuables or personal items found..." />
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Warning Lights
              </CardTitle>
              <CardDescription>Select all illuminated warning lights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {warningLights.map((light) => (
                  <button
                    key={light}
                    type="button"
                    onClick={() => handleWarningToggle(light)}
                    className={`rounded-lg border p-3 text-sm font-medium transition-colors ${
                      selectedWarnings.includes(light)
                        ? light === 'None'
                          ? 'border-chart-3 bg-chart-3/10 text-chart-3'
                          : 'border-destructive bg-destructive/10 text-destructive'
                        : 'hover:bg-muted'
                    }`}
                  >
                    {light}
                  </button>
                ))}
              </div>

              {selectedWarnings.length > 0 && !selectedWarnings.includes('None') && (
                <div className="space-y-2">
                  <Label>Dashboard Photo</Label>
                  <Button variant="outline" className="w-full">
                    <Camera className="mr-2 h-4 w-4" />
                    Take Dashboard Photo
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Required when warning lights are present
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox id="scan_performed" />
                <Label htmlFor="scan_performed" className="cursor-pointer">
                  Diagnostic scan performed
                </Label>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5 text-primary" />
                Exterior Condition
              </CardTitle>
              <CardDescription>Inspect all exterior areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {exteriorAreas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium">{area}</span>
                    <Select
                      value={exteriorConditions[area] || ''}
                      onValueChange={(value) =>
                        setExteriorConditions({ ...exteriorConditions, [area]: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                <Label>Exterior Photos</Label>
                <Button variant="outline" className="w-full">
                  <Camera className="mr-2 h-4 w-4" />
                  Take Photos (Front, Rear, Left, Right)
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Interior Condition
              </CardTitle>
              <CardDescription>Inspect all interior areas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interiorAreas.map((area) => (
                  <div
                    key={area}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <span className="font-medium">{area}</span>
                    <Select
                      value={interiorConditions[area] || ''}
                      onValueChange={(value) =>
                        setInteriorConditions({ ...interiorConditions, [area]: value })
                      }
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Condition" />
                      </SelectTrigger>
                      <SelectContent>
                        {conditions.map((condition) => (
                          <SelectItem key={condition} value={condition}>
                            {condition}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Tires & Wheels
              </CardTitle>
              <CardDescription>Inspect all tires</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tirePositions.map((position) => (
                  <div key={position} className="rounded-lg border p-4">
                    <h4 className="mb-3 font-medium">{position}</h4>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Condition</Label>
                        <Select
                          value={tireConditions[position] || ''}
                          onValueChange={(value) =>
                            setTireConditions({ ...tireConditions, [position]: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {conditions.map((condition) => (
                              <SelectItem key={condition} value={condition}>
                                {condition}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Tread Depth (mm)</Label>
                        <Input type="number" step="0.5" placeholder="mm" />
                      </div>
                      <div className="space-y-2">
                        <Label>Pressure (PSI)</Label>
                        <Input type="number" placeholder="PSI" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-primary" />
                Customer Complaints
              </CardTitle>
              <CardDescription>Record all customer concerns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {complaints.map((complaint, index) => (
                  <div key={index} className="space-y-2">
                    <Label>Complaint {index + 1}</Label>
                    <Textarea
                      value={complaint}
                      onChange={(e) => updateComplaint(index, e.target.value)}
                      placeholder="Describe the customer's concern..."
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addComplaint}>
                  + Add Another Complaint
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Service Advisor Notes</Label>
                <Textarea placeholder="Additional notes for the technician..." />
              </div>

              <div className="space-y-2">
                <Label>Internal Notes (Not for Customer)</Label>
                <Textarea placeholder="Internal observations..." />
              </div>

              <div className="rounded-lg border bg-muted/30 p-4">
                <h4 className="mb-4 font-medium">Signatures Required</h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button variant="outline" className="h-20">
                    Customer Signature
                  </Button>
                  <Button variant="outline" className="h-20">
                    Service Advisor Signature
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('inspections')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Vehicle Inspection</h1>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].name}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={handleSaveDraft} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save Draft
        </Button>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between">
          {steps.map((step) => {
            const StepIcon = step.icon;
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex flex-col items-center gap-1 ${
                  step.id === currentStep
                    ? 'text-primary'
                    : step.id < currentStep
                    ? 'text-chart-3'
                    : 'text-muted-foreground'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step.id === currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : step.id < currentStep
                      ? 'border-chart-3 bg-chart-3 text-chart-3-foreground'
                      : 'border-muted-foreground/30'
                  }`}
                >
                  {step.id < currentStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <StepIcon className="h-4 w-4" />
                  )}
                </div>
                <span className="hidden text-xs sm:block">{step.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      {renderStep()}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(currentStep - 1)}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        {currentStep < steps.length ? (
          <Button onClick={() => setCurrentStep(currentStep + 1)}>
            Next
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Submit Inspection
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
