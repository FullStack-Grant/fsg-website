// Prüfung 13 (T4 6.2): Produktion nach dem Deploy. Startseite 200, Sicherheitsheader, robots.txt, Sitemap, AGB-PDF (Hash),
// Indexierung passend zum Ziel: workers.dev muss noindex tragen, fullstackgrant.de darf es nicht (ab T13).
// Aufruf: node scripts/qa/smoke.mjs --url https://fsg-website.fh-1e8.workers.dev
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { Befunde, argumente } from './lib.mjs';

const arg = argumente();
const basis = (arg.url ?? 'https://fsg-website.fh-1e8.workers.dev').replace(/\/$/, '');
const live = new URL(basis).hostname === 'fullstackgrant.de';
const b = new Befunde(`smoke ${basis}`);

async function holen(pfad) {
  const r = await fetch(basis + pfad, { redirect: 'manual', headers: { 'user-agent': 'fsg-website-smoke' } });
  return { r, text: r.status < 300 ? await r.text() : '' };
}

const start = await holen('/');
if (start.r.status !== 200) b.fehler_('/', `HTTP ${start.r.status}`);
const h = start.r.headers;
for (const name of ['content-security-policy', 'strict-transport-security', 'x-content-type-options', 'referrer-policy', 'x-frame-options'])
  if (!h.get(name)) b.fehler_('/', `Header ${name} fehlt`);
if (!/<title>[^<]+<\/title>/.test(start.text)) b.fehler_('/', 'kein <title>');

const robotsHeader = (h.get('x-robots-tag') ?? '').toLowerCase();
const robotsMeta = /<meta name="robots" content="[^"]*noindex/i.test(start.text);
if (live && (robotsHeader.includes('noindex') || robotsMeta)) b.fehler_('/', 'noindex auf der Live-Domain');
if (!live && !robotsHeader.includes('noindex')) b.fehler_('/', 'workers.dev ohne X-Robots-Tag noindex (indexierbar)');

const robots = await holen('/robots.txt');
if (robots.r.status !== 200) b.fehler_('/robots.txt', `HTTP ${robots.r.status}`);
else if (live && /Disallow:\s*\/\s*$/m.test(robots.text)) b.fehler_('/robots.txt', 'sperrt alles auf der Live-Domain');

const sitemap = await holen('/sitemap-index.xml');
if (sitemap.r.status !== 200) b.fehler_('/sitemap-index.xml', `HTTP ${sitemap.r.status}`);

// Eingefrorene AGB-Fassungen (WEB T12): Adresse ohne Schrägstrich leitet auf die feste Seite, PDF byte-gleich (SHA-256).
const register = JSON.parse(readFileSync(new URL('../../src/data/agb-fassungen.json', import.meta.url), 'utf8'));
for (const f of register.fassungen) {
  const ohne = await holen(f.seite.replace(/\/$/, ''));
  const ziel = ohne.r.headers.get('location');
  if (![301, 307, 308].includes(ohne.r.status) || new URL(ziel ?? '', basis).pathname !== f.seite)
    b.fehler_(f.seite, `ohne Schrägstrich: HTTP ${ohne.r.status} nach ${ziel ?? '(kein Ziel)'}`);
  const seite = await holen(f.seite);
  if (seite.r.status !== 200) b.fehler_(f.seite, `HTTP ${seite.r.status}`);
  const pdf = await fetch(basis + f.pdf, { headers: { 'user-agent': 'fsg-website-smoke' } });
  if (pdf.status !== 200) b.fehler_(f.pdf, `HTTP ${pdf.status}`);
  else {
    const hash = createHash('sha256').update(Buffer.from(await pdf.arrayBuffer())).digest('hex');
    if (hash !== f.sha256) b.fehler_(f.pdf, `SHA-256 ${hash} statt ${f.sha256}`);
  }
}

const fehlt = await holen('/gibt-es-nicht-qa/');
if (fehlt.r.status !== 404) b.fehler_('/gibt-es-nicht-qa/', `HTTP ${fehlt.r.status} statt 404`);

process.exit(b.bericht() ? 0 : 1);
