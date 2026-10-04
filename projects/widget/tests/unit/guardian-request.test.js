import { test, expect, vi, afterEach } from 'vitest';
import { buildCase, buildReportPayload } from '../../src/core/case.js';
import { detectHints, evaluate } from '../../src/core/check.js';
import * as integration from '../../src/core/integration.js';
import * as messages from '../../src/core/messages.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
import loginExample from '../../../../.planning/shared/examples/post-auth-login-extension.json';
import reportExample from '../../../../.planning/shared/examples/post-reports.json';

const requestType = 'aura/report-send';
const account = loginExample.response.body.account;
const recipient = { id: account.id, display_name: account.display_name };
const session = { status: 'connected', account: recipient, revision: 0 };
const approvedCase = () => buildCase({ text: 'Podaj kod do konta', link: 'https://demo.example/check', origin: 'paste' });
const operation = (c = approvedCase()) => ({ case_id: 'case-1', request_id: 'request-1', expected_account_id: account.id,
  session_revision: 0, payload: buildReportPayload(c, { attack_type: 'data_request', taken_actions: [], source: 'other' }) });
const receipt = payload => ({ ok: true, recipient, report: { ...reportExample.response.body, ...payload } });

afterEach(() => {
  window.dispatchEvent(new Event('pagehide'));
  document.querySelector('bezpieczna-aura-widget')?.remove();
  vi.restoreAllMocks(); vi.unstubAllGlobals();
});

async function worker() {
  vi.resetModules();
  let listener;
  const memory = {};
  const storage = { auraSession: { token: loginExample.response.body.token, expires_at: '2099-10-04T00:00:00.000Z',
    account, email: loginExample.request.email, code: loginExample.request.code } };
  const fetchStub = vi.fn(async (_url, options) => new Response(JSON.stringify(receipt(JSON.parse(options.body)).report), { status: 201 }));
  vi.stubGlobal('fetch', fetchStub);
  vi.stubGlobal('self', memory);
  vi.stubGlobal('chrome', {
    runtime: { id: 'test-ext', getURL: path => 'chrome-extension://test-ext/' + path,
      onMessage: { addListener: vi.fn(fn => { listener = fn; }) }, onInstalled: { addListener: vi.fn() } },
    storage: { local: { setAccessLevel: vi.fn(async () => {}), get: vi.fn(async () => ({ ...storage })),
      set: vi.fn(async patch => Object.assign(storage, patch)), remove: vi.fn(async key => { delete storage[key]; }) } },
    tabs: { create: vi.fn(), onRemoved: { addListener: vi.fn() }, onUpdated: { addListener: vi.fn() } },
    action: { onClicked: { addListener: vi.fn() } },
  });
  await import('../../src/background/sw.js');
  return {
    memory, fetchStub,
    receive(message, sender = { id: 'test-ext', tab: { id: 1 }, frameId: 0, documentId: 'doc-1', url: 'https://demo.example/' }) {
      return new Promise(resolve => listener(message, sender, resolve));
    },
  };
}

test('report worker accepts exact reviewed payload without another case record', async () => {
  const w = await worker(); const c = approvedCase(); const op = operation(c);
  const before = JSON.stringify(op);
  expect(await w.receive({ type: messages.MSG_CASE_APPROVED, case: c })).toEqual({ ok: true });
  expect(w.memory.__aura.cases).toEqual([c]); expect(w.fetchStub).not.toHaveBeenCalled();
  expect(await w.receive({ type: requestType, ...op })).toEqual(receipt(op.payload));
  expect(w.fetchStub).toHaveBeenCalledOnce();
  expect(w.fetchStub.mock.calls[0][1]).toMatchObject({ method: 'POST', headers: { Authorization: 'Bearer ' + loginExample.response.body.token } });
  expect(JSON.parse(w.fetchStub.mock.calls[0][1].body)).toEqual(op.payload);
  expect(w.memory.__aura.cases).toEqual([c]);
  expect(w.memory.__aura.messages.map(m => m.type)).toEqual([messages.MSG_CASE_APPROVED, requestType]);
  expect(JSON.stringify(op)).toBe(before);
});

test('report adapter sends only reviewed DTO and operation identity', async () => {
  const op = operation(); const send = vi.fn().mockResolvedValue(receipt(op.payload));
  vi.stubGlobal('chrome', { runtime: { sendMessage: send } });
  expect(integration.submitReport).toBeTypeOf('function');
  expect(await integration.submitReport(op)).toEqual(receipt(op.payload));
  expect(send).toHaveBeenCalledExactlyOnceWith({ type: requestType, ...op });
  expect(Object.keys(send.mock.calls[0][0].payload).sort()).toEqual(['attack_type', 'content', 'source', 'taken_actions']);
  expect(send.mock.calls[0][0]).not.toHaveProperty('case'); expect(send.mock.calls[0][0]).not.toHaveProperty('result');
});

for (const [name, response] of [['false', { ok: false }], ['missing ok', {}], ['absent response', undefined], ['truthy nonboolean', { ok: 1 }]]) {
  test(`report adapter rejects ${name} instead of confirming delivery`, async () => {
    vi.stubGlobal('chrome', { runtime: { sendMessage: vi.fn().mockResolvedValue(response) } });
    expect(integration.submitReport).toBeTypeOf('function');
    expect(await integration.submitReport(operation())).toEqual({ ok: false, kind: 'context' });
  });
}

// The inherited malformed-result cases now guard the exact report DTO/envelope boundary.
for (const [name, corrupt] of [
  ['blank content', op => ({ ...op, payload: { ...op.payload, content: '' } })],
  ['missing payload', op => ({ ...op, payload: undefined })],
  ['unknown attack', op => ({ ...op, payload: { ...op.payload, attack_type: 'safe' } })],
  ['unknown action', op => ({ ...op, payload: { ...op.payload, taken_actions: ['invented'] } })],
  ['invalid source', op => ({ ...op, payload: { ...op.payload, source: 'invented' } })],
  ['sparse action list', op => ({ ...op, payload: { ...op.payload, taken_actions: Array(1) } })],
  ['sparse payload', op => ({ ...op, payload: Array(1) })],
  ['sparse request identity', op => ({ ...op, request_id: Array(1) })],
  ['extra content field', op => ({ ...op, payload: { ...op.payload, privateData: 'unapproved' } })],
  ['array payload', op => ({ ...op, payload: [] })],
  ['extra envelope field', op => ({ ...op, privateData: 'unapproved' })],
  ['nonstring attack', op => ({ ...op, payload: { ...op.payload, attack_type: ['data_request'] } })],
  ['nonarray actions', op => ({ ...op, payload: { ...op.payload, taken_actions: 'shared_code' } })],
  ['nonstring action', op => ({ ...op, payload: { ...op.payload, taken_actions: [null] } })],
  ['duplicate actions', op => ({ ...op, payload: { ...op.payload, taken_actions: ['shared_code', 'shared_code'] } })],
  ['fallback action', op => ({ ...op, payload: { ...op.payload, taken_actions: ['none'] } })],
  ['unknown source', op => ({ ...op, payload: { ...op.payload, source: 'web' } })],
  ['nonstring source object', op => ({ ...op, payload: { ...op.payload, source: {} } })],
  ['nonstring source number', op => ({ ...op, payload: { ...op.payload, source: 42 } })],
  ['array source', op => ({ ...op, payload: { ...op.payload, source: ['other', 'other'] } })],
  ['missing account', op => ({ ...op, expected_account_id: null })],
  ['invalid account identity', op => ({ ...op, expected_account_id: 'Mama Oli' })],
  ['extra payload field', op => ({ ...op, payload: { ...op.payload, answers: {} } })],
  ['nonarray action object', op => ({ ...op, payload: { ...op.payload, taken_actions: {} } })],
  ['invalid case identity', op => ({ ...op, case_id: {} })],
  ['invalid request identity', op => ({ ...op, request_id: '' })],
  ['invalid revision', op => ({ ...op, session_revision: -1 })],
]) {
  test(`report worker rejects ${name} without keeping a request`, async () => {
    const w = await worker();
    expect(await w.receive({ type: requestType, ...corrupt(operation()) })).toMatchObject({ ok: false });
    expect(w.fetchStub).not.toHaveBeenCalled(); expect(w.memory.__aura.cases).toEqual([]);
    expect(await w.receive({ type: 'aura/report-outcome', case_id: 'case-1' })).toEqual({ ok: true, report: null });
  });
}

test('report worker bounds outcomes at 100 independently of approved cases', async () => {
  const w = await worker(); const original = approvedCase();
  await w.receive({ type: messages.MSG_CASE_APPROVED, case: original });
  const requests = Array.from({ length: 102 }, (_, i) => ({ ...operation({ ...original, content: `Fictional approved case ${i}` }), case_id: 'case-' + i, request_id: 'request-' + i }));
  for (const op of requests) expect(await w.receive({ type: requestType, ...op })).toEqual(receipt(op.payload));
  expect(await w.receive({ type: 'aura/report-outcome', case_id: 'case-0' })).toEqual({ ok: true, report: null });
  expect(await w.receive({ type: 'aura/report-outcome', case_id: 'case-1' })).toEqual({ ok: true, report: null });
  expect(await w.receive({ type: 'aura/report-outcome', case_id: 'case-2' })).toEqual(receipt(requests[2].payload));
  expect(w.fetchStub).toHaveBeenCalledTimes(102); expect(w.memory.__aura.cases).toEqual([original]);
  expect(w.memory.__aura.messages).toHaveLength(100);
});

test('report worker keeps credential mismatches local without mutation', async () => {
  const w = await worker(); const c = approvedCase();
  const result = evaluate({ sender: ['known_person'], request: ['ordinary'], verify: ['independent_channel'] }, detectHints(c));
  expect(result.mismatches).toEqual([{ questionId: 'request', answerId: 'code', messageKey: 'credential_code' }]);
  const before = JSON.stringify(result); const op = operation(c);
  expect(await w.receive({ type: requestType, ...op })).toEqual(receipt(op.payload));
  expect(JSON.parse(w.fetchStub.mock.calls[0][1].body)).toEqual(op.payload);
  expect(JSON.stringify(result)).toBe(before); expect(w.memory.__aura.cases).toEqual([]);
});

async function controller() {
  vi.resetModules();
  const draftModule = await import('../../src/core/draft.js');
  const store = draftModule.createDraftStore();
  vi.spyOn(draftModule, 'createDraftStore').mockReturnValue(store);
  const panelModule = await import('../../src/ui/panel.js'); const createPanel = panelModule.createPanel;
  let handlers;
  vi.spyOn(panelModule, 'createPanel').mockImplementation(options => { handlers = options.handlers; return createPanel(options); });
  const pending = [];
  const send = vi.fn(message => {
    if (message.type === requestType) return new Promise((resolve, reject) => pending.push({ resolve, reject, message }));
    if (message.type === 'aura/session-status') return Promise.resolve(session);
    if (message.type === 'aura/report-outcome') return Promise.resolve({ ok: true, report: null });
    return Promise.resolve({ ok: true });
  });
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: send, onMessage: { addListener: vi.fn() } } });
  vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => 'Fictional approved content' });
  await import('../../src/content/main.js');
  const root = document.querySelector('bezpieczna-aura-widget').shadowRoot;
  const button = text => [...root.querySelectorAll('button')].find(b => b.textContent === text);
  root.querySelector('.avatar').click(); button(STRINGS.approve).click();
  await vi.waitFor(() => expect(store.get().view).toBe('safety')); button(STRINGS.next).click();
  for (const id of ['known_person', 'ordinary', 'independent_channel']) {
    root.querySelector(`input[value="${id}"]`).click(); button(STRINGS.next).click();
  }
  await vi.waitFor(() => expect(button(STRINGS.showSendPreview).disabled).toBe(false));
  button(STRINGS.showSendPreview).click();
  await vi.waitFor(() => expect(button(STRINGS.send).disabled).toBe(false));
  const reportCalls = () => send.mock.calls.filter(([msg]) => msg.type === requestType).map(([msg]) => msg);
  return { store, handlers, root, button, pending, send, reportCalls };
}

for (const response of ['false', 'missing', 'rejected']) test(`controller preserves the exact result and retries after ${response}`, async () => {
  const c = await controller(); const check = c.store.get().check; const preview = c.store.get().sendPreview;
  const done = c.handlers.onSendReport(); await c.handlers.onSendReport();
  await vi.waitFor(() => expect(c.reportCalls()).toHaveLength(1));
  expect(c.store.get().submitting).toBe(true);
  expect(c.reportCalls()[0]).toEqual({ type: requestType, case_id: c.store.get().case_id, request_id: c.store.get().request_id,
    expected_account_id: account.id, session_revision: 0, payload: { attack_type: preview.attack_type, taken_actions: preview.taken_actions, source: preview.source, content: preview.content } });
  if (response === 'rejected') c.pending[0].reject(new Error('Extension context invalidated.'));
  else c.pending[0].resolve(response === 'false' ? { ok: false, kind: 'http', status: 500 } : {});
  await done;
  const kind = response === 'false' ? 'http' : 'unknown';
  expect(c.store.get()).toMatchObject({ view: 'sendPreview', sendOutcome: { kind }, submitting: false });
  expect(c.store.get().check.case).toBe(check.case); expect(c.store.get().check.answers).toBe(check.answers); expect(c.store.get().check.result).toBe(check.result);
  expect(c.root.querySelector('[role="alert"]').textContent).toBe(STRINGS.sendOutcomes[kind].title + STRINGS.sendOutcomes[kind].body);
  expect(c.root.textContent).not.toContain(STRINGS.sentRecipientPrefix);
  expect(c.button(kind === 'unknown' ? STRINGS.sendAgain : STRINGS.sendRetry).disabled).toBe(false);
  expect(c.store.get().sendPreview).toBe(preview);
  const retry = c.handlers.onSendReport(); expect(c.root.querySelector('[role="alert"]')).toBeNull();
  await vi.waitFor(() => expect(c.pending).toHaveLength(2));
  c.pending[1].resolve(receipt(c.pending[1].message.payload)); await retry;
  expect(c.reportCalls()).toHaveLength(2);
  expect(c.reportCalls()[1].payload).toEqual(c.reportCalls()[0].payload);
  expect(c.reportCalls()[1].case_id).toBe(c.reportCalls()[0].case_id); expect(c.reportCalls()[1].request_id).not.toBe(c.reportCalls()[0].request_id);
  expect(c.store.get().view).toBe('confirmation'); expect(c.root.activeElement).toBe(c.button(STRINGS.confirmationClose));
});

for (const interruption of ['close', 'hide', 'reset']) {
  for (const success of [true, false]) test(`controller ignores window revival after ${interruption}, success=${success}`, async () => {
    const c = await controller(); const oldCheck = c.store.get().check; const done = c.handlers.onSendReport();
    await vi.waitFor(() => expect(c.pending).toHaveLength(1));
    if (interruption === 'close') c.handlers.onClose();
    else if (interruption === 'hide') c.root.querySelector('[aria-label="' + STRINGS.hideLabel + '"]').click();
    else window.dispatchEvent(new Event('pagehide'));
    const reset = c.store.get();
    c.pending[0].resolve(success ? receipt(c.pending[0].message.payload) : { ok: false, kind: 'http' }); await done;
    expect(c.root.querySelector('.panel').hidden).toBe(true); expect(c.reportCalls()).toHaveLength(1);
    if (interruption === 'reset') { expect(c.store.get()).toBe(reset); expect(c.store.get().check).toBeNull(); }
    else { expect(c.store.get().check.case).toBe(oldCheck.case); expect(c.store.get().check.answers).toBe(oldCheck.answers); expect(c.store.get().check.result).toBe(oldCheck.result); }
    c.store.show(); vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => '' }); c.root.querySelector('.avatar').click();
    expect(c.store.get().view).toBe(interruption === 'reset' ? 'menu' : success ? 'confirmation' : 'sendPreview');
    if (interruption !== 'reset' && !success) expect(c.root.querySelector('[role="alert"]').textContent).toBe(STRINGS.sendOutcomes.http.title + STRINGS.sendOutcomes.http.body);
    expect(c.reportCalls()).toHaveLength(1);
  });
}

test('controller closing and reopening confirmation never requests again', async () => {
  const c = await controller(); const done = c.handlers.onSendReport();
  await vi.waitFor(() => expect(c.pending).toHaveLength(1));
  c.pending[0].resolve(receipt(c.pending[0].message.payload)); await done;
  c.button(STRINGS.confirmationClose).click(); vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => '' }); c.root.querySelector('.avatar').click();
  expect(c.root.querySelector('h2').textContent).toBe(STRINGS.sentRecipientPrefix + ' ' + account.display_name);
  expect(c.root.activeElement).toBe(c.button(STRINGS.confirmationClose));
  await c.handlers.onSendReport(); expect(c.reportCalls()).toHaveLength(1);
});

for (const [name, sender] of [
  ['foreign extension', { id: 'other-ext', tab: { id: 1 }, frameId: 0, documentId: 'doc-1', url: 'https://demo.example/' }],
  ['missing tab', { id: 'test-ext', frameId: 0, documentId: 'doc-1', url: 'https://demo.example/' }],
]) {
  test(`report worker rejects ${name}`, async () => {
    const w = await worker();
    expect(await w.receive({ type: requestType, ...operation() }, sender)).toEqual({ ok: false, kind: 'context' });
    expect(w.fetchStub).not.toHaveBeenCalled(); expect(w.memory.__aura.cases).toEqual([]);
  });
}
