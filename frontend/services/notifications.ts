import { apiRequest } from './apiClient';

const API = 'dms.api.notifications';

export const DMS_NOTIFICATION_DOCTYPES = [
  'Service Appointment',
  'DMS Job Card',
  'DMS Service Estimate',
  'DMS Parts Request',
] as const;

export interface NotificationLogRow {
  name: string;
  subject?: string;
  document_type?: string;
  document_name?: string;
  from_user?: string;
  for_user?: string;
  type?: '' | 'Mention' | 'Assignment' | 'Share' | 'Alert';
  read?: number | boolean;
  creation?: string;
  link?: string;
}

export interface NotificationUserInfo {
  fullname?: string;
  user_image?: string;
}

export interface NotificationLogsResponse {
  notification_logs: NotificationLogRow[];
  user_info: Record<string, NotificationUserInfo>;
}

export async function fetchNotificationLogs(limit = 20): Promise<NotificationLogsResponse> {
  return apiRequest<NotificationLogsResponse>(`/api/method/${API}.get_dms_notification_logs`, {
    method: 'POST',
    body: JSON.stringify({ limit }),
  });
}

export async function markNotificationRead(docname: string): Promise<void> {
  await apiRequest(`/api/method/${API}.mark_dms_notifications_read`, {
    method: 'POST',
    body: JSON.stringify({ docname }),
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiRequest(`/api/method/${API}.mark_dms_notifications_read`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function triggerNotificationIndicatorHide(): Promise<void> {
  await apiRequest(
    '/api/method/frappe.desk.doctype.notification_log.notification_log.trigger_indicator_hide',
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
  );
}
