import { MSG_CASE_APPROVED, MSG_SHOW } from '../core/messages.js';
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
export async function onActionClicked(tab) {
  if (!Number.isInteger(tab?.id)) return { ok: false, via: 'none' };
  try { if ((await chrome.tabs.sendMessage(tab.id, { type: MSG_SHOW }))?.ok === true) return { ok: true, via: 'message' }; } catch {}
  try { await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] }); }
  catch { return { ok: false, via: 'inject-failed' }; }
  try { if ((await chrome.tabs.sendMessage(tab.id, { type: MSG_SHOW }))?.ok === true) return { ok: true, via: 'inject' }; } catch {}
  return { ok: false, via: 'no-ack' };
}
chrome.action.onClicked.addListener(onActionClicked);
self.__aura = { cases, messages, onActionClicked };
