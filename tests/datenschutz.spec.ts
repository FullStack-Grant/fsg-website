// Prüfung 7 (T4 6.2): keine Fremd-Requests, keine WebSockets, keine Cookies, kein Storage,
// CSP-Header vorhanden und ohne Verletzung, Pflichtlinks Impressum und Datenschutz sichtbar.
import { test, expect } from '@playwright/test';
import { seiten } from './seiten';

test.describe('Datenschutz', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name.endsWith('dunkel'), 'farbunabhängig: nur hell'));

  for (const pfad of seiten) {
    test(`${pfad}`, async ({ page, context, baseURL }) => {
      const eigen = new URL(baseURL!).origin;
      const fremd: string[] = [];
      const csp: string[] = [];
      context.on('request', (r) => {
        const u = new URL(r.url());
        if (!['data:', 'blob:'].includes(u.protocol) && u.origin !== eigen) fremd.push(r.url());
      });
      // Fremd-Requests nicht wirklich senden.
      await context.route((url) => url.origin !== eigen && !['data:', 'blob:'].includes(url.protocol), (route) => route.abort());
      page.on('websocket', (ws) => fremd.push(`WebSocket ${ws.url()}`));
      page.on('console', (m) => {
        if (/Content Security Policy|Refused to (load|apply|execute|connect)/i.test(m.text())) csp.push(m.text());
      });
      page.on('pageerror', (e) => csp.push(`Skriptfehler: ${e.message}`));

      const antwort = await page.goto(pfad, { waitUntil: 'load' });
      expect(antwort, 'Antwort').not.toBeNull();
      expect(antwort!.status(), 'HTTP-Status').toBeLessThan(400);
      const header = antwort!.headers();
      expect(header['content-security-policy'] ?? '', 'CSP-Header').toContain("default-src 'self'");

      // Lazy-Loading auslösen, Menü öffnen, falls vorhanden.
      await page.mouse.wheel(0, 50_000);
      const menue = page.locator('button[aria-controls], button[aria-expanded]').first();
      if (await menue.isVisible().catch(() => false)) await menue.click();
      await page.waitForTimeout(300);

      expect(fremd, 'Fremd-Requests').toEqual([]);
      expect(csp, 'CSP-Verletzungen und Skriptfehler').toEqual([]);
      const s = await context.storageState({ indexedDB: true });
      expect(s.cookies, 'Cookies').toEqual([]);
      expect(s.origins, 'localStorage/IndexedDB').toEqual([]);

      const fuss = page.locator('footer');
      await fuss.scrollIntoViewIfNeeded();
      await expect(fuss.getByRole('link', { name: 'Impressum' })).toBeVisible();
      await expect(fuss.getByRole('link', { name: 'Datenschutz' })).toBeVisible();
    });
  }
});
