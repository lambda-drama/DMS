'use client';

import { useEffect, useState } from 'react';
import { Headphones, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { LinkWithCreate } from '@/components/link-with-create';
import { SearchableSelect } from '@/components/searchable-select';
import { useServiceAdvisors } from '@/hooks/use-dms';

export interface SelectServiceAdvisorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderName?: string | null;
  saving?: boolean;
  onConfirm: (serviceAdvisor: string) => void | Promise<void>;
}

/** Mandatory advisor pick when the signed-in user is not a Service Advisor. */
export function SelectServiceAdvisorDialog({
  open,
  onOpenChange,
  orderName,
  saving = false,
  onConfirm,
}: SelectServiceAdvisorDialogProps) {
  const { data: advisors, isLoading } = useServiceAdvisors();
  const [value, setValue] = useState('');

  useEffect(() => {
    if (open) setValue('');
  }, [open]);

  const selected = advisors?.find((sa) => sa.name === value);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Headphones className="h-5 w-5" />
            Select service advisor
          </DialogTitle>
          <DialogDescription>
            A service advisor is required to create a job card
            {orderName ? ` from ${orderName}` : ''}. Your login is not linked to an advisor
            record — pick one, or add a new advisor with +.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-1">
          <Label>
            Service advisor <span className="text-destructive">*</span>
          </Label>
          <LinkWithCreate doctype="Service Advisor" onCreated={setValue}>
            <SearchableSelect
              portaled
              options={
                advisors?.map((sa) => ({
                  value: sa.name,
                  label: sa.full_name || sa.name,
                })) || []
              }
              value={value}
              valueLabel={selected?.full_name || selected?.name}
              onValueChange={setValue}
              placeholder="Search advisors..."
              isLoading={isLoading}
            />
          </LinkWithCreate>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!value || saving}
            onClick={() => void onConfirm(value)}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Job Card
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
