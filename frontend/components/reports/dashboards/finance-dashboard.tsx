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

export function FinanceDashboard({ data }: { data: SectionDashboard }) {
  const { navigate } = useNavigation();
  const s = data.summary || {};
  const go = (link: MetricLink) => navigate(link.view, link.params);

  const billed = Number(s.invoice_count) || 0;
  const unbilled = Number(s.unbilled_count) || 0;
  const mix = [
    ...(billed ? [{ name: 'Invoiced', fullName: 'Invoiced', value: billed }] : []),
    ...(unbilled ? [{ name: 'Unbilled', fullName: 'Unbilled', value: unbilled }] : []),
  ];

  return (
    <DashboardShell>
      <MetricStrip
        onNavigate={go}
        metrics={[
          {
            key: 'invoice_count',
            label: 'Invoices',
            value: s.invoice_count,
            hint: 'Invoice register',
            href: { view: 'invoices' },
          },
          {
            key: 'grand_total',
            label: 'Grand total',
            value: s.grand_total,
            hint: 'All invoices',
            href: { view: 'invoices' },
          },
          {
            key: 'outstanding',
            label: 'Outstanding',
            value: s.outstanding,
            hint: 'Unpaid / overdue',
            href: { view: 'invoices', params: { status: 'Unpaid' } },
          },
          {
            key: 'unbilled_count',
            label: 'Unbilled jobs',
            value: s.unbilled_count,
            hint: 'Open unbilled report',
            href: {
              view: 'reports',
              params: { section: 'finance', report: 'unbilled_job_cards' },
            },
          },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <StatusPieChart
          title="Billing mix"
          data={mix}
          onSliceClick={(name) => {
            if (name === 'Unbilled') {
              navigate('reports', { section: 'finance', report: 'unbilled_job_cards' });
            } else {
              navigate('invoices');
            }
          }}
        />
        <BreakdownChart
          title="Revenue by month"
          data={chartFromBreakdown(s, 'by_month')}
          onBarClick={() => navigate('invoices')}
        />
      </div>
    </DashboardShell>
  );
}
