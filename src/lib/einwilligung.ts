// Einwilligung im Browser: lesen, speichern, widerrufen. Gespeichert wird nur die Wahl selbst in einem
// eigenen Cookie (kein localStorage, keine Fremd-Requests); ohne Wahl lädt nichts, was eine Einwilligung braucht.
import { EINWILLIGUNG_COOKIE, EINWILLIGUNG_TAGE, EINWILLIGUNG_VERSION, kategorien } from '../data/einwilligung';

export interface Wahl {
  v: number;
  datum: string;
  erlaubt: Record<string, boolean>;
}

export const EREIGNIS = 'fsg:einwilligung';

export function lesen(): Wahl | null {
  const m = document.cookie.match(new RegExp(`(?:^|; )${EINWILLIGUNG_COOKIE}=([^;]*)`));
  if (!m) return null;
  try {
    const w = JSON.parse(decodeURIComponent(m[1])) as Wahl;
    return w && w.v === EINWILLIGUNG_VERSION && typeof w.erlaubt === 'object' ? w : null;
  } catch {
    return null;
  }
}

export const erlaubt = (id: string): boolean => lesen()?.erlaubt[id] === true;

export function speichern(erlaubtNeu: Record<string, boolean>): Wahl {
  const w: Wahl = {
    v: EINWILLIGUNG_VERSION,
    datum: new Date().toISOString().slice(0, 10),
    erlaubt: Object.fromEntries(kategorien.map((k) => [k.id, erlaubtNeu[k.id] === true])),
  };
  const sicher = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${EINWILLIGUNG_COOKIE}=${encodeURIComponent(JSON.stringify(w))}; Max-Age=${EINWILLIGUNG_TAGE * 86400}; Path=/; SameSite=Lax${sicher}`;
  document.dispatchEvent(new CustomEvent<Wahl>(EREIGNIS, { detail: w }));
  return w;
}

export const alleErlauben = () => speichern(Object.fromEntries(kategorien.map((k) => [k.id, true])));
export const nurNotwendige = () => speichern({});

// Öffnet die Einstellungen (Banner) erneut, z. B. aus der Fußzeile oder dem Kontakt-Platzhalter.
export const EINSTELLUNGEN_OEFFNEN = 'fsg:einwilligung-oeffnen';
export const einstellungenOeffnen = () => document.dispatchEvent(new CustomEvent(EINSTELLUNGEN_OEFFNEN));
