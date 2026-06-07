"use client";

import { useEffect, useMemo, useState } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import {
  useCompanies,
  useAutofillSingleCompany,
  useCustomers,
  useJobCard,
  useSpareParts,
  useVehicleServiceItems,
  useWarehouses,
  useCurrencies,
} from "@/hooks/use-dms";
import { SearchableSelect } from "@/components/searchable-select";
import { LinkWithCreate } from "@/components/link-with-create";
import { FormActionsBar } from "@/components/layout/form-actions-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, FileText, Plus, Receipt, Trash2, User, Wrench } from "lucide-react";
import { toast } from "sonner";
import { fetchLabourRate, fetchSparePartPrice } from "@/services/common";
import * as invoicesSvc from "@/services/invoices";
import { GroupDiscountFields } from "@/components/group-discount-fields";
import {
  buildGroupDiscountPayload,
  groupDiscountAmount,
  parseDiscountValue,
  type InvoiceDiscountMode,
} from "@/lib/invoice-discount";

interface LabourRow {
  vehicle_service_item: string;
  vehicle_service_item_name: string;
  estimated_hours: number;
  rate_per_hour: number;
}

interface PartRow {
  item_code: string;
  item_name: string;
  quantity: number;
  unit_price: number;
}

function defaultDueDate() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().split("T")[0];
}

export default function NewInvoicePage() {
  const { navigate, viewParams } = useNavigation();
  const jobCardId = viewParams.get("jobcard");

  const { data: jobCard } = useJobCard(jobCardId || "");
  const [isMutating, setIsMutating] = useState(false);

  const [customerSearch, setCustomerSearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [warehouseSearch, setWarehouseSearch] = useState("");
  const [serviceItemSearch, setServiceItemSearch] = useState("");
  const [sparePartSearch, setSparePartSearch] = useState("");

  const { data: customers, isLoading: customersLoading } = useCustomers(customerSearch);
  const { data: companies, isLoading: companiesLoading } = useCompanies(companySearch);
  const [company, setCompany] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const { data: warehouses, isLoading: warehousesLoading } = useWarehouses(
    warehouseSearch,
    company || undefined
  );
  const { data: serviceItems, isLoading: serviceItemsLoading } =
    useVehicleServiceItems(serviceItemSearch);
  const { data: spareParts, isLoading: sparePartsLoading } = useSpareParts(sparePartSearch);
  const { data: currencies } = useCurrencies();

  const [customer, setCustomer] = useState("");
  const [customerMeta, setCustomerMeta] = useState<{
    name: string;
    customer_name: string;
    mobile_no?: string;
  } | null>(null);
  const [currency, setCurrency] = useState("ETB");
  const [postingDate, setPostingDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(defaultDueDate());
  const [remarks, setRemarks] = useState("");
  const [submitInvoice, setSubmitInvoice] = useState(true);

  const [labourRows, setLabourRows] = useState<LabourRow[]>([]);
  const [partRows, setPartRows] = useState<PartRow[]>([]);
  const [labourDiscountMode, setLabourDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [labourDiscountInput, setLabourDiscountInput] = useState("");
  const [partsDiscountMode, setPartsDiscountMode] = useState<InvoiceDiscountMode>("none");
  const [partsDiscountInput, setPartsDiscountInput] = useState("");
  const [newLabour, setNewLabour] = useState<LabourRow>({
    vehicle_service_item: "",
    vehicle_service_item_name: "",
    estimated_hours: 0,
    rate_per_hour: 0,
  });
  const [newPart, setNewPart] = useState<PartRow>({
    item_code: "",
    item_name: "",
    quantity: 1,
    unit_price: 0,
  });

  useAutofillSingleCompany(
    companies,
    companiesLoading,
    company,
    (c) => setCompany(c.name),
    { search: companySearch, enabled: !jobCardId }
  );

  useEffect(() => {
    if (!jobCard) return;
    if (jobCard.customer) {
      setCustomer(jobCard.customer);
      setCustomerMeta({
        name: jobCard.customer,
        customer_name: jobCard.customer_name || jobCard.customer,
      });
    }
    if (jobCard.company) setCompany(jobCard.company);
    const labour: LabourRow[] = (jobCard.service_lines || []).map((sl) => ({
      vehicle_service_item: sl.vehicle_service_item || "",
      vehicle_service_item_name: sl.service_name || sl.vehicle_service_item || "",
      estimated_hours: sl.actual_hours || sl.estimated_hours || 1,
      rate_per_hour: sl.labour_rate || 0,
    }));
    const parts: PartRow[] = (jobCard.part_lines || []).map((pl) => ({
      item_code: pl.part_number || pl.item_code || "",
      item_name: pl.part_name || "",
      quantity: pl.quantity || 1,
      unit_price: pl.unit_price || 0,
    }));
    setLabourRows(labour);
    setPartRows(parts);
  }, [jobCard]);

  const customerSelectOptions = useMemo(() => {
    const mapped =
      customers?.map((c) => ({
        value: c.name,
        label: c.customer_name,
        description: c.mobile_no || undefined,
      })) || [];
    if (customer && customerMeta && !mapped.some((o) => o.value === customer)) {
      return [
        {
          value: customerMeta.name,
          label: customerMeta.customer_name,
          description: customerMeta.mobile_no,
        },
        ...mapped,
      ];
    }
    return mapped;
  }, [customers, customer, customerMeta]);

  const labourTotal = labourRows.reduce(
    (sum, r) => sum + r.estimated_hours * r.rate_per_hour,
    0
  );
  const partsTotal = partRows.reduce((sum, r) => sum + r.quantity * r.unit_price, 0);
  const labourDiscountValue = parseDiscountValue(labourDiscountMode, labourDiscountInput);
  const partsDiscountValue = parseDiscountValue(partsDiscountMode, partsDiscountInput);
  const labourDiscountTotal = groupDiscountAmount(
    labourTotal,
    labourDiscountMode,
    labourDiscountValue
  );
  const partsDiscountTotal = groupDiscountAmount(
    partsTotal,
    partsDiscountMode,
    partsDiscountValue
  );
  const labourNet = labourTotal - labourDiscountTotal;
  const partsNet = partsTotal - partsDiscountTotal;
  const subtotal = labourNet + partsNet;
  const isStandalone = !jobCardId;

  const handleCustomerChange = (id: string) => {
    setCustomer(id);
    if (!id) {
      setCustomerMeta(null);
      return;
    }
    const match = customers?.find((c) => c.name === id);
    if (match) {
      setCustomerMeta({
        name: match.name,
        customer_name: match.customer_name,
        mobile_no: match.mobile_no,
      });
    }
  };

  const handleCustomerCreated = (name: string, label?: string) => {
    setCustomer(name);
    setCustomerMeta({ name, customer_name: label || name });
  };

  const handleServiceItemSelect = async (itemName: string) => {
    const item = serviceItems?.find((i) => i.name === itemName);
    let rate = item?.custom_rate || 0;
    if (!rate && itemName) {
      try {
        rate = await fetchLabourRate(itemName);
      } catch {
        /* ignore */
      }
    }
    const estMinutes = parseFloat(item?.custom_estimated_timemin || "0") || 0;
    const estHours = estMinutes > 0 ? Math.round((estMinutes / 60) * 10) / 10 : 0;
    setNewLabour({
      vehicle_service_item: itemName,
      vehicle_service_item_name: item?.service_item || item?.custom_item_name || itemName,
      estimated_hours: estHours || newLabour.estimated_hours,
      rate_per_hour: rate || newLabour.rate_per_hour,
    });
  };

  const handleSparePartSelect = async (partName: string) => {
    if (!partName) {
      setNewPart({ item_code: "", item_name: "", quantity: 1, unit_price: 0 });
      return;
    }
    const part = spareParts?.find((p) => p.name === partName);
    let unitPrice = 0;
    try {
      unitPrice = await fetchSparePartPrice(partName);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load part price");
    }
    setNewPart({
      item_code: partName,
      item_name: part?.item_name || partName,
      quantity: 1,
      unit_price: unitPrice,
    });
  };

  const addLabourRow = () => {
    if (!newLabour.vehicle_service_item) {
      toast.error("Select a service item");
      return;
    }
    if (newLabour.estimated_hours <= 0) {
      toast.error("Enter hours");
      return;
    }
    setLabourRows((prev) => [...prev, { ...newLabour }]);
    setNewLabour({
      vehicle_service_item: "",
      vehicle_service_item_name: "",
      estimated_hours: 0,
      rate_per_hour: 0,
    });
  };

  const addPartRow = () => {
    if (!newPart.item_code) {
      toast.error("Select a spare part");
      return;
    }
    if (newPart.quantity <= 0) {
      toast.error("Enter quantity");
      return;
    }
    setPartRows((prev) => [...prev, { ...newPart }]);
    setNewPart({ item_code: "", item_name: "", quantity: 1, unit_price: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jobCardId) {
      setIsMutating(true);
      try {
        await invoicesSvc.createInvoiceFromJobCard(jobCardId, {
          dueDate,
          submit: submitInvoice,
        });
        toast.success("Invoice created successfully");
        navigate("invoices");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create invoice");
      } finally {
        setIsMutating(false);
      }
      return;
    }

    if (!customer) {
      toast.error("Select a customer");
      return;
    }
    if (!company) {
      toast.error("Select a company");
      return;
    }
    if (labourRows.length === 0 && partRows.length === 0) {
      toast.error("Add at least one labour or parts line");
      return;
    }
    if (partRows.length > 0 && !warehouse) {
      toast.error("Select a warehouse for spare parts");
      return;
    }

    if (
      labourDiscountMode === "amount" &&
      labourDiscountValue > labourTotal &&
      labourTotal > 0
    ) {
      toast.error("Labour discount cannot exceed labour total");
      return;
    }
    if (
      partsDiscountMode === "amount" &&
      partsDiscountValue > partsTotal &&
      partsTotal > 0
    ) {
      toast.error("Parts discount cannot exceed parts total");
      return;
    }
    if (labourDiscountMode === "percentage" && labourDiscountValue > 100) {
      toast.error("Labour discount percentage cannot exceed 100%");
      return;
    }
    if (partsDiscountMode === "percentage" && partsDiscountValue > 100) {
      toast.error("Parts discount percentage cannot exceed 100%");
      return;
    }

    setIsMutating(true);
    try {
      await invoicesSvc.createStandaloneInvoice({
        customer,
        company,
        warehouse: warehouse || undefined,
        currency,
        posting_date: postingDate,
        due_date: dueDate,
        remarks: remarks || undefined,
        submit: submitInvoice,
        labour_discount: buildGroupDiscountPayload(labourDiscountMode, labourDiscountInput),
        parts_discount: buildGroupDiscountPayload(partsDiscountMode, partsDiscountInput),
        labour: labourRows.map((r) => ({
          vehicle_service_item: r.vehicle_service_item,
          hours: r.estimated_hours,
          rate_per_hour: r.rate_per_hour,
        })),
        parts: partRows.map((r) => ({
          spare_part: r.item_code,
          qty: r.quantity,
          unit_price: r.unit_price,
        })),
      });
      toast.success("Invoice created successfully");
      navigate("invoices");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create invoice");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("invoices")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Invoice</h1>
          <p className="mt-1 text-muted-foreground">
            {jobCardId ? "Create invoice from job card" : "Standalone aftersales invoice"}
          </p>
        </div>
      </div>

      <form
        id="new-invoice-form"
        onSubmit={handleSubmit}
        className="dms-form-page min-w-0 space-y-4 sm:space-y-6"
      >
        {jobCard && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="flex items-center gap-2 p-4 text-primary">
              <FileText className="h-5 w-5" />
              <span className="font-medium">Job Card: {jobCard.name}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Customer *</Label>
                <LinkWithCreate doctype="Customer" onCreated={handleCustomerCreated}>
                  <SearchableSelect
                    options={customerSelectOptions}
                    value={customer}
                    valueLabel={customerMeta?.customer_name}
                    onValueChange={handleCustomerChange}
                    onSearchChange={setCustomerSearch}
                    placeholder="Search customers..."
                    isLoading={customersLoading}
                    disabled={Boolean(jobCardId)}
                  />
                </LinkWithCreate>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                <SearchableSelect
                  options={
                    companies?.map((c) => ({
                      value: c.name,
                      label: c.company_name || c.name,
                    })) || []
                  }
                  value={company}
                  onValueChange={(val) => {
                    setCompany(val);
                    setWarehouse("");
                    setWarehouseSearch("");
                  }}
                  onSearchChange={setCompanySearch}
                  placeholder="Select company..."
                  isLoading={companiesLoading}
                  disabled={Boolean(jobCardId)}
                />
              </div>
              {!jobCardId && (
                <div className="space-y-2">
                  <Label>Currency *</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {(currencies?.length ? currencies : ["ETB"]).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!jobCardId && (
                <div className="space-y-2">
                  <Label>Warehouse{partRows.length > 0 ? " *" : ""}</Label>
                  <SearchableSelect
                    options={
                      warehouses?.map((w) => ({
                        value: w.name,
                        label: w.warehouse_name || w.name,
                      })) || []
                    }
                    value={warehouse}
                    onValueChange={setWarehouse}
                    onSearchChange={setWarehouseSearch}
                    placeholder={company ? "Search warehouses..." : "Select company first"}
                    isLoading={warehousesLoading}
                    disabled={!company}
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for spare parts on the invoice (stock items). Labour lines are not
                    warehouse-specific.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Posting date</Label>
                  <Input
                    type="date"
                    value={postingDate}
                    onChange={(e) => setPostingDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Due date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="submit_invoice"
                  checked={submitInvoice}
                  onCheckedChange={(c) => setSubmitInvoice(Boolean(c))}
                />
                <Label htmlFor="submit_invoice" className="cursor-pointer font-normal">
                  Submit invoice in ERPNext
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Labour
            </CardTitle>
            <CardDescription>Vehicle service items — rates load from item master</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {labourRows.length > 0 && (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Service item</th>
                      <th className="p-3 text-right">Hours</th>
                      <th className="p-3 text-right">Rate/hr</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="w-10 p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {labourRows.map((lr, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">
                          {lr.vehicle_service_item_name || lr.vehicle_service_item}
                        </td>
                        <td className="p-3 text-right">{lr.estimated_hours}</td>
                        <td className="p-3 text-right">{lr.rate_per_hour.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">
                          {(lr.estimated_hours * lr.rate_per_hour).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              setLabourRows((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-5 space-y-1">
                <Label className="text-xs">Service item *</Label>
                <SearchableSelect
                  options={
                    serviceItems?.map((si) => ({
                      value: si.name,
                      label: si.service_item || si.name,
                      description: si.custom_rate ? `Rate: ${si.custom_rate}` : undefined,
                    })) || []
                  }
                  value={newLabour.vehicle_service_item}
                  onValueChange={handleServiceItemSelect}
                  onSearchChange={setServiceItemSearch}
                  placeholder="Search labour items..."
                  isLoading={serviceItemsLoading}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  min={0}
                  value={newLabour.estimated_hours || ""}
                  onChange={(e) =>
                    setNewLabour((p) => ({
                      ...p,
                      estimated_hours: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Rate/hr</Label>
                <Input
                  type="number"
                  min={0}
                  value={newLabour.rate_per_hour || ""}
                  onChange={(e) =>
                    setNewLabour((p) => ({
                      ...p,
                      rate_per_hour: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={addLabourRow} className="w-full">
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
            {isStandalone && labourRows.length > 0 && (
              <GroupDiscountFields
                label="Labour"
                mode={labourDiscountMode}
                onModeChange={(m) => {
                  setLabourDiscountMode(m);
                  if (m === "none") setLabourDiscountInput("");
                }}
                value={labourDiscountInput}
                onValueChange={setLabourDiscountInput}
                subtotal={labourTotal}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parts</CardTitle>
            <CardDescription>
              Spare parts — selling price from part master
              {warehouse ? ` · Warehouse: ${warehouse}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {partRows.length > 0 && (
              <div className="overflow-hidden rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Part</th>
                      <th className="p-3 text-right">Qty</th>
                      <th className="p-3 text-right">Unit price</th>
                      <th className="p-3 text-right">Amount</th>
                      <th className="w-10 p-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {partRows.map((pr, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">{pr.item_name || pr.item_code}</td>
                        <td className="p-3 text-right">{pr.quantity}</td>
                        <td className="p-3 text-right">{pr.unit_price.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">
                          {(pr.quantity * pr.unit_price).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() =>
                              setPartRows((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="grid grid-cols-12 items-end gap-2">
              <div className="col-span-5 space-y-1">
                <Label className="text-xs">Spare part *</Label>
                <SearchableSelect
                  options={
                    spareParts?.map((p) => ({
                      value: p.name,
                      label: p.item_name || p.name,
                      description: p.item_group,
                    })) || []
                  }
                  value={newPart.item_code}
                  onValueChange={handleSparePartSelect}
                  onSearchChange={setSparePartSearch}
                  placeholder="Search parts..."
                  isLoading={sparePartsLoading}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Qty</Label>
                <Input
                  type="number"
                  min={0}
                  step="1"
                  value={newPart.quantity || ""}
                  onChange={(e) =>
                    setNewPart((p) => ({
                      ...p,
                      quantity: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-xs">Unit price</Label>
                <Input
                  type="number"
                  min={0}
                  value={newPart.unit_price || ""}
                  onChange={(e) =>
                    setNewPart((p) => ({
                      ...p,
                      unit_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={addPartRow} className="w-full">
                  <Plus className="mr-1 h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>
            {isStandalone && partRows.length > 0 && (
              <GroupDiscountFields
                label="Parts"
                mode={partsDiscountMode}
                onModeChange={(m) => {
                  setPartsDiscountMode(m);
                  if (m === "none") setPartsDiscountInput("");
                }}
                value={partsDiscountInput}
                onValueChange={setPartsDiscountInput}
                subtotal={partsTotal}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex justify-end p-6">
            <div className="w-full max-w-sm space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Labour</span>
                <span>{labourTotal.toLocaleString()}</span>
              </div>
              {isStandalone && labourDiscountTotal > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Labour discount</span>
                  <span>−{labourDiscountTotal.toLocaleString()}</span>
                </div>
              )}
              {isStandalone && labourDiscountTotal > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Labour net</span>
                  <span>{labourNet.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Parts</span>
                <span>{partsTotal.toLocaleString()}</span>
              </div>
              {isStandalone && partsDiscountTotal > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400">
                  <span>Parts discount</span>
                  <span>−{partsDiscountTotal.toLocaleString()}</span>
                </div>
              )}
              {isStandalone && partsDiscountTotal > 0 && (
                <div className="flex justify-between font-medium">
                  <span>Parts net</span>
                  <span>{partsNet.toLocaleString()}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-semibold">
                <span>Subtotal (excl. tax)</span>
                <span>{subtotal.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Tax and grand total are calculated in ERPNext on save.
                {isStandalone &&
                  (labourDiscountTotal > 0 || partsDiscountTotal > 0) &&
                  " Discounted rates are written to each invoice line; DMS Discount column is audit only."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Optional remarks on the invoice"
            />
          </CardContent>
        </Card>

        <FormActionsBar>
          <Button type="button" variant="outline" onClick={() => navigate("invoices")}>
            Cancel
          </Button>
          <Button type="submit" form="new-invoice-form" disabled={isMutating}>
            <Receipt className="mr-2 h-4 w-4" />
            {isMutating ? "Creating…" : "Create invoice"}
          </Button>
        </FormActionsBar>
      </form>
    </div>
  );
}
