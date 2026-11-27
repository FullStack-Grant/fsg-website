// Prüfung 9 (T4 6.2): visuelle Regression, nur im Linux-Container der CI (Baselines aus Linux).
// Neue Baselines nur über den Workflow „update-snapshots“; Felix gibt sie im PR frei.
import { test, expect } from '@playwright/test';
import { istExtern } from './seiten';

// Je Seitentyp eine Seite (seit WEB T12 echte Seiten statt Muster).
const VORLAGEN = [
  '/', '/leistungen/', '/vorgehen/', '/ueber-uns/', '/kontakt/', '/verguetung/',
  '/foerderung/', '/foerderung/programme/', '/foerderung/programme/forschungszulage/', '/foerderung/muster-thema/',
  '/wissen/', '/wissen/artikel/foerderberatung-aus-finance-sicht/', '/wissen/glossar/', '/impressum/', '/gibt-es-nicht/',
];

test.describe('Visuell', () => {
  test.skip(istExtern, 'nicht gegen Produktion');
  test.skip(process.platform !== 'linux' && !process.env.QA_VISUELL, 'Baselines nur im Linux-Container (CI)');

  for (const pfad of VORLAGEN) {
    test(`${pfad}`, async ({ page }) => {
      await page.goto(pfad, { waitUntil: 'load' });
      await page.evaluate(() => document.fonts.ready);
      const name = pfad === '/' ? 'start' : pfad.replace(/^\/|\/$/g, '').replace(/\//g, '_');
      await expect(page).toHaveScreenshot(`${name}.png`, { fullPage: true });
    });
  }
});
