import { MSG_CASE_APPROVED, MSG_GUARDIAN_REQUEST } from './messages.js';
import { API_ERROR_CODES, REPORT_FIELDS } from '../../../web-app/src/lib/contract/types.ts';

export async function submitCase(c) {
  const response = await chrome.runtime.sendMessage({ type: MSG_CASE_APPROVED, case: c });
  if (response?.ok !== true) throw new Error('not-accepted');
  return response;
}

export async function requestGuardianVerification(c, result) {
  const snapshot = { summaryKey: result.summaryKey, signals: [...result.signals], unknowns: [...result.unknowns],
    step: { ...result.step }, mismatches: result.mismatches.map(mismatch => ({ ...mismatch })) };
  const response = await chrome.runtime.sendMessage({ type: MSG_GUARDIAN_REQUEST, case: c, result: snapshot });
  if (response?.ok !== true) throw new Error('not-accepted');
  return response;
}

// All new RPCs fail closed and project only public metadata. The worker owns credentials,
// transport validation and delivery confirmation; the adapter cannot invent an acknowledgement.
async function rpc(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch {
    return { ok: false, kind: 'context' };
  }
}

function publicAccount(account) {
  return account && typeof account.id === 'string' && typeof account.display_name === 'string'
    ? { id: account.id, display_name: account.display_name } : null;
}

function failure(response) {
  const kinds = ['offline', 'http', 'unknown', 'no-account', 'account-changed', 'context', 'storage'];
  const result = { ok: false, kind: kinds.includes(response?.kind) ? response.kind : 'context' };
  if (Number.isInteger(response?.status) && response.status >= 100 && response.status <= 599) result.status = response.status;
  if (API_ERROR_CODES.includes(response?.code)) result.code = response.code;
  return result;
}

export async function loginParent(email, code) {
  const response = await rpc({ type: 'aura/auth-login', email, code });
  const account = publicAccount(response?.account);
  return response?.ok === true && account && Number.isInteger(response.revision)
    ? { ok: true, account, revision: response.revision } : failure(response);
}

export async function logoutParent() {
  const response = await rpc({ type: 'aura/auth-logout' });
  return response?.ok === true ? { ok: true } : failure(response);
}

export async function readSessionStatus() {
  const response = await rpc({ type: 'aura/session-status' });
  const account = publicAccount(response?.account);
  if (!Number.isInteger(response?.revision) || !['connected', 'none'].includes(response?.status)
    || (response.status === 'connected' && !account)) return failure(response);
  return { status: response.status, account: response.status === 'connected' ? account : null, revision: response.revision };
}

export async function openLogin() {
  const response = await rpc({ type: 'aura/open-login' });
  return response?.ok === true ? { ok: true } : failure(response);
}

function reportOutcome(response) {
  const recipient = publicAccount(response?.recipient);
  if (response?.ok !== true || !recipient || !response.report
    || !REPORT_FIELDS.every(key => Object.hasOwn(response.report, key))) return failure(response);
  return { ok: true, report: Object.fromEntries(REPORT_FIELDS.map(key => [key, response.report[key]])), recipient };
}

export async function submitReport(operation) {
  return reportOutcome(await rpc({ type: 'aura/report-send', case_id: operation.case_id,
    request_id: operation.request_id, expected_account_id: operation.expected_account_id,
    session_revision: operation.session_revision, payload: operation.payload }));
}

export async function readReportOutcome(case_id) {
  const response = await rpc({ type: 'aura/report-outcome', case_id });
  return response?.ok === true && response.report === null ? { ok: true, report: null } : reportOutcome(response);
}

export async function clearReportOutcome(case_id) {
  const response = await rpc({ type: 'aura/report-clear', case_id });
  return response?.ok === true ? { ok: true } : failure(response);
}
