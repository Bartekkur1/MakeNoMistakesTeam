import { test, expect, vi, afterEach } from 'vitest';
import { createDraftStore } from '../../src/core/draft.js';
const draft = () => { const s = createDraftStore(); s.onAvatarClick({ text: 'Fictional', truncated: false }); return s; };
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.querySelector('bezpieczna-aura-widget')?.remove(); });
test('one pending approval freezes edits and rejects duplicates', () => {
  expect(createDraftStore().beginSubmit()).toBeNull();
  const s = draft(); const token = s.beginSubmit(); expect(typeof token).toBe('number');
  expect(s.get().submitting).toBe(true); expect(s.beginSubmit()).toBeNull();
  s.edit({ text: 'changed' }); expect(s.get().draft.text).toBe('Fictional');
  expect(s.approved(token)).toBe(true);
  expect(s.get()).toMatchObject({ view: 'confirmation', draft: null, pendingSelection: null, submitting: false, error: null });
  expect(s.approved(token)).toBe(false);
});
test('failure preserves draft; reset ignores both late outcomes', () => {
  const s = draft(); const token = s.beginSubmit(); expect(s.submitFailed(token)).toBe(true);
  expect(s.get()).toMatchObject({ view: 'preview', error: 'submit', submitting: false, draft: { text: 'Fictional' } });
  const next = s.beginSubmit(); s.resetForNewDocument(); const reset = s.get();
  expect(reset.gen).toBeGreaterThan(next); expect(s.approved(next)).toBe(false); expect(s.submitFailed(next)).toBe(false); expect(s.get()).toBe(reset);
});
for (const method of ['approved', 'submitFailed']) test(`closed window stays closed after ${method}`, () => {
  const s = draft(); const token = s.beginSubmit(); s.close(); expect(s[method](token)).toBe(true); expect(s.get().view).toBe('closed');
  expect(s.get().draft === null).toBe(method === 'approved');
});
for (const closed of [false, true]) test(`deferred integration sends once and respects close=${closed}`, async () => {
  vi.resetModules(); let resolve;
  const send = vi.fn(() => new Promise(r => { resolve = r; }));
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: send, onMessage: { addListener: vi.fn() } } });
  vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => 'Fictional' });
  await import('../../src/content/main.js');
  const root = document.querySelector('bezpieczna-aura-widget').shadowRoot;
  root.querySelector('.avatar').click();
  const button = () => [...root.querySelectorAll('button')].find(b => b.textContent === 'Zatwierdzam');
  button().click(); button().click(); expect(send).toHaveBeenCalledTimes(1);
  expect(button().disabled).toBe(true); expect(root.querySelector('textarea').readOnly).toBe(true); expect(root.querySelector('input').readOnly).toBe(true);
  if (closed) root.querySelector('[aria-label="Zamknij okno"]').click();
  resolve({ ok: true });
  await vi.waitFor(() => expect(root.querySelector('.panel').hidden).toBe(closed));
  if (!closed) await vi.waitFor(() => expect(root.textContent).toContain('Gotowe!'));
  else expect(root.textContent).not.toContain('Gotowe!');
});
