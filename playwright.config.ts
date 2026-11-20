// Playwright für die Browser-Prüfungen (WEB T11, T4 6.2 Nr. 7, 8, 9).
// Server: scripts/qa/server.mjs liefert den Vorschau-Build mit den Headern aus _headers aus.
// QA_BASE_URL überschreibt das Ziel (Stufe 4 gegen Produktion), dann startet kein lokaler Server.
import { defineConfig, devices } from '@playwright/test';

const port = 4400;
const extern = process.env.QA_BASE_URL;
const dir = process.env.QA_DIR ?? 'dist-vorschau';

const basis = { reducedMotion: 'reduce' as const, serviceWorkers: 'block' as const, locale: 'de-DE' };

export default defineConfig({
  testDir: 'tests',
  snapshotPathTemplate: '{testDir}/__screenshots__/{projectName}/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, threshold: 0.2, animations: 'disabled', caret: 'hide' },
  },
  use: {
    baseURL: extern ?? `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop-hell', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'light', ...basis } },
    { name: 'desktop-dunkel', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 }, colorScheme: 'dark', ...basis } },
    { name: 'mobil-hell', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 }, colorScheme: 'light', ...basis } },
    { name: 'mobil-dunkel', use: { ...devices['Pixel 7'], viewport: { width: 375, height: 812 }, colorScheme: 'dark', ...basis } },
  ],
  webServer: extern
    ? undefined
    : { command: `node scripts/qa/server.mjs --dir ${dir} --port ${port}`, port, reuseExistingServer: !process.env.CI, timeout: 20_000 },
});
