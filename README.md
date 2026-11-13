# fullstackgrant.de

Statische Website der FullStack Grant UG (haftungsbeschränkt), Stand „im Aufbau“.
Drei Seiten, kein Build-Schritt, kein Tracking, keine Cookies, keine externen Ressourcen.

| Datei | Inhalt |
|---|---|
| `index.html` | Startseite mit Slogan, Hinweis „im Aufbau“ und E-Mail-Kontakt |
| `impressum.html` | Pflichtangaben nach § 5 DDG |
| `datenschutz.html` | Datenschutzhinweise für die Website (Hosting, Server-Protokolle) |
| `styles.css` | Gestaltung |
| `tokens.css`, `fonts/`, `logo*.svg`, `favicon*`, `icon-*`, `og-image.png`, `site.webmanifest` | unverändert aus dem Brand-Kit `50_Sales\51_Logo\R1_Raute\04_Website` im FSG-Drive |

## Pflege
- Marke: Kit-Dateien nie von Hand ändern. Neue Fassung erzeugt der Generator
  `50_Sales\51_Logo\scripts\build_all.py` im Repo `fsg-hq`; danach die Dateien hier neu kopieren.
- Pflichtangaben (Firma, Anschrift, Vertretung, Registergericht, HRB, E-Mail) stammen aus
  `10_Legal\00_Stammdaten-und-IDs.md` im FSG-Drive. Ändert sich dort etwas, hier nachziehen.
- Telefonnummer und USt-IdNr. stehen noch nicht im Impressum, weil sie in den Stammdaten leer sind.

## Hosting
GitHub Pages aus `main`, Ordner `/` (root). `CNAME` setzt die eigene Domain, `.nojekyll` schaltet
die Jekyll-Verarbeitung ab. HTTPS über „Enforce HTTPS“ in den Repo-Einstellungen.
