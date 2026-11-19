// Seitenliste für die Browser-Prüfungen: lokal aus dem Build-Ordner, gegen Produktion aus der Sitemap.
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const extern = process.env.QA_BASE_URL;
const dir = process.env.QA_DIR ?? 'dist-vorschau';

function ausOrdner(d: string): string[] {
  const out: string[] = [];
  const walk = (p: string) => {
    for (const e of readdirSync(p, { withFileTypes: true })) {
      const q = join(p, e.name);
      if (e.isDirectory()) walk(q);
      else if (e.name === 'index.html') {
        const rel = relative(d, p).split(sep).join('/');
        out.push(rel ? `/${rel}/` : '/');
      }
    }
  };
  walk(d);
  return out.sort();
}

async function ausSitemap(basis: string): Promise<string[]> {
  const xml = await (await fetch(new URL('/sitemap-0.xml', basis))).text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
}

export const seiten: string[] = extern ? await ausSitemap(extern) : existsSync(dir) ? ausOrdner(dir) : [];
export const istExtern = !!extern;
