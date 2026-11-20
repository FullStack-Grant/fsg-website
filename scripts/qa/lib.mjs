// Gemeinsame Helfer der QA-Skripte (WEB T11, Skill website-testing).
// Jedes Prüfskript sammelt Befunde als Fehler (blockiert) oder Warnung und endet mit Exit 1 bei Fehlern.
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

export const SITE = 'https://fullstackgrant.de';

export function dateien(dir, endung) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = join(dir, e.name);
    if (e.isDirectory()) return e.name === 'node_modules' ? [] : dateien(p, endung);
    return p.endsWith(endung) ? [p] : [];
  });
}

/** HTML-Datei in dist → URL-Pfad (`/wissen/faq/index.html` → `/wissen/faq/`). */
export function pfadAusDatei(root, datei) {
  const rel = relative(root, datei).split(sep).join('/');
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

/** URL-Pfad → Datei in dist oder null. */
export function dateiAusPfad(root, pfad) {
  const p = decodeURIComponent(pfad.split('#')[0].split('?')[0]);
  const kandidaten = p.endsWith('/') ? [join(root, p, 'index.html')] : [join(root, p), join(root, p, 'index.html'), join(root, p + '.html')];
  return kandidaten.find((k) => existsSync(k)) ?? null;
}

export function lesen(datei) {
  return readFileSync(datei, 'utf8');
}

export class Befunde {
  constructor(name) {
    this.name = name;
    this.fehler = [];
    this.warnungen = [];
  }
  fehler_(ort, text) {
    this.fehler.push(`${ort}: ${text}`);
  }
  warnung(ort, text) {
    this.warnungen.push(`${ort}: ${text}`);
  }
  /** Ausgabe; Rückgabe true = ohne Fehler. */
  bericht() {
    const grenze = 60;
    const liste = (titel, arr) => {
      if (!arr.length) return;
      console.log(`  ${titel} (${arr.length}):`);
      for (const z of arr.slice(0, grenze)) console.log(`    ${z}`);
      if (arr.length > grenze) console.log(`    … und ${arr.length - grenze} weitere`);
    };
    const status = this.fehler.length ? 'ROT' : 'GRÜN';
    console.log(`[${this.name}] ${status}: ${this.fehler.length} Fehler, ${this.warnungen.length} Warnungen`);
    liste('Fehler', this.fehler);
    liste('Warnungen', this.warnungen);
    return this.fehler.length === 0;
  }
}

/** Argumente `--name wert` und Flags `--flag`. */
export function argumente(argv = process.argv.slice(2)) {
  const a = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) a[k] = argv[++i];
      else a[k] = true;
    } else a._.push(argv[i]);
  }
  return a;
}

/** Steht die Live-Route (fullstackgrant.de) in wrangler.jsonc? Ab dann gelten Go-live-Regeln (T13). */
export function liveRouteGesetzt(repoRoot = process.cwd()) {
  const w = join(repoRoot, 'wrangler.jsonc');
  if (!existsSync(w)) return false;
  const ohneKommentare = lesen(w).replace(/^\s*\/\/.*$/gm, '');
  return /"routes?"\s*:[\s\S]*fullstackgrant\.de/.test(ohneKommentare);
}
