import { test, expect, vi, afterEach } from 'vitest';
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); document.querySelector('bezpieczna-aura-widget')?.remove(); document.querySelector('#msg')?.remove(); });
test('D-04: no reading or sending before deliberate capture and approval', async () => {
  vi.resetModules();
  const SELECTED = 'Fictional message';
  const recorded = [];
  for (const target of [EventTarget.prototype, window, document]) {
    const original = target.addEventListener;
    vi.spyOn(target, 'addEventListener').mockImplementation(function(type, ...rest) {
      recorded.push({ target: this, type });
      return original.call(this, type, ...rest);
    });
  }
  const docSelection = vi.spyOn(document, 'getSelection').mockReturnValue({ toString: () => SELECTED });
  const winSelection = vi.spyOn(window, 'getSelection').mockReturnValue({ toString: () => SELECTED });
  const fetchSpy = vi.fn(); vi.stubGlobal('fetch', fetchSpy);
  const xhr = vi.spyOn(XMLHttpRequest.prototype, 'open').mockImplementation(() => {});
  const beacon = vi.fn(); Object.defineProperty(navigator, 'sendBeacon', { configurable: true, value: beacon });
  const socket = vi.fn(); vi.stubGlobal('WebSocket', socket);
  const observers = vi.fn(); vi.stubGlobal('MutationObserver', class { constructor() { observers(); } });
  const send = vi.fn(async () => ({ ok: true }));
  vi.stubGlobal('chrome', { runtime: { id: 'test-ext', sendMessage: send, onMessage: { addListener: vi.fn() } } });
  const p = document.createElement('p'); p.id = 'msg'; p.textContent = SELECTED; document.body.append(p);
  await import('../../src/content/main.js');
  for (const target of [document, p]) for (const type of ['selectionchange', 'mouseup', 'keyup', 'copy']) target.dispatchEvent(new Event(type, { bubbles: true }));
  for (const spy of [docSelection, winSelection, send, fetchSpy, xhr, beacon, socket, observers]) expect(spy).not.toHaveBeenCalled();
  const host = document.querySelector('bezpieczna-aura-widget');
  for (const { target, type } of recorded) {
    if (target === window || target === document) expect(['pagehide', 'resize']).toContain(type);
    if (target instanceof Element && document.contains(target)) expect(target).toBe(host);
  }
  host.shadowRoot.querySelector('button.avatar').click();
  expect(docSelection.mock.calls.length + winSelection.mock.calls.length).toBe(1);
  expect(host.shadowRoot.querySelector('textarea').value).toBe(SELECTED);
  [...host.shadowRoot.querySelectorAll('button')].find(b => b.textContent === 'Zatwierdzam').click();
  await vi.waitFor(() => expect(send).toHaveBeenCalledTimes(1));
  expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'aura/case-approved' }));
});
