import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Tests never touch a real Supabase project (D-06): the URL uses the reserved .invalid TLD,
// which never resolves, and the secrets are test-only dummies. No env file is loaded.
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      SUPABASE_URL: "http://supabase.invalid",
      SUPABASE_SERVICE_ROLE_KEY: "test-only-not-a-key",
      DEMO_AUTH_SECRET: "test-only-demo-auth-secret-0123456789abcdef",
    },
  },
});
