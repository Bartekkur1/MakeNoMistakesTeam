import { MSG_CASE_APPROVED } from '../core/messages.js';
import { isValidCase } from '../core/case.js';

const cases = [];
const messages = [];
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  messages.push({ type: typeof msg?.type === 'string' ? msg.type : null, at: Date.now() });
  if (sender.id !== chrome.runtime.id || !sender.tab) return;
  if (msg?.type !== MSG_CASE_APPROVED) return;
  if (!isValidCase(msg.case)) { sendResponse({ ok: false }); return; }
  cases.push(msg.case);
  if (cases.length > 100) cases.shift();
  sendResponse({ ok: true });
});
self.__aura = { cases, messages };
