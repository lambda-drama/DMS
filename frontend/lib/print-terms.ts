import type { BilingualCustomerTerms } from "@/components/customer-terms-acceptance";

export type TermsPrintContext = {
  /** Document heading, e.g. "Vehicle Inspection" or "Service Estimate". */
  documentTitle?: string;
  /** Key/value rows rendered as a work-sheet info table (shown even if blank). */
  details?: Array<{ label: string; value?: string | number | null }>;
};

/** Company header shown on the printout (matches the Work Sheet). */
const COMPANY = {
  name: "SUWEYS MOTORS",
  phone: "+251 97 288 8877 / +251 97 288 8833",
  email: "JETOURETHIOPIA@GMAIL.COM",
  website: "WWW.JETOURETHIOPIA.COM",
  addressHtml:
    "Akaki Kality, Woreda 05, Kebele 05,<br>Behind Yetebaberut Fuel Station,<br>Addis Ababa, ETHIOPIA",
  logoUrl: "/assets/dms/image/suwey_logo.png",
};

const CAR_SVG = `<svg class="ws-car" viewBox="0 0 130 52" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 40 Q9 27 24 25 L40 25 Q48 14 64 14 L90 14 Q103 15 110 27 L120 31 Q126 33 124 40 L116 40 A8 8 0 0 0 100 40 L46 40 A8 8 0 0 0 30 40 Z" fill="#d0d3d8" stroke="#555" stroke-width="1.5"/>
  <path d="M50 25 L64 16 L84 16 L92 25 Z" fill="#eef1f4" stroke="#777" stroke-width="1"/>
  <circle cx="38" cy="40" r="7" fill="#333"/><circle cx="108" cy="40" r="7" fill="#333"/>
  <circle cx="38" cy="40" r="3" fill="#bbb"/><circle cx="108" cy="40" r="3" fill="#bbb"/>
</svg>`;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function buildInfoTable(details?: TermsPrintContext["details"]): string {
  const rows = details || [];
  if (rows.length === 0) return "";
  const cell = (row?: { label: string; value?: string | number | null }) => {
    if (!row) return `<td class="l"></td><td class="v"></td>`;
    const value =
      row.value === undefined || row.value === null ? "" : String(row.value);
    return `<td class="l">${escapeHtml(row.label)}</td><td class="v">${escapeHtml(
      value
    )}</td>`;
  };
  let body = "";
  for (let i = 0; i < rows.length; i += 2) {
    body += `<tr>${cell(rows[i])}${cell(rows[i + 1])}</tr>`;
  }
  return `<table class="info">${body}</table>`;
}

function buildHtml(
  terms: BilingualCustomerTerms,
  context?: TermsPrintContext
): string {
  const en = terms.english;
  const ar = terms.arabic;
  const enTitle = en?.terms_title?.trim() || "Terms and Conditions";
  const arTitle = ar?.terms_title?.trim() || "الشروط والأحكام";
  const heading = context?.documentTitle?.trim() || "";
  const infoTable = buildInfoTable(context?.details);

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(heading ? `${heading} — Terms` : "Terms and Conditions")}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 20px; font-size: 11px; }
  table.head { width: 100%; border-collapse: collapse; border-bottom: 2px solid #111; margin-bottom: 10px; }
  table.head td { vertical-align: top; padding: 0 0 8px; border: none; }
  .head-left { width: 36%; font-size: 10px; line-height: 1.5; }
  .head-left .ph { font-weight: 700; }
  .head-left .addr-t { font-weight: 700; margin-top: 6px; }
  .head-mid { width: 38%; text-align: center; }
  .logo { height: 62px; max-width: 190px; object-fit: contain; }
  .doc-title { font-size: 16px; font-weight: 800; margin-top: 4px; letter-spacing: .5px; }
  .head-right { width: 26%; text-align: right; }
  .company { font-weight: 800; font-size: 13px; margin-bottom: 6px; }
  .ws-car { height: 46px; }
  table.info { width: 100%; border-collapse: collapse; margin-bottom: 0; }
  table.info td { border: 1px solid #999; padding: 4px 6px; font-size: 10.5px; vertical-align: top; }
  table.info td.l { background: #f2f2f2; font-weight: 700; color: #333; white-space: nowrap; width: 15%; }
  table.info td.v { width: 18%; }
  .tc-title { text-align: center; font-size: 13px; letter-spacing: .5px; margin: 4px 0 6px; font-weight: 700; }
  table.cols { width: 100%; border-collapse: separate; border-spacing: 10px 0; }
  table.cols td.col { width: 50%; vertical-align: top; border: 1px solid #ccc; border-radius: 4px; padding: 10px 12px; }
  .col h2 { font-size: 13px; margin: 0 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
  .col.ar { direction: rtl; text-align: right; }
  .content p { margin: 0 0 8px; line-height: 1.5; }
  .content ol, .content ul { margin: 0 0 8px; padding-inline-start: 18px; }
  .content li { margin: 0 0 6px; line-height: 1.5; }
  .sign { margin-top: 30px; display: flex; gap: 40px; }
  .sigline { flex: 1; }
  .sigline .lbl { font-weight: 600; margin-bottom: 30px; display: block; font-size: 11px; }
  .sigline .rule { border-top: 1px solid #333; }
  @media print { body { padding: 12px; } td.col { break-inside: avoid; } }
</style>
</head>
<body>
  <table class="head"><tr>
    <td class="head-left">
      <div class="ph">${escapeHtml(COMPANY.phone)}</div>
      <div>${escapeHtml(COMPANY.email)}</div>
      <div>${escapeHtml(COMPANY.website)}</div>
      <div class="addr-t">Address</div>
      <div>${COMPANY.addressHtml}</div>
    </td>
    <td class="head-mid">
      <img class="logo" src="${COMPANY.logoUrl}" alt="${escapeHtml(COMPANY.name)}" />
      <div class="doc-title">${escapeHtml(heading || "TERMS OF BUSINESS")}</div>
    </td>
    <td class="head-right">
      <div class="company">${escapeHtml(COMPANY.name)}</div>
      ${CAR_SVG}
    </td>
  </tr></table>

  ${infoTable}

  <div class="tc-title">TERMS OF BUSINESS</div>
  <table class="cols"><tr>
    <td class="col en">
      <h2>${escapeHtml(enTitle)}</h2>
      <div class="content">${en?.more_details || "<p>No English terms configured.</p>"}</div>
    </td>
    <td class="col ar" dir="rtl">
      <h2>${escapeHtml(arTitle)}</h2>
      <div class="content">${ar?.more_details || "<p>لا توجد شروط بالعربية.</p>"}</div>
    </td>
  </tr></table>

  <div class="sign">
    <div class="sigline"><span class="lbl">Customer Name / اسم العميل</span><div class="rule"></div></div>
    <div class="sigline"><span class="lbl">Signature / التوقيع</span><div class="rule"></div></div>
    <div class="sigline"><span class="lbl">Date / التاريخ</span><div class="rule"></div></div>
  </div>
</body>
</html>`;
}

/**
 * Prints the bilingual customer terms & conditions with the company header and a
 * work-sheet info table. Uses a hidden same-origin iframe so it renders reliably
 * (including the logo) and works before the parent document is saved.
 */
export function printCustomerTerms(
  terms: BilingualCustomerTerms | null,
  context?: TermsPrintContext
): void {
  if (typeof window === "undefined") return;
  if (!terms || (!terms.english && !terms.arabic)) return;

  const html = buildHtml(terms, context);

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  Object.assign(iframe.style, {
    position: "fixed",
    right: "0",
    bottom: "0",
    width: "0",
    height: "0",
    border: "0",
    visibility: "hidden",
  });
  document.body.appendChild(iframe);

  const cw = iframe.contentWindow;
  if (!cw) {
    iframe.remove();
    return;
  }

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    setTimeout(() => {
      try {
        iframe.remove();
      } catch {
        /* noop */
      }
    }, 500);
  };

  const doPrint = () => {
    const d = cw.document;
    const images = Array.from(d.images || []);
    const waits = images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    );
    Promise.all(waits).then(() => {
      setTimeout(() => {
        try {
          cw.focus();
          cw.print();
        } catch {
          /* noop */
        }
      }, 80);
    });
  };

  try {
    cw.addEventListener("afterprint", cleanup);
  } catch {
    /* noop */
  }

  const d = cw.document;
  d.open();
  d.write(html);
  d.close();

  if (d.readyState === "complete") {
    doPrint();
  } else {
    iframe.onload = doPrint;
  }

  setTimeout(cleanup, 60000);
}
