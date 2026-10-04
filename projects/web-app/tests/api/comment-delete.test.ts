// DELETE /api/reports/{id}/comments/{commentId} (D-11, amended 2026-10-04) on the seeded fake. Only
// the author deletes a comment; the delete is hard and idempotent.
// Dataset: R2 (C1/P1, with T1) has F21 by P1 and F22 by T1; R4 (C2/P2) has no comments.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getDetail } from "@/app/api/reports/[id]/route";
import { DELETE, OPTIONS } from "@/app/api/reports/[id]/comments/[commentId]/route";
import { API_ERROR_MESSAGES_PL } from "@/lib/contract/types";
import { deleteComment } from "@/lib/server/reports";
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

const R2 = "00000000-0000-4000-8000-0000000d0002";
const R4 = "00000000-0000-4000-8000-0000000d0004";
const F21_BY_P1 = "00000000-0000-4000-8000-0000000f0021";
const F22_BY_T1 = "00000000-0000-4000-8000-0000000f0022";

function remove(id: string, commentId: string, headers: Record<string, string> = authHeaders(P1, "panel")): Promise<Response> {
  return DELETE(apiRequest("DELETE", `/api/reports/${id}/comments/${commentId}`, { headers }), {
    params: Promise.resolve({ id, commentId }),
  });
}

async function expectError(res: Response, status: number, code: keyof typeof API_ERROR_MESSAGES_PL): Promise<void> {
  expect(res.status).toBe(status);
  const body = (await res.json()) as { error: { code: string; message: string } };
  expect(body.error).toEqual({ code, message: API_ERROR_MESSAGES_PL[code] });
}

function commentIds(): string[] {
  return fakeSupabase.tables.report_comments.map((row) => String(row.id));
}

beforeEach(() => {
  seedFakeWithDataset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("DELETE /api/reports/{id}/comments/{commentId}", () => {
  it("answers OPTIONS with 204 and allows DELETE in CORS", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-methods")).toContain("DELETE");
  });

  it("deletes the author's own comment for both sides and answers 204 without a body", async () => {
    const res = await remove(R2, F21_BY_P1);
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
    expect(commentIds()).not.toContain(F21_BY_P1);
    expect(commentIds()).toContain(F22_BY_T1);

    const detail = await getDetail(apiRequest("GET", `/api/reports/${R2}`, { headers: authHeaders(T1, "panel") }), {
      params: Promise.resolve({ id: R2 }),
    });
    const body = (await detail.json()) as { comments: Array<{ id: string }> };
    expect(body.comments.map((c) => c.id)).toEqual([F22_BY_T1]);
  });

  it("lets the teacher delete their own comment", async () => {
    expect((await remove(R2, F22_BY_T1, authHeaders(T1, "panel"))).status).toBe(204);
    expect(commentIds()).not.toContain(F22_BY_T1);
  });

  it("answers 403 and keeps the comment when someone else wrote it", async () => {
    await expectError(await remove(R2, F22_BY_T1), 403, "forbidden");
    await expectError(await remove(R2, F21_BY_P1, authHeaders(T1, "panel")), 403, "forbidden");
    expect(commentIds()).toEqual(expect.arrayContaining([F21_BY_P1, F22_BY_T1]));
  });

  it("is idempotent: a comment that is already gone answers 204 again", async () => {
    expect((await remove(R2, F21_BY_P1)).status).toBe(204);
    expect((await remove(R2, F21_BY_P1)).status).toBe(204);
    expect((await remove(R2, "00000000-0000-4000-8000-0000000f0999")).status).toBe(204);
    expect((await remove(R2, "not-a-uuid")).status).toBe(204);
    expect(fakeSupabase.tables.report_comments).toHaveLength(2);
  });

  it("does not delete a comment through another report's id", async () => {
    // P2 sees R4 but not R2; F21 belongs to R2.
    expect((await remove(R4, F21_BY_P1, authHeaders(P2, "panel"))).status).toBe(204);
    expect(commentIds()).toContain(F21_BY_P1);
  });

  it("answers 404 when the account cannot see the report", async () => {
    await expectError(await remove(R2, F22_BY_T1, authHeaders(T2, "panel")), 404, "report_not_found");
    await expectError(await remove(R2, F21_BY_P1, authHeaders(P2, "panel")), 404, "report_not_found");
    await expectError(await remove("abc", F21_BY_P1), 404, "report_not_found");
    expect(fakeSupabase.tables.report_comments).toHaveLength(3);
  });

  it("answers 403 to the extension token and 401 without a token, without touching storage", async () => {
    await expectError(await remove(R2, F21_BY_P1, authHeaders(P1, "extension")), 403, "forbidden");
    await expectError(await remove(R2, F21_BY_P1, {}), 401, "unauthorized");
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("answers 503 and deletes nothing when storage fails", async () => {
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    await expectError(await remove(R2, F21_BY_P1), 503, "storage_unavailable");
    expect(fakeSupabase.tables.report_comments).toHaveLength(3);
  });
});

describe("deleteComment (repository)", () => {
  it("filters the delete by comment, report and author", async () => {
    const outcome = await deleteComment({
      reportId: R2,
      commentId: F21_BY_P1,
      authorId: "00000000-0000-4000-8000-0000000a0001",
    });
    expect(outcome).toBe("deleted");
    const call = fakeSupabase.calls.at(-1);
    expect(call).toMatchObject({ kind: "from", name: "report_comments" });
    expect(call?.ops).toEqual([
      { method: "delete", args: [] },
      { method: "eq", args: ["id", F21_BY_P1] },
      { method: "eq", args: ["report_id", R2] },
      { method: "eq", args: ["author_id", "00000000-0000-4000-8000-0000000a0001"] },
      { method: "select", args: ["id"] },
    ]);
  });
});
