import { MSG_CASE_APPROVED } from './messages.js';

export async function submitCase(c) {
  const response = await chrome.runtime.sendMessage({ type: MSG_CASE_APPROVED, case: c });
  if (response?.ok !== true) throw new Error('not-accepted');
  return response;
}
