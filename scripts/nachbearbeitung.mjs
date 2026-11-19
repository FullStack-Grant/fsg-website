// Nach dem Build: HTML-Kommentare entfernen (interne Notizen wie „T9 ab Fassung 1.1“ nie ausliefern)
// und Redaktionsmarker sowie Gedankenstriche im ausgelieferten Text prüfen (T9-Regel G36).
// Produktion: Fund bricht den Build ab. Vorschau: nur Warnung.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = /\[(T\d+|prüfen|LEGAL|RA|F|Felix-Zitat|Platzhalter|Gerüst)[\]\s:-]/;
const STRICH = /[\u2013\u2014]/;

function htmlDateien(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlDateien(join(dir, e.name)) : e.name.endsWith('.html') ? [join(dir, e.name)] : [],
  );
}

// Sichtbarer Text ohne JSON-LD, Styles und Tags; Bis-Strich zwischen Ziffern ist erlaubt.
function sichtbarerText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/(\d)\s*\u2013\s*(\d)/g, '$1 bis $2');
}

export function nachbearbeitung() {
  return {
    name: 'fsg-nachbearbeitung',
    hooks: {
      'astro:build:done': ({ dir, logger }) => {
        const root = fileURLToPath(dir);
        const vorschau = process.env.FSG_VORSCHAU === '1' ||
          ((process.env.WORKERS_CI_BRANCH || process.env.GITHUB_HEAD_REF || 'main') !== 'main');
        const funde = [];
        for (const datei of htmlDateien(root)) {
          const roh = readFileSync(datei, 'utf8');
          const html = roh.replace(/<!--[\s\S]*?-->/g, '');
          if (html !== roh) writeFileSync(datei, html);
          const text = sichtbarerText(html);
          const name = relative(root, datei);
          const m = text.match(MARKER);
          if (m) funde.push(`${name}: Redaktionsmarker „${m[0]}“`);
          const s = text.match(new RegExp(`.{0,30}${STRICH.source}.{0,30}`));
          if (s) funde.push(`${name}: Gedanken- oder Spiegelstrich in „${s[0].trim()}“`);
        }
        if (!funde.length) return;
        const meldung = `Textregeln verletzt:\n  ${funde.join('\n  ')}`;
        if (vorschau) logger.warn(meldung);
        else throw new Error(meldung);
      },
    },
  };
}
