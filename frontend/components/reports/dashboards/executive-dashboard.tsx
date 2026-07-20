'use client';

import type { SectionDashboard } from '@/services/reports';
import { useNavigation } from '@/contexts/navigation-context';
import {
  BreakdownChart,
  DashboardShell,
  MetricStrip,
  StatusPieChart,
  chartFromBreakdown,
  type MetricLink,
} from './shared';

export function ExecutiveDashboard({ data }: { data: SectionDashboard }) {
  const { navigate } = useNavigation();
  const s = data.summary || {};
  const currency = (s.revenue_currency as string | undefined) || null;
  const go = (link: MetricLink) => navigate(link.view, link.params);
  const statusData = chartFromBreakdown(s, 'by_status');
  const payMix = chartFromBreakdown(s, 'by_pay_mix');
  const monthRev = chartFromBreakdown(s, 'by_month');
  const byJobType = chartFromBreakdown(s, 'by_job_type');
  const byBranch = chartFromBreakdown(s, 'by_branch');

  return (
    <DashboardShell>
      {currency ? (
        <p className="text-[11px] text-muted-foreground">
          Amounts in <span className="font-semibold text-foreground">{currency}</span>
        </p>
      ) : null}
      <MetricStrip
        onNavigate={go}
        metrics={[
          {
            key: 'vehicles_received',
            label: 'Vehicles received',
            value: s.vehicles_received,
            hint: 'Unique VINs in period',
            href: { view: 'job-cards' },
          },
          {
            key: 'jobs_opened',
            label: 'Jobs opened',
            value: s.jobs_opened,
            hint: 'Job cards created',
            href: { view: 'job-cards' },
          },
          {
            key: 'jobs_closed',
            label: 'Jobs closed',
            value: s.jobs_closed,
            hint: 'Completed / delivered',
            href: { view: 'job-cards', params: { filter: 'completed' } },
          },
          {
            key: 'jobs_cancelled',
            label: 'Cancelled',
            value: s.jobs_cancelled,
            hint: 'Cancelled job cards',
            href: { view: 'job-cards', params: { status: 'Cancelled' } },
          },
          {
            key: 'jobs_reopened',
            label: 'Reopened / rework',
            value: s.jobs_reopened,
            hint: 'Repeat, QC fail, rework',
            href: { view: 'job-cards', params: { filter: 'qc_failed' } },
          },
          {
            key: 'invoiced_revenue',
            label: 'Invoiced revenue',
            value: s.invoiced_revenue,
            display: 'money',
            currency,
            hint: 'Sales invoices / closed net',
            href: { view: 'invoices' },
          },
          {
            key: 'labor_revenue',
            label: 'Labor revenue',
            value: s.labor_revenue ?? s.labour_revenue,
            display: 'money',
            currency,
            hint: 'Customer-pay labour',
            href: {
              view: 'reports',
              params: { section: 'executive', report: 'aftersales_profitability' },
            },
          },
          {
            key: 'parts_revenue',
            label: 'Parts revenue',
            value: s.parts_revenue,
            display: 'money',
            currency,
            hint: 'Customer-pay parts',
            href: {
              view: 'reports',
              params: { section: 'executive', report: 'aftersales_profitability' },
            },
          },
          {
            key: 'warranty_revenue',
            label: 'Warranty revenue',
            value: s.warranty_revenue,
            display: 'money',
            currency,
            hint: 'Warranty / recall jobs',
            href: { view: 'reports', params: { section: 'warranty', report: 'dashboard' } },
          },
          {
            key: 'internal_work_value',
            label: 'Internal work',
            value: s.internal_work_value,
            display: 'money',
            currency,
            hint: 'Internal job value',
            href: { view: 'job-cards' },
          },
          {
            key: 'avg_repair_order',
            label: 'Avg repair order',
            value: s.avg_repair_order,
            display: 'money',
            currency,
            hint: 'Net / closed customer-pay',
            href: {
              view: 'reports',
              params: { section: 'executive', report: 'aftersales_dashboard' },
            },
          },
          {
            key: 'open_job_cards',
            label: 'In workshop',
            value: s.open_job_cards,
            hint: 'Open active jobs',
            href: { view: 'job-cards', params: { filter: 'active' } },
          },
          {
            key: 'overdue_promised',
            label: 'Delayed',
            value: s.overdue_promised,
            hint: 'Past promised delivery',
            href: { view: 'job-cards', params: { filter: 'overdue' } },
          },
          {
            key: 'waiting_parts',
            label: 'Waiting parts',
            value: s.waiting_parts,
            hint: 'Jobs blocked on parts',
            href: { view: 'job-cards', params: { status: 'Waiting Parts' } },
          },
          {
            key: 'csat_score',
            label: 'CSAT',
            value: s.csat_score,
            display: 'stars',
            hint: 'Avg follow-up rating (1–5)',
            href: {
              view: 'reports',
              params: { section: 'crm', report: 'customer_satisfaction' },
            },
          },
          {
            key: 'estimate_conversion_pct',
            label: 'Estimate conversion %',
            value: s.estimate_conversion_pct,
            progress: Number(s.estimate_conversion_pct) || 0,
            hint: 'Accepted / decided estimates',
            href: { view: 'service-estimates' },
          },
          {
            key: 'first_time_fix_pct',
            label: 'First-time fix %',
            value: s.first_time_fix_pct,
            progress: Number(s.first_time_fix_pct) || 0,
            hint: 'Closed without repeat repair',
            href: {
              view: 'reports',
              params: { section: 'workshop', report: 'repeat_repair' },
            },
          },
          {
            key: 'gross_profit',
            label: 'Gross profit',
            value: s.gross_profit,
            display: 'money',
            currency,
            hint: 'Net sales − direct cost',
            href: {
              view: 'reports',
              params: { section: 'executive', report: 'aftersales_profitability' },
            },
          },
          {
            key: 'gross_profit_pct',
            label: 'Gross profit %',
            value: s.gross_profit_pct,
            progress: Number(s.gross_profit_pct) || 0,
            hint: 'GP / net sales',
            href: {
              view: 'reports',
              params: { section: 'executive', report: 'aftersales_profitability' },
            },
          },
          {
            key: 'yoy_growth_pct',
            label: 'YoY growth %',
            value: s.yoy_growth_pct,
            hint: 'Versus prior-year period',
            href: {
              view: 'reports',
              params: { section: 'executive', report: 'revenue_trend' },
            },
          },
          {
            key: 'budget_achievement_avg',
            label: 'Budget achievement %',
            value: s.budget_achievement_avg,
            progress: Number(s.budget_achievement_avg) || 0,
            hint: 'Avg target achievement',
            href: {
              view: 'reports',
              params: { section: 'executive', report: 'budget_versus_actual' },
            },
          },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <StatusPieChart
          title="Customer-pay · Warranty · Internal"
          data={payMix}
          currency={currency}
          valueIsMoney
          onSliceClick={() =>
            navigate('reports', { section: 'executive', report: 'aftersales_dashboard' })
          }
        />
        <StatusPieChart
          title="WIP mix"
          data={statusData}
          onSliceClick={(status) => {
            if (!status) return;
            navigate('job-cards', { status });
          }}
        />
        <BreakdownChart
          title="Revenue by month"
          data={monthRev}
          currency={currency}
          valueIsMoney
          onBarClick={() =>
            navigate('reports', { section: 'executive', report: 'revenue_trend' })
          }
        />
        <BreakdownChart
          title="Revenue by job type"
          data={byJobType}
          currency={currency}
          valueIsMoney
          onBarClick={() =>
            navigate('reports', { section: 'executive', report: 'revenue_trend' })
          }
        />
        <BreakdownChart
          title="Revenue by branch"
          data={byBranch}
          currency={currency}
          valueIsMoney
          onBarClick={() =>
            navigate('reports', { section: 'executive', report: 'revenue_trend' })
          }
        />
        <BreakdownChart
          title="Gross profit by branch"
          data={chartFromBreakdown(s, 'by_branch_gp')}
          currency={currency}
          valueIsMoney
          onBarClick={() =>
            navigate('reports', { section: 'executive', report: 'aftersales_profitability' })
          }
        />
      </div>
    </DashboardShell>
  );
}
