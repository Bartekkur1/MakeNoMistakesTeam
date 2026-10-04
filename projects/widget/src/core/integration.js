import { MSG_CASE_APPROVED, MSG_AUTH_LOGIN, MSG_AUTH_LOGOUT, MSG_SESSION_STATUS, MSG_OPEN_LOGIN, MSG_REPORT_SEND, MSG_REPORT_OUTCOME, MSG_REPORT_CLEAR, MSG_REPORT_LIST } from './messages.js';
import { API_ERROR_CODES, REPORT_FIELDS } from '../../../web-app/src/lib/contract/types.ts';

export async function submitCase(c) {
  const response = await chrome.runtime.sendMessage({ type: MSG_CASE_APPROVED, case: c });
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
  const response = await rpc({ type: MSG_AUTH_LOGIN, email, code });
  const account = publicAccount(response?.account);
  return response?.ok === true && account && Number.isInteger(response.revision)
    ? { ok: true, account, revision: response.revision } : failure(response);
}

export async function logoutParent() {
  const response = await rpc({ type: MSG_AUTH_LOGOUT });
  return response?.ok === true ? { ok: true } : failure(response);
}

export async function readSessionStatus() {
  const response = await rpc({ type: MSG_SESSION_STATUS });
  const account = publicAccount(response?.account);
  if (!Number.isInteger(response?.revision) || !['connected', 'none'].includes(response?.status)
    || (response.status === 'connected' && !account)) return failure(response);
  return { status: response.status, account: response.status === 'connected' ? account : null, revision: response.revision };
}

export async function openLogin() {
  const response = await rpc({ type: MSG_OPEN_LOGIN });
  return response?.ok === true ? { ok: true } : failure(response);
}

function reportOutcome(response) {
  const recipient = publicAccount(response?.recipient);
  if (response?.ok !== true || !recipient || !response.report
    || !REPORT_FIELDS.every(key => Object.hasOwn(response.report, key))) return failure(response);
  return { ok: true, report: Object.fromEntries(REPORT_FIELDS.map(key => [key, response.report[key]])), recipient };
}

export async function submitReport(operation) {
  return reportOutcome(await rpc({ type: MSG_REPORT_SEND, case_id: operation.case_id,
    request_id: operation.request_id, expected_account_id: operation.expected_account_id,
    session_revision: operation.session_revision, payload: operation.payload }));
}

export async function readReportOutcome(case_id) {
  const response = await rpc({ type: MSG_REPORT_OUTCOME, case_id });
  return response?.ok === true && response.report === null ? { ok: true, report: null } : reportOutcome(response);
}

export async function clearReportOutcome(case_id) {
  const response = await rpc({ type: MSG_REPORT_CLEAR, case_id });
  return response?.ok === true ? { ok: true } : failure(response);
}

// D-14: explicit open/retry only. The worker validates the extension-scope rows; this adapter
// copies the exact report fields and never treats a malformed reply as a valid (empty) list.
export async function getReports(operation) {
  const response = await rpc({ type: MSG_REPORT_LIST, request_id: operation.request_id,
    expected_account_id: operation.expected_account_id, session_revision: operation.session_revision });
  const rows = response?.reports;
  if (response?.ok !== true || !Array.isArray(rows) || rows.length > 10
    || !(response.next_cursor === null || typeof response.next_cursor === 'string')
    || response.account_id !== operation.expected_account_id || response.revision !== operation.session_revision
    || !rows.every(row => row !== null && typeof row === 'object' && Reflect.ownKeys(row).length === REPORT_FIELDS.length
      && REPORT_FIELDS.every(key => Object.hasOwn(row, key)))) return failure(response);
  return { ok: true, reports: rows.map(row => Object.fromEntries(REPORT_FIELDS.map(key => [key, row[key]]))),
    next_cursor: response.next_cursor, account_id: response.account_id, revision: response.revision };
}
