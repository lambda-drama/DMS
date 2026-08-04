'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { createReferral, listReferrals } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { CrmCustomerLink } from '@/components/crm/crm-customer-link';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { Loader2, Plus } from 'lucide-react';

export default function CrmReferralsPage() {
  const { navigate } = useNavigation();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data, isLoading, mutate } = useSWR(['crm-referrals', search, status], () =>
    listReferrals({ search: search || undefined, status, limit: 50 })
  );
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    referrer_customer: '',
    referred_name: '',
    source_channel: 'In Person',
  });

  const onCreate = async () => {
    clear();
    if (!form.referrer_customer || !form.referred_name.trim()) {
      showError('Referrer and prospect name are required.');
      return;
    }
    setCreating(true);
    try {
      const result = await createReferral({
        referrer_customer: form.referrer_customer,
        referred_name: form.referred_name.trim(),
        source_channel: form.source_channel,
        status: 'Open',
      });
      setForm((p) => ({ ...p, referred_name: '' }));
      await mutate();
      showSuccess(`Referral ${result.name} created.`);
      navigate('crm-referral-detail', { id: String(result.name) });
    } catch (e: unknown) {
      showError(e, 'Failed to create referral');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />

      {(data?.advocates || []).length > 0 ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Top advocates</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {(data?.advocates || []).map((a: Record<string, unknown>) => (
              <Badge key={String(a.referrer_customer)} variant="secondary">
                {String(a.referrer_name || a.referrer_customer)} · {Number(a.converted || 0)}/
                {Number(a.cnt || 0)} converted
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">New referral</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <CrmCustomerLink
            value={form.referrer_customer}
            onValueChange={(v) => setForm((p) => ({ ...p, referrer_customer: v || '' }))}
          />
          <Input
            placeholder="Referred prospect name *"
            value={form.referred_name}
            onChange={(e) => setForm((p) => ({ ...p, referred_name: e.target.value }))}
          />
          <Button onClick={() => void onCreate()} disabled={creating}>
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create referral
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search referrals…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Open">Open</option>
              <option value="Won">Won</option>
              <option value="Delivered">Delivered</option>
              <option value="Rewarded">Rewarded</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-24" />
          ) : (
            <div className="dms-table-panel">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Prospect</th>
                    <th className="pb-2 font-medium">Referrer</th>
                    <th className="pb-2 font-medium">Reward</th>
                    <th className="pb-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.data || []).length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        No referrals yet.
                      </td>
                    </tr>
                  ) : (
                    (data?.data || []).map((row: Record<string, unknown>) => (
                      <tr
                        key={String(row.name)}
                        className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                        onClick={() =>
                          navigate('crm-referral-detail', { id: String(row.name) })
                        }
                      >
                        <td className="py-3 font-medium">{String(row.referred_name)}</td>
                        <td className="py-3 text-muted-foreground">
                          {String(row.referrer_name || row.referrer_customer)}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {Number(row.reward_points || 0)}
                          {row.reward_paid ? ' ✓' : ''}
                        </td>
                        <td className="py-3">
                          <Badge variant="secondary">{String(row.status)}</Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
