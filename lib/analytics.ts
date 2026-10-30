import 'server-only';
import { exec, q } from './db';

// Privacy-friendly website statistics. No cookies and no IP addresses are stored:
// each browser gets a random ID in its own storage, and the country comes from the
// hosting network (when it provides one) or the visitor's time zone.

const BOTS = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|preview|headless|lighthouse|pingdom|monitor|curl|wget|python|axios|node-fetch/i;
export const isBot = (ua: string) => !ua || BOTS.test(ua);

export function deviceOf(ua: string) {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return 'Tablet';
  if (/mobi|iphone|android/i.test(ua)) return 'Phone';
  return 'Desktop';
}
export function browserOf(ua: string) {
  if (/edg\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/samsungbrowser/i.test(ua)) return 'Samsung';
  if (/instagram/i.test(ua)) return 'Instagram app';
  if (/fban|fbav/i.test(ua)) return 'Facebook app';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

const SOURCES: [RegExp, string][] = [
  [/google\./, 'Google'], [/bing\./, 'Bing'], [/yahoo\./, 'Yahoo'], [/duckduckgo/, 'DuckDuckGo'],
  [/instagram/, 'Instagram'], [/facebook|fb\.com|fb\.me/, 'Facebook'], [/whatsapp|wa\.me/, 'WhatsApp'],
  [/t\.co$|twitter|x\.com/, 'X (Twitter)'], [/linkedin|lnkd/, 'LinkedIn'], [/tiktok/, 'TikTok'], [/pinterest/, 'Pinterest'],
  [/chatgpt|openai|claude\.ai|perplexity|gemini/, 'AI assistants'],
];
export function sourceOf(referrer: string, utm: string, ownHost: string) {
  if (utm) return utm.slice(0, 40);
  if (!referrer) return 'Direct';
  let host = '';
  try { host = new URL(referrer).hostname.replace(/^www\./, '').toLowerCase(); } catch { return 'Direct'; }
  if (!host || host === ownHost.replace(/^www\./, '')) return 'Direct';
  for (const [re, name] of SOURCES) if (re.test(host)) return name;
  return host.slice(0, 40);
}

// Time zone → country, for when the host doesn't tell us the country.
const TZ: Record<string, string> = {
  'Africa/Lagos': 'Nigeria', 'Africa/Accra': 'Ghana', 'Africa/Abidjan': "Côte d'Ivoire", 'Africa/Porto-Novo': 'Benin', 'Africa/Lome': 'Togo',
  'Africa/Douala': 'Cameroon', 'Africa/Niamey': 'Niger', 'Africa/Dakar': 'Senegal', 'Africa/Freetown': 'Sierra Leone', 'Africa/Monrovia': 'Liberia',
  'Africa/Banjul': 'Gambia', 'Africa/Bamako': 'Mali', 'Africa/Ouagadougou': 'Burkina Faso', 'Africa/Conakry': 'Guinea', 'Africa/Nairobi': 'Kenya',
  'Africa/Kampala': 'Uganda', 'Africa/Dar_es_Salaam': 'Tanzania', 'Africa/Kigali': 'Rwanda', 'Africa/Addis_Ababa': 'Ethiopia', 'Africa/Cairo': 'Egypt',
  'Africa/Johannesburg': 'South Africa', 'Africa/Casablanca': 'Morocco', 'Africa/Algiers': 'Algeria', 'Africa/Tunis': 'Tunisia', 'Africa/Luanda': 'Angola',
  'Africa/Kinshasa': 'DR Congo', 'Africa/Harare': 'Zimbabwe', 'Africa/Lusaka': 'Zambia', 'Africa/Maputo': 'Mozambique', 'Africa/Windhoek': 'Namibia',
  'Africa/Gaborone': 'Botswana', 'Africa/Libreville': 'Gabon', 'Africa/Khartoum': 'Sudan',
  'Europe/London': 'United Kingdom', 'Europe/Dublin': 'Ireland', 'Europe/Paris': 'France', 'Europe/Berlin': 'Germany', 'Europe/Madrid': 'Spain',
  'Europe/Rome': 'Italy', 'Europe/Amsterdam': 'Netherlands', 'Europe/Brussels': 'Belgium', 'Europe/Zurich': 'Switzerland', 'Europe/Vienna': 'Austria',
  'Europe/Stockholm': 'Sweden', 'Europe/Oslo': 'Norway', 'Europe/Copenhagen': 'Denmark', 'Europe/Helsinki': 'Finland', 'Europe/Warsaw': 'Poland',
  'Europe/Lisbon': 'Portugal', 'Europe/Athens': 'Greece', 'Europe/Istanbul': 'Turkey', 'Europe/Moscow': 'Russia', 'Europe/Kiev': 'Ukraine', 'Europe/Kyiv': 'Ukraine',
  'America/New_York': 'United States', 'America/Chicago': 'United States', 'America/Denver': 'United States', 'America/Los_Angeles': 'United States',
  'America/Phoenix': 'United States', 'America/Detroit': 'United States', 'America/Anchorage': 'United States', 'Pacific/Honolulu': 'United States',
  'America/Indiana/Indianapolis': 'United States', 'America/Kentucky/Louisville': 'United States', 'America/Boise': 'United States',
  'America/Toronto': 'Canada', 'America/Vancouver': 'Canada', 'America/Edmonton': 'Canada', 'America/Winnipeg': 'Canada', 'America/Halifax': 'Canada',
  'America/Mexico_City': 'Mexico', 'America/Sao_Paulo': 'Brazil', 'America/Argentina/Buenos_Aires': 'Argentina', 'America/Bogota': 'Colombia',
  'America/Jamaica': 'Jamaica', 'America/Port_of_Spain': 'Trinidad and Tobago',
  'Asia/Dubai': 'United Arab Emirates', 'Asia/Riyadh': 'Saudi Arabia', 'Asia/Qatar': 'Qatar', 'Asia/Kuwait': 'Kuwait', 'Asia/Bahrain': 'Bahrain',
  'Asia/Kolkata': 'India', 'Asia/Calcutta': 'India', 'Asia/Karachi': 'Pakistan', 'Asia/Shanghai': 'China', 'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Singapore': 'Singapore', 'Asia/Tokyo': 'Japan', 'Asia/Seoul': 'South Korea', 'Asia/Manila': 'Philippines', 'Asia/Jakarta': 'Indonesia',
  'Asia/Kuala_Lumpur': 'Malaysia', 'Asia/Bangkok': 'Thailand', 'Asia/Jerusalem': 'Israel',
  'Australia/Sydney': 'Australia', 'Australia/Melbourne': 'Australia', 'Australia/Brisbane': 'Australia', 'Australia/Perth': 'Australia', 'Pacific/Auckland': 'New Zealand',
};
const CODES: Record<string, string> = { NG: 'Nigeria', GH: 'Ghana', GB: 'United Kingdom', US: 'United States', CA: 'Canada', ZA: 'South Africa', KE: 'Kenya', IE: 'Ireland', DE: 'Germany', FR: 'France', AE: 'United Arab Emirates', NL: 'Netherlands', IT: 'Italy', ES: 'Spain', AU: 'Australia', IN: 'India', BJ: 'Benin', TG: 'Togo', CM: 'Cameroon' };

export function countryOf(headerCode: string | null, tz: string) {
  const code = (headerCode || '').toUpperCase();
  if (/^[A-Z]{2}$/.test(code) && code !== 'XX' && code !== 'T1') {
    try { return CODES[code] || new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code; } catch { return CODES[code] || code; }
  }
  if (TZ[tz]) return TZ[tz];
  const region = tz.split('/')[0];
  return ['Africa', 'Europe', 'America', 'Asia', 'Australia', 'Pacific'].includes(region) ? `${region === 'America' ? 'Americas' : region} (other)` : 'Unknown';
}

export async function recordView(v: { path: string; visitor: string; isNew: boolean; country: string; city: string | null; device: string; browser: string; source: string }) {
  // Lagos date, so "today" matches the studio's day.
  const day = new Date(Date.now() + 3600000).toISOString().slice(0, 10);
  await exec('INSERT INTO page_views (day, path, visitor, new_visitor, country, city, device, browser, source) VALUES (?,?,?,?,?,?,?,?,?)',
    [day, v.path, v.visitor, v.isNew ? 1 : 0, v.country, v.city, v.device, v.browser, v.source]);
}

export const pruneViews = () => exec('DELETE FROM page_views WHERE day < DATE_SUB(CURDATE(), INTERVAL 400 DAY)');

// ---------------- reports ----------------

type Count = { name: string; views: number; visitors: number };
const range = (days: number, offset = 0) => [
  new Date(Date.now() + 3600000 - (days + offset - 1) * 86400000).toISOString().slice(0, 10),
  new Date(Date.now() + 3600000 - offset * 86400000).toISOString().slice(0, 10),
];

async function totals(from: string, to: string) {
  const r = (await q<{ views: number; visitors: number; newv: number }>(
    'SELECT COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors, COUNT(DISTINCT CASE WHEN new_visitor = 1 THEN visitor END) AS newv FROM page_views WHERE day BETWEEN ? AND ?', [from, to]))[0];
  return { views: Number(r?.views || 0), visitors: Number(r?.visitors || 0), newVisitors: Number(r?.newv || 0) };
}

async function groupBy(col: string, from: string, to: string, limit = 10, where = '') {
  const rows = await q<Count>(
    `SELECT ${col} AS name, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM page_views WHERE day BETWEEN ? AND ? ${where} GROUP BY ${col} ORDER BY views DESC LIMIT ${limit}`, [from, to]);
  return rows.map((r) => ({ name: String(r.name), views: Number(r.views), visitors: Number(r.visitors) }));
}

export async function report(days: number) {
  const [from, to] = range(days);
  const [pFrom, pTo] = range(days, days);
  const [now, before, daily, pages, articles, countries, cities, devices, browsers, sources, live] = await Promise.all([
    totals(from, to), totals(pFrom, pTo),
    q<{ day: string; views: number; visitors: number }>(
      "SELECT DATE_FORMAT(day, '%Y-%m-%d') AS day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM page_views WHERE day BETWEEN ? AND ? GROUP BY day ORDER BY day", [from, to]),
    groupBy('path', from, to, 15),
    groupBy('path', from, to, 100, "AND path LIKE '/journal/%'"),
    groupBy('country', from, to, 12), groupBy('city', from, to, 10, 'AND city IS NOT NULL'),
    groupBy('device', from, to, 5), groupBy('browser', from, to, 8), groupBy('source', from, to, 10),
    q<{ n: number }>('SELECT COUNT(DISTINCT visitor) AS n FROM page_views WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)'),
  ]);
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const series = Array.from({ length: days }, (_, i) => {
    const day = new Date(Date.parse(from) + i * 86400000).toISOString().slice(0, 10);
    const d = byDay.get(day);
    return { day, views: Number(d?.views || 0), visitors: Number(d?.visitors || 0) };
  });
  return { from, to, now, before, series, pages, articles, countries, cities, devices, browsers, sources, live: Number(live[0]?.n || 0) };
}
