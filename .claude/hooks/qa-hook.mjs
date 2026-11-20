// Claude-Code-Hooks für website-testing (WEB T11, T4 6.3). Liest das Hook-JSON von stdin und ruft scripts/qa/qa.mjs.
//   schnell: PostToolUse auf Edit|Write|MultiEdit; Befund geht per Exit 2 an Claude (blockiert technisch nicht).
//   commit:  PreToolUse auf Bash; nur bei `git commit`: Stufe 2, Exit 2 blockiert den Commit.
//   stop:    Stop; Stufe 2, wenn sich Website-Dateien seit dem letzten grünen Lauf geändert haben; Exit 2 = weiterarbeiten.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const modus = process.argv[2];
const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
process.chdir(root);
let eingabe = {};
try {
  eingabe = JSON.parse(readFileSync(0, 'utf8') || '{}');
} catch {}

const CACHE = join(root, '.qa-cache', 'gruen.txt');
const PFADE = ['src', 'public', 'scripts', 'tests', 'astro.config.mjs', 'package.json', 'package-lock.json', 'playwright.config.ts', 'lighthouserc.cjs', '.htmlvalidate.json', 'wrangler.jsonc'];

function git(args) {
  return spawnSync('git', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 }).stdout ?? '';
}

/** Fingerabdruck des Arbeitsstands der Website-Dateien (Commit, Diff, neue Dateien). */
function stand() {
  const diff = git(['diff', 'HEAD', '--', ...PFADE]);
  const neu = git(['ls-files', '--others', '--exclude-standard', '--', ...PFADE]);
  const h = createHash('sha256').update(git(['rev-parse', 'HEAD']) + diff + neu);
  for (const f of neu.split('\n').filter(Boolean)) if (existsSync(f)) h.update(readFileSync(f));
  return h.digest('hex');
}

function qa(stufe, extra = []) {
  const r = spawnSync(process.execPath, ['scripts/qa/qa.mjs', stufe, ...extra], { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  return { ok: r.status === 0, text: `${r.stdout ?? ''}${r.stderr ?? ''}` };
}

// Nur Zusammenfassung und Fehlerzeilen an Claude, nicht das ganze Protokoll.
// Warnungen bleiben draußen; Fehlerblöcke der Prüfskripte, Playwright-Fehler und die Stufen-Zusammenfassung bleiben.
function kurz(text) {
  const out = [];
  let imFehlerblock = false;
  for (const z of text.split('\n')) {
    if (/^\s+Fehler \(\d+\):/.test(z)) imFehlerblock = true;
    else if (/^\s+Warnungen \(\d+\):|^\[/.test(z)) imFehlerblock = false;
    if (imFehlerblock || /^\[.*\] ROT|^\s+ROT |^\s+\d+\) |Error:|axe-Violations|^\s+\+\s+"/.test(z)) out.push(z);
  }
  return [...new Set(out)].slice(0, 60).join('\n');
}

function gruenMerken() {
  mkdirSync(join(root, '.qa-cache'), { recursive: true });
  writeFileSync(CACHE, stand());
}

const istGruen = () => existsSync(CACHE) && readFileSync(CACHE, 'utf8') === stand();

if (modus === 'schnell') {
  const datei = eingabe.tool_input?.file_path ?? '';
  const r = qa('schnell', datei ? ['--datei', datei] : []);
  if (!r.ok) {
    process.stderr.write(`website-testing Stufe 1 ROT nach Änderung an ${datei}:\n${kurz(r.text)}\nJetzt beheben (Skill website-testing, „Befunde beheben“).\n`);
    process.exit(2);
  }
  process.exit(0);
}

if (modus === 'commit') {
  const befehl = eingabe.tool_input?.command ?? '';
  if (!/\bgit\b[^|;&]*\bcommit\b/.test(befehl) || istGruen()) process.exit(0);
  const r = qa('voll');
  if (!r.ok) {
    process.stderr.write(`Commit blockiert: website-testing Stufe 2 ROT.\n${kurz(r.text)}\nBefunde beheben, dann erneut committen.\n`);
    process.exit(2);
  }
  gruenMerken();
  process.exit(0);
}

if (modus === 'stop') {
  if (eingabe.stop_hook_active) process.exit(0);
  const sauber = git(['status', '--porcelain', '--', ...PFADE]).trim() === '';
  if (sauber || istGruen()) process.exit(0);
  const r = qa('voll');
  if (!r.ok) {
    process.stderr.write(`website-testing Stufe 2 ROT (Stop-Hook):\n${kurz(r.text)}\nBefunde beheben oder Felix den roten Stand ausdrücklich melden.\n`);
    process.exit(2);
  }
  gruenMerken();
  process.exit(0);
}

process.exit(0);
