import { test, expect, vi, afterEach } from 'vitest';
import { buildCase } from '../../src/core/case.js';
import { detectHints, evaluate } from '../../src/core/check.js';
import * as integration from '../../src/core/integration.js';
import * as messages from '../../src/core/messages.js';

const requestType = 'aura/guardian-request';
const approvedCase = () => buildCase({ text: 'Podaj kod do konta', link: 'https://demo.example/check', origin: 'paste' });
const keyedResult = c => evaluate({ sender: ['unknown_sender'], request: ['code'], verify: ['no_channel'] }, detectHints(c));

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

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
]) {
  test(`guardian mock rejects ${name} without keeping a request`, async () => {
    const w = await worker(); const c = approvedCase();
    expect(w.receive({ type: requestType, ...corrupt(c, keyedResult(c)) })).toHaveBeenCalledExactlyOnceWith({ ok: false });
    expect(w.memory.__aura.guardianRequests).toEqual([]);
    expect(w.memory.__aura.cases).toEqual([]);
  });
}

for (const [name, sender] of [['foreign extension', { id: 'other-ext', tab: { id: 1 } }], ['missing tab', { id: 'test-ext' }]]) {
  test(`guardian mock ignores ${name}`, async () => {
    const w = await worker(); const c = approvedCase();
    expect(w.receive({ type: requestType, case: c, result: keyedResult(c) }, sender)).not.toHaveBeenCalled();
    expect(w.memory.__aura.guardianRequests).toEqual([]);
    expect(w.memory.__aura.cases).toEqual([]);
  });
}
