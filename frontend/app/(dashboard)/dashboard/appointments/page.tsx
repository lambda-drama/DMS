'use client';

import { useState } from 'react';
import { useNavigation } from '@/contexts/navigation-context';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Calendar,
  Clock,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  Car,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import type { AppointmentStatus, Priority } from '@/types/dms';

// Demo data
const demoAppointments = [
  {
    name: 'APP-2026-00012',
    appointment_date_time: '2026-05-13T09:00:00',
    promised_delivery_date_time: '2026-05-13T17:00:00',
    customer_name: 'Michael Johnson',
    primary_phone: '+1 555-0123',
    customer_email: 'michael.j@email.com',
    vehicle: 'Toyota Camry',
    license_plate: 'ABC 1234',
    vin_chassis: '1HGBH41JXMN109186',
    service_type_requested: [{ service_type: 'Regular Service' }],
    customer_complaint_summary: 'Oil change and tire rotation needed',
    appointment_status: 'Booked' as AppointmentStatus,
    priority: 'Normal' as Priority,
    booking_source: 'Phone Call',
    assigned_service_advisor: 'John Smith',
  },
  {
    name: 'APP-2026-00011',
    appointment_date_time: '2026-05-13T10:30:00',
    promised_delivery_date_time: '2026-05-13T16:00:00',
    customer_name: 'Sarah Williams',
    primary_phone: '+1 555-0124',
    customer_email: 'sarah.w@email.com',
    vehicle: 'Honda Accord',
    license_plate: 'XYZ 5678',
    vin_chassis: '2HGFA16578H531458',
    service_type_requested: [{ service_type: 'Brake Service' }],
    customer_complaint_summary: 'Squeaking noise when braking',
    appointment_status: 'Arrived' as AppointmentStatus,
    priority: 'VIP' as Priority,
    booking_source: 'WhatsApp',
    assigned_service_advisor: 'Jane Doe',
  },
  {
    name: 'APP-2026-00010',
    appointment_date_time: '2026-05-13T11:00:00',
    promised_delivery_date_time: '2026-05-14T12:00:00',
    customer_name: 'James Brown',
    primary_phone: '+1 555-0125',
    customer_email: 'james.b@email.com',
    vehicle: 'BMW X5',
    license_plate: 'BMW 9012',
    vin_chassis: '5UXFE43578L015879',
    service_type_requested: [{ service_type: 'Engine Diagnostic' }, { service_type: 'AC Repair' }],
    customer_complaint_summary: 'Check engine light on, AC not cooling properly',
    appointment_status: 'In Inspection' as AppointmentStatus,
    priority: 'Urgent' as Priority,
    booking_source: 'Website',
    assigned_service_advisor: 'John Smith',
  },
  {
    name: 'APP-2026-00009',
    appointment_date_time: '2026-05-13T14:00:00',
    promised_delivery_date_time: '2026-05-13T18:00:00',
    customer_name: 'Emily Davis',
    primary_phone: '+1 555-0126',
    customer_email: 'emily.d@email.com',
    vehicle: 'Mercedes C300',
    license_plate: 'MBZ 3456',
    vin_chassis: 'WDDGF4HB1DA765432',
    service_type_requested: [{ service_type: 'Warranty Service' }],
    customer_complaint_summary: 'Electrical issue - warranty claim',
    appointment_status: 'Completed' as AppointmentStatus,
    priority: 'Normal' as Priority,
    booking_source: 'Sales Referral',
    assigned_service_advisor: 'Jane Doe',
  },
  {
    name: 'APP-2026-00008',
    appointment_date_time: '2026-05-12T09:00:00',
    promised_delivery_date_time: '2026-05-12T15:00:00',
    customer_name: 'Robert Wilson',
    primary_phone: '+1 555-0127',
    customer_email: 'robert.w@email.com',
    vehicle: 'Audi A4',
    license_plate: 'AUD 7890',
    vin_chassis: 'WAUZZZ8E18A098765',
    service_type_requested: [{ service_type: 'Tire Replacement' }],
    customer_complaint_summary: 'Replace all 4 tires',
    appointment_status: 'No-Show' as AppointmentStatus,
    priority: 'Normal' as Priority,
    booking_source: 'Phone Call',
    assigned_service_advisor: 'John Smith',
  },
];

function getStatusConfig(status: AppointmentStatus) {
  const configs: Record<AppointmentStatus, { color: string; icon: typeof CheckCircle2 }> = {
    'Booked': { color: 'bg-chart-1/10 text-chart-1 border-chart-1/20', icon: Calendar },
    'Reminder Sent': { color: 'bg-chart-4/10 text-chart-4 border-chart-4/20', icon: Clock },
    'Arrived': { color: 'bg-chart-3/10 text-chart-3 border-chart-3/20', icon: CheckCircle2 },
    'In Inspection': { color: 'bg-primary/10 text-primary border-primary/20', icon: Car },
    'In Workshop': { color: 'bg-primary/10 text-primary border-primary/20', icon: Car },
    'Ready for Pickup': { color: 'bg-chart-3/10 text-chart-3 border-chart-3/20', icon: CheckCircle2 },
    'Completed': { color: 'bg-chart-3/10 text-chart-3 border-chart-3/20', icon: CheckCircle2 },
    'No-Show': { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
    'Cancelled': { color: 'bg-destructive/10 text-destructive border-destructive/20', icon: XCircle },
    'Rescheduled': { color: 'bg-chart-4/10 text-chart-4 border-chart-4/20', icon: Clock },
  };
  return configs[status] || configs['Booked'];
}

function getPriorityConfig(priority: Priority) {
  const configs: Record<string, { color: string; label: string }> = {
    'Normal': { color: 'bg-muted text-muted-foreground', label: 'Normal' },
    'VIP': { color: 'bg-chart-4/10 text-chart-4 border-chart-4/20', label: 'VIP' },
    'Urgent': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Urgent' },
    'Comeback/Repeat Repair': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Comeback' },
    'Safety Critical': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Safety' },
    'Immobilized': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Immobilized' },
    'Fleet Priority': { color: 'bg-chart-1/10 text-chart-1 border-chart-1/20', label: 'Fleet' },
    'Emergency': { color: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Emergency' },
  };
  return configs[priority] || configs['Normal'];
}

export default function AppointmentsPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  const filteredAppointments = demoAppointments.filter((apt) => {
    const matchesSearch =
      apt.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.license_plate.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || apt.appointment_status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || apt.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const todayCount = demoAppointments.filter(
    (apt) => format(new Date(apt.appointment_date_time), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const arrivedCount = demoAppointments.filter((apt) => apt.appointment_status === 'Arrived').length;
  const pendingCount = demoAppointments.filter((apt) => apt.appointment_status === 'Booked').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today&apos;s Appointments</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-chart-3/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">{arrivedCount}</p>
              <p className="text-sm text-muted-foreground">Arrived</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-chart-4/10 p-3">
              <Clock className="h-5 w-5 text-chart-4" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending Arrival</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {demoAppointments.filter((apt) => apt.priority === 'VIP' || apt.priority === 'Urgent').length}
              </p>
              <p className="text-sm text-muted-foreground">Priority</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Service Appointments</CardTitle>
            <CardDescription>Manage customer service appointments</CardDescription>
          </div>
          <Button onClick={() => navigate('appointment-new')}>
              <Plus className="mr-2 h-4 w-4" />
              New Appointment
          </Button>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by customer, ID, vehicle, or plate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Booked">Booked</SelectItem>
                  <SelectItem value="Arrived">Arrived</SelectItem>
                  <SelectItem value="In Inspection">In Inspection</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="No-Show">No-Show</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Appointment</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.map((apt) => {
                  const statusConfig = getStatusConfig(apt.appointment_status);
                  const priorityConfig = getPriorityConfig(apt.priority);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <TableRow key={apt.name}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <a
                              href="#"
                              onClick={(e) => { e.preventDefault(); navigate('appointment-detail', { id: apt.name }); }}
                              className="font-medium hover:text-primary"
                            >
                              {apt.name}
                            </a>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={priorityConfig.color}>
                                {priorityConfig.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {apt.booking_source}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apt.customer_name}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {apt.primary_phone}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{apt.vehicle}</p>
                          <p className="text-sm text-muted-foreground">{apt.license_plate}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-48">
                          <p className="truncate text-sm">
                            {apt.service_type_requested.map((s) => s.service_type).join(', ')}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {apt.customer_complaint_summary}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">
                            {format(new Date(apt.appointment_date_time), 'MMM d, yyyy')}
                          </p>
                          <p className="text-muted-foreground">
                            {format(new Date(apt.appointment_date_time), 'h:mm a')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusConfig.color}>
                          <StatusIcon className="mr-1 h-3 w-3" />
                          {apt.appointment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate('appointment-detail', { id: apt.name })}>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('appointment-detail', { id: apt.name, mode: 'edit' })}>
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {apt.appointment_status === 'Booked' && (
                              <DropdownMenuItem className="text-chart-3">
                                Mark as Arrived
                              </DropdownMenuItem>
                            )}
                            {apt.appointment_status === 'Arrived' && (
                              <DropdownMenuItem className="text-primary">
                                Start Inspection
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              Cancel Appointment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {filteredAppointments.length === 0 && (
            <div className="py-12 text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No appointments found</p>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
