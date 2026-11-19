# Befunde beheben

Je Prüfung: Werkzeug, Ort, typische Befunde und Behebung. Nummern wie im Testkonzept (T4 Abschnitt 6.2).

| # | Prüfung | Werkzeug | Stufe | Gate |
|---|---|---|---|---|
| 1 | Build, Typen, Frontmatter | `astro check`, `astro build`, Zod in `src/content.config.ts` | 1 bis 3 | blockiert |
| 2 | HTML | html-validate (`.htmlvalidate.json`), Nu Html Checker (`vnu-jar`, nur CI) | 1 bis 3 | blockiert |
| 3 | Interne Links, Anker | `scripts/qa/seo.mjs` | 1 bis 3 | blockiert (Entwurfsziele vor Go-live: warnt) |
| 4 | Externe Links | lychee | 3 (PR), 4 | warnt |
| 5 | Meta, Canonical, OG, hreflang, robots, Sitemap (XSD), `llms.txt`, Pflichtlinks, CSP in `_headers` | `scripts/qa/seo.mjs` | 1 bis 3 | blockiert (Längen, `llms.txt`: warnt) |
| 6 | JSON-LD | `scripts/qa/seo.mjs` mit `@adobe/structured-data-validator` und schema.org 30.1 (`scripts/qa/daten/`) | 1 bis 3 | blockiert bei ERROR |
| 7 | Datenschutz | `tests/datenschutz.spec.ts` gegen `scripts/qa/server.mjs` (setzt `_headers`) | 2, 3, 4 | blockiert |
| 8 | Barrierefreiheit | `tests/barrierefreiheit.spec.ts` (axe, `wcag2a` bis `wcag22aa`) | 2, 3 | blockiert |
| 9 | Visuelle Regression | `tests/visuell.spec.ts`, Container `mcr.microsoft.com/playwright:v1.65.0-noble` | 3 | blockiert |
| 10 | Lighthouse | `lighthouserc.cjs` | 3 | gemischt |
| 11 | Textregeln | `scripts/qa/textregeln.mjs` (Sperr- und Warnliste aus T9) | 1 bis 3 | blockiert |
| 12 | Inhaltsfrische | `scripts/qa/frische.mjs` | 4 | warnt (Issue) |
| 13 | Produktion nach Deploy | `scripts/qa/smoke.mjs`, `nach-deploy.yml` | nach Deploy | rot = Revert-PR |
| 14 | Secrets | gitleaks 8.30.1 (Prüfsumme gepinnt) | 3 | blockiert |

## Typische Befunde
- **Schema-Fehler im Build** (`dateModified` vor `datePublished`, H1 im Markdown, doppelter Anker): Frontmatter bzw. Text korrigieren, nie das Schema lockern. Die Meldung nennt Sammlung und Datei.
- **`canonical … ungleich …`** oder **`og:url ungleich canonical`**: Pfad im Frontmatter (`url`/`slug`) prüfen; Pfade enden mit `/`.
- **`toter interner Link`**: Ziel existiert in keinem Build. Link auf eine bestehende Seite ändern oder Seite anlegen. **`Link auf Entwurf`**: Zielseite ist noch `entwurf`; vor Go-live Warnung, danach Fehler, also freigeben lassen oder Link entfernen.
- **`Anker fehlt`**: Überschrift-ID `{#anker}` am Ziel prüfen; bestehende Anker nie umbenennen.
- **`Pflichtlink … fehlt`**: Fußzeile (`src/components/Fuss.astro`, `src/data/navigation.ts`) muss auf jeder Seite `/impressum/` und `/datenschutz/` verlinken.
- **`Inline-Skript`, `style-Attribut`, `<style>-Block`**: verletzt die CSP (`script-src 'self'`, `style-src 'self'`). Styles in die Komponente bzw. `global.css`, Skripte als Datei; `inlineStylesheets: 'never'` bleibt.
- **`Fremd-Ressource`, Fremd-Request im Browser**: Schrift, Bild, Skript selbst hosten. Neue Dienste mit Datenfluss nur nach Diensteliste, Datenschutzerklärung und Felix' OK (Skill `website-authoring`).
- **`CSP-Verletzungen und Skriptfehler`**: Konsole zeigt die blockierte Quelle; Ressource auf eigenen Host verlegen, CSP nicht lockern.
- **`Cookies` oder `localStorage`**: nichts speichern; Einstellungen (z. B. Farbschema) folgen `prefers-color-scheme`.
- **axe `color-contrast`**: oft nur im Dunkelmodus oder auf `--fsg-color-bg-subtle`. Token mit ausreichendem Kontrast wählen (`--fsg-color-text-muted` statt `-subtle` auf getöntem Grund), Kit-Dateien nicht von Hand ändern.
- **axe `landmark-unique`/html-validate `unique-landmark`**: mehrere `nav`/`aside` brauchen eindeutige `aria-label`; rein gestalterische Ränder als `div`.
- **JSON-LD `Required attribute … is missing`**: in `src/lib/jsonld.ts` ergänzen; reine Verweisknoten `{@type, @id}` sind erlaubt und werden übersprungen.
- **Sitemap XSD**: Ursache meist eine Integration oder ein falsches `site` in `astro.config.mjs`.
- **robots.txt in Produktion sperrt einen KI-Crawler**: Entscheidung 14.11. (KI-Crawler und Training erlaubt) einhalten, `src/pages/robots.txt.ts` korrigieren.
- **Textregel `Gedankenstrich`, `Platzhalter`, `Redaktionsmarker`**: Text umformulieren (Komma, Doppelpunkt, Klammer); Bis-Strich nur zwischen Zahlen. **T9-Sperrwort**: Ersatz aus `rechtsregeln.md` im Skill `website-authoring`.
- **Lighthouse LCP oder CLS**: Bildgrößen (`width`/`height`), Schrift-Preload, keine nachladenden Elemente über dem Inhalt. Bericht im Artefakt `lighthouse-bericht`.
- **Snapshot-Diff**: Artefakt `playwright-bericht` öffnen (Expected, Actual, Diff). Gewollt → Baselines neu (SKILL.md); ungewollt → Ursache beheben.
- **gitleaks**: Secret sofort beim Anbieter widerrufen, aus dem Branch entfernen; Felix informieren. Secrets nie ins Repo.
- **Smoke `workers.dev ohne X-Robots-Tag noindex`**: Host-Regel in `public/_headers` prüfen (bis T13 Pflicht).
