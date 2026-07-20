import type { ReportResult } from '@/services/reports';

function escapeCsvCell(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function cellText(value: unknown): string {
  if (value == null || value === '') return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportReportCsv(result: ReportResult) {
  const keys = result.columns.map((c) => c.key);
  const header = result.columns.map((c) => escapeCsvCell(c.label)).join(',');
  const body = result.rows
    .map((row) => keys.map((k) => escapeCsvCell(row[k])).join(','))
    .join('\n');
  const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${result.report_id || 'report'}_export.csv`);
}

/** Excel-friendly HTML workbook (.xls) — opens in Excel without extra deps. */
export function exportReportExcel(result: ReportResult) {
  const keys = result.columns.map((c) => c.key);
  const th = result.columns
    .map((c) => `<th>${escapeHtml(c.label)}</th>`)
    .join('');
  const tr = result.rows
    .map(
      (row) =>
        `<tr>${keys.map((k) => `<td>${escapeHtml(cellText(row[k]))}</td>`).join('')}</tr>`
    )
    .join('');
  const summaryRows = Object.entries(result.summary || {})
    .filter(([, v]) => v == null || typeof v !== 'object')
    .map(
      ([k, v]) =>
        `<tr><td><b>${escapeHtml(k.replace(/_/g, ' '))}</b></td><td>${escapeHtml(cellText(v))}</td></tr>`
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" />
<title>${escapeHtml(result.title)}</title></head><body>
<h2>${escapeHtml(result.title)}</h2>
<p>Generated: ${new Date().toLocaleString()}</p>
<table border="1"><thead><tr><th>KPI</th><th>Value</th></tr></thead><tbody>${summaryRows}</tbody></table>
<br/>
<table border="1"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>
</body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, `${result.report_id || 'report'}_export.xls`);
}

/** Build printable HTML for on-screen PDF preview (no auto-print). */
export function buildReportPdfHtml(result: ReportResult): string {
  const keys = result.columns.map((c) => c.key);
  const th = result.columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');
  const tr = result.rows
    .map(
      (row) =>
        `<tr>${keys.map((k) => `<td>${escapeHtml(cellText(row[k]))}</td>`).join('')}</tr>`
    )
    .join('');
  const summary = Object.entries(result.summary || {})
    .filter(([, v]) => v == null || typeof v !== 'object')
    .map(
      ([k, v]) =>
        `<div class="kpi"><span>${escapeHtml(k.replace(/_/g, ' '))}</span><strong>${escapeHtml(cellText(v))}</strong></div>`
    )
    .join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8" />
<title>${escapeHtml(result.title)}</title>
<style>
  body { font-family: "Segoe UI", system-ui, sans-serif; padding: 28px; color: #0f172a; }
  h1 { font-size: 20px; margin: 0 0 4px; letter-spacing: -0.02em; }
  .meta { color: #64748b; font-size: 12px; margin-bottom: 18px; }
  .kpis { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
  .kpi { border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; min-width: 120px; background: #fafafa; }
  .kpi span { display: block; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; }
  .kpi strong { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 11px; }
  th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
  th { background: #f8fafc; font-weight: 600; }
  .accent { height: 3px; width: 48px; background: #F2B705; border-radius: 2px; margin-bottom: 12px; }
  @media print {
    body { padding: 0; }
    .kpi { break-inside: avoid; }
  }
</style></head><body>
<div class="accent"></div>
<h1>${escapeHtml(result.title)}</h1>
<div class="meta">Generated ${new Date().toLocaleString()} · ${result.rows.length} rows</div>
${summary ? `<div class="kpis">${summary}</div>` : ''}
<table><thead><tr>${th}</tr></thead><tbody>${tr || `<tr><td colspan="${Math.max(keys.length, 1)}">No rows</td></tr>`}</tbody></table>
</body></html>`;
}

/** @deprecated Prefer preview via buildReportPdfHtml + PdfPreviewDialog */
export function exportReportPdf(result: ReportResult) {
  const html = buildReportPdfHtml(result);
  const w = window.open('', '_blank', 'noopener,noreferrer');
  if (!w) return;
  w.document.open();
  w.document.write(html);
  w.document.close();
}
