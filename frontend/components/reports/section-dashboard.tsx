'use client';

import type { SectionDashboard } from '@/services/reports';
import { DefaultSectionDashboard } from './dashboards/default-dashboard';
import { ExecutiveDashboard } from './dashboards/executive-dashboard';
import { FinanceDashboard } from './dashboards/finance-dashboard';
import { PartsDashboard } from './dashboards/parts-dashboard';
import { WorkshopDashboard } from './dashboards/workshop-dashboard';

export function SectionDashboardView({ data }: { data: SectionDashboard }) {
  switch (data.section_id) {
    case 'workshop':
      return <WorkshopDashboard data={data} />;
    case 'executive':
      return <ExecutiveDashboard data={data} />;
    case 'finance':
      return <FinanceDashboard data={data} />;
    case 'parts':
      return <PartsDashboard data={data} />;
    default:
      return <DefaultSectionDashboard data={data} />;
  }
}
