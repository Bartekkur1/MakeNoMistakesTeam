import { MSG_CASE_APPROVED, MSG_GUARDIAN_REQUEST, MSG_SHOW } from '../core/messages.js';
import { isValidCase } from '../core/case.js';
import { RESULT_KEYS } from '../core/check.js';
import { ACCOUNT_FIELDS, ACTIONS_BY_ATTACK_TYPE, API_ERROR_CODES, ATTACK_TYPES, CHILD_FIELDS,
  LIMITS, REPORT_FIELDS, REPORT_SOURCES, REPORT_STATES, TAKEN_ACTIONS } from '../../../web-app/src/lib/contract/types.ts';

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

// Renew only on an explicit authenticated operation, sharing work for the current account
// revision. Neither local status nor opening options enters this path.
let refreshFlight = null;
async function refreshSession(session, revision) {
  if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
  if (refreshFlight?.revision === revision) return refreshFlight.promise;
  const flight = { revision, promise: null };
  flight.promise = (async () => {
    try {
      const current = await serializeSession(readStoredSession);
      if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
      if (!current) return { ok: false, kind: 'no-account' };
      if (current.account.id !== session.account.id) return { ok: false, kind: 'account-changed' };
      // Another operation may already have renewed the token that received this late 401.
      if (current.token !== session.token && Date.parse(current.expires_at) > Date.now()) return { ok: true, session: current };
      const response = await apiRequest('/api/auth/login', {
        body: { email: current.email, code: current.code, scope: 'extension' },
      });
      if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
      if (!response.ok) {
        if (response.code === 'invalid_credentials') {
          const cleared = await clearSession(++sessionRevision);
          return cleared.ok ? { ok: false, kind: 'no-account' } : cleared;
        }
        // Report POST has not begun: a failed renewal is reliably a no-send outcome.
        return ['offline', 'unknown'].includes(response.kind) ? { ok: false, kind: 'offline' } : response;
      }
      if (!isValidLoginResponse(response.value) || Date.parse(response.value.expires_at) <= Date.now()) {
        return { ok: false, kind: 'http', status: 502, code: 'internal_error' };
      }
      if (response.value.account.id !== current.account.id
        || response.value.account.email.toLowerCase() !== current.email.toLowerCase()) return { ok: false, kind: 'account-changed' };
      const renewed = { token: response.value.token, expires_at: response.value.expires_at,
        account: response.value.account, email: current.email, code: current.code };
      const saved = await saveSession(renewed, revision);
      if (!saved.ok) return saved;
      if (revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
      return { ok: true, session: renewed };
    } catch {
      return { ok: false, kind: 'storage' };
    }
  })().finally(() => { if (refreshFlight === flight) refreshFlight = null; });
  refreshFlight = flight;
  return flight.promise;
}

const REPORT_REQUEST_FIELDS = ['attack_type', 'taken_actions', 'source', 'content'];
// Same unstorable Unicode rule as read-only web-app src/lib/server/validate.ts.
const loneSurrogate = /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;
const validReportContent = content => typeof content === 'string' && content.length > 0 && content === content.trim()
  && Array.from(content).length <= LIMITS.contentMaxChars && !content.includes('\u0000') && !loneSurrogate.test(content);
function reportFieldsValid(value) {
  return ATTACK_TYPES.includes(value.attack_type) && REPORT_SOURCES.includes(value.source)
    && keyedList(value.taken_actions, ACTIONS_BY_ATTACK_TYPE[value.attack_type]) && validReportContent(value.content);
}
export function isValidReportRequest(payload) {
  return exactKeys(payload, REPORT_REQUEST_FIELDS) && reportFieldsValid(payload)
    && new TextEncoder().encode(JSON.stringify(payload)).byteLength <= 32768;
}
export function isValidSavedReport(report, expectedAccountId, payload = null) {
  if (!exactKeys(report, REPORT_FIELDS) || !uuid(report.id) || !uuid(report.child_id) || !uuid(report.parent_id)
    || report.parent_id !== expectedAccountId || !reportFieldsValid(report) || !REPORT_STATES.includes(report.state)
    || !isoDate(report.created_at) || !isoDate(report.updated_at) || Date.parse(report.updated_at) < Date.parse(report.created_at)) return false;
  const ordered = TAKEN_ACTIONS.filter(action => report.taken_actions.includes(action));
  if (!report.taken_actions.every((action, index) => action === ordered[index])) return false;
  return payload === null || (report.state === 'pending_parent' && report.attack_type === payload.attack_type
    && report.source === payload.source && report.content === payload.content
    && report.taken_actions.length === payload.taken_actions.length
    && report.taken_actions.every((action, index) => action === payload.taken_actions[index]));
}

const reportOutcomes = new Map();
const reportDocuments = new Map();
const OUTCOME_TTL_MS = 5 * 60 * 1000;
function clearTabOutcomes(tabId) {
  for (const [key, entry] of reportOutcomes) if (entry.tabId === tabId) reportOutcomes.delete(key);
  reportDocuments.delete(tabId);
}
function observeDocument(sender) {
  const previous = reportDocuments.get(sender.tab.id);
  if (previous && previous !== sender.documentId) clearTabOutcomes(sender.tab.id);
  reportDocuments.set(sender.tab.id, sender.documentId);
}
function pruneCompletedOutcomes() {
  const now = Date.now();
  for (const [key, entry] of reportOutcomes) {
    if (entry.outcome && now - entry.completedAt >= OUTCOME_TTL_MS) reportOutcomes.delete(key);
  }
}
const outcomeKey = (sender, caseId) => JSON.stringify([sender.tab.id, sender.documentId, caseId]);
const localId = value => typeof value === 'string' && value.length > 0 && value.length <= 128;
const scopeAlive = entry => reportOutcomes.get(entry.key) === entry && reportDocuments.get(entry.tabId) === entry.documentId;

async function reportSession(operation, entry) {
  let session;
  try { session = await serializeSession(readStoredSession); }
  catch { return { ok: false, kind: 'storage' }; }
  if (!scopeAlive(entry)) return { ok: false, kind: 'context' };
  if (operation.session_revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
  if (!session) return { ok: false, kind: 'no-account' };
  if (session.account.id !== operation.expected_account_id) return { ok: false, kind: 'account-changed' };
  return { ok: true, session };
}
async function dispatchReport(operation, payload, entry) {
  let ready = await reportSession(operation, entry);
  if (!ready.ok) return ready;
  if (Date.parse(ready.session.expires_at) <= Date.now()) {
    ready = await refreshSession(ready.session, operation.session_revision);
    if (!ready.ok) return ready;
  }
  // Reading through the mutation queue ensures completed renewal writes are visible, and
  // the checks below happen immediately before fetch (no awaiting between gate and POST).
  let dispatchedSession;
  const post = async () => {
    const checked = await reportSession(operation, entry);
    if (!checked.ok) return checked;
    if (!scopeAlive(entry)) return { ok: false, kind: 'context' };
    if (operation.session_revision !== sessionRevision || checked.session.account.id !== operation.expected_account_id) {
      return { ok: false, kind: 'account-changed' };
    }
    dispatchedSession = checked.session;
    entry.recipient = publicAccount(checked.session.account);
    return apiRequest('/api/reports', { body: payload, token: checked.session.token });
  };
  let response = await post();
  if (!response.ok && response.kind === 'http' && response.status === 401) {
    const refreshed = await refreshSession(dispatchedSession, operation.session_revision);
    if (!refreshed.ok) return refreshed;
    response = await post(); // One replay after a confirmed rejection; never retry a failed fetch.
  }
  if (!response.ok) {
    return response.status === 503 && response.code === 'storage_unavailable'
      ? { ok: false, kind: 'offline', status: 503, code: 'storage_unavailable' } : response;
  }
  if (!isValidSavedReport(response.value, operation.expected_account_id, payload)) return { ok: false, kind: 'unknown' };
  return { ok: true, report: response.value, recipient: entry.recipient };
}
function handleReportSend(operation, sender) {
  pruneCompletedOutcomes();
  if (operation.session_revision !== sessionRevision) return Promise.resolve({ ok: false, kind: 'account-changed' });
  const key = outcomeKey(sender, operation.case_id);
  const existing = reportOutcomes.get(key);
  if (existing && (!existing.outcome || existing.outcome.ok)) {
    if (existing.revision !== operation.session_revision || existing.accountId !== operation.expected_account_id) {
      return Promise.resolve({ ok: false, kind: 'account-changed' });
    }
    return existing.promise;
  }
  if (!existing && reportOutcomes.size >= 100) {
    const completed = [...reportOutcomes].find(([, entry]) => entry.outcome);
    if (!completed) return Promise.resolve({ ok: false, kind: 'http', status: 429, code: 'internal_error' });
    reportOutcomes.delete(completed[0]);
  }
  const payload = Object.freeze({ attack_type: operation.payload.attack_type,
    taken_actions: Object.freeze(TAKEN_ACTIONS.filter(action => operation.payload.taken_actions.includes(action))),
    source: operation.payload.source, content: operation.payload.content });
  const entry = { key, tabId: sender.tab.id, documentId: sender.documentId,
    revision: operation.session_revision, accountId: operation.expected_account_id,
    outcome: null, completedAt: null, recipient: null, promise: null };
  reportOutcomes.set(key, entry);
  entry.promise = Promise.resolve().then(() => dispatchReport(operation, payload, entry))
    .catch(() => ({ ok: false, kind: 'unknown' }))
    .then(outcome => {
      // A transport outcome is recorded before any RPC resolves. Removed namespaces are
      // never restored by a late response from a discarded document or closed tab.
      entry.outcome = outcome;
      entry.completedAt = Date.now();
      return outcome;
    });
  return entry.promise;
}
function handleReportMessage(message, sender) {
  observeDocument(sender);
  pruneCompletedOutcomes();
  const key = outcomeKey(sender, message.case_id);
  if (message.type === 'aura/report-send') return handleReportSend(message, sender);
  const entry = reportOutcomes.get(key);
  if (message.type === 'aura/report-clear') {
    // Keep active/confirmed records as duplicate-send guards. Unsuccessful outcomes can be
    // cleared locally; new case IDs and document lifecycle clear the other namespaces.
    if (entry?.outcome && !entry.outcome.ok) reportOutcomes.delete(key);
    return { ok: true };
  }
  if (!entry) return { ok: true, report: null };
  if (entry.revision !== sessionRevision) return { ok: false, kind: 'account-changed' };
  return entry.promise;
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
  if (['aura/report-send', 'aura/report-outcome', 'aura/report-clear'].includes(msg?.type)) {
    const keys = msg.type === 'aura/report-send'
      ? ['type', 'case_id', 'request_id', 'expected_account_id', 'session_revision', 'payload'] : ['type', 'case_id'];
    if (!childSender(sender) || !exactKeys(msg, keys) || !localId(msg.case_id)) {
      sendResponse({ ok: false, kind: 'context' }); return;
    }
    if (msg.type === 'aura/report-send') {
      if (!localId(msg.request_id) || !uuid(msg.expected_account_id) || !Number.isSafeInteger(msg.session_revision)
        || msg.session_revision < 0 || !isValidReportRequest(msg.payload)) {
        sendResponse({ ok: false, kind: 'http', status: 400, code: 'validation_error' }); return;
      }
      messages.push({ type: msg.type, at: Date.now() });
      if (messages.length > 100) messages.shift();
    }
    return asyncResponse(() => handleReportMessage(msg, sender), sendResponse);
  }
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
    if (childSender(sender)) observeDocument(sender);
    if (msg.type === 'aura/session-status') return asyncResponse(sessionStatus, sendResponse);
    return asyncResponse(async () => {
      try { await chrome.tabs.create({ url: chrome.runtime.getURL('login.html') }); return { ok: true }; }
      catch { return { ok: false, kind: 'context' }; }
    }, sendResponse);
  }
  if (![MSG_CASE_APPROVED, MSG_GUARDIAN_REQUEST].includes(msg?.type)) return;
  messages.push({ type: msg.type, at: Date.now() });
  if (sender.id !== chrome.runtime.id || !sender.tab) return;
  if (childSender(sender)) observeDocument(sender);
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
chrome.tabs?.onRemoved?.addListener(clearTabOutcomes);
chrome.tabs?.onUpdated?.addListener((tabId, change) => {
  if (change.status === 'loading') clearTabOutcomes(tabId);
});
chrome.runtime.onInstalled?.addListener(details => {
  if (details.reason !== 'install') return;
  Promise.resolve().then(() => chrome.tabs.create({ url: chrome.runtime.getURL('login.html') })).catch(() => {});
});
self.__aura = { cases, guardianRequests, messages, onActionClicked };
