import { MSG_CASE_APPROVED, MSG_GUARDIAN_REQUEST, MSG_SHOW } from '../core/messages.js';
import { isValidCase } from '../core/case.js';
import { RESULT_KEYS } from '../core/check.js';
import { ACCOUNT_FIELDS, API_ERROR_CODES, CHILD_FIELDS, LIMITS } from '../../../web-app/src/lib/contract/types.ts';

const exactKeys = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const keyedList = (value, keys) => Array.isArray(value) && value.length <= keys.length
  && new Set(value).size === value.length && Array.from(value).every(key => typeof key === 'string' && keys.includes(key));

const API_ORIGIN = typeof __AURA_API__ === 'undefined' ? 'https://bezpieczna-aura.pl' : __AURA_API__;
const SESSION_KEY = 'auraSession';
const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
const isoDate = value => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)
    || !Number.isFinite(Date.parse(value))) return false;
  const normalized = value.replace(/(?:\.(\d{1,3}))?Z$/, (_, fraction = '') => '.' + fraction.padEnd(3, '0') + 'Z');
  return new Date(value).toISOString() === normalized;
};
const emailValid = value => typeof value === 'string' && value.length <= LIMITS.emailMaxChars
  && value === value.trim() && /^[^\s@]+@[^\s@]+$/.test(value);
const tokenValid = value => typeof value === 'string' && value.length <= 8192
  && /^[A-Za-z0-9._-]+$/.test(value);
function parentAccountValid(account) {
  return exactKeys(account, ACCOUNT_FIELDS) && uuid(account.id) && emailValid(account.email)
    && account.role === 'parent' && typeof account.display_name === 'string'
    && account.display_name.trim().length > 0 && account.display_name.length <= 254;
}
export function isValidLoginResponse(value) {
  return exactKeys(value, ['token', 'expires_at', 'scope', 'account', 'children'])
    && value.scope === 'extension' && tokenValid(value.token) && isoDate(value.expires_at)
    && parentAccountValid(value.account) && Array.isArray(value.children)
    && value.children.length <= 100 && Array.from(value.children).every(child => exactKeys(child, CHILD_FIELDS)
      && uuid(child.id) && child.parent_id === value.account.id && typeof child.display_name === 'string'
      && child.display_name.trim().length > 0 && typeof child.class_id === 'string');
}
function storedSessionValid(value) {
  return exactKeys(value, ['token', 'expires_at', 'account', 'email', 'code'])
    && tokenValid(value.token) && isoDate(value.expires_at) && parentAccountValid(value.account)
    && emailValid(value.email) && value.email.toLowerCase() === value.account.email.toLowerCase()
    && typeof value.code === 'string' && /^\d{4}$/.test(value.code);
}

let sessionRevision = 0;
let sessionUnusable = false;
let sessionQueue = Promise.resolve();
function serializeSession(operation) {
  const next = sessionQueue.then(operation);
  sessionQueue = next.catch(() => {});
  return next;
}
// Minimal toolbar mocks lack storage. Credential operations still fail closed; startup
// catches both synchronous and asynchronous access-level failures without leaking errors.
const trustedStorage = Promise.resolve().then(async () => {
  if (!chrome.storage?.local?.setAccessLevel) return false;
  await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  return true;
}).catch(() => false);
async function requireStorage() {
  if (!await trustedStorage) throw new Error('storage-unavailable');
}
async function readStoredSession() {
  await requireStorage();
  if (sessionUnusable) return null;
  const value = (await chrome.storage.local.get(SESSION_KEY))[SESSION_KEY];
  return storedSessionValid(value) ? value : null;
}
async function saveSession(session, revision) {
  return serializeSession(async () => {
    await requireStorage();
    if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
    try {
      await chrome.storage.local.set({ [SESSION_KEY]: session });
      const saved = (await chrome.storage.local.get(SESSION_KEY))[SESSION_KEY];
      if (revision !== sessionRevision || !storedSessionValid(saved) || JSON.stringify(saved) !== JSON.stringify(session)) {
        throw new Error('session-not-saved');
      }
      sessionUnusable = false;
      return { ok: true };
    } catch {
      sessionUnusable = true;
      try { await chrome.storage.local.remove(SESSION_KEY); } catch {}
      return { ok: false, kind: revision === sessionRevision ? 'storage' : 'account-changed' };
    }
  });
}
async function clearSession(revision) {
  return serializeSession(async () => {
    await requireStorage();
    if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
    sessionUnusable = true;
    await chrome.storage.local.remove(SESSION_KEY);
    if (Object.hasOwn(await chrome.storage.local.get(SESSION_KEY), SESSION_KEY)) throw new Error('session-not-cleared');
    if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
    sessionUnusable = false;
    return { ok: true };
  });
}
const publicAccount = account => ({ id: account.id, display_name: account.display_name });
async function sessionStatus() {
  return serializeSession(async () => {
    const revision = sessionRevision;
    const session = await readStoredSession();
    if (revision !== sessionRevision) return { status: 'none', account: null, revision: sessionRevision };
    return { status: session ? 'connected' : 'none', account: session ? publicAccount(session.account) : null, revision: sessionRevision };
  });
}
async function apiRequest(path, { body, token, method = 'POST' }) {
  if (globalThis.navigator?.onLine === false) return { ok: false, kind: 'offline' };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const headers = { Accept: 'application/json', 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(API_ORIGIN + path, { method, headers,
      body: body === undefined ? undefined : JSON.stringify(body), credentials: 'omit', redirect: 'error',
      cache: 'no-store', signal: controller.signal });
    let value = null;
    try { value = await response.json(); } catch {}
    if (response.ok) return { ok: true, value, status: response.status };
    const fallback = { 401: 'unauthorized', 403: 'forbidden', 413: 'payload_too_large', 503: 'storage_unavailable' };
    const code = API_ERROR_CODES.includes(value?.error?.code) ? value.error.code : fallback[response.status] ?? 'internal_error';
    return { ok: false, kind: 'http', status: response.status, code };
  } catch {
    return { ok: false, kind: 'unknown' };
  } finally {
    clearTimeout(timeout);
  }
}
async function handleLogin(email, code) {
  const revision = ++sessionRevision;
  const cleared = await clearSession(revision);
  if (!cleared.ok) return cleared;
  if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
  const result = await apiRequest('/api/auth/login', { body: { email, code, scope: 'extension' } });
  if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
  if (!result.ok) return result;
  if (!isValidLoginResponse(result.value) || result.value.account.email.toLowerCase() !== email.toLowerCase()
    || Date.parse(result.value.expires_at) <= Date.now()) return { ok: false, kind: 'unknown' };
  const session = { token: result.value.token, expires_at: result.value.expires_at, account: result.value.account, email, code };
  const saved = await saveSession(session, revision);
  if (!saved.ok) return saved;
  // Recheck after awaiting the serialized write: a newer auth operation owns the session now.
  if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
  return { ok: true, account: publicAccount(session.account), revision };
}
function optionsSender(sender) {
  return sender.id === chrome.runtime.id && typeof chrome.runtime.getURL === 'function'
    && sender.url === chrome.runtime.getURL('login.html');
}
function childSender(sender) {
  return sender.id === chrome.runtime.id && Number.isInteger(sender.tab?.id) && sender.frameId === 0
    && typeof sender.documentId === 'string' && sender.documentId.length > 0
    && typeof sender.url === 'string' && /^https?:\/\//.test(sender.url);
}
function asyncResponse(operation, sendResponse) {
  Promise.resolve().then(operation).then(sendResponse, () => sendResponse({ ok: false, kind: 'storage' })).catch(() => {});
  return true;
}
function isValidResult(result) {
  if (!exactKeys(result, ['summaryKey', 'signals', 'unknowns', 'step', 'mismatches'])) return false;
  if (!RESULT_KEYS.summaries.includes(result.summaryKey)) return false;
  if (!keyedList(result.signals, RESULT_KEYS.signals) || !keyedList(result.unknowns, RESULT_KEYS.unknowns)) return false;
  const step = result.step;
  if (!exactKeys(step, ['id', 'explanationKey']) || typeof step.id !== 'string'
      || !RESULT_KEYS.steps.includes(step.id) || step.explanationKey !== step.id + '_how') return false;
  if (!(Array.isArray(result.mismatches) && result.mismatches.length <= RESULT_KEYS.mismatches.length
    && Array.from(result.mismatches).every(m => exactKeys(m, ['questionId', 'answerId', 'messageKey'])
      && m.questionId === 'request' && ['password', 'code'].includes(m.answerId)
      && m.messageKey === 'credential_' + m.answerId && RESULT_KEYS.mismatches.includes(m.messageKey)
      && result.signals.includes(m.messageKey)))) return false;
  if (new Set(result.mismatches.map(m => m.messageKey)).size !== result.mismatches.length
      || Boolean(result.mismatches.length) !== result.unknowns.includes('conflict')) return false;
  const summaryKey = result.mismatches.length ? 'conflicting_answers' : result.signals.length ? 'caution'
    : result.unknowns.length ? 'insufficient_information' : 'no_signals';
  return result.summaryKey === summaryKey;
}

const cases = [];
const guardianRequests = [];
const messages = [];
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (['aura/auth-login', 'aura/auth-logout', 'aura/session-status', 'aura/open-login'].includes(msg?.type)) {
    const privileged = msg.type === 'aura/auth-login' || msg.type === 'aura/auth-logout';
    const keys = msg.type === 'aura/auth-login' ? ['type', 'email', 'code'] : ['type'];
    if (!exactKeys(msg, keys) || !(privileged ? optionsSender(sender) : optionsSender(sender) || childSender(sender))) {
      sendResponse({ ok: false, kind: 'context' }); return;
    }
    if (msg.type === 'aura/auth-login') {
      if (!emailValid(msg.email) || typeof msg.code !== 'string' || !/^\d{4}$/.test(msg.code)) {
        sendResponse({ ok: false, kind: 'http', status: 400, code: 'validation_error' }); return;
      }
      // Start synchronously so the revision invalidates older work before this listener returns.
      const operation = handleLogin(msg.email, msg.code);
      return asyncResponse(() => operation, sendResponse);
    }
    if (msg.type === 'aura/auth-logout') {
      const revision = ++sessionRevision;
      return asyncResponse(() => clearSession(revision), sendResponse);
    }
    if (msg.type === 'aura/session-status') return asyncResponse(sessionStatus, sendResponse);
    return asyncResponse(async () => {
      try { await chrome.tabs.create({ url: chrome.runtime.getURL('login.html') }); return { ok: true }; }
      catch { return { ok: false, kind: 'context' }; }
    }, sendResponse);
  }
  // Report handlers arrive in Task 3. Unknown report RPCs cannot acknowledge delivery.
  if (![MSG_CASE_APPROVED, MSG_GUARDIAN_REQUEST].includes(msg?.type)) return;
  messages.push({ type: msg.type, at: Date.now() });
  if (sender.id !== chrome.runtime.id || !sender.tab) return;
  if (msg?.type === MSG_GUARDIAN_REQUEST) {
    if (!isValidCase(msg.case) || !isValidResult(msg.result)) { sendResponse({ ok: false }); return; }
    guardianRequests.push({ case: msg.case, result: msg.result });
    if (guardianRequests.length > 100) guardianRequests.shift();
    sendResponse({ ok: true });
    return;
  }
  if (msg?.type !== MSG_CASE_APPROVED) return;
  if (!isValidCase(msg.case)) { sendResponse({ ok: false }); return; }
  cases.push(msg.case);
  if (cases.length > 100) cases.shift();
  sendResponse({ ok: true });
});
export async function onActionClicked(tab) {
  if (!Number.isInteger(tab?.id)) return { ok: false, via: 'none' };
  try { if ((await chrome.tabs.sendMessage(tab.id, { type: MSG_SHOW }))?.ok === true) return { ok: true, via: 'message' }; } catch {}
  try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); }
  catch { return { ok: false, via: 'inject-failed' }; }
  try { if ((await chrome.tabs.sendMessage(tab.id, { type: MSG_SHOW }))?.ok === true) return { ok: true, via: 'inject' }; } catch {}
  return { ok: false, via: 'no-ack' };
}
chrome.action.onClicked.addListener(onActionClicked);
chrome.runtime.onInstalled?.addListener(details => {
  if (details.reason !== 'install') return;
  Promise.resolve().then(() => chrome.tabs.create({ url: chrome.runtime.getURL('login.html') })).catch(() => {});
});
self.__aura = { cases, guardianRequests, messages, onActionClicked };
