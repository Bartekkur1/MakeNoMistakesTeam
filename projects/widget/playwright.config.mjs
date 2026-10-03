import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e', testMatch: '**/*.spec.mjs', workers: 1, fullyParallel: false,
  timeout: 30000, reporter: 'list', use: { trace: 'retain-on-failure' },
  webServer: { command: 'node tests/e2e/server.mjs', url: 'http://127.0.0.1:4173/chat-like.html', reuseExistingServer: true },
});
