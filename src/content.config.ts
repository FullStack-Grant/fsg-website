// Inhaltsschemas (T4 Abschnitt 7, T6 Abschnitte 4.3, 5.1, 7.1, Frontmatter der Texte aus T7 und T8).
// Verstöße brechen den Build mit klarer Meldung ab.
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const pfad = z
  .string()
  .regex(/^\/([a-z0-9-]+\/)*$/, 'Pfad klein, ohne Umlaute, mit / am Anfang und Ende, z. B. /wissen/faq/');

const quelle = z.object({
  titel: z.string(),
  url: z.url(),
  abruf: z.coerce.date(),
});

// Gemeinsame Felder aller Seiten. `slug` (T8) und `url` (T7) sind gleichwertig.
const basis = z.object({
  title: z.string().max(60, 'title höchstens 60 Zeichen (T6 4.3)'),
  description: z
    .string()
    .min(110, 'description mindestens 110 Zeichen')
    .max(160, 'description höchstens 160 Zeichen (T4 Abschnitt 7)'),
  // H1 steht hier, nicht im Text (Build bricht bei `# …` im Markdown ab); fehlt sie, gilt der Title vor dem Doppelpunkt.
  h1: z.string().optional(),
  slug: pfad.optional(),
  url: pfad.optional(),
  datePublished: z.coerce.date(),
  dateModified: z.coerce.date(),
  // Nur bei echter Fremdprüfung setzen (T9-Regel G35); sonst steht der Autor in der Byline.
  reviewedBy: z.string().optional(),
  status: z.enum(['entwurf', 'freigegeben']),
  freigabe: z.string().optional(),
  hauptbegriff: z.string().optional(),
  nebenbegriffe: z.array(z.string()).default([]),
  fragen: z.array(z.string()).default([]),
  quellen: z.array(quelle).default([]),
  links_intern: z.array(z.string()).default([]),
  zuletztGeprueft: z.coerce.date().optional(),
  pruefintervall_tage: z.number().int().positive().optional(),
  // Antwortblock oben (T6 4.3 Nr. 1); fehlt er, beginnt die Seite mit dem Text.
  antwort: z.string().optional(),
  // Text enthält einen eigenen, von T9 geprüften Grenzen-Absatz („So arbeitet FullStack Grant“);
  // dann setzt das Layout den Kasten ComplianceHinweis nicht zusätzlich.
  grenzenImText: z.boolean().default(false),
});

const mitPfad = <T extends z.ZodType<{ slug?: string; url?: string; datePublished: Date; dateModified: Date }>>(schema: T) =>
  schema
    .refine((d) => d.slug || d.url, { message: 'slug oder url fehlt' })
    .refine((d) => d.dateModified >= d.datePublished, { message: 'dateModified liegt vor datePublished (T9-Regel G35)' });

// Kernseiten ohne eigenes Template (Vorgehen, Vergütung, Über uns, Kontakt).
const seiten = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/seiten' }),
  schema: mitPfad(
    basis.extend({
      seitentyp: z.enum(['seite', 'profil', 'kontakt']).default('seite'),
    }),
  ),
});

// Leistungen (Service); zum Go-live eine Seite /leistungen/ mit Ankern je Ebene (T6 5.1).
const leistungen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/leistungen' }),
  schema: mitPfad(
    basis.extend({
      registerModul: z.array(z.enum(['B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'A4'])).default([]),
      programme: z.array(z.string()).default([]),
      faq: z.array(z.object({ frage: z.string(), antwort: z.string() })).default([]),
    }),
  ),
});

const artikel = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/artikel' }),
  schema: mitPfad(
    basis.extend({
      typ: z.enum(['meinung', 'fachbeitrag']),
      author: z.string(),
    }),
  ),
});

// Programmseiten /foerderung/programme/<slug>/ (T4 3.4, 3.6; T8).
const programme = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/programme' }),
  schema: mitPfad(
    basis.extend({
      programmId: z.string().optional(),
      katalogId: z.string().optional(),
      foerderart: z.string(),
      ebene: z.string(),
      zuletztGeprueft: z.coerce.date(),
      pruefintervall_tage: z.number().int().positive().default(90),
      pruefTermin: z.coerce.date().optional(),
      steckbrief: z
        .array(z.object({ merkmal: z.string(), wert: z.string(), stand: z.string().optional() }))
        .default([]),
    }),
  ),
});

// Themen- und Regionsseiten /foerderung/<thema>/ (T6 7.1).
const themen = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/themen' }),
  schema: mitPfad(
    basis.extend({
      art: z.enum(['thema', 'region']),
      zuletztGeprueft: z.coerce.date(),
      pruefintervall_tage: z.number().int().positive().default(90),
      vergleich: z
        .array(
          z.object({
            programm: z.string(),
            art: z.string(),
            quote: z.string(),
            stand: z.string(),
            quelle: z.url(),
            link: pfad.optional(),
          }),
        )
        .default([]),
    }),
  ),
});

// FAQ und Glossar (Template Reference).
const referenz = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/referenz' }),
  schema: mitPfad(
    basis.extend({
      typ: z.enum(['faq', 'glossar']),
      begriffe: z
        .array(
          z.object({
            id: z.string().regex(/^[a-z0-9-]+$/),
            begriff: z.string(),
            definition: z.string(),
            link: z.string().optional(),
          }),
        )
        .default([]),
    }),
  ),
});

// Rechtliches (Impressum, Datenschutz, AGB mit fester Seite je Fassung).
const recht = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/recht' }),
  schema: mitPfad(
    basis.extend({
      typ: z.enum(['impressum', 'datenschutz', 'agb']),
      // Feste Seite einer eingefrorenen AGB-Fassung (Schlüssel in src/data/agb-fassungen.json).
      fassung: z.string().optional(),
      stand: z.coerce.date(),
    }),
  ),
});

export const collections = { seiten, leistungen, artikel, programme, themen, referenz, recht };
