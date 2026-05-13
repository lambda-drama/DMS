'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Calendar,
  Car,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Wrench,
  Users,
  ArrowRight,
  Timer,
} from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';

// Demo data for the dashboard
const stats = [
  {
    title: "Today's Appointments",
    value: '12',
    change: '+2 from yesterday',
    icon: Calendar,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    title: 'Active Job Cards',
    value: '8',
    change: '3 in repair',
    icon: Wrench,
    color: 'text-chart-3',
    bgColor: 'bg-chart-3/10',
  },
  {
    title: 'Pending QC',
    value: '4',
    change: '2 urgent',
    icon: CheckCircle2,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
  },
  {
    title: 'Ready for Delivery',
    value: '5',
    change: '2 awaiting payment',
    icon: Car,
    color: 'text-chart-1',
    bgColor: 'bg-chart-1/10',
  },
];

const recentJobCards = [
  {
    id: 'JC-2026-00056',
    customer: 'Michael Johnson',
    vehicle: 'Toyota Camry 2024',
    status: 'Repair In Progress',
    priority: 'Normal',
    eta: '2 hours',
  },
  {
    id: 'JC-2026-00055',
    customer: 'Sarah Williams',
    vehicle: 'Honda Accord 2023',
    status: 'QC In Progress',
    priority: 'VIP',
    eta: '30 mins',
  },
  {
    id: 'JC-2026-00054',
    customer: 'James Brown',
    vehicle: 'BMW X5 2024',
    status: 'Waiting Parts',
    priority: 'Urgent',
    eta: 'Tomorrow',
  },
  {
    id: 'JC-2026-00053',
    customer: 'Emily Davis',
    vehicle: 'Mercedes C300 2023',
    status: 'Completed',
    priority: 'Normal',
    eta: 'Ready',
  },
];

const upcomingAppointments = [
  {
    time: '09:00 AM',
    customer: 'Robert Wilson',
    vehicle: 'Audi A4 2024',
    service: 'Regular Service',
    status: 'Confirmed',
  },
  {
    time: '10:30 AM',
    customer: 'Linda Martinez',
    vehicle: 'Lexus RX350 2023',
    service: 'Oil Change + Inspection',
    status: 'Arrived',
  },
  {
    time: '11:00 AM',
    customer: 'David Lee',
    vehicle: 'Tesla Model 3 2024',
    service: 'Brake Service',
    status: 'Pending',
  },
  {
    time: '02:00 PM',
    customer: 'Karen White',
    vehicle: 'Ford F-150 2023',
    service: 'AC Repair',
    status: 'Confirmed',
  },
];

const bayOccupancy = [
  { bay: 'Bay 1', status: 'occupied', vehicle: 'Toyota Camry', progress: 65 },
  { bay: 'Bay 2', status: 'occupied', vehicle: 'Honda Accord', progress: 90 },
  { bay: 'Bay 3', status: 'available', vehicle: null, progress: 0 },
  { bay: 'Bay 4', status: 'occupied', vehicle: 'BMW X5', progress: 30 },
  { bay: 'Bay 5', status: 'maintenance', vehicle: null, progress: 0 },
  { bay: 'Bay 6', status: 'available', vehicle: null, progress: 0 },
];

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    'Repair In Progress': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    'QC In Progress': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    'Waiting Parts': 'bg-destructive/10 text-destructive border-destructive/20',
    'Completed': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    'Confirmed': 'bg-chart-3/10 text-chart-3 border-chart-3/20',
    'Arrived': 'bg-chart-1/10 text-chart-1 border-chart-1/20',
    'Pending': 'bg-muted text-muted-foreground border-muted',
  };
  return colors[status] || 'bg-muted text-muted-foreground';
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    'VIP': 'bg-chart-4/10 text-chart-4 border-chart-4/20',
    'Urgent': 'bg-destructive/10 text-destructive border-destructive/20',
    'Normal': 'bg-muted text-muted-foreground border-muted',
  };
  return colors[priority] || 'bg-muted text-muted-foreground';
}

export default function DashboardPage() {
  const { navigate } = useNavigation();
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.change}</p>
                </div>
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Active Job Cards */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Active Job Cards</CardTitle>
              <CardDescription>Currently in progress</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('job-cards')} className="flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentJobCards.map((job) => (
                <div
                  key={job.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('job-card-detail', { id: job.id })}
                          className="font-medium hover:text-primary"
                        >
                          {job.id}
                        </button>
                        <Badge variant="outline" className={getPriorityColor(job.priority)}>
                          {job.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {job.customer} - {job.vehicle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className={getStatusColor(job.status)}>
                      {job.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Timer className="h-4 w-4" />
                      {job.eta}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg">Today&apos;s Schedule</CardTitle>
              <CardDescription>Upcoming appointments</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('appointments')} className="flex items-center gap-1">
              View all <ArrowRight className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingAppointments.map((apt, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-16 items-center justify-center rounded bg-muted text-xs font-medium">
                      {apt.time}
                    </div>
                    {i < upcomingAppointments.length - 1 && (
                      <div className="mt-2 h-full w-px bg-border" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">{apt.customer}</p>
                      <Badge variant="outline" className={getStatusColor(apt.status)}>
                        {apt.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{apt.vehicle}</p>
                    <p className="text-xs text-muted-foreground">{apt.service}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bay Occupancy */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Service Bay Status</CardTitle>
              <CardDescription>Real-time bay occupancy</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-3" />
                <span className="text-muted-foreground">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-chart-1" />
                <span className="text-muted-foreground">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-destructive" />
                <span className="text-muted-foreground">Maintenance</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {bayOccupancy.map((bay) => (
              <div
                key={bay.bay}
                className={`rounded-lg border p-4 ${
                  bay.status === 'available'
                    ? 'border-chart-3/30 bg-chart-3/5'
                    : bay.status === 'maintenance'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-chart-1/30 bg-chart-1/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{bay.bay}</span>
                  {bay.status === 'occupied' ? (
                    <Clock className="h-4 w-4 text-chart-1" />
                  ) : bay.status === 'maintenance' ? (
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-chart-3" />
                  )}
                </div>
                {bay.vehicle ? (
                  <>
                    <p className="mt-2 truncate text-sm text-muted-foreground">{bay.vehicle}</p>
                    <Progress value={bay.progress} className="mt-2 h-1.5" />
                    <p className="mt-1 text-xs text-muted-foreground">{bay.progress}% complete</p>
                  </>
                ) : (
                  <p className="mt-2 text-sm capitalize text-muted-foreground">{bay.status}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-4">
        <Button className="h-auto flex-col gap-2 p-6" onClick={() => navigate('appointment-new')}>
          <Calendar className="h-6 w-6" />
          <span>New Appointment</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 p-6" onClick={() => navigate('inspection-new')}>
          <Users className="h-6 w-6" />
          <span>Walk-in Inspection</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 p-6" onClick={() => navigate('job-cards')}>
          <Wrench className="h-6 w-6" />
          <span>View Job Cards</span>
        </Button>
        <Button variant="outline" className="h-auto flex-col gap-2 p-6" onClick={() => navigate('deliveries')}>
          <TrendingUp className="h-6 w-6" />
          <span>Pending Deliveries</span>
        </Button>
      </div>
    </div>
  );
}
