'use client';

import { useState } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Separator } from '@/components/ui/separator';
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
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import type { BookingSource, Priority, VehicleArrivalStatus } from '@/types/dms';

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
  'Customer Waiting',
  'Drop-off',
  'Pick-up Later',
  'Tow-in',
  'Fleet Driver Drop-off',
];

const serviceTypes = [
  'Regular Service',
  'Oil Change',
  'Brake Service',
  'Tire Rotation',
  'Tire Replacement',
  'Engine Diagnostic',
  'AC Repair',
  'Electrical Repair',
  'Body Work',
  'Warranty Service',
  'PDI',
  'Campaign/Recall',
  'Other',
];

// Demo customers for autocomplete
const demoCustomers = [
  { name: 'CUST-0001', customer_name: 'Michael Johnson', mobile_no: '+1 555-0123', email_id: 'michael.j@email.com' },
  { name: 'CUST-0002', customer_name: 'Sarah Williams', mobile_no: '+1 555-0124', email_id: 'sarah.w@email.com' },
  { name: 'CUST-0003', customer_name: 'James Brown', mobile_no: '+1 555-0125', email_id: 'james.b@email.com' },
  { name: 'CUST-0004', customer_name: 'Emily Davis', mobile_no: '+1 555-0126', email_id: 'emily.d@email.com' },
];

// Demo vehicles
const demoVehicles = [
  { vin: '1HGBH41JXMN109186', vehicle: 'Toyota Camry 2024', plate: 'ABC 1234', customer: 'CUST-0001' },
  { vin: '2HGFA16578H531458', vehicle: 'Honda Accord 2023', plate: 'XYZ 5678', customer: 'CUST-0002' },
  { vin: '5UXFE43578L015879', vehicle: 'BMW X5 2024', plate: 'BMW 9012', customer: 'CUST-0003' },
  { vin: 'WDDGF4HB1DA765432', vehicle: 'Mercedes C300 2023', plate: 'MBZ 3456', customer: 'CUST-0004' },
];

// Demo service advisors
const demoAdvisors = [
  { name: 'SA-001', full_name: 'John Smith' },
  { name: 'SA-002', full_name: 'Jane Doe' },
  { name: 'SA-003', full_name: 'Mike Wilson' },
];

export default function NewAppointmentPage() {
  const { navigate } = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<typeof demoCustomers[0] | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<typeof demoVehicles[0] | null>(null);

  const handleCustomerSelect = (customerId: string) => {
    const customer = demoCustomers.find((c) => c.name === customerId);
    setSelectedCustomer(customer || null);
    setSelectedVehicle(null);
  };

  const handleVehicleSelect = (vin: string) => {
    const vehicle = demoVehicles.find((v) => v.vin === vin);
    setSelectedVehicle(vehicle || null);
  };

  const handleAddService = (service: string) => {
    if (!selectedServices.includes(service)) {
      setSelectedServices([...selectedServices, service]);
    }
  };

  const handleRemoveService = (service: string) => {
    setSelectedServices(selectedServices.filter((s) => s !== service));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Appointment created successfully', {
        description: 'The customer will receive a confirmation.',
      });

      navigate('appointments');
    } catch {
      toast.error('Failed to create appointment', {
        description: 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const customerVehicles = demoVehicles.filter((v) => v.customer === selectedCustomer?.name);

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

      <form onSubmit={handleSubmit} className="space-y-6">
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
            <div className="space-y-2">
              <Label htmlFor="booking_source">Booking Source</Label>
              <Select defaultValue="Phone Call" required>
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
              <Select defaultValue="Normal" required>
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
                defaultValue={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="promised_delivery">Promised Delivery Date & Time</Label>
              <Input
                id="promised_delivery"
                type="datetime-local"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_duration">Estimated Duration (Hours)</Label>
              <Input
                id="estimated_duration"
                type="number"
                step="0.5"
                min="0.5"
                defaultValue="2"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicle_arrival">Vehicle Arrival Status</Label>
              <Select defaultValue="Customer Waiting" required>
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

        {/* Customer & Vehicle */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Customer & Vehicle
            </CardTitle>
            <CardDescription>Select customer and vehicle information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Select onValueChange={handleCustomerSelect} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {demoCustomers.map((customer) => (
                      <SelectItem key={customer.name} value={customer.name}>
                        {customer.customer_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vehicle">Vehicle (VIN)</Label>
                <Select
                  onValueChange={handleVehicleSelect}
                  disabled={!selectedCustomer}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCustomer ? 'Select vehicle' : 'Select customer first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {customerVehicles.map((vehicle) => (
                      <SelectItem key={vehicle.vin} value={vehicle.vin}>
                        {vehicle.vehicle} - {vehicle.plate}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Customer Info Display */}
            {selectedCustomer && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedCustomer.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.mobile_no}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedCustomer.email_id}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicle Info Display */}
            {selectedVehicle && (
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Car className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{selectedVehicle.vehicle}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Plate: </span>
                    <span className="font-medium">{selectedVehicle.plate}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">VIN: </span>
                    <span className="font-mono text-xs">{selectedVehicle.vin}</span>
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
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Service Types</Label>
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((service) => (
                  <Badge key={service} variant="secondary" className="gap-1 py-1.5">
                    {service}
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
                  <SelectTrigger className="w-48">
                    <Plus className="mr-2 h-4 w-4" />
                    <span>Add Service</span>
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes
                      .filter((s) => !selectedServices.includes(s))
                      .map((service) => (
                        <SelectItem key={service} value={service}>
                          {service}
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
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select advisor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {demoAdvisors.map((advisor) => (
                    <SelectItem key={advisor.name} value={advisor.name}>
                      {advisor.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bay">Service Bay</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Assign bay (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bay-1">Bay 1</SelectItem>
                  <SelectItem value="bay-2">Bay 2</SelectItem>
                  <SelectItem value="bay-3">Bay 3</SelectItem>
                  <SelectItem value="bay-4">Bay 4</SelectItem>
                  <SelectItem value="bay-5">Bay 5</SelectItem>
                  <SelectItem value="bay-6">Bay 6</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('appointments')}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
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
        </div>
      </form>
    </div>
  );
}
