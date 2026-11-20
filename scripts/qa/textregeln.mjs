// FSG-Textregeln (T4 6.2 Nr. 11, Prüfwortliste aus T9 „Prüfregeln website-authoring“).
// Prüft den sichtbaren Text, Meta-Texte, alt/aria-Texte und JSON-LD im Build (--dir) oder einzelne Quelldateien (--datei).
// Aufruf: node scripts/qa/textregeln.mjs --dir dist-vorschau
//         node scripts/qa/textregeln.mjs --datei src/content/seiten/vorgehen.md
// Sperrliste mit Kundennamen (nie im Repo): Datei aus FSG_SPERRLISTE, ein Begriff je Zeile.
import { existsSync } from 'node:fs';
import * as cheerio from 'cheerio';
import { Befunde, argumente, dateien, lesen, pfadAusDatei } from './lib.mjs';

const arg = argumente();
const b = new Befunde(`textregeln ${arg.dir ?? arg.datei ?? ''}`);

// [Muster, Begründung]; Groß- und Kleinschreibung egal.
const SPERREN = [
  [/prüfungssicher/i, 'T9: nicht einlösbar (Ersatz: nachvollziehbar, belastbar mit Quelle, lückenlos nur Stundenerfassung)'],
  [/prüfungsfest/i, 'T9: wie prüfungssicher'],
  [/revisionssicher/i, 'T9: Archiv-IT-Begriff, nicht einlösbar'],
  [/Prüfakte/i, 'T9: gesperrt'],
  [/Prüfungsbegleitung/i, 'T9: Steuerberatung (StBerG)'],
  [/Rabatt|Skonto/i, 'T9: kein Rabatt in der Vergütung'],
  [/ohne Risiko/i, 'T9: Erfolgsversprechen (UWG)'],
  [/kostenlose Förderberatung/i, 'T9: gesperrt'],
  [/beantragen lassen/i, 'T9: FSG reicht nie ein (§ 264 StGB, StBerG)'],
  [/schreibt und rechnet/i, 'T9: gesperrt'],
  [/lehnst dich zurück/i, 'T9: gesperrt'],
  [/Vermittlung/i, 'T9: keine Vermittlung von Kapital oder Krediten'],
  [/compliance documentation/i, 'T9: gesperrt'],
  [/FullStack Grant UG(?!\s*\(haftungsbeschränkt\))/, 'Firmenname nur mit „(haftungsbeschränkt)“'],
  [/garantiert|Erfolgsgarantie|Förderzusage garantiert|100\s*%\s*Erfolg/i, 'T4: verbotene Werbeformel (Art. 46 DSGVO „Garantien“ bleibt erlaubt)'],
  [/\[(T\d+|prüfen|LEGAL|RA|Platzhalter|Gerüst)[\]\s:-]/, 'Redaktionsmarker'],
  [/\{(?!#)[^{}\n]{1,40}\}/, 'Platzhalter {…}'],
  [/—/, 'Gedankenstrich (U+2014): Komma, Doppelpunkt, Punkt oder Klammer'],
  [/(?<!\d\s?)–|–(?!\s?\d)/, 'Halbgeviertstrich (U+2013) außerhalb eines Zahlenbereichs'],
];
const WARNEN = [
  [/Prüfung(?! des Fördergebers)/, 'T9: „Prüfung“ nur als „Prüfung des Fördergebers“'],
  [/zahlst du nichts/i, 'T9: nur im Kontext Forschungszulage'],
  [/Erfolgshonorar(?![^.]{0,80}Einzelheiten im Angebot)/i, 'T9: mit „Einzelheiten im Angebot“'],
  [/\bermitteln/i, 'T9: Steuerberatungsnähe prüfen'],
  [/\bübernimmt\b/i, 'T9: Leistungsgrenze prüfen'],
  [/\bsofort\b/i, 'T9: Zeitversprechen'],
  [/schnellste/i, 'T9: Spitzenstellung (UWG)'],
];

function sperrnamen() {
  const p = process.env.FSG_SPERRLISTE;
  if (!p) return null;
  if (!existsSync(p)) {
    b.fehler_('FSG_SPERRLISTE', `Datei fehlt: ${p}`);
    return [];
  }
  return lesen(p).split(/\r?\n/).map((z) => z.trim()).filter((z) => z && !z.startsWith('#'));
}
const namen = sperrnamen();
if (namen === null) b.warnung('Kundennamen', 'nicht geprüft (FSG_SPERRLISTE nicht gesetzt)');

function pruefe(ort, text, { ohnePlatzhalter = false } = {}) {
  const ausschnitt = (m) => text.slice(Math.max(0, m.index - 30), m.index + m[0].length + 30).replace(/\s+/g, ' ').trim();
  for (const [re, grund] of SPERREN) {
    if (ohnePlatzhalter && grund.startsWith('Platzhalter')) continue;
    const m = text.match(re);
    if (m) b.fehler_(ort, `${grund}: „${ausschnitt(m)}“`);
  }
  for (const [re, grund] of WARNEN) {
    const m = text.match(re);
    if (m) b.warnung(ort, `${grund}: „${ausschnitt(m)}“`);
  }
  for (const n of namen ?? []) {
    const i = text.toLowerCase().indexOf(n.toLowerCase());
    if (i >= 0) b.fehler_(ort, 'Kundenname aus der Sperrliste (Name wird nicht ausgegeben)');
  }
}

if (arg.dir) {
  for (const datei of dateien(arg.dir, '.html')) {
    const $ = cheerio.load(lesen(datei).replace(/></g, '> <'));
    const ort = pfadAusDatei(arg.dir, datei);
    const jsonld = $('script[type="application/ld+json"]').map((_, e) => $(e).text()).get().join(' ');
    $('script, style, noscript').remove();
    const attribute = $('[alt], [title], [aria-label], meta[content]')
      .map((_, e) => [$(e).attr('alt'), $(e).attr('title'), $(e).attr('aria-label'), $(e).is('meta[name="description"], meta[property^="og:"]') ? $(e).attr('content') : ''].filter(Boolean).join(' '))
      .get()
      .join(' ');
    pruefe(ort, `${$('title').text()} ${$('body').text()} ${attribute}`.replace(/\s+/g, ' '));
    // JSON-LD separat: dort sind {…} JSON-Syntax, kein Platzhalter.
    const ldText = jsonld.replace(/[{}]/g, ' ');
    for (const [re, grund] of SPERREN.filter(([, g]) => !g.startsWith('Platzhalter'))) {
      const m = ldText.match(re);
      if (m) b.fehler_(`${ort} (JSON-LD)`, `${grund}: „${m[0]}“`);
    }
  }
} else if (arg.datei) {
  const roh = lesen(arg.datei);
  // HTML-Kommentare (interne Notizen) liefert der Build nicht aus; Frontmatter-Schlüssel sind keine Texte.
  const text = roh.replace(/<!--[\s\S]*?-->/g, (k) => k.replace(/[^\n]/g, ' '));
  // Im Frontmatter sind {…} YAML-Syntax; dort entfällt nur die Platzhalter-Regel.
  const zeilen = text.split(/\r?\n/);
  const fmEnde = zeilen[0]?.trim() === '---' ? zeilen.indexOf('---', 1) : -1;
  zeilen.forEach((zeile, i) => pruefe(`${arg.datei}:${i + 1}`, zeile, { ohnePlatzhalter: i <= fmEnde }));
} else {
  console.error('Aufruf: --dir <build> oder --datei <quelle>');
  process.exit(2);
}

process.exit(b.bericht() ? 0 : 1);
