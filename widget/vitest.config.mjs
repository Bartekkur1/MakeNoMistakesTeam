import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'happy-dom', include: ['tests/unit/**/*.test.js'], css: true,
    environmentOptions: { happyDOM: { url: 'http://127.0.0.1:4173/chat-like.html' } } },
  server: { fs: { allow: ['..'] } },
});
