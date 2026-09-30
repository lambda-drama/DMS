'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Package, Receipt, Save, Trash2 } from 'lucide-react';
import { addCalendarMonthsISO, todayISO } from '@/lib/date-format';
import { useNavigation } from '@/contexts/navigation-context';
import { useAutofillBranch, useBranchField, useVehicleServiceItems, useVINs } from '@/hooks/use-dms';
import { SearchableSelect } from '@/components/searchable-select';
import { BranchSelect } from '@/components/branches/branch-select';
import { LinkWithCreate } from '@/components/link-with-create';
import { CreateServiceItemDialog } from '@/components/create-service-item-dialog';
import { CreateSparePartDialog } from '@/components/create-spare-part-dialog';
import { FormActionsBar } from '@/components/layout/form-actions-bar';
import { GroupDiscountFields } from '@/components/group-discount-fields';
import { LineDiscountButton } from '@/components/line-discount-button';
import { InvoiceTaxBreakdown } from '@/components/invoices/invoice-tax-breakdown';
import { AddLineButton } from '@/components/ui/add-line-button';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  buildGroupDiscountPayload,
  discountModeFromBackend,
  groupDiscountAmount,
  lineDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from '@/lib/invoice-discount';
import * as commonSvc from '@/services/common';
import {
  fetchLabourRate,
  fetchVehicleServiceItemLineDefaults,
  formatVehicleServiceItemLabel,
  vehicleServiceItemEstimatedHours,
} from '@/services/common';
import * as ordersSvc from '@/services/orders';
import * as sparePartSalesSvc from '@/services/sparePartSales';
import * as vehiclesSvc from '@/services/vehicles';
import type { VINNo } from '@/types/dms';

type PartRow = {
  id: string;
  spare_part: string;
  item_name: string;
  display_name: string;
  qty: string;
  unit_price: string;
  discount_type: '' | 'Percentage' | 'Amount';
  discount_value: number;
};

type LabourRow = {
  id: string;
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  display_name: string;
  hours: string;
  rate_per_hour: string;
  discount_type: '' | 'Percentage' | 'Amount';
  discount_value: number;
};

function emptyLine(): PartRow {
  return {
    id: crypto.randomUUID(),
    spare_part: '',
    item_name: '',
    display_name: '',
    qty: '1',
    unit_price: '',
    discount_type: '',
    discount_value: 0,
  };
}

function emptyLabour(): LabourRow {
  return {
    id: crypto.randomUUID(),
    vehicle_service_item: '',
    vehicle_service_item_name: '',
    display_name: '',
    hours: '1',
    rate_per_hour: '',
    discount_type: '',
    discount_value: 0,
  };
}

function rowLineNet(qty: string | number, rate: string | number, type?: string | null, value?: number | null) {
  const gross = (Number(qty) || 0) * (Number(rate) || 0);
  return Math.max(
    gross - lineDiscountAmount(gross, discountModeFromBackend(type), Number(value) || 0),
    0
  );
}

function today() {
  return todayISO();
}

function defaultValidTo(from = today()) {
  return addCalendarMonthsISO(from, 1);
}

function formatMoney(amount?: number, currency?: string) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'ETB',
    minimumFractionDigits: 2,
  }).format(amount ?? 0);
}

export default function OrderNewPage() {
  const { viewParams, navigate } = useNavigation();
  const { mutate } = useSWRConfig();
  const editName = (viewParams.get('id') || '').trim();

  const [customer, setCustomer] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [vinSearch, setVinSearch] = useState('');
  const [vehicleVin, setVehicleVin] = useState('');
  const [selectedVin, setSelectedVin] = useState<VINNo | null>(null);
  const [warehouse, setWarehouse] = useState('');
  const [branch, setBranch] = useState('');
  const [branchSearch, setBranchSearch] = useState('');
  const [transactionDate, setTransactionDate] = useState(today());
  const [deliveryDate, setDeliveryDate] = useState(() => defaultValidTo());
  const [remarks, setRemarks] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [applyTaxes, setApplyTaxes] = useState(false);
  const [applyTaxWithholding, setApplyTaxWithholding] = useState(false);
  const [parts, setParts] = useState<PartRow[]>([emptyLine()]);
  const [labourRows, setLabourRows] = useState<LabourRow[]>([emptyLabour()]);
  const [serviceItemSearch, setServiceItemSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [showCreateSparePartDialog, setShowCreateSparePartDialog] = useState(false);
  const [showCreateServiceItemDialog, setShowCreateServiceItemDialog] = useState(false);
  const [createLabourIdx, setCreateLabourIdx] = useState(0);
  const [createPartIdx, setCreatePartIdx] = useState(0);
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [labourDiscountInput, setLabourDiscountInput] = useState('');
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [partsDiscountInput, setPartsDiscountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderTaxPreview, setOrderTaxPreview] = useState<ordersSvc.DmsOrderTaxPreview | null>(null);
  const [orderTaxPreviewLoading, setOrderTaxPreviewLoading] = useState(false);

  const { data: defaults } = useSWR('spare-part-sales-defaults', () =>
    sparePartSalesSvc.fetchSparePartSalesDefaults()
  );

  // Branch is mandatory on the order and defaults to the caller's branch or the
  // company default (DMS Settings). Options are scoped to the DMS company.
  const handleBranchAutofill = useCallback((value: string) => setBranch(value), []);
  const {
    branches: branchOptions,
    isLoading: branchesLoading,
    defaultBranch,
  } = useBranchField({ company: defaults?.company || '', search: branchSearch });
  useAutofillBranch(defaultBranch, branch, handleBranchAutofill, { enabled: !editName });
  const { data: existing } = useSWR(editName ? ['dms-order', editName] : null, () =>
    ordersSvc.getDmsOrder(editName)
  );
  const { data: customers, isLoading: customersLoading } = useSWR(
    ['order-customers', customerSearch],
    () => commonSvc.fetchCustomers(customerSearch || undefined, 20)
  );
  const { data: serviceItems, isLoading: serviceItemsLoading } =
    useVehicleServiceItems(serviceItemSearch);
  const { data: vins, isLoading: vinsLoading } = useVINs(undefined, vinSearch);
  const { data: partResults, isLoading: partsLoading } = useSWR(
    ['order-parts', partSearch, warehouse, inStockOnly],
    () =>
      sparePartSalesSvc.searchSparePartsForSale({
        search: partSearch || undefined,
        warehouse: warehouse || undefined,
        limit: 25,
        inStockOnly,
      })
  );

  const customerOptions = useMemo(
    () =>
      (customers?.data || []).map((row) => ({
        value: row.name,
        label: row.customer_name || row.name,
      })),
    [customers]
  );

  const handleCustomerCreated = (name: string, label?: string) => {
    setCustomer(name);
    setCustomerLabel(label || name);
    void mutate(
      (key) => Array.isArray(key) && key[0] === 'order-customers',
      undefined,
      { revalidate: true }
    );
  };

  const applyVinToForm = (vin: VINNo) => {
    setSelectedVin(vin);
    if (vin.current_customer) {
      setCustomer(vin.current_customer);
      setCustomerLabel(vin.customer_name || vin.current_customer);
    }
  };

  const handleVinSelect = async (vinName: string) => {
    setVehicleVin(vinName);
    if (!vinName) {
      setSelectedVin(null);
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
        current_customer: full.current_customer,
        customer_name: full.customer_name,
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
        description: [v.model_name, v.plate_number, v.customer_name].filter(Boolean).join(' · '),
      })) || [];
    if (vehicleVin && selectedVin && !mapped.some((o) => o.value === vehicleVin)) {
      mapped.unshift({
        value: vehicleVin,
        label: selectedVin.vin_number || vehicleVin,
        description: [selectedVin.model_name, selectedVin.plate_number, selectedVin.customer_name]
          .filter(Boolean)
          .join(' · '),
      });
    } else if (vehicleVin && !mapped.some((o) => o.value === vehicleVin)) {
      mapped.unshift({
        value: vehicleVin,
        label: existing?.vin_number || vehicleVin,
        description: '',
      });
    }
    return mapped;
  }, [vins, vehicleVin, selectedVin, existing?.vin_number]);

  const serviceItemOptions = useMemo(
    () =>
      (serviceItems || []).map((item) => ({
        value: item.name,
        label: formatVehicleServiceItemLabel(item),
        description:
          item.custom_rate || item.estimated_hours
            ? [
                item.custom_rate ? `Rate: ${item.custom_rate}` : null,
                item.estimated_hours ? `${item.estimated_hours}h` : null,
              ]
                .filter(Boolean)
                .join(' · ')
            : undefined,
      })),
    [serviceItems]
  );

  const partOptions = useMemo(
    () =>
      (partResults || []).map((part) => ({
        value: part.name,
        label: part.item_name || part.name,
        description: [
          part.item_code || part.name,
          part.unit_price != null ? String(part.unit_price) : null,
          part.qty_on_hand != null ? `stock ${part.qty_on_hand}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      })),
    [partResults]
  );

  const warehouseOptions = defaults?.warehouses || [];
  const currency = existing?.currency || 'ETB';

  const partsGross = parts.reduce((sum, row) => {
    return sum + (Number(row.qty) || 0) * (Number(row.unit_price) || 0);
  }, 0);

  const labourGross = labourRows.reduce((sum, row) => {
    return sum + (Number(row.hours) || 0) * (Number(row.rate_per_hour) || 0);
  }, 0);

  const partsLineDiscountTotal = parts.reduce(
    (sum, row) =>
      sum +
      lineDiscountAmount(
        (Number(row.qty) || 0) * (Number(row.unit_price) || 0),
        discountModeFromBackend(row.discount_type),
        row.discount_value
      ),
    0
  );
  const labourLineDiscountTotal = labourRows.reduce(
    (sum, row) =>
      sum +
      lineDiscountAmount(
        (Number(row.hours) || 0) * (Number(row.rate_per_hour) || 0),
        discountModeFromBackend(row.discount_type),
        row.discount_value
      ),
    0
  );
  const partsTotal = Math.max(partsGross - partsLineDiscountTotal, 0);
  const labourTotal = Math.max(labourGross - labourLineDiscountTotal, 0);

  const partsDiscountValue = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const partsDiscountTotal = groupDiscountAmount(partsTotal, partsDiscountMode, partsDiscountValue);
  const labourDiscountValue = parseDiscountValue(labourDiscountMode, labourDiscountInput);
  const labourDiscountTotal = groupDiscountAmount(
    labourTotal,
    labourDiscountMode,
    labourDiscountValue
  );
  const grandTotal = labourTotal - labourDiscountTotal + partsTotal - partsDiscountTotal;

  // Exactly the lines / discounts the save sends — the tax preview must be built
  // from the same numbers, otherwise the amounts on screen would not match the
  // order that gets stored.
  const orderTaxLines = useMemo(
    () => ({
      parts: parts
        .filter((row) => row.spare_part && Number(row.qty) > 0)
        .map((row) => ({
          spare_part: row.spare_part,
          qty: Number(row.qty),
          unit_price: Number(row.unit_price || 0),
          // Display name → Sales Order Item description.
          description: row.display_name.trim() || undefined,
          discount_type: row.discount_type || '',
          discount_value: row.discount_value || 0,
        })),
      labour: labourRows
        .filter((row) => row.vehicle_service_item && Number(row.hours) > 0)
        .map((row) => ({
          vehicle_service_item: row.vehicle_service_item,
          hours: Number(row.hours),
          rate_per_hour: Number(row.rate_per_hour || 0),
          // Display name → Sales Order Item description.
          description: row.display_name.trim() || undefined,
          discount_type: row.discount_type || '',
          discount_value: row.discount_value || 0,
        })),
    }),
    [parts, labourRows]
  );

  const orderLabourDiscount = useMemo(
    () => buildGroupDiscountPayload(labourDiscountMode, labourDiscountInput),
    [labourDiscountMode, labourDiscountInput]
  );
  const orderPartsDiscount = useMemo(
    () => buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
    [partsDiscountMode, partsDiscountInput]
  );

  // VAT the order will carry plus the TCS its invoice will withhold — recalculated
  // (debounced) whenever a toggle, a line or a date changes.
  useEffect(() => {
    const ready =
      Boolean(customer) &&
      (orderTaxLines.parts.length > 0 || orderTaxLines.labour.length > 0) &&
      (orderTaxLines.parts.length === 0 || Boolean(warehouse));
    if (!ready || (!applyTaxes && !applyTaxWithholding)) {
      setOrderTaxPreview(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      setOrderTaxPreviewLoading(true);
      ordersSvc
        .getOrderTaxPreview({
          customer,
          company: defaults?.company,
          warehouse: warehouse || undefined,
          currency,
          transaction_date: transactionDate,
          delivery_date: deliveryDate,
          apply_taxes: applyTaxes,
          apply_tax_withholding: applyTaxWithholding,
          parts: orderTaxLines.parts,
          labour: orderTaxLines.labour,
          labour_discount: orderLabourDiscount || null,
          parts_discount: orderPartsDiscount || null,
        })
        .then((data) => {
          if (!cancelled) setOrderTaxPreview(data);
        })
        .catch(() => {
          if (!cancelled) setOrderTaxPreview(null);
        })
        .finally(() => {
          if (!cancelled) setOrderTaxPreviewLoading(false);
        });
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [
    customer,
    warehouse,
    transactionDate,
    deliveryDate,
    currency,
    applyTaxes,
    applyTaxWithholding,
    defaults?.company,
    orderTaxLines,
    orderLabourDiscount,
    orderPartsDiscount,
  ]);

  useEffect(() => {
    if (editName || !defaults) return;
    setWarehouse((prev) => prev || defaults.default_warehouse || '');
    if (defaults.default_customer) {
      setCustomer((prev) => prev || defaults.default_customer || '');
      setCustomerLabel(defaults.default_customer_name || defaults.default_customer);
    }
  }, [defaults, editName]);

  useEffect(() => {
    if (!existing) return;
    setCustomer(existing.customer || '');
    setCustomerLabel(existing.customer_name || existing.customer || '');
    setWarehouse(existing.warehouse || '');
    setTransactionDate(existing.transaction_date || today());
    setDeliveryDate(existing.delivery_date || defaultValidTo(existing.transaction_date || today()));
    setRemarks(existing.remarks || '');
    if (existing.branch) setBranch(existing.branch);
    setApplyTaxes(
      Boolean(existing.apply_taxes) || Number(existing.total_taxes_and_charges) > 0
    );
    // Withholding is stored on the order and applied when it is invoiced.
    setApplyTaxWithholding(Boolean(existing.apply_tax_withholding));
    setVehicleVin(existing.vehicle_vin || '');
    if (existing.vehicle_vin) {
      setSelectedVin({
        name: existing.vehicle_vin,
        vin_number: existing.vin_number || existing.vehicle_vin,
      });
    } else {
      setSelectedVin(null);
    }
    setParts(
      (existing.parts || []).length
        ? (existing.parts || []).map((row) => ({
            id: crypto.randomUUID(),
            spare_part: row.spare_part || row.item_code || '',
            item_name: row.item_name || '',
            display_name: row.description || '',
            qty: String(row.qty ?? 1),
            unit_price: String(row.rate ?? ''),
            discount_type: (row.discount_type as PartRow['discount_type']) || '',
            discount_value: Number(row.discount_value) || 0,
          }))
        : [emptyLine()]
    );
    setLabourRows(
      (existing.labour || []).length
        ? (existing.labour || []).map((row) => ({
            id: crypto.randomUUID(),
            vehicle_service_item: row.vehicle_service_item || '',
            vehicle_service_item_name: row.vehicle_service_item_name || '',
            display_name: row.description || '',
            hours: String(row.hours ?? 1),
            rate_per_hour: String(row.rate_per_hour ?? ''),
            discount_type: (row.discount_type as LabourRow['discount_type']) || '',
            discount_value: Number(row.discount_value) || 0,
          }))
        : [emptyLabour()]
    );
  }, [existing]);

  const applyServiceItemToLabourRow = async (rowId: string, itemName: string) => {
    if (!itemName) {
      setLabourRows((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? {
                ...row,
                vehicle_service_item: '',
                vehicle_service_item_name: '',
                display_name: '',
                hours: '1',
                rate_per_hour: '',
                discount_type: '',
                discount_value: 0,
              }
            : row
        )
      );
      return;
    }

    const item = serviceItems?.find((row) => row.name === itemName);
    let rate = Number(item?.custom_rate) || 0;
    let estHours = vehicleServiceItemEstimatedHours(item);
    let serviceLabel = formatVehicleServiceItemLabel(item) || itemName;

    try {
      const lineDefaults = await fetchVehicleServiceItemLineDefaults(itemName);
      if (lineDefaults.estimated_hours > 0) estHours = lineDefaults.estimated_hours;
      if (lineDefaults.rate_per_hour > 0) rate = lineDefaults.rate_per_hour;
      if (lineDefaults.service_name || lineDefaults.service_code) {
        serviceLabel = lineDefaults.service_code
          ? `${lineDefaults.service_code}: ${lineDefaults.service_name || itemName}`
          : lineDefaults.service_name || serviceLabel;
      }
    } catch {
      if (!rate) {
        try {
          rate = await fetchLabourRate(itemName);
        } catch {
          /* keep the row's own rate */
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
              // Display name → Sales Order Item description; editable on the line.
              display_name: serviceLabel,
              hours: String(estHours || 1),
              rate_per_hour: rate ? String(rate) : row.rate_per_hour,
              discount_type: '',
              discount_value: 0,
            }
          : row
      )
    );
  };

  const applySparePartToLine = async (rowId: string, value: string, itemName?: string) => {
    if (!value) {
      setParts((prev) =>
        prev.map((row) =>
          row.id === rowId
            ? { ...row, spare_part: '', item_name: '', display_name: '', unit_price: '', discount_type: '', discount_value: 0 }
            : row
        )
      );
      return;
    }

    const part = (partResults || []).find((row) => row.name === value);
    const unitPrice = Number(part?.unit_price) || 0;
    const label = itemName || part?.item_name || '';
    setParts((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              spare_part: value,
              item_name: label,
              display_name: row.display_name || label,
              unit_price: unitPrice ? String(unitPrice) : row.unit_price,
            }
          : row
      )
    );
  };

  const saveOrder = async (mode: 'draft' | 'create') => {
    const asDraft = mode === 'draft';

    const payloadParts = orderTaxLines.parts;
    const payloadLabour = orderTaxLines.labour;

    if (!payloadParts.length && !payloadLabour.length) {
      toast.error(
        asDraft
          ? 'Add at least one labour or item line before saving a draft'
          : 'Add at least one labour or item line'
      );
      return;
    }
    if (payloadParts.length && !warehouse) {
      toast.error('Select a warehouse for spare parts');
      return;
    }
    if (!asDraft && !branch) {
      toast.error('Select a branch');
      return;
    }

    const payload = {
      name: editName || undefined,
      customer: customer || undefined,
      company: defaults?.company,
      branch: branch || undefined,
      warehouse: warehouse || undefined,
      transaction_date: transactionDate,
      delivery_date: deliveryDate,
      remarks: remarks || undefined,
      // Include VAT — DMS Settings Default Taxes and Charges Template.
      apply_taxes: applyTaxes,
      // Withholding (TCS) is stored on the order and applied to its invoice.
      apply_tax_withholding: applyTaxWithholding,
      vehicle_vin: vehicleVin || '',
      submit: asDraft ? 0 : 1,
      parts: payloadParts,
      labour: payloadLabour,
      labour_discount: orderLabourDiscount,
      parts_discount: orderPartsDiscount,
    };

    setSubmitting(true);
    try {
      const result = editName
        ? await ordersSvc.updateDmsOrder(payload)
        : await ordersSvc.createDmsOrder(payload);
      toast.success(
        asDraft
          ? `Order ${result.name} saved as draft`
          : `Order ${result.name} submitted — ${formatMoney(result.grand_total, currency)}`
      );
      navigate('orders', { name: result.name });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to save the order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveOrder('create');
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('orders')}
          aria-label="Back to orders"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">
            {editName ? `Edit Order ${editName}` : 'New Order'}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Order labour and parts that are not in stock — take a payment now, invoice later
          </p>
        </div>
      </div>

      <form
        id="new-order-form"
        onSubmit={handleSubmit}
        className="dms-form-page min-w-0 space-y-4 sm:space-y-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>
                Customer <span className="text-destructive">*</span>
              </Label>
              <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                <SearchableSelect
                  options={customerOptions}
                  value={customer}
                  valueLabel={customerLabel}
                  onValueChange={(id) => {
                    setCustomer(id);
                    setCustomerLabel(
                      customerOptions.find((option) => option.value === id)?.label || ''
                    );
                  }}
                  onSearchChange={setCustomerSearch}
                  placeholder="Search customers..."
                  isLoading={customersLoading}
                  portaled
                />
              </LinkWithCreate>
            </div>
            <div className="space-y-2">
              <Label>
                Branch <span className="text-destructive">*</span>
              </Label>
              <BranchSelect
                value={branch}
                onValueChange={setBranch}
                company={defaults?.company}
                options={branchOptions.map((b) => ({
                  value: b.name,
                  label: b.branch || b.name,
                }))}
                onSearchChange={setBranchSearch}
                placeholder={branchesLoading ? 'Loading…' : 'Select branch…'}
                emptyMessage="No branches for this company"
                isLoading={branchesLoading}
                portaled
              />
              <p className="text-xs text-muted-foreground">
                Carried onto the inspection, job card and the invoice raised from this order.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={warehouse || undefined} onValueChange={setWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse…" />
                </SelectTrigger>
                <SelectContent>
                  {warehouseOptions.map((option) => (
                    <SelectItem key={option.name} value={option.name}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Vehicle (VIN)</Label>
              <SearchableSelect
                options={vinSelectOptions}
                value={vehicleVin}
                onValueChange={(val) => void handleVinSelect(val)}
                onSearchChange={setVinSearch}
                placeholder="Search VIN, chassis, or plate (min 3 chars)…"
                isLoading={vinsLoading}
                portaled
              />
              <p className="text-xs text-muted-foreground">
                Optional — saved on the order and carried into inspection and the job card.
                Selecting a VIN fills the registered owner when the vehicle has one.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Order date</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => {
                  const next = e.target.value;
                  setTransactionDate(next);
                  if (!editName) setDeliveryDate(defaultValidTo(next || today()));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Valid To</Label>
              <Input
                type="date"
                value={deliveryDate}
                min={transactionDate || undefined}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                id="order-in-stock-only"
                checked={inStockOnly}
                onCheckedChange={(value) => setInStockOnly(Boolean(value))}
              />
              <Label htmlFor="order-in-stock-only" className="cursor-pointer text-sm font-normal">
                Show only parts in stock at the selected warehouse
              </Label>
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="order-apply-taxes"
                  checked={applyTaxes}
                  onCheckedChange={(value) => setApplyTaxes(Boolean(value))}
                />
                <Label htmlFor="order-apply-taxes" className="cursor-pointer font-normal">
                  Include VAT
                </Label>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Uses the Default Taxes and Charges Template from DMS Settings. Leave unchecked to
                place the order without VAT.
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="order-apply-tax-withholding"
                  checked={applyTaxWithholding}
                  onCheckedChange={(value) => setApplyTaxWithholding(Boolean(value))}
                />
                <Label
                  htmlFor="order-apply-tax-withholding"
                  className="cursor-pointer font-normal"
                >
                  Include tax withholding (TCS)
                </Label>
              </div>
              <p className="pl-6 text-xs text-muted-foreground">
                Stored on the order and applied when its invoice is raised — ERPNext withholds tax
                only on sales invoices. Uses the Default Tax Withholding Category from DMS Settings.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order lines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label>Labour</Label>
              {labourRows.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3"
                >
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-xs">Service item *</Label>
                    <SearchableSelect
                      options={serviceItemOptions}
                      value={line.vehicle_service_item}
                      valueLabel={line.vehicle_service_item_name || undefined}
                      onValueChange={(value) => void applyServiceItemToLabourRow(line.id, value)}
                      onSearchChange={setServiceItemSearch}
                      placeholder="Search service item"
                      isLoading={serviceItemsLoading}
                      portaled
                      onCreateNew={() => {
                        setCreateLabourIdx(labourRows.indexOf(line));
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
                      step="any"
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
                    <div className="flex items-center gap-1">
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
                      <LineDiscountButton
                        label={
                          line.display_name ||
                          line.vehicle_service_item_name ||
                          'this service line'
                        }
                        lineAmount={(Number(line.hours) || 0) * (Number(line.rate_per_hour) || 0)}
                        discountType={line.discount_type}
                        discountValue={line.discount_value}
                        disabled={!line.vehicle_service_item}
                        onApply={(discount) =>
                          setLabourRows((prev) =>
                            prev.map((row) =>
                              row.id === line.id
                                ? {
                                    ...row,
                                    discount_type: discount.discount_type,
                                    discount_value: discount.discount_value,
                                  }
                                : row
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      readOnly
                      value={rowLineNet(
                        line.hours,
                        line.rate_per_hour,
                        line.discount_type,
                        line.discount_value
                      ).toFixed(2)}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={labourRows.length <= 1}
                      onClick={() => setLabourRows((prev) => prev.filter((row) => row.id !== line.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="md:col-span-12 space-y-2">
                    <Label className="text-xs">Display name</Label>
                    <Input
                      value={line.display_name}
                      placeholder="Name shown on the sales order line (goes to the description)"
                      disabled={!line.vehicle_service_item}
                      onChange={(e) =>
                        setLabourRows((prev) =>
                          prev.map((row) =>
                            row.id === line.id ? { ...row, display_name: e.target.value } : row
                          )
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              <AddLineButton
                onClick={() => setLabourRows((prev) => [...prev, emptyLabour()])}
                label="Add line"
              />
            </div>

            <GroupDiscountFields
              label="Labour"
              mode={labourDiscountMode}
              onModeChange={(mode) => {
                setLabourDiscountMode(mode);
                if (mode === 'none') setLabourDiscountInput('');
              }}
              value={labourDiscountInput}
              onValueChange={setLabourDiscountInput}
              subtotal={labourTotal}
            />

            <div className="space-y-3">
              <Label>Items</Label>
              {parts.map((line) => (
                <div
                  key={line.id}
                  className="grid gap-3 md:grid-cols-12 items-end border rounded-lg p-3"
                >
                  <div className="md:col-span-5 space-y-2">
                    <Label className="text-xs">Spare part *</Label>
                    <SearchableSelect
                      options={partOptions}
                      value={line.spare_part}
                      valueLabel={line.item_name || undefined}
                      onValueChange={(value) => void applySparePartToLine(line.id, value)}
                      onSearchChange={setPartSearch}
                      placeholder="Search spare part"
                      isLoading={partsLoading}
                      portaled
                      onCreateNew={() => {
                        setCreatePartIdx(parts.indexOf(line));
                        setShowCreateSparePartDialog(true);
                      }}
                      createNewLabel="New Spare Part"
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
                        setParts((prev) =>
                          prev.map((row) => (row.id === line.id ? { ...row, qty: e.target.value } : row))
                        )
                      }
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs">Unit price</Label>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min="0"
                        step="any"
                        value={line.unit_price}
                        onChange={(e) =>
                          setParts((prev) =>
                            prev.map((row) =>
                              row.id === line.id ? { ...row, unit_price: e.target.value } : row
                            )
                          )
                        }
                      />
                      <LineDiscountButton
                        label={line.display_name || line.item_name || 'this part'}
                        lineAmount={(Number(line.qty) || 0) * (Number(line.unit_price) || 0)}
                        discountType={line.discount_type}
                        discountValue={line.discount_value}
                        disabled={!line.spare_part}
                        onApply={(discount) =>
                          setParts((prev) =>
                            prev.map((row) =>
                              row.id === line.id
                                ? {
                                    ...row,
                                    discount_type: discount.discount_type,
                                    discount_value: discount.discount_value,
                                  }
                                : row
                            )
                          )
                        }
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <Label className="text-xs">Amount</Label>
                    <Input
                      readOnly
                      value={rowLineNet(
                        line.qty,
                        line.unit_price,
                        line.discount_type,
                        line.discount_value
                      ).toFixed(2)}
                    />
                  </div>
                  <div className="md:col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={parts.length <= 1}
                      onClick={() => setParts((prev) => prev.filter((row) => row.id !== line.id))}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="md:col-span-12 space-y-2">
                    <Label className="text-xs">Display name</Label>
                    <Input
                      value={line.display_name}
                      placeholder="Name shown on the sales order line (goes to the description)"
                      disabled={!line.spare_part}
                      onChange={(e) =>
                        setParts((prev) =>
                          prev.map((row) =>
                            row.id === line.id ? { ...row, display_name: e.target.value } : row
                          )
                        )
                      }
                    />
                  </div>
                </div>
              ))}
              <AddLineButton onClick={() => setParts((prev) => [...prev, emptyLine()])} label="Add line" />
            </div>

            <GroupDiscountFields
              label="Parts"
              mode={partsDiscountMode}
              onModeChange={(mode) => {
                setPartsDiscountMode(mode);
                if (mode === 'none') setPartsDiscountInput('');
              }}
              value={partsDiscountInput}
              onValueChange={setPartsDiscountInput}
              subtotal={partsTotal}
            />

            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes for this order"
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>
                {labourRows.filter((row) => row.vehicle_service_item).length} labour line(s) ·{' '}
                {parts.filter((row) => row.spare_part).length} item line(s) — stock is not required to
                place the order
              </span>
            </div>

            <div className="space-y-2 rounded-lg border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour subtotal</span>
                <span className="tabular-nums">{formatMoney(labourGross, currency)}</span>
              </div>
              {labourLineDiscountTotal > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Labour line discount</span>
                  <span className="tabular-nums">
                    -{formatMoney(labourLineDiscountTotal, currency)}
                  </span>
                </div>
              ) : null}
              {labourDiscountTotal > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Labour discount</span>
                  <span className="tabular-nums">-{formatMoney(labourDiscountTotal, currency)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items subtotal</span>
                <span className="tabular-nums">{formatMoney(partsGross, currency)}</span>
              </div>
              {partsLineDiscountTotal > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Items line discount</span>
                  <span className="tabular-nums">
                    -{formatMoney(partsLineDiscountTotal, currency)}
                  </span>
                </div>
              ) : null}
              {partsDiscountTotal > 0 ? (
                <div className="flex justify-between text-muted-foreground">
                  <span>Items discount</span>
                  <span className="tabular-nums">-{formatMoney(partsDiscountTotal, currency)}</span>
                </div>
              ) : null}
              {applyTaxes || applyTaxWithholding ? (
                <InvoiceTaxBreakdown
                  subtotal={grandTotal}
                  currency={currency}
                  applyTaxes={applyTaxes}
                  applyTaxWithholding={applyTaxWithholding}
                  preview={orderTaxPreview}
                  isLoading={orderTaxPreviewLoading}
                  // Withholding never lands on the order, so the final row shows the
                  // order's own grand total (the invoice deducts TCS from it later).
                  totalOverride={orderTaxPreview ? orderTaxPreview.order_grand_total : null}
                  totalLabel={applyTaxes ? 'Order total (incl. VAT)' : 'Order total'}
                />
              ) : (
                <div className="flex justify-between border-t pt-2 text-base font-medium">
                  <span>Order total</span>
                  <span className="tabular-nums">{formatMoney(grandTotal, currency)}</span>
                </div>
              )}
              {applyTaxes ? (
                <p className="text-xs text-muted-foreground">
                  VAT is applied from the DMS Settings Default Taxes and Charges Template and added
                  to the grand total when the order is saved.
                </p>
              ) : null}
              {applyTaxWithholding ? (
                <p className="text-xs text-muted-foreground">
                  TCS is withheld on the invoice, not on the order — the order total above is not
                  reduced by it. The invoice will be raised for{' '}
                  {formatMoney(orderTaxPreview ? orderTaxPreview.grand_total : grandTotal, currency)}
                  {', of which '}
                  {formatMoney(
                    orderTaxPreview ? Math.abs(orderTaxPreview.withholding_amount || 0) : 0,
                    currency
                  )}
                  {' is paid to the tax authority by the customer instead.'}
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </form>

      <FormActionsBar>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          onClick={() => navigate('orders')}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full sm:w-auto"
          disabled={submitting}
          onClick={() => void saveOrder('draft')}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save as Draft
            </>
          )}
        </Button>
        <Button
          type="submit"
          form="new-order-form"
          disabled={submitting}
          className="min-h-11 w-full sm:w-auto"
        >
          {submitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Receipt className="mr-2 h-4 w-4" />
          )}
          Submit order
        </Button>
      </FormActionsBar>

      {/* Create dialogs — same + flow as invoices and job cards */}
      <CreateServiceItemDialog
        open={showCreateServiceItemDialog}
        onOpenChange={setShowCreateServiceItemDialog}
        onCreated={(serviceItemName) => {
          const rowId = labourRows[createLabourIdx]?.id;
          if (rowId) void applyServiceItemToLabourRow(rowId, serviceItemName);
          setServiceItemSearch(serviceItemName);
          toast.success('Service item created and selected.');
        }}
      />
      <CreateSparePartDialog
        open={showCreateSparePartDialog}
        onOpenChange={setShowCreateSparePartDialog}
        onCreated={(itemCode, itemName, sparePart) => {
          const rowId = parts[createPartIdx]?.id;
          if (rowId) {
            // Auto-created Spare Parts are named after the Item code; the order
            // builder resolves either value, so prefer the Spare Part when known.
            void applySparePartToLine(rowId, sparePart || itemCode, itemName);
          }
          setPartSearch(itemCode);
          void mutate(
            (key) => Array.isArray(key) && key[0] === 'order-parts',
            undefined,
            { revalidate: true }
          );
          toast.success(`Spare part ${itemName} created and selected.`);
        }}
      />
    </div>
  );
}
