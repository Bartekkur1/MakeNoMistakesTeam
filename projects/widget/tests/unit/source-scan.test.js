import { test, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
const src = path.resolve(import.meta.dirname, '../../src');
const files = fs.readdirSync(src, { recursive: true }).filter(f => fs.statSync(path.join(src, f)).isFile());
const sources = files.map(f => [f.replaceAll('\\', '/'), fs.readFileSync(path.join(src, f), 'utf8')]);
const FORBIDDEN = ['fetch(', 'XMLHttpRequest', 'sendBeacon', 'WebSocket', 'MutationObserver', 'selectionchange', 'selectstart', 'chrome.storage', 'localStorage', 'sessionStorage', 'indexedDB', 'document.cookie', 'innerHTML', 'outerHTML', 'insertAdjacentHTML', 'eval(', 'new Function', 'postMessage'];
test('reads and sends have exactly the approved sites', () => {
  for (const [token, allowed] of [['getSelection', ['content/capture.js']], ['chrome.runtime.sendMessage', ['core/integration.js']], ['captureSelection(', ['content/avatar.js', 'content/capture.js']]]) {
    expect(sources.filter(([, text]) => text.includes(token)).map(([file]) => file).sort()).toEqual(allowed.sort());
  }
});
test('no background reading, persistence, network or unsafe sinks', () => {
  for (const [file, text] of sources) {
    for (const token of FORBIDDEN) {
      if (file === 'background/sw.js' && ['fetch(', 'chrome.storage'].includes(token)) continue;
      expect(text, `${file}: ${token}`).not.toContain(token);
    }
    if (!['ui/strings.pl.js', 'options/login.js'].includes(file)) expect(text, file).not.toMatch(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/);
    if (file === 'ui/panel.js') expect(text).not.toContain('chrome.');
  }
});
test('manifest keeps the minimal permission and exposure contract', () => {
  const manifest = JSON.parse(fs.readFileSync(path.resolve(src, '../manifest.json'), 'utf8'));
  expect(manifest.permissions).toEqual(['activeTab', 'scripting', 'storage']);
  expect(manifest.host_permissions).toEqual(['https://bezpieczna-aura.pl/*', 'http://localhost:3000/*']);
  expect(manifest.options_ui).toEqual({ page: 'login.html', open_in_tab: true });
  for (const key of ['externally_connectable', 'web_accessible_resources']) expect(manifest).not.toHaveProperty(key);
  expect(manifest.action).not.toHaveProperty('default_popup');
  expect(manifest.content_scripts[0].all_frames).toBeFalsy();
});
