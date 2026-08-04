'use client';

import { useState } from 'react';
import useSWR from 'swr';
import {
  createLoyaltyAdjustment,
  decideLoyaltyAdjustment,
  enrollCustomerInLoyalty,
  enrollCustomersBulk,
  getLoyaltyAdjustments,
  getLoyaltySettings,
  getLoyaltySetupStatus,
  setupLoyaltyPrograms,
  syncLoyaltyTiers,
  updateLoyaltySettings,
} from '@/services/crm';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2 } from 'lucide-react';

export default function CrmLoyaltyPage() {
  const { data: settings, mutate: mutateSettings } = useSWR(
    'crm-loyalty-settings',
    getLoyaltySettings
  );
  const { data: setup, mutate: mutateSetup } = useSWR(
    'crm-loyalty-setup',
    getLoyaltySetupStatus
  );
  const { data: adjustments, mutate } = useSWR('crm-loyalty-adjustments', () =>
    getLoyaltyAdjustments({ status: 'Pending', limit: 30 })
  );
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [enrollCustomer, setEnrollCustomer] = useState('');
  const [form, setForm] = useState({
    customer: '',
    points: '100',
    adjustment_type: 'Credit',
    reason: '',
  });

  const refresh = async () => {
    await Promise.all([mutateSettings(), mutateSetup(), mutate()]);
  };

  const onSetup = async () => {
    clear();
    setBusy('setup');
    try {
      const res = (await setupLoyaltyPrograms()) as Record<string, unknown>;
      await refresh();
      showSuccess(
        `Programs ready: ${String(res.retail_loyalty_program)} / ${String(res.fleet_loyalty_program)}`
      );
    } catch (e: unknown) {
      showError(e, 'Setup failed');
    } finally {
      setBusy(null);
    }
  };

  const onBulkEnroll = async () => {
    clear();
    setBusy('enroll');
    try {
      const res = (await enrollCustomersBulk({ limit: 200 })) as {
        enrolled?: number;
        attempted?: number;
      };
      await mutateSetup();
      showSuccess(`Enrolled ${res.enrolled ?? 0} of ${res.attempted ?? 0} customers.`);
    } catch (e: unknown) {
      showError(e, 'Bulk enroll failed');
    } finally {
      setBusy(null);
    }
  };

  const onSyncTiers = async () => {
    clear();
    setBusy('sync');
    try {
      const res = (await syncLoyaltyTiers({ limit: 200 })) as { synced?: number };
      await mutateSetup();
      showSuccess(`Synced tiers for ${res.synced ?? 0} customers.`);
    } catch (e: unknown) {
      showError(e, 'Tier sync failed');
    } finally {
      setBusy(null);
    }
  };

  const onEnrollOne = async () => {
    clear();
    if (!enrollCustomer) {
      showError('Select a customer to enroll.');
      return;
    }
    setBusy('one');
    try {
      const res = (await enrollCustomerInLoyalty(enrollCustomer)) as Record<
        string,
        unknown
      >;
      await mutateSetup();
      showSuccess(
        `Enrolled in ${String(res.loyalty_program)} · tier ${String(res.loyalty_program_tier || '—')}`
      );
    } catch (e: unknown) {
      showError(e, 'Enroll failed');
    } finally {
      setBusy(null);
    }
  };

  const onAdjust = async () => {
    clear();
    if (!form.customer || !form.reason.trim()) {
      showError('Customer and reason are required.');
      return;
    }
    setSaving(true);
    try {
      await createLoyaltyAdjustment({
        customer: form.customer,
        points: Number(form.points),
        adjustment_type: form.adjustment_type,
        reason: form.reason.trim(),
      });
      setForm((p) => ({ ...p, reason: '', points: '100' }));
      await mutate();
      showSuccess('Adjustment submitted for approval.');
    } catch (e: unknown) {
      showError(e, 'Failed to create adjustment');
    } finally {
      setSaving(false);
    }
  };

  if (!settings || !setup) return <Skeleton className="h-40" />;

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Loyalty setup (§16)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Points:</span> ERPNext Loyalty
            Program / Point Entry
            {setup.use_erpnext_loyalty_program ? ' (enabled)' : ' (disabled)'}.
          </p>
          <p>
            <span className="font-medium text-foreground">Discounts:</span> Pricing Rules
            per tier (sales docs) + service % on job-card invoices.
          </p>
          <p>
            <span className="font-medium text-foreground">Retail:</span>{' '}
            {String(setup.retail_loyalty_program || '—')}
            {setup.retail_exists ? '' : ' (missing)'} ·{' '}
            <span className="font-medium text-foreground">Fleet:</span>{' '}
            {String(setup.fleet_loyalty_program || '—')}
            {setup.fleet_exists ? '' : ' (missing)'}
          </p>
          <p>
            Enrolled customers:{' '}
            <span className="font-medium text-foreground">
              {Number(setup.enrolled_customers || 0)}
            </span>
            . Referral reward after{' '}
            <span className="font-medium text-foreground">
              {String(settings.referral_reward_event || 'Delivery')}
            </span>{' '}
            ({Number(settings.referral_reward_points || 0)} pts).
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {(setup.tiers || settings.tiers || []).map((t: Record<string, unknown>) => (
              <Badge key={String(t.tier || t.tier_name)} variant="secondary">
                {String(t.tier || t.tier_name)} ·{' '}
                {Number(t.discount_pct ?? t.service_discount_pct ?? 0)}% svc
                {t.pricing_rule ? ` · ${String(t.pricing_rule)}` : ''}
              </Badge>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button size="sm" onClick={() => void onSetup()} disabled={!!busy}>
              {busy === 'setup' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create programs &amp; pricing rules
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void onBulkEnroll()}
              disabled={!!busy || !setup.ready}
            >
              {busy === 'enroll' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enroll customers (200)
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => void onSyncTiers()}
              disabled={!!busy || !setup.ready}
            >
              {busy === 'sync' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sync tiers from LTV
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={async () => {
                try {
                  await updateLoyaltySettings({ enable_loyalty: 1 });
                  await refresh();
                  showSuccess('Loyalty enabled.');
                } catch (e: unknown) {
                  showError(e, 'Save failed');
                }
              }}
            >
              Enable loyalty
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto] pt-2">
            <CrmCustomerLink
              value={enrollCustomer}
              onValueChange={(v) => setEnrollCustomer(v || '')}
            />
            <Button
              variant="secondary"
              onClick={() => void onEnrollOne()}
              disabled={!!busy || !setup.ready}
            >
              {busy === 'one' ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enroll one
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Points adjustment (approval)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <CrmCustomerLink
            value={form.customer}
            onValueChange={(v) => setForm((p) => ({ ...p, customer: v || '' }))}
          />
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={form.adjustment_type}
            onChange={(e) => setForm((p) => ({ ...p, adjustment_type: e.target.value }))}
          >
            <option value="Credit">Credit</option>
            <option value="Debit">Debit</option>
            <option value="Expire">Expire</option>
            <option value="Correction">Correction</option>
          </select>
          <Input
            type="number"
            value={form.points}
            onChange={(e) => setForm((p) => ({ ...p, points: e.target.value }))}
            placeholder="Points"
          />
          <Textarea
            className="sm:col-span-2"
            rows={2}
            placeholder="Reason *"
            value={form.reason}
            onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
          />
          <Button onClick={() => void onAdjust()} disabled={saving}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Submit adjustment
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Pending adjustments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(adjustments?.data || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending adjustments.</p>
          ) : (
            (adjustments?.data || []).map((row: Record<string, unknown>) => (
              <div
                key={String(row.name)}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {String(row.customer_name || row.customer)} · {String(row.adjustment_type)}{' '}
                    {Number(row.points)}
                  </p>
                  <p className="text-xs text-muted-foreground">{String(row.reason || '')}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={async () => {
                      try {
                        await decideLoyaltyAdjustment(String(row.name), 'Approved');
                        await mutate();
                        showSuccess('Approved & posted.');
                      } catch (e: unknown) {
                        showError(e, 'Approve failed');
                      }
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await decideLoyaltyAdjustment(String(row.name), 'Rejected');
                        await mutate();
                        showSuccess('Rejected.');
                      } catch (e: unknown) {
                        showError(e, 'Reject failed');
                      }
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
