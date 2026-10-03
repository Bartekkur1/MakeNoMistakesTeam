import { test, expect, vi, afterEach } from 'vitest';
import { createDraftStore } from '../../src/core/draft.js';
import { buildCase } from '../../src/core/case.js';
import { STRINGS } from '../../src/ui/strings.pl.js';
const draft = () => { const s = createDraftStore(); s.onAvatarClick({ text: 'Fictional', truncated: false }); return s; };
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
