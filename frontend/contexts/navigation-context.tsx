'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { resetAppScroll } from '@/lib/reset-app-scroll';

const DMS_VIEWS = [
  'dashboard',
  'appointments', 'appointment-detail', 'appointment-new',
  'inspections', 'inspection-detail', 'inspection-new',
  'service-estimates', 'estimate-detail',
  'job-cards', 'job-card-detail', 'job-card-new',
  'parts-requisitions', 'parts-requisition-detail',
  'deliveries', 'delivery-new',
  'invoices', 'invoice-new',
  'follow-ups', 'follow-up-new',
  'technicians', 'technician-detail',
  'service-advisors',
  'parts-advisors',
  'spare-parts',
  'vehicle-services',
  'item-prices',
  'customers',
  'vehicles', 'vehicle-new',
  'reports',
  'stock-entry',
  'stock-reconciliation',
  'material-request',
  'pending-material-requests',
  'purchase-receipt',
  'spare-part-sales',
  'proforma-invoices', 'proforma-invoice-new',
  'inventory-dashboard',
  'settings',
] as const;

const CRM_VIEWS = [
  'crm-dashboard',
  'crm-leads',
  'crm-lead-new',
  'crm-lead-detail',
  'crm-opportunities',
  'crm-opportunity-new',
  'crm-opportunity-detail',
  'crm-sales-appointments',
  'crm-sales-appointment-new',
  'crm-sales-appointment-detail',
  'crm-contacts',
  'crm-customers',
  'crm-customer-new',
  'crm-customer-detail',
  'crm-vehicles',
  'crm-vehicle-detail',
  'crm-activities',
  'crm-activity-new',
  'crm-activity-detail',
  'crm-approvals',
  'crm-call-logs',
  'crm-call-log-new',
  'crm-call-log-detail',
  'crm-call-center',
  'crm-test-drives',
  'crm-test-drive-detail',
  'crm-delivery-readiness',
  'crm-delivery-readiness-detail',
  'crm-bookings',
  'crm-quotations',
  'crm-quotation-detail',
  'crm-accounts',
  'crm-account-new',
  'crm-account-detail',
  'crm-tenders',
  'crm-tender-new',
  'crm-tender-detail',
  'crm-fleet-aftersales',
  'crm-service-retention',
  'crm-calendar',
  'crm-cases',
  'crm-case-new',
  'crm-case-detail',
  'crm-campaigns',
  'crm-campaign-new',
  'crm-campaign-detail',
  'crm-segment-new',
  'crm-segment-detail',
  'crm-loyalty',
  'crm-referrals',
  'crm-referral-detail',
  'crm-reports',
  'crm-staff-audit',
] as const;

const ALL_VIEWS = [...DMS_VIEWS, ...CRM_VIEWS];

const VIEW_GROUPS: Record<string, string> = {
  'dashboard': 'dashboard',
  'appointments': 'appointments',
  'appointment-detail': 'appointments',
  'appointment-new': 'appointments',
  'inspections': 'inspections',
  'inspection-detail': 'inspections',
  'inspection-new': 'inspections',
  'service-estimates': 'service-estimates',
  'estimate-detail': 'service-estimates',
  'job-cards': 'job-cards',
  'job-card-detail': 'job-cards',
  'job-card-new': 'job-cards',
  'parts-requisitions': 'parts-requisitions',
  'parts-requisition-detail': 'parts-requisitions',
  'deliveries': 'deliveries',
  'delivery-new': 'deliveries',
  'invoices': 'invoices',
  'invoice-new': 'invoices',
  'follow-ups': 'follow-ups',
  'follow-up-new': 'follow-ups',
  'technicians': 'technicians',
  'technician-detail': 'technicians',
  'service-advisors': 'service-advisors',
  'parts-advisors': 'parts-advisors',
  'spare-parts': 'spare-parts',
  'vehicle-services': 'vehicle-services',
  'item-prices': 'item-prices',
  'customers': 'customers',
  'vehicles': 'vehicles',
  'vehicle-new': 'vehicles',
  'reports': 'reports',
  'stock-entry': 'stock-entry',
  'stock-reconciliation': 'stock-reconciliation',
  'material-request': 'material-request',
  'pending-material-requests': 'pending-material-requests',
  'purchase-receipt': 'purchase-receipt',
  'spare-part-sales': 'spare-part-sales',
  'proforma-invoices': 'proforma-invoices',
  'proforma-invoice-new': 'proforma-invoices',
  'inventory-dashboard': 'inventory-dashboard',
  'settings': 'settings',
  'crm-dashboard': 'crm-dashboard',
  'crm-leads': 'crm-leads',
  'crm-lead-new': 'crm-leads',
  'crm-lead-detail': 'crm-leads',
  'crm-opportunities': 'crm-opportunities',
  'crm-opportunity-new': 'crm-opportunities',
  'crm-opportunity-detail': 'crm-opportunities',
  'crm-sales-appointments': 'crm-sales-appointments',
  'crm-sales-appointment-new': 'crm-sales-appointments',
  'crm-sales-appointment-detail': 'crm-sales-appointments',
  'crm-contacts': 'crm-contacts',
  'crm-customers': 'crm-customers',
  'crm-customer-new': 'crm-customers',
  'crm-customer-detail': 'crm-customers',
  'crm-vehicles': 'crm-vehicles',
  'crm-vehicle-detail': 'crm-vehicles',
  'crm-activities': 'crm-activities',
  'crm-activity-new': 'crm-activities',
  'crm-activity-detail': 'crm-activities',
  'crm-approvals': 'crm-approvals',
  'crm-call-logs': 'crm-call-logs',
  'crm-call-log-new': 'crm-call-logs',
  'crm-call-log-detail': 'crm-call-logs',
  'crm-call-center': 'crm-call-center',
  'crm-test-drives': 'crm-test-drives',
  'crm-test-drive-detail': 'crm-test-drives',
  'crm-delivery-readiness': 'crm-delivery-readiness',
  'crm-delivery-readiness-detail': 'crm-delivery-readiness',
  'crm-bookings': 'crm-bookings',
  'crm-quotations': 'crm-quotations',
  'crm-quotation-detail': 'crm-quotations',
  'crm-accounts': 'crm-accounts',
  'crm-account-new': 'crm-accounts',
  'crm-account-detail': 'crm-accounts',
  'crm-tenders': 'crm-tenders',
  'crm-tender-new': 'crm-tenders',
  'crm-tender-detail': 'crm-tenders',
  'crm-fleet-aftersales': 'crm-fleet-aftersales',
  'crm-service-retention': 'crm-service-retention',
  'crm-calendar': 'crm-calendar',
  'crm-cases': 'crm-cases',
  'crm-case-new': 'crm-cases',
  'crm-case-detail': 'crm-cases',
  'crm-campaigns': 'crm-campaigns',
  'crm-campaign-new': 'crm-campaigns',
  'crm-campaign-detail': 'crm-campaigns',
  'crm-segment-new': 'crm-campaigns',
  'crm-segment-detail': 'crm-campaigns',
  'crm-loyalty': 'crm-loyalty',
  'crm-referrals': 'crm-referrals',
  'crm-referral-detail': 'crm-referrals',
  'crm-reports': 'crm-reports',
  'crm-staff-audit': 'crm-staff-audit',
};

export function isCrmView(view: string): boolean {
  return view.startsWith('crm-');
}

interface NavigationContextType {
  activeView: string;
  viewParams: URLSearchParams;
  navigate: (view: string, params?: Record<string, string>) => void;
  viewGroup: string;
}

function parseHash(): { view: string; params: URLSearchParams } {
  if (typeof window === 'undefined') return { view: '', params: new URLSearchParams() };
  const raw = window.location.hash.replace('#', '').trim();
  const qIdx = raw.indexOf('?');
  const view = (qIdx >= 0 ? raw.slice(0, qIdx) : raw).trim().toLowerCase();
  const search = qIdx >= 0 ? raw.slice(qIdx) : '';
  return {
    view: ALL_VIEWS.includes(view as (typeof ALL_VIEWS)[number]) ? view : '',
    params: new URLSearchParams(search),
  };
}

const NavigationContext = createContext<NavigationContextType>({
  activeView: 'dashboard',
  viewParams: new URLSearchParams(),
  navigate: () => {},
  viewGroup: 'dashboard',
});

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [activeView, setActiveView] = useState('dashboard');
  const [viewParams, setViewParams] = useState<URLSearchParams>(new URLSearchParams());

  const navigate = useCallback((view: string, params?: Record<string, string>) => {
    const paramsObj = params && Object.keys(params).length > 0 ? params : undefined;
    let hash = `#${view}`;
    if (paramsObj) {
      hash += `?${new URLSearchParams(paramsObj).toString()}`;
    }

    setActiveView(view);
    setViewParams(new URLSearchParams(paramsObj ? paramsObj : {}));
    window.location.hash = hash;
    resetAppScroll();
    requestAnimationFrame(() => resetAppScroll());
  }, []);

  useEffect(() => {
    const update = () => {
      const { view, params } = parseHash();
      setActiveView(view || 'dashboard');
      setViewParams(params);
    };
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        activeView,
        viewParams,
        navigate,
        viewGroup: VIEW_GROUPS[activeView] || 'dashboard',
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
