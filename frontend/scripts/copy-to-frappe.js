import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { cpSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, '../out');
const publicFrontendDir = path.join(__dirname, '../../dms/public/frontend');
const wwwHtmlPath = path.join(__dirname, '../../dms/www/dms_frontend.html');

// 1. Copy _next/ static assets to dms/public/frontend/_next/
//    Frappe serves public/frontend/ as /assets/dms/frontend/
const srcNextDir = path.join(outDir, '_next');
const destNextDir = path.join(publicFrontendDir, '_next');

if (!fs.existsSync(srcNextDir)) {
  console.error('Build output not found at', srcNextDir, '- run "npm run build" first');
  process.exit(1);
}

fs.mkdirSync(publicFrontendDir, { recursive: true });
if (fs.existsSync(destNextDir)) {
  fs.rmSync(destNextDir, { recursive: true });
}
cpSync(srcNextDir, destNextDir, { recursive: true });
console.log('Copied _next/ assets to dms/public/frontend/_next/');

// 2. Use index.html as the SPA entry point.
//    This is the root page (app/page.tsx) which contains AuthProvider,
//    NavigationProvider, and hash-based routing for the whole app.
const builtHtmlPath = path.join(outDir, 'index.html');
if (!fs.existsSync(builtHtmlPath)) {
  console.error('Built index.html not found at', builtHtmlPath);
  process.exit(1);
}

let html = fs.readFileSync(builtHtmlPath, 'utf8');

// Inject CSRF meta tag right after <meta name="viewport" .../>
html = html.replace(
  /(<meta name="viewport"[^>]*>)/i,
  '$1\n    <meta name="csrf-token" content="{{ csrf_token }}" />'
);

// Inject window.csrf_token script right before </body>
html = html.replace(
  /<\/body>/i,
  `  <script>window.csrf_token = "{{ csrf_token }}";</script>\n</body>`
);

fs.writeFileSync(wwwHtmlPath, html);
console.log('Updated www/dms_frontend.html with build output');
