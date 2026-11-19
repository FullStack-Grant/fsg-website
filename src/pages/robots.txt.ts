// robots.txt (T4 4.3): alles erlaubt, KI-Training ausdrücklich erlaubt (Felix 14.11.2026).
// Benannte Bot-Gruppen nur zum Sperren: ein Bot mit eigener Gruppe ignoriert die *-Gruppe (RFC 9309).
// In der Vorschau: alles gesperrt.
import type { APIRoute } from 'astro';
import { istVorschau } from '../lib/umgebung';

export const GET: APIRoute = ({ site }) => {
  const text = istVorschau
    ? 'User-agent: *\nDisallow: /\n'
    : [
        'User-agent: *',
        'Allow: /',
        '',
        '# Gemeinsames Signal zum KI-Training (IETF-Entwurf draft-kelley-aipref-training-preference-signal)',
        'User-agent: __usage_ai-training',
        'Allow: /',
        '',
        `Sitemap: ${new URL('sitemap-index.xml', site)}`,
        '',
      ].join('\n');
  return new Response(text, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
