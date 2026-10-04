import { test as base, chromium } from '@playwright/test';
import path from 'node:path';
import { resolveBrowser } from './browser.mjs';

const dist = path.resolve(import.meta.dirname, '../../dist');
export const test = base.extend({
  bfcache: [false, { option: true }],
  netlog: async ({}, use) => {
    await use({ entries: [], startedAt: null });
  },
  context: async ({ netlog, bfcache }, use) => {
    const context = await chromium.launchPersistentContext('', {
      ...(bfcache ? { ignoreDefaultArgs: ['--disable-back-forward-cache'] } : {}),
      headless: !process.env.AURA_HEADED,
      args: [`--disable-extensions-except=${dist}`, `--load-extension=${dist}`],
      ...resolveBrowser(),
    });
    netlog.startedAt = Date.now();
    context.on('request', (r) => netlog.entries.push({ url: r.url(), at: Date.now() }));
    try { await use(context); }
    finally { await context.close(); }
  },
  serviceWorker: async ({ context }, use) => {
    const worker = context.serviceWorkers()[0] ?? await context.waitForEvent('serviceworker');
    await use(worker);
  },
  page: async ({ context, serviceWorker }, use) => {
    // Keep the production install tab open. Tests own a separate content page, selected
    // explicitly rather than assuming the first persistent-context tab is the chat.
    const loginUrl = new URL('login.html', serviceWorker.url()).href;
    const page = await context.newPage();
    const installedPage = opened => opened.once('domcontentloaded', () => {
      if (opened.url() === loginUrl && !page.isClosed()) page.bringToFront().catch(() => {});
    });
    context.on('page', installedPage);
    await page.bringToFront();
    try { await use(page); }
    finally { context.off('page', installedPage); await page.close(); }
  },
});
export const expect = test.expect;

export async function assertOnlyLocal(netlog, { mustInclude = 'http://127.0.0.1:4173/chat-like.html', settleMs = 1000 } = {}) {
  await new Promise((resolve) => setTimeout(resolve, settleMs));
  expect(netlog.entries.some(({ url }) => url === mustInclude)).toBe(true);
  expect(netlog.entries.every(({ url }) => ['http://127.0.0.1:4173/', 'chrome-extension://', 'data:'].some((prefix) => url.startsWith(prefix)))).toBe(true);
  test.info().annotations.push({ type: 'network-window',
    description: `${netlog.entries.length} requests observed over ${Date.now() - netlog.startedAt} ms (context-level, from launch to end of settling)` });
}
