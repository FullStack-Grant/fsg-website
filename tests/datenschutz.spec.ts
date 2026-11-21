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

// Einwilligung (WEB T12, Felix 20.11.2026): vor der Wahl nichts von Dritten; „Nur notwendige“ setzt nur das eigene
// Einwilligungs-Cookie; erst „Alle erlauben“ lädt die Terminbuchung, und zwar nur von calendar.google.com.
const EINWILLIGUNG_COOKIE = 'fsg_einwilligung';
const ERLAUBT_NACH_EINWILLIGUNG = ['https://calendar.google.com'];

test.describe('Einwilligung', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name.endsWith('dunkel'), 'farbunabhängig: nur hell'));
  test.skip(!seiten.includes('/kontakt/'), 'keine Kontaktseite im Build');

  test('/kontakt/: Terminbuchung erst nach Einwilligung', async ({ page, context, baseURL }) => {
    const eigen = new URL(baseURL!).origin;
    const fremd: string[] = [];
    context.on('request', (r) => {
      const u = new URL(r.url());
      if (!['data:', 'blob:'].includes(u.protocol) && u.origin !== eigen) fremd.push(u.origin);
    });
    await context.route((url) => url.origin !== eigen && !['data:', 'blob:'].includes(url.protocol), (route) => route.abort());
    const cookieNamen = async () => (await context.cookies()).map((c) => c.name);

    await page.goto('/kontakt/', { waitUntil: 'load' });
    const banner = page.getByRole('dialog', { name: 'Externe Inhalte' });
    await expect(banner).toBeVisible();
    await expect(page.locator('[data-termin-rahmen] iframe')).toHaveCount(0);
    expect(fremd, 'Fremd-Requests vor der Wahl').toEqual([]);
    expect(await cookieNamen(), 'Cookies vor der Wahl').toEqual([]);

    await banner.getByRole('button', { name: 'Nur notwendige' }).click();
    await expect(banner).toBeHidden();
    await page.waitForTimeout(300);
    expect(fremd, 'Fremd-Requests nach „Nur notwendige“').toEqual([]);
    expect(await cookieNamen(), 'nur das Einwilligungs-Cookie').toEqual([EINWILLIGUNG_COOKIE]);
    await expect(page.locator('[data-termin-rahmen] iframe')).toHaveCount(0);

    await page.locator('footer').getByRole('button', { name: 'Cookie-Einstellungen' }).click();
    await expect(banner).toBeVisible();
    await banner.getByRole('button', { name: 'Alle erlauben' }).click();
    await expect(page.locator('[data-termin-rahmen] iframe')).toHaveCount(1);
    await expect.poll(() => fremd.length, { message: 'Terminbuchung angefragt' }).toBeGreaterThan(0);
    expect([...new Set(fremd)], 'nur erlaubte Herkunft').toEqual(ERLAUBT_NACH_EINWILLIGUNG);
    expect(await cookieNamen(), 'weiterhin nur das Einwilligungs-Cookie').toEqual([EINWILLIGUNG_COOKIE]);
    expect((await context.storageState({ indexedDB: true })).origins, 'localStorage/IndexedDB').toEqual([]);
  });
});
