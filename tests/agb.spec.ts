// Eingefrorene AGB-Fassungen (WEB T12): Die Adresse aus dem Vertrag (Vorlage 1.1 § 1 Abs. 3, „fullstackgrant.de/agb/1-1/“)
// löst auch ohne Schrägstrich am Ende auf, und das ausgelieferte PDF ist byte-gleich mit der eingefrorenen Fassung.
// Läuft lokal gegen den Vorschau-Build und mit QA_BASE_URL gegen Produktion.
import { test, expect } from '@playwright/test';
import { createHash } from 'node:crypto';
import register from '../src/data/agb-fassungen.json' with { type: 'json' };

test.describe('AGB-Fassungen', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop-hell', 'geräteunabhängig: nur desktop-hell'));

  for (const f of register.fassungen) {
    test(`${f.seite} und PDF (SHA-256)`, async ({ request, page }) => {
      const ohne = f.seite.replace(/\/$/, '');
      const umleitung = await request.get(ohne, { maxRedirects: 0 });
      expect([301, 307, 308], `${ohne} leitet um`).toContain(umleitung.status());
      expect(new URL(umleitung.headers()['location'], 'http://x').pathname, 'Ziel der Umleitung').toBe(f.seite);

      const antwort = await page.goto(ohne);
      expect(antwort!.status(), 'HTTP-Status').toBe(200);
      expect(new URL(page.url()).pathname).toBe(f.seite);
      await expect(page.locator(`a[href="${f.pdf}"]`)).toBeVisible();

      const pdf = await request.get(f.pdf);
      expect(pdf.status(), 'PDF HTTP-Status').toBe(200);
      expect(pdf.headers()['content-type'] ?? '', 'PDF Content-Type').toContain('application/pdf');
      const hash = createHash('sha256').update(await pdf.body()).digest('hex');
      expect(hash, 'SHA-256 des ausgelieferten PDF').toBe(f.sha256);
    });
  }
});
