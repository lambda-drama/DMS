'use client';

import useSWR from 'swr';
import { fetchCrmDashboard } from '@/services/crm';
import { useNavigation } from '@/contexts/navigation-context';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowRight,
  Building2,
  Handshake,
  Megaphone,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function Gauge({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const angle = (pct / 100) * 180;
  return (
    <div className="relative mx-auto flex h-36 w-56 items-end justify-center">
      <svg viewBox="0 0 200 120" className="h-full w-full">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="16"
          strokeLinecap="round"
        />
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="url(#crmGauge)"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray={`${(angle / 180) * 251} 251`}
        />
        <defs>
          <linearGradient id="crmGauge" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute bottom-2 text-center">
        <div className="text-3xl font-semibold tracking-tight text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">of {max}</div>
      </div>
    </div>
  );
}

function PipelineBars({
  stages,
}: {
  stages: Array<{ stage: string; count: number }>;
}) {
  const max = Math.max(1, ...stages.map((s) => s.count));
  return (
    <div className="space-y-3">
      {stages.map((s) => (
        <div key={s.stage} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{s.stage}</span>
            <span className="font-medium">{s.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(s.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function CrmDashboardPage() {
  const { navigate } = useNavigation();
  const { user } = useAuth();
  const { data, isLoading, error } = useSWR('crm-dashboard', fetchCrmDashboard, {
    revalidateOnFocus: true,
  });

  const stats = data?.stats;
  const firstName = (user?.full_name || data?.user?.full_name || 'there').split(' ')[0];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-56" />
          <Skeleton className="h-56" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Could not load CRM dashboard. Migrate doctypes and ensure CRM roles have access.
        </CardContent>
      </Card>
    );
  }

  const summary = [
    {
      label: 'Contacts',
      value: stats?.contacts ?? 0,
      icon: Users,
      tone: 'bg-primary/10 text-foreground',
      iconTone: 'text-primary',
      view: 'crm-contacts',
    },
    {
      label: 'Deals',
      value: stats?.opportunities_open ?? 0,
      icon: Handshake,
      tone: 'bg-secondary/15 text-foreground',
      iconTone: 'text-secondary',
      view: 'crm-opportunities',
    },
    {
      label: 'Open Leads',
      value: stats?.leads_open ?? 0,
      icon: Target,
      tone: 'bg-sky-500/10 text-foreground',
      iconTone: 'text-sky-600 dark:text-sky-400',
      view: 'crm-leads',
    },
    {
      label: 'Customers',
      value: stats?.customers ?? 0,
      icon: Building2,
      tone: 'bg-muted text-foreground',
      iconTone: 'text-foreground',
      view: 'crm-customers',
    },
  ];

  const quickStats = [
    {
      label: 'Hot leads',
      value: stats?.leads_hot ?? 0,
      icon: Target,
      tone: 'bg-primary/10',
      iconTone: 'text-primary',
      view: 'crm-leads',
    },
    {
      label: 'Open activities',
      value: stats?.activities_open ?? 0,
      icon: Megaphone,
      tone: 'bg-secondary/15',
      iconTone: 'text-secondary',
      view: 'crm-activities',
    },
    {
      label: 'Open cases',
      value: stats?.cases_open ?? 0,
      icon: Handshake,
      tone: 'bg-sky-500/10',
      iconTone: 'text-sky-600',
      view: 'crm-cases',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">Hi, {firstName}</p>
        <div className="flex gap-2">
          <Button onClick={() => navigate('crm-lead-new')}>New Lead</Button>
          <Button variant="outline" onClick={() => navigate('crm-opportunity-new')}>
            New Deal
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          className="cursor-pointer overflow-hidden border-border/70 shadow-sm transition-colors hover:bg-muted/30"
          role="link"
          tabIndex={0}
          onClick={() => navigate('crm-leads')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('crm-leads');
            }
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Lead Target</CardTitle>
          </CardHeader>
          <CardContent>
            <Gauge
              value={stats?.leads_this_month ?? 0}
              max={stats?.lead_target ?? 100}
            />
            <p className="mt-2 text-center text-sm text-muted-foreground">
              Remaining{' '}
              <span className="font-semibold text-foreground">
                {stats?.lead_target_remaining ?? 0}
              </span>
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer border-border/70 shadow-sm transition-colors hover:bg-muted/30"
          role="link"
          tabIndex={0}
          onClick={() => navigate('crm-opportunities')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              navigate('crm-opportunities');
            }
          }}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Pipeline by Stage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <PipelineBars stages={data?.stage_pipeline || []} />
            <div className="mt-4 rounded-lg bg-primary/5 px-3 py-2 text-sm">
              Weighted pipeline{' '}
              <span className="font-semibold">
                {(stats?.pipeline_value ?? 0).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {summary.map((item) => (
          <Card
            key={item.label}
            className="cursor-pointer border-border/70 shadow-sm transition-colors hover:bg-muted/30"
            role="link"
            tabIndex={0}
            onClick={() => navigate(item.view)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(item.view);
              }
            }}
          >
            <CardContent className="flex items-center gap-3 py-4">
              <div className={cn('rounded-xl p-2.5', item.tone)}>
                <item.icon className={cn('h-5 w-5', item.iconTone)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-xl font-semibold tracking-tight text-foreground">
                  {item.value.toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/70 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base font-medium">My Leads</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-foreground"
            onClick={() => navigate('crm-leads')}
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="dms-table-panel">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Owner</th>
                  <th className="pb-2 font-medium">Source</th>
                  <th className="pb-2 font-medium">Company</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {(data?.my_leads || []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No open leads assigned to you yet.
                    </td>
                  </tr>
                ) : (
                  (data?.my_leads || []).map((lead) => (
                    <tr
                      key={lead.name}
                      className="cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/40"
                      onClick={() => navigate('crm-lead-detail', { id: String(lead.name) })}
                    >
                      <td className="py-3 font-medium">{lead.lead_name}</td>
                      <td className="py-3 text-muted-foreground">{lead.owner_name || '—'}</td>
                      <td className="py-3 text-muted-foreground">{lead.source || '—'}</td>
                      <td className="py-3 text-muted-foreground">
                        {lead.organization_name || '—'}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
                          {lead.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickStats.map((item) => (
          <Card
            key={item.label}
            className="cursor-pointer border-border shadow-sm transition-colors hover:bg-muted/30"
            role="link"
            tabIndex={0}
            onClick={() => navigate(item.view)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigate(item.view);
              }
            }}
          >
            <CardContent className="flex items-center justify-between py-4">
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-semibold">{item.value}</p>
              </div>
              <div className={cn('rounded-xl p-2.5', item.tone)}>
                <item.icon className={cn('h-5 w-5', item.iconTone)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
