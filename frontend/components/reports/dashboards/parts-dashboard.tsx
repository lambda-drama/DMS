'use client';

import type { SectionDashboard } from '@/services/reports';
import { useNavigation } from '@/contexts/navigation-context';
import {
  DashboardShell,
  MetricStrip,
  StatusPieChart,
  chartFromBreakdown,
  type MetricLink,
} from './shared';

export function PartsDashboard({ data }: { data: SectionDashboard }) {
  const { navigate } = useNavigation();
  const s = data.summary || {};
  const go = (link: MetricLink) => navigate(link.view, link.params);
  const requested = Number(s.requested) || 0;
  const issued = Number(s.issued) || 0;
  const backordered = Math.max(0, requested - issued);
  const fillMix = [
    ...(issued ? [{ name: 'Issued', fullName: 'Issued', value: issued }] : []),
    ...(backordered ? [{ name: 'Open / BO', fullName: 'Open', value: backordered }] : []),
  ];

  return (
    <DashboardShell>
      <MetricStrip
        onNavigate={go}
        metrics={[
          {
            key: 'open_requests',
            label: 'Open requests',
            value: s.open_requests,
            hint: 'Parts requisitions',
            href: { view: 'parts-requisitions', params: { filter: 'active' } },
          },
          {
            key: 'fill_rate_pct',
            label: 'Fill rate %',
            value: s.fill_rate_pct,
            progress: Number(s.fill_rate_pct) || 0,
            hint: 'Fill rate report',
            href: {
              view: 'reports',
              params: { section: 'parts', report: 'parts_fill_rate' },
            },
          },
          {
            key: 'requested',
            label: 'Qty requested',
            value: s.requested,
            hint: 'Parts issued report',
            href: {
              view: 'reports',
              params: { section: 'parts', report: 'parts_issued_per_job' },
            },
          },
          {
            key: 'issued',
            label: 'Qty issued',
            value: s.issued,
            hint: 'Parts requisitions',
            href: { view: 'parts-requisitions', params: { filter: 'active' } },
          },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        <StatusPieChart
          title="Request status"
          data={chartFromBreakdown(s, 'by_status')}
          onSliceClick={(status) => {
            if (!status) {
              navigate('parts-requisitions', { filter: 'active' });
              return;
            }
            navigate('parts-requisitions', { status });
          }}
        />
        <StatusPieChart
          title="Fill mix"
          data={fillMix.length ? fillMix : chartFromBreakdown(s, 'by_status')}
          onSliceClick={() =>
            navigate('reports', { section: 'parts', report: 'parts_fill_rate' })
          }
        />
      </div>
    </DashboardShell>
  );
}
