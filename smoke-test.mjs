/**
 * Smoke test estático del prototipo Toca.
 * Verifica: sintaxis JS, assets enlazados, IDs críticos y handlers globales.
 */
import fs from 'fs';
import path from 'path';
import http from 'http';
import { fileURLToPath } from 'url';

const base = path.dirname(fileURLToPath(import.meta.url));
const port = 3457;
const results = { pass: [], fail: [], warn: [] };

function pass(msg) { results.pass.push(msg); }
function fail(msg) { results.fail.push(msg); }
function warn(msg) { results.warn.push(msg); }

function checkSyntax(file) {
  try {
    const src = fs.readFileSync(path.join(base, file), 'utf8');
    new Function(src);
    pass(`Sintaxis OK: ${file}`);
  } catch (e) {
    fail(`Sintaxis rota: ${file} — ${e.message}`);
  }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

function extractGlobalFunctions(jsFiles) {
  const fns = new Set();
  for (const file of jsFiles) {
    const src = fs.readFileSync(path.join(base, file), 'utf8');
    for (const m of src.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) fns.add(m[1]);
  }
  return fns;
}

function extractOnclickHandlers(html) {
  const handlers = new Set();
  for (const m of html.matchAll(/onclick="([^(]+)\(/g)) handlers.add(m[1].trim());
  return handlers;
}

function extractIds(html) {
  const ids = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  return ids;
}

const jsFiles = ['js/data.js', 'js/utils.js', 'js/ui.js', 'js/app.js'];
const cssFiles = ['css/variables.css', 'css/prototype.css', 'css/layout.css', 'css/components.css', 'css/modal.css', 'css/slide-panel.css'];

for (const f of [...jsFiles, ...cssFiles, 'index.html']) {
  if (!fs.existsSync(path.join(base, f))) fail(`Archivo faltante: ${f}`);
  else pass(`Existe: ${f}`);
}

for (const f of jsFiles) checkSyntax(f);

const html = fs.readFileSync(path.join(base, 'index.html'), 'utf8');
const globalFns = extractGlobalFunctions(jsFiles);
const handlers = extractOnclickHandlers(html);
const ids = extractIds(html);

const criticalIds = [
  'tab-inicio', 'tab-clientes', 'tab-prospectos',
  'daily-list-container', 'clientes-list-container', 'prospectos-list-container',
  'filters-row', 'clientes-filters-row', 'prospectos-filters-row',
  'search-input', 'clientes-search-input', 'prospectos-search-input',
  'new-contact-modal', 'contact-detail-panel', 'toast-container',
  'app-date', 'viewport-container', 'viewport-frame',
];

for (const id of criticalIds) {
  if (ids.has(id)) pass(`ID presente: #${id}`);
  else fail(`ID faltante: #${id}`);
}

for (const h of handlers) {
  if (globalFns.has(h)) pass(`Handler global: ${h}()`);
  else fail(`Handler sin función global: ${h}()`);
}

const oninputHandlers = [...html.matchAll(/oninput="([^"(]+)/g)].map((m) => m[1].trim());
for (const h of oninputHandlers) {
  if (globalFns.has(h)) pass(`Handler oninput: ${h}()`);
  else fail(`oninput sin función global: ${h}()`);
}

const onchangeHandlers = [...html.matchAll(/onchange="([^"(]+)/g)].map((m) => m[1].trim());
for (const h of onchangeHandlers) {
  if (globalFns.has(h)) pass(`Handler onchange: ${h}()`);
  else fail(`onchange sin función global: ${h}()`);
}

const server = http.createServer((req, res) => {
  const rel = req.url === '/' ? 'index.html' : decodeURIComponent(req.url.slice(1));
  const filePath = path.join(base, rel);
  if (!filePath.startsWith(base) || !fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not found'); return;
  }
  res.writeHead(200); res.end(fs.readFileSync(filePath));
});

server.listen(port, async () => {
  try {
    const assets = ['/', ...cssFiles.map((f) => '/' + f), ...jsFiles.map((f) => '/' + f)];
    for (const a of assets) {
      const { status } = await fetch(`http://127.0.0.1:${port}${a}`);
      if (status === 200) pass(`HTTP 200: ${a}`);
      else fail(`HTTP ${status}: ${a}`);
    }
  } catch (e) {
    fail(`Servidor HTTP: ${e.message}`);
  } finally {
    server.close();
    console.log('\n=== SMOKE TEST TOCA ===\n');
    console.log(`✅ ${results.pass.length} checks OK`);
    if (results.warn.length) console.log(`⚠️  ${results.warn.length} advertencias`);
    if (results.fail.length) {
      console.log(`❌ ${results.fail.length} fallos:\n`);
      results.fail.forEach((f) => console.log('  -', f));
      process.exit(1);
    }
    console.log('\nTodo OK.\n');
  }
});
