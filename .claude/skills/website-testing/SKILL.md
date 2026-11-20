---
name: website-testing
description: Use when testing or releasing changes to fullstackgrant.de in this repo: Prüfstufen (qa:schnell, qa:voll, CI), roter Check, Sichtprüfung im Browser, Snapshots, Freigabe und Merge per PR, Produktion rot. Not for writing pages or texts, use website-authoring.
---

# website-testing

Jede Änderung an der Website läuft durch dieselben Prüfungen, erst lokal, dann in GitHub Actions; ohne Grün und ohne Felix' Freigabe wird nichts gemergt. **Merge auf `main` = Deploy**: Cloudflare Workers Builds baut und veröffentlicht `main` sofort, ohne auf GitHub zu warten. Deshalb sichert das Ruleset den Merge ab, nicht den Deploy.

## Stufen
| Stufe | Auslöser | Befehl | Budget | Inhalt |
|---|---|---|---|---|
| 1 schnell | Hook nach jedem Edit/Write | `npm run qa:schnell -- --datei <pfad>` | < 30 s | Textregeln der Quelldatei, `astro check` bei `.astro`/`.ts`, Vorschau-Build, HTML, SEO/Links/JSON-LD, Textregeln im Build |
| 2 voll | Hook vor `git commit` (blockiert) und Stop-Hook | `npm run qa:voll` | < 3 min | `astro check`, beide Builds, alle statischen Prüfungen für beide, Playwright Datenschutz und axe (4 Projekte) |
| 3 CI | PR und Push auf `main` | `.github/workflows/ci.yml` | < 10 min | Stufe 2 plus Nu Html Checker, visuelle Regression, Lighthouse, gitleaks, externe Links (Warnung), dann `freigabe` |
| Sichtprüfung | vor jedem PR mit sichtbarer Änderung | Browser, unten | 2 bis 5 min | Layout, Fokus, Menü, Terminlink in hell, dunkel, mobil |
| nach Deploy | Push auf `main` | `nach-deploy.yml` | < 20 min | wartet auf Workers Builds, Smoke-Test der Produktion |
| 4 wöchentlich | Montag 05:00 UTC, manuell | `woechentlich.yml` | < 30 min | Smoke, Datenschutz gegen Produktion, Inhaltsfrische, externe Links; Befunde als Issue |

`npm run qa:ci` stellt Stufe 3 lokal nach (Nu Html Checker nur mit Java, visuelle Regression nur unter Linux, Lighthouse startet Chrome selbst).

**Zwei Builds:** `dist` (Produktion, nur `status: freigegeben`, erzwungen mit `FSG_VORSCHAU=0`) und `dist-vorschau` (alle Templates, `noindex`). Browser, Lighthouse und Snapshots laufen auf der Vorschau, die Indexierungsregeln auf beiden. Links aus der Produktion auf Entwürfe warnen nur; sobald in `wrangler.jsonc` die Route auf `fullstackgrant.de` steht (T13), blockieren sie.

## Was blockiert
Blockierend ist nur, was deterministisch ist. Übersicht je Prüfung mit Werkzeug und Stufe: `befunde.md`.
- **Blockiert:** Typen und Frontmatter-Schema, HTML (html-validate, vnu), interne Links und Anker, Meta, Canonical, OG, `robots.txt`, Sitemap gegen XSD, JSON-LD, Pflichtlinks Impressum und Datenschutz, CSP-Tauglichkeit, keine Fremd-Ressourcen, keine Cookies oder Storage, keine CSP-Verletzung, axe WCAG 2.2 AA in hell, dunkel, desktop, mobil, visuelle Regression, Lighthouse a11y, Best Practices, SEO ≥ 0,95 sowie LCP und CLS, Secrets, Textregeln (T9-Sperrliste, Gedankenstriche, Marker, Platzhalter, Firmenname).
- **Warnt:** Title- und Description-Länge, `llms.txt`, Links auf Entwürfe vor Go-live, T9-Warnwörter, Performance-Score, Seitengewicht, externe Links, Inhaltsfrische.

## Ablauf einer Änderung
1. Branch von `main` (Name klein, nur `a-z0-9-`, er wird Teil der Vorschau-URL). Nie direkt auf `main`; das Ruleset weist Pushes ab.
2. Ändern; Stufe-1-Befunde sofort an der Ursache beheben.
3. Commit: der Hook führt Stufe 2 aus und blockiert bei Rot.
4. Sichtprüfung (unten) bei sichtbarer Änderung.
5. Push, PR öffnen, **Auto-Merge einschalten:** `gh pr merge <nr> --auto --squash`. Der Branch muss aktuell mit `main` sein (Ruleset); liegt er zurück, `gh pr update-branch <nr>` vor der Bitte um Freigabe.
6. Warten, bis alle Checks grün sind, bis auf `freigabe` (wartet auf Review). Bei Rot: Befund beheben, nie den Test aufweichen.
7. Felix um Freigabe bitten, in einer Nachricht: PR-Link, Vorschau `https://<branch>-fsg-website.fh-1e8.workers.dev/`, Screenshots, Prüfergebnis, was sich ändert. Felix klickt im PR bei „freigabe“ auf **Review deployments → Approve and deploy**; dann merged Auto-Merge, Cloudflare deployt.
8. Nach dem Merge den Lauf „Nach Deploy“ prüfen (`gh run list --workflow nach-deploy.yml -L 1`).

**Felix' Freigabe gibt nur Felix.** Claude genehmigt das Environment nie selbst, ändert Ruleset und Environment nicht und merged nie mit `--admin`; `.claude/settings.json` sperrt die zugehörigen `gh api`-Aufrufe. Fragen zur Freigabe-Mechanik gehen an Felix.

## Browser-Sichtprüfung
Vor jedem PR mit sichtbarer Änderung, gegen die Vorschau-URL des Branches (oder lokal `npm run qa:server -- --dir dist-vorschau --port 4400` nach `npm run build:vorschau -- --outDir dist-vorschau`):
1. Geänderte Seiten und die Startseite in **hell 1280 px**, **dunkel 1280 px**, **mobil 375 px** (hell und dunkel) öffnen.
2. Prüfen: Umbrüche und Überläufe, Kontrast im Dunkelmodus, Tastatur (Tab-Reihenfolge, sichtbarer Fokus), Menü auf mobil, Terminlink, Fußzeile mit Impressum und Datenschutz.
3. Screenshots in den PR (Kommentar oder Beschreibung), je Seite mindestens hell desktop und dunkel mobil.
Eingebauter Browser: `resize_window` (`colorScheme`, Breite); Headless Chrome rendert nicht schmaler als 500 px.

## Baselines der visuellen Regression
- Baselines liegen in `tests/__screenshots__/<projekt>/`, entstehen nur im Linux-Container der CI und werden lokal unter Windows nie erzeugt oder verglichen.
- Ändert eine gewollte Änderung das Aussehen: Label `snapshots-aktualisieren` an den PR (`gh pr edit <nr> --add-label snapshots-aktualisieren`), Lauf „Snapshots aktualisieren“ abwarten, Artefakt laden (`gh run download <run-id> -n snapshots -D tests/__screenshots__`), PNGs committen, Label entfernen. Felix sieht die Bilder im PR-Diff; seine Freigabe des PR gilt auch für die Baselines.
- Unerwarteter Diff = Befund, keine neue Baseline. Den Diff im Artefakt `playwright-bericht` ansehen.

## Tests ändern
Tests, Schwellen, Sperrlisten und Workflows werden nie geändert, um Rot grün zu machen, außer Felix stimmt ausdrücklich zu (Grund im PR). Neue Prüfung: zuerst in `scripts/qa/` bzw. `tests/`, in `qa.mjs` einhängen, in `ci.yml` aufrufen, als Pflicht-Check nur, wenn sie deterministisch ist; Tabelle in `befunde.md` ergänzen. Neue Pflicht-Checks im Ruleset trägt Felix ein (oder gibt Claude dafür ausdrücklich frei).

## Produktion rot
„Nach Deploy“ oder Stufe 4 rot: Ursache im Lauf lesen, dann **Revert-PR** (`git revert <sha>` auf neuem Branch, PR, Freigabe wie oben). Nie Force-Push, nie direkt auf `main`. Felix sofort mit Lauf-Link informieren.

## Monatliche manuelle Prüfung
axe findet nur einen Teil der Barrieren. Monatlich und je neuer Vorlage: Tastaturbedienung aller Seitentypen, Screenreader (NVDA) auf Start, Leistungen, einer Programmseite, Kontakt, Zoom 200 % ohne horizontales Scrollen, Rich Results Test je neuer JSON-LD-Vorlage. Offene Issues mit Label `qa-woechentlich` dabei abarbeiten und schließen. Ergebnis als Kommentar ins jüngste Wochen-Issue.

## Kundennamen
Die Sperrliste mit Kundennamen steht nie im Repo. CI liest sie aus dem Actions-Secret `FSG_SPERRLISTE` (ein Name je Zeile), lokal aus der Datei in der Umgebungsvariablen `FSG_SPERRLISTE`. Fehlt sie, warnt die Textprüfung „nicht geprüft“.
