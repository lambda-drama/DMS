'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/contexts/auth-context';
import { useNavigation } from '@/contexts/navigation-context';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { cn } from '@/lib/utils';
import { resetAppScroll } from '@/lib/reset-app-scroll';
import { fetchDmsCustomerDefaults } from '@/services/common';
import { Loader2 } from 'lucide-react';

function DmsCustomerDefaultsPrefetch() {
  useSWR('dms-customer-defaults', fetchDmsCustomerDefaults, {
    dedupingInterval: 2000,
    revalidateOnFocus: true,
    revalidateOnMount: true,
  });
  return null;
}

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeView } = useNavigation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    setSidebarOpen(false);
    resetAppScroll(mainRef.current);
  }, [activeView]);

  useEffect(() => {
    const t = window.setTimeout(() => resetAppScroll(mainRef.current), 50);
    return () => window.clearTimeout(t);
  }, [activeView]);

  // iOS Safari scrolls the outer page/layout viewport to reveal a focused input
  // above the on-screen keyboard, but does not restore it when the keyboard
  // closes. That leaves dead space above the fixed action bar (a gap Android
  // never shows). Snap the window/document scroll back to 0 once nothing is
  // being edited so the layout re-anchors to the fixed footer.
  useEffect(() => {
    const isIOS =
      /iP(hone|ad|od)/.test(navigator.platform) ||
      (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.userAgent));
    if (!isIOS) return;

    const isEditing = () => {
      const el = document.activeElement as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      );
    };

    const snapBack = () => {
      // Don't yank the view while the user is still typing (e.g. moving between
      // fields) — only correct the leftover shift once editing has stopped.
      if (isEditing()) return;
      if (window.scrollX !== 0 || window.scrollY !== 0) window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    const onFocusOut = () => window.setTimeout(snapBack, 100);
    const onWindowScroll = () => {
      if (!isEditing()) snapBack();
    };

    document.addEventListener('focusout', onFocusOut);
    window.addEventListener('scroll', onWindowScroll, { passive: true });
    window.visualViewport?.addEventListener('resize', onFocusOut);

    return () => {
      document.removeEventListener('focusout', onFocusOut);
      window.removeEventListener('scroll', onWindowScroll);
      window.visualViewport?.removeEventListener('resize', onFocusOut);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-dvh max-h-dvh overflow-hidden bg-background">
      <DmsCustomerDefaultsPrefetch />
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex h-dvh w-64 flex-col overflow-hidden transform transition-transform duration-200 ease-in-out lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar onNavigate={() => setSidebarOpen(false)} />
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main
          ref={mainRef}
          className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain p-3 sm:p-4 lg:p-6"
        >
          <div key={activeView} className="min-w-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
