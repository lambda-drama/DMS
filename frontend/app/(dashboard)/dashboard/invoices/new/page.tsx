"use client";

import { useState, useEffect } from "react";
import { useNavigation } from "@/contexts/navigation-context";
import { useJobCard } from "@/hooks/use-dms";
import * as jobCardsSvc from "@/services/jobCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Receipt, Car, User, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Invoice, InvoiceLine } from "@/types/dms";

const paymentTerms = [
  "Due on Receipt",
  "Net 7",
  "Net 14",
  "Net 30",
  "Net 60",
];

export default function NewInvoicePage() {
  const { navigate, viewParams } = useNavigation();
  const jobCardId = viewParams.get("jobcard");
  
  const { data: jobCard } = useJobCard(jobCardId || "");
  const [isMutating, setIsMutating] = useState(false);

  const [formData, setFormData] = useState<Partial<Invoice>>({
    job_card: "",
    vehicle_registration: "",
    customer_name: "",
    customer_address: "",
    contact_number: "",
    email: "",
    invoice_date: new Date().toISOString().split("T")[0],
    due_date: "",
    payment_terms: "Due on Receipt",
    lines: [],
    labour_total: 0,
    parts_total: 0,
    subtotal: 0,
    tax_rate: 16,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0,
    notes: "",
  });

  const [newLine, setNewLine] = useState<Partial<InvoiceLine>>({
    description: "",
    line_type: "Labour",
    quantity: 1,
    unit_price: 0,
    amount: 0,
  });

  // Prefill from job card
  useEffect(() => {
    if (jobCard) {
      const labourLines: InvoiceLine[] = (jobCard.service_lines || []).map((sl, idx) => ({
        idx: idx + 1,
        description: sl.service_description,
        line_type: "Labour" as const,
        quantity: sl.actual_hours || sl.estimated_hours || 1,
        unit_price: sl.labour_rate || 0,
        amount: sl.actual_amount || sl.estimated_amount || 0,
      }));

      const partsLines: InvoiceLine[] = (jobCard.part_lines || []).map((pl, idx) => ({
        idx: labourLines.length + idx + 1,
        description: pl.part_name,
        line_type: "Parts" as const,
        quantity: pl.quantity || 1,
        unit_price: pl.unit_price || 0,
        amount: pl.amount || 0,
        part_number: pl.part_number,
      }));

      const allLines = [...labourLines, ...partsLines];
      const labourTotal = labourLines.reduce((sum, l) => sum + (l.amount || 0), 0);
      const partsTotal = partsLines.reduce((sum, l) => sum + (l.amount || 0), 0);
      const subtotal = labourTotal + partsTotal;
      const taxAmount = subtotal * 0.16;
      const totalAmount = subtotal + taxAmount;

      setFormData((prev) => ({
        ...prev,
        job_card: jobCard.name,
        vehicle_registration: jobCard.vehicle_registration,
        vehicle_model: jobCard.vehicle_model,
        customer_name: jobCard.customer_name,
        contact_number: jobCard.contact_number || "",
        email: jobCard.email || "",
        lines: allLines,
        labour_total: labourTotal,
        parts_total: partsTotal,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
      }));
    }
  }, [jobCard]);

  const handleInputChange = (field: keyof Invoice, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addLine = () => {
    if (!newLine.description) {
      toast.error("Please enter a description");
      return;
    }
    const amount = (newLine.quantity || 1) * (newLine.unit_price || 0);
    const line: InvoiceLine = {
      idx: (formData.lines?.length || 0) + 1,
      description: newLine.description || "",
      line_type: newLine.line_type || "Labour",
      quantity: newLine.quantity || 1,
      unit_price: newLine.unit_price || 0,
      amount,
    };
    
    const updatedLines = [...(formData.lines || []), line];
    recalculateTotals(updatedLines);
    
    setNewLine({
      description: "",
      line_type: "Labour",
      quantity: 1,
      unit_price: 0,
      amount: 0,
    });
  };

  const removeLine = (idx: number) => {
    const updatedLines = (formData.lines || []).filter((_, i) => i !== idx);
    recalculateTotals(updatedLines);
  };

  const recalculateTotals = (lines: InvoiceLine[]) => {
    const labourTotal = lines.filter((l) => l.line_type === "Labour").reduce((sum, l) => sum + (l.amount || 0), 0);
    const partsTotal = lines.filter((l) => l.line_type === "Parts").reduce((sum, l) => sum + (l.amount || 0), 0);
    const subtotal = labourTotal + partsTotal;
    const taxRate = formData.tax_rate || 16;
    const taxAmount = subtotal * (taxRate / 100);
    const discountAmount = formData.discount_amount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    setFormData((prev) => ({
      ...prev,
      lines,
      labour_total: labourTotal,
      parts_total: partsTotal,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    }));
  };

  const handleTaxChange = (rate: number) => {
    const subtotal = formData.subtotal || 0;
    const taxAmount = subtotal * (rate / 100);
    const discountAmount = formData.discount_amount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    setFormData((prev) => ({
      ...prev,
      tax_rate: rate,
      tax_amount: taxAmount,
      total_amount: totalAmount,
    }));
  };

  const handleDiscountChange = (discount: number) => {
    const subtotal = formData.subtotal || 0;
    const taxAmount = formData.tax_amount || 0;
    const totalAmount = subtotal + taxAmount - discount;

    setFormData((prev) => ({
      ...prev,
      discount_amount: discount,
      total_amount: totalAmount,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_name) {
      toast.error("Please enter customer name");
      return;
    }
    if (!formData.lines || formData.lines.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    setIsMutating(true);
    try {
      if (jobCardId) {
        await jobCardsSvc.makeSalesInvoice(jobCardId);
      }
      toast.success("Invoice created successfully");
      navigate('invoices');
    } catch {
      toast.error("Failed to create invoice");
    } finally {
      setIsMutating(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('invoices')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">New Invoice</h1>
          <p className="text-muted-foreground mt-1">Create a service invoice</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="min-w-0 space-y-4 sm:space-y-6">
        {/* Job Card Link */}
        {jobCard && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-primary">
                <FileText className="h-5 w-5" />
                <span className="font-medium">Job Card: {jobCard.name}</span>
                <span className="text-muted-foreground">|</span>
                <span className="text-muted-foreground">{jobCard.service_type}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Customer & Vehicle Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer_name">Customer Name *</Label>
                <Input
                  id="customer_name"
                  value={formData.customer_name}
                  onChange={(e) => handleInputChange("customer_name", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer_address">Address</Label>
                <Textarea
                  id="customer_address"
                  rows={2}
                  value={formData.customer_address}
                  onChange={(e) => handleInputChange("customer_address", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_number">Phone</Label>
                  <Input
                    id="contact_number"
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange("contact_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Invoice Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoice_date">Invoice Date</Label>
                  <Input
                    id="invoice_date"
                    type="date"
                    value={formData.invoice_date}
                    onChange={(e) => handleInputChange("invoice_date", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="due_date">Due Date</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange("due_date", e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_terms">Payment Terms</Label>
                <Select
                  value={formData.payment_terms}
                  onValueChange={(v) => handleInputChange("payment_terms", v)}
                >
                  <SelectTrigger id="payment_terms">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentTerms.map((term) => (
                      <SelectItem key={term} value={term}>
                        {term}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {jobCard && (
                <div className="space-y-2">
                  <Label>Vehicle</Label>
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
                    <Car className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{formData.vehicle_registration}</span>
                    <span className="text-muted-foreground">-</span>
                    <span className="text-muted-foreground">{formData.vehicle_model}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Invoice Lines */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Lines</CardTitle>
            <CardDescription>Add items to the invoice</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Lines */}
            {formData.lines && formData.lines.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Description</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-right p-3">Qty</th>
                      <th className="text-right p-3">Unit Price</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.lines.map((line, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="p-3">{line.description}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            line.line_type === "Labour" 
                              ? "bg-[#1E88E5]/10 text-[#1E88E5]" 
                              : "bg-[#2E7D32]/10 text-[#2E7D32]"
                          }`}>
                            {line.line_type}
                          </span>
                        </td>
                        <td className="p-3 text-right">{line.quantity}</td>
                        <td className="p-3 text-right">{line.unit_price?.toLocaleString()}</td>
                        <td className="p-3 text-right font-medium">{line.amount?.toLocaleString()}</td>
                        <td className="p-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeLine(idx)}
                            className="h-8 w-8 text-destructive"
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

            {/* Add New Line */}
            <div className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4 space-y-1">
                <Label className="text-xs">Description</Label>
                <Input
                  placeholder="Item description"
                  value={newLine.description}
                  onChange={(e) => setNewLine((prev) => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Type</Label>
                <Select
                  value={newLine.line_type}
                  onValueChange={(v) => setNewLine((prev) => ({ ...prev, line_type: v as "Labour" | "Parts" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Labour">Labour</SelectItem>
                    <SelectItem value="Parts">Parts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Quantity</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="1"
                  value={newLine.quantity || ""}
                  onChange={(e) => setNewLine((prev) => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label className="text-xs">Unit Price</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={newLine.unit_price || ""}
                  onChange={(e) => setNewLine((prev) => ({ ...prev, unit_price: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="col-span-2">
                <Button type="button" onClick={addLine} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-end">
              <div className="w-full max-w-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Labour Total:</span>
                  <span className="font-medium">{formData.labour_total?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Parts Total:</span>
                  <span className="font-medium">{formData.parts_total?.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="font-medium">{formData.subtotal?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Tax</span>
                    <Input
                      type="number"
                      className="w-16 h-8 text-sm"
                      value={formData.tax_rate}
                      onChange={(e) => handleTaxChange(parseFloat(e.target.value) || 0)}
                    />
                    <span className="text-muted-foreground">%</span>
                  </div>
                  <span className="font-medium">{formData.tax_amount?.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-muted-foreground">Discount:</span>
                  <Input
                    type="number"
                    className="w-28 h-8 text-sm text-right"
                    value={formData.discount_amount || ""}
                    onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-lg">Total:</span>
                  <span className="font-bold text-xl text-primary">{formData.total_amount?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
            <CardDescription>Additional notes to appear on the invoice</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter any notes for the customer..."
              rows={3}
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => navigate('invoices')}>
            Cancel
          </Button>
          <Button type="submit" disabled={isMutating}>
            <Receipt className="h-4 w-4 mr-2" />
            {isMutating ? "Creating..." : "Create Invoice"}
          </Button>
        </div>
      </form>
    </div>
  );
}
