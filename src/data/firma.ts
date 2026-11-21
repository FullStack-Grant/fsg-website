// Firmendaten: einzige Quelle für Impressum, Fußzeile und JSON-LD (T4 Abschnitt 7).
// Abgleich mit `00_Stammdaten-und-IDs.md` im FSG-Drive; Impressumsangaben sind Pflichtveröffentlichung (§ 5 DDG).
export const firma = {
  name: 'FullStack Grant',
  rechtsname: 'FullStack Grant UG (haftungsbeschränkt)',
  url: 'https://fullstackgrant.de',
  slogan: ['Fördergeld für Innovation.', 'Vom Startup bis zum Hidden Champion.'],
  anschrift: {
    strasse: 'Schwenckestraße 81',
    plz: '20255',
    ort: 'Hamburg',
    land: 'Deutschland',
    landCode: 'DE',
  },
  geschaeftsfuehrer: 'Felix Hinkelmann',
  email: 'info@fullstackgrant.de',
  telefon: { anzeige: '+49 40 89741524', link: '+494089741524' },
  register: { gericht: 'Amtsgericht Hamburg', nummer: 'HRB 202375' },
  // Nur Profile, die live sind (T14 `sameAs`-Liste, Drive `02_Arbeitsstand\T14_Off-site\…_sameAs-Liste_v1.md`).
  // LinkedIn-Firmenseite, Google-Profil und Startup City erst eintragen, wenn sie öffentlich sind (T13 zieht nach).
  sameAs: [] as string[],
  // Alle Termin-Buttons führen auf /kontakt/; dort lädt die Buchung mit Einwilligung (DECISIONS T7 Nr. 4).
  terminUrl: '/kontakt/',
  // Google-Kalender-Buchungsseite „Erstgespräch“ (20 Minuten, Konto fh@), Link ohne Einwilligung, iframe mit.
  buchungUrl: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ1qfRN5CQbqSmYLQ-feZpuRhqkGC9L17EAjMjVjkvdXjQQtmsvcxAT_CCcdRegBTREmHQm7v06P',
} as const;

export const person = {
  name: 'Felix Hinkelmann',
  rolle: 'Gründer und Geschäftsführer',
  id: `${firma.url}/ueber-uns/#felix-hinkelmann`,
  url: `${firma.url}/ueber-uns/`,
  // LinkedIn-Profil live und am 17.11.2026 angeglichen (T14 sameAs-Liste).
  sameAs: ['https://www.linkedin.com/in/felix-hinkelmann'] as string[],
} as const;
