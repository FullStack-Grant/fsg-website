// Lighthouse CI (WEB T11, T4 6.2 Nr. 10): Vorschau-Build über den QA-Server mit echten Headern.
// Kategorien a11y, Best Practices, SEO ≥ 0,95 und LCP, CLS blockieren; Performance-Score und Gewicht warnen.
// „is-crawlable“ entfällt, weil die Vorschau bewusst noindex trägt (Produktion prüft seo.mjs).
const basis = 'http://localhost:4401';
const seiten = ['/', '/leistungen/', '/foerderung/programme/forschungszulage/', '/wissen/artikel/foerderberatung-aus-finance-sicht/', '/ueber-uns/'];

module.exports = {
  ci: {
    collect: {
      startServerCommand: 'node scripts/qa/server.mjs --dir dist-vorschau --port 4401',
      startServerReadyPattern: 'QA-Server',
      url: seiten.map((s) => basis + s),
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        skipAudits: ['is-crawlable'],
        chromeFlags: '--no-sandbox --headless=new',
      },
    },
    assert: {
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.95 }],
        'categories:seo': ['error', { minScore: 0.95 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median-run' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median-run' }],
        'categories:performance': ['warn', { minScore: 0.9 }],
        'total-byte-weight': ['warn', { maxNumericValue: 500000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: '.lighthouseci' },
  },
};
