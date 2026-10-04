import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, OPTIONS } from "@/app/api/health/route";
import { API_ERROR_MESSAGES_PL } from "@/lib/contract/types";
import { fakeSupabase } from "../helpers/fake-supabase";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

describe("GET /api/health", () => {
  beforeEach(() => {
    fakeSupabase.reset();
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("answers 200 {status: ok} with CORS and no-store headers when storage answers", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(fakeSupabase.calls[0]).toMatchObject({ kind: "from", name: "reports" });
  });

  it("answers 503 storage_unavailable without leaking the storage error", async () => {
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    const res = await GET();
    expect(res.status).toBe(503);
    const text = await res.text();
    const body = JSON.parse(text) as { error: { code: string; message: string } };
    expect(body.error.code).toBe("storage_unavailable");
    expect(body.error.message).toBe(API_ERROR_MESSAGES_PL.storage_unavailable);
    expect(text).not.toContain("08006");
    expect(text).not.toContain("connection failure");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("answers 503 when the storage call throws", async () => {
    fakeSupabase.throwNext(new TypeError("fetch failed"));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("storage_unavailable");
  });

  it("answers 503 without querying when the service key is missing", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const before = fakeSupabase.callCount;
    const res = await GET();
    expect(res.status).toBe(503);
    expect(fakeSupabase.callCount).toBe(before);
  });

  it("answers 503 without querying when the URL is missing", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    const res = await GET();
    expect(res.status).toBe(503);
    expect(fakeSupabase.callCount).toBe(0);
  });
});

describe("OPTIONS /api/health", () => {
  it("answers 204 with an empty body and the CORS headers", async () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(res.headers.get("access-control-allow-headers")).toContain("Authorization");
    expect(res.headers.get("access-control-allow-methods")).toBe("GET, POST, OPTIONS");
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(res.headers.get("access-control-allow-credentials")).toBeNull();
  });
});
