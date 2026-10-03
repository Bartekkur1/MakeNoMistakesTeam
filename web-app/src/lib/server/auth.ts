// RED skeleton: not implemented yet.
import type { AccountInfo, AccountRole, ChildInfo, LoginScope } from "@/lib/contract/types";
import { apiError } from "./http";

export interface Session {
  account: AccountInfo;
  scope: LoginScope;
  expiresAt: string;
}

export function getAuthSecret(): string {
  return "";
}

export function issueToken(account: AccountInfo, scope: LoginScope, nowMs: number = Date.now()): { token: string; expiresAt: string } {
  void account;
  void scope;
  void nowMs;
  return { token: "", expiresAt: "" };
}

export function verifyToken(token: string, nowMs: number = Date.now()): Session | null {
  void token;
  void nowMs;
  return null;
}

export function readBearer(request: Request): string | null {
  void request;
  return null;
}

export function requireSession(
  request: Request,
  rules: { scopes?: readonly LoginScope[]; roles?: readonly AccountRole[] } = {},
): { ok: true; session: Session } | { ok: false; response: Response } {
  void request;
  void rules;
  return { ok: false, response: apiError("internal_error") };
}

export function sessionInfo(session: Session): { expires_at: string; scope: LoginScope; account: AccountInfo; children: ChildInfo[] } {
  return { expires_at: "", scope: session.scope, account: session.account, children: [] };
}
