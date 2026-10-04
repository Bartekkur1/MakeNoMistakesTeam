// POST /api/reports/{id}/comments (D-11, D-17) on the seeded fake. The thread belongs to the
// parent and the teacher; the extension token (the child's device) never reaches it.
// Dataset: R1 pending_parent (C1/P1), R4 with_teacher (C2/P2); T1 teaches C1 and C2, T2 teaches C3.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getDetail } from "@/app/api/reports/[id]/route";
import { GET as getList } from "@/app/api/reports/route";
import { OPTIONS, POST } from "@/app/api/reports/[id]/comments/route";
import { DEMO_ACCOUNTS } from "@/lib/contract/demo-accounts";
import { API_ERROR_MESSAGES_PL, COMMENT_FIELDS, REPORT_FIELDS } from "@/lib/contract/types";
import { StorageUnavailableError } from "@/lib/server/errors";
import { addComment } from "@/lib/server/reports";
import { apiRequest, authHeaders } from "../helpers/auth";
import { seedFakeWithDataset } from "../helpers/dataset";
import { fakeSupabase } from "../helpers/fake-supabase";

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
const P2_ID = DEMO_ACCOUNTS[1].id;
const T1_ID = DEMO_ACCOUNTS[4].id;

const R1 = "00000000-0000-4000-8000-0000000d0001";
const R4 = "00000000-0000-4000-8000-0000000d0004";

interface ErrorBody {
  error: { code: string; message: string; details?: Array<{ field: string; message: string }> };
}

function comment(id: string, body: unknown, headers: Record<string, string> = authHeaders(T1, "panel")): Promise<Response> {
  return POST(apiRequest("POST", `/api/reports/${id}/comments`, { body, headers }), {
    params: Promise.resolve({ id }),
  });
}

async function detailComments(id: string, email: string): Promise<Array<Record<string, unknown>>> {
  const res = await getDetail(apiRequest("GET", `/api/reports/${id}`, { headers: authHeaders(email, "panel") }), {
    params: Promise.resolve({ id }),
  });
  expect(res.status).toBe(200);
  return ((await res.json()) as { comments: Array<Record<string, unknown>> }).comments;
}

async function expectError(res: Response, status: number, code: string): Promise<ErrorBody> {
  expect(res.status).toBe(status);
  const body = (await res.json()) as ErrorBody;
  expect(body.error.code).toBe(code);
  expect(body.error.message).toBe(API_ERROR_MESSAGES_PL[code as keyof typeof API_ERROR_MESSAGES_PL]);
  return body;
}

function commentsOf(id: string): number {
  return fakeSupabase.tables.report_comments.filter((c) => c.report_id === id).length;
}

beforeEach(() => {
  seedFakeWithDataset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/reports/{id}/comments", () => {
  it("answers OPTIONS with 204 and CORS headers", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("adds the teacher's trimmed comment, visible to the teacher and the parent", async () => {
    fakeSupabase.setClock("2026-10-03T12:05:00.000Z");
    const res = await comment(R4, { body: "  Porozmawiam z Kubą (demo).  " });
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual([...COMMENT_FIELDS]);
    expect(body).toMatchObject({
      report_id: R4,
      author_id: T1_ID,
      author_role: "teacher",
      body: "Porozmawiam z Kubą (demo).",
      created_at: "2026-10-03T12:05:00.000Z",
    });

    const teacherThread = await detailComments(R4, T1);
    const parentThread = await detailComments(R4, P2);
    expect(teacherThread.at(-1)).toEqual(body);
    expect(parentThread.at(-1)).toEqual(body);
    expect(fakeSupabase.tables.reports.find((r) => r.id === R4)?.state).toBe("with_teacher");
  });

  it("lets the parent comment on a report the teacher cannot see yet", async () => {
    const res = await comment(R1, { body: "Ola pokazała mi tę wiadomość (demo)." }, authHeaders(P1));
    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ author_id: P1_ID, author_role: "parent", report_id: R1 });
    expect(commentsOf(R1)).toBe(1);
  });

  it("is not idempotent: two identical posts add two comments", async () => {
    expect((await comment(R4, { body: "Ten sam komentarz (demo)." })).status).toBe(201);
    expect((await comment(R4, { body: "Ten sam komentarz (demo)." })).status).toBe(201);
    expect(commentsOf(R4)).toBe(2);
  });

  it("answers 404 when the account cannot see the report", async () => {
    await expectError(await comment(R4, { body: "Nie moja klasa." }, authHeaders(T2)), 404, "report_not_found");
    await expectError(await comment(R4, { body: "Nie moje dziecko." }, authHeaders(P1)), 404, "report_not_found");
    await expectError(await comment(R1, { body: "Jeszcze niezatwierdzone." }, authHeaders(T1)), 404, "report_not_found");
    await expectError(
      await comment("00000000-0000-4000-8000-0000000d0099", { body: "Brak zgłoszenia." }),
      404,
      "report_not_found",
    );
    expect(fakeSupabase.tables.report_comments).toHaveLength(3);
  });

  it("answers 404 for a malformed id without touching storage", async () => {
    await expectError(await comment("abc", { body: "Komentarz." }), 404, "report_not_found");
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("answers 403 to the extension token and 401 without a token", async () => {
    await expectError(await comment(R1, { body: "Z wtyczki." }, authHeaders(P1, "extension")), 403, "forbidden");
    await expectError(await comment(R4, { body: "Bez logowania." }, {}), 401, "unauthorized");
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("validates the body", async () => {
    const blank = await expectError(await comment(R4, { body: "   " }), 400, "validation_error");
    expect(blank.error.details).toEqual([{ field: "body", message: "Komentarz nie może być pusty." }]);
    const long = await expectError(await comment(R4, { body: "a".repeat(2001) }), 400, "validation_error");
    expect(long.error.details).toEqual([{ field: "body", message: "Komentarz jest za długi (maks. 2000 znaków)." }]);
    const missing = await expectError(await comment(R4, {}), 400, "validation_error");
    expect(missing.error.details?.map((d) => d.field)).toEqual(["body"]);
    const wrongType = await expectError(await comment(R4, { body: 7 }), 400, "validation_error");
    expect(wrongType.error.details?.map((d) => d.field)).toEqual(["body"]);
    expect((await comment(R4, { body: "a".repeat(2000) })).status).toBe(201);
  });

  it("rejects NUL characters and unpaired surrogates as 400, not a false 503 (WR-01)", async () => {
    const before = commentsOf(R4);
    for (const text of ["a\u0000b", "a\ud800b", "a\udc00b"]) {
      const res = await expectError(await comment(R4, { body: text }), 400, "validation_error");
      expect(res.error.details).toEqual([{ field: "body", message: "Tekst zawiera niedozwolone znaki." }]);
    }
    expect(commentsOf(R4)).toBe(before);
    expect((await comment(R4, { body: "Dziękuję 👍 (demo)" })).status).toBe(201);
  });

  it("answers 400 invalid_json and 413 for unreadable bodies", async () => {
    await expectError(await comment(R4, "{"), 400, "invalid_json");
    await expectError(await comment(R4, JSON.stringify({ body: "x".repeat(40000) })), 413, "payload_too_large");
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("takes the author only from the session, never from the body", async () => {
    const res = await comment(R4, {
      body: "Podpisany sesją (demo).",
      author_id: P2_ID,
      author_role: "parent",
      report_id: R1,
      id: "00000000-0000-4000-8000-0000000f0999",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toMatchObject({ author_id: T1_ID, author_role: "teacher", report_id: R4 });
    expect(body.id).not.toBe("00000000-0000-4000-8000-0000000f0999");
  });

  it.each([
    ["an error", () => fakeSupabase.failNext({ code: "08006", message: "connection failure" })],
    ["a throw", () => fakeSupabase.throwNext(new Error("network down"))],
  ])("answers 503 and adds nothing when the insert returns %s", async (_name, arm) => {
    fakeSupabase.beforeNextInsert(() => arm());
    await expectError(await comment(R4, { body: "Nie zapisze się." }), 503, "storage_unavailable");
    expect(fakeSupabase.tables.report_comments).toHaveLength(3);
  });

  it("never puts comments into lists", async () => {
    expect((await comment(R4, { body: "Komentarz w wątku (demo)." })).status).toBe(201);
    for (const email of [P2, T1]) {
      const res = await getList(apiRequest("GET", "/api/reports", { headers: authHeaders(email, "panel") }));
      const body = (await res.json()) as { reports: Array<Record<string, unknown>> };
      expect(body.reports.length).toBeGreaterThan(0);
      for (const report of body.reports) expect(Object.keys(report)).toEqual([...REPORT_FIELDS]);
    }
  });
});

describe("addComment (repository)", () => {
  it("inserts exactly the comment columns and returns the stored row", async () => {
    const stored = await addComment({ reportId: R4, authorId: T1_ID, authorRole: "teacher", body: "Repo (demo)." });
    expect(Object.keys(stored)).toEqual([...COMMENT_FIELDS]);
    const call = fakeSupabase.calls.at(-1);
    expect(call).toMatchObject({ kind: "from", name: "report_comments" });
    expect(call?.ops.map((op) => op.method)).toEqual(["insert", "select", "single"]);
    expect(call?.ops[0].args[0]).toEqual({
      report_id: R4,
      author_id: T1_ID,
      author_role: "teacher",
      body: "Repo (demo).",
    });
  });

  it("turns a missing report (foreign key violation) into StorageUnavailableError", async () => {
    await expect(
      addComment({
        reportId: "00000000-0000-4000-8000-0000000d0099",
        authorId: T1_ID,
        authorRole: "teacher",
        body: "Osierocony.",
      }),
    ).rejects.toBeInstanceOf(StorageUnavailableError);
    expect(fakeSupabase.tables.report_comments).toHaveLength(3);
  });
});
