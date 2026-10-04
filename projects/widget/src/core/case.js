import { ATTACK_TYPES, TAKEN_ACTIONS, ACTIONS_BY_ATTACK_TYPE, REPORT_SOURCES, LIMITS } from '../../../web-app/src/lib/contract/types.ts';

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

export function extractFirstLink(text) {
  const match = String(text ?? '').match(/(?:https?:\/\/|www\.)[^\s<>"'\u201e\u201d\u00ab\u00bb]+/i);
  return match ? normalizeLink(match[0].replace(/[.,;:!?\)\]\}'"\u201d\u00bb]+$/, '')) : '';
}

// Proposals are local suggestions, never evidence sent to the parent.
export function proposeAttackType(answers, result) {
  const has = (group, value) => Array.isArray(answers?.[group]) && answers[group].includes(value);
  const signal = value => Array.isArray(result?.signals) && result.signals.includes(value);
  if (has('request', 'password') || has('request', 'code') || signal('credential_password') || signal('credential_code')) return 'data_request';
  if (has('request', 'prize') || signal('prize') || signal('prize_link')) return 'fake_prize';
  if (has('request', 'payment') || signal('payment') || signal('payment_pressure')) return 'purchase_trap';
  if (has('sender', 'claims_organization')) return 'impersonation';
  if (has('verify', 'message_link')) return 'phishing';
  return 'other';
}

export function sourceFromCase(c) {
  if (c?.origin !== 'selection') return 'other';
  const host = String(c.source ?? '').toLowerCase().replace(/\.$/, '');
  const matches = domain => host === domain || host.endsWith('.' + domain);
  if (matches('discord.com')) return 'discord';
  if (matches('roblox.com')) return 'game';
  if (['mail.google.com', 'outlook.live.com', 'outlook.office.com', 'outlook.office365.com',
    'poczta.wp.pl', 'poczta.onet.pl', 'poczta.interia.pl', 'mail.yahoo.com'].some(matches)) return 'email';
  return 'other';
}

export function buildReportPayload(c, selection) {
  if (!isValidCase(c) || !ATTACK_TYPES.includes(selection?.attack_type) || !REPORT_SOURCES.includes(selection?.source)
    || !Array.isArray(selection?.taken_actions)
    || !selection.taken_actions.every(action => ACTIONS_BY_ATTACK_TYPE[selection.attack_type].includes(action))) throw new Error('report');
  const content = c.content + (c.link ? '\n\nLink: ' + c.link : '');
  // No second normalization: this exact string is both the review and the wire value.
  if (content !== content.trim() || Array.from(content).length > LIMITS.contentMaxChars || content.includes('\u0000')
    || /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(content)) throw new Error('content');
  const payload = Object.freeze({ attack_type: selection.attack_type,
    taken_actions: Object.freeze(TAKEN_ACTIONS.filter(action => selection.taken_actions.includes(action))), source: selection.source, content });
  if (new TextEncoder().encode(JSON.stringify(payload)).byteLength > LIMITS.maxBodyBytes) throw new Error('body');
  return payload;
}
