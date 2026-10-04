import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { findDemoAccountByEmail } from "@/lib/contract/demo-accounts";
import { LIMITS } from "@/lib/contract/types";
import { getAuthSecret, issueToken, readBearer, requireSession, verifyToken } from "@/lib/server/auth";
import { AuthNotConfiguredError } from "@/lib/server/errors";
import { isUuid } from "@/lib/server/validate";
import { apiRequest } from "../helpers/auth";

const NOW = Date.parse("2026-10-03T12:00:00.000Z");

function account(email: string) {
  const found = findDemoAccountByEmail(email);
  if (!found) throw new Error(`missing demo account ${email}`);
  return found;
}

const P1 = account("rodzic.ola@bezpiecznaaura.example");
const T1 = account("nauczyciel.5a@bezpiecznaaura.example");

function base64url(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}

// Signs an arbitrary payload with the configured secret, to forge structurally odd tokens.
function signPayload(payload: unknown): string {
  const part = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", getAuthSecret()).update(part).digest("base64url");
  return `${part}.${signature}`;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("issueToken / verifyToken", () => {
  it("round-trips a parent panel session", () => {
    const { token, expiresAt } = issueToken(P1, "panel", NOW);
    expect(expiresAt).toBe("2026-10-04T00:00:00.000Z");
    const session = verifyToken(token, NOW + 1000);
    expect(session).toEqual({ account: P1, scope: "panel", expiresAt });
  });

  it("round-trips a parent extension session", () => {
    const { token } = issueToken(P1, "extension", NOW);
    expect(verifyToken(token, NOW)?.scope).toBe("extension");
  });

  it("produces two base64url segments joined by a dot", () => {
    const { token } = issueToken(T1, "panel", NOW);
    expect(token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
    expect(token.split(".")).toHaveLength(2);
  });

  it("puts v, sub, scope and exp (+12 h, in seconds) into the payload", () => {
    const { token } = issueToken(T1, "panel", NOW + 999);
    const payload = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString("utf8")) as unknown;
    expect(payload).toEqual({
      v: 1,
      sub: T1.id,
      scope: "panel",
      exp: Math.floor(NOW / 1000) + LIMITS.tokenTtlSeconds,
    });
  });

  it("rejects a token verified with a different secret", () => {
    const { token } = issueToken(P1, "panel", NOW);
    vi.stubEnv("DEMO_AUTH_SECRET", "another-test-only-secret-0123456789abcdef");
    expect(verifyToken(token, NOW)).toBeNull();
  });

  it("rejects a token exactly at its expiry second and accepts it one millisecond before", () => {
    const { token } = issueToken(P1, "panel", NOW);
    const expMs = (Math.floor(NOW / 1000) + LIMITS.tokenTtlSeconds) * 1000;
    expect(verifyToken(token, expMs - 1)).not.toBeNull();
    expect(verifyToken(token, expMs)).toBeNull();
  });

  it("rejects malformed tokens", () => {
    const { token } = issueToken(P1, "panel", NOW);
    expect(verifyToken("", NOW)).toBeNull();
    expect(verifyToken("abc", NOW)).toBeNull();
    expect(verifyToken(`${token}.extra`, NOW)).toBeNull();
    expect(verifyToken(`${token.split(".")[0]}.`, NOW)).toBeNull();
    expect(verifyToken(`${token}x`, NOW)).toBeNull();
  });

  it("rejects a signed payload with the wrong version, a bad scope or a missing exp", () => {
    const exp = Math.floor(NOW / 1000) + 60;
    expect(verifyToken(signPayload({ v: 2, sub: P1.id, scope: "panel", exp }), NOW)).toBeNull();
    expect(verifyToken(signPayload({ v: 1, sub: P1.id, scope: "admin", exp }), NOW)).toBeNull();
    expect(verifyToken(signPayload({ v: 1, sub: P1.id, scope: "panel" }), NOW)).toBeNull();
    expect(verifyToken(signPayload([1, 2, 3]), NOW)).toBeNull();
    expect(verifyToken(signPayload({ v: 1, sub: P1.id, scope: "panel", exp }), NOW)).not.toBeNull();
  });

  it("rejects a signed teacher payload with the extension scope", () => {
    const exp = Math.floor(NOW / 1000) + 60;
    expect(verifyToken(signPayload({ v: 1, sub: T1.id, scope: "extension", exp }), NOW)).toBeNull();
  });
});

describe("getAuthSecret", () => {
  it("throws AuthNotConfiguredError when the secret is missing or shorter than 32 characters", () => {
    vi.stubEnv("DEMO_AUTH_SECRET", "");
    expect(() => getAuthSecret()).toThrow(AuthNotConfiguredError);
    vi.stubEnv("DEMO_AUTH_SECRET", "x".repeat(31));
    expect(() => getAuthSecret()).toThrow(AuthNotConfiguredError);
    vi.stubEnv("DEMO_AUTH_SECRET", "x".repeat(32));
    expect(getAuthSecret()).toBe("x".repeat(32));
  });

  it("never issues a token without a usable secret", () => {
    vi.stubEnv("DEMO_AUTH_SECRET", "short");
    expect(() => issueToken(P1, "panel", NOW)).toThrow(AuthNotConfiguredError);
  });
});

describe("readBearer", () => {
  it("extracts the token only from a well-formed Bearer header", () => {
    const req = (value?: string) =>
      apiRequest("GET", "/api/auth/me", { headers: value === undefined ? {} : { authorization: value } });
    expect(readBearer(req("Bearer abc.def"))).toBe("abc.def");
    expect(readBearer(req("bearer abc.def"))).toBe("abc.def");
    expect(readBearer(req())).toBeNull();
    expect(readBearer(req("Bearer"))).toBeNull();
    expect(readBearer(req("Bearer a b"))).toBeNull();
    expect(readBearer(req("Basic abc"))).toBeNull();
  });
});

describe("requireSession", () => {
  function withToken(token: string): Request {
    return apiRequest("GET", "/api/auth/me", { headers: { authorization: `Bearer ${token}` } });
  }

  it("accepts a valid token without rules", () => {
    const result = requireSession(withToken(issueToken(P1, "panel").token));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.session.account).toEqual(P1);
  });

  it("answers 401 unauthorized for a missing token", () => {
    const result = requireSession(apiRequest("GET", "/api/auth/me"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("answers 403 forbidden when the scope or role is not allowed", () => {
    const extension = requireSession(withToken(issueToken(P1, "extension").token), { scopes: ["panel"] });
    expect(extension.ok).toBe(false);
    if (!extension.ok) expect(extension.response.status).toBe(403);

    const teacher = requireSession(withToken(issueToken(T1, "panel").token), { roles: ["parent"] });
    expect(teacher.ok).toBe(false);
    if (!teacher.ok) expect(teacher.response.status).toBe(403);

    const parent = requireSession(withToken(issueToken(P1, "panel").token), {
      scopes: ["panel"],
      roles: ["parent"],
    });
    expect(parent.ok).toBe(true);
  });
});

describe("isUuid", () => {
  it("accepts 8-4-4-4-12 hex in any letter case and rejects anything else", () => {
    expect(isUuid("00000000-0000-4000-8000-0000000a0001")).toBe(true);
    expect(isUuid("ABCDEF01-2345-4789-ABCD-EF0123456789")).toBe(true);
    expect(isUuid("00000000-0000-4000-8000-0000000a000")).toBe(false);
    expect(isUuid("not-a-uuid")).toBe(false);
    expect(isUuid(42)).toBe(false);
  });
});
