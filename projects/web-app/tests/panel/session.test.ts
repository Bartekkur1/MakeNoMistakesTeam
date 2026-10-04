// The panel session and API client rules (D-07, UI-SPEC "Errors"): what counts as a stored
// session, when it expires, how every kind of failed response maps to a contract error code
// and its Polish message, and where the session-end notice for /login is kept.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { REQUEST_TIMEOUT_MS, apiCall, errorMessage, loginRequest, type ApiFailure } from "@/app/_panel/api";
import { ERRORS } from "@/app/_panel/content";
import {
  NOTICE_STORAGE_KEY,
  SESSION_STORAGE_KEY,
  clearNotice,
  clearSession,
  decodeSession,
  expireSession,
  hasStoredSession,
  isSessionExpired,
  readNotice,
  saveSession,
  sessionFromLogin,
  type PanelSession,
} from "@/app/_panel/session";
import { API_ERROR_MESSAGES_PL, type LoginResponse } from "@/lib/contract/types";
import { seedFakeWithDataset } from "../helpers/dataset";
import { failFetch, installPanelFetch, respondWith } from "../helpers/panel-fetch";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const P1 = "rodzic.ola@bezpiecznaaura.example";

async function realLogin(): Promise<LoginResponse> {
  seedFakeWithDataset();
  installPanelFetch();
  const result = await loginRequest(P1, "0000");
  if (!result.ok) throw new Error("login failed");
  return result.value;
}

function sessionJson(overrides: Record<string, unknown>, base: PanelSession): string {
  return JSON.stringify({ ...base, ...overrides });
}

async function failureOf(promise: Promise<unknown>): Promise<ApiFailure> {
  const result = (await promise) as { ok: boolean };
  if (result.ok) throw new Error("expected a failure");
  return result as ApiFailure;
}

type HttpFailure = Extract<ApiFailure, { kind: "http" }>;

// A minimal browser window: two Map-backed storages and an event target.
function installFakeWindow(): { local: Map<string, string>; session: Map<string, string>; events: string[] } {
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  const events: string[] = [];
  const storage = (map: Map<string, string>) => ({
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => void map.set(key, value),
    removeItem: (key: string) => void map.delete(key),
  });
  vi.stubGlobal("window", {
    localStorage: storage(local),
    sessionStorage: storage(session),
    dispatchEvent: (event: Event) => {
      events.push(event.type);
      return true;
    },
    addEventListener: () => {},
    removeEventListener: () => {},
  });
  return { local, session, events };
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("decodeSession", () => {
  it("rejects anything that is not a stored panel session", async () => {
    const base = sessionFromLogin(await realLogin());

    expect(decodeSession(null)).toBeNull();
    expect(decodeSession("")).toBeNull();
    expect(decodeSession("{")).toBeNull();
    const { token: _token, ...withoutToken } = base;
    void _token;
    expect(decodeSession(JSON.stringify(withoutToken))).toBeNull();
    expect(decodeSession(sessionJson({ token: "" }, base))).toBeNull();
    expect(decodeSession(sessionJson({ account: { ...base.account, role: "child" } }, base))).toBeNull();
    expect(decodeSession(sessionJson({ children: "C1" }, base))).toBeNull();
  });

  it("rejects a stored session whose children are not all child records (WR-08)", async () => {
    const base = sessionFromLogin(await realLogin());
    const child = base.children[0];

    expect(child).toBeDefined();
    expect(decodeSession(sessionJson({ children: [{ ...child, display_name: 7 }] }, base))).toBeNull();
    expect(decodeSession(sessionJson({ children: [{ id: child.id }] }, base))).toBeNull();
    expect(decodeSession(sessionJson({ children: [child, null] }, base))).toBeNull();
    expect(decodeSession(sessionJson({ children: ["C1"] }, base))).toBeNull();
    expect(decodeSession(sessionJson({ children: [] }, base))).toEqual({ ...base, children: [] });
  });

  it("accepts the stored form of a real login response", async () => {
    const session = sessionFromLogin(await realLogin());

    expect(decodeSession(JSON.stringify(session))).toEqual(session);
  });
});

describe("isSessionExpired", () => {
  it("expires exactly at expires_at, treats an unreadable date as expired, and is live 1 ms before", async () => {
    const session = sessionFromLogin(await realLogin());
    const expiresMs = Date.parse(session.expires_at);

    expect(isSessionExpired(session, expiresMs)).toBe(true);
    expect(isSessionExpired({ ...session, expires_at: "nie-data" }, 0)).toBe(true);
    expect(isSessionExpired(session, expiresMs - 1)).toBe(false);
  });
});

describe("sessionFromLogin", () => {
  it("keeps only token, expires_at, account and children", async () => {
    const login = await realLogin();

    expect(sessionFromLogin(login)).toEqual({
      token: login.token,
      expires_at: login.expires_at,
      account: login.account,
      children: login.children,
    });
  });
});

describe("apiCall error mapping", () => {
  it("maps a 503 storage_unavailable envelope to its contract message", async () => {
    respondWith(503, { error: { code: "storage_unavailable", message: "Baza niedostępna." } });

    const failure = await failureOf(apiCall("/api/reports", { method: "GET", token: "t" }));

    expect(failure).toEqual({
      ok: false,
      kind: "http",
      status: 503,
      code: "storage_unavailable",
      message: API_ERROR_MESSAGES_PL.storage_unavailable,
      details: [],
    });
  });

  it("maps a 500 HTML page to internal_error", async () => {
    respondWith(500, "<html>", "text/html");

    const failure = await failureOf(apiCall("/api/reports", { method: "GET", token: "t" }));

    expect(failure).toMatchObject({ kind: "http", status: 500, code: "internal_error" });
  });

  it("maps a 200 without a JSON body to internal_error", async () => {
    respondWith(200, "OK", "text/plain");

    const failure = await failureOf(apiCall("/api/reports", { method: "GET", token: "t" }));

    expect(failure).toMatchObject({ kind: "http", status: 200, code: "internal_error" });
  });

  it("falls back to the status when the envelope code is unknown", async () => {
    respondWith(409, { error: { code: "teapot", message: "Czajnik." } });

    const failure = await failureOf(apiCall("/api/reports/x/transitions", { method: "POST", token: "t", body: {} }));

    expect(failure).toMatchObject({ kind: "http", status: 409, code: "invalid_transition" });
  });

  it("never shows the server's own message", async () => {
    respondWith(403, { error: { code: "forbidden", message: "X" } });

    const failure = await failureOf(apiCall("/api/reports/x", { method: "GET", token: "t" }));

    expect(failure).toMatchObject({ kind: "http", code: "forbidden", message: API_ERROR_MESSAGES_PL.forbidden });
    expect(failure.kind === "http" && failure.message).not.toBe("X");
  });

  it("keeps every validation detail", async () => {
    const details = [
      { field: "action", message: "Nieznana akcja." },
      { field: "comment", message: "Komentarz musi być tekstem." },
    ];
    respondWith(400, { error: { code: "validation_error", message: "X", details } });

    const failure = await failureOf(apiCall("/api/reports/x/transitions", { method: "POST", token: "t", body: {} }));

    expect(failure).toMatchObject({ kind: "http", code: "validation_error", details });
  });

  it("gives every request a timeout signal and maps the timeout to a network failure (WR-07)", async () => {
    const signals: (AbortSignal | null | undefined)[] = [];
    vi.stubGlobal("fetch", async (_input: unknown, init?: RequestInit): Promise<Response> => {
      signals.push(init?.signal);
      throw new DOMException("The operation timed out.", "TimeoutError");
    });

    const failure = await failureOf(apiCall("/api/reports", { method: "GET", token: "t" }));

    expect(signals).toHaveLength(1);
    expect(signals[0]).toBeInstanceOf(AbortSignal);
    expect(REQUEST_TIMEOUT_MS).toBe(20_000);
    expect(failure).toEqual({ ok: false, kind: "network" });
  });

  it("reports a dropped connection as a network failure", async () => {
    failFetch();

    const failure = await failureOf(apiCall("/api/reports", { method: "GET", token: "t" }));

    expect(failure).toEqual({ ok: false, kind: "network" });
  });
});

describe("errorMessage", () => {
  const http = (code: HttpFailure["code"], details: HttpFailure["details"] = []): HttpFailure => ({
    ok: false,
    kind: "http",
    status: 500,
    code,
    message: API_ERROR_MESSAGES_PL[code],
    details,
  });

  it("uses the network text, or the one the caller passes", () => {
    expect(errorMessage({ ok: false, kind: "network" })).toBe(ERRORS.networkLoad);
    expect(errorMessage({ ok: false, kind: "network" }, "Inny tekst.")).toBe("Inny tekst.");
  });

  it("adds the retry hint to internal_error", () => {
    expect(errorMessage(http("internal_error"))).toBe(`${API_ERROR_MESSAGES_PL.internal_error} Spróbuj ponownie.`);
  });

  it("shows the first validation detail", () => {
    const details = [
      { field: "comment", message: "Pierwszy." },
      { field: "action", message: "Drugi." },
    ];

    expect(errorMessage(http("validation_error", details))).toBe("Pierwszy.");
  });

  it("shows storage_unavailable verbatim", () => {
    expect(errorMessage(http("storage_unavailable"))).toBe(API_ERROR_MESSAGES_PL.storage_unavailable);
  });
});

describe("session storage", () => {
  it("saves and clears the session and keeps the end notice for one /login screen", async () => {
    const login = await realLogin();
    const { local, session, events } = installFakeWindow();

    saveSession(login);
    expect(hasStoredSession()).toBe(true);
    expect(decodeSession(local.get(SESSION_STORAGE_KEY) ?? null)).toEqual(sessionFromLogin(login));

    clearSession("expired");
    expect(hasStoredSession()).toBe(false);
    expect(session.get(NOTICE_STORAGE_KEY)).toBe("expired");
    expect(readNotice()).toBe("expired");
    expect(readNotice()).toBe("expired");
    clearNotice();
    expect(readNotice()).toBeNull();

    clearSession(null);
    expect(readNotice()).toBeNull();
    expect(events).toHaveLength(3);
  });

  it("saveSession reports whether a live session is now readable (WR-05)", async () => {
    const login = await realLogin();
    const { local } = installFakeWindow();

    expect(saveSession(login)).toBe(true);

    // A response the panel cannot use (unknown role) or one that is already expired by this
    // device's clock is not a live session; the unusable entry is not left behind.
    expect(saveSession({ ...login, account: { ...login.account, role: "child" as never } })).toBe(false);
    expect(local.has(SESSION_STORAGE_KEY)).toBe(false);
    expect(saveSession({ ...login, expires_at: "2000-01-01T00:00:00.000Z" })).toBe(false);
    expect(local.has(SESSION_STORAGE_KEY)).toBe(false);
  });

  it("saveSession reports false when the browser blocks storage (WR-05)", async () => {
    const login = await realLogin();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => null,
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
        removeItem: () => {},
      },
      dispatchEvent: () => true,
    });

    expect(saveSession(login)).toBe(false);
  });

  it("a 401 for the stored token ends the session with the expired notice", async () => {
    const login = await realLogin();
    const { session } = installFakeWindow();
    saveSession(login);

    expireSession(login.token);

    expect(hasStoredSession()).toBe(false);
    expect(session.get(NOTICE_STORAGE_KEY)).toBe("expired");
  });

  it("a late 401 for an older token keeps the newer session and leaves no notice (WR-03)", async () => {
    const login = await realLogin();
    const { local, session } = installFakeWindow();
    saveSession(login);
    const stored = local.get(SESSION_STORAGE_KEY);

    expireSession("an-older-token");

    expect(local.get(SESSION_STORAGE_KEY)).toBe(stored);
    expect(session.has(NOTICE_STORAGE_KEY)).toBe(false);
  });

  it("treats blocked storage as no session", () => {
    vi.stubGlobal("window", {
      get localStorage(): Storage {
        throw new Error("blocked");
      },
      get sessionStorage(): Storage {
        throw new Error("blocked");
      },
      dispatchEvent: () => true,
    });

    expect(hasStoredSession()).toBe(false);
    expect(readNotice()).toBeNull();
    expect(() => clearSession("logged_out")).not.toThrow();
  });
});
