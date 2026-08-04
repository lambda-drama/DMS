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
} from '@/components/reports/dashboards/shared';

const SKIP = [
  'by_status',
  'by_month',
  'by_branch',
  'by_stage',
  'by_classification',
  'by_disposition',
  'by_source',
  'by_channel',
];

const LINKS: Record<string, MetricLink> = {
  new_leads: { view: 'crm-reports', params: { section: 'crm_executive', report: 'crm_exec_pipeline' } },
  qualified_leads: {
    view: 'crm-reports',
    params: { section: 'crm_executive', report: 'crm_exec_pipeline' },
  },
  open_pipeline_value: {
    view: 'crm-reports',
    params: { section: 'crm_executive', report: 'crm_exec_forecast' },
  },
  weighted_forecast: {
    view: 'crm-reports',
    params: { section: 'crm_sales', report: 'crm_opportunity_pipeline' },
  },
  lead_to_sale_pct: {
    view: 'crm-reports',
    params: { section: 'crm_executive', report: 'crm_exec_conversion' },
  },
  deliveries: {
    view: 'crm-reports',
    params: { section: 'crm_executive', report: 'crm_exec_delivery' },
  },
  service_overdue: {
    view: 'crm-reports',
    params: { section: 'crm_aftersales', report: 'crm_service_due' },
  },
  service_lapsed: {
    view: 'crm-reports',
    params: { section: 'crm_aftersales', report: 'crm_lapsed_recovery' },
  },
  open_complaints: {
    view: 'crm-reports',
    params: { section: 'crm_executive', report: 'crm_exec_complaints' },
  },
  sla_breaches: {
    view: 'crm-reports',
    params: { section: 'crm_aftersales', report: 'crm_complaint_aging' },
  },
  campaign_leads: {
    view: 'crm-reports',
    params: { section: 'crm_call_campaign', report: 'crm_campaign_funnel' },
  },
  open_opportunities: {
    view: 'crm-reports',
    params: { section: 'crm_sales', report: 'crm_opportunity_pipeline' },
  },
  won_in_period: {
    view: 'crm-reports',
    params: { section: 'crm_sales', report: 'crm_salesperson_performance' },
  },
  calls_attempted: {
    view: 'crm-reports',
    params: { section: 'crm_call_campaign', report: 'crm_calls_attempted' },
  },
  contact_rate_pct: {
    view: 'crm-reports',
    params: { section: 'crm_call_campaign', report: 'crm_contact_appointment_rate' },
  },
};

export function CrmSectionDashboard({ data }: { data: SectionDashboard }) {
  const { navigate } = useNavigation();
  const summary = data.summary || {};
  const go = (link: MetricLink) => navigate(link.view, link.params);
  const statusData =
    chartFromBreakdown(summary, 'by_status') ||
    chartFromBreakdown(summary, 'by_stage') ||
    chartFromBreakdown(summary, 'by_classification') ||
    chartFromBreakdown(summary, 'by_disposition');
  const monthData = chartFromBreakdown(summary, 'by_month');
  const branchData = chartFromBreakdown(summary, 'by_branch');

  return (
    <DashboardShell>
      <KpiCards summary={summary} skip={SKIP} max={8} links={LINKS} onNavigate={go} />
      <div className="grid gap-3 lg:grid-cols-2">
        {statusData.length > 0 ? (
          <StatusPieChart
            title="Distribution"
            data={statusData}
            onSliceClick={() =>
              navigate('crm-reports', {
                section: data.section_id,
                report: data.section_id === 'crm_sales' ? 'crm_sales_funnel' : 'crm_exec_pipeline',
              })
            }
          />
        ) : null}
        {monthData.length > 0 ? (
          <BreakdownChart title="By month" data={monthData} />
        ) : branchData.length > 0 ? (
          <BreakdownChart title="By branch" data={branchData} />
        ) : null}
      </div>
    </DashboardShell>
  );
}
