# fullstackgrant.de

Website der FullStack Grant UG (haftungsbeschränkt). Zwei Teile liegen bis zum Go-live (01.12.2026, Projekt WEB T13) nebeneinander im Repo:

| Teil | Wo | Ausgeliefert |
|---|---|---|
| **Platzhalterseite** (live) | `index.html`, `impressum.html`, `datenschutz.html`, `styles.css`, `tokens.css`, `fonts/`, Logos und Icons im Wurzelordner, `CNAME`, `.nojekyll` | GitHub Pages aus `main`, Ordner `/` |
| **Neue Website** (Astro 7) | `src/`, `public/`, `astro.config.mjs`, `wrangler.jsonc` | Cloudflare Workers Static Assets (`fsg-website`), bis T13 nur Vorschau |

GitHub Pages liefert die Astro-Quellen zwar als Dateien aus, nutzt sie aber nicht; die Live-Seite bleibt die Platzhalterseite, bis T13 die Route auf Cloudflare umstellt und die Platzhalterdateien entfernt.

## Neue Website: Befehle
| Befehl | Zweck |
|---|---|
| `npm ci` | Abhängigkeiten (Versionen exakt gepinnt) |
| `npm run dev` | Dev-Server mit Entwürfen |
| `npm run build` | Produktion: nur `status: freigegeben` |
| `npm run build:vorschau` | Vorschau: auch Entwürfe, alles `noindex`, robots.txt sperrt |
| `npm run check` | Typen und Frontmatter-Schema |
| `npm run kit:sync` | Marken-Kit aus dem FSG-Drive übernehmen |

## Deploy (Cloudflare Workers Builds)
Der Worker `fsg-website` im Cloudflare-Konto fh@ baut direkt aus diesem Repo (GitHub-App „Cloudflare Workers and Pages“, nur dieses Repo).
- **Jeder Branch und jeder PR:** Build mit `npm run build`, dann `npx wrangler preview`; Vorschau unter `https://<branch>-fsg-website.fh-1e8.workers.dev/`, Build-Status als Check „Workers Builds: fsg-website“ am PR. Auf Branches außer `main` baut Astro im Vorschau-Modus (Entwürfe sichtbar, `noindex`, robots.txt sperrt).
- **`main`:** Build und `npx wrangler deploy`. Die Produktion hat bis T13 keine öffentliche URL (`workers_dev: false`, sonst wäre sie ohne `noindex` indexierbar); T13 setzt die Route auf `fullstackgrant.de` in `wrangler.jsonc`.
- Node-Version aus `.node-version`, Abhängigkeiten aus `package-lock.json`; `wrangler preview` braucht den Block `previews` in `wrangler.jsonc`.

## Aufbau
- `src/content/<sammlung>/*.md`: Inhalte mit Frontmatter; Schema in `src/content.config.ts` (Build bricht bei Verstößen ab). Pfad steht im Frontmatter (`url` bzw. `slug`).
- `src/pages/[...pfad].astro`: eine Route für alle Inhalte, Template nach Sammlung; `index.astro` (Start), Hubs unter `wissen/` und `foerderung/`.
- `src/layouts/`: `Basis` (Head, SEO, JSON-LD), `Inhalt` (Inhaltsseiten), `Hub` (Übersichten).
- `src/components/`: fester Komponentensatz, Liste in `src/components/Bausteine.md`.
- `src/data/firma.ts`: Firmendaten für Impressum, Fußzeile und JSON-LD.
- `public/_headers` (Sicherheitsheader, CSP), `public/_redirects` (alte `.html`-Pfade).

Regeln für Inhalte und Änderungen: Skill `website-authoring` in `.claude/skills/`.

## Marke
Kit-Dateien (`src/styles/kit/tokens.css`, `public/fonts/`, Logos, Icons) nie von Hand ändern. Neue Fassung erzeugt der Generator `50_Sales\51_Logo\scripts\build_all.py` im Repo `fsg-hq`; danach `npm run kit:sync`.
