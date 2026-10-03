import fs from 'node:fs';

export function resolveBrowser(env = process.env, exists = fs.existsSync) {
  if (env.AURA_CHROMIUM === 'bundled') return { channel: 'chromium' };
  if (env.AURA_CHROMIUM) return { executablePath: env.AURA_CHROMIUM };
  if (exists('/usr/bin/chromium')) return { executablePath: '/usr/bin/chromium' };
  return { channel: 'chromium' };
}
