import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPTIONS as loginOptions, POST as login } from "@/app/api/auth/login/route";
import { GET as me, OPTIONS as meOptions } from "@/app/api/auth/me/route";
import { DEMO_ACCOUNTS, DEMO_CHILDREN, findDemoAccountByEmail } from "@/lib/contract/demo-accounts";
import { API_ERROR_MESSAGES_PL, CHILD_FIELDS } from "@/lib/contract/types";
import { issueToken } from "@/lib/server/auth";
import { apiRequest, authHeaders, tokenFor } from "../helpers/auth";

const P1 = "rodzic.ola@bezpiecznaaura.example";
const T1 = "nauczyciel.5a@bezpiecznaaura.example";
const C1 = DEMO_CHILDREN[0];
const C2 = DEMO_CHILDREN[1];

interface ErrorBody {
  error: { code: string; message: string; details?: Array<{ field: string; message: string }> };
}

function postLogin(body: unknown): Promise<Response> {
  return login(apiRequest("POST", "/api/auth/login", { body }));
}

function getMe(headers: Record<string, string> = {}): Promise<Response> {
  return me(apiRequest("GET", "/api/auth/me", { headers }));
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("POST /api/auth/login", () => {
  it("logs a parent into the panel with code 0000 and returns a 12 h session", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-03T12:00:00.000Z"));

    const res = await postLogin({ email: P1, code: "0000" });
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toBe("no-store");

    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["account", "children", "expires_at", "scope", "token"]);
    expect(body.scope).toBe("panel");
    expect(body.expires_at).toBe("2026-10-04T00:00:00.000Z");
    expect(body.account).toEqual(DEMO_ACCOUNTS[0]);
    expect(body.children).toEqual([C1]);
    expect(body.token).toMatch(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });

  it("accepts the e-mail in any letter case with surrounding spaces", async () => {
    const res = await postLogin({ email: "  RODZIC.OLA@BezpiecznaAura.Example ", code: "0000" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { account: { email: string } };
    expect(body.account.email).toBe(P1);
  });

  it("gives a parent the extension scope on request", async () => {
    const res = await postLogin({ email: P1, code: "0000", scope: "extension" });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { scope: string };
    expect(body.scope).toBe("extension");
  });

  it("refuses the extension scope to a teacher with 403 forbidden", async () => {
    const res = await postLogin({ email: T1, code: "0000", scope: "extension" });
    expect(res.status).toBe(403);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("forbidden");
    expect(body.error.message).toBe(API_ERROR_MESSAGES_PL.forbidden);
  });

  it("answers byte-identical 401 invalid_credentials for a wrong code and an unknown e-mail", async () => {
    const wrongCode = await postLogin({ email: P1, code: "1234" });
    const unknown = await postLogin({ email: "nikt@bezpiecznaaura.example", code: "0000" });
    expect(wrongCode.status).toBe(401);
    expect(unknown.status).toBe(401);
    const wrongText = await wrongCode.text();
    const unknownText = await unknown.text();
    expect((JSON.parse(wrongText) as ErrorBody).error.code).toBe("invalid_credentials");
    expect(wrongText).toBe(unknownText);
  });

  it("answers 400 validation_error with details for a missing e-mail", async () => {
    const res = await postLogin({ code: "0000" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details?.map((d) => d.field)).toEqual(["email"]);
  });

  it("answers 400 validation_error with details for an unknown scope", async () => {
    const res = await postLogin({ email: P1, code: "0000", scope: "admin" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details?.map((d) => d.field)).toEqual(["scope"]);
  });

  it("collects every field error at once", async () => {
    const res = await postLogin({ email: 5, code: "", scope: "admin" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.details?.map((d) => d.field)).toEqual(["email", "code", "scope"]);
  });

  it("answers 400 invalid_json for a malformed body", async () => {
    const res = await postLogin("{");
    expect(res.status).toBe(400);
    expect(((await res.json()) as ErrorBody).error.code).toBe("invalid_json");
  });

  it("answers 400 invalid_json for a JSON array body", async () => {
    const res = await postLogin("[]");
    expect(res.status).toBe(400);
    expect(((await res.json()) as ErrorBody).error.code).toBe("invalid_json");
  });

  it("answers 413 payload_too_large for a 40000-byte body", async () => {
    const filler = "x".repeat(40000 - JSON.stringify({ email: P1, code: "0000", pad: "" }).length);
    const raw = JSON.stringify({ email: P1, code: "0000", pad: filler });
    expect(new TextEncoder().encode(raw).byteLength).toBe(40000);
    const res = await postLogin(raw);
    expect(res.status).toBe(413);
    expect(((await res.json()) as ErrorBody).error.code).toBe("payload_too_large");
  });

  it("fails closed with 500 internal_error when DEMO_AUTH_SECRET is missing", async () => {
    vi.stubEnv("DEMO_AUTH_SECRET", "");
    const res = await postLogin({ email: P1, code: "0000" });
    expect(res.status).toBe(500);
    const text = await res.text();
    expect((JSON.parse(text) as ErrorBody).error.code).toBe("internal_error");
    expect(text).not.toContain("DEMO_AUTH_SECRET");
    expect(text).not.toContain("token");
  });

  it("fails closed with 500 internal_error when DEMO_AUTH_SECRET is shorter than 32 characters", async () => {
    vi.stubEnv("DEMO_AUTH_SECRET", "0123456789");
    const res = await postLogin({ email: P1, code: "0000" });
    expect(res.status).toBe(500);
    const text = await res.text();
    expect((JSON.parse(text) as ErrorBody).error.code).toBe("internal_error");
    expect(text).not.toContain("DEMO_AUTH_SECRET");
  });

  it("answers OPTIONS with 204 and the CORS headers", async () => {
    const res = loginOptions();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-headers")).toContain("Authorization");
    expect(res.headers.get("access-control-allow-methods")).toBe("GET, POST, DELETE, OPTIONS");
  });
});

describe("GET /api/auth/me", () => {
  it("returns the session of a fresh teacher token with the children of the class", async () => {
    const res = await getMe(authHeaders(T1));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(["account", "children", "expires_at", "scope"]);
    expect(body.scope).toBe("panel");
    expect(body.account).toEqual(findDemoAccountByEmail(T1));
    expect(body.children).toEqual([C1, C2]);
    for (const child of body.children as Array<Record<string, unknown>>) {
      expect(Object.keys(child).sort()).toEqual([...CHILD_FIELDS].sort());
    }
  });

  it("returns the extension scope for a parent extension token", async () => {
    const res = await getMe(authHeaders(P1, "extension"));
    expect(res.status).toBe(200);
    expect(((await res.json()) as { scope: string }).scope).toBe("extension");
  });

  async function expectUnauthorized(headers: Record<string, string>): Promise<void> {
    const res = await getMe(headers);
    expect(res.status).toBe(401);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("unauthorized");
    expect(body.error.message).toBe(API_ERROR_MESSAGES_PL.unauthorized);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  }

  it("answers 401 without an Authorization header", async () => {
    await expectUnauthorized({});
  });

  it("answers 401 for a bare Bearer with no token", async () => {
    await expectUnauthorized({ authorization: "Bearer" });
  });

  it("answers 401 for a non-Bearer scheme", async () => {
    await expectUnauthorized({ authorization: `Basic ${tokenFor(T1)}` });
  });

  it("answers 401 when the token's last character is changed", async () => {
    const token = tokenFor(T1);
    const last = token.slice(-1);
    const tampered = token.slice(0, -1) + (last === "A" ? "B" : "A");
    await expectUnauthorized({ authorization: `Bearer ${tampered}` });
  });

  it("answers 401 for a token issued 13 h ago", async () => {
    const token = tokenFor(T1, "panel", Date.now() - 13 * 3600 * 1000);
    await expectUnauthorized({ authorization: `Bearer ${token}` });
  });

  it("answers 401 for a correctly signed token whose account is not a demo account", async () => {
    const { token } = issueToken(
      {
        id: "00000000-0000-4000-8000-0000000fffff",
        email: "obcy@bezpiecznaaura.example",
        role: "parent",
        display_name: "Obcy (demo)",
      },
      "panel",
    );
    await expectUnauthorized({ authorization: `Bearer ${token}` });
  });

  it("answers 401 for a correctly signed teacher token with the extension scope", async () => {
    const teacher = findDemoAccountByEmail(T1);
    if (!teacher) throw new Error("missing demo teacher");
    const { token } = issueToken(teacher, "extension");
    await expectUnauthorized({ authorization: `Bearer ${token}` });
  });

  it("answers 500 internal_error when DEMO_AUTH_SECRET is missing", async () => {
    const headers = authHeaders(T1);
    vi.stubEnv("DEMO_AUTH_SECRET", "");
    const res = await getMe(headers);
    expect(res.status).toBe(500);
    expect(((await res.json()) as ErrorBody).error.code).toBe("internal_error");
  });

  it("answers OPTIONS with 204 and the CORS headers", async () => {
    const res = meOptions();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-headers")).toContain("Authorization");
    expect(res.headers.get("access-control-allow-methods")).toBe("GET, POST, DELETE, OPTIONS");
  });
});
