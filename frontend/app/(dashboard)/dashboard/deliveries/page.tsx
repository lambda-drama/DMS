"use client";

import { useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useDeliveries } from "@/hooks/use-dms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Truck,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  Draft: { label: "Draft", variant: "secondary" },
  "Ready for Delivery": { label: "Ready", variant: "default" },
  Delivered: { label: "Delivered", variant: "default" },
  Cancelled: { label: "Cancelled", variant: "destructive" },
};

export default function DeliveriesPage() {
  const { navigate } = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: deliveries, isLoading, error } = useDeliveries({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchQuery || undefined,
  });

  const stats = {
    total: deliveries?.length || 0,
    ready: deliveries?.filter((d) => d.status === "Ready for Delivery").length || 0,
    delivered: deliveries?.filter((d) => d.status === "Delivered").length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vehicle Deliveries</h1>
          <p className="text-muted-foreground mt-1">Manage vehicle delivery and handover</p>
        </div>
        <Button onClick={() => navigate('delivery-new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Delivery
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold">{stats.ready}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#F9A825]/10">
                <Clock className="h-5 w-5 text-[#F9A825]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold">{stats.delivered}</p>
              </div>
              <div className="p-2 rounded-lg bg-[#2E7D32]/10">
                <CheckCircle2 className="h-5 w-5 text-[#2E7D32]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by delivery ID, vehicle, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Deliveries List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              Failed to load deliveries
            </div>
          ) : deliveries && deliveries.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Delivery ID</TableHead>
                    <TableHead>Job Card</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveries.map((delivery) => (
                    <TableRow key={delivery.name}>
                      <TableCell>
                        <button 
                          onClick={() => navigate('delivery-detail', { id: delivery.name })}
                          className="font-medium text-primary hover:underline"
                        >
                          {delivery.name}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button 
                          onClick={() => navigate('job-card-detail', { id: delivery.job_card })}
                          className="text-muted-foreground hover:text-primary hover:underline"
                        >
                          {delivery.job_card}
                        </button>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium">{delivery.vehicle_registration}</p>
                      </TableCell>
                      <TableCell>{delivery.customer_name}</TableCell>
                      <TableCell>
                        <Badge variant={statusConfig[delivery.status]?.variant || "secondary"}>
                          {delivery.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {delivery.delivery_date 
                          ? new Date(delivery.delivery_date).toLocaleDateString()
                          : "-"
                        }
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate('delivery-detail', { id: delivery.name })}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <Truck className="h-12 w-12 mb-4 opacity-50" />
              <p>No deliveries found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
