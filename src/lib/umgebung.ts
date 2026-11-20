// Vorschau oder Produktion?
// Vorschau: lokaler Dev-Server, FSG_VORSCHAU=1, oder ein Build auf einem anderen Branch als main
// (Cloudflare Workers Builds setzt WORKERS_CI_BRANCH, GitHub Actions GITHUB_HEAD_REF).
// In der Vorschau werden Entwürfe gebaut und alle Seiten bekommen noindex (T4 Abschnitt 7).
// FSG_VORSCHAU=0 erzwingt Produktion auch auf einem Branch (Prüfung des Produktions-Builds im PR, WEB T11).
const branch = process.env.WORKERS_CI_BRANCH || process.env.GITHUB_HEAD_REF || '';

export const istVorschau: boolean =
  process.env.FSG_VORSCHAU === '0'
    ? false
    : import.meta.env.DEV || process.env.FSG_VORSCHAU === '1' || (branch !== '' && branch !== 'main');
