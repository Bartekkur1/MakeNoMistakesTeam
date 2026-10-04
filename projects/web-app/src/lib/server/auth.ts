// Demo bearer tokens (D-14). A token is base64url(JSON payload) + "." + base64url(HMAC-SHA256)
// signed with DEMO_AUTH_SECRET (server env only, at least 32 characters). Tokens live 12 h,
// travel only in the Authorization header and are never logged. A missing or weak secret
// throws AuthNotConfiguredError, which routes map to 500 internal_error (fail closed).

import { createHmac, timingSafeEqual } from "node:crypto";
import {
  CHILD_FIELDS,
  LIMITS,
  LOGIN_SCOPES,
  type AccountInfo,
  type AccountRole,
  type ChildInfo,
  type LoginScope,
  type SessionResponse,
} from "@/lib/contract/types";
import { demoChildrenForAccount, findDemoAccountById } from "@/lib/contract/demo-accounts";
import { AuthNotConfiguredError } from "./errors";
import { apiError } from "./http";

const TOKEN_VERSION = 1;
const MIN_SECRET_CHARS = 32;

export interface Session {
  account: AccountInfo;
  scope: LoginScope;
  expiresAt: string;
}

export function getAuthSecret(): string {
  const secret = process.env.DEMO_AUTH_SECRET;
  if (typeof secret !== "string" || secret.length < MIN_SECRET_CHARS) {
    throw new AuthNotConfiguredError();
  }
  return secret;
}

function sign(payloadPart: string, secret: string): string {
  return createHmac("sha256", secret).update(payloadPart).digest("base64url");
}

function scopeAllowed(role: AccountRole, scope: LoginScope): boolean {
  return scope === "panel" || role === "parent";
}

export function issueToken(
  account: AccountInfo,
  scope: LoginScope,
  nowMs: number = Date.now(),
): { token: string; expiresAt: string } {
  const secret = getAuthSecret();
  const exp = Math.floor(nowMs / 1000) + LIMITS.tokenTtlSeconds;
  const payload = { v: TOKEN_VERSION, sub: account.id, scope, exp };
  const payloadPart = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const token = `${payloadPart}.${sign(payloadPart, secret)}`;
  return { token, expiresAt: new Date(exp * 1000).toISOString() };
}

function parsePayload(payloadPart: string): { sub: string; scope: LoginScope; exp: number } | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const record = parsed as Record<string, unknown>;
  if (record.v !== TOKEN_VERSION) return null;
  if (typeof record.sub !== "string") return null;
  if (typeof record.exp !== "number" || !Number.isInteger(record.exp)) return null;
  const scope = record.scope;
  if (typeof scope !== "string" || !(LOGIN_SCOPES as readonly string[]).includes(scope)) return null;
  return { sub: record.sub, scope: scope as LoginScope, exp: record.exp };
}

export function verifyToken(token: string, nowMs: number = Date.now()): Session | null {
  const secret = getAuthSecret();
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadPart, signaturePart] = parts;
  if (payloadPart === "" || signaturePart === "") return null;

  // Compare the signature text, not decoded bytes: base64url decoding ignores trailing
  // padding bits, so a byte comparison would accept some altered last characters.
  const expected = Buffer.from(sign(payloadPart, secret), "utf8");
  const given = Buffer.from(signaturePart, "utf8");
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const payload = parsePayload(payloadPart);
  if (!payload) return null;
  if (payload.exp <= Math.floor(nowMs / 1000)) return null;
  const account = findDemoAccountById(payload.sub);
  if (!account) return null;
  if (!scopeAllowed(account.role, payload.scope)) return null;

  return { account, scope: payload.scope, expiresAt: new Date(payload.exp * 1000).toISOString() };
}

export function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header === null) return null;
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match ? match[1] : null;
}

export interface SessionRules {
  scopes?: readonly LoginScope[];
  roles?: readonly AccountRole[];
}

export type SessionResult = { ok: true; session: Session } | { ok: false; response: Response };

export function requireSession(request: Request, rules: SessionRules = {}): SessionResult {
  const token = readBearer(request);
  if (!token) return { ok: false, response: apiError("unauthorized") };
  const session = verifyToken(token);
  if (!session) return { ok: false, response: apiError("unauthorized") };
  if (rules.scopes && !rules.scopes.includes(session.scope)) {
    return { ok: false, response: apiError("forbidden") };
  }
  if (rules.roles && !rules.roles.includes(session.account.role)) {
    return { ok: false, response: apiError("forbidden") };
  }
  return { ok: true, session };
}

function childInfo(child: ChildInfo): ChildInfo {
  const out: Record<string, string> = {};
  for (const field of CHILD_FIELDS) out[field] = child[field];
  return out as unknown as ChildInfo;
}

export function sessionInfo(session: Session): SessionResponse {
  return {
    expires_at: session.expiresAt,
    scope: session.scope,
    account: {
      id: session.account.id,
      email: session.account.email,
      role: session.account.role,
      display_name: session.account.display_name,
    },
    children: demoChildrenForAccount(session.account).map(childInfo),
  };
}
