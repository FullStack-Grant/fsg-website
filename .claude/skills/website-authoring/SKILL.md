---
name: website-authoring
description: Use when creating or changing pages, texts, templates or components of fullstackgrant.de in this repo: Frontmatter, Markdown, Komponenten, Links, Freigabe per PR mit Vorschau. Trigger: neue Seite, Text einbauen, Programmseite, Artikel, FAQ, Glossar, Template, Impressum, Datenschutz.
---

# website-authoring

Regeln für Inhalte und Templates der Website fullstackgrant.de (Astro 7, Cloudflare Workers Static Assets). Aufbau des Repos: `README.md`. Rechtliche Prüfregeln: `rechtsregeln.md` neben dieser Datei.

## Ablauf einer Änderung
1. Branch `<thema>-<detail>` von `main`; nie direkt auf `main`.
2. Datei anlegen oder ändern (Sammlung und Frontmatter unten), Text nach „Schreiben“.
3. Prüfen nach Skill `website-testing` (Hooks laufen automatisch; Stufe 2 vor jedem Commit). Das Schema bricht den Build mit Meldung ab; Meldung lesen und an der Ursache beheben, nie das Schema lockern, um einen Text durchzubekommen.
4. Sichtprüfung der geänderten Seiten in hell, dunkel und mobil (375 px), dann PR mit Vorschau-Link an Felix.
5. Felix gibt den Text im Chat frei → `status: freigegeben` und `freigabe: "<Datum>, Felix"` setzen, committen; gemergt wird über die Freigabe im PR (`website-testing`, „Ablauf einer Änderung“).

**Merge = Veröffentlichung**: Cloudflare deployt `main` sofort. Jeder Merge braucht grüne Pflicht-Checks und Felix' Klick auf die Freigabe im PR (Ruleset, Environment `freigabe`), auch Routine. Rücknahme per Revert-PR, nie per Force-Push.

## Sammlungen und Pfade
| Sammlung (`src/content/…`) | Template | Pfad |
|---|---|---|
| `seiten` (`seitentyp`: seite, profil, kontakt) | Seite, Profil, Kontakt | `/vorgehen/`, `/ueber-uns/`, `/kontakt/` … |
| `leistungen` | Leistung (Service) | `/leistungen/` mit Ankern je Ebene |
| `artikel` (`typ`: meinung, fachbeitrag) | Artikel | `/wissen/artikel/<slug>/` |
| `programme` | Programmseite mit Steckbrief | `/foerderung/programme/<slug>/` |
| `themen` (`art`: thema, region) | Themen- bzw. Regionsseite mit Vergleichstabelle | `/foerderung/<thema>/` |
| `referenz` (`typ`: faq, glossar) | FAQ, Glossar | `/wissen/faq/`, `/wissen/glossar/` |
| `recht` (`typ`: impressum, datenschutz) | Rechtliches | `/impressum/`, `/datenschutz/` |

Start (`src/pages/index.astro`) und die Hubs (`/wissen/`, `/foerderung/`, `/foerderung/programme/`) sind Astro-Seiten; Hubs listen die Sammlungen automatisch. Pfade: Kleinschreibung, ohne Umlaute, mit `/` am Ende, höchstens drei Ebenen, eine URL je Suchintention.

## Frontmatter
Pflicht für alle: `title` (≤ 60 Zeichen, Muster „Thema: Nutzen bzw. Frage (Jahr)“), `description` (110 bis 160 Zeichen, Antwort plus Zielgruppe), `url` oder `slug`, `datePublished`, `dateModified`, `status` (`entwurf` · `freigegeben`). Üblich: `h1`, `antwort` (Antwortblock, 2 bis 3 Sätze), `hauptbegriff`, `nebenbegriffe`, `fragen`, `quellen` (`titel`, `url`, `abruf`), `zuletztGeprueft`, `freigabe`. `reviewedBy` nur bei echter Fremdprüfung; `dateModified` nie vor `datePublished` (Schema prüft).

Je Sammlung zusätzlich: Artikel `typ`, `author` · Programme `foerderart`, `ebene`, `zuletztGeprueft`, optional `programmId` (Join-Key `programme.jsonl`, nur nach Audit), `katalogId`, `steckbrief` (`merkmal`, `wert`, `stand`), `pruefTermin` · Themen `art`, `zuletztGeprueft`, `vergleich` (`programm`, `art`, `quote`, `stand`, `quelle`, `link`) · Leistungen `registerModul`, `faq` · Glossar `begriffe` (`id`, `begriff`, `definition`, `link`) · Recht `typ`, `stand`. Maßgeblich ist `src/content.config.ts`.

Produktion baut nur `freigegeben`; die Vorschau baut auch Entwürfe und setzt überall `noindex`.

## Markdown: Fallen
- **Keine H1 im Text.** Die H1 steht im Feld `h1` (sonst Title vor dem Doppelpunkt); `# …` im Markdown bricht den Build.
- **Anker** mit `## Frage {#anker}`; jeder Anker nur einmal je Seite (Gruppen-H2 und Frage-H3 kollidieren leicht, z. B. „Kosten“). Der Build bricht bei doppelten Ankern ab. Bestehende Anker nie umbenennen, auf sie zeigen Links von außen (z. B. `/datenschutz/#online-besprechungen` aus Google Meet).
- **Kein HTML im Markdown.** Braucht ein Block eigene Gestaltung, bekommt er eine Klasse per Attributzeile direkt darunter (`{.zeitleiste}` unter einer Liste); die Klasse steht in `src/styles/global.css`. Kommentare `<!-- -->` (etwa „ab Fassung 1.1“) entfernt der Build aus dem ausgelieferten HTML. Redaktionsmarker wie `[T9-1]`, `[prüfen]`, `[Platzhalter]` und Gedankenstriche bricht der Produktions-Build ab (`scripts/nachbearbeitung.mjs`), die Vorschau warnt nur.
- **Typografie bleibt wie geschrieben** (Smart Punctuation aus): deutsche Anführungszeichen „…“ selbst setzen.

## Schreiben
- Anrede **du** (klein), Firmen-„wir“ nur für den Prozess, Felix in Ich-Form nur in Zitaten, auf Über uns und in Artikeln mit Byline; keine Team-Behauptungen. Ton nach dem Positionierungspapier (Drive `50_Sales\52_Website`, Endfassung T5).
- Keine Gedanken- oder Spiegelstriche (U+2013, U+2014); Komma, Doppelpunkt, Punkt oder Klammer. Bis-Strich nur in Bereichen. Zahlen deutsch (1.250.000 €, 7 %).
- Je Seite oben der Antwortblock; H2 als echte Nutzerfrage, darunter zuerst ein Antwortsatz, dann Details. Vergleiche als Tabelle.
- Jede Zahl mit Quelle und „Stand: TT.MM.JJJJ“ direkt am Wert, Primärquelle verlinkt; Spannen statt „bis zu“ ohne Bezug.
- Hauptbegriff in Title, H1, Antwortblock, einer H2 und im Slug; keine Wiederholung um der Dichte willen.
- Firmenname „FullStack Grant“ bzw. „FullStack Grant UG (haftungsbeschränkt)“. Keine Kundennamen, keine Preise (nur Vergütungslogik).

## Links
- Jede Seite hat mindestens 3 eingehende interne Links; Programm- und Themenseiten verlinken die passende Leistungs-Ebene (`/leistungen/#steuerliche-foerderung`, `#zuschuesse`, `#foerderkredite`, `#beteiligungskapital`, `#nach-der-bewilligung`, `#foerdercheck`).
- Ankertext beschreibend mit Haupt- oder Nebenbegriff der Zielseite, nie „hier“ oder „mehr“.
- Keine Links auf Seiten, die es (in Produktion) noch nicht gibt; Entwürfe zählen nicht.
- Genau ein Abschluss-CTA je Inhaltsseite; das Layout setzt ihn (Komponente `CtaTermin`).

## Komponenten und Design
- Fester Satz in `src/components/` (Liste `Bausteine.md`); neue Komponenten nur mit Felix' Designfreigabe (Design K3b „Gold auf Ink“).
- Farben, Schrift, Abstände nur über die Kit-Tokens `--fsg-*`; Kit-Dateien nie von Hand ändern (`npm run kit:sync`).
- JSON-LD erzeugen nur die Layouts aus dem Frontmatter (`src/lib/jsonld.ts`); nie von Hand. Firmendaten nur in `src/data/firma.ts`.
- **CSP und Datenschutz:** kein Inline-Skript, kein `style="…"`, kein `localStorage`, keine Fremd-Requests (Schriften, Bilder, Skripte nur vom eigenen Host). Neue Dienste mit Datenfluss (Terminbuchung, Karten, Videos, Analytics) erst nach Eintrag in `10_Legal\datenschutz\diensteliste.md` (Repo `fsg-hq`), Fortschreibung der Datenschutzerklärung und Felix' OK.

## Bilder
Originale im Drive (`50_Sales\52_Website\Bilder\`), ins Repo nur optimierte Fassungen (AVIF/WebP, `width`/`height`, ≤ 500 KB) mit `alt`-Text (dekorativ leer). Personenfotos nur mit Einwilligung; keine Stockfotos mit Personen, die wie Kunden wirken.

## Recht, Sichtbarkeit und Freigabe
Leistungsgrenzen und Werbeaussagen nach `rechtsregeln.md`; Thesen als Meinungsbeitrag (`typ: meinung`) kennzeichnen oder belegen.

Jede neue oder inhaltlich geänderte Seite geht vor Felix' Freigabe an zwei Prüfer (nur lesen, Ausgabe Befundtabelle):
- `pruefer-recht` (Repo `fsg-hq`, `.claude/agents/`): Leistungsgrenzen, Werbeaussagen (Vergleich, Überlegenheit, Erfolgsquoten, Compliance-Versprechen), Befugnis.
- `pruefer-sichtbarkeit` (dieses Repo, `.claude/agents/`): SEO und GEO auf Textebene, also Keyword-Passung, Antwort zuerst, Fakten mit Quelle, Entitäten, Überschriften, interne Verlinkung, Title und Description.

Rote Befunde vor der Freigabe einarbeiten; Wording-Fragen gehen gesammelt an Felix. Reine Design-, CSS- oder Infrastruktur-Änderungen ohne Textänderung gehen an keinen der beiden Prüfer.
