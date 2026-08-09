'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import useSWR from 'swr';
import { fetchWorkspaceAccess, type WorkspaceAccess } from '@/services/common';
import { useAuth } from '@/contexts/auth-context';

export type AppWorkspace = 'dms' | 'crm';

const STORAGE_KEY = 'dms-app-workspace';

const DEFAULT_ACCESS: WorkspaceAccess = {
  listed: false,
  access_limited_to: '',
  can_access_dms: true,
  can_access_crm: true,
  can_view_staff_audit: false,
  can_switch_workspace: true,
};

interface WorkspaceContextType {
  workspace: AppWorkspace;
  setWorkspace: (ws: AppWorkspace) => void;
  switchToCrm: () => void;
  switchToDms: () => void;
  isCrm: boolean;
  access: WorkspaceAccess;
  accessLoading: boolean;
  canAccessDms: boolean;
  canAccessCrm: boolean;
  canViewStaffAudit: boolean;
  canSwitchWorkspace: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: 'dms',
  setWorkspace: () => {},
  switchToCrm: () => {},
  switchToDms: () => {},
  isCrm: false,
  access: DEFAULT_ACCESS,
  accessLoading: true,
  canAccessDms: true,
  canAccessCrm: true,
  canViewStaffAudit: false,
  canSwitchWorkspace: true,
});

function readStored(): AppWorkspace {
  if (typeof window === 'undefined') return 'dms';
  const fromQuery = new URLSearchParams(window.location.search).get('workspace');
  if (fromQuery === 'crm' || fromQuery === 'dms') {
    return fromQuery;
  }
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'crm' ? 'crm' : 'dms';
}

function resolveAllowedWorkspace(
  preferred: AppWorkspace,
  access: WorkspaceAccess
): AppWorkspace {
  if (preferred === 'crm' && access.can_access_crm) return 'crm';
  if (preferred === 'dms' && access.can_access_dms) return 'dms';
  if (access.can_access_crm && !access.can_access_dms) return 'crm';
  if (access.can_access_dms && !access.can_access_crm) return 'dms';
  return preferred;
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [workspace, setWorkspaceState] = useState<AppWorkspace>('dms');

  const { data: accessData, isLoading: accessLoading } = useSWR(
    isAuthenticated ? 'dms-workspace-access' : null,
    fetchWorkspaceAccess,
    {
      revalidateOnFocus: true,
      dedupingInterval: 5000,
    }
  );

  const access = accessData || DEFAULT_ACCESS;

  useEffect(() => {
    const initial = readStored();
    setWorkspaceState(initial);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, initial);
      document.documentElement.dataset.workspace = initial;
    }
  }, []);

  // Enforce DMS CRM User Settings limits once access loads.
  useEffect(() => {
    if (accessLoading && !accessData) return;
    const allowed = resolveAllowedWorkspace(workspace, access);
    if (allowed !== workspace) {
      setWorkspaceState(allowed);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, allowed);
        document.documentElement.dataset.workspace = allowed;
      }
    }
  }, [access, accessData, accessLoading, workspace]);

  const setWorkspace = useCallback(
    (ws: AppWorkspace) => {
      if (ws === 'crm' && !access.can_access_crm) return;
      if (ws === 'dms' && !access.can_access_dms) return;
      setWorkspaceState(ws);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, ws);
        document.documentElement.dataset.workspace = ws;
      }
    },
    [access.can_access_crm, access.can_access_dms]
  );

  useEffect(() => {
    document.documentElement.dataset.workspace = workspace;
  }, [workspace]);

  const switchToCrm = useCallback(() => setWorkspace('crm'), [setWorkspace]);
  const switchToDms = useCallback(() => setWorkspace('dms'), [setWorkspace]);

  const value = useMemo(
    () => ({
      workspace,
      setWorkspace,
      switchToCrm,
      switchToDms,
      isCrm: workspace === 'crm',
      access,
      accessLoading: Boolean(isAuthenticated && accessLoading && !accessData),
      canAccessDms: access.can_access_dms,
      canAccessCrm: access.can_access_crm,
      canViewStaffAudit: access.can_view_staff_audit,
      canSwitchWorkspace: access.can_switch_workspace,
    }),
    [
      workspace,
      setWorkspace,
      switchToCrm,
      switchToDms,
      access,
      accessLoading,
      accessData,
      isAuthenticated,
    ]
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
