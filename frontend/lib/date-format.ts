/**
 * Single source of truth for how dates are shown in the DMS frontend.
 *
 * The display format is pinned to `dd/mm/yyyy` (and `dd/mm/yyyy HH:mm`) so every
 * user sees the same thing no matter what locale their OS/browser is set to.
 * Never call `toLocaleDateString()` / `toLocaleString()` directly on a date —
 * use these helpers instead.
 *
 * Parsing rules (this is what keeps the day from shifting):
 *  - `YYYY-MM-DD`  → read as **local** midnight (JS would otherwise treat it as
 *                    UTC and show the previous day in negative-offset zones).
 *  - `YYYY-MM-DD HH:mm:ss` (Frappe datetimes) → read as local time.
 *  - Anything else (ISO with Z/offset, timestamps) → parsed normally.
 */

export type DateInput = string | number | Date | null | undefined;

const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

const LONG_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Parse any supported value into a valid `Date`, or `null` when unusable. */
export function parseDateValue(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'number') {
    const fromNumber = new Date(value);
    return Number.isNaN(fromNumber.getTime()) ? null : fromNumber;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  // Date-only: force local midnight so the calendar day never shifts.
  const dateOnly = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(raw);
  if (dateOnly) {
    return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  }

  // Frappe sends "YYYY-MM-DD HH:mm:ss" — normalise to ISO so it is local time.
  const normalised = raw.includes(' ') && !raw.includes('T') ? raw.replace(' ', 'T') : raw;
  const parsed = new Date(normalised);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** `dd/mm/yyyy` — e.g. 03/04/2026 */
export function formatDate(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** `dd/mm/yy` — compact form for tight table cells. */
export function formatDateShort(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
}

/** `03 Apr 2026` — unambiguous long form, for documents / print / reports. */
export function formatDateLong(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${pad2(d.getDate())} ${SHORT_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `dd/mm/yyyy HH:mm` (add `withSeconds` for audit trails). */
export function formatDateTime(
  value: DateInput,
  fallback = '',
  withSeconds = false
): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}${
    withSeconds ? `:${pad2(d.getSeconds())}` : ''
  }`;
  return `${formatDate(d)} ${time}`;
}

/** `HH:mm` (24-hour). */
export function formatTime(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** `Apr` */
export function formatMonthShort(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return SHORT_MONTHS[d.getMonth()];
}

/** `April 2026` */
export function formatMonthYear(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${LONG_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** `Mon` */
export function formatWeekdayShort(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return SHORT_WEEKDAYS[d.getDay()];
}

/** `Mon, 03/04/2026` */
export function formatWeekdayDate(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${SHORT_WEEKDAYS[d.getDay()]}, ${formatDate(d)}`;
}

/** `yyyy-mm-dd` — for API payloads and `<input type="date">` values. */
export function toISODate(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** `yyyy-mm-ddTHH:mm` — for `<input type="datetime-local">` values. */
export function toISODateTime(value: DateInput, fallback = ''): string {
  const d = parseDateValue(value);
  if (!d) return fallback;
  return `${toISODate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** Today as `yyyy-mm-dd`. */
export function todayISO(): string {
  return toISODate(new Date());
}
