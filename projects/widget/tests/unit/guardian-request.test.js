import { test, expect, vi, afterEach } from 'vitest';
import { buildCase } from '../../src/core/case.js';
import { detectHints, evaluate } from '../../src/core/check.js';
import * as integration from '../../src/core/integration.js';
import * as messages from '../../src/core/messages.js';
import { STRINGS } from '../../src/ui/strings.pl.js';

const requestType = 'aura/guardian-request';
const approvedCase = () => buildCase({ text: 'Podaj kod do konta', link: 'https://demo.example/check', origin: 'paste' });
const keyedResult = c => evaluate({ sender: ['unknown_sender'], request: ['code'], verify: ['no_channel'] }, detectHints(c));

afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  document.querySelector('bezpieczna-aura-widget')?.remove();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

async function worker() {
  vi.resetModules();
  let listener;
  const memory = {};
  vi.stubGlobal('self', memory);
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-ext', onMessage: { addListener: vi.fn(fn => { listener = fn; }) } },
    action: { onClicked: { addListener: vi.fn() } },
  });
  await import('../../src/background/sw.js');
  return {
    memory,
    receive(message, sender = { id: 'test-ext', tab: { id: 1 } }) {
      const reply = vi.fn();
      listener(message, sender, reply);
      return reply;
    },
  };
}

test('guardian mock accepts approved case and keyed result without another case record', async () => {
  const w = await worker();
  const c = approvedCase(); const result = keyedResult(c);
  const before = JSON.stringify({ case: c, result });
  expect(w.receive({ type: messages.MSG_CASE_APPROVED, case: c })).toHaveBeenCalledWith({ ok: true });
  expect(w.memory.__aura.cases).toEqual([c]);
  expect(w.memory.__aura.guardianRequests ?? []).toEqual([]);

  const reply = w.receive({ type: requestType, case: c, result });
  expect(reply).toHaveBeenCalledExactlyOnceWith({ ok: true });
  expect(w.memory.__aura.guardianRequests).toEqual([{ case: c, result }]);
  expect(w.memory.__aura.cases).toEqual([c]);
  expect(w.memory.__aura.messages.map(m => m.type)).toEqual([messages.MSG_CASE_APPROVED, requestType]);
  expect(JSON.stringify({ case: c, result })).toBe(before);
});

test('guardian adapter sends only the approved case and current keyed result', async () => {
  const send = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal('chrome', { runtime: { sendMessage: send } });
  const c = approvedCase(); const result = keyedResult(c);
  expect(messages.MSG_GUARDIAN_REQUEST).toBe(requestType);
  expect(integration.requestGuardianVerification).toBeTypeOf('function');
  expect(await integration.requestGuardianVerification(c, result)).toEqual({ ok: true });
  expect(send).toHaveBeenCalledExactlyOnceWith({ type: requestType, case: c, result });
  const sent = send.mock.calls[0][0];
  expect(sent.result).not.toBe(result);
  expect(sent.result.signals).not.toBe(result.signals);
  expect(sent.result.unknowns).not.toBe(result.unknowns);
  expect(sent.result.step).not.toBe(result.step);
  expect(sent.result.mismatches).not.toBe(result.mismatches);
});

for (const [name, response] of [['false', { ok: false }], ['missing ok', {}], ['absent response', undefined], ['truthy nonboolean', { ok: 1 }]]) {
  test(`guardian adapter rejects ${name} instead of confirming delivery`, async () => {
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn().mockResolvedValue(response) } });
    expect(integration.requestGuardianVerification).toBeTypeOf('function');
    const c = approvedCase();
    await expect(integration.requestGuardianVerification(c, keyedResult(c))).rejects.toThrow();
  });
}

for (const [name, corrupt] of [
  ['blank case', (c, r) => ({ case: { ...c, content: '' }, result: r })],
  ['missing result', c => ({ case: c })],
  ['unknown summary', (c, r) => ({ case: c, result: { ...r, summaryKey: 'safe' } })],
  ['unknown signal', (c, r) => ({ case: c, result: { ...r, signals: ['invented'] } })],
  ['invalid step', (c, r) => ({ case: c, result: { ...r, step: { id: 'protect_credentials', explanationKey: 'invented' } } })],
  ['sparse signal list', (c, r) => ({ case: c, result: { ...r, signals: Array(1) } })],
  ['sparse unknown list', (c, r) => ({ case: c, result: { ...r, unknowns: Array(1) } })],
  ['sparse mismatch list', (c, r) => ({ case: c, result: { ...r, mismatches: Array(1) } })],
  ['extra case field', (c, r) => ({ case: { ...c, privateData: 'unapproved' }, result: r })],
  ['array result', c => ({ case: c, result: [] })],
  ['extra result field', (c, r) => ({ case: c, result: { ...r, privateData: 'unapproved' } })],
  ['nonstring summary', (c, r) => ({ case: c, result: { ...r, summaryKey: ['caution'] } })],
  ['nonarray signals', (c, r) => ({ case: c, result: { ...r, signals: 'credential_code' } })],
  ['nonstring signal', (c, r) => ({ case: c, result: { ...r, signals: [null] } })],
  ['duplicate signals', (c, r) => ({ case: c, result: { ...r, signals: ['credential_code', 'credential_code'] } })],
  ['fallback signal', (c, r) => ({ case: c, result: { ...r, signals: ['none'] } })],
  ['unknown unknown key', (c, r) => ({ case: c, result: { ...r, unknowns: ['invented'] } })],
  ['nonarray unknowns', (c, r) => ({ case: c, result: { ...r, unknowns: {} } })],
  ['nonstring unknown', (c, r) => ({ case: c, result: { ...r, unknowns: [42] } })],
  ['duplicate unknowns', (c, r) => ({ case: c, result: { ...r, unknowns: ['sender', 'sender'] } })],
  ['missing step', (c, r) => ({ case: c, result: { ...r, step: null } })],
  ['explanation as step', (c, r) => ({ case: c, result: { ...r, step: { id: 'protect_credentials_how', explanationKey: 'protect_credentials_how_how' } } })],
  ['extra step field', (c, r) => ({ case: c, result: { ...r, step: { ...r.step, privateData: true } } })],
  ['nonarray mismatches', (c, r) => ({ case: c, result: { ...r, mismatches: {} } })],
  ['invalid mismatch question', (c, r) => ({ case: c, result: { ...r, mismatches: [{ questionId: 'sender', answerId: 'code', messageKey: 'credential_code' }] } })],
  ['invalid mismatch answer', (c, r) => ({ case: c, result: { ...r, mismatches: [{ questionId: 'request', answerId: 'ordinary', messageKey: 'credential_code' }] } })],
  ['mismatched message key', (c, r) => ({ case: c, result: { ...r, mismatches: [{ questionId: 'request', answerId: 'code', messageKey: 'credential_password' }] } })],
]) {
  test(`guardian mock rejects ${name} without keeping a request`, async () => {
    const w = await worker(); const c = approvedCase();
    expect(w.receive({ type: requestType, ...corrupt(c, keyedResult(c)) })).toHaveBeenCalledExactlyOnceWith({ ok: false });
    expect(w.memory.__aura.guardianRequests).toEqual([]);
    expect(w.memory.__aura.cases).toEqual([]);
  });
}

test('guardian mock bounds requests at 100 independently of approved cases', async () => {
  const w = await worker(); const original = approvedCase();
  w.receive({ type: messages.MSG_CASE_APPROVED, case: original });
  const requests = Array.from({ length: 102 }, (_, i) => {
    const c = { ...original, content: `Fictional approved case ${i}` };
    return { case: c, result: keyedResult(c) };
  });
  for (const payload of requests) expect(w.receive({ type: requestType, ...payload })).toHaveBeenCalledExactlyOnceWith({ ok: true });
  expect(w.memory.__aura.guardianRequests).toEqual(requests.slice(2));
  expect(w.memory.__aura.cases).toEqual([original]);
  expect(w.memory.__aura.messages).toHaveLength(103);
});

test('guardian mock retains valid keyed credential mismatches without mutation', async () => {
  const w = await worker(); const c = approvedCase();
  const result = evaluate({ sender: ['known_person'], request: ['ordinary'], verify: ['independent_channel'] }, detectHints(c));
  expect(result.mismatches).toEqual([{ questionId: 'request', answerId: 'code', messageKey: 'credential_code' }]);
  expect(w.receive({ type: requestType, case: c, result })).toHaveBeenCalledExactlyOnceWith({ ok: true });
  expect(w.memory.__aura.guardianRequests).toEqual([{ case: c, result }]);
});

async function controller() {
  vi.resetModules();
  const draftModule = await import('../../src/core/draft.js');
  const store = draftModule.createDraftStore();
  vi.spyOn(draftModule, 'createDraftStore').mockReturnValue(store);
  const panelModule = await import('../../src/ui/panel.js');
  const createPanel = panelModule.createPanel;
  let handlers;
  vi.spyOn(panelModule, 'createPanel').mockImplementation(options => {
    handlers = options.handlers;
    return createPanel(options);
  });
  const pending = [];
  const send = vi.fn(message => message.type === messages.MSG_CASE_APPROVED ? Promise.resolve({ ok: true })
    : new Promise((resolve, reject) => pending.push({ resolve, reject })));
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: send, onMessage: { addListener: vi.fn() } } });
  vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => 'Fictional approved content' });
  await import('../../src/content/main.js');
  const root = document.querySelector('bezpieczna-aura-widget').shadowRoot;
  const button = text => [...root.querySelectorAll('button')].find(b => b.textContent === text);
  root.querySelector('.avatar').click(); button(STRINGS.approve).click();
  await vi.waitFor(() => expect(store.get().view).toBe('safety'));
  button(STRINGS.next).click();
  for (const id of ['known_person', 'ordinary', 'independent_channel']) {
    root.querySelector(`input[value="${id}"]`).click(); button(STRINGS.next).click();
  }
  expect(store.get().view).toBe('result');
  return { store, handlers, root, button, pending, send };
}

for (const response of ['false', 'missing', 'rejected']) test(`controller preserves the exact result and retries after ${response}`, async () => {
  const c = await controller(); const check = c.store.get().check;
  const done = c.handlers.onRequestGuardianVerification();
  await c.handlers.onRequestGuardianVerification();
  expect(c.send).toHaveBeenCalledTimes(2);
  expect(c.store.get().submitting).toBe(true);
  expect(c.send.mock.calls[1][0]).toEqual({ type: requestType, case: check.case, result: check.result });
  if (response === 'rejected') c.pending[0].reject(new Error('Extension context invalidated.'));
  else c.pending[0].resolve(response === 'false' ? { ok: false } : {});
  await done;
  expect(c.store.get()).toMatchObject({ view: 'result', error: 'guardianRequest', submitting: false });
  expect(c.store.get().check).toBe(check);
  expect(c.root.querySelector('[role="alert"]').textContent).toBe(STRINGS.guardianRequestError);
  expect(c.root.textContent).not.toContain(STRINGS.confirmationHeading);
  expect(c.button(STRINGS.requestGuardianVerification).disabled).toBe(false);
  const retry = c.handlers.onRequestGuardianVerification();
  expect(c.root.querySelector('[role="alert"]')).toBeNull();
  c.pending[1].resolve({ ok: true }); await retry;
  expect(c.send).toHaveBeenCalledTimes(3);
  expect(c.send.mock.calls[2][0]).toEqual(c.send.mock.calls[1][0]);
  expect(c.store.get().view).toBe('confirmation');
  expect(c.root.activeElement).toBe(c.button(STRINGS.confirmationClose));
});

for (const interruption of ['close', 'hide', 'reset']) {
  for (const success of [true, false]) test(`controller ignores window revival after ${interruption}, success=${success}`, async () => {
    const c = await controller(); const oldCheck = c.store.get().check;
    const done = c.handlers.onRequestGuardianVerification();
    if (interruption === 'close') c.handlers.onClose();
    else if (interruption === 'hide') c.root.querySelector('[aria-label="' + STRINGS.hideLabel + '"]').click();
    else window.dispatchEvent(new Event('pagehide'));
    const reset = c.store.get();
    c.pending[0].resolve({ ok: success }); await done;
    expect(c.root.querySelector('.panel').hidden).toBe(true);
    expect(c.send).toHaveBeenCalledTimes(2);
    if (interruption === 'reset') {
      expect(c.store.get()).toBe(reset); expect(c.store.get().check).toBeNull();
    } else {
      expect(c.store.get().check.case).toBe(oldCheck.case);
      expect(c.store.get().check.answers).toBe(oldCheck.answers);
      expect(c.store.get().check.result).toBe(oldCheck.result);
    }
    c.store.show();
    vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => '' });
    c.root.querySelector('.avatar').click();
    expect(c.store.get().view).toBe(interruption === 'reset' ? 'menu' : success ? 'confirmation' : 'result');
    if (interruption !== 'reset' && !success) expect(c.root.querySelector('[role="alert"]').textContent).toBe(STRINGS.guardianRequestError);
    expect(c.send).toHaveBeenCalledTimes(2);
  });
}

test('controller closing and reopening confirmation never requests again', async () => {
  const c = await controller(); const done = c.handlers.onRequestGuardianVerification();
  c.pending[0].resolve({ ok: true }); await done;
  c.button(STRINGS.confirmationClose).click();
  vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => '' });
  c.root.querySelector('.avatar').click();
  expect(c.root.querySelector('h2').textContent).toBe(STRINGS.confirmationHeading);
  expect(c.root.activeElement).toBe(c.button(STRINGS.confirmationClose));
  await c.handlers.onRequestGuardianVerification();
  expect(c.send).toHaveBeenCalledTimes(2);
});

for (const [name, sender] of [['foreign extension', { id: 'other-ext', tab: { id: 1 } }], ['missing tab', { id: 'test-ext' }]]) {
  test(`guardian mock ignores ${name}`, async () => {
    const w = await worker(); const c = approvedCase();
    expect(w.receive({ type: requestType, case: c, result: keyedResult(c) }, sender)).not.toHaveBeenCalled();
    expect(w.memory.__aura.guardianRequests).toEqual([]);
    expect(w.memory.__aura.cases).toEqual([]);
  });
}
