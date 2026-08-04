'use client';

import useSWR from 'swr';
import { getReferral, markReferralEvent, updateReferral } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CrmFeedback, useCrmFeedback } from '@/components/crm/form-feedback';
import { ArrowLeft } from 'lucide-react';

export default function CrmReferralDetailPage() {
  const { navigate, viewParams } = useNavigation();
  const id = viewParams.get('id') || '';
  const { data, isLoading, mutate } = useSWR(id ? ['crm-referral', id] : null, () =>
    getReferral(id)
  );
  const { error, success, showError, showSuccess, clear } = useCrmFeedback();

  if (!id) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No referral selected.
        </CardContent>
      </Card>
    );
  }
  if (isLoading || !data) return <Skeleton className="h-40" />;

  const advance = async (event: string) => {
    clear();
    try {
      await markReferralEvent(id, event);
      await mutate();
      showSuccess(`Marked ${event}.`);
    } catch (e: unknown) {
      showError(e, 'Update failed');
    }
  };

  return (
    <div className="space-y-4">
      <CrmFeedback error={error} success={success} onDismiss={clear} />
      <Button variant="ghost" size="sm" onClick={() => navigate('crm-referrals')}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Referrals
      </Button>

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">
              {String(data.referred_name)} ({String(data.name)})
            </CardTitle>
            <Badge>{String(data.status)}</Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-muted-foreground">Referrer: </span>
            {String(data.referrer_name || data.referrer_customer)}
          </p>
          <p>
            <span className="text-muted-foreground">Reward event: </span>
            {String(data.reward_event || '—')} ({Number(data.reward_points || 0)} pts)
          </p>
          <p>
            <span className="text-muted-foreground">Lead: </span>
            {String(data.referred_lead || '—')}
          </p>
          <p>
            <span className="text-muted-foreground">Customer: </span>
            {String(data.referred_customer || '—')}
          </p>
          <p>
            <span className="text-muted-foreground">Reward paid: </span>
            {data.reward_paid ? 'Yes' : 'No'}
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        {(['Lead Converted', 'Booking', 'Full Payment', 'Delivery'] as const).map((ev) => (
          <Button key={ev} variant="outline" size="sm" onClick={() => void advance(ev)}>
            Mark {ev}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            try {
              await updateReferral(id, { status: 'Disqualified' });
              await mutate();
              showSuccess('Disqualified.');
            } catch (e: unknown) {
              showError(e, 'Failed');
            }
          }}
        >
          Disqualify
        </Button>
      </div>
    </div>
  );
}
