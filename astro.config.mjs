// Astro-Konfiguration fullstackgrant.de (WEB T10, Architektur T4 Abschnitt 2 bis 4).
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { satteri } from '@astrojs/markdown-satteri';

export default defineConfig({
  site: 'https://fullstackgrant.de',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    // Alle Styles als Datei: Die Header-CSP erlaubt nur style-src 'self' (T4 2.3).
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Keine Skripte oder Assets als data:-URI inline (CSP).
      assetsInlineLimit: 0,
    },
  },
  markdown: {
    processor: satteri({
      features: {
        // Überschriften-IDs aus der Schreibweise `## Frage {#anker}` der Texte aus T7 und T8.
        attributes: true,
        // Aus: würde `--` zu Gedankenstrichen und gerade Anführungszeichen zu englischen machen (FSG-Stilregel).
        smartPunctuation: false,
        // Kein Roh-HTML im Markdown (CSP, einheitliches Markup); Kommentare entfernt T12 beim Einbau.
        rawHtml: false,
      },
    }),
  },
  i18n: {
    defaultLocale: 'de',
    locales: ['de'],
    // Englisch kommt später unter /en/ (Folgeprojekt); dann hier 'en' ergänzen.
  },
  integrations: [
    sitemap({
      filter: (url) => !url.endsWith('/404/'),
    }),
  ],
});
