/**
 * Core API client following the healthcare app pattern.
 * Uses direct fetch() with credentials: 'include' and CSRF token handling.
 * No generic createDoc/getDoc abstractions — each service file calls
 * whitelisted methods or Frappe REST endpoints directly.
 */

let csrfFetchInFlight: Promise<string | null> | null = null;

export async function ensureCSRF(): Promise<string | null> {
  const win = typeof window !== 'undefined' ? (window as Record<string, unknown>) : null;
  if (win?.csrf_token && typeof win.csrf_token === 'string') {
    return win.csrf_token;
  }

  if (csrfFetchInFlight) return csrfFetchInFlight;

  csrfFetchInFlight = (async () => {
    try {
      const res = await fetch('/api/method/frappe.sessions.get_csrf_token', {
        credentials: 'include',
      });
      const data = await res.json();
      const token = data?.message || null;
      if (token && win) {
        win.csrf_token = token;
      }
      return token;
    } catch {
      return null;
    } finally {
      csrfFetchInFlight = null;
    }
  })();

  return csrfFetchInFlight;
}

export function clearCSRF() {
  const win = typeof window !== 'undefined' ? (window as Record<string, unknown>) : null;
  if (win) delete win.csrf_token;
}

function getCSRF(): string | null {
  const win = typeof window !== 'undefined' ? (window as Record<string, unknown>) : null;
  return (win?.csrf_token as string) || null;
}

function buildHeaders(method: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (method !== 'GET') {
    const csrf = getCSRF();
    if (csrf) headers['X-Frappe-CSRF-Token'] = csrf;
  }
  return headers;
}

function parseError(resData: Record<string, unknown>): string {
  if (resData._server_messages) {
    try {
      const msgs = JSON.parse(resData._server_messages as string);
      if (Array.isArray(msgs) && msgs.length > 0) {
        const first = JSON.parse(msgs[0]);
        return first.message || msgs[0];
      }
      return String(resData._server_messages);
    } catch {
      return String(resData._server_messages);
    }
  }
  if (resData.exc_type) return String(resData.exc_type);
  if (resData.message) return String(resData.message);
  return 'Request failed';
}

/**
 * Core request wrapper with CSRF auto-retry.
 * Handles CSRF token injection, credentials, and error parsing.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method?.toUpperCase() || 'GET';

  if (method !== 'GET') {
    await ensureCSRF();
  }

  options.headers = buildHeaders(method);
  options.credentials = 'include';

  let response = await fetch(path, options);

  if (!response.ok && response.status === 403 && method !== 'GET') {
    clearCSRF();
    await ensureCSRF();
    options.headers = buildHeaders(method);
    response = await fetch(path, options);
  }

  const resData = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(parseError(resData as Record<string, unknown>));
  }

  if (resData.data !== undefined) return resData.data as T;
  if (resData.message !== undefined) return resData.message as T;
  return resData as T;
}
