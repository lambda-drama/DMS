'use client';

import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

const CANCEL_REASONS = [
  'Customer Not Reachable',
  'Customer Cancelled',
  'Vehicle Sold',
  'Wrong Contact Info',
  'Duplicate Booking',
  'Other',
] as const;

function toDatetimeLocal(value: string | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ConfirmAppointmentDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm appointment?</AlertDialogTitle>
          <AlertDialogDescription>
            This submits the appointment and records customer confirmation. You can mark the vehicle as
            arrived after confirmation.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Back</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SendReminderDialog({
  open,
  onOpenChange,
  onSend,
  loading,
  customerName,
  phone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSend: () => void | Promise<void>;
  loading?: boolean;
  customerName?: string;
  phone?: string;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send WhatsApp reminder?</AlertDialogTitle>
          <AlertDialogDescription>
            Sends the appointment reminder template configured in WhatsApp Setup to{' '}
            {customerName ? <strong>{customerName}</strong> : 'the customer'}
            {phone ? (
              <>
                {' '}
                at <strong>{phone}</strong>
              </>
            ) : null}
            . The appointment status will be updated to Reminder Sent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onSend} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send reminder'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  onCancel,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (payload: { reason?: string; notes?: string }) => void | Promise<void>;
  loading?: boolean;
}) {
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) {
      setReason('');
      setNotes('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel appointment</DialogTitle>
          <DialogDescription>
            The appointment will be cancelled. Optionally record why the booking was cancelled.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Reason</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason (optional)" />
              </SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-notes">Notes</Label>
            <Input
              id="cancel-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Back
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => onCancel({ reason: reason || undefined, notes: notes.trim() || undefined })}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel appointment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function RescheduleAppointmentDialog({
  open,
  onOpenChange,
  initialAppointmentDateTime,
  initialPromisedDateTime,
  onReschedule,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialAppointmentDateTime?: string;
  initialPromisedDateTime?: string;
  onReschedule: (payload: {
    appointment_date_time: string;
    promised_delivery_date_time?: string;
  }) => void | Promise<void>;
  loading?: boolean;
}) {
  const [appointmentAt, setAppointmentAt] = useState('');
  const [promisedAt, setPromisedAt] = useState('');

  useEffect(() => {
    if (open) {
      setAppointmentAt(toDatetimeLocal(initialAppointmentDateTime));
      setPromisedAt(toDatetimeLocal(initialPromisedDateTime));
    }
  }, [open, initialAppointmentDateTime, initialPromisedDateTime]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule appointment</DialogTitle>
          <DialogDescription>Choose a new date and time for this booking.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-at">New appointment date & time</Label>
            <Input
              id="reschedule-at"
              type="datetime-local"
              value={appointmentAt}
              onChange={(e) => setAppointmentAt(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reschedule-promised">Promised delivery (optional)</Label>
            <Input
              id="reschedule-promised"
              type="datetime-local"
              value={promisedAt}
              onChange={(e) => setPromisedAt(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Back
          </Button>
          <Button
            type="button"
            disabled={loading || !appointmentAt}
            onClick={() =>
              onReschedule({
                appointment_date_time: appointmentAt,
                promised_delivery_date_time: promisedAt || undefined,
              })
            }
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reschedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
