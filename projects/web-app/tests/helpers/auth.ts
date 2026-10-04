// Test helpers for authenticated route calls. Tokens are real (signed with the test-only
// DEMO_AUTH_SECRET from vitest.config.mts) and only ever issued for fictional demo accounts.

import { findDemoAccountByEmail } from "@/lib/contract/demo-accounts";
import type { LoginScope } from "@/lib/contract/types";
import { issueToken } from "@/lib/server/auth";

export function tokenFor(email: string, scope: LoginScope = "panel", nowMs?: number): string {
  const account = findDemoAccountByEmail(email);
  if (!account) {
    throw new Error(`tokenFor: ${email} is not a demo account`);
  }
  return issueToken(account, scope, nowMs).token;
}

export function authHeaders(email: string, scope?: LoginScope): Record<string, string> {
  return { authorization: `Bearer ${tokenFor(email, scope)}` };
}

export interface ApiRequestOptions {
  // Objects are sent as JSON; strings are sent verbatim (for malformed or oversized bodies).
  body?: unknown;
  headers?: Record<string, string>;
}

export function apiRequest(method: string, path: string, options: ApiRequestOptions = {}): Request {
  const headers: Record<string, string> = {};
  let body: string | undefined;
  if (options.body !== undefined) {
    headers["content-type"] = "application/json";
    body = typeof options.body === "string" ? options.body : JSON.stringify(options.body);
  }
  Object.assign(headers, options.headers ?? {});
  return new Request(`http://localhost${path}`, { method, headers, body });
}
