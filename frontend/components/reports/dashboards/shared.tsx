'use client';

import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { cn } from '@/lib/utils';
import { StarRating, isStarRatingField } from '@/components/reports/star-rating';

export function formatValue(value: unknown): string {
  if (value == null || value === '') return '—';
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? value.toLocaleString()
      : value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return String(value);
}

/** Compact axis ticks: 0, 12k, 1.2M — keeps labels fully visible. */
export function formatCompactAxis(value: number): string {
  const n = Number(value) || 0;
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${sign}${Math.round(abs).toLocaleString()}`;
}

export function formatMoney(value: unknown, currency?: string | null): string {
  if (value == null || value === '') return '—';
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return String(value);
  const formatted = n.toLocaleString(undefined, {
    minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

export function humanLabel(key: string) {
  return key.replace(/_/g, ' ').replace(/\bpct\b/gi, '%');
}

/** Brand-aligned chart palette (gold first). */
export const CHART_COLORS = [
  'var(--dms-gold)',
  '#1E88E5',
  '#0F3D5E',
  '#2E7D32',
  '#C45C26',
  '#6B7280',
  '#7C3AED',
  '#0891B2',
];

export function chartFromBreakdown(summary: Record<string, unknown>, key: string) {
  const raw = summary[key];
  if (!raw) return [];
  // Array form: [{label, value}] from some CRM summaries
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const obj = item as Record<string, unknown>;
        const name = String(obj.label ?? obj.name ?? '—');
        const n = typeof obj.value === 'number' ? obj.value : Number(obj.value) || 0;
        return {
          name: name.length > 14 ? `${name.slice(0, 12)}…` : name,
          fullName: name,
          value: n,
        };
      })
      .filter((d): d is { name: string; fullName: string; value: number } => !!d && d.value !== 0)
      .slice(0, 8);
  }
  if (typeof raw !== 'object') return [];
  return Object.entries(raw as Record<string, unknown>)
    .map(([name, value]) => {
      let n = 0;
      if (typeof value === 'number') n = value;
      else if (value && typeof value === 'object') {
        const obj = value as Record<string, unknown>;
        if (typeof obj.gross_profit === 'number') n = obj.gross_profit;
        else if (typeof obj.net === 'number') n = obj.net;
        else if (typeof obj.count === 'number') n = obj.count;
        else if (typeof obj.actual === 'number') n = obj.actual;
        else if (typeof obj.value === 'number') n = obj.value;
      }
      return { name: name.length > 14 ? `${name.slice(0, 12)}…` : name, fullName: name, value: n };
    })
    .filter((d) => d.value !== 0)
    .slice(0, 8);
}

export type MetricLink = {
  view: string;
  params?: Record<string, string>;
};

export type Metric = {
  key: string;
  label?: string;
  value: unknown;
  hint?: string;
  progress?: number;
  /** Render as 1–5 star rating instead of plain number */
  display?: 'stars' | 'money';
  currency?: string | null;
  href?: MetricLink;
};

export function MetricStrip({
  metrics,
  onNavigate,
}: {
  metrics: Metric[];
  onNavigate?: (link: MetricLink) => void;
}) {
  if (!metrics.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((m) => {
        const clickable = Boolean(m.href && onNavigate);
        const className = cn(
          'rounded-lg border border-border/80 bg-card px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition',
          clickable &&
            'cursor-pointer hover:border-dms-gold hover:bg-dms-gold-soft/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dms-gold/40'
        );
        const body = (
          <>
            <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-muted-foreground">
              {m.label || humanLabel(m.key)}
              {m.display === 'money' && m.currency ? (
                <span className="ml-1 font-normal normal-case tracking-normal">({m.currency})</span>
              ) : null}
            </p>
            {m.display === 'stars' ? (
              <div className="mt-1.5">
                <StarRating value={m.value} size="lg" />
              </div>
            ) : (
              <p className="mt-1 font-serif-display text-[1.65rem] font-semibold leading-none tracking-tight text-foreground tabular-nums">
                {m.display === 'money' ? formatMoney(m.value, m.currency) : formatValue(m.value)}
              </p>
            )}
            {typeof m.progress === 'number' ? (
              <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-dms-gold transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, m.progress))}%` }}
                />
              </div>
            ) : (
              <div className="mt-2.5 h-1 rounded-full bg-dms-gold/25" />
            )}
            {(m.hint || clickable) && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {m.hint || 'Click to open'}
              </p>
            )}
          </>
        );
        if (clickable) {
          return (
            <button key={m.key} type="button" className={className} onClick={() => onNavigate!(m.href!)}>
              {body}
            </button>
          );
        }
        return (
          <div key={m.key} className={className}>
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function KpiCards({
  summary,
  skip = [],
  prefer = [],
  max = 4,
  links = {},
  onNavigate,
}: {
  summary: Record<string, unknown>;
  skip?: string[];
  prefer?: string[];
  max?: number;
  links?: Record<string, MetricLink>;
  onNavigate?: (link: MetricLink) => void;
}) {
  const skipSet = new Set(skip);
  const entries = Object.entries(summary).filter(
    ([k, v]) => !skipSet.has(k) && (v == null || typeof v !== 'object')
  );
  const preferred = prefer
    .map((k) => entries.find(([ek]) => ek === k))
    .filter(Boolean) as [string, unknown][];
  const rest = entries.filter(([k]) => !prefer.includes(k));
  const picked = [...preferred, ...rest].slice(0, max);

  return (
    <MetricStrip
      onNavigate={onNavigate}
      metrics={picked.map(([key, value]) => ({
        key,
        value,
        href: links[key],
        display: isStarRatingField(key) ? 'stars' : undefined,
        progress:
          typeof value === 'number' && key.includes('pct')
            ? value
            : typeof value === 'number' && value > 0 && value <= 100 && key.includes('rate')
              ? value
              : undefined,
      }))}
    />
  );
}

export function BreakdownChart({
  title,
  data,
  color = 'var(--dms-gold)',
  className,
  onBarClick,
  currency,
  valueIsMoney = false,
}: {
  title: string;
  data: { name: string; value: number; fullName?: string }[];
  color?: string;
  className?: string;
  onBarClick?: (name: string) => void;
  currency?: string | null;
  valueIsMoney?: boolean;
}) {
  if (!data.length) return null;
  const money = valueIsMoney || Boolean(currency);
  return (
    <div className={cn('rounded-lg border border-border/80 bg-card p-3.5', className)}>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold tracking-tight text-foreground">{title}</p>
        {currency ? (
          <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground">
            {currency}
          </p>
        ) : null}
      </div>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              width={52}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => formatCompactAxis(Number(v))}
              allowDecimals={false}
            />
            <Tooltip
              formatter={(value) =>
                money
                  ? formatMoney(Number(value), currency)
                  : formatValue(Number(value))
              }
              contentStyle={{
                borderRadius: 8,
                border: '1px solid hsl(var(--border))',
                fontSize: 12,
              }}
            />
            <Bar
              dataKey="value"
              fill={color}
              radius={[3, 3, 0, 0]}
              maxBarSize={36}
              cursor={onBarClick ? 'pointer' : 'default'}
              onClick={(item) => {
                if (!onBarClick) return;
                const payload = (item as { payload?: { fullName?: string; name?: string } })?.payload;
                onBarClick(payload?.fullName || payload?.name || '');
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function StatusPieChart({
  title,
  data,
  className,
  onSliceClick,
  currency,
  valueIsMoney = false,
}: {
  title: string;
  data: { name: string; value: number; fullName?: string }[];
  className?: string;
  onSliceClick?: (name: string) => void;
  currency?: string | null;
  valueIsMoney?: boolean;
}) {
  if (!data.length) return null;
  const total = data.reduce((s, d) => s + d.value, 0);
  const money = valueIsMoney || Boolean(currency);
  return (
    <div className={cn('rounded-lg border border-border/80 bg-card p-3.5', className)}>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p className="text-[13px] font-semibold tracking-tight text-foreground">{title}</p>
        <p className="text-[11px] tabular-nums text-muted-foreground">
          {money ? formatMoney(total, currency) : `${total.toLocaleString()} total`}
        </p>
      </div>
      <div className="grid grid-cols-[1fr_auto] items-center gap-2">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={48}
                outerRadius={72}
                paddingAngle={2}
                cursor={onSliceClick ? 'pointer' : 'default'}
                onClick={(item) => {
                  if (!onSliceClick) return;
                  const payload = item as { fullName?: string; name?: string };
                  onSliceClick(payload.fullName || payload.name || '');
                }}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) =>
                  money
                    ? formatMoney(Number(value), currency)
                    : formatValue(Number(value))
                }
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid hsl(var(--border))',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="max-h-44 space-y-1.5 overflow-y-auto pr-1 text-[11px]">
          {data.map((d, i) => (
            <li key={d.fullName || d.name} className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
              />
              <button
                type="button"
                className={cn(
                  'min-w-0 flex-1 truncate text-left text-muted-foreground',
                  onSliceClick && 'hover:text-foreground'
                )}
                onClick={() => onSliceClick?.(d.fullName || d.name)}
                disabled={!onSliceClick}
              >
                {d.name}
              </button>
              <span className="tabular-nums font-medium text-foreground">
                {money ? formatCompactAxis(d.value) : d.value.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function DashboardShell({ children }: { title?: string; subtitle?: string; children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

/** Shared gold outline button style for report toolbars */
export const reportActionBtnClass =
  'h-8 gap-1.5 border border-border text-xs transition-colors hover:border-dms-gold hover:bg-dms-gold-soft hover:text-foreground disabled:opacity-50';
