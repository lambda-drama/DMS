'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';

export type AppWorkspace = 'dms' | 'crm';

const STORAGE_KEY = 'dms-app-workspace';

interface WorkspaceContextType {
  workspace: AppWorkspace;
  setWorkspace: (ws: AppWorkspace) => void;
  switchToCrm: () => void;
  switchToDms: () => void;
  isCrm: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspace: 'dms',
  setWorkspace: () => {},
  switchToCrm: () => {},
  switchToDms: () => {},
  isCrm: false,
});

function readStored(): AppWorkspace {
  if (typeof window === 'undefined') return 'dms';
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === 'crm' ? 'crm' : 'dms';
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<AppWorkspace>('dms');

  useEffect(() => {
    setWorkspaceState(readStored());
  }, []);

  const setWorkspace = useCallback((ws: AppWorkspace) => {
    setWorkspaceState(ws);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, ws);
      document.documentElement.dataset.workspace = ws;
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.workspace = workspace;
  }, [workspace]);

  const switchToCrm = useCallback(() => setWorkspace('crm'), [setWorkspace]);
  const switchToDms = useCallback(() => setWorkspace('dms'), [setWorkspace]);

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        setWorkspace,
        switchToCrm,
        switchToDms,
        isCrm: workspace === 'crm',
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  return useContext(WorkspaceContext);
}
