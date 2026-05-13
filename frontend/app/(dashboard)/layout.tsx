import { AuthProvider } from '@/contexts/auth-context';
import { NavigationProvider } from '@/contexts/navigation-context';
import DashboardShell from './dashboard-shell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NavigationProvider>
        <DashboardShell>{children}</DashboardShell>
      </NavigationProvider>
    </AuthProvider>
  );
}
