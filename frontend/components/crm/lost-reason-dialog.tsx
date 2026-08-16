'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type LostReasonDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName?: string;
  leadLabel?: string;
  onSave: (reason: string) => void;
  saving?: boolean;
};

export function LostReasonDialog({
  open,
  onOpenChange,
  leadLabel,
  onSave,
  saving = false,
}: LostReasonDialogProps) {
  const [reason, setReason] = useState('');

  const handleOpenChange = (next: boolean) => {
    if (!next && !saving) {
      setReason('');
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lost reason</DialogTitle>
          <DialogDescription>
            {leadLabel ? (
              <>
                Mark <span className="font-medium text-foreground">{leadLabel}</span> as
                Disqualified. Enter why this lead was lost.
              </>
            ) : (
              'Mark this lead as Disqualified. Enter why this lead was lost.'
            )}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <Textarea
            placeholder="e.g. Customer bought from a competitor, no budget, not interested…"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => onSave(reason)}
            disabled={saving || !reason.trim()}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Disqualify Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}