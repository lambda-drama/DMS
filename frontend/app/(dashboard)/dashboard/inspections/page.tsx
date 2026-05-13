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
  ClipboardCheck,
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Car,
  User,
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
} from 'lucide-react';

// Demo data
const demoInspections = [
  {
    name: 'INS-2026-00008',
    inspection_date: '2026-05-13T08:30:00',
    customer_name: 'Michael Johnson',
    customer_vehicle: 'Toyota Camry 2024',
    license_plate: 'ABC 1234',
    vin_chassis: '1HGBH41JXMN109186',
    service_advisor_name: 'John Smith',
    odometer: 45230,
    fuel_level: '3/4',
    arrival_method: 'Driven In',
    warning_lights_count: 0,
    issues_found: 2,
    docstatus: 1,
    job_card: 'JC-2026-00056',
  },
  {
    name: 'INS-2026-00007',
    inspection_date: '2026-05-13T09:15:00',
    customer_name: 'Sarah Williams',
    customer_vehicle: 'Honda Accord 2023',
    license_plate: 'XYZ 5678',
    vin_chassis: '2HGFA16578H531458',
    service_advisor_name: 'Jane Doe',
    odometer: 32150,
    fuel_level: '1/2',
    arrival_method: 'Driven In',
    warning_lights_count: 1,
    issues_found: 3,
    docstatus: 1,
    job_card: 'JC-2026-00055',
  },
  {
    name: 'INS-2026-00006',
    inspection_date: '2026-05-13T10:00:00',
    customer_name: 'James Brown',
    customer_vehicle: 'BMW X5 2024',
    license_plate: 'BMW 9012',
    vin_chassis: '5UXFE43578L015879',
    service_advisor_name: 'John Smith',
    odometer: 18750,
    fuel_level: '1/4',
    arrival_method: 'Towed In',
    warning_lights_count: 3,
    issues_found: 5,
    docstatus: 0,
    job_card: null,
  },
  {
    name: 'INS-2026-00005',
    inspection_date: '2026-05-12T14:30:00',
    customer_name: 'Emily Davis',
    customer_vehicle: 'Mercedes C300 2023',
    license_plate: 'MBZ 3456',
    vin_chassis: 'WDDGF4HB1DA765432',
    service_advisor_name: 'Jane Doe',
    odometer: 28900,
    fuel_level: 'Full',
    arrival_method: 'Driven In',
    warning_lights_count: 0,
    issues_found: 1,
    docstatus: 1,
    job_card: 'JC-2026-00054',
  },
];

export default function InspectionsPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredInspections = demoInspections.filter((insp) => {
    const matchesSearch =
      insp.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.customer_vehicle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insp.license_plate.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'draft' && insp.docstatus === 0) ||
      (statusFilter === 'submitted' && insp.docstatus === 1);

    return matchesSearch && matchesStatus;
  });

  const todayCount = demoInspections.filter(
    (insp) =>
      format(new Date(insp.inspection_date), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  ).length;

  const pendingCount = demoInspections.filter((insp) => insp.docstatus === 0).length;
  const issuesCount = demoInspections.reduce((acc, insp) => acc + insp.issues_found, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <ClipboardCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today&apos;s Inspections</p>
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
              <p className="text-sm text-muted-foreground">Pending Submission</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{issuesCount}</p>
              <p className="text-sm text-muted-foreground">Issues Found</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-chart-3/10 p-3">
              <CheckCircle2 className="h-5 w-5 text-chart-3" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {demoInspections.filter((insp) => insp.job_card).length}
              </p>
              <p className="text-sm text-muted-foreground">Job Cards Created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Vehicle Inspections</CardTitle>
            <CardDescription>Vehicle intake inspections and condition reports</CardDescription>
          </div>
          <Button onClick={() => navigate('inspection-new')}>
            <Plus className="mr-2 h-4 w-4" />
            New Inspection
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Inspection</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Condition</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Job Card</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInspections.map((insp) => (
                  <TableRow key={insp.name}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <ClipboardCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <button
                            onClick={() => navigate('inspection-detail', { id: insp.name })}
                            className="font-medium hover:text-primary"
                          >
                            {insp.name}
                          </button>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>
                              {format(new Date(insp.inspection_date), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{insp.customer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Car className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{insp.customer_vehicle}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{insp.license_plate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {insp.warning_lights_count > 0 ? (
                            <Badge variant="outline\" className="bg-destructive/10 text-destructive border-destructive/20">
                              {insp.warning_lights_count} Warning Light
                              {insp.warning_lights_count > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-chart-3/10 text-chart-3 border-chart-3/20"
                            >
                              No Warnings
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {insp.issues_found} issues found
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          insp.docstatus === 1
                            ? 'bg-chart-3/10 text-chart-3 border-chart-3/20'
                            : 'bg-chart-4/10 text-chart-4 border-chart-4/20'
                        }
                      >
                        {insp.docstatus === 1 ? 'Submitted' : 'Draft'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {insp.job_card ? (
                        <button
                          onClick={() => navigate('job-card-detail', { id: insp.job_card! })}
                          className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          {insp.job_card}
                        </button>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate('inspection-detail', { id: insp.name })}>
                            View Details
                          </DropdownMenuItem>
                          {insp.docstatus === 0 && (
                            <DropdownMenuItem onClick={() => navigate('inspection-detail', { id: insp.name, mode: 'edit' })}>
                              Continue Editing
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {insp.docstatus === 1 && !insp.job_card && (
                            <DropdownMenuItem className="text-primary">
                              Create Job Card
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>Print Report</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredInspections.length === 0 && (
            <div className="py-12 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium">No inspections found</p>
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
