'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { resetAppScroll } from '@/lib/reset-app-scroll';

const ALL_VIEWS = [
  'dashboard',
  'appointments', 'appointment-detail', 'appointment-new',
  'inspections', 'inspection-detail', 'inspection-new',
  'service-estimates', 'estimate-detail',
  'job-cards', 'job-card-detail', 'job-card-new',
  'parts-requisitions', 'parts-requisition-detail',
  'deliveries', 'delivery-new',
  'invoices', 'invoice-new',
  'technicians', 'technician-detail',
  'service-advisors',
  'parts-advisors',
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
];

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
  'technicians': 'technicians',
  'technician-detail': 'technicians',
  'service-advisors': 'service-advisors',
  'parts-advisors': 'parts-advisors',
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
};

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
    view: ALL_VIEWS.includes(view) ? view : '',
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
