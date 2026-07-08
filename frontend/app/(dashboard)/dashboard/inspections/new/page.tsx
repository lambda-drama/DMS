'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { toast } from 'sonner';
import { SearchableSelect } from '@/components/searchable-select';
import { LinkWithCreate } from '@/components/link-with-create';
import { ImageCaptureField } from '@/components/image-capture-field';
import { MultiImageCaptureField } from '@/components/multi-image-capture-field';
import { SignaturePad } from '@/components/signature-pad';
import {
  CustomerTermsAcceptance,
  type BilingualCustomerTerms,
} from '@/components/customer-terms-acceptance';
import { uploadFile, fetchCustomerTermsAndConditions } from '@/services/common';
import * as inspectionsSvc from '@/services/inspections';
import { RequiredLabel } from '@/components/required-label';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import {
  COMPLAINT_SEVERITY_OPTIONS,
  DEFAULT_COMPLAINT_SEVERITY,
  DEFAULT_SYMPTOM_CATEGORY,
  SYMPTOM_CATEGORIES,
} from '@/lib/customer-complaint-fields';
import {
  useCustomers,
  useVINs,
  useServiceAdvisors,
  useCreateInspection,
  useCompanies,
  useAppointment,
  useAutofillSingleCompany,
  useAutofillDefaultCustomer,
  useDmsCustomerDefaults,
} from '@/hooks/use-dms';
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from '@/lib/customer-default';
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
import { WarrantyStatusBanner } from '@/components/warranty-status-banner';
import type { FuelLevel, ArrivalMethod, VINNo, VehicleWarrantySummary } from '@/types/dms';
import * as vehiclesSvc from '@/services/vehicles';
import { htmlToPlainText } from '@/lib/plain-text';

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

/** Must match Vehicle Exterior Inspection Item.component options exactly */
const exteriorAreas = [
  'Front Bumper',
  'Rear Bumper',
  'Bonnet/Hood',
  'Roof',
  'Front Windshield',
  'Rear Windshield',
  'Left Front Door',
  'Left Rear Door',
  'Right Front Door',
  'Right Rear Door',
  'Left Front Fender',
  'Right Front Fender',
  'Left Rear Quarter Panel',
  'Right Rear Quarter Panel',
  'Boot/Tailgate',
  'Left Side Mirror',
  'Right Side Mirror',
  'Headlamps (Left)',
  'Headlamps (Right)',
  'Tail Lamps (Left)',
  'Tail Lamps (Right)',
  'Fog Lamps',
  'Grille',
  'Front Number Plate',
  'Rear Number Plate',
  'Wipers (Front)',
  'Wipers (Rear)',
  'Sunroof/Panoramic Roof',
  'Left Door Handles',
  'Right Door Handles',
  'Parking Sensors',
  'Camera Lenses',
  'Charging Port Cover (EV/PHEV)',
  'Fuel Filler Cap',
];

const exteriorConditionsList = [
  'OK',
  'Scratch',
  'Dent',
  'Broken',
  'Missing',
  'Previous Repair/Mismatched Paint',
  'Rust/Corrosion',
  'Crack',
  'Not Checked',
] as const;

/** Must match Vehicle Interior Inspection Item.component options exactly */
const interiorAreas = [
  'Dashboard',
  'Instrument Cluster',
  'Steering Wheel',
  'Steering Wheel Controls',
  'Horn',
  'Interior Lights (Dome)',
  'Interior Lights (Map)',
  'Infotainment Screen',
  'Touchscreen Response',
  'Speakers (All)',
  'AC/Climate Controls',
  'Air Vents (All)',
  'Gear Selector/Shifter',
  'Parking Brake Lever/Button',
  'Floor Mats (Driver)',
  'Floor Mats (Passenger)',
  'Floor Mats (Rear)',
  'Carpet (Front)',
  'Carpet (Rear)',
  'Door Trims (Front Left)',
  'Door Trims (Front Right)',
  'Door Trims (Rear Left)',
  'Door Trims (Rear Right)',
  'Glove Box',
  'Center Console',
  'USB/12V Charging Ports',
  'Wireless Charger',
  'Rear View Mirror',
  'Sun Visors',
  'Vanity Mirrors',
  'Headliner',
  'Rear Camera Display',
  '360 Camera View',
  'Parking Assist Display',
  'Driver Seat',
  'Passenger Seat',
  'Rear Seats (Left)',
  'Rear Seats (Center)',
  'Rear Seats (Right)',
  'Driver Seat Belt',
  'Passenger Seat Belt',
  'Rear Seat Belts',
  'Trunk/Cargo Area',
];

const interiorConditionsList = [
  'OK',
  'Dirty',
  'Stained',
  'Torn/Ripped',
  'Burned',
  'Scratched',
  'Broken',
  'Missing',
  'Not Working',
  'Not Checked',
] as const;

const tirePositions = ['Front Left', 'Front Right', 'Rear Left', 'Rear Right', 'Spare'];

const tireConditionsList = [
  'OK',
  'Uneven Wear',
  'Sidewall Damage',
  'Puncture/Bulge',
  'Aged/Cracked',
  'Wrong Size',
  'Missing Valve Cap',
  'Low Pressure',
] as const;

type ComplaintRow = { text: string; category: string; severity: string };

const EXTERIOR_VIEW_SLOTS = [
  { id: 'front', label: 'Front' },
  { id: 'rear', label: 'Rear' },
  { id: 'left', label: 'Left side' },
  { id: 'right', label: 'Right side' },
];

const TIRE_POSITION_MAP: Record<string, string> = {
  'Front Left': 'Left Front (LF)',
  'Front Right': 'Right Front (RF)',
  'Rear Left': 'Left Rear (LR)',
  'Rear Right': 'Right Rear (RR)',
  Spare: 'Spare',
};

/** Matches doctype mandatory_depends_on for inspection item photos */
function conditionNeedsPhoto(condition: string) {
  return Boolean(condition && condition !== 'OK' && condition !== 'Not Checked');
}

function tireNeedsPhoto(condition: string) {
  return Boolean(condition && condition !== 'OK');
}

function defaultOkConditions(keys: readonly string[]): Record<string, string> {
  return Object.fromEntries(keys.map((key) => [key, 'OK']));
}

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
  const [companySearch, setCompanySearch] = useState("");
  const [company, setCompany] = useState("");

  // Form state
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCustomerMeta, setSelectedCustomerMeta] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedVin, setSelectedVin] = useState<VINNo | null>(null);
  const [warrantySummary, setWarrantySummary] = useState<VehicleWarrantySummary | null>(null);
  const [customerVehicle, setCustomerVehicle] = useState('');
  const [serviceAdvisor, setServiceAdvisor] = useState('');
  const [licensePlate, setLicensePlate] = useState('');
  const [currentOdometer, setCurrentOdometer] = useState<number>(0);
  const [odometerUnit, setOdometerUnit] = useState<'km' | 'miles'>('km');
  const [odometerPhoto, setOdometerPhoto] = useState<string | undefined>();
  const [fuelLevel, setFuelLevel] = useState<FuelLevel>('1/2');
  const [fuelPhoto, setFuelPhoto] = useState<string | undefined>();
  const [dashboardPhoto, setDashboardPhoto] = useState<string | undefined>();
  const [exteriorViewPhotos, setExteriorViewPhotos] = useState<Record<string, string | undefined>>({});
  const [exteriorItemPhotos, setExteriorItemPhotos] = useState<Record<string, string | undefined>>({});
  const [interiorItemPhotos, setInteriorItemPhotos] = useState<Record<string, string | undefined>>({});
  const [tireItemPhotos, setTireItemPhotos] = useState<Record<string, string | undefined>>({});
  const [tireTreadDepth, setTireTreadDepth] = useState<Record<string, number | undefined>>({});
  const [tirePressure, setTirePressure] = useState<Record<string, number | undefined>>({});
  const [customerSignatureUrl, setCustomerSignatureUrl] = useState<string | undefined>();
  const [advisorSignatureUrl, setAdvisorSignatureUrl] = useState<string | undefined>();
  const [signatureUploading, setSignatureUploading] = useState<'customer' | 'advisor' | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [customerTerms, setCustomerTerms] = useState<BilingualCustomerTerms | null>(null);
  const [termsLoading, setTermsLoading] = useState(false);
  const [scanPerformed, setScanPerformed] = useState(false);

  // Real data hooks
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: vins, isLoading: vinsLoading } = useVINs(undefined, vinSearch);
  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: dmsCustomerDefaults } = useDmsCustomerDefaults();
  const { data: linkedAppointment } = useAppointment(appointmentId);
  const { data: advisors } = useServiceAdvisors();
  const { trigger: createInspection } = useCreateInspection();
  const [customerPresent, setCustomerPresent] = useState(true);
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>(['None']);
  const [exteriorConditions, setExteriorConditions] = useState<Record<string, string>>(() =>
    defaultOkConditions(exteriorAreas),
  );
  const [interiorConditions, setInteriorConditions] = useState<Record<string, string>>(() =>
    defaultOkConditions(interiorAreas),
  );
  const [tireConditions, setTireConditions] = useState<Record<string, string>>(() =>
    defaultOkConditions(tirePositions),
  );
  const [complaints, setComplaints] = useState<ComplaintRow[]>([
    { text: '', category: DEFAULT_SYMPTOM_CATEGORY, severity: DEFAULT_COMPLAINT_SEVERITY },
  ]);
  const lastAppliedAppointmentRef = useRef<string | null>(null);

  useEffect(() => {
    if (appointmentId) return;
    inspectionsSvc.getCurrentServiceAdvisor().then((adv) => {
      if (adv?.name) setServiceAdvisor(adv.name);
    }).catch(() => {});
  }, [appointmentId]);

  useEffect(() => {
    if (currentStep !== 8) return;
    let cancelled = false;
    setTermsLoading(true);
    void fetchCustomerTermsAndConditions()
      .then((terms) => {
        if (cancelled) return;
        setCustomerTerms(terms);
      })
      .catch(() => {
        if (cancelled) return;
        setCustomerTerms(null);
      })
      .finally(() => {
        if (!cancelled) setTermsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currentStep]);

  useEffect(() => {
    if (!termsAccepted) {
      setCustomerSignatureUrl(undefined);
    }
  }, [termsAccepted]);

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    company,
    (c) => setCompany(c.name),
    { search: companySearch, enabled: !linkedAppointment?.company }
  );

  useAutofillDefaultCustomer(selectedCustomer, (d) => {
    setSelectedCustomer(d.default_customer!);
    setSelectedCustomerMeta({
      name: d.default_customer!,
      customer_name: d.customer_name || d.default_customer!,
      mobile_no: d.mobile_no || undefined,
    });
  });

  const applyVinToForm = (vin: VINNo) => {
    setSelectedVin(vin);
    setLicensePlate(vin.plate_number || '');
    setCurrentOdometer(vin.current_odometer || 0);
    setCustomerVehicle(vin.linked_item || '');
    if (vin.current_customer) {
      setSelectedCustomer(vin.current_customer);
      setSelectedCustomerMeta({
        name: vin.current_customer,
        customer_name: vin.customer_name || vin.current_customer,
      });
    }
  };

  const handleVinSelect = async (vinName: string) => {
    setSelectedVehicle(vinName);
    setWarrantySummary(null);
    if (!vinName) {
      setSelectedVin(null);
      setCustomerVehicle('');
      return;
    }

    const fromList = vins?.find((v) => v.name === vinName);
    if (fromList) {
      applyVinToForm(fromList);
    }

    try {
      const full = await vehiclesSvc.getVehicle(vinName);
      applyVinToForm({
        name: full.name,
        vin_number: full.vin_number,
        plate_number: full.plate_number,
        model_name: full.model_name,
        linked_item: full.linked_item,
        current_customer: full.current_customer,
        customer_name: full.customer_name,
        current_odometer: full.current_odometer,
        model_year: full.model_year,
      });
      setWarrantySummary(full.warranty_summary || null);
    } catch {
      if (!fromList) {
        toast.error('Could not load vehicle details for the selected VIN');
      }
    }
  };

  useEffect(() => {
    if (!appointmentId || !linkedAppointment) {
      if (!appointmentId) lastAppliedAppointmentRef.current = null;
      return;
    }
    if (lastAppliedAppointmentRef.current === appointmentId) return;
    lastAppliedAppointmentRef.current = appointmentId;

    if (linkedAppointment.company) {
      setCompany(linkedAppointment.company);
    }

    const advisor =
      linkedAppointment.assigned_service_advisor || linkedAppointment.preferred_advisor;
    if (advisor) {
      setServiceAdvisor(advisor);
    } else {
      inspectionsSvc.getCurrentServiceAdvisor().then((adv) => {
        if (adv?.name) setServiceAdvisor(adv.name);
      }).catch(() => {});
    }

    const complaintText = htmlToPlainText(linkedAppointment.customer_complaint_summary || '');
    if (complaintText) {
      setComplaints([
        { text: complaintText, category: DEFAULT_SYMPTOM_CATEGORY, severity: DEFAULT_COMPLAINT_SEVERITY },
      ]);
    }

    const applyFromAppointment = async () => {
      if (linkedAppointment.vin_chassis) {
        await handleVinSelect(linkedAppointment.vin_chassis);
      }
      if (linkedAppointment.vehicle) {
        setCustomerVehicle(linkedAppointment.vehicle);
      }
      if (linkedAppointment.license_plate) {
        setLicensePlate(linkedAppointment.license_plate);
      }
      if (linkedAppointment.current_odometer != null) {
        setCurrentOdometer(linkedAppointment.current_odometer);
      }
      if (linkedAppointment.customer) {
        setSelectedCustomer(linkedAppointment.customer);
        setSelectedCustomerMeta({
          name: linkedAppointment.customer,
          customer_name: linkedAppointment.customer_name || linkedAppointment.customer,
          mobile_no:
            linkedAppointment.contact_phone ||
            linkedAppointment.primary_phone ||
            linkedAppointment.mobile_no,
        });
      }
    };

    void applyFromAppointment();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per linked appointment
  }, [appointmentId, linkedAppointment]);

  const vinFromReturn = viewParams.get('vin');

  useEffect(() => {
    if (!vinFromReturn || vinFromReturn === selectedVehicle) return;
    void handleVinSelect(vinFromReturn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once when returning from vehicle-new
  }, [vinFromReturn]);

  const goToNewVehicle = () => {
    const params: Record<string, string> = { returnTo: 'inspection-new' };
    if (appointmentId) params.appointment = appointmentId;
    navigate('vehicle-new', params);
  };

  const handleCustomerChange = (customerId: string) => {
    const next = resolveCustomerFieldChange(customerId, customers, dmsCustomerDefaults);
    setSelectedCustomer(next.customer);
    setSelectedCustomerMeta(next.meta);
  };

  const handleCustomerCreated = (name: string, label?: string) => {
    setSelectedCustomer(name);
    setSelectedCustomerMeta({
      name,
      customer_name: label || name,
    });
  };

  const customerSelectOptions = useMemo(
    () => buildCustomerSelectOptions(customers, selectedCustomer, selectedCustomerMeta),
    [customers, selectedCustomer, selectedCustomerMeta]
  );

  const vinSelectOptions = useMemo(() => {
    const mapped =
      vins?.map((v) => ({
        value: v.name,
        label: v.vin_number,
        description: [v.model_name, v.plate_number, v.customer_name]
          .filter(Boolean)
          .join(' · '),
      })) || [];

    if (
      selectedVehicle &&
      selectedVin &&
      !mapped.some((o) => o.value === selectedVehicle)
    ) {
      return [
        {
          value: selectedVin.name,
          label: selectedVin.vin_number,
          description: [selectedVin.model_name, selectedVin.plate_number]
            .filter(Boolean)
            .join(' · '),
        },
        ...mapped,
      ];
    }
    return mapped;
  }, [vins, selectedVehicle, selectedVin]);

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
    setComplaints([
      ...complaints,
      { text: '', category: DEFAULT_SYMPTOM_CATEGORY, severity: DEFAULT_COMPLAINT_SEVERITY },
    ]);
  };

  const updateComplaint = (index: number, patch: Partial<ComplaintRow>) => {
    setComplaints((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );
  };

  const handleSignatureSave = async (which: 'customer' | 'advisor', file: File) => {
    if (which === 'customer' && !termsAccepted) {
      toast.error('Customer must accept the terms and conditions first');
      return;
    }
    setSignatureUploading(which);
    try {
      const url = await uploadFile(file);
      if (which === 'customer') setCustomerSignatureUrl(url);
      else setAdvisorSignatureUrl(url);
      toast.success(which === 'customer' ? 'Customer signature saved' : 'Advisor signature saved');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save signature');
    } finally {
      setSignatureUploading(null);
    }
  };

  const firstExteriorViewPhoto = () =>
    exteriorViewPhotos.front ||
    exteriorViewPhotos.rear ||
    exteriorViewPhotos.left ||
    exteriorViewPhotos.right;

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
    if (!selectedCustomer || !selectedVehicle) {
      toast.error('Please select customer and vehicle');
      return;
    }
    if (!customerVehicle) {
      toast.error('Selected VIN has no linked vehicle model. Update the VIN in Vehicles first.');
      return;
    }
    if (!serviceAdvisor) {
      toast.error('Please select a service advisor');
      return;
    }
    if (!company) {
      toast.error('Please select a company');
      return;
    }
    if (selectedWarnings.length === 0) {
      toast.error('Please select warning lights status (tap None if none are on)');
      return;
    }
    const filledComplaints = complaints.filter((c) => c.text.trim());
    if (filledComplaints.length === 0) {
      toast.error('Enter at least one customer complaint (exact words)');
      return;
    }
    if (!currentOdometer) {
      toast.error('Please enter odometer reading');
      return;
    }
    if (!odometerPhoto) {
      toast.error('Please take or upload an odometer photo');
      return;
    }
    const hasWarningLights =
      selectedWarnings.length > 0 && !selectedWarnings.includes('None');
    if (hasWarningLights && !dashboardPhoto) {
      toast.error('Please take a dashboard photo showing warning lights');
      return;
    }
    if (!termsAccepted) {
      toast.error('Customer must accept the terms and conditions before signing');
      return;
    }
    if (!customerSignatureUrl || !advisorSignatureUrl) {
      toast.error('Customer and service advisor signatures are required');
      return;
    }

    const missingDamagePhotos: string[] = [];
    for (const [area, condition] of Object.entries(exteriorConditions)) {
      if (conditionNeedsPhoto(condition) && !exteriorItemPhotos[area]) {
        missingDamagePhotos.push(`Exterior: ${area}`);
      }
    }
    for (const [area, condition] of Object.entries(interiorConditions)) {
      if (conditionNeedsPhoto(condition) && !interiorItemPhotos[area]) {
        missingDamagePhotos.push(`Interior: ${area}`);
      }
    }
    for (const [position, condition] of Object.entries(tireConditions)) {
      if (tireNeedsPhoto(condition) && !tireItemPhotos[position]) {
        missingDamagePhotos.push(`Tire: ${position}`);
      }
    }
    if (missingDamagePhotos.length > 0) {
      toast.error(`Photo required for damage: ${missingDamagePhotos[0]}`);
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = {
        customer: selectedCustomer,
        vin_chassis: selectedVehicle,
        customer_vehicle: customerVehicle,
        service_advisor: serviceAdvisor,
        license_plate: licensePlate,
        odometer: currentOdometer,
        odometer_unit: odometerUnit,
        odometer_photo: odometerPhoto,
        fuel_level: fuelLevel,
        fuel_photo: fuelPhoto,
        dashboard_photo: dashboardPhoto,
        exterior_photos: firstExteriorViewPhoto(),
        exterior_view_photos: exteriorViewPhotos,
        appointment: appointmentId || undefined,
        company,
        customer_present: customerPresent,
        warning_lights: selectedWarnings,
        scan_performed: scanPerformed ? 1 : 0,
        exterior_checklist: exteriorAreas.map((area) => ({
          component: area,
          condition: exteriorConditions[area] || 'OK',
          photo: exteriorItemPhotos[area],
        })),
        interior_checklist: interiorAreas.map((area) => ({
          component: area,
          condition: interiorConditions[area] || 'OK',
          photo: interiorItemPhotos[area],
        })),
        tires_checklist: tirePositions.map((position) => ({
          position: TIRE_POSITION_MAP[position] || position,
          tire_condition: tireConditions[position] || 'OK',
          tread_depth_mm: tireTreadDepth[position],
          tire_pressure_psi: tirePressure[position],
          photo: tireItemPhotos[position],
        })),
        customer_complaints: filledComplaints.map((c) => ({
          customer_exact_words: c.text.trim(),
          symptom_category: c.category,
          severity: c.severity,
        })),
        customer_signature: customerSignatureUrl,
        advisor_signature: advisorSignatureUrl,
        terms_accepted: 1,
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
              <CardDescription>Select the vehicle first; the registered owner fills in as customer when available</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4 sm:space-y-6">
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
                <div className="space-y-2 sm:col-span-2">
                  <RequiredLabel>Company</RequiredLabel>
                  <SearchableSelect
                    value={company}
                    onValueChange={setCompany}
                    onSearchChange={setCompanySearch}
                    placeholder="Search companies (from DMS Settings)..."
                    isLoading={companiesLoading}
                    options={(companies || []).map((c) => ({
                      value: c.name,
                      label: c.company_name || c.name,
                    }))}
                  />
                  {companies && companies.length === 0 && !companiesLoading ? (
                    <p className="text-xs text-muted-foreground">
                      No companies available. Add companies under DMS Settings → Company (table).
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <RequiredLabel>Vehicle (VIN)</RequiredLabel>
                  <SearchableSelect
                    options={vinSelectOptions}
                    value={selectedVehicle}
                    onValueChange={handleVinSelect}
                    onSearchChange={setVinSearch}
                    placeholder="Type at least 3 characters of VIN, chassis, or plate..."
                    isLoading={vinsLoading}
                    onCreateNew={goToNewVehicle}
                    createNewLabel="Register new vehicle"
                  />
                  <p className="text-xs text-muted-foreground">
                    Search and select the vehicle first, or use + to register a new VIN. The registered
                    owner fills in as customer when available; you can change or create a customer without
                    clearing the VIN.
                  </p>
                  {selectedVehicle && !customerVehicle && (
                    <p className="text-xs text-destructive">
                      This VIN has no linked model item. Set Linked Item on the VIN record.
                    </p>
                  )}
                  {warrantySummary && (
                    <WarrantyStatusBanner summary={warrantySummary} className="mt-2" />
                  )}
                </div>

                <div className="space-y-2">
                  <RequiredLabel>Customer</RequiredLabel>
                  <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                    <SearchableSelect
                      options={customerSelectOptions}
                      value={selectedCustomer}
                      valueLabel={selectedCustomerMeta?.customer_name}
                      onValueChange={handleCustomerChange}
                      onSearchChange={setCustomerSearch}
                      placeholder="Search customer..."
                      isLoading={customersLoading}
                    />
                  </LinkWithCreate>
                </div>

                <div className="space-y-2">
                  <RequiredLabel>Service Advisor</RequiredLabel>
                  <LinkWithCreate
                    doctype="Service Advisor"
                    onCreated={(name) => setServiceAdvisor(name)}
                  >
                    <SearchableSelect
                      options={(advisors || []).map((a) => ({
                        value: a.name,
                        label: a.full_name || a.name,
                      }))}
                      value={serviceAdvisor}
                      onValueChange={setServiceAdvisor}
                      placeholder="Select service advisor"
                    />
                  </LinkWithCreate>
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
            <CardContent className="min-w-0 space-y-4 sm:space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <RequiredLabel>Odometer Reading</RequiredLabel>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Enter reading"
                      className="flex-1"
                      value={currentOdometer || ''}
                      onChange={(e) => setCurrentOdometer(parseInt(e.target.value, 10) || 0)}
                      required
                    />
                    <Select
                      value={odometerUnit}
                      onValueChange={(v) => setOdometerUnit(v as 'km' | 'miles')}
                    >
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

                <ImageCaptureField
                  label="Odometer Photo *"
                  value={odometerPhoto}
                  onChange={setOdometerPhoto}
                />
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
                        onClick={() => setFuelLevel(level)}
                        className={`flex-1 rounded border px-2 py-3 text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground ${
                          fuelLevel === level
                            ? 'bg-primary text-primary-foreground border-primary'
                            : ''
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <ImageCaptureField
                label="Fuel Gauge Photo (optional)"
                value={fuelPhoto}
                onChange={setFuelPhoto}
              />

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
            <CardContent className="min-w-0 space-y-4 sm:space-y-6">
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
              <CardDescription>Select all illuminated warning lights (required — tap None if none are on)</CardDescription>
            </CardHeader>
            <CardContent className="min-w-0 space-y-4 sm:space-y-6">
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
                  <ImageCaptureField
                    label="Dashboard Photo"
                    value={dashboardPhoto}
                    onChange={setDashboardPhoto}
                  />
                  <p className="text-xs text-muted-foreground">
                    Required when warning lights are illuminated
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scan_performed"
                  checked={scanPerformed}
                  onCheckedChange={(c) => setScanPerformed(c === true)}
                />
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
                {exteriorAreas.map((area) => {
                  const condition = exteriorConditions[area] || 'OK';
                  const needsPhoto = conditionNeedsPhoto(condition);
                  return (
                    <div key={area} className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{area}</span>
                        <Select
                          value={condition}
                          onValueChange={(value) => {
                            setExteriorConditions({ ...exteriorConditions, [area]: value });
                            if (!conditionNeedsPhoto(value)) {
                              setExteriorItemPhotos((prev) => {
                                const next = { ...prev };
                                delete next[area];
                                return next;
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {exteriorConditionsList.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {needsPhoto && (
                        <ImageCaptureField
                          label={`Damage photo — ${area}`}
                          value={exteriorItemPhotos[area]}
                          onChange={(url) =>
                            setExteriorItemPhotos((prev) => ({ ...prev, [area]: url }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <MultiImageCaptureField
                label="Exterior Photos (Front, Rear, Left, Right)"
                slots={EXTERIOR_VIEW_SLOTS}
                value={exteriorViewPhotos}
                onChange={setExteriorViewPhotos}
              />
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
                {interiorAreas.map((area) => {
                  const condition = interiorConditions[area] || 'OK';
                  const needsPhoto = conditionNeedsPhoto(condition);
                  return (
                    <div key={area} className="space-y-3 rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-medium">{area}</span>
                        <Select
                          value={condition}
                          onValueChange={(value) => {
                            setInteriorConditions({ ...interiorConditions, [area]: value });
                            if (!conditionNeedsPhoto(value)) {
                              setInteriorItemPhotos((prev) => {
                                const next = { ...prev };
                                delete next[area];
                                return next;
                              });
                            }
                          }}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Condition" />
                          </SelectTrigger>
                          <SelectContent>
                            {interiorConditionsList.map((c) => (
                              <SelectItem key={c} value={c}>
                                {c}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {needsPhoto && (
                        <ImageCaptureField
                          label={`Damage photo — ${area}`}
                          value={interiorItemPhotos[area]}
                          onChange={(url) =>
                            setInteriorItemPhotos((prev) => ({ ...prev, [area]: url }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
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
                {tirePositions.map((position) => {
                  const condition = tireConditions[position] || 'OK';
                  const needsPhoto = tireNeedsPhoto(condition);
                  return (
                    <div key={position} className="space-y-4 rounded-lg border p-4">
                      <h4 className="font-medium">{position}</h4>
                      <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Condition</Label>
                          <Select
                            value={condition}
                            onValueChange={(value) => {
                              setTireConditions({ ...tireConditions, [position]: value });
                              if (!tireNeedsPhoto(value)) {
                                setTireItemPhotos((prev) => {
                                  const next = { ...prev };
                                  delete next[position];
                                  return next;
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent>
                              {tireConditionsList.map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Tread Depth (mm)</Label>
                          <Input
                            type="number"
                            step="0.5"
                            placeholder="mm"
                            value={tireTreadDepth[position] ?? ''}
                            onChange={(e) =>
                              setTireTreadDepth({
                                ...tireTreadDepth,
                                [position]: parseFloat(e.target.value) || undefined,
                              })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Pressure (PSI)</Label>
                          <Input
                            type="number"
                            placeholder="PSI"
                            value={tirePressure[position] ?? ''}
                            onChange={(e) =>
                              setTirePressure({
                                ...tirePressure,
                                [position]: parseInt(e.target.value, 10) || undefined,
                              })
                            }
                          />
                        </div>
                      </div>
                      {needsPhoto && (
                        <ImageCaptureField
                          label={`Tire photo — ${position}`}
                          value={tireItemPhotos[position]}
                          onChange={(url) =>
                            setTireItemPhotos((prev) => ({ ...prev, [position]: url }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
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
            <CardContent className="min-w-0 space-y-4 sm:space-y-6">
              <div className="space-y-4">
                {complaints.map((complaint, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <RequiredLabel>Complaint {index + 1} (customer&apos;s exact words)</RequiredLabel>
                    <Textarea
                      value={complaint.text}
                      onChange={(e) => updateComplaint(index, { text: e.target.value })}
                      placeholder="Record exactly what the customer said..."
                      className="min-h-20"
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <RequiredLabel>Symptom category</RequiredLabel>
                        <Select
                          value={complaint.category}
                          onValueChange={(val) => updateComplaint(index, { category: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SYMPTOM_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <RequiredLabel>Severity</RequiredLabel>
                        <Select
                          value={complaint.severity || DEFAULT_COMPLAINT_SEVERITY}
                          onValueChange={(val) => updateComplaint(index, { severity: val })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {COMPLAINT_SEVERITY_OPTIONS.map((level) => (
                              <SelectItem key={level} value={level}>
                                {level}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
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

              <CustomerTermsAcceptance
                terms={customerTerms}
                loading={termsLoading}
                accepted={termsAccepted}
                onAcceptedChange={setTermsAccepted}
                printContext={{
                  documentTitle: "Vehicle Inspection",
                  details: [
                    { label: "Owners Name", value: selectedCustomerMeta?.customer_name || selectedCustomer },
                    { label: "Model", value: selectedVin?.model_name || selectedVin?.model },
                    { label: "Tel No.", value: selectedCustomerMeta?.mobile_no },
                    { label: "Reg. No.", value: "" },
                    { label: "VIN", value: selectedVin?.name || selectedVehicle },
                    { label: "License Plate", value: licensePlate },
                    { label: "Model Year", value: selectedVin?.model_year },
                    { label: "Odometer", value: currentOdometer ? `${currentOdometer} ${odometerUnit}` : "" },
                    { label: "Delivery Date", value: "" },
                    { label: "Job Type", value: "" },
                    { label: "Service Advisor", value: serviceAdvisor },
                  ],
                }}
              />

              <div
                className={`scroll-mt-4 min-w-0 overflow-hidden rounded-lg border bg-muted/30 p-4 space-y-4 max-sm:mb-2 ${!termsAccepted ? 'opacity-60' : ''}`}
              >
                <h4 className="font-medium">Signatures Required</h4>
                {!termsAccepted ? (
                  <p className="text-sm text-muted-foreground">
                    Accept the terms and conditions above before collecting signatures.
                  </p>
                ) : null}
                <div className="grid min-w-0 gap-6 sm:grid-cols-2">
                  <div className={`min-w-0 space-y-2 ${!termsAccepted ? 'pointer-events-none' : ''}`}>
                    <RequiredLabel>Customer Signature</RequiredLabel>
                    <SignaturePad
                      existingUrl={customerSignatureUrl}
                      uploading={signatureUploading === 'customer'}
                      onSave={(file) => handleSignatureSave('customer', file)}
                      onClear={() => setCustomerSignatureUrl(undefined)}
                    />
                  </div>
                  <div className="min-w-0 space-y-2">
                    <RequiredLabel>Service Advisor Signature</RequiredLabel>
                    <SignaturePad
                      existingUrl={advisorSignatureUrl}
                      uploading={signatureUploading === 'advisor'}
                      onSave={(file) => handleSignatureSave('advisor', file)}
                      onClear={() => setAdvisorSignatureUrl(undefined)}
                    />
                  </div>
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
    <>
    <div className="dms-form-page mx-auto max-w-4xl space-y-6">
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
        <div className="flex justify-between gap-1 overflow-x-auto pb-1">
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
    </div>

      <FormActionsBar align="between">
        {currentStep === 1 ? (
          <Button variant="outline" className="min-w-0 w-full sm:w-auto" onClick={() => navigate('inspections')}>
            Cancel
          </Button>
        ) : (
          <Button
            variant="outline"
            className="min-w-0 w-full sm:w-auto"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">Previous</span>
          </Button>
        )}

        {currentStep < steps.length ? (
          <Button className="min-w-0 w-full sm:w-auto" onClick={() => setCurrentStep(currentStep + 1)}>
            <span className="truncate">Next</span>
            <ArrowRight className="ml-2 h-4 w-4 shrink-0" />
          </Button>
        ) : (
          <Button className="min-w-0 w-full sm:w-auto" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 shrink-0 animate-spin" />
                <span className="truncate">Submitting...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4 shrink-0" />
                <span className="truncate">Submit</span>
              </>
            )}
          </Button>
        )}
      </FormActionsBar>
    </>
  );
}
