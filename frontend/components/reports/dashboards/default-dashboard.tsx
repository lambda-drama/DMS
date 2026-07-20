'use client';

import type { SectionDashboard } from '@/services/reports';
import { useNavigation } from '@/contexts/navigation-context';
import {
  BreakdownChart,
  DashboardShell,
  KpiCards,
  StatusPieChart,
  chartFromBreakdown,
  type MetricLink,
} from './shared';

const SKIP = [
  'by_status',
  'by_month',
  'by_advisor',
  'by_technician',
  'by_bay',
  'by_model',
  'by_reason',
  'by_age_bucket',
];

const DEFAULT_LINKS: Record<string, MetricLink> = {
  fail_count: { view: 'job-cards', params: { filter: 'qc_failed' } },
  total_qc_jobs: { view: 'job-cards', params: { filter: 'qc' } },
  fail_rate_pct: { view: 'job-cards', params: { filter: 'qc_failed' } },
  total_jobs: { view: 'job-cards', params: { filter: 'active' } },
  approved: { view: 'job-cards' },
  pending: { view: 'job-cards' },
  technician_count: { view: 'technicians' },
  total_sold_hours: { view: 'technicians' },
  avg_efficiency_pct: { view: 'technicians' },
  advisor_count: { view: 'service-advisors' },
  total_net_sales: { view: 'invoices' },
  arrival_rate_pct: { view: 'appointments' },
  follow_ups: { view: 'reports', params: { section: 'crm', report: 'customer_follow_up' } },
  outstanding: { view: 'reports', params: { section: 'crm', report: 'customer_follow_up' } },
  avg_rating: { view: 'reports', params: { section: 'crm', report: 'customer_satisfaction' } },
  retention_rate_pct: { view: 'reports', params: { section: 'crm', report: 'customer_retention' } },
  audit_events: { view: 'reports', params: { section: 'compliance', report: 'user_audit_trail' } },
  odometer_exceptions: {
    view: 'reports',
    params: { section: 'compliance', report: 'odometer_exception' },
  },
  events: { view: 'reports', params: { section: 'compliance', report: 'user_audit_trail' } },
  exception_count: {
    view: 'reports',
    params: { section: 'compliance', report: 'odometer_exception' },
  },
};

export function DefaultSectionDashboard({ data }: { data: SectionDashboard }) {
  const { navigate } = useNavigation();
  const summary = data.summary || {};
  const go = (link: MetricLink) => navigate(link.view, link.params);
  const statusData = chartFromBreakdown(summary, 'by_status');
  const reasonData = chartFromBreakdown(summary, 'by_reason');
  const monthData = chartFromBreakdown(summary, 'by_month');

  return (
    <DashboardShell>
      <KpiCards summary={summary} skip={SKIP} max={4} links={DEFAULT_LINKS} onNavigate={go} />
      <div className="grid gap-3 lg:grid-cols-2">
        {statusData.length > 0 ? (
          <StatusPieChart
            title="By status"
            data={statusData}
            onSliceClick={(status) => {
              if (data.section_id === 'qc' || data.section_id === 'warranty') {
                navigate('job-cards', status ? { status } : { filter: 'qc' });
                return;
              }
              if (data.section_id === 'advisor') {
                navigate('appointments');
                return;
              }
              if (status) navigate('job-cards', { status });
            }}
          />
        ) : null}
        {reasonData.length > 0 ? (
          <StatusPieChart
            title="By reason"
            data={reasonData}
            onSliceClick={() => {
              if (data.section_id === 'qc') navigate('job-cards', { filter: 'qc_failed' });
            }}
          />
        ) : (
          <BreakdownChart
            title="Trend"
            data={monthData}
            onBarClick={() => {
              if (data.section_id === 'finance') navigate('invoices');
            }}
          />
        )}
      </div>
    </DashboardShell>
  );
}
