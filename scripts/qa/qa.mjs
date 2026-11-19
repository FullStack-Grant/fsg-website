// Einstieg aller Prüfstufen (WEB T11, T4 6.3). Hooks, npm-Skripte und CI rufen nur dieses Skript bzw.
// dieselben Einzelskripte; es gibt keine zweite Prüflogik.
//   node scripts/qa/qa.mjs schnell [--datei <pfad>]   Stufe 1, < 30 s (Hook nach Edit/Write)
//   node scripts/qa/qa.mjs voll                       Stufe 2, < 3 min (vor Commit, Stop-Hook)
//   node scripts/qa/qa.mjs ci                         Stufe 3 lokal nachstellen (vnu nur mit Java, visuell nur Linux)
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { argumente } from './lib.mjs';

const arg = argumente();
const stufe = arg._[0] ?? 'voll';
const NODE = process.execPath;
const BIN = {
  astro: 'node_modules/astro/bin/astro.mjs',
  htmlvalidate: 'node_modules/html-validate/bin/html-validate.mjs',
  playwright: 'node_modules/@playwright/test/cli.js',
  lhci: 'node_modules/@lhci/cli/src/cli.js',
};

const ergebnisse = [];
function schritt(name, befehl, args, env = {}) {
  const start = Date.now();
  const r = spawnSync(befehl, args, { stdio: 'inherit', env: { ...process.env, ...env }, shell: false });
  const ok = r.status === 0;
  ergebnisse.push({ name, ok, s: ((Date.now() - start) / 1000).toFixed(1) });
  return ok;
}
const node = (name, skript, args = [], env) => schritt(name, NODE, [skript, ...args], env);

const bauen = {
  produktion: () => node('Build Produktion', BIN.astro, ['build', '--outDir', 'dist'], { FSG_VORSCHAU: '0' }),
  vorschau: () => node('Build Vorschau', BIN.astro, ['build', '--outDir', 'dist-vorschau'], { FSG_VORSCHAU: '1' }),
};
const pruefen = {
  check: () => node('astro check', BIN.astro, ['check']),
  html: (dir) => node(`HTML ${dir}`, BIN.htmlvalidate, [`${dir}/**/*.html`]),
  seo: (dir, modus) => node(`SEO/Links/JSON-LD ${dir}`, 'scripts/qa/seo.mjs', ['--dir', dir, '--modus', modus, ...(modus === 'produktion' ? ['--vergleich', 'dist-vorschau'] : [])]),
  text: (dir) => node(`Textregeln ${dir}`, 'scripts/qa/textregeln.mjs', ['--dir', dir]),
  browser: (extra = []) => node('Browser (Datenschutz, axe)', BIN.playwright, ['test', ...extra]),
};

const istLinux = process.platform === 'linux';
const hatJava = spawnSync('java', ['-version'], { stdio: 'ignore', shell: false }).status === 0;

if (stufe === 'schnell') {
  const datei = (arg.datei ?? '').replace(/\\/g, '/');
  const relevant = !datei || /(^|\/)(src|public|scripts)\/|astro\.config|content\.config|_headers|_redirects/.test(datei);
  if (!relevant) {
    console.log(`[qa schnell] ${datei}: keine Website-Datei, nichts zu prüfen`);
    process.exit(0);
  }
  if (/\.md$/.test(datei) && /src\/content\//.test(datei)) node('Textregeln Quelle', 'scripts/qa/textregeln.mjs', ['--datei', arg.datei]);
  if (/\.(astro|ts|mts)$/.test(datei)) pruefen.check();
  if (bauen.vorschau()) {
    pruefen.html('dist-vorschau');
    pruefen.seo('dist-vorschau', 'vorschau');
    pruefen.text('dist-vorschau');
  }
} else if (stufe === 'voll' || stufe === 'ci') {
  pruefen.check();
  const p = bauen.produktion();
  const v = bauen.vorschau();
  if (p) {
    pruefen.html('dist');
    pruefen.seo('dist', 'produktion');
    pruefen.text('dist');
  }
  if (v) {
    pruefen.html('dist-vorschau');
    pruefen.seo('dist-vorschau', 'vorschau');
    pruefen.text('dist-vorschau');
    if (stufe === 'ci' && hatJava) {
      const jar = 'node_modules/vnu-jar/build/dist/vnu.jar';
      if (existsSync(jar)) schritt('vnu (Nu Html Checker)', 'java', ['-jar', jar, '--errors-only', '--skip-non-html', 'dist-vorschau']);
    }
    pruefen.browser(stufe === 'ci' && istLinux ? [] : ['--grep-invert', 'Visuell']);
    if (stufe === 'ci') node('Lighthouse CI', BIN.lhci, ['autorun']);
  }
} else {
  console.error('Stufe: schnell | voll | ci');
  process.exit(2);
}

const rot = ergebnisse.filter((e) => !e.ok);
console.log(`\n[qa ${stufe}] ${rot.length ? 'ROT' : 'GRÜN'}`);
for (const e of ergebnisse) console.log(`  ${e.ok ? 'ok  ' : 'ROT '} ${e.name} (${e.s} s)`);
if (rot.length) console.log('Befunde und Behebung: Skill website-testing, Abschnitt „Befunde beheben“.');
process.exit(rot.length ? 1 : 0);
