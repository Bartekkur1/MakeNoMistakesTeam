import { MSG_CASE_APPROVED, MSG_GUARDIAN_REQUEST } from './messages.js';

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
