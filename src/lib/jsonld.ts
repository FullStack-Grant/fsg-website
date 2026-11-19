// JSON-LD-Graph mit stabilen @id (T4 Abschnitt 4.2). Nur aus dem Frontmatter erzeugt, nie von Hand im Markdown.
// Kein ProfessionalService/LocalBusiness (abgekündigt bzw. an Ladenadresse gebunden).
import type {
  Organization, WebSite, Person, BreadcrumbList, WebPage, Service, BlogPosting,
  CollectionPage, ProfilePage, ContactPage, DefinedTermSet,
} from 'schema-dts';
import { firma, person } from '../data/firma';

const URL_BASIS = firma.url;
export const ids = {
  website: `${URL_BASIS}/#website`,
  organisation: `${URL_BASIS}/#organization`,
  person: person.id,
};

export function organisation(voll: boolean): Organization {
  if (!voll) return { '@type': 'Organization', '@id': ids.organisation };
  return {
    '@type': 'Organization',
    '@id': ids.organisation,
    name: firma.name,
    legalName: firma.rechtsname,
    url: `${URL_BASIS}/`,
    logo: `${URL_BASIS}/logo.svg`,
    email: firma.email,
    telephone: firma.telefon.anzeige,
    founder: { '@id': ids.person },
    address: {
      '@type': 'PostalAddress',
      streetAddress: firma.anschrift.strasse,
      postalCode: firma.anschrift.plz,
      addressLocality: firma.anschrift.ort,
      addressCountry: firma.anschrift.landCode,
    },
    areaServed: 'DE',
    knowsAbout: ['Forschungszulage', 'Fördermittel', 'Zuschüsse', 'EU-Förderung', 'Förderkredite', 'Verwendungsnachweis'],
    ...(firma.sameAs.length ? { sameAs: [...firma.sameAs] } : {}),
  };
}

export function website(): WebSite {
  return {
    '@type': 'WebSite',
    '@id': ids.website,
    url: `${URL_BASIS}/`,
    name: firma.name,
    inLanguage: 'de-DE',
    publisher: { '@id': ids.organisation },
  };
}

export function personKnoten(): Person {
  return {
    '@type': 'Person',
    '@id': ids.person,
    name: person.name,
    url: person.url,
    jobTitle: person.rolle,
    worksFor: { '@id': ids.organisation },
    ...(person.sameAs.length ? { sameAs: [...person.sameAs] } : {}),
  };
}

export function brotkrumen(teile: { name: string; pfad: string }[]): BreadcrumbList {
  return {
    '@type': 'BreadcrumbList',
    '@id': `${URL_BASIS}${teile.at(-1)?.pfad ?? '/'}#breadcrumbs`,
    itemListElement: teile.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.name,
      item: `${URL_BASIS}${t.pfad}`,
    })),
  };
}

interface SeitenInfo {
  pfad: string;
  titel: string;
  beschreibung: string;
  veroeffentlicht?: Date;
  geaendert?: Date;
}

const seitenBasis = (s: SeitenInfo) => ({
  '@id': `${URL_BASIS}${s.pfad}#webpage`,
  url: `${URL_BASIS}${s.pfad}`,
  name: s.titel,
  description: s.beschreibung,
  inLanguage: 'de-DE',
  isPartOf: { '@id': ids.website },
  ...(s.veroeffentlicht ? { datePublished: s.veroeffentlicht.toISOString().slice(0, 10) } : {}),
  ...(s.geaendert ? { dateModified: s.geaendert.toISOString().slice(0, 10) } : {}),
});

export const webseite = (s: SeitenInfo, about?: string): WebPage => ({
  '@type': 'WebPage',
  ...seitenBasis(s),
  ...(about ? { about: { '@type': 'Thing', name: about } } : {}),
});

export const sammlungsseite = (s: SeitenInfo): CollectionPage => ({ '@type': 'CollectionPage', ...seitenBasis(s) });
export const kontaktseite = (s: SeitenInfo): ContactPage => ({ '@type': 'ContactPage', ...seitenBasis(s) });
export const profilseite = (s: SeitenInfo): ProfilePage => ({
  '@type': 'ProfilePage',
  ...seitenBasis(s),
  mainEntity: { '@id': ids.person },
});

export const leistung = (s: SeitenInfo, name: string): Service => ({
  '@type': 'Service',
  '@id': `${URL_BASIS}${s.pfad}#service`,
  name,
  description: s.beschreibung,
  url: `${URL_BASIS}${s.pfad}`,
  provider: { '@id': ids.organisation },
  areaServed: 'DE',
});

export const beitrag = (s: SeitenInfo, quellen: string[]): BlogPosting => ({
  '@type': 'BlogPosting',
  '@id': `${URL_BASIS}${s.pfad}#article`,
  headline: s.titel,
  description: s.beschreibung,
  url: `${URL_BASIS}${s.pfad}`,
  inLanguage: 'de-DE',
  author: { '@type': 'Person', '@id': ids.person, name: person.name, url: person.url },
  publisher: { '@id': ids.organisation },
  mainEntityOfPage: { '@id': `${URL_BASIS}${s.pfad}#webpage` },
  ...(s.veroeffentlicht ? { datePublished: s.veroeffentlicht.toISOString().slice(0, 10) } : {}),
  ...(s.geaendert ? { dateModified: s.geaendert.toISOString().slice(0, 10) } : {}),
  ...(quellen.length ? { citation: quellen } : {}),
});

export const begriffsliste = (s: SeitenInfo, begriffe: { id: string; begriff: string; definition: string }[]): DefinedTermSet => ({
  '@type': 'DefinedTermSet',
  '@id': `${URL_BASIS}${s.pfad}#glossar`,
  name: s.titel,
  hasDefinedTerm: begriffe.map((b) => ({
    '@type': 'DefinedTerm',
    '@id': `${URL_BASIS}${s.pfad}#${b.id}`,
    name: b.begriff,
    description: b.definition,
    inDefinedTermSet: { '@id': `${URL_BASIS}${s.pfad}#glossar` },
  })),
});

export function graph(knoten: unknown[]): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': knoten }).replace(/</g, '\\u003c');
}
