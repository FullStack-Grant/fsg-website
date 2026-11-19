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
  // Nur Profile, die live sind (T14 `sameAs`-Liste); T12 trägt sie ein.
  sameAs: [] as string[],
  // Buchungsseite Google Kalender; Einbettung mit Einwilligung baut T12 (DECISIONS 18.11.).
  terminUrl: '/kontakt/',
} as const;

export const person = {
  name: 'Felix Hinkelmann',
  rolle: 'Gründer und Geschäftsführer',
  id: `${firma.url}/ueber-uns/#felix-hinkelmann`,
  url: `${firma.url}/ueber-uns/`,
  sameAs: [] as string[],
} as const;
