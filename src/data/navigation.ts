// Haupt- und Fußnavigation. Nur Ziele, die existieren (Linkregel T6 Abschnitt 6).
export const hauptnavigation = [
  { titel: 'Leistungen', pfad: '/leistungen/' },
  { titel: 'Förderung', pfad: '/foerderung/' },
  { titel: 'Wissen', pfad: '/wissen/' },
  { titel: 'Über uns', pfad: '/ueber-uns/' },
];

export const rechtsnavigation = [
  { titel: 'Impressum', pfad: '/impressum/' },
  { titel: 'Datenschutz', pfad: '/datenschutz/' },
  // Direkt auf die feste Seite der geltenden Fassung, die Übersicht /agb/ bleibt Entwurf (Felix 27.11.2026).
  { titel: 'AGB', pfad: '/agb/1-1/' },
  { titel: 'Kontakt', pfad: '/kontakt/' },
];
