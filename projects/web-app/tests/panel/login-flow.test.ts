// The way into the panel, end to end (PAN-04 read through D-01/D-02, D-05..D-08): the panel's own
// API client logs in through the real login route on the fake Supabase, the session it stores
// round-trips, the Bearer token goes only into the Authorization header, and the header shows the
// account without any demo marking.

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiCall, isUnauthorized, loginRequest } from "@/app/_panel/api";
import { capitalize, displayName } from "@/app/_panel/format";
import { PanelHeader } from "@/app/_panel/PanelShell";
import { decodeSession, sessionFromLogin } from "@/app/_panel/session";
import { DEMO_ACCOUNTS } from "@/lib/contract/demo-accounts";
import type { LoginResponse, SessionResponse } from "@/lib/contract/types";
import { seedFakeWithDataset } from "../helpers/dataset";
import { fetchLog, installPanelFetch } from "../helpers/panel-fetch";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const P1 = "rodzic.ola@bezpiecznaaura.example";
const P1_CHILD_ID = "00000000-0000-4000-8000-0000000c0001";

async function loginAs(email: string): Promise<LoginResponse> {
  const result = await loginRequest(email, "0000");
  if (!result.ok) throw new Error(`login failed for ${email}`);
  return result.value;
}

beforeEach(() => {
  seedFakeWithDataset();
  installPanelFetch();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("panel login flow", () => {
  it("logs a parent in through the real login route with the panel scope", async () => {
    const result = await loginRequest(P1, "0000");

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.scope).toBe("panel");
    expect(result.value.account.role).toBe("parent");
    expect(result.value.children.map((child) => child.id)).toEqual([P1_CHILD_ID]);
  });

  it("sends POST /api/auth/login with a JSON body of email, code and scope panel", async () => {
    await loginRequest(P1, "0000");

    expect(fetchLog).toHaveLength(1);
    const [request] = fetchLog;
    expect(new URL(request.url).pathname).toBe("/api/auth/login");
    expect(request.method).toBe("POST");
    expect(request.headers["content-type"]).toBe("application/json");
    expect(JSON.parse(request.body ?? "null")).toEqual({ email: P1, code: "0000", scope: "panel" });
  });

  it("answers a wrong code and an unknown e-mail with the same failure, which is not a session expiry", async () => {
    const wrongCode = await loginRequest(P1, "1111");
    const unknownEmail = await loginRequest("nieznany@bezpiecznaaura.example", "0000");
    const expected = {
      ok: false,
      kind: "http",
      status: 401,
      code: "invalid_credentials",
      message: "Nieprawidłowy e-mail lub kod.",
      details: [],
    };

    expect(wrongCode).toEqual(expected);
    expect(unknownEmail).toEqual(wrongCode);
    expect(isUnauthorized(wrongCode)).toBe(false);
  });

  it("sends the token only as a Bearer header to GET /api/auth/me", async () => {
    const { token } = await loginAs(P1);
    fetchLog.length = 0;

    const result = await apiCall<SessionResponse>("/api/auth/me", { method: "GET", token });

    expect(result.ok).toBe(true);
    expect(fetchLog).toHaveLength(1);
    const [request] = fetchLog;
    const url = new URL(request.url);
    expect(url.pathname).toBe("/api/auth/me");
    expect(request.headers.authorization).toBe(`Bearer ${token}`);
    expect(`${url.pathname}${url.search}`).not.toContain(token);
  });

  it("maps a rejected token to unauthorized, which counts as a session expiry", async () => {
    const result = await apiCall<SessionResponse>("/api/auth/me", { method: "GET", token: "garbage" });

    expect(result.ok).toBe(false);
    if (result.ok || result.kind !== "http") throw new Error("expected an http failure");
    expect(result.code).toBe("unauthorized");
    expect(isUnauthorized(result)).toBe(true);
  });

  it("round-trips the stored session through decodeSession", async () => {
    const login = await loginAs(P1);
    const session = sessionFromLogin(login);

    expect(decodeSession(JSON.stringify(session))).toEqual(session);
  });

  it("renders the header with the account name and role, logout and no demo marking", async () => {
    const login = await loginAs(P1);
    expect(login.account).toEqual(DEMO_ACCOUNTS[0]);

    const html = renderToStaticMarkup(createElement(PanelHeader, { account: login.account, onLogout: () => {} }));

    expect(html).toContain("Mama Oli");
    expect(html).toContain("Rodzic");
    expect(html).toContain("Wyloguj się");
    expect(html).toContain("truncate");
    expect(html).toContain('href="/panel"');
    expect(html).not.toContain("(demo)");
    expect(html.toLowerCase()).not.toContain("demo");
    expect(html).not.toContain("0000");
  });

  it("strips the demo and smoke suffixes from display names", () => {
    expect(displayName("Mama Oli (demo)")).toBe("Mama Oli");
    expect(displayName("Rodzic testowy (smoke)")).toBe("Rodzic testowy");
    expect(displayName("Ola")).toBe("Ola");
    expect(capitalize("rodzic")).toBe("Rodzic");
  });
});
