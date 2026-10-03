// Storage calls must end well below the Heroku router limit, so a stalled database answers as
// the contract's JSON 503 storage_unavailable instead of hanging until the router cuts the
// request (WR-02). These tests run the real supabase-js client over a stubbed global fetch, so
// nothing ever leaves the process (the URL is the reserved .invalid host from vitest.config.mts).
// The client is built through getSupabase(); only the timeout is shortened to keep tests fast.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as health } from "@/app/api/health/route";
import { StorageUnavailableError } from "@/lib/server/errors";
import { createReport, getReport } from "@/lib/server/reports";
import { STORAGE_DB_OPTIONS, STORAGE_TIMEOUT_MS } from "@/lib/server/supabase";

const TEST_TIMEOUT_MS = 20;
const createClientSpy = vi.hoisted(() => vi.fn());

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  createClientSpy.mockImplementation(
    (url: string, key: string, options?: { db?: Record<string, unknown> } & Record<string, unknown>) =>
      actual.createClient(url, key, { ...options, db: { ...options?.db, timeout: TEST_TIMEOUT_MS } }),
  );
  return { ...actual, createClient: createClientSpy };
});

type FetchMock = ReturnType<typeof vi.fn>;

// A fetch that never answers on its own and only settles when its signal aborts.
function hangingFetch(): FetchMock {
  return vi.fn((_input: unknown, init?: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;
      if (!signal) return;
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }
      signal.addEventListener("abort", () => reject(signal.reason), { once: true });
    });
  });
}

function signalOf(mock: FetchMock, call = 0): AbortSignal | undefined {
  const init = mock.mock.calls[call]?.[1] as RequestInit | undefined;
  return init?.signal ?? undefined;
}

async function expectStorage503(res: Response): Promise<void> {
  expect(res.status).toBe(503);
  expect(res.headers.get("access-control-allow-origin")).toBe("*");
  expect(((await res.json()) as { error: { code: string } }).error.code).toBe("storage_unavailable");
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("storage timeout budget", () => {
  it("keeps two sequential storage calls below the 30 s Heroku router limit", () => {
    expect(STORAGE_TIMEOUT_MS).toBeGreaterThan(0);
    expect(2 * STORAGE_TIMEOUT_MS).toBeLessThan(30_000);
    expect(STORAGE_DB_OPTIONS).toEqual({ timeout: STORAGE_TIMEOUT_MS, retry: false });
  });
});

describe("getSupabase with a stalled or failing database", () => {
  it("answers GET /api/health with 503 when storage never answers", async () => {
    const stub = hangingFetch();
    vi.stubGlobal("fetch", stub);
    const started = Date.now();

    await expectStorage503(await health());
    expect(Date.now() - started).toBeLessThan(2000);

    // The server client asks supabase-js for the timeout and no automatic retries.
    const options = createClientSpy.mock.calls[0]?.[2] as { db?: unknown } | undefined;
    expect(options?.db).toEqual({ timeout: STORAGE_TIMEOUT_MS, retry: false });
    expect(stub).toHaveBeenCalledTimes(1);
    expect(signalOf(stub)?.aborted).toBe(true);
  });

  it("does not retry a GET after a network error", async () => {
    const stub = vi.fn(async () => {
      throw new TypeError("fetch failed");
    });
    vi.stubGlobal("fetch", stub);
    const started = Date.now();

    await expectStorage503(await health());
    expect(stub).toHaveBeenCalledTimes(1);
    expect(Date.now() - started).toBeLessThan(900);
  });

  it("does not retry a GET after a 503 answer with Retry-After", async () => {
    const stub = vi.fn(
      async () =>
        new Response(JSON.stringify({ message: "schema cache loading" }), {
          status: 503,
          headers: { "content-type": "application/json", "retry-after": "20" },
        }),
    );
    vi.stubGlobal("fetch", stub);

    await expectStorage503(await health());
    expect(stub).toHaveBeenCalledTimes(1);
  });

  it("turns a stalled table read into StorageUnavailableError", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    await expect(getReport("00000000-0000-4000-8000-0000000d0001")).rejects.toBeInstanceOf(StorageUnavailableError);
  });

  it("turns a stalled RPC write into StorageUnavailableError", async () => {
    vi.stubGlobal("fetch", hangingFetch());
    await expect(
      createReport({
        attack_type: "other",
        taken_actions: [],
        source: "other",
        content: "Fikcyjna wiadomość testowa (demo).",
        parent_id: "00000000-0000-4000-8000-0000000a0001",
        child_id: "00000000-0000-4000-8000-0000000c0001",
      }),
    ).rejects.toBeInstanceOf(StorageUnavailableError);
  });
});
