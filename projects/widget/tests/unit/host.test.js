import { test, expect, afterEach } from 'vitest';
import { STYLE_TEXT, buildStyleText, createHost, HOST_TAG } from '../../src/content/host.js';
afterEach(() => document.querySelectorAll(HOST_TAG).forEach(el => el.remove()));
test('real CSS imports contain the shadow palette and panel', () => {
  for (const token of [':host {', '#0F62DB', '--radius-widget: 20px', '.panel']) expect(STYLE_TEXT).toContain(token);
  expect(STYLE_TEXT).not.toContain(':root {');
  expect(buildStyleText(':root { --a: 1; }', '.x{}')).toMatch(/^:host \{/);
});
test('host is mounted once with an open shadow and fixed highest layer', () => {
  const { host, root } = createHost(document);
  expect(document.querySelectorAll(HOST_TAG)).toHaveLength(1);
  expect(host.parentNode).toBe(document.documentElement);
  expect(host.shadowRoot).toBe(root);
  expect(root.mode).toBe('open');
  expect(host.style.position).toBe('fixed');
  expect(host.style.zIndex).toBe('2147483647');
});
