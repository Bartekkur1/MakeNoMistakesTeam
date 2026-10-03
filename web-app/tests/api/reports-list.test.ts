import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as listReports } from "@/app/api/reports/route";
import { DEMO_ACCOUNTS, DEMO_CHILDREN } from "@/lib/contract/demo-accounts";
import { REPORT_FIELDS } from "@/lib/contract/types";
import { decodeCursor, encodeCursor, paginate } from "@/lib/server/pagination";
import { apiRequest, authHeaders } from "../helpers/auth";
import { loadExample, seedFakeWithDataset } from "../helpers/dataset";
import { fakeSupabase, type Row } from "../helpers/fake-supabase";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const P1 = "rodzic.ola@bezpiecznaaura.example";
const P2 = "rodzic.kuba@bezpiecznaaura.example";
const T1 = "nauczyciel.5a@bezpiecznaaura.example";
const T2 = "nauczyciel.6b@bezpiecznaaura.example";
const P1_ID = DEMO_ACCOUNTS[0].id;
const C1_ID = DEMO_CHILDREN[0].id;
const C2_ID = DEMO_CHILDREN[1].id;

const R = (n: number): string => `00000000-0000-4000-8000-0000000d000${n}`;

interface ListBody {
  reports: Array<Record<string, unknown>>;
  next_cursor: string | null;
}

interface ErrorBody {
  error: { code: string; details?: Array<{ field: string; message: string }> };
}

function list(query: string, headers: Record<string, string>): Promise<Response> {
  return listReports(apiRequest("GET", `/api/reports${query}`, { headers }));
}

async function listBody(query: string, headers: Record<string, string>): Promise<ListBody> {
  const res = await list(query, headers);
  expect(res.status).toBe(200);
  return (await res.json()) as ListBody;
}

function ids(body: ListBody): string[] {
  return body.reports.map((r) => r.id as string);
}

function rpcCalls(): Array<Record<string, unknown>> {
  return fakeSupabase.calls.filter((c) => c.kind === "rpc" && c.name === "list_reports").map((c) => c.args as Record<string, unknown>);
}

// 25 extra reports of child C1, one minute apart, none at the dataset's times.
function manyReportsForP1(): Row[] {
  return Array.from({ length: 25 }, (_, i) => {
    const minute = String(i).padStart(2, "0");
    const stamp = `2026-10-02T10:${minute}:00.000Z`;
    return {
      id: `00000000-0000-4000-8000-00000009${String(i).padStart(4, "0")}`,
      parent_id: P1_ID,
      child_id: C1_ID,
      attack_type: "other",
      taken_actions: [],
      source: "other",
      content: `Fikcyjna wiadomość testowa nr ${i} (demo).`,
      state: "pending_parent",
      created_at: stamp,
      updated_at: stamp,
    };
  });
}

beforeEach(() => {
  seedFakeWithDataset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("GET /api/reports — published examples (D-16)", () => {
  it("gives the parent's first page byte for byte as in get-reports.json", async () => {
    const example = loadExample("get-reports.json");
    const res = await list("?limit=2", authHeaders(P1, "panel"));
    expect(res.status).toBe(example.response.status);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const text = await res.text();
    expect(JSON.parse(text)).toEqual(example.response.body);
    expect(text).toBe(JSON.stringify(example.response.body));
  });

  it("follows next_cursor to the last page with R1 and next_cursor null", async () => {
    const first = await listBody("?limit=2", authHeaders(P1, "panel"));
    expect(ids(first)).toEqual([R(3), R(2)]);
    const cursor = first.next_cursor as string;
    const second = await listBody(`?limit=2&cursor=${encodeURIComponent(cursor)}`, authHeaders(P1, "panel"));
    expect(ids(second)).toEqual([R(1)]);
    expect(second.next_cursor).toBeNull();
  });

  it("gives the class teacher exactly get-reports-teacher.json", async () => {
    const example = loadExample("get-reports-teacher.json");
    const res = await list("", authHeaders(T1, "panel"));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(JSON.parse(text)).toEqual(example.response.body);
    expect(text).toBe(JSON.stringify(example.response.body));
  });
});

describe("GET /api/reports — visibility (D-15)", () => {
  it("shows teacher 6b only the escalated report of class 6b", async () => {
    expect(ids(await listBody("", authHeaders(T2, "panel")))).toEqual([R(5)]);
  });

  it("shows a parent only their own child's reports, newest first", async () => {
    expect(ids(await listBody("", authHeaders(P2, "panel")))).toEqual([R(6), R(4)]);
  });

  it("gives the extension scope the same list as the panel", async () => {
    const panel = await list("?limit=2", authHeaders(P1, "panel"));
    const extension = await list("?limit=2", authHeaders(P1, "extension"));
    expect(extension.status).toBe(200);
    expect(await extension.text()).toBe(await panel.text());
  });

  it("returns list items with exactly the report fields (no history or comments)", async () => {
    const body = await listBody("", authHeaders(P1, "panel"));
    expect(body.reports.length).toBeGreaterThan(0);
    for (const report of body.reports) expect(Object.keys(report)).toEqual([...REPORT_FIELDS]);
  });

  it("answers 401 without a token", async () => {
    const res = await list("", {});
    expect(res.status).toBe(401);
    expect(((await res.json()) as ErrorBody).error.code).toBe("unauthorized");
  });

  it("calls list_reports with the teacher's own-class children and visible states", async () => {
    await listBody("", authHeaders(T1, "panel"));
    expect(rpcCalls()).toEqual([
      {
        p_parent_id: null,
        p_child_ids: [C1_ID, C2_ID],
        p_states: ["with_teacher", "escalated", "closed"],
        p_state: null,
        p_cursor_created_at: null,
        p_cursor_id: null,
        p_limit: 21,
      },
    ]);
  });

  it("calls list_reports with the parent's id only, asking for limit + 1 rows", async () => {
    await listBody("?limit=2&state=closed", authHeaders(P1, "panel"));
    expect(rpcCalls()).toEqual([
      {
        p_parent_id: P1_ID,
        p_child_ids: null,
        p_states: null,
        p_state: "closed",
        p_cursor_created_at: null,
        p_cursor_id: null,
        p_limit: 3,
      },
    ]);
  });

  it("passes the decoded cursor to list_reports", async () => {
    const first = await listBody("?limit=2", authHeaders(P1, "panel"));
    fakeSupabase.calls = [];
    await listBody(`?limit=2&cursor=${first.next_cursor as string}`, authHeaders(P1, "panel"));
    expect(rpcCalls()[0]).toMatchObject({
      p_cursor_created_at: "2026-10-03T08:40:00.000Z",
      p_cursor_id: R(2),
      p_limit: 3,
    });
  });
});

describe("GET /api/reports — filters and paging", () => {
  it("filters by state within the account's visibility", async () => {
    expect(ids(await listBody("?state=closed", authHeaders(P1, "panel")))).toEqual([R(2)]);
  });

  it("answers 200 with an empty list when nothing matches the filter", async () => {
    const body = await listBody("?state=pending_parent", authHeaders(T1, "panel"));
    expect(body).toEqual({ reports: [], next_cursor: null });
  });

  it("pages 20 by default, then the rest, without repeating a report", async () => {
    seedFakeWithDataset(manyReportsForP1());
    const first = await listBody("", authHeaders(P1, "panel"));
    expect(first.reports).toHaveLength(20);
    expect(first.next_cursor).not.toBeNull();
    const second = await listBody(`?cursor=${first.next_cursor as string}`, authHeaders(P1, "panel"));
    expect(second.reports).toHaveLength(8);
    expect(second.next_cursor).toBeNull();
    const all = [...ids(first), ...ids(second)];
    expect(new Set(all).size).toBe(28);
  });

  it("pages 25 reports of one parent as 20 + 5 when only those exist", async () => {
    fakeSupabase.reset({ reports: manyReportsForP1() });
    const first = await listBody("", authHeaders(P1, "panel"));
    expect(first.reports).toHaveLength(20);
    expect(first.next_cursor).not.toBeNull();
    const second = await listBody(`?cursor=${first.next_cursor as string}`, authHeaders(P1, "panel"));
    expect(second.reports).toHaveLength(5);
    expect(second.next_cursor).toBeNull();
    expect(ids(first).filter((id) => ids(second).includes(id))).toEqual([]);
  });

  it("breaks created_at ties by id descending across pages", async () => {
    const stamp = "2026-10-03T07:00:00.000Z";
    const base = manyReportsForP1()[0];
    fakeSupabase.reset({
      reports: ["a", "c", "b"].map((suffix) => ({
        ...base,
        id: `00000000-0000-4000-8000-00000009000${suffix}`,
        created_at: stamp,
        updated_at: stamp,
      })),
    });
    const first = await listBody("?limit=1", authHeaders(P1, "panel"));
    const second = await listBody(`?limit=1&cursor=${first.next_cursor as string}`, authHeaders(P1, "panel"));
    const third = await listBody(`?limit=1&cursor=${second.next_cursor as string}`, authHeaders(P1, "panel"));
    expect([...ids(first), ...ids(second), ...ids(third)].map((id) => id.slice(-1))).toEqual(["c", "b", "a"]);
    expect(third.next_cursor).toBeNull();
  });

  it.each([
    ["?limit=0", "limit"],
    ["?limit=101", "limit"],
    ["?limit=abc", "limit"],
    ["?limit=", "limit"],
    ["?limit=2.5", "limit"],
    ["?cursor=garbage", "cursor"],
    ["?state=bogus", "state"],
  ])("answers 400 validation_error for %s", async (query, field) => {
    const res = await list(query, authHeaders(P1, "panel"));
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("validation_error");
    expect(body.error.details?.map((d) => d.field)).toEqual([field]);
    expect(rpcCalls()).toEqual([]);
  });

  it("accepts limit=100", async () => {
    const res = await list("?limit=100", authHeaders(P1, "panel"));
    expect(res.status).toBe(200);
    expect(rpcCalls()[0].p_limit).toBe(101);
  });

  it("answers 503 storage_unavailable when storage fails", async () => {
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    const res = await list("", authHeaders(P1, "panel"));
    expect(res.status).toBe(503);
    const text = await res.text();
    expect((JSON.parse(text) as ErrorBody).error.code).toBe("storage_unavailable");
    expect(text).not.toContain("connection failure");
  });

  it("answers 503 when the storage call throws", async () => {
    fakeSupabase.throwNext(new TypeError("fetch failed"));
    const res = await list("", authHeaders(T1, "panel"));
    expect(res.status).toBe(503);
  });
});

describe("cursor encoding (contract v2)", () => {
  it("encodes {c, i} as base64url JSON exactly like get-reports.json", () => {
    const example = loadExample<{ response: { body: { next_cursor: string } } }>("get-reports.json");
    expect(encodeCursor({ created_at: "2026-10-03T08:40:00.000Z", id: R(2) })).toBe(example.response.body.next_cursor);
  });

  it("decodes its own cursors", () => {
    const cursor = encodeCursor({ created_at: "2026-10-03T08:40:00.000Z", id: R(2) });
    expect(decodeCursor(cursor)).toEqual({ createdAt: "2026-10-03T08:40:00.000Z", id: R(2) });
  });

  it.each([
    ["garbage", "garbage"],
    ["not JSON", Buffer.from("nope").toString("base64url")],
    ["an array", Buffer.from("[1,2]").toString("base64url")],
    ["a timestamp without milliseconds", Buffer.from(JSON.stringify({ c: "2026-10-03T08:40:00Z", i: R(2) })).toString("base64url")],
    ["an impossible date", Buffer.from(JSON.stringify({ c: "2026-13-45T08:40:00.000Z", i: R(2) })).toString("base64url")],
    ["a non-UUID id", Buffer.from(JSON.stringify({ c: "2026-10-03T08:40:00.000Z", i: "x" })).toString("base64url")],
    ["keys in another order", Buffer.from(JSON.stringify({ i: R(2), c: "2026-10-03T08:40:00.000Z" })).toString("base64url")],
    ["an extra key", Buffer.from(JSON.stringify({ c: "2026-10-03T08:40:00.000Z", i: R(2), x: 1 })).toString("base64url")],
  ])("rejects %s", (_label, value) => {
    expect(decodeCursor(value)).toBeNull();
  });

  it("paginates limit rows and points the cursor at the last one", () => {
    const rows = [
      { id: R(3), created_at: "2026-10-03T09:15:00.000Z" },
      { id: R(2), created_at: "2026-10-03T08:40:00.000Z" },
      { id: R(1), created_at: "2026-10-03T08:05:00.000Z" },
    ];
    expect(paginate(rows, 2)).toEqual({ page: rows.slice(0, 2), nextCursor: encodeCursor(rows[1]) });
    expect(paginate(rows, 3)).toEqual({ page: rows, nextCursor: null });
  });
});
