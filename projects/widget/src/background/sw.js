import { MSG_CASE_APPROVED, MSG_GUARDIAN_REQUEST, MSG_SHOW } from '../core/messages.js';
import { isValidCase } from '../core/case.js';
import { STRINGS } from '../ui/strings.pl.js';

const exactKeys = (value, keys) => value !== null && typeof value === 'object' && !Array.isArray(value)
  && Reflect.ownKeys(value).length === keys.length && keys.every(key => Object.hasOwn(value, key));
const keyedList = (value, copy) => Array.isArray(value) && value.length <= Object.keys(copy).length
  && new Set(value).size === value.length && value.every(key => typeof key === 'string' && key !== 'none' && Object.hasOwn(copy, key));
function isValidResult(result) {
  if (!exactKeys(result, ['summaryKey', 'signals', 'unknowns', 'step', 'mismatches'])) return false;
  if (typeof result.summaryKey !== 'string' || !Object.hasOwn(STRINGS.checkSummaries, result.summaryKey)) return false;
  if (!keyedList(result.signals, STRINGS.checkSignals) || !keyedList(result.unknowns, STRINGS.checkUnknowns)) return false;
  const step = result.step;
  if (!exactKeys(step, ['id', 'explanationKey']) || typeof step.id !== 'string'
      || !Object.hasOwn(STRINGS.checkSteps, step.id) || step.id.endsWith('_how')
      || step.explanationKey !== step.id + '_how' || !Object.hasOwn(STRINGS.checkSteps, step.explanationKey)) return false;
  return Array.isArray(result.mismatches) && result.mismatches.length <= 2
    && result.mismatches.every(m => exactKeys(m, ['questionId', 'answerId', 'messageKey'])
      && m.questionId === 'request' && ['password', 'code'].includes(m.answerId)
      && m.messageKey === 'credential_' + m.answerId && Object.hasOwn(STRINGS.checkMismatches, m.messageKey));
}

const cases = [];
const guardianRequests = [];
const messages = [];
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  messages.push({ type: typeof msg?.type === 'string' ? msg.type : null, at: Date.now() });
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
self.__aura = { cases, guardianRequests, messages, onActionClicked };
