'use client';

import { useState, useEffect, useMemo } from 'react';
import * as commonSvc from '@/services/common';
import { useNavigation } from '@/contexts/navigation-context';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DecimalInput } from '@/components/ui/decimal-input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  Loader2,
  Phone,
  Mail,
  User,
  Plus,
  X,
  CheckCircle2,
  Save,
} from 'lucide-react';
import { SearchableSelect } from '@/components/searchable-select';
import { LinkWithCreate } from '@/components/link-with-create';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import {
  useCustomers,
  useVINs,
  useVehicleServiceTypes,
  useServiceAdvisors,
  useServiceBays,
  useCreateAppointment,
  useCompanies,
  useAutofillSingleCompany,
  useAutofillDefaultCustomer,
  useDmsCustomerDefaults,
} from '@/hooks/use-dms';
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from '@/lib/customer-default';
import { WarrantyStatusBanner } from '@/components/warranty-status-banner';
import * as vehiclesSvc from '@/services/vehicles';
import type {
  BookingSource,
  Priority,
  VehicleArrivalStatus,
  VehicleWarrantySummary,
  VINNo,
} from '@/types/dms';

const bookingSources: BookingSource[] = [
  'Walk-in',
  'Phone Call',
  'WhatsApp',
  'Website',
  'Social Media',
  'Sales Referral',
  'Fleet Contract',
  'Email',
  'Referral Customer',
  'Other',
];

const priorities: Priority[] = [
  'Normal',
  'VIP',
  'Urgent',
  'Comeback/Repeat Repair',
  'Safety Critical',
  'Immobilized',
  'Fleet Priority',
  'Emergency',
];

const arrivalStatuses: VehicleArrivalStatus[] = [
  'Drop-off',
  'Pick-up Later',
  'Tow-in',
  'Fleet Driver Drop-off',
];

export default function NewAppointmentPage() {
  const { navigate, viewParams } = useNavigation();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [form, setForm] = useState({
    booking_source: 'Phone Call',
    priority: 'Normal',
    appointment_date_time: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    promised_delivery_date_time: '',
    estimated_duration_hours: 2,
    customer: '',
    vehicle: '',
    vin_chassis: '',
    license_plate: '',
    current_odometer: 0,
    customer_complaint_summary: '',
    preferred_advisor: '',
    assigned_bay: '',
    special_instructions: '',
    vehicle_arrival_status: 'Drop-off',
    company: '',
  });

  const [customerSearch, setCustomerSearch] = useState('');
  const [vinSearch, setVinSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [customerContact, setCustomerContact] = useState({
    mobile_no: '',
    email_id: '',
  });
  const [loadingContact, setLoadingContact] = useState(false);
  const [warrantySummary, setWarrantySummary] = useState<VehicleWarrantySummary | null>(null);
  const [selectedVin, setSelectedVin] = useState<VINNo | null>(null);
  const [selectedCustomerMeta, setSelectedCustomerMeta] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);

  const { data: customers } = useCustomers(customerSearch);
  const { data: vins, isLoading: vinsLoading } = useVINs(undefined, vinSearch);
  const { data: serviceTypes } = useVehicleServiceTypes();
  const { data: advisors } = useServiceAdvisors();
  const { data: bays } = useServiceBays();
  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: dmsCustomerDefaults } = useDmsCustomerDefaults();
  const { trigger: createAppointment, isMutating } = useCreateAppointment();

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    form.company,
    (c) => setForm((prev) => ({ ...prev, company: c.name })),
    { search: companySearch }
  );

  useAutofillDefaultCustomer(form.customer, (d) => {
    setForm((prev) => ({ ...prev, customer: d.default_customer! }));
    setSelectedCustomerMeta({
      name: d.default_customer!,
      customer_name: d.customer_name || d.default_customer!,
      mobile_no: d.mobile_no || undefined,
    });
  });

  const handleVinSelect = async (vinName: string) => {
    setWarrantySummary(null);
    if (!vinName) {
      setSelectedVin(null);
      setForm((prev) => ({
        ...prev,
        vin_chassis: '',
        vehicle: '',
        license_plate: '',
        current_odometer: 0,
      }));
      return;
    }

    const fromList = vins?.find((v) => v.name === vinName);
    if (fromList) {
      setSelectedVin(fromList);
    }

    setForm((prev) => ({
      ...prev,
      vin_chassis: vinName,
      vehicle: fromList?.linked_item || '',
      license_plate: fromList?.plate_number || '',
      current_odometer: fromList?.current_odometer ?? 0,
    }));

    if (fromList?.current_customer) {
      setForm((prev) => ({ ...prev, customer: fromList.current_customer! }));
      setSelectedCustomerMeta({
        name: fromList.current_customer!,
        customer_name: fromList.customer_name || fromList.current_customer!,
        mobile_no: undefined,
      });
    }

    try {
      const full = await vehiclesSvc.getVehicle(vinName);
      setSelectedVin({
        name: full.name,
        vin_number: full.vin_number,
        plate_number: full.plate_number,
        model_name: full.model_name,
        linked_item: full.linked_item,
        current_customer: full.current_customer,
        customer_name: full.customer_name,
        current_odometer: full.current_odometer,
      });
      setForm((prev) => ({
        ...prev,
        vehicle: full.linked_item || '',
        license_plate: full.plate_number || '',
        current_odometer: full.current_odometer ?? 0,
      }));
      if (full.current_customer) {
        setForm((prev) => ({ ...prev, customer: full.current_customer! }));
        setSelectedCustomerMeta({
          name: full.current_customer,
          customer_name: full.customer_name || full.current_customer,
        });
      }
      setWarrantySummary(full.warranty_summary || null);
    } catch {
      if (!fromList) {
        toast.error('Could not load vehicle details for the selected VIN');
      }
    }
  };

  const vinFromReturn = viewParams.get('vin');

  useEffect(() => {
    if (!vinFromReturn || vinFromReturn === form.vin_chassis) return;
    void handleVinSelect(vinFromReturn);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply once when returning from vehicle-new
  }, [vinFromReturn]);

  const goToNewVehicle = () => {
    const params: Record<string, string> = { returnTo: 'appointment-new' };
    const draft = vinSearch.trim();
    if (draft) params.vinDraft = draft;
    if (form.company) params.company = form.company;
    navigate('vehicle-new', params);
  };

  const handleCustomerChange = (customerId: string) => {
    const next = resolveCustomerFieldChange(customerId, customers, dmsCustomerDefaults);
    setForm((prev) => ({ ...prev, customer: next.customer }));
    setSelectedCustomerMeta(next.meta);
  };

  const handleCustomerCreated = (name: string, label?: string) => {
    setForm((prev) => ({ ...prev, customer: name }));
    setSelectedCustomerMeta({
      name,
      customer_name: label || name,
    });
  };

  const customerSelectOptions = useMemo(
    () => buildCustomerSelectOptions(customers, form.customer, selectedCustomerMeta),
    [customers, form.customer, selectedCustomerMeta]
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
      form.vin_chassis &&
      selectedVin &&
      !mapped.some((o) => o.value === form.vin_chassis)
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
  }, [vins, form.vin_chassis, selectedVin]);

  useEffect(() => {
    if (!form.customer) {
      setCustomerContact({ mobile_no: '', email_id: '' });
      return;
    }
    let cancelled = false;
    setLoadingContact(true);
    commonSvc
      .fetchCustomerContact(form.customer)
      .then((contact) => {
        if (!cancelled) {
          setCustomerContact({
            mobile_no: contact.mobile_no || '',
            email_id: contact.email_id || '',
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          const fallback = customers?.find((c) => c.name === form.customer);
          setCustomerContact({
            mobile_no: fallback?.mobile_no || '',
            email_id: fallback?.email_id || '',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingContact(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form.customer, customers]);

  const handleAddService = (service: string) => {
    if (!selectedServices.includes(service)) {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleRemoveService = (service: string) => {
    setSelectedServices(selectedServices.filter((s) => s !== service));
  };

  async function saveAppointment(mode: 'draft' | 'create') {
    const asDraft = mode === 'draft';

    if (!form.company) {
      toast.error('Please select a company');
      return;
    }

    if (!asDraft) {
      if (!form.vin_chassis) {
        toast.error('Please select a vehicle');
        return;
      }
      if (!form.customer) {
        toast.error('Please select a customer');
        return;
      }
      if (!form.vehicle) {
        toast.error('Selected vehicle has no linked model. Update the VIN record in Vehicles.');
        return;
      }
      if (selectedServices.length === 0) {
        toast.error('Please add at least one service type');
        return;
      }
      if (!form.customer_complaint_summary.trim()) {
        toast.error('Please enter the customer complaint summary');
        return;
      }
    } else if (!form.customer && !form.vin_chassis) {
      toast.error('Select at least a customer or vehicle before saving a draft');
      return;
    }

    try {
      if (form.customer) {
        await commonSvc.updateCustomerContact(form.customer, {
          mobile_no: customerContact.mobile_no,
          email_id: customerContact.email_id,
        });
      }

      const result = await createAppointment({
        booking_source: form.booking_source,
        priority: form.priority,
        company: form.company,
        appointment_date_time: form.appointment_date_time,
        promised_delivery_date_time: form.promised_delivery_date_time || undefined,
        estimated_duration_hours: form.estimated_duration_hours,
        customer: form.customer || undefined,
        vehicle: form.vehicle || undefined,
        vin_chassis: form.vin_chassis || undefined,
        license_plate: form.license_plate,
        current_odometer: form.current_odometer,
        customer_complaint_summary: form.customer_complaint_summary,
        preferred_advisor: form.preferred_advisor || undefined,
        assigned_bay: form.assigned_bay || undefined,
        vehicle_arrival_status: form.vehicle_arrival_status,
        special_instructions: form.special_instructions,
        mobile_no: customerContact.mobile_no,
        customer_email: customerContact.email_id,
        as_draft: asDraft ? 1 : 0,
        confirm: asDraft ? 0 : 1,
        service_type_requested: selectedServices.map((s) => {
          const st = serviceTypes?.find((t) => t.name === s);
          return {
            service_type: s,
            estimated_hours: st?.default_estimated_hours,
            is_warranty: st?.warranty_applicable ? 1 : 0,
          };
        }),
      } as any);

      if (asDraft) {
        toast.success('Appointment saved as draft', {
          description: result.name,
        });
      } else {
        toast.success('Appointment created successfully', {
          description: 'The appointment has been confirmed.',
        });
      }

      navigate('appointments');
    } catch (err) {
      toast.error(asDraft ? 'Failed to save draft' : 'Failed to create appointment', {
        description: err instanceof Error ? err.message : 'Please try again.',
      });
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await saveAppointment('create');
  }

  async function handleSaveDraft() {
    await saveAppointment('draft');
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('appointments')}>
            <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Appointment</h1>
          <p className="text-sm text-muted-foreground">Schedule a new service appointment</p>
        </div>
      </div>

      <form
        id="new-appointment-form"
        onSubmit={handleSubmit}
        className="dms-form-page min-w-0 space-y-4 sm:space-y-6"
      >
        {/* Appointment Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Appointment Details
            </CardTitle>
            <CardDescription>Basic appointment information</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="company">
                Company <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                value={form.company}
                onValueChange={(val) => setForm((prev) => ({ ...prev, company: val }))}
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

            <div className="space-y-2">
              <Label htmlFor="booking_source">Booking Source</Label>
              <Select
                value={form.booking_source}
                onValueChange={(val) => setForm((prev) => ({ ...prev, booking_source: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {bookingSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(val) => setForm((prev) => ({ ...prev, priority: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment_date">Appointment Date & Time</Label>
              <Input
                id="appointment_date"
                type="datetime-local"
                value={form.appointment_date_time}
                onChange={(e) => setForm((prev) => ({ ...prev, appointment_date_time: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promised_delivery">Promised Delivery Date & Time (optional)</Label>
              <Input
                id="promised_delivery"
                type="datetime-local"
                value={form.promised_delivery_date_time}
                onChange={(e) => setForm((prev) => ({ ...prev, promised_delivery_date_time: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if delivery time is unknown until after diagnosis.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Estimated Duration (Hours)</Label>
              <DecimalInput
                id="estimated_duration"
                min={0}
                value={form.estimated_duration_hours}
                onValueChange={(estimated_duration_hours) =>
                  setForm((prev) => ({ ...prev, estimated_duration_hours }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_arrival">Vehicle Arrival Status</Label>
              <Select
                value={form.vehicle_arrival_status}
                onValueChange={(val) => setForm((prev) => ({ ...prev, vehicle_arrival_status: val }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {arrivalStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle & Customer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Vehicle & Customer
            </CardTitle>
            <CardDescription>
              Select the vehicle first; the registered owner fills in as customer when available
            </CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="vehicle">
                Vehicle (VIN) <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={vinSelectOptions}
                value={form.vin_chassis}
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
              {form.vin_chassis && !form.vehicle && (
                <p className="text-xs text-destructive">
                  This VIN has no linked model item. Set Linked Item on the VIN record.
                </p>
              )}
            </div>

            {selectedVin && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedVin.model_name || selectedVin.name}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Plate: </span>
                    <span className="font-medium">{selectedVin.plate_number || '—'}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">VIN: </span>
                    <span className="font-mono text-xs">{selectedVin.vin_number}</span>
                  </div>
                </div>
                {warrantySummary && <WarrantyStatusBanner summary={warrantySummary} />}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="customer">
                Customer <span className="text-destructive">*</span>
              </Label>
              <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                <SearchableSelect
                  options={customerSelectOptions}
                  value={form.customer}
                  valueLabel={selectedCustomerMeta?.customer_name}
                  onValueChange={handleCustomerChange}
                  onSearchChange={setCustomerSearch}
                  placeholder="Search customer..."
                />
              </LinkWithCreate>
            </div>

            {form.customer && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {selectedCustomerMeta?.customer_name || form.customer}
                  </p>
                  {loadingContact && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Update contact details for this booking. Changes are saved to the customer record.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customer_mobile">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="customer_mobile"
                        className="pl-9"
                        type="tel"
                        placeholder="Mobile number"
                        value={customerContact.mobile_no}
                        onChange={(e) =>
                          setCustomerContact((prev) => ({
                            ...prev,
                            mobile_no: e.target.value,
                          }))
                        }
                        disabled={loadingContact}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer_email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="customer_email"
                        className="pl-9"
                        type="email"
                        placeholder="Email address"
                        value={customerContact.email_id}
                        onChange={(e) =>
                          setCustomerContact((prev) => ({
                            ...prev,
                            email_id: e.target.value,
                          }))
                        }
                        disabled={loadingContact}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Service Details
            </CardTitle>
            <CardDescription>Specify the services requested</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 space-y-4 sm:space-y-6">
            <div className="space-y-2">
              <Label>Service Types</Label>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((service) => (
                  <Badge key={service} variant="secondary" className="gap-1 py-1.5">
                    {serviceTypes?.find((s) => s.name === service)?.service_type_name || service}
                    <button
                      type="button"
                      onClick={() => handleRemoveService(service)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Select onValueChange={handleAddService}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add Service</span>
                  </SelectTrigger>
                  <SelectContent>
                    {(serviceTypes || [])
                      .filter((s) => !selectedServices.includes(s.name))
                      .map((service) => (
                        <SelectItem key={service.name} value={service.name}>
                          {service.service_type_name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complaint">Customer Complaint Summary</Label>
              <Textarea
                id="complaint"
                placeholder="Record customer's exact words about the issue..."
                className="min-h-24"
                value={form.customer_complaint_summary}
                onChange={(e) => setForm((prev) => ({ ...prev, customer_complaint_summary: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">
                This will be imported to the Job Card for technician reference.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_instructions">Special Instructions</Label>
              <Textarea
                id="special_instructions"
                placeholder="e.g., Do not wash, Customer has dog, etc."
                className="min-h-20"
                value={form.special_instructions}
                onChange={(e) => setForm((prev) => ({ ...prev, special_instructions: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Assignment
            </CardTitle>
            <CardDescription>Assign service advisor and bay (optional)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="advisor">Preferred Service Advisor</Label>
              <LinkWithCreate
                doctype="Service Advisor"
                onCreated={(name) => setForm((prev) => ({ ...prev, preferred_advisor: name }))}
              >
                <SearchableSelect
                  options={(advisors || []).map((a) => ({
                    value: a.name,
                    label: a.full_name,
                  }))}
                  value={form.preferred_advisor}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, preferred_advisor: val }))}
                  placeholder="Select advisor..."
                />
              </LinkWithCreate>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bay">Service Bay</Label>
              <SearchableSelect
                options={(bays || []).map((b) => ({
                  value: b.name,
                  label: b.bay_name || b.name,
                  description: b.branch,
                }))}
                value={form.assigned_bay}
                onValueChange={(val) => setForm((prev) => ({ ...prev, assigned_bay: val }))}
                placeholder="Select bay..."
              />
            </div>
          </CardContent>
        </Card>

        <FormActionsBar>
          <Button type="button" variant="outline" onClick={() => navigate('appointments')}>
            Cancel
          </Button>
          <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={isMutating}>
            {isMutating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save as Draft
              </>
            )}
          </Button>
          <Button type="submit" form="new-appointment-form" disabled={isMutating}>
            {isMutating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Create Appointment
              </>
            )}
          </Button>
        </FormActionsBar>
      </form>
    </div>
  );
}
