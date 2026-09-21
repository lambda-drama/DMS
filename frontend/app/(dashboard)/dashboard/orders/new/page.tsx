'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, Package, Receipt, Save, Trash2 } from 'lucide-react';
import { useNavigation } from '@/contexts/navigation-context';
import { useVehicleServiceItems } from '@/hooks/use-dms';
import { SearchableSelect } from '@/components/searchable-select';
import { GroupDiscountFields } from '@/components/group-discount-fields';
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
  groupDiscountAmount,
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

type PartRow = {
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

function emptyLine(): PartRow {
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

function today() {
  return new Date().toISOString().split('T')[0];
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split('T')[0];
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
  const editName = (viewParams.get('id') || '').trim();

  const [customer, setCustomer] = useState('');
  const [customerLabel, setCustomerLabel] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [warehouse, setWarehouse] = useState('');
  const [transactionDate, setTransactionDate] = useState(today());
  const [deliveryDate, setDeliveryDate] = useState(defaultDueDate());
  const [remarks, setRemarks] = useState('');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [parts, setParts] = useState<PartRow[]>([emptyLine()]);
  const [labourRows, setLabourRows] = useState<LabourRow[]>([emptyLabour()]);
  const [serviceItemSearch, setServiceItemSearch] = useState('');
  const [partSearch, setPartSearch] = useState('');
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [labourDiscountInput, setLabourDiscountInput] = useState('');
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>('none');
  const [partsDiscountInput, setPartsDiscountInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: defaults } = useSWR('spare-part-sales-defaults', () =>
    sparePartSalesSvc.fetchSparePartSalesDefaults()
  );
  const { data: existing } = useSWR(editName ? ['dms-order', editName] : null, () =>
    ordersSvc.getDmsOrder(editName)
  );
  const { data: customers, isLoading: customersLoading } = useSWR(
    ['order-customers', customerSearch],
    () => commonSvc.fetchCustomers(customerSearch || undefined, 20)
  );
  const { data: serviceItems, isLoading: serviceItemsLoading } =
    useVehicleServiceItems(serviceItemSearch);
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

  const partsTotal = parts.reduce((sum, row) => {
    return sum + (Number(row.qty) || 0) * (Number(row.unit_price) || 0);
  }, 0);

  const labourTotal = labourRows.reduce((sum, row) => {
    return sum + (Number(row.hours) || 0) * (Number(row.rate_per_hour) || 0);
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
    setDeliveryDate(existing.delivery_date || defaultDueDate());
    setRemarks(existing.remarks || '');
    setParts(
      (existing.parts || []).length
        ? (existing.parts || []).map((row) => ({
            id: crypto.randomUUID(),
            spare_part: row.spare_part || row.item_code || '',
            item_name: row.item_name || '',
            qty: String(row.qty ?? 1),
            unit_price: String(row.rate ?? ''),
          }))
        : [emptyLine()]
    );
    setLabourRows(
      (existing.labour || []).length
        ? (existing.labour || []).map((row) => ({
            id: crypto.randomUUID(),
            vehicle_service_item: row.vehicle_service_item || '',
            vehicle_service_item_name: row.vehicle_service_item_name || '',
            hours: String(row.hours ?? 1),
            rate_per_hour: String(row.rate_per_hour ?? ''),
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
                hours: '1',
                rate_per_hour: '',
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
              hours: String(estHours || 1),
              rate_per_hour: rate ? String(rate) : row.rate_per_hour,
            }
          : row
      )
    );
  };

  const applySparePartToLine = async (rowId: string, value: string, itemName?: string) => {
    if (!value) {
      setParts((prev) =>
        prev.map((row) =>
          row.id === rowId ? { ...row, spare_part: '', item_name: '', unit_price: '' } : row
        )
      );
      return;
    }

    const part = (partResults || []).find((row) => row.name === value);
    const unitPrice = Number(part?.unit_price) || 0;
    setParts((prev) =>
      prev.map((row) =>
        row.id === rowId
          ? {
              ...row,
              spare_part: value,
              item_name: itemName || part?.item_name || '',
              unit_price: unitPrice ? String(unitPrice) : row.unit_price,
            }
          : row
      )
    );
  };

  const saveOrder = async (mode: 'draft' | 'create') => {
    const asDraft = mode === 'draft';

    const payloadParts = parts
      .filter((row) => row.spare_part && Number(row.qty) > 0)
      .map((row) => ({
        spare_part: row.spare_part,
        qty: Number(row.qty),
        unit_price: Number(row.unit_price || 0),
      }));

    const payloadLabour = labourRows
      .filter((row) => row.vehicle_service_item && Number(row.hours) > 0)
      .map((row) => ({
        vehicle_service_item: row.vehicle_service_item,
        hours: Number(row.hours),
        rate_per_hour: Number(row.rate_per_hour || 0),
      }));

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

    const payload = {
      name: editName || undefined,
      customer: customer || undefined,
      company: defaults?.company,
      warehouse: warehouse || undefined,
      transaction_date: transactionDate,
      delivery_date: deliveryDate,
      remarks: remarks || undefined,
      submit: asDraft ? 0 : 1,
      parts: payloadParts,
      labour: payloadLabour,
      labour_discount: buildGroupDiscountPayload(labourDiscountMode, labourDiscountInput),
      parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
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

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('orders')}
            aria-label="Back to orders"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="dms-stat-value text-xl tracking-tight">
              {editName ? `Edit Order ${editName}` : 'New Order'}
            </h1>
            <p className="text-muted-foreground">
              Order labour and parts that are not in stock — take a payment now, invoice later
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={submitting}
            onClick={() => void saveOrder('draft')}
          >
            <Save className="mr-2 h-4 w-4" />
            Save draft
          </Button>
          <Button type="button" disabled={submitting} onClick={() => void saveOrder('create')}>
            {submitting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Receipt className="mr-2 h-4 w-4" />
            )}
            Submit order
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Order details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>
              Customer <span className="text-destructive">*</span>
            </Label>
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
          <div className="space-y-2">
            <Label>Order date</Label>
            <Input
              type="date"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Expected delivery</Label>
            <Input
              type="date"
              value={deliveryDate}
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
                    onClick={() => setLabourRows((prev) => prev.filter((row) => row.id !== line.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs">Amount</Label>
                  <Input
                    readOnly
                    value={((Number(line.qty) || 0) * (Number(line.unit_price) || 0)).toFixed(2)}
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
              <span className="tabular-nums">{formatMoney(labourTotal, currency)}</span>
            </div>
            {labourDiscountTotal > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Labour discount</span>
                <span className="tabular-nums">-{formatMoney(labourDiscountTotal, currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Items subtotal</span>
              <span className="tabular-nums">{formatMoney(partsTotal, currency)}</span>
            </div>
            {partsDiscountTotal > 0 ? (
              <div className="flex justify-between text-muted-foreground">
                <span>Items discount</span>
                <span className="tabular-nums">-{formatMoney(partsDiscountTotal, currency)}</span>
              </div>
            ) : null}
            <div className="flex justify-between border-t pt-2 text-base font-medium">
              <span>Order total</span>
              <span className="tabular-nums">{formatMoney(grandTotal, currency)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
