// Statischer Testserver für Playwright und Lighthouse (WEB T11): liefert einen Build-Ordner aus wie
// Cloudflare Workers Static Assets (html_handling force-trailing-slash, 404-page) und setzt die
// Header aus `_headers`, damit CSP und Sicherheitsheader schon lokal und in CI wirken.
// Aufruf: node scripts/qa/server.mjs --dir dist-vorschau --port 4400
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { argumente } from './lib.mjs';

const arg = argumente();
const root = arg.dir ?? 'dist-vorschau';
const port = Number(arg.port ?? 4400);

const TYPEN = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json',
  '.avif': 'image/avif', '.webp': 'image/webp', '.jpg': 'image/jpeg',
};

/** `_headers` lesen: Blöcke aus Muster und eingerückten `Name: Wert`-Zeilen. Host-Regeln (https://…) gelten hier nicht. */
function headerRegeln() {
  const datei = join(root, '_headers');
  if (!existsSync(datei)) return [];
  const regeln = [];
  let aktuell = null;
  for (const zeile of readFileSync(datei, 'utf8').split(/\r?\n/)) {
    if (!zeile.trim() || zeile.trim().startsWith('#')) continue;
    if (!/^\s/.test(zeile)) {
      aktuell = { muster: zeile.trim(), header: [] };
      regeln.push(aktuell);
    } else if (aktuell) {
      const i = zeile.indexOf(':');
      aktuell.header.push([zeile.slice(0, i).trim(), zeile.slice(i + 1).trim()]);
    }
  }
  return regeln
    .filter((r) => r.muster.startsWith('/'))
    .map((r) => ({ ...r, re: new RegExp('^' + r.muster.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$') }));
}
const regeln = headerRegeln();

function datei(pfad) {
  const p = normalize(join(root, decodeURIComponent(pfad)));
  if (!p.startsWith(normalize(root))) return null;
  if (existsSync(p) && statSync(p).isFile()) return p;
  if (existsSync(join(p, 'index.html'))) return join(p, 'index.html');
  return null;
}

createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${port}`);
  let pfad = url.pathname;
  for (const r of regeln) if (r.re.test(pfad)) for (const [k, v] of r.header) res.setHeader(k, v);
  // force-trailing-slash: /seite → /seite/, wenn es /seite/index.html gibt
  if (!pfad.endsWith('/') && !extname(pfad) && existsSync(join(root, pfad, 'index.html'))) {
    res.writeHead(307, { Location: pfad + '/' + url.search });
    return res.end();
  }
  let d = datei(pfad);
  let status = 200;
  if (!d) {
    d = join(root, '404.html');
    status = 404;
  }
  res.writeHead(status, { 'Content-Type': TYPEN[extname(d)] ?? 'application/octet-stream' });
  res.end(readFileSync(d));
}).listen(port, () => console.log(`QA-Server ${root} auf http://localhost:${port}`));
