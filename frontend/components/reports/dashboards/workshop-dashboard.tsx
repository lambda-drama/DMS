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

export function WorkshopDashboard({ data }: { data: SectionDashboard }) {
  const { navigate } = useNavigation();
  const s = data.summary || {};
  const open = Number(s.open_job_cards) || 0;
  const overdue = Number(s.overdue_promised) || 0;
  const inShop = Number(s.total_in_workshop) || open;
  const go = (link: MetricLink) => navigate(link.view, link.params);

  return (
    <DashboardShell>
      <MetricStrip
        onNavigate={go}
        metrics={[
          {
            key: 'open',
            label: 'Open jobs',
            value: open,
            hint: 'Active WIP',
            href: { view: 'job-cards', params: { filter: 'active' } },
          },
          {
            key: 'overdue',
            label: 'Overdue',
            value: overdue,
            progress: open ? Math.min(100, (overdue / open) * 100) : 0,
            hint: 'Past promised time',
            href: { view: 'job-cards', params: { filter: 'overdue' } },
          },
          {
            key: 'in_shop',
            label: 'In workshop',
            value: inShop,
            hint: 'All open workshop jobs',
            href: { view: 'job-cards', params: { filter: 'active' } },
          },
          {
            key: 'on_track',
            label: 'On track',
            value: Math.max(0, open - overdue),
            progress: open ? Math.min(100, ((open - overdue) / open) * 100) : 0,
            hint: 'Active jobs',
            href: { view: 'job-cards', params: { filter: 'active' } },
          },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <StatusPieChart
          title="Status mix"
          data={chartFromBreakdown(s, 'by_status')}
          onSliceClick={(status) => {
            if (!status) return;
            navigate('job-cards', { status });
          }}
        />
        <BreakdownChart
          title="Age buckets"
          data={chartFromBreakdown(s, 'by_age_bucket')}
          onBarClick={() => navigate('job-cards', { filter: 'active' })}
        />
      </div>
    </DashboardShell>
  );
}
