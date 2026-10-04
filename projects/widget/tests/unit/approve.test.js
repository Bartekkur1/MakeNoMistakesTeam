import { test, expect, vi, afterEach } from 'vitest';
import { createDraftStore } from '../../src/core/draft.js';
import { buildCase } from '../../src/core/case.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
const draft = () => { const s = createDraftStore(); s.onAvatarClick({ text: 'Fictional', truncated: false }); return s; };
// Result entry and lifecycle now add local session-status / outcome-clear RPCs; only these
// approvals are case submissions, and no report is ever sent by approval.
const approvals = send => send.mock.calls.filter(([message]) => message.type === 'aura/case-approved');
const localOnly = send => send.mock.calls.every(([message]) => ['aura/case-approved', 'aura/session-status', 'aura/report-clear'].includes(message.type));
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.querySelector('bezpieczna-aura-widget')?.remove(); });
test('one pending approval freezes edits and rejects duplicates', () => {
  expect(createDraftStore().beginSubmit()).toBeNull();
  const s = draft(); const c = buildCase(s.get().draft); const token = s.beginSubmit(); expect(typeof token).toBe('number');
  expect(s.get().submitting).toBe(true); expect(s.beginSubmit()).toBeNull();
  s.edit({ text: 'changed' }); expect(s.get().draft.text).toBe('Fictional');
  expect(s.approved(token, c)).toBe(true);
  expect(s.get()).toMatchObject({ view: 'safety', draft: null, pendingSelection: null, submitting: false, error: null, check: { step: 'safety' } });
  expect(s.get().check.case).toBe(c);
  expect(s.approved(token, c)).toBe(false);
});
test('failure preserves draft; reset ignores both late outcomes', () => {
  const s = draft(); const token = s.beginSubmit(); expect(s.submitFailed(token)).toBe(true);
  expect(s.get()).toMatchObject({ view: 'preview', error: 'submit', submitting: false, draft: { text: 'Fictional' } });
  const c = buildCase(s.get().draft); const next = s.beginSubmit(); s.resetForNewDocument(); const reset = s.get();
  expect(reset.gen).toBeGreaterThan(next); expect(s.approved(next, c)).toBe(false); expect(s.submitFailed(next)).toBe(false); expect(s.get()).toBe(reset);
});
for (const method of ['approved', 'submitFailed']) test(`closed window stays closed after ${method}`, () => {
  const s = draft(); const c = buildCase(s.get().draft); const token = s.beginSubmit(); s.close(); expect(s[method](token, c)).toBe(true); expect(s.get().view).toBe('closed');
  expect(s.get().draft === null).toBe(method === 'approved');
  if (method === 'approved') {
    expect(s.get().check.case).toBe(c);
    expect(s.get().check.step).toBe('safety');
    expect(s.get().check.answers).toEqual({ sender: [], request: [], verify: [] });
  }
});
for (const closed of [false, true]) test(`deferred integration sends once and respects close=${closed}`, async () => {
  vi.resetModules(); let resolve;
  const send = vi.fn(() => new Promise(r => { resolve = r; }));
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: send, onMessage: { addListener: vi.fn() } } });
  vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => 'Fictional' });
  await import('../../src/content/main.js');
  const root = document.querySelector('bezpieczna-aura-widget').shadowRoot;
  root.querySelector('.avatar').click();
  const button = () => [...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.approve);
  button().click(); button().click(); expect(send).toHaveBeenCalledTimes(1);
  expect(button().disabled).toBe(true); expect(root.querySelector('textarea').readOnly).toBe(true); expect(root.querySelector('input').readOnly).toBe(true);
  if (closed) root.querySelector('[aria-label="Zamknij okno"]').click();
  resolve({ ok: true });
  await vi.waitFor(() => expect(root.querySelector('.panel').hidden).toBe(closed));
  expect(send.mock.calls[0][0].case).toMatchObject({ content: 'Fictional', origin: 'selection' });
  if (!closed) await vi.waitFor(() => expect(root.textContent).toContain(STRINGS.safetyNotice));
  else expect(root.textContent).not.toContain(STRINGS.safetyNotice);
  expect(send).toHaveBeenCalledTimes(1);
});

const completedStore = () => {
 const s = draft(); s.approved(s.beginSubmit(), buildCase(s.get().draft)); s.startQuestions();
 for (const [id, choice] of [['sender', 'known_person'], ['request', 'code'], ['verify', 'independent_channel']]) {
  s.answer(id, choice); s.nextQuestion();
 }
 return s;
};

test('empty edit cannot begin approval or disturb the approved session', () => {
 const s = completedStore(); const old = s.get().check; s.editCheckContent(); s.edit({ text: ' \u00a0 ' });
 const before = s.get(); expect(s.beginSubmit()).toBeNull(); expect(s.get()).toBe(before);
 expect(s.get().check).toBe(old); s.cancelCheckEdit(); expect(s.get().view).toBe('result');
});

test('unchanged normalized reapproval ignores timestamp and resumes the exact old result', () => {
 const s = completedStore(); const old = s.get().check; s.editCheckContent();
 s.edit({ text: ' \u00a0Fictional\u00a0 ', link: '  ' });
 const c = buildCase(s.get().draft, new Date('2030-01-01T00:00:00Z'));
 expect(c.created_at).not.toBe(old.case.created_at);
 expect(s.approved(s.beginSubmit(), c)).toBe(true); expect(s.get().view).toBe('result');
 expect(s.get().check).toBe(old); expect(s.get().draft).toBeNull();
});

for (const closed of [false, true]) test(`invalid current approval unlocks its candidate and preserves the old check, closed=${closed}`, () => {
 const s = completedStore(); const old = s.get().check; s.editCheckContent();
 s.edit({ text: 'Changed fictional candidate' }); const candidate = s.get().draft;
 const c = buildCase(candidate); const token = s.beginSubmit();
 if (closed) s.close();
 expect(s.approved(token, { ...c, content: '' })).toBe(false);
 expect(s.get()).toMatchObject({ submitting: false, error: 'submit', view: closed ? 'closed' : 'preview' });
 expect(s.get().check).toBe(old); expect(s.get().draft).toBe(candidate);
 const retry = s.beginSubmit(); expect(retry).toBeGreaterThan(token);
 expect(s.approved(retry, c)).toBe(true);
});

test('invalid stale approval cannot unlock a newer pending submission', () => {
 const s = draft(); const first = s.beginSubmit(); s.submitFailed(first);
 const current = s.beginSubmit(); const before = s.get();
 expect(s.approved(first, {})).toBe(false); expect(s.get()).toBe(before);
 expect(s.get().submitting).toBe(true);
 expect(s.approved(current, buildCase(s.get().draft))).toBe(true);
});

for (const normalized of [false, true]) test(`unchanged edit approval resumes the old result without sending another case, normalized=${normalized}`, async () => {
 vi.resetModules();
 const draftModule = await import('../../src/core/draft.js');
 const s = draftModule.createDraftStore(); vi.spyOn(draftModule, 'createDraftStore').mockReturnValue(s);
 const send = vi.fn().mockResolvedValue({ ok: true });
 vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: send, onMessage: { addListener: vi.fn() } } });
 vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => 'Fictional' });
 await import('../../src/content/main.js');
 const root = document.querySelector('bezpieczna-aura-widget').shadowRoot;
 const click = text => { const b = [...root.querySelectorAll('button')].find(b => b.textContent === text); expect(b).toBeDefined(); b.click(); };
 root.querySelector('.avatar').click(); click(STRINGS.approve);
 await vi.waitFor(() => expect(root.textContent).toContain(STRINGS.safetyNotice));
 click(STRINGS.next);
 for (const id of ['known_person', 'ordinary', 'independent_channel']) {
  root.querySelector(`input[value="${id}"]`).click(); click(STRINGS.next);
 }
 const old = s.get().check; const rendered = root.querySelector('h2').textContent;
 click(STRINGS.editCheckContent);
 if (normalized) {
  const text = root.querySelector('textarea'); text.value = ' \u00a0Fictional\u00a0 '; text.dispatchEvent(new Event('input'));
  const link = root.querySelector('input'); link.value = '  '; link.dispatchEvent(new Event('input'));
 }
 click(STRINGS.approve);
 await vi.waitFor(() => expect(root.querySelector('h2').textContent).toBe(rendered));
 expect(approvals(send)).toHaveLength(1); expect(localOnly(send)).toBe(true);
 expect(s.get().check).toBe(old);
 expect(s.get()).toMatchObject({ view: 'result', draft: null, candidateKind: null, submitting: false, error: null });
});

test('controller releases submission when approved rejects the current case', async () => {
 vi.resetModules();
 const draftModule = await import('../../src/core/draft.js');
 const s = draftModule.createDraftStore(); vi.spyOn(draftModule, 'createDraftStore').mockReturnValue(s);
 vi.spyOn(s, 'approved').mockReturnValue(false);
 vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: vi.fn().mockResolvedValue({ ok: true }), onMessage: { addListener: vi.fn() } } });
 vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => 'Fictional' });
 await import('../../src/content/main.js');
 const root = document.querySelector('bezpieczna-aura-widget').shadowRoot;
 const approve = () => [...root.querySelectorAll('button')].find(b => b.textContent === STRINGS.approve);
 root.querySelector('.avatar').click(); approve().click();
 await vi.waitFor(() => expect(s.approved).toHaveBeenCalledOnce());
 expect(s.get()).toMatchObject({ submitting: false, error: 'submit', view: 'preview', draft: { text: 'Fictional' } });
 expect(root.textContent).toContain(STRINGS.submitError);
 expect(root.querySelector('textarea').readOnly).toBe(false); expect(approve().disabled).toBe(false);
});

for (const field of ['text', 'link']) test(`successful ${field} edit alone clears every old answer and result`, () => {
 const s = completedStore(); const old = s.get().check; s.editCheckContent();
 s.edit({ [field]: field === 'text' ? 'New fictional content' : 'https://new.example/' });
 const c = buildCase(s.get().draft); expect(s.get().check).toBe(old);
 const token = s.beginSubmit(); s.close(); expect(s.approved(token, c)).toBe(true);
 expect(s.get().view).toBe('closed'); expect(s.get().check.case).toBe(c);
 expect(s.get().check).toMatchObject({ resumeStep: 'safety', answers: { sender: [], request: [], verify: [] }, result: null, keptAnswers: {}, discrepancy: null });
 s.onAvatarClick({ text: '' }); expect(s.get().view).toBe('safety');
});

for (const outcome of ['approved', 'submitFailed']) test(`late replacement ${outcome} after document reset cannot revive any session`, () => {
 const s = completedStore(); s.onAvatarClick({ text: 'Replacement candidate' }); s.checkNewSelection();
 const c = buildCase(s.get().draft); const token = s.beginSubmit(); s.resetForNewDocument();
 const reset = s.get(); expect(reset.gen).toBeGreaterThan(token);
 expect(s[outcome](token, c)).toBe(false); expect(s.get()).toBe(reset);
 expect(reset).toMatchObject({ check: null, draft: null, candidateKind: null, pendingSelection: null });
 s.onAvatarClick({ text: '' }); expect(s.get().view).toBe('menu');
});

for (const outcome of ['success', 'failure', 'reset-success', 'reset-failure']) test(`replacement controller preserves ownership on deferred ${outcome}`, async () => {
 vi.resetModules(); let captured = 'Fictional'; let resolve; let approvalCount = 0;
 // Local lifecycle RPCs answer at once; only the replacement approval stays deferred.
 const send = vi.fn(message => message.type !== 'aura/case-approved' ? Promise.resolve({ ok: true })
  : ++approvalCount === 1 ? Promise.resolve({ ok: true }) : new Promise(r => { resolve = r; }));
 vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: send, onMessage: { addListener: vi.fn() } } });
 const capture = vi.spyOn(document, 'getSelection').mockImplementation(() => ({ toString: () => captured }));
 await import('../../src/content/main.js');
 const root = document.querySelector('bezpieczna-aura-widget').shadowRoot;
 const findButton = text => [...root.querySelectorAll('button')].find(b => b.textContent === text);
 const click = text => { const button = findButton(text); expect(button, text).toBeDefined(); button.click(); };
 root.querySelector('.avatar').click(); click(STRINGS.approve);
 await vi.waitFor(() => expect(root.textContent).toContain(STRINGS.safetyNotice));
 click(STRINGS.next);
 root.querySelector('input[value="known_person"]').click(); click(STRINGS.next);
 root.querySelector('input[value="code"]').click();
 captured = 'Replacement https://new.example/'; root.querySelector('.avatar').click();
 expect(root.querySelector('input[value="code"]').checked).toBe(true);
 click(STRINGS.checkNewSelection);
 expect(root.querySelector('textarea').value).toBe(captured); expect(approvals(send)).toHaveLength(1);
 click(STRINGS.approve); findButton(STRINGS.approve).click(); expect(approvals(send)).toHaveLength(2);
 expect(root.querySelector('textarea').readOnly).toBe(true); expect(findButton(STRINGS.cancelCheckEdit).disabled).toBe(true);
 root.querySelector('[aria-label="Zamknij okno"]').click();
 if (outcome.startsWith('reset')) window.dispatchEvent(new Event('pagehide'));
 resolve({ ok: outcome.endsWith('success') });
 // Let both submission awaits settle before asserting that a late reply stays closed.
 await new Promise(r => setTimeout(r, 0));
 expect(root.querySelector('.panel').hidden).toBe(true);
 captured = ''; root.querySelector('.avatar').click();
 await vi.waitFor(() => {
  if (outcome.startsWith('reset')) expect(root.textContent).toContain(STRINGS.menuIntro);
  else if (outcome === 'success') expect(root.textContent).toContain(STRINGS.safetyNotice);
  else expect(root.textContent).toContain(STRINGS.submitError);
 });
 if (outcome === 'failure') {
  expect(root.querySelector('textarea').value).toBe('Replacement https://new.example/');
  click(STRINGS.cancelCheckEdit); expect(root.querySelector('input[value="code"]').checked).toBe(true);
 }
 if (outcome === 'success') { click(STRINGS.next); expect(root.querySelectorAll('input:checked')).toHaveLength(0); }
 expect(approvals(send)).toHaveLength(2); expect(localOnly(send)).toBe(true); expect(capture).toHaveBeenCalledTimes(3);
 expect(approvals(send)[1][0].case).toMatchObject({ content: 'Replacement https://new.example/', link: 'https://new.example/', origin: 'selection' });
});
