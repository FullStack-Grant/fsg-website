// Prüfung 8 (T4 6.2): axe-core gegen WCAG 2.2 AA je Seite in hell, dunkel, desktop und mobil.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seiten } from './seiten';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

test.describe('Barrierefreiheit', () => {
  for (const pfad of seiten) {
    test(`${pfad}`, async ({ page }) => {
      await page.goto(pfad, { waitUntil: 'load' });
      const ergebnis = await new AxeBuilder({ page }).withTags(TAGS).analyze();
      const befunde = ergebnis.violations.map(
        (v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`,
      );
      expect(befunde, 'axe-Violations').toEqual([]);
    });
  }
});
