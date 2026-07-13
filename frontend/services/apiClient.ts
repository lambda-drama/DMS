/**
 * Core API client following the healthcare / Frappe Desk pattern:
 * direct fetch() with credentials, X-Frappe-CSRF-Token header, and csrf_token
 * on JSON bodies (see frappe.auth.HTTPRequest.validate_csrf_token — form_dict).
 */

let csrfFetchInFlight: Promise<string | null> | null = null;

const CSRF_API = '/api/method/dms.api.common.get_csrf_token';

function isUsableCsrf(token: string | null | undefined): token is string {
  if (!token || typeof token !== 'string') return false;
  const t = token.trim();
  // Reject unrendered Jinja / empty placeholders from the www template.
  if (!t || t.includes('{{') || t.includes('}}')) return false;
  return true;
}

function readCsrfFromMeta(): string | null {
  if (typeof document === 'undefined') return null;
  const el = document.querySelector('meta[name="csrf-token"]');
  const c = el?.getAttribute('content');
  return isUsableCsrf(c) ? c.trim() : null;
}

function writeCsrfToMeta(token: string): void {
  if (typeof document === 'undefined') return;
  let el = document.querySelector('meta[name="csrf-token"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'csrf-token');
    document.head.appendChild(el);
  }
  el.setAttribute('content', token);
}

function storeCsrf(token: string): void {
  const win = typeof window !== 'undefined' ? (window as Record<string, unknown>) : null;
  if (win) win.csrf_token = token;
  writeCsrfToMeta(token);
}

/**
 * Resolve CSRF for session-based requests.
 * @param forceRefresh Skip window/meta cache and fetch a fresh token from the server (after CSRF failures / login).
 */
export async function ensureCSRF(forceRefresh = false): Promise<string | null> {
  const win = typeof window !== 'undefined' ? (window as Record<string, unknown>) : null;

  if (!forceRefresh) {
    if (isUsableCsrf(win?.csrf_token as string | undefined)) {
      return (win!.csrf_token as string).trim();
    }
    const meta = readCsrfFromMeta();
    if (meta) {
      if (win) win.csrf_token = meta;
      return meta;
    }
  }

  if (csrfFetchInFlight) return csrfFetchInFlight;

  csrfFetchInFlight = (async () => {
    try {
      // GET is CSRF-exempt; dms.api.common.get_csrf_token is whitelisted
      // (frappe.sessions.get_csrf_token is not).
      const res = await fetch(CSRF_API, {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      const token = data?.message ?? null;
      if (isUsableCsrf(token)) {
        storeCsrf(token.trim());
        return token.trim();
      }
      return null;
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
  if (typeof document !== 'undefined') {
    const el = document.querySelector('meta[name="csrf-token"]');
    el?.setAttribute('content', '');
  }
}

function getCSRF(): string | null {
  const win = typeof window !== 'undefined' ? (window as Record<string, unknown>) : null;
  const token = win?.csrf_token as string | undefined;
  return isUsableCsrf(token) ? token.trim() : null;
}

function mergeHeaders(
  base: Record<string, string>,
  extra?: HeadersInit
): Record<string, string> {
  const out: Record<string, string> = { ...base };
  if (!extra) return out;
  if (extra instanceof Headers) {
    extra.forEach((v, k) => {
      out[k] = v;
    });
    return out;
  }
  if (Array.isArray(extra)) {
    for (const [k, v] of extra) {
      out[k] = v;
    }
    return out;
  }
  Object.assign(out, extra as Record<string, string>);
  return out;
}

/** Frappe merges JSON POST bodies into form_dict; csrf_token there satisfies validate_csrf_token. */
function injectCsrfIntoJsonBody(
  body: BodyInit | null | undefined,
  csrf: string | null
): BodyInit | null | undefined {
  if (!csrf || body === undefined || body === null) return body;
  if (typeof body !== 'string') return body;
  try {
    const parsed = JSON.parse(body) as unknown;
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return JSON.stringify({
        ...(parsed as Record<string, unknown>),
        csrf_token: csrf,
      });
    }
  } catch {
    /* not JSON */
  }
  return body;
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

function isCSRFErrorPayload(resData: Record<string, unknown>): boolean {
  if (resData.exc_type === 'CSRFTokenError') return true;
  const exc = String(resData.exc ?? '');
  return exc.includes('CSRFTokenError');
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
 * Core request wrapper with CSRF header + JSON body token and retry on CSRF failure.
 * Frappe raises CSRFTokenError with HTTP 400 (not 403), so we retry on 400 + exc_type as well.
 */
export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method?.toUpperCase() || 'GET') as string;

  const run = async (isCsrfRetry: boolean): Promise<{ response: Response; resData: Record<string, unknown> }> => {
    if (method !== 'GET') {
      await ensureCSRF(isCsrfRetry);
    }

    const headers = mergeHeaders(buildHeaders(method), options.headers);
    const csrf = method !== 'GET' ? getCSRF() : null;
    const body =
      method !== 'GET' ? injectCsrfIntoJsonBody(options.body ?? null, csrf) : options.body;

    const response = await fetch(path, {
      ...options,
      headers,
      body: body ?? options.body,
      credentials: 'include',
    });

    const resData = (await response.json().catch(() => ({}))) as Record<string, unknown>;
    return { response, resData };
  };

  let { response, resData } = await run(false);

  if (
    !response.ok &&
    method !== 'GET' &&
    (response.status === 403 ||
      (response.status === 400 && isCSRFErrorPayload(resData)))
  ) {
    clearCSRF();
    ({ response, resData } = await run(true));
  }

  if (!response.ok) {
    throw new Error(parseError(resData));
  }

  if (resData.data !== undefined) return resData.data as T;
  if (resData.message !== undefined) return resData.message as T;
  return resData as T;
}
