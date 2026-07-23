'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePermissions } from '@/contexts/permissions-context';
import { useNavigation } from '@/contexts/navigation-context';
import {
  useAutofillSingleCompany,
  useAutofillDefaultCustomer,
  useDmsCustomerDefaults,
  useCompanies,
  useCustomers,
  useVINs,
  useVehicleModels,
  useVehicleServiceItems,
} from '@/hooks/use-dms';
import { buildCustomerSelectOptions, resolveCustomerFieldChange } from '@/lib/customer-default';
import { SearchableSelect } from '@/components/searchable-select';
import { LinkWithCreate } from '@/components/link-with-create';
import { GroupDiscountFields } from '@/components/group-discount-fields';
import { CreateServiceItemDialog } from '@/components/create-service-item-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import {
  buildGroupDiscountPayload,
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from '@/lib/invoice-discount';
import {
  formatVehicleServiceItemLabel,
  fetchLabourRate,
  fetchVehicleServiceItemLineDefaults,
  vehicleServiceItemEstimatedHours,
} from '@/services/common';
import * as sparePartSalesSvc from '@/services/sparePartSales';
import * as vehiclesSvc from '@/services/vehicles';
import type { VINNo, VehicleModelOption } from '@/types/dms';
import { Loader2, Package, Plus, Receipt, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

type LineRow = {
  id: string;
  spare_part: string;
  item_name: string;
  qty: string;
  unit_price: string;
};

type LabourRow = {
  id: string;
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  hours: string;
  rate_per_hour: string;
};

function emptyLine(): LineRow {
  return { id: crypto.randomUUID(), spare_part: '', item_name: '', qty: '1', unit_price: '' };
}

function emptyLabour(): LabourRow {
  return {
    id: crypto.randomUUID(),
    vehicle_service_item: '',
    vehicle_service_item_name: '',
    hours: '1',
    rate_per_hour: '',
  };
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
}

function vehicleModelSelectLabel(vm: VehicleModelOption): string {
  return vm.model_code || vm.name;
}

function vehicleModelSelectDescription(vm: VehicleModelOption): string {
  return [vm.brand_label || vm.brand, vm.model_name, vm.variant, vm.model_year]
    .filter(Boolean)
    .join(' ');
}

export default function ProformaInvoiceNewPage() {
  const { canCreate } = usePermissions();
  const { navigate } = useNavigation();

  const [company, setCompany] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [defaults, setDefaults] = useState<sparePartSalesSvc.SparePartSalesDefaults | null>(null);
  const [defaultsLoading, setDefaultsLoading] = useState(true);
  const [warehouse, setWarehouse] = useState('');
  const [customer, setCustomer] = useState('');
  const [customerMeta, setCustomerMeta] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [vinSearch, setVinSearch] = useState('');
  const [vehicleVin, setVehicleVin] = useState('');
  const [selectedVin, setSelectedVin] = useState<VINNo | null>(null);
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleBrandLabel, setVehicleBrandLabel] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleModelSearch, setVehicleModelSearch] = useState('');
  const [postingDate, setPostingDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [remarks, setRemarks] = useState('');
  const [submitProforma, setSubmitProforma] = useState(true);
  const [inStockOnly, setInStockOnly] = useState(true);
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [labourRows, setLabourRows] = useState<LabourRow[]>([emptyLabour()]);
  const [serviceItemSearch, setServiceItemSearch] = useState('');
  const [showCreateServiceItemDialog, setShowCreateServiceItemDialog] = useState(false);
  const [labourCreateTargetId, setLabourCreateTargetId] = useState<string | null>(null);
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [labourDiscountInput, setLabourDiscountInput] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [partOptions, setPartOptions] = useState<
    { value: string; label: string; description?: string }[]
  >([]);
  const [partsLoading, setPartsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [partsDiscountInput, setPartsDiscountInput] = useState('');

  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: dmsCustomerDefaults } = useDmsCustomerDefaults();
  const { data: vins, isLoading: vinsLoading } = useVINs(customer || undefined, vinSearch);
  const { data: vehicleModels, isLoading: vehicleModelsLoading } = useVehicleModels(
    vehicleModelSearch,
    vehicleBrand || undefined
  );
  // Same as job card: filter labour by VIN-linked model only — not the parts model picker.
  const labourVehicleModel =
    selectedVin?.model || selectedVin?.resolved_vehicle_model || undefined;
  const { data: serviceItems, isLoading: serviceItemsLoading } = useVehicleServiceItems(
    serviceItemSearch,
    labourVehicleModel,
    vehicleVin || undefined
  );

  const vehicleModelOptions = useMemo(() => {
    const mapped =
      vehicleModels?.map((vm) => ({
        value: vm.name,
        label: vehicleModelSelectLabel(vm),
        description: vehicleModelSelectDescription(vm) || vm.name,
      })) || [];

    if (vehicleModel && !mapped.some((o) => o.value === vehicleModel)) {
      mapped.unshift({
        value: vehicleModel,
        label: vehicleModel,
        description: selectedVin?.model_name || selectedVin?.resolved_vehicle_model_label || '',
      });
    }
    return mapped;
  }, [vehicleModels, vehicleModel, selectedVin]);

  const loadDefaults = useCallback(async (co: string) => {
    setDefaultsLoading(true);
    try {
      const result = await sparePartSalesSvc.fetchSparePartSalesDefaults(co || undefined);
      setDefaults(result);
      if (!company && result.company) setCompany(result.company);
      if (!warehouse && result.default_warehouse) setWarehouse(result.default_warehouse);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load spare part sales defaults');
    } finally {
      setDefaultsLoading(false);
    }
  }, [company, warehouse]);

  useEffect(() => {
    void loadDefaults(company);
  }, [company, loadDefaults]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setPartsLoading(true);
      try {
        const rows = await sparePartSalesSvc.searchSparePartsForSale({
          search: partSearch || undefined,
          warehouse: warehouse || defaults?.default_warehouse || undefined,
          inStockOnly,
          limit: 30,
        });
        if (cancelled) return;
        setPartOptions(
          rows.map((p) => ({
            value: p.name,
            label: p.item_name || p.name,
            description: [
              p.item_code,
              p.qty_on_hand != null ? `Stock: ${p.qty_on_hand}` : null,
              p.unit_price != null ? `Price: ${p.unit_price}` : null,
            ]
              .filter(Boolean)
              .join(' · '),
          }))
        );
      } catch {
        if (!cancelled) setPartOptions([]);
      } finally {
        if (!cancelled) setPartsLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [partSearch, warehouse, defaults?.default_warehouse, inStockOnly]);

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    company,
    (c) => setCompany(c.name),
    { search: companySearch }
  );

  useAutofillDefaultCustomer(customer, (d) => {
    setCustomer(d.default_customer!);
    setCustomerMeta({
      name: d.default_customer!,
      customer_name: d.customer_name || d.default_customer!,
      mobile_no: d.mobile_no || undefined,
    });
  });

  const companyOptions = useMemo(() => {
    const names = defaults?.companies?.length
      ? defaults.companies
      : defaults?.company
        ? [defaults.company]
        : [];
    return names.map((name) => ({ value: name, label: name }));
  }, [defaults?.companies, defaults?.company]);

  const warehouseOptions = useMemo(
    () =>
      (defaults?.warehouses ?? []).map((w) => ({
        value: w.name,
        label: w.warehouse_name || w.name,
      })),
    [defaults?.warehouses]
  );

  const customerOptions = useMemo(
    () => buildCustomerSelectOptions(customers, customer, customerMeta),
    [customers, customer, customerMeta]
  );

  const handleCustomerChange = (id: string) => {
    const next = resolveCustomerFieldChange(id, customers, dmsCustomerDefaults);
    setCustomer(next.customer);
    setCustomerMeta(next.meta);
  };

  const applyVinToForm = (vin: VINNo & { brand?: string; brand_label?: string }) => {
    setSelectedVin(vin);
    setVehicleBrand(vin.brand || '');
    setVehicleBrandLabel(vin.brand_label || vin.brand || '');
    setVehicleModel(vin.model || vin.resolved_vehicle_model || '');
    if (vin.current_customer) {
      setCustomer(vin.current_customer);
      setCustomerMeta({
        name: vin.current_customer,
        customer_name: vin.customer_name || vin.current_customer,
      });
    }
  };

  const handleVehicleModelChange = (vm: string) => {
    setVehicleModel(vm);
    setLines([emptyLine()]);
    setLabourRows([emptyLabour()]);
    setPartSearch('');
    setServiceItemSearch('');
  };

  const handleVinSelect = async (vinName: string) => {
    setVehicleVin(vinName);
    setLines([emptyLine()]);
    setLabourRows([emptyLabour()]);
    setPartSearch('');
    setServiceItemSearch('');
    setVehicleModel('');
    if (!vinName) {
      setSelectedVin(null);
      setVehicleBrand('');
      setVehicleBrandLabel('');
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
        model: full.model,
        model_name: full.model_name,
        resolved_vehicle_model: full.resolved_vehicle_model,
        resolved_vehicle_model_label: full.resolved_vehicle_model_label,
        current_customer: full.current_customer,
        customer_name: full.customer_name,
        brand: full.brand,
        brand_label: full.brand_label,
      });
    } catch {
      if (!fromList) {
        toast.error('Could not load vehicle details for the selected VIN');
      }
    }
  };

  const vinSelectOptions = useMemo(() => {
    const mapped =
      vins?.map((v) => ({
        value: v.name,
        label: v.vin_number,
        description: [v.model, v.model_name, v.plate_number, v.customer_name]
          .filter(Boolean)
          .join(' · '),
      })) || [];

    if (vehicleVin && selectedVin && !mapped.some((o) => o.value === vehicleVin)) {
      mapped.unshift({
        value: vehicleVin,
        label: selectedVin.vin_number || vehicleVin,
        description: [
          selectedVin.model || selectedVin.resolved_vehicle_model,
          selectedVin.model_name,
          selectedVin.plate_number,
          selectedVin.customer_name,
        ]
          .filter(Boolean)
          .join(' · '),
      });
    }
    return mapped;
  }, [vins, vehicleVin, selectedVin]);

  const handleCustomerCreated = (name: string, label?: string) => {
    setCustomer(name);
    setCustomerMeta({ name, customer_name: label || name });
  };

  const applyServiceItemToLabourRow = async (rowId: string, itemName: string) => {
    if (!itemName) {
      setLabourRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                vehicle_service_item: '',
                vehicle_service_item_name: '',
                hours: '1',
                rate_per_hour: '',
              }
            : row
        )
      );
      return;
    }

    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    let estHours = vehicleServiceItemEstimatedHours(item);
    let serviceLabel = formatVehicleServiceItemLabel(item) || itemName;

    try {
      const defaults = await fetchVehicleServiceItemLineDefaults(itemName);
      if (defaults.estimated_hours > 0) estHours = defaults.estimated_hours;
      if (defaults.rate_per_hour > 0) rate = defaults.rate_per_hour;
      if (defaults.service_name || defaults.service_code) {
        serviceLabel = defaults.service_code
          ? `${defaults.service_code}: ${defaults.service_name || itemName}`
          : defaults.service_name || serviceLabel;
      }
    } catch {
      if (!rate) {
        try {
          rate = await fetchLabourRate(itemName);
        } catch {
          /* ignore */
        }
      }
    }

    setLabourRows((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              vehicle_service_item: itemName,
              vehicle_service_item_name: serviceLabel,
              hours: String(estHours || 1),
              rate_per_hour: rate ? String(rate) : row.rate_per_hour,
            }
          : row
      )
    );
  };

  const partsTotal = lines.reduce((sum, row) => {
    const qty = Number(row.qty) || 0;
    const rate = Number(row.unit_price) || 0;
    return sum + qty * rate;
  }, 0);

  const labourTotal = labourRows.reduce((sum, row) => {
    const hours = Number(row.hours) || 0;
    const rate = Number(row.rate_per_hour) || 0;
    return sum + hours * rate;
  }, 0);

  const partsDiscountValue = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const partsDiscountTotal = groupDiscountAmount(partsTotal, partsDiscountMode, partsDiscountValue);
  const labourDiscountValue = parseDiscountValue(labourDiscountMode, labourDiscountInput);
  const labourDiscountTotal = groupDiscountAmount(
    labourTotal,
    labourDiscountMode,
    labourDiscountValue
  );
  const grandTotal = labourTotal - labourDiscountTotal + partsTotal - partsDiscountTotal;

  const handleSubmit = async () => {
    if (!canCreate('proforma-invoices')) return;

    const payloadParts = lines
      .filter((l) => l.spare_part && Number(l.qty) > 0)
      .map((l) => ({
        spare_part: l.spare_part,
        qty: Number(l.qty),
        unit_price: Number(l.unit_price || 0),
      }));

    const payloadLabour = labourRows
      .filter((l) => l.vehicle_service_item && Number(l.hours) > 0)
      .map((l) => ({
        vehicle_service_item: l.vehicle_service_item,
        hours: Number(l.hours),
        rate_per_hour: Number(l.rate_per_hour || 0),
      }));

    if (!payloadParts.length && !payloadLabour.length) {
      toast.error('Add at least one labour or spare part line');
      return;
    }

    if (payloadParts.length && !warehouse) {
      toast.error('Select a warehouse for spare parts');
      return;
    }

    setSubmitting(true);
    try {
      const result = await sparePartSalesSvc.createSparePartProforma({
        customer: customer || undefined,
        company: company || defaults?.company || '',
        warehouse: warehouse || undefined,
        labour: payloadLabour.length ? payloadLabour : undefined,
        parts: payloadParts.length ? payloadParts : undefined,
        posting_date: postingDate,
        due_date: dueDate,
        remarks: remarks || undefined,
        submit: submitProforma,
        labour_discount: buildGroupDiscountPayload(labourDiscountMode, labourDiscountInput),
        parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
        vehicle_vin: vehicleVin || undefined,
        vehicle_brand: vehicleBrand || undefined,
        vehicle_model: vehicleModel || undefined,
      });
      toast.success(
        submitProforma
          ? `Proforma ${result.name} submitted (${result.grand_total})`
          : `Proforma ${result.name} saved as draft`
      );
      setLines([emptyLine()]);
      setLabourRows([emptyLabour()]);
      setLabourDiscountMode('none');
      setLabourDiscountInput('');
      setPartsDiscountMode('none');
      setPartsDiscountInput('');
      setRemarks('');
      setVehicleVin('');
      setSelectedVin(null);
      setVehicleBrand('');
      setVehicleBrandLabel('');
      setVehicleModel('');
      setCustomer('');
      setCustomerMeta(null);
      navigate('proforma-invoices');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create proforma');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Receipt className="h-6 w-6" />
          Proforma Invoice
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Saved as a Sales Order for customer approval — convert to sales invoice when ready.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New proforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Company</Label>
              <SearchableSelect
                options={companyOptions}
                value={company || defaults?.company || ''}
                onValueChange={setCompany}
                placeholder={defaultsLoading ? 'Loading…' : 'Company'}
                disabled={defaultsLoading || companyOptions.length <= 1}
              />
            </div>
            <div className="space-y-2">
              <Label>Customer</Label>
              <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                <SearchableSelect
                  options={customerOptions}
                  value={customer}
                  valueLabel={customerMeta?.customer_name}
                  onValueChange={handleCustomerChange}
                  onSearchChange={setCustomerSearch}
                  placeholder="Search customer"
                  isLoading={customersLoading}
                />
              </LinkWithCreate>
              {defaults?.default_customer ? (
                <p className="text-xs text-muted-foreground">
                  Optional — if left blank, uses default walk-in customer (
                  {defaults.default_customer_name || defaults.default_customer}) from DMS Settings.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Optional — configure Default Customer in DMS Settings for walk-in sales without
                  selecting a customer.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Warehouse *</Label>
              <SearchableSelect
                options={warehouseOptions}
                value={warehouse}
                onValueChange={setWarehouse}
                placeholder={defaultsLoading ? 'Loading…' : 'Parts warehouse'}
                disabled={defaultsLoading || warehouseOptions.length === 0}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Vehicle (VIN)</Label>
              <SearchableSelect
                options={vinSelectOptions}
                value={vehicleVin}
                onValueChange={(val) => void handleVinSelect(val)}
                onSearchChange={setVinSearch}
                placeholder="Search VIN, chassis, or plate (min 3 chars)..."
                isLoading={vinsLoading}
              />
              <p className="text-xs text-muted-foreground">
                Optional — recorded on the proforma remarks when provided.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Car make</Label>
              <Input
                readOnly
                value={vehicleBrandLabel}
                placeholder="From selected VIN"
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <SearchableSelect
                options={vehicleModelOptions}
                value={vehicleModel}
                onValueChange={handleVehicleModelChange}
                onSearchChange={setVehicleModelSearch}
                placeholder="Search Vehicle Model master…"
                isLoading={vehicleModelsLoading}
              />
              <p className="text-xs text-muted-foreground">
                Vehicle Model master record (e.g. JX70P) — same link as on VIN and spare part
                compatibility. Auto-filled from VIN.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Posting date</Label>
              <Input type="date" value={postingDate} onChange={(e) => setPostingDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="in-stock-only"
                checked={inStockOnly}
                onCheckedChange={(v) => setInStockOnly(Boolean(v))}
              />
              <Label htmlFor="in-stock-only" className="text-sm font-normal cursor-pointer">
                Show only parts in stock at selected warehouse
              </Label>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Labour</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLabourRows((p) => [...p, emptyLabour()])}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add line
              </Button>
            </div>
            {labourRows.map((line) => (
              <div key={line.id} className="grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3">
                <div className="md:col-span-5 space-y-2">
                  <Label className="text-xs">Service item *</Label>
                  <SearchableSelect
                    options={
                      serviceItems?.map((si) => ({
                        value: si.name,
                        label: formatVehicleServiceItemLabel(si),
                        description: si.custom_rate || si.estimated_hours
                          ? [
                              si.custom_rate ? `Rate: ${si.custom_rate}` : null,
                              si.estimated_hours ? `${si.estimated_hours}h` : null,
                            ]
                              .filter(Boolean)
                              .join(' · ')
                          : undefined,
                      })) || []
                    }
                    value={line.vehicle_service_item}
                    valueLabel={line.vehicle_service_item_name || undefined}
                    onValueChange={(value) => void applyServiceItemToLabourRow(line.id, value)}
                    onSearchChange={setServiceItemSearch}
                    placeholder="Search labour items..."
                    isLoading={serviceItemsLoading}
                    onCreateNew={() => {
                      setLabourCreateTargetId(line.id);
                      setShowCreateServiceItemDialog(true);
                    }}
                    createNewLabel="New Service Item"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Hours *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={line.hours}
                    onChange={(e) =>
                      setLabourRows((prev) =>
                        prev.map((row) =>
                          row.id === line.id ? { ...row, hours: e.target.value } : row
                        )
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Rate/hr</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={line.rate_per_hour}
                    onChange={(e) =>
                      setLabourRows((prev) =>
                        prev.map((row) =>
                          row.id === line.id ? { ...row, rate_per_hour: e.target.value } : row
                        )
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    readOnly
                    value={(
                      (Number(line.hours) || 0) * (Number(line.rate_per_hour) || 0)
                    ).toFixed(2)}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={labourRows.length <= 1}
                    onClick={() =>
                      setLabourRows((prev) => prev.filter((row) => row.id !== line.id))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <GroupDiscountFields
            label="Labour"
            mode={labourDiscountMode}
            onModeChange={(m) => {
              setLabourDiscountMode(m);
              if (m === 'none') setLabourDiscountInput('');
            }}
            value={labourDiscountInput}
            onValueChange={setLabourDiscountInput}
            subtotal={labourTotal}
          />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Spare parts</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => setLines((p) => [...p, emptyLine()])}>
                <Plus className="h-4 w-4 mr-1" />
                Add line
              </Button>
            </div>
            {lines.map((line, idx) => (
              <div key={line.id} className="grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3">
                <div className="md:col-span-5 space-y-2">
                  <Label className="text-xs">Spare part *</Label>
                  <SearchableSelect
                    options={partOptions}
                    value={line.spare_part}
                    onValueChange={async (value) => {
                      const opt = partOptions.find((o) => o.value === value);
                      let unitPrice = line.unit_price;
                      try {
                        const rows = await sparePartSalesSvc.searchSparePartsForSale({
                          search: value,
                          warehouse: warehouse || defaults?.default_warehouse || undefined,
                          limit: 1,
                        });
                        const match = rows.find((r) => r.name === value);
                        if (match && !unitPrice && match.unit_price != null) {
                          unitPrice = String(match.unit_price);
                        }
                      } catch {
                        /* ignore */
                      }
                      setLines((prev) =>
                        prev.map((row, i) =>
                          i === idx
                            ? {
                                ...row,
                                spare_part: value,
                                item_name: opt?.label || value,
                                unit_price: unitPrice,
                              }
                            : row
                        )
                      );
                    }}
                    onSearchChange={setPartSearch}
                    placeholder="Search spare part"
                    isLoading={partsLoading}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Qty *</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={line.qty}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((row, i) => (i === idx ? { ...row, qty: e.target.value } : row))
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Unit price</Label>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    value={line.unit_price}
                    onChange={(e) =>
                      setLines((prev) =>
                        prev.map((row, i) =>
                          i === idx ? { ...row, unit_price: e.target.value } : row
                        )
                      )
                    }
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    readOnly
                    value={(
                      (Number(line.qty) || 0) * (Number(line.unit_price) || 0)
                    ).toFixed(2)}
                  />
                </div>
                <div className="md:col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={lines.length <= 1}
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <GroupDiscountFields
            label="Parts"
            mode={partsDiscountMode}
            onModeChange={setPartsDiscountMode}
            value={partsDiscountInput}
            onValueChange={setPartsDiscountInput}
            subtotal={partsTotal}
          />

          <div className="space-y-2">
            <Label>Remarks</Label>
            <Textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional notes for this counter sale"
              rows={2}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="submit-proforma"
              checked={submitProforma}
              onCheckedChange={(v) => setSubmitProforma(Boolean(v))}
            />
            <Label htmlFor="submit-proforma" className="text-sm font-normal cursor-pointer">
              Submit proforma (Sales Order)
            </Label>
          </div>

          <div className="rounded-lg border bg-muted/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>
                {labourRows.filter((l) => l.vehicle_service_item).length} labour ·{' '}
                {lines.filter((l) => l.spare_part).length} part(s)
                {labourDiscountTotal > 0 || partsDiscountTotal > 0
                  ? ` · discount: ${(labourDiscountTotal + partsDiscountTotal).toFixed(2)}`
                  : ''}
              </span>
            </div>
            <p className="text-xl font-semibold">Total: {grandTotal.toFixed(2)}</p>
          </div>

          <FormActionsBar>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={submitting || !canCreate('proforma-invoices')}
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save proforma
            </Button>
          </FormActionsBar>
        </CardContent>
      </Card>

      {(labourRows.some((l) => l.vehicle_service_item) || lines.some((l) => l.spare_part)) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Line summary</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty/Hrs</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {labourRows
                  .filter((l) => l.vehicle_service_item)
                  .map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>Labour</TableCell>
                      <TableCell>{l.vehicle_service_item_name || l.vehicle_service_item}</TableCell>
                      <TableCell className="text-right">{l.hours}</TableCell>
                      <TableCell className="text-right">{l.rate_per_hour}</TableCell>
                      <TableCell className="text-right">
                        {((Number(l.hours) || 0) * (Number(l.rate_per_hour) || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                {lines
                  .filter((l) => l.spare_part)
                  .map((l) => (
                    <TableRow key={l.id}>
                      <TableCell>Parts</TableCell>
                      <TableCell>{l.item_name || l.spare_part}</TableCell>
                      <TableCell className="text-right">{l.qty}</TableCell>
                      <TableCell className="text-right">{l.unit_price}</TableCell>
                      <TableCell className="text-right">
                        {((Number(l.qty) || 0) * (Number(l.unit_price) || 0)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <CreateServiceItemDialog
        open={showCreateServiceItemDialog}
        onOpenChange={(open) => {
          setShowCreateServiceItemDialog(open);
          if (!open) setLabourCreateTargetId(null);
        }}
        onCreated={(name) => {
          const targetId = labourCreateTargetId || labourRows[labourRows.length - 1]?.id;
          setShowCreateServiceItemDialog(false);
          setLabourCreateTargetId(null);
          if (targetId) void applyServiceItemToLabourRow(targetId, name);
        }}
      />
    </div>
  );
}
