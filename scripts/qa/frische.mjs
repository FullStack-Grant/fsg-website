// Prüfung 12 (T4 6.2): Inhaltsfrische. Programm- und Themenseiten mit `zuletztGeprueft` älter als 90 Tage
// oder überschrittenem `pruefTermin` (warnt; der Wochenlauf macht daraus ein Issue).
// Aufruf: node scripts/qa/frische.mjs [--tage 90]
import { Befunde, argumente, dateien, lesen } from './lib.mjs';

const arg = argumente();
const tage = Number(arg.tage ?? 90);
const heute = new Date();
const b = new Befunde('frische');

for (const datei of [...dateien('src/content/programme', '.md'), ...dateien('src/content/themen', '.md')]) {
  const fm = lesen(datei).split(/^---\s*$/m)[1] ?? '';
  if (/^status:\s*entwurf/m.test(fm)) continue;
  const geprueft = fm.match(/^zuletztGeprueft:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  const termin = fm.match(/^pruefTermin:\s*["']?(\d{4}-\d{2}-\d{2})/m)?.[1];
  if (!geprueft) b.warnung(datei, 'zuletztGeprueft fehlt');
  else {
    const alter = Math.floor((heute - new Date(geprueft)) / 86_400_000);
    if (alter > tage) b.warnung(datei, `zuletzt geprüft ${geprueft} (vor ${alter} Tagen)`);
  }
  if (termin && new Date(termin) < heute) b.warnung(datei, `Prüftermin ${termin} überschritten`);
}

b.bericht();
// Warnungen sind das Ergebnis; Exit 3 signalisiert dem Wochenlauf „Issue anlegen“.
process.exit(b.warnungen.length ? 3 : 0);
