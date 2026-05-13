'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';

const ALL_VIEWS = [
  'dashboard',
  'appointments', 'appointment-detail', 'appointment-new',
  'inspections', 'inspection-detail', 'inspection-new',
  'job-cards', 'job-card-detail', 'job-card-new',
  'deliveries', 'delivery-new',
  'invoices', 'invoice-new',
  'technicians', 'technician-detail',
  'customers',
  'vehicles', 'vehicle-new',
];

const VIEW_GROUPS: Record<string, string> = {
  'dashboard': 'dashboard',
  'appointments': 'appointments',
  'appointment-detail': 'appointments',
  'appointment-new': 'appointments',
  'inspections': 'inspections',
  'inspection-detail': 'inspections',
  'inspection-new': 'inspections',
  'job-cards': 'job-cards',
  'job-card-detail': 'job-cards',
  'job-card-new': 'job-cards',
  'deliveries': 'deliveries',
  'delivery-new': 'deliveries',
  'invoices': 'invoices',
  'invoice-new': 'invoices',
  'technicians': 'technicians',
  'technician-detail': 'technicians',
  'customers': 'customers',
  'vehicles': 'vehicles',
  'vehicle-new': 'vehicles',
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
    let hash = `#${view}`;
    if (params && Object.keys(params).length > 0) {
      hash += `?${new URLSearchParams(params).toString()}`;
    }
    window.location.hash = hash;
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
