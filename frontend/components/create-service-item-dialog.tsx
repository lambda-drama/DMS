'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
import { SearchableSelect } from '@/components/searchable-select';
import { useVehicleModels, useVehicleServiceTypes } from '@/hooks/use-dms';
import { apiRequest } from '@/services/apiClient';

interface CreateServiceItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (serviceItemName: string) => void;
}

export function CreateServiceItemDialog({
  open,
  onOpenChange,
  onCreated,
}: CreateServiceItemDialogProps) {
  const [saving, setSaving] = useState(false);
  const [serviceItem, setServiceItem] = useState('');
  const [serviceCode, setServiceCode] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [category, setCategory] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [frt, setFrt] = useState('');
  const [catCode, setCatCode] = useState('');
  const [subCode, setSubCode] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [rate, setRate] = useState('');
  const [description, setDescription] = useState('');

  const { data: vehicleModels, isLoading: modelsLoading } = useVehicleModels(modelSearch);
  const { data: serviceCategories, isLoading: categoriesLoading } = useVehicleServiceTypes(categorySearch);

  const handleClose = () => {
    if (!saving) {
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setServiceItem('');
    setServiceCode('');
    setVehicleModel('');
    setModelSearch('');
    setServiceType('');
    setCategory('');
    setCategorySearch('');
    setFrt('');
    setCatCode('');
    setSubCode('');
    setEstimatedHours('');
    setRate('');
    setDescription('');
  };

  const handleSubmit = async () => {
    if (!serviceItem.trim()) {
      toast.error('Service item name is required');
      return;
    }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        doctype: 'Vehicle Service Item',
        service_item: serviceItem.trim(),
      };

      if (serviceCode.trim()) payload.custom_service_code = serviceCode.trim();
      if (vehicleModel) payload.custom_vehicle_model = vehicleModel;
      if (serviceType) payload.service_type = serviceType;
      if (category) payload.custom_category = category;
      if (frt.trim()) payload.custom_frt = frt.trim();
      if (catCode.trim()) payload.custom_cat_code = catCode.trim();
      if (subCode.trim()) payload.custom_sub_code = subCode.trim();
      if (estimatedHours) payload.custom_estimated_timehours = estimatedHours;
      if (rate) payload.custom_rate = parseFloat(rate);
      if (description.trim()) payload.custom_description = description.trim();

      const response = await apiRequest<{ name: string }>('/api/resource/Vehicle Service Item', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      toast.success(`Service item "${serviceItem}" created successfully`);
      onCreated?.(response.name);
      handleClose();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Failed to create service item';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Vehicle Service Item</DialogTitle>
          <DialogDescription>
            Create a new labour service item for vehicle maintenance and repair.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>
                Service Item <span className="text-destructive">*</span>
              </Label>
              <Input
                value={serviceItem}
                onChange={(e) => setServiceItem(e.target.value)}
                placeholder="e.g., Engine Oil Change"
              />
            </div>
            <div className="space-y-2">
              <Label>Service Code</Label>
              <Input
                value={serviceCode}
                onChange={(e) => setServiceCode(e.target.value)}
                placeholder="e.g., SVC-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Vehicle Model</Label>
              <SearchableSelect
                value={vehicleModel}
                onValueChange={setVehicleModel}
                onSearchChange={setModelSearch}
                placeholder="Search vehicle models..."
                isLoading={modelsLoading}
                options={(vehicleModels || []).map((vm) => ({
                  value: vm.name,
                  label: vm.model_code || vm.name,
                  description:
                    [vm.model_name, vm.variant].filter(Boolean).join(' ') || undefined,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Service Type</Label>
              <Select value={serviceType} onValueChange={setServiceType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Preventive Maintenance">Preventive Maintenance</SelectItem>
                  <SelectItem value="Repair">Repair</SelectItem>
                  <SelectItem value="Inspection">Inspection</SelectItem>
                  <SelectItem value="Diagnosis">Diagnosis</SelectItem>
                  <SelectItem value="Replacement">Replacement</SelectItem>
                  <SelectItem value="Adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Category</Label>
              <SearchableSelect
                value={category}
                onValueChange={setCategory}
                onSearchChange={setCategorySearch}
                placeholder="Search categories..."
                isLoading={categoriesLoading}
                options={(serviceCategories || []).map((cat) => ({
                  value: cat.name,
                  label: cat.service_type_name || cat.name,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label>FRT</Label>
              <Input
                value={frt}
                onChange={(e) => setFrt(e.target.value)}
                placeholder="Flat Rate Time"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Cat Code</Label>
              <Input
                value={catCode}
                onChange={(e) => setCatCode(e.target.value)}
                placeholder="Category Code"
              />
            </div>
            <div className="space-y-2">
              <Label>Sub Code</Label>
              <Input
                value={subCode}
                onChange={(e) => setSubCode(e.target.value)}
                placeholder="Sub Code"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Estimated Hours</Label>
              <Input
                type="number"
                step="any"
                min="0"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="e.g., 1.5"
              />
            </div>
            <div className="space-y-2">
              <Label>Rate</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Service description..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Service Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
