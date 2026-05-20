import { apiRequest } from './apiClient';
import type { DmsPermissionsMap } from '@/lib/dms-permissions';

const API = 'dms.api.permissions';

export async function fetchDmsUiPermissions(): Promise<DmsPermissionsMap> {
  return apiRequest<DmsPermissionsMap>(`/api/method/${API}.get_dms_ui_permissions`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}
