// Kopiert das Marken-Kit (Generator build_all.py im FSG-Drive) ins Repo. Kit-Dateien nie von Hand ändern.
// Aufruf: npm run kit:sync  (Pfad per FSG_KIT überschreibbar)
import { cpSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const kit = process.env.FSG_KIT ?? 'G:/Geteilte Ablagen/FullStack Grant/50_Sales/51_Logo/R1_Raute/04_Website';
cpSync(join(kit, 'public'), 'public', { recursive: true });
for (const f of readdirSync(join(kit, 'fonts'))) cpSync(join(kit, 'fonts', f), join('public/fonts', f));
cpSync(join(kit, 'tokens.css'), 'src/styles/kit/tokens.css');
console.log(`Kit übernommen aus ${kit}`);
