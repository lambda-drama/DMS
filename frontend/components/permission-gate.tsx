'use client';

import { ShieldOff } from 'lucide-react';
import { usePermissions } from '@/contexts/permissions-context';
import { permissionModuleForView } from '@/lib/dms-permissions';
import { Button } from '@/components/ui/button';
import { useNavigation } from '@/contexts/navigation-context';

interface PermissionGateProps {
  view: string;
  children: React.ReactNode;
}

export function PermissionGate({ view, children }: PermissionGateProps) {
  const { canAccessView, canCreate, canRead, isLoading } = usePermissions();
  const { navigate } = useNavigation();
  const module = permissionModuleForView(view);
  const canUseDashboard = canAccessView('dashboard');

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  const allowed =
    module &&
    (view.endsWith('-new')
      ? canCreate(module)
      : canAccessView(view) && canRead(module));

  if (!allowed) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-6 text-center">
        <ShieldOff className="h-12 w-12 text-muted-foreground" />
        <div>
          <h2 className="text-lg font-semibold">No access 🔒</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Your role does not have permission to open{' '}
            {module ? <strong>{module.replace(/-/g, ' ')}</strong> : 'this section'} in DMS.
            Ask an administrator to update your role permissions in ERPNext.
          </p>
        </div>
        {canUseDashboard ? (
          <Button variant="outline" onClick={() => navigate('dashboard')}>
            Back to dashboard
          </Button>
        ) : null}
      </div>
    );
  }

  return <>{children}</>;
}
