'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, Mail, Phone, Save, User } from 'lucide-react';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import * as commonSvc from '@/services/common';

export interface CustomerContactValue {
  mobile_no: string;
  email_id: string;
}

const EMPTY_CONTACT: CustomerContactValue = { mobile_no: '', email_id: '' };

export interface CustomerContactCardProps {
  /** Selected customer (Customer docname). Nothing renders while empty. */
  customer: string;
  /** Display name used in the card header. */
  customerName?: string | null;
  /** Values already available from the customer list row, used if the fetch fails. */
  fallback?: Partial<CustomerContactValue> | null;
  /** Called whenever phone/email change, so callers can reuse them in their payload. */
  onChange?: (contact: CustomerContactValue) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Phone + email of the selected customer, shown right under the Customer field.
 *
 * Prefilled from the customer record; when the customer has no phone/email the
 * fields start empty so the user can enter them. The small Save button writes
 * the values back to the Customer record (the Job Card's Customer Mobile is a
 * `fetch_from` field, so it follows along automatically).
 */
export function CustomerContactCard({
  customer,
  customerName,
  fallback,
  onChange,
  disabled = false,
  className,
}: CustomerContactCardProps) {
  const { mutate } = useSWRConfig();
  const [contact, setContact] = useState<CustomerContactValue>(EMPTY_CONTACT);
  const [saved, setSaved] = useState<CustomerContactValue>(EMPTY_CONTACT);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fallbackMobile = fallback?.mobile_no || '';
  const fallbackEmail = fallback?.email_id || '';

  // Keep the latest callback without re-running the notify effect on every render.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!customer) {
      setContact(EMPTY_CONTACT);
      setSaved(EMPTY_CONTACT);
      return;
    }

    let cancelled = false;
    setLoading(true);
    commonSvc
      .fetchCustomerContact(customer)
      .then((data) => {
        if (cancelled) return;
        const next = { mobile_no: data.mobile_no || '', email_id: data.email_id || '' };
        setContact(next);
        setSaved(next);
      })
      .catch(() => {
        if (cancelled) return;
        const next = { mobile_no: fallbackMobile, email_id: fallbackEmail };
        setContact(next);
        setSaved(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [customer, fallbackMobile, fallbackEmail]);

  useEffect(() => {
    onChangeRef.current?.(contact);
  }, [contact]);

  const dirty = contact.mobile_no !== saved.mobile_no || contact.email_id !== saved.email_id;
  const fieldDisabled = disabled || loading;

  async function handleSave() {
    if (!customer) return;
    setSaving(true);
    try {
      const result = await commonSvc.updateCustomerContact(customer, {
        mobile_no: contact.mobile_no.trim(),
        email_id: contact.email_id.trim(),
      });
      const next = { mobile_no: result.mobile_no || '', email_id: result.email_id || '' };
      setContact(next);
      setSaved(next);
      toast.success('Customer phone and email updated');
      await mutate(
        (key) =>
          (Array.isArray(key) &&
            (key[0] === 'customers' || key[0] === 'customers-paginated')) ||
          key === 'customers' ||
          key === 'customers-paginated',
        undefined,
        { revalidate: true }
      );
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Could not update customer phone and email'
      );
    } finally {
      setSaving(false);
    }
  }

  if (!customer) return null;

  return (
    <div className={cn('rounded-lg border bg-muted/30 p-4 space-y-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <User className="h-4 w-4 text-muted-foreground" />
          {customerName || customer}
        </p>
        {loading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>

      <p className="text-xs text-muted-foreground">
        Phone and email come from the customer record. Fill them in if they are missing, then press
        Save to update this customer.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customer_contact_mobile">Phone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="customer_contact_mobile"
              className="pl-9"
              type="tel"
              placeholder="Mobile number"
              value={contact.mobile_no}
              onChange={(e) => setContact((prev) => ({ ...prev, mobile_no: e.target.value }))}
              disabled={fieldDisabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="customer_contact_email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="customer_contact_email"
              className="pl-9"
              type="email"
              placeholder="Email address"
              value={contact.email_id}
              onChange={(e) => setContact((prev) => ({ ...prev, email_id: e.target.value }))}
              disabled={fieldDisabled}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void handleSave()}
          disabled={fieldDisabled || saving || !dirty}
        >
          {saving ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="mr-2 h-3.5 w-3.5" />
          )}
          Save
        </Button>
      </div>
    </div>
  );
}
