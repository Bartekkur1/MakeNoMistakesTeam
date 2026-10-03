export const MAX_CONTENT = 2000;
export const MAX_LINK = 2048;
export const ORIGINS = ['selection', 'paste'];

export function normalizeText(raw) {
  return String(raw ?? '').replace(/\u00a0/g, ' ').trim();
}
export function capCodePoints(text, max = MAX_CONTENT) {
  const points = Array.from(text);
  return { text: points.slice(0, max).join(''), truncated: points.length > max };
}
export function normalizeLink(raw) {
  return capCodePoints(String(raw ?? '').trim(), MAX_LINK).text;
}
export function buildCase({ text, link, origin, truncated }, now = new Date(), loc = globalThis.location) {
  const normalized = normalizeText(text);
  if (!normalized) throw new Error('empty');
  if (!ORIGINS.includes(origin)) throw new Error('origin');
  const capped = capCodePoints(normalized);
  return Object.freeze({ content: capped.text, link: normalizeLink(link), origin,
    source: String(loc?.hostname ?? ''), created_at: now.toISOString(),
    truncated: Boolean(truncated || capped.truncated) });
}
export function isValidCase(c) {
  const keys = ['content', 'link', 'origin', 'source', 'created_at', 'truncated'];
  return c !== null && typeof c === 'object' && !Array.isArray(c)
    && Reflect.ownKeys(c).length === keys.length && keys.every((key) => Object.hasOwn(c, key))
    && typeof c.content === 'string' && normalizeText(c.content).length > 0 && Array.from(c.content).length <= MAX_CONTENT
    && typeof c.link === 'string' && Array.from(c.link).length <= MAX_LINK
    && ORIGINS.includes(c.origin) && typeof c.source === 'string' && c.source.length <= 253
    && typeof c.created_at === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(c.created_at) && Number.isFinite(Date.parse(c.created_at))
    && typeof c.truncated === 'boolean';
}
