// Schlanke llms.txt aus dem Build (T4 4.3): H1, ein Satz Positionierung, Links auf die Kernseiten.
import type { APIRoute } from 'astro';
import { holen, pfadVon } from '../lib/inhalte';

export const GET: APIRoute = async ({ site }) => {
  const abs = (p: string) => new URL(p, site).href;
  // Nur Seiten, die im Build existieren (keine Links auf Entwürfe).
  const kern = [...(await holen('leistungen')), ...(await holen('seiten'))].map((e) => [e.data.h1 ?? e.data.title, pfadVon(e)]);
  const programme = await holen('programme');
  const artikel = await holen('artikel');
  const referenz = await holen('referenz');
  const zeilen = [
    '# FullStack Grant',
    '',
    '> Boutique für Förderberatung aus Hamburg, für Tech-Startups: Forschungszulage, Zuschüsse, EU-Grants und Förderkredite, geführt von einem ehemaligen Finance Lead.',
    '',
    '## Kernseiten',
    ...kern.map(([t, p]) => `- [${t}](${abs(p)})`),
    '',
    '## Förderprogramme',
    ...programme.map((e) => `- [${e.data.title}](${abs(pfadVon(e))}): ${e.data.description}`),
    '',
    '## Wissen',
    ...[...artikel, ...referenz].map((e) => `- [${e.data.title}](${abs(pfadVon(e))}): ${e.data.description}`),
    '',
  ];
  return new Response(zeilen.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
