# Komponenten (fester Satz, T4 Abschnitt 7)

Neue Komponenten nur mit Felix' Designfreigabe. Aktuelles Design: K3b „Gold auf Ink“ (WEB T12, 24.11.2026; vorher E2 „Kapitalsäule“). Farben, Flächen, Radien und Buttons über die semantischen Tokens `--ui-*` in `src/styles/global.css` (auf den Kit-Skalen `--fsg-*`); Ink-Flächen mit der Klasse `.auf-ink` (Text immer hell).

| Komponente | Zweck | Pflicht auf |
|---|---|---|
| `Kopf`, `Fuss` | Kopf: Ink-Leiste, sticky (Höhe `--kopf-hoehe`, Sprunganker über `scroll-padding-top`), Logo dunkel, Navigation, Goldbutton „Erstgespräch buchen“ (mobil kompakt). Fuß: Goldlinie, Marke, Slogan, Seiten- und Rechtsnavigation | allen Seiten (über `Basis`) |
| `Personenkarte` | Gründer mit Porträt und KI-Vermerk, nicht im Hero; `gross` = Porträt in Spaltenbreite (Start) | Start (Über uns), Über uns |
| `Ablauf` | Finanzierungsmix als Ablauf in Stationen in der Reihenfolge der Prüfung (ersetzt `Kapitalsaeule`): Achse, Schiene mit Knoten, Station 1 „Zuerst prüfen“, „Nicht bei uns“ hinter gestrichelter Trennlinie; Daten `Ebene[]` und `Ausgeschlossen` | Start |
| `Zustaendigkeiten` | drei Karten: FullStack Grant (Gold, Goldoberkante), dein Unternehmen, bewusst nicht bei uns (neutral, Kreuze) | Start, Vorgehen |
| `Schritte` | geordneter Ablauf als Karten mit Icon, ohne Ziffern, für Ink-Flächen | Start, Vorgehen |
| `Faq` | aufklappbare Fragen (Antwort steht im Server-HTML) | Start, Leistungen |
| `Antwortblock` | 2 bis 3 Sätze oben, Antwort auf die Hauptfrage (T6 4.3 Nr. 1) | Wissens-, Programm-, Leistungsseiten |
| `Byline` | Autor bzw. geprüft von, Datum, zuletzt geprüft, Meinungsbeitrag-Hinweis | Artikel, Programm, Thema |
| `Brotkrumen` | Pfadnavigation (JSON-LD erzeugt das Layout) | allen Unterseiten |
| `ProgrammSteckbrief` | Steckbrief-Box mit Stand und Primärquelle | Programmseiten |
| `Vergleichstabelle` | Programme mit Art, Quote, Stand, Quelle | Themen- und Regionsseiten |
| `Zitat` | Zitat von Felix als Perspektive, Goldkarte | Start, Wissensseiten (eins je Seite) |
| `ComplianceHinweis` | Leistungsgrenzen (FullStack Grant bereitet vor, du reichst ein; keine Rechts- oder Steuerberatung) | Leistungs-, Programm-, Themen-, Wissensseiten |
| `Quellen` | Quellenliste mit Abrufdatum | Programm-, Themen-, Wissensseiten |
| `CtaTermin` | genau ein Abschluss-CTA, Ink-Fläche mit Goldbutton | jeder Inhaltsseite |
| `Icon` | Linien-Icons (24er Raster, dekorativ, `aria-hidden`) für Karten, Buttons und Listen | wo Bausteine Icons zeigen |
