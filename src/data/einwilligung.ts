// Einwilligungen (TDDDG § 25, Art. 6 Abs. 1 lit. a DSGVO). Einzige Quelle für Banner, Einstellungen und Prüfung.
// Neue Kategorie (z. B. Statistik): Eintrag ergänzen, VERSION erhöhen (fragt alle Besucher neu), Dienst in
// `10_Legal\datenschutz\diensteliste.md` (Repo fsg-hq) und Datenschutzerklärung nachziehen, CSP in `public/_headers`.
export const EINWILLIGUNG_COOKIE = 'fsg_einwilligung';
export const EINWILLIGUNG_VERSION = 1;
export const EINWILLIGUNG_TAGE = 365;

export interface Kategorie {
  id: string;
  titel: string;
  text: string;
}

export const kategorien: Kategorie[] = [
  {
    id: 'extern',
    titel: 'Externe Inhalte: Google Kalender',
    text: 'Lädt die Terminbuchung von Google (Google Cloud EMEA Limited, Irland) direkt in die Seite. Dabei überträgt dein Browser unter anderem deine IP-Adresse an Google.',
  },
];
