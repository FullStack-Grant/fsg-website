// Zugriff auf alle Inhalte mit Pfad und Freigabefilter.
// Produktion baut nur `status: freigegeben`, die Vorschau auch Entwürfe (T4 Abschnitt 7).
import { getCollection, type CollectionEntry } from 'astro:content';
import { istVorschau } from './umgebung';

export type Sammlung = 'seiten' | 'leistungen' | 'artikel' | 'programme' | 'themen' | 'referenz' | 'recht';
export type Eintrag = CollectionEntry<Sammlung>;

export const pfadVon = (e: Eintrag): string => (e.data.slug ?? e.data.url) as string;

export async function holen<S extends Sammlung>(s: S): Promise<CollectionEntry<S>[]> {
  const alle = await getCollection(s);
  return alle.filter((e) => istVorschau || e.data.status === 'freigegeben');
}

export async function alleEintraege(): Promise<Eintrag[]> {
  const namen: Sammlung[] = ['seiten', 'leistungen', 'artikel', 'programme', 'themen', 'referenz', 'recht'];
  const listen = await Promise.all(namen.map((n) => holen(n)));
  const alle = listen.flat() as Eintrag[];
  const doppelt = alle.map(pfadVon).filter((p, i, a) => a.indexOf(p) !== i);
  if (doppelt.length) throw new Error(`Pfad doppelt vergeben: ${doppelt.join(', ')}`);
  return alle;
}

export const datumDe = (d: Date): string =>
  d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Europe/Berlin' });

export const datumIso = (d: Date): string => d.toISOString().slice(0, 10);
