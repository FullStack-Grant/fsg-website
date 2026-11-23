# Komponenten (fester Satz, T4 Abschnitt 7)

Neue Komponenten nur mit Felix' Designfreigabe (Design E2 „Kapitalsäule“).

| Komponente | Zweck | Pflicht auf |
|---|---|---|
| `Kopf`, `Fuss` | Kopfzeile mit Navigation und Termin-Button, Fußzeile mit Slogan und Rechtslinks | allen Seiten (über `Basis`) |
| `Zeile` | Abschnitt der Startseite: Label über dem Inhalt, volle Breite | Start |
| `Personenkarte` | Gründer mit Porträt und KI-Vermerk, nicht im Hero | Start (Über uns), Über uns |
| `Kapitalsaeule` | Finanzierungsmix nach Kapitalkosten mit Compliance-Rahmen | Start, Leistungen |
| `Zustaendigkeiten` | drei Spalten: FullStack Grant, dein Unternehmen, bewusst nicht bei uns | Start, Vorgehen |
| `Schritte` | nummerierter Ablauf | Start, Vorgehen |
| `Faq` | aufklappbare Fragen (Antwort steht im Server-HTML) | Start, Leistungen |
| `Antwortblock` | 2 bis 3 Sätze oben, Antwort auf die Hauptfrage (T6 4.3 Nr. 1) | Wissens-, Programm-, Leistungsseiten |
| `Byline` | Autor bzw. geprüft von, Datum, zuletzt geprüft, Meinungsbeitrag-Hinweis | Artikel, Programm, Thema |
| `Brotkrumen` | Pfadnavigation (JSON-LD erzeugt das Layout) | allen Unterseiten |
| `ProgrammSteckbrief` | Steckbrief-Box mit Stand und Primärquelle | Programmseiten |
| `Vergleichstabelle` | Programme mit Art, Quote, Stand, Quelle | Themen- und Regionsseiten |
| `Zitat` | Zitat von Felix als Perspektive | Wissensseiten (eins je Seite) |
| `ComplianceHinweis` | Leistungsgrenzen (FullStack Grant bereitet vor, du reichst ein; keine Rechts- oder Steuerberatung) | Leistungs-, Programm-, Themen-, Wissensseiten |
| `Quellen` | Quellenliste mit Abrufdatum | Programm-, Themen-, Wissensseiten |
| `CtaTermin` | genau ein Abschluss-CTA | jeder Inhaltsseite |
