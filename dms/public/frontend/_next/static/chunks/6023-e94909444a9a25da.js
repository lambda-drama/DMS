"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[6023],{14278:(e,t,r)=>{r.d(t,{Ke:()=>l,Nt:()=>i,R6:()=>n});var a=r(95155),s=r(19820);function i({...e}){return(0,a.jsx)(s.bL,{"data-slot":"collapsible",...e})}function n({...e}){return(0,a.jsx)(s.R6,{"data-slot":"collapsible-trigger",...e})}function l({...e}){return(0,a.jsx)(s.Ke,{"data-slot":"collapsible-content",...e})}},58979:(e,t,r)=>{r.d(t,{x:()=>d});var a=r(95155),s=r(439),i=r(66669),n=r(80367),l=r(38291);function d({summary:e,className:t=""}){if(!e)return null;let r=e.warranty_active,o=r?s.A:"Expired by Mileage"===e.warranty_status?i.A:n.A;return(0,a.jsxs)("div",{className:`rounded-lg border p-4 space-y-2 ${r?"border-green-200 bg-green-50/80 dark:border-green-900 dark:bg-green-950/30":"border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/30"} ${t}`,children:[(0,a.jsxs)("div",{className:"flex flex-wrap items-center gap-2",children:[(0,a.jsx)(o,{className:`h-5 w-5 shrink-0 ${r?"text-green-700 dark:text-green-400":"text-amber-700 dark:text-amber-400"}`}),(0,a.jsxs)("span",{className:"font-medium text-sm",children:["Vehicle warranty: ",r?"Active":"Inactive"]}),(0,a.jsx)(l.E,{variant:e.warranty_active?"default":"Expired by Mileage"===e.warranty_status?"destructive":"secondary",children:e.warranty_status})]}),e.warranty_reason&&(0,a.jsx)("p",{className:"text-sm text-muted-foreground",children:e.warranty_reason}),(0,a.jsxs)("div",{className:"flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground",children:[e.sale_date&&(0,a.jsxs)("span",{children:["Sale date: ",e.sale_date]}),e.warranty_end_date&&(0,a.jsxs)("span",{children:["Ends: ",e.warranty_end_date]}),null!=e.warranty_km_limit&&e.warranty_km_limit>0&&(0,a.jsxs)("span",{children:["Limit: ",e.warranty_km_limit.toLocaleString()," km"]}),null!=e.current_odometer&&(0,a.jsxs)("span",{children:["Odometer: ",e.current_odometer.toLocaleString()," km"]}),r&&null!=e.days_remaining&&(0,a.jsxs)("span",{children:[e.days_remaining," days left"]}),r&&null!=e.km_remaining&&null!=e.warranty_km_limit&&(0,a.jsxs)("span",{children:[e.km_remaining.toLocaleString()," km left"]})]})]})}},97693:(e,t,r)=>{r.d(t,{v:()=>u});var a=r(95155),s=r(6296),i=r(48368),n=r(66088),l=r(81262),d=r(84437),o=r(79792),c=r(4474),m=r(14278),p=r(91337);let h="SUWEYS MOTORS",x=`<svg class="ws-car" viewBox="0 0 130 52" xmlns="http://www.w3.org/2000/svg">
  <path d="M6 40 Q9 27 24 25 L40 25 Q48 14 64 14 L90 14 Q103 15 110 27 L120 31 Q126 33 124 40 L116 40 A8 8 0 0 0 100 40 L46 40 A8 8 0 0 0 30 40 Z" fill="#d0d3d8" stroke="#555" stroke-width="1.5"/>
  <path d="M50 25 L64 16 L84 16 L92 25 Z" fill="#eef1f4" stroke="#777" stroke-width="1"/>
  <circle cx="38" cy="40" r="7" fill="#333"/><circle cx="108" cy="40" r="7" fill="#333"/>
  <circle cx="38" cy="40" r="3" fill="#bbb"/><circle cx="108" cy="40" r="3" fill="#bbb"/>
</svg>`;function g(e){return e.replace(/[&<>"']/g,e=>{switch(e){case"&":return"&amp;";case"<":return"&lt;";case">":return"&gt;";case'"':return"&quot;";default:return"&#39;"}})}function b({terms:e,languageLabel:t,dir:r,alignClass:s}){let i=e.terms_title?.trim()||t;return(0,a.jsxs)("div",{className:"min-w-0 flex flex-col rounded-md border bg-background",children:[(0,a.jsxs)("div",{className:(0,p.cn)("border-b px-3 py-2 text-sm font-semibold",s),dir:r,children:[t,i!==t?(0,a.jsx)("span",{className:"block text-xs font-normal text-muted-foreground",children:i}):null]}),(0,a.jsx)("div",{dir:r,className:(0,p.cn)("prose prose-sm dark:prose-invert max-w-none max-h-64 overflow-y-auto p-3 text-sm",s),dangerouslySetInnerHTML:{__html:e.more_details||"<p>No terms content.</p>"}})]})}function u({terms:e,loading:t=!1,accepted:r,onAcceptedChange:f,className:v,printContext:w}){let y=!!e?.english,j=!!e?.arabic,k=y&&j;return(0,a.jsx)("div",{className:(0,p.cn)("space-y-3 rounded-lg border bg-muted/30 p-3 sm:p-4",v),children:t?(0,a.jsxs)("div",{className:"flex items-center gap-2 text-sm text-muted-foreground",children:[(0,a.jsx)(s.A,{className:"h-4 w-4 animate-spin"}),"Loading terms and conditions…"]}):y||j?(0,a.jsxs)(a.Fragment,{children:[(0,a.jsxs)(m.Nt,{defaultOpen:!1,children:[(0,a.jsxs)("div",{className:"flex items-center gap-2",children:[(0,a.jsxs)(m.R6,{className:"group flex min-w-0 flex-1 items-center justify-between gap-2 rounded-md px-1 py-1 text-left hover:bg-muted/60",children:[(0,a.jsxs)("span",{className:"flex min-w-0 items-center gap-2 font-medium",children:[(0,a.jsx)(i.A,{className:"h-4 w-4 shrink-0 text-primary"}),(0,a.jsx)("span",{className:"truncate",children:"Terms and Conditions / الشروط والأحكام"})]}),(0,a.jsx)(n.A,{className:"h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"})]}),(0,a.jsxs)(c.$,{type:"button",variant:"outline",size:"sm",className:"shrink-0",disabled:!y&&!j,onClick:()=>(function(e,t){let r,a,s,i,n,l;if(!e||!e.english&&!e.arabic)return;let d=(r=e.english,a=e.arabic,s=r?.terms_title?.trim()||"Terms and Conditions",i=a?.terms_title?.trim()||"الشروط والأحكام",n=t?.documentTitle?.trim()||"",l=function(e){let t=e||[];if(0===t.length)return"";let r=e=>{if(!e)return'<td class="l"></td><td class="v"></td>';let t=void 0===e.value||null===e.value?"":String(e.value);return`<td class="l">${g(e.label)}</td><td class="v">${g(t)}</td>`},a="";for(let e=0;e<t.length;e+=2)a+=`<tr>${r(t[e])}${r(t[e+1])}</tr>`;return`<table class="info">${a}</table>`}(t?.details),`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${g(n?`${n} — Terms`:"Terms and Conditions")}</title>
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
      <div class="ph">${g("+251 97 288 8877 / +251 97 288 8833")}</div>
      <div>${g("JETOURETHIOPIA@GMAIL.COM")}</div>
      <div>${g("WWW.JETOURETHIOPIA.COM")}</div>
      <div class="addr-t">Address</div>
      <div>Akaki Kality, Woreda 05, Kebele 05,<br>Behind Yetebaberut Fuel Station,<br>Addis Ababa, ETHIOPIA</div>
    </td>
    <td class="head-mid">
      <img class="logo" src="/assets/dms/image/suwey_logo.png" alt="${g(h)}" />
      <div class="doc-title">${g(n||"TERMS OF BUSINESS")}</div>
    </td>
    <td class="head-right">
      <div class="company">${g(h)}</div>
      ${x}
    </td>
  </tr></table>

  ${l}

  <div class="tc-title">TERMS OF BUSINESS</div>
  <table class="cols"><tr>
    <td class="col en">
      <h2>${g(s)}</h2>
      <div class="content">${r?.more_details||"<p>No English terms configured.</p>"}</div>
    </td>
    <td class="col ar" dir="rtl">
      <h2>${g(i)}</h2>
      <div class="content">${a?.more_details||"<p>لا توجد شروط بالعربية.</p>"}</div>
    </td>
  </tr></table>

  <div class="sign">
    <div class="sigline"><span class="lbl">Customer Name / اسم العميل</span><div class="rule"></div></div>
    <div class="sigline"><span class="lbl">Signature / التوقيع</span><div class="rule"></div></div>
    <div class="sigline"><span class="lbl">Date / التاريخ</span><div class="rule"></div></div>
  </div>
</body>
</html>`),o=document.createElement("iframe");o.setAttribute("aria-hidden","true"),Object.assign(o.style,{position:"fixed",right:"0",bottom:"0",width:"0",height:"0",border:"0",visibility:"hidden"}),document.body.appendChild(o);let c=o.contentWindow;if(!c)return void o.remove();let m=!1,p=()=>{m||(m=!0,setTimeout(()=>{try{o.remove()}catch{}},500))},b=()=>{Promise.all(Array.from(c.document.images||[]).map(e=>e.complete?Promise.resolve():new Promise(t=>{e.onload=()=>t(),e.onerror=()=>t()}))).then(()=>{setTimeout(()=>{try{c.focus(),c.print()}catch{}},80)})};try{c.addEventListener("afterprint",p)}catch{}let u=c.document;u.open(),u.write(d),u.close(),"complete"===u.readyState?b():o.onload=b,setTimeout(p,6e4)})(e,w),title:"Print terms and conditions",children:[(0,a.jsx)(l.A,{className:"h-4 w-4 sm:mr-2"}),(0,a.jsx)("span",{className:"hidden sm:inline",children:"Print"})]})]}),(0,a.jsxs)(m.Ke,{className:"data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden",children:[(0,a.jsxs)("div",{className:"mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4",children:[e?.english?(0,a.jsx)(b,{terms:e.english,languageLabel:"English",dir:"ltr"}):(0,a.jsx)("div",{className:"rounded-md border border-dashed p-4 text-sm text-destructive",children:"English terms not configured (record without Arabic checked)."}),e?.arabic?(0,a.jsx)(b,{terms:e.arabic,languageLabel:"العربية",dir:"rtl",alignClass:"text-right"}):(0,a.jsx)("div",{className:"rounded-md border border-dashed p-4 text-sm text-destructive text-right",dir:"rtl",children:"Arabic terms not configured (check Arabic on that record)."})]}),k?null:(0,a.jsx)("p",{className:"mt-2 text-xs text-destructive",children:"Both English and Arabic terms are required before customer can sign."})]})]}),(0,a.jsxs)("div",{className:"flex items-start gap-3 rounded-md border border-primary/20 bg-background p-3",children:[(0,a.jsx)(d.S,{id:"accept-customer-terms",checked:r,disabled:!k,onCheckedChange:e=>f(!!e),className:"mt-0.5"}),(0,a.jsxs)(o.J,{htmlFor:"accept-customer-terms",className:"cursor-pointer text-sm leading-snug",children:[(0,a.jsx)("span",{className:"block",children:"I have read and accept the terms and conditions above (English and Arabic). I understand this approval is required before signing."}),(0,a.jsx)("span",{className:"mt-1 block text-muted-foreground",dir:"rtl",children:"لقد قرأت وأوافق على الشروط والأحكام أعلاه (بالإنجليزية والعربية). أفهم أن هذه الموافقة مطلوبة قبل التوقيع."})]})]})]}):(0,a.jsx)("p",{className:"text-sm text-destructive",children:"No customer terms found. Add two records in DMS Customer Terms and Conditions — leave Arabic unchecked for English, and check Arabic for the Arabic version."})})}}}]);