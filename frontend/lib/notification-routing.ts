/** DMS notification bell: only these doctypes; maps to hash routes. */
export const DMS_NOTIFICATION_DOCTYPES = new Set([
  'Service Appointment',
  'DMS Job Card',
  'DMS Service Estimate',
  'DMS Parts Request',
]);

const DOCTYPE_ROUTES: Record<string, { view: string; paramKey?: string }> = {
  'Service Appointment': { view: 'appointment-detail' },
  'DMS Job Card': { view: 'job-card-detail' },
  'DMS Service Estimate': { view: 'estimate-detail' },
  'DMS Parts Request': { view: 'parts-requisition-detail' },
};

export function isDmsNotificationDoctype(documentType?: string | null): boolean {
  return DMS_NOTIFICATION_DOCTYPES.has((documentType || '').trim());
}

export function notificationNavigationTarget(
  documentType?: string | null,
  documentName?: string | null,
): { view: string; params: Record<string, string> } | null {
  const doctype = (documentType || '').trim();
  const name = (documentName || '').trim();
  if (!doctype || !name || !isDmsNotificationDoctype(doctype)) return null;

  const route = DOCTYPE_ROUTES[doctype];
  if (!route) return null;

  const paramKey = route.paramKey || 'id';
  return { view: route.view, params: { [paramKey]: name } };
}

export function stripNotificationHtml(html?: string | null): string {
  const raw = (html || '').trim();
  if (!raw) return '';
  if (typeof document === 'undefined') {
    return raw.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const el = document.createElement('div');
  el.innerHTML = raw;
  return (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
}
