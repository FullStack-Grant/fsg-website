// Prüfungen über den Build-Output (T4 6.2 Nr. 3, 5, 6, 7 statisch): Meta, Canonical, OG, Sprache, H1,
// interne Links und Anker, Pflichtlinks, robots.txt, Sitemap gegen XSD, llms.txt, JSON-LD,
// keine Fremd-Ressourcen, CSP-tauglich (kein Inline-Skript, kein style-Attribut), CSP in _headers.
// Aufruf: node scripts/qa/seo.mjs --dir dist --modus produktion [--vergleich dist-vorschau]
//         node scripts/qa/seo.mjs --dir dist-vorschau --modus vorschau
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { validateXML } from 'xmllint-wasm';
import Validator from '@adobe/structured-data-validator';
import { Befunde, SITE, argumente, dateien, dateiAusPfad, lesen, liveRouteGesetzt, pfadAusDatei } from './lib.mjs';

const arg = argumente();
const root = arg.dir ?? 'dist';
const modus = arg.modus ?? 'produktion';
const vergleich = arg.vergleich; // Vorschau-Build: Ziel existiert dort = Link auf Entwurf
const golive = liveRouteGesetzt();
const b = new Befunde(`seo ${root} (${modus})`);

if (!existsSync(root)) {
  b.fehler_(root, 'Build-Ordner fehlt, zuerst bauen');
  process.exit(b.bericht() ? 0 : 1);
}

const PFLICHT = ['/impressum/', '/datenschutz/'];
const RESSOURCEN = [
  ['script', 'src'], ['link', 'href'], ['img', 'src'], ['img', 'srcset'], ['source', 'src'], ['source', 'srcset'],
  ['iframe', 'src'], ['video', 'src'], ['video', 'poster'], ['audio', 'src'], ['embed', 'src'], ['object', 'data'],
];
const JSONLD_PFLICHT = { '/': ['WebSite', 'Organization'] };

const seiten = new Map(); // pfad → { $, datei }
for (const datei of dateien(root, '.html')) {
  seiten.set(pfadAusDatei(root, datei), { datei, $: cheerio.load(lesen(datei)) });
}
const gemeldet = new Set();
const ids = new Map([...seiten].map(([p, s]) => [p, new Set(s.$('[id]').map((_, e) => s.$(e).attr('id')).get())]));

const schemaOrg = JSON.parse(lesen(new URL('./daten/schemaorg-30.1-current-https.jsonld', import.meta.url)));
const validator = new Validator(schemaOrg);

function fremd(url) {
  if (!url) return false;
  const u = url.trim();
  if (u.startsWith('//')) return true;
  if (!/^https?:/i.test(u)) return false;
  return new URL(u).origin !== SITE;
}

/** Graph-Knoten flach nach Typ für den Validator. */
function nachTyp(daten) {
  const knoten = [];
  const sammeln = (x) => {
    if (Array.isArray(x)) return x.forEach(sammeln);
    if (x && typeof x === 'object') {
      if (x['@graph']) return sammeln(x['@graph']);
      knoten.push(x);
    }
  };
  sammeln(daten);
  const out = {};
  for (const k of knoten) {
    const typ = [].concat(k['@type'] ?? 'Thing')[0];
    (out[typ] ??= []).push({ '@context': 'https://schema.org', ...k });
  }
  return { out, knoten };
}

for (const [pfad, { $ }] of seiten) {
  const ort = pfad;
  const ist404 = pfad === '/404.html';

  // Sprache, Titel, Beschreibung
  if ($('html').attr('lang') !== 'de') b.fehler_(ort, '<html lang="de"> fehlt');
  const titel = $('head > title');
  if (titel.length !== 1 || !titel.text().trim()) b.fehler_(ort, 'genau ein nicht leerer <title> erwartet');
  else if (titel.text().trim().length > 60) b.warnung(ort, `Title ${titel.text().trim().length} Zeichen (> 60)`);
  const desc = $('meta[name="description"]').attr('content')?.trim() ?? '';
  if (!desc) b.fehler_(ort, 'meta description fehlt');
  else if (desc.length < 110 || desc.length > 160) b.warnung(ort, `Description ${desc.length} Zeichen (Ziel 110 bis 160)`);
  if ($('h1').length !== 1) b.fehler_(ort, `genau eine H1 erwartet, gefunden ${$('h1').length}`);

  // Robots
  const robots = ($('meta[name="robots"]').attr('content') ?? '').toLowerCase();
  if (modus === 'vorschau' && !robots.includes('noindex')) b.fehler_(ort, 'Vorschau ohne noindex');
  if (modus === 'produktion' && !ist404 && robots.includes('noindex')) b.fehler_(ort, 'noindex in Produktion');

  // Canonical und OG
  if (!ist404) {
    const canonical = $('link[rel="canonical"]').attr('href');
    const soll = SITE + pfad;
    if (!canonical) b.fehler_(ort, 'canonical fehlt');
    else if (canonical !== soll) b.fehler_(ort, `canonical ${canonical} ungleich ${soll}`);
    const og = (p) => $(`meta[property="og:${p}"]`).attr('content');
    for (const p of ['title', 'description', 'url', 'type', 'image', 'locale']) if (!og(p)) b.fehler_(ort, `og:${p} fehlt`);
    if (og('url') && canonical && og('url') !== canonical) b.fehler_(ort, `og:url ${og('url')} ungleich canonical`);
    if (og('image') && !og('image').startsWith(SITE + '/')) b.fehler_(ort, `og:image nicht absolut auf ${SITE}: ${og('image')}`);
    if ($('link[rel="alternate"][hreflang]').length && !$('link[rel="alternate"][hreflang="x-default"]').length)
      b.fehler_(ort, 'hreflang ohne x-default');
  }

  // CSP-Tauglichkeit
  $('script:not([src])').each((_, e) => {
    if ($(e).attr('type') !== 'application/ld+json') b.fehler_(ort, 'Inline-Skript (CSP script-src self)');
  });
  if ($('[style]').length) b.fehler_(ort, `style-Attribut an ${$('[style]').length} Element(en) (CSP style-src self)`);
  if ($('style').length) b.fehler_(ort, '<style>-Block im HTML (CSP style-src self, inlineStylesheets: never)');

  // Fremd-Ressourcen (statisch; Laufzeit prüft Playwright)
  for (const [tag, attr] of RESSOURCEN) {
    $(`${tag}[${attr}]`).each((_, e) => {
      if (tag === 'link' && !/stylesheet|preload|modulepreload|icon|manifest|prefetch|preconnect|dns-prefetch/.test($(e).attr('rel') ?? '')) return;
      const werte = attr === 'srcset' ? $(e).attr(attr).split(',').map((s) => s.trim().split(/\s+/)[0]) : [$(e).attr(attr)];
      for (const w of werte) if (fremd(w)) b.fehler_(ort, `Fremd-Ressource <${tag} ${attr}="${w}">`);
    });
  }
  $('link[rel~="preconnect"], link[rel~="dns-prefetch"]').each((_, e) => {
    if (fremd($(e).attr('href'))) b.fehler_(ort, `preconnect/dns-prefetch auf Fremd-Host ${$(e).attr('href')}`);
  });

  // Interne Links und Anker
  $('a[href]').each((_, e) => {
    const href = $(e).attr('href');
    if (/^(mailto:|tel:|https?:|\/\/)/i.test(href) && !href.startsWith(SITE)) return;
    let ziel = href.startsWith(SITE) ? href.slice(SITE.length) || '/' : href;
    if (ziel.startsWith('#')) ziel = pfad + ziel;
    if (!ziel.startsWith('/')) return b.fehler_(ort, `relativer Link ohne Wurzel: ${href}`);
    const [zpfad, anker] = ziel.split('#');
    const datei = dateiAusPfad(root, zpfad);
    if (!datei) {
      if (vergleich && dateiAusPfad(vergleich, zpfad)) {
        const schluessel = `${pfad}>${zpfad}`;
        if (gemeldet.has(schluessel)) return;
        gemeldet.add(schluessel);
        const text = `Link auf Entwurf ${zpfad} (Seite noch nicht freigegeben)`;
        golive ? b.fehler_(ort, text) : b.warnung(ort, text + '; blockiert ab Live-Route');
      } else b.fehler_(ort, `toter interner Link ${href}`);
      return;
    }
    if (!zpfad.endsWith('/') && !/\.[a-z0-9]+$/i.test(zpfad)) b.warnung(ort, `Link ohne Schrägstrich am Ende: ${href} (301)`);
    if (anker) {
      const zp = pfadAusDatei(root, datei);
      if (!ids.get(zp)?.has(decodeURIComponent(anker))) b.fehler_(ort, `Anker fehlt: ${href}`);
    }
  });

  // Pflichtlinks Impressum und Datenschutz (auf jeder Seite, auch 404)
  for (const p of PFLICHT) {
    if (!$(`a[href="${p}"], a[href="${SITE}${p}"]`).length) b.fehler_(ort, `Pflichtlink ${p} fehlt`);
  }

  // JSON-LD
  const bloecke = $('script[type="application/ld+json"]');
  if (!ist404 && !bloecke.length) b.fehler_(ort, 'kein JSON-LD');
  const alleTypen = new Set();
  for (const el of bloecke.toArray()) {
    let daten;
    try {
      daten = JSON.parse($(el).text());
    } catch (err) {
      b.fehler_(ort, `JSON-LD kein gültiges JSON: ${err.message}`);
      continue;
    }
    const { out: alle, knoten } = nachTyp(daten);
    // Reine Verweisknoten ({@type, @id}) sind Referenzen auf den vollen Knoten der Startseite, keine eigenen Entitäten.
    const out = Object.fromEntries(Object.entries(alle).map(([t, arr]) => [t, arr.filter((k) => Object.keys(k).some((x) => !['@context', '@type', '@id'].includes(x)))]).filter(([, arr]) => arr.length));
    for (const k of knoten) {
      [].concat(k['@type'] ?? []).forEach((t) => alleTypen.add(t));
      if (k['@id'] && !String(k['@id']).startsWith(SITE + '/')) b.fehler_(ort, `JSON-LD @id nicht auf ${SITE}: ${k['@id']}`);
      if (k['@type'] === 'WebPage' || k['@type']?.includes?.('Page')) {
        if (k.url && k.url !== SITE + pfad) b.fehler_(ort, `JSON-LD ${k['@type']}.url ${k.url} ungleich canonical`);
      }
      if (k.datePublished && k.dateModified && k.dateModified < k.datePublished)
        b.fehler_(ort, 'JSON-LD dateModified vor datePublished');
    }
    const probleme = await validator.validate({ jsonld: out });
    for (const p of probleme) {
      const text = `JSON-LD ${p.rootType}: ${p.issueMessage}`;
      p.severity === 'ERROR' ? b.fehler_(ort, text) : b.warnung(ort, text);
    }
  }
  for (const t of JSONLD_PFLICHT[pfad] ?? []) if (!alleTypen.has(t)) b.fehler_(ort, `JSON-LD-Typ ${t} fehlt`);
}

// robots.txt
const robotsDatei = join(root, 'robots.txt');
if (!existsSync(robotsDatei)) b.fehler_('/robots.txt', 'fehlt');
else {
  const text = lesen(robotsDatei);
  const r = robotsParser(`${SITE}/robots.txt`, text);
  const bots = ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'ChatGPT-User', 'Claude-SearchBot', 'PerplexityBot', 'GPTBot', 'ClaudeBot', 'Google-Extended'];
  if (modus === 'produktion') {
    for (const bot of bots) if (!r.isAllowed(`${SITE}/`, bot)) b.fehler_('/robots.txt', `${bot} gesperrt (KI-Crawler und Training erlaubt, DECISIONS 14.11.)`);
    if (!r.getSitemaps().includes(`${SITE}/sitemap-index.xml`)) b.fehler_('/robots.txt', 'Sitemap-Zeile fehlt');
  } else if (r.isAllowed(`${SITE}/`, 'Googlebot')) b.fehler_('/robots.txt', 'Vorschau erlaubt Crawling');
}

// Sitemap gegen XSD, Abgleich mit den Seiten
const sitemapUrls = [];
for (const [datei, xsd] of [['sitemap-index.xml', 'siteindex.xsd'], ['sitemap-0.xml', 'sitemap.xsd']]) {
  const pfad = join(root, datei);
  if (!existsSync(pfad)) {
    b.fehler_(`/${datei}`, 'fehlt');
    continue;
  }
  const xml = lesen(pfad);
  const ergebnis = await validateXML({
    xml: [{ fileName: datei, contents: xml }],
    schema: [{ fileName: xsd, contents: lesen(new URL(`./daten/${xsd}`, import.meta.url)) }],
  });
  for (const e of ergebnis.errors) b.fehler_(`/${datei}`, `XSD: ${e.message ?? e.rawMessage}`);
  if (datei === 'sitemap-0.xml') for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) sitemapUrls.push(m[1]);
}
for (const url of sitemapUrls) {
  if (!url.startsWith(SITE + '/')) b.fehler_('/sitemap-0.xml', `URL nicht auf ${SITE}: ${url}`);
  const p = url.slice(SITE.length);
  if (!seiten.has(p)) b.fehler_('/sitemap-0.xml', `URL ohne Seite: ${url}`);
}
if (modus === 'produktion') {
  for (const p of seiten.keys()) if (p !== '/404.html' && !sitemapUrls.includes(SITE + p)) b.fehler_('/sitemap-0.xml', `Seite fehlt in der Sitemap: ${p}`);
}

// llms.txt (warnt)
const llms = join(root, 'llms.txt');
if (!existsSync(llms)) b.warnung('/llms.txt', 'fehlt');
else {
  const text = lesen(llms);
  if (!text.startsWith('# ')) b.warnung('/llms.txt', 'beginnt nicht mit „# Titel“');
  if (!/^> /m.test(text)) b.warnung('/llms.txt', 'Zusammenfassung „> …“ fehlt');
  for (const m of text.matchAll(/\]\((https?:\/\/[^)]+|\/[^)]*)\)/g)) {
    const u = m[1].startsWith(SITE) ? m[1].slice(SITE.length) : m[1];
    if (u.startsWith('/') && !dateiAusPfad(root, u)) b.warnung('/llms.txt', `Link ohne Seite: ${m[1]}`);
  }
  if (!/\]\(/.test(text)) b.warnung('/llms.txt', 'enthält keine Links');
}

// CSP und Sicherheitsheader in _headers
const headers = join(root, '_headers');
if (!existsSync(headers)) b.fehler_('/_headers', 'fehlt');
else {
  const text = lesen(headers);
  const csp = text.match(/Content-Security-Policy:\s*(.+)/)?.[1] ?? '';
  if (!csp) b.fehler_('/_headers', 'Content-Security-Policy fehlt');
  for (const d of ["default-src 'self'", "script-src 'self'", "style-src 'self'", "connect-src 'self'", "font-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'"])
    if (!csp.includes(d)) b.fehler_('/_headers', `CSP ohne ${d}`);
  if (/unsafe-inline|unsafe-eval/.test(csp)) b.fehler_('/_headers', 'CSP enthält unsafe-inline oder unsafe-eval');
  for (const h of ['Strict-Transport-Security', 'X-Content-Type-Options', 'Referrer-Policy', 'X-Frame-Options'])
    if (!text.includes(h + ':')) b.fehler_('/_headers', `${h} fehlt`);
}

// CSS: keine Fremd-URLs
for (const datei of dateien(root, '.css')) {
  const css = lesen(datei);
  for (const m of css.matchAll(/(?:url\(\s*['"]?|@import\s+['"])([^'")\s]+)/g)) if (fremd(m[1])) b.fehler_(pfadAusDatei(root, datei), `Fremd-URL im CSS: ${m[1]}`);
}

console.log(`  ${seiten.size} Seiten geprüft${golive ? ', Go-live-Regeln aktiv' : ''}`);
process.exit(b.bericht() ? 0 : 1);
