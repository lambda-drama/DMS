'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import useSWR from 'swr';
import { useAuth } from '@/contexts/auth-context';
import * as permissionsSvc from '@/services/permissions';
import {
  permissionModuleForView,
  truthy,
  type DmsPermissionModule,
  type DmsModulePermissions,
  type DmsPermissionsMap,
} from '@/lib/dms-permissions';

interface PermissionsContextType {
  permissions: DmsPermissionsMap;
  isLoading: boolean;
  canAccessView: (view: string) => boolean;
  canRead: (module: DmsPermissionModule) => boolean;
  canCreate: (module: DmsPermissionModule) => boolean;
  canWrite: (module: DmsPermissionModule) => boolean;
  canSubmit: (module: DmsPermissionModule) => boolean;
  canCancel: (module: DmsPermissionModule) => boolean;
  canDelete: (module: DmsPermissionModule) => boolean;
  getModule: (module: DmsPermissionModule) => DmsModulePermissions | undefined;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  const { data, isLoading } = useSWR(
    isAuthenticated ? ['dms-ui-permissions', user?.name] : null,
    () => permissionsSvc.fetchDmsUiPermissions(),
    { revalidateOnFocus: true, dedupingInterval: 60_000 }
  );

  const permissions = data ?? {};

  const getModule = useCallback(
    (module: DmsPermissionModule) => permissions[module],
    [permissions]
  );

  const canAccessView = useCallback(
    (view: string) => {
      const module = permissionModuleForView(view);
      if (!module) return true;
      const p = permissions[module];
      if (!p) return false;
      // Dashboard/reports are synthetic — only the computed `visible` flag applies.
      if (module === 'dashboard' || module === 'reports') {
        return truthy(p.visible);
      }
      return truthy(p.visible) || truthy(p.read) || truthy(p.select);
    },
    [permissions]
  );

  const canRead = useCallback(
    (module: DmsPermissionModule) => {
      const p = permissions[module];
      if (module === 'dashboard' || module === 'reports') {
        return truthy(p?.visible);
      }
      return truthy(p?.read) || truthy(p?.select);
    },
    [permissions]
  );

  const canCreate = useCallback(
    (module: DmsPermissionModule) => truthy(permissions[module]?.create),
    [permissions]
  );

  const canWrite = useCallback(
    (module: DmsPermissionModule) => truthy(permissions[module]?.write),
    [permissions]
  );

  const canSubmit = useCallback(
    (module: DmsPermissionModule) => truthy(permissions[module]?.submit),
    [permissions]
  );

  const canCancel = useCallback(
    (module: DmsPermissionModule) => truthy(permissions[module]?.cancel),
    [permissions]
  );

  const canDelete = useCallback(
    (module: DmsPermissionModule) => truthy(permissions[module]?.delete),
    [permissions]
  );

  const value = useMemo(
    () => ({
      permissions,
      isLoading: isAuthenticated && isLoading,
      canAccessView,
      canRead,
      canCreate,
      canWrite,
      canSubmit,
      canCancel,
      canDelete,
      getModule,
    }),
    [
      permissions,
      isAuthenticated,
      isLoading,
      canAccessView,
      canRead,
      canCreate,
      canWrite,
      canSubmit,
      canCancel,
      canDelete,
      getModule,
    ]
  );

  return (
    <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return ctx;
}

/** Safe when provider may be missing (returns allow-all until loaded in tests). */
export function useViewPermission(view: string) {
  const ctx = useContext(PermissionsContext);
  const module = permissionModuleForView(view);

  if (!ctx || !module) {
    return {
      canAccess: true,
      canRead: true,
      canCreate: true,
      canWrite: true,
      canSubmit: true,
      isLoading: false,
    };
  }

  return {
    canAccess: ctx.canAccessView(view),
    canRead: ctx.canRead(module),
    canCreate: ctx.canCreate(module),
    canWrite: ctx.canWrite(module),
    canSubmit: ctx.canSubmit(module),
    isLoading: ctx.isLoading,
  };
}
