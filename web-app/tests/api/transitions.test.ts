// POST /api/reports/{id}/transitions (API-02, D-08, D-09, D-10, D-15, D-17) on the seeded fake.
// Dataset: R1 pending_parent (C1/P1), R2 closed (C1/P1), R3 rejected (C1/P1), R4 with_teacher
// (C2/P2), R5 escalated (C3/P3), R6 pending_parent (C2/P2); T1 teaches C1 and C2, T2 teaches C3.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getDetail } from "@/app/api/reports/[id]/route";
import { GET as getList } from "@/app/api/reports/route";
import { OPTIONS, POST } from "@/app/api/reports/[id]/transitions/route";
import { DEMO_ACCOUNTS } from "@/lib/contract/demo-accounts";
import {
  API_ERROR_MESSAGES_PL,
  HISTORY_FIELDS,
  REPORT_FIELDS,
  TRANSITIONS,
  TRANSITION_COMMENT_REQUIRED,
  type ReportState,
} from "@/lib/contract/types";
import { StorageUnavailableError } from "@/lib/server/errors";
import { transitionReport } from "@/lib/server/reports";
import { apiRequest, authHeaders } from "../helpers/auth";
import { seedFakeWithDataset } from "../helpers/dataset";
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
const P2_ID = DEMO_ACCOUNTS[1].id;
const T1_ID = DEMO_ACCOUNTS[4].id;

const R1 = "00000000-0000-4000-8000-0000000d0001";
const R2 = "00000000-0000-4000-8000-0000000d0002";
const R4 = "00000000-0000-4000-8000-0000000d0004";
const RX = "00000000-0000-4000-8000-0000000d0101";

const ESCALATION_NOTE = "Zgłoszono do CERT Polska (NASK) - test demo.";

interface ErrorBody {
  error: { code: string; message: string; details?: Array<{ field: string; message: string }> };
}

interface TransitionBody {
  report: Record<string, unknown>;
  entry: Record<string, unknown>;
}

function transition(
  id: string,
  body: unknown,
  headers: Record<string, string> = authHeaders(P1, "panel"),
): Promise<Response> {
  return POST(apiRequest("POST", `/api/reports/${id}/transitions`, { body, headers }), {
    params: Promise.resolve({ id }),
  });
}

function detail(id: string, email: string): Promise<Response> {
  return getDetail(apiRequest("GET", `/api/reports/${id}`, { headers: authHeaders(email, "panel") }), {
    params: Promise.resolve({ id }),
  });
}

async function listIds(email: string): Promise<string[]> {
  const res = await getList(apiRequest("GET", "/api/reports", { headers: authHeaders(email, "panel") }));
  expect(res.status).toBe(200);
  const body = (await res.json()) as { reports: Array<{ id: string }> };
  return body.reports.map((report) => report.id);
}

async function expectError(res: Response, status: number, code: string): Promise<ErrorBody> {
  expect(res.status).toBe(status);
  const body = (await res.json()) as ErrorBody;
  expect(body.error.code).toBe(code);
  expect(body.error.message).toBe(API_ERROR_MESSAGES_PL[code as keyof typeof API_ERROR_MESSAGES_PL]);
  return body;
}

async function expectValidationField(res: Response, field: string): Promise<void> {
  const body = await expectError(res, 400, "validation_error");
  expect(body.error.details?.map((d) => d.field)).toContain(field);
}

function reportRow(id: string): Row | undefined {
  return fakeSupabase.tables.reports.find((row) => row.id === id);
}

// A C1/P1 report in the given state, so P1 or T1 can act on it.
function extraReport(state: ReportState): Row {
  return {
    id: RX,
    child_id: "00000000-0000-4000-8000-0000000c0001",
    parent_id: P1_ID,
    attack_type: "other",
    taken_actions: [],
    source: "other",
    content: "Fikcyjne zgłoszenie testowe (demo).",
    state,
    created_at: "2026-10-03T07:00:00.000Z",
    updated_at: "2026-10-03T07:00:00.000Z",
  };
}

beforeEach(() => {
  seedFakeWithDataset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/reports/{id}/transitions", () => {
  it("answers OPTIONS with 204 and CORS headers", () => {
    const res = OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("lets the parent approve a pending report, records the entry and shows it to the teacher", async () => {
    fakeSupabase.setClock("2026-10-03T12:00:00.000Z");
    const res = await transition(R1, { action: "approve" });
    expect(res.status).toBe(201);
    const body = (await res.json()) as TransitionBody;
    expect(Object.keys(body)).toEqual(["report", "entry"]);
    expect(Object.keys(body.report)).toEqual([...REPORT_FIELDS]);
    expect(Object.keys(body.entry)).toEqual([...HISTORY_FIELDS]);
    expect(body.report).toMatchObject({ id: R1, state: "with_teacher", updated_at: "2026-10-03T12:00:00.000Z" });
    expect(body.report.updated_at).toBe(body.entry.created_at);
    expect(body.entry).toMatchObject({
      report_id: R1,
      action: "approve",
      from_state: "pending_parent",
      to_state: "with_teacher",
      actor_id: P1_ID,
      actor_role: "parent",
      comment: null,
    });

    expect(reportRow(R1)?.state).toBe("with_teacher");
    expect(fakeSupabase.tables.report_history).toHaveLength(14);
    expect(fakeSupabase.calls.filter((c) => c.kind === "rpc").map((c) => c.name)).toEqual(["transition_report"]);
    expect(fakeSupabase.calls.find((c) => c.kind === "rpc")?.args).toEqual({
      p_report_id: R1,
      p_action: "approve",
      p_from_state: "pending_parent",
      p_to_state: "with_teacher",
      p_actor_id: P1_ID,
      p_actor_role: "parent",
      p_comment: null,
    });

    expect(await listIds(T1)).toEqual([R4, R2, R1]);
    const teacherView = await detail(R1, T1);
    expect(teacherView.status).toBe(200);
    const teacherBody = (await teacherView.json()) as { state: string; history: Array<{ action: string }> };
    expect(teacherBody.state).toBe("with_teacher");
    expect(teacherBody.history.map((h) => h.action)).toEqual(["submit", "approve"]);
  });

  it("answers a repeated approve with 409 and changes nothing", async () => {
    expect((await transition(R1, { action: "approve" })).status).toBe(201);
    await expectError(await transition(R1, { action: "approve" }), 409, "invalid_transition");
    expect(fakeSupabase.tables.report_history).toHaveLength(14);
  });

  const CASES = TRANSITIONS.flatMap((rule) =>
    rule.from.flatMap((from) => rule.roles.map((role) => ({ action: rule.action, from, to: rule.to, role }))),
  );

  it("covers the 10 allowed transitions", () => {
    expect(CASES).toHaveLength(10);
  });

  it.each(CASES)("$role $action: $from -> $to", async ({ action, from, to, role }) => {
    seedFakeWithDataset([extraReport(from)]);
    const comment = TRANSITION_COMMENT_REQUIRED[action] ? ESCALATION_NOTE : undefined;
    const email = role === "parent" ? P1 : T1;
    const res = await transition(RX, comment === undefined ? { action } : { action, comment }, authHeaders(email));
    expect(res.status).toBe(201);
    const body = (await res.json()) as TransitionBody;
    expect(body.report.state).toBe(to);
    expect(body.report.updated_at).toBe(body.entry.created_at);
    expect(body.entry).toMatchObject({
      report_id: RX,
      action,
      from_state: from,
      to_state: to,
      actor_id: role === "parent" ? P1_ID : T1_ID,
      actor_role: role,
      comment: comment ?? null,
    });
    expect(reportRow(RX)?.state).toBe(to);
    expect(fakeSupabase.tables.report_history.filter((h) => h.report_id === RX)).toHaveLength(1);
  });

  it("stores a trimmed optional comment and turns a blank one into null", async () => {
    const res = await transition(R1, { action: "reject", comment: "  Wyjaśnione w domu (demo).  " });
    expect(res.status).toBe(201);
    expect(((await res.json()) as TransitionBody).entry.comment).toBe("Wyjaśnione w domu (demo).");

    seedFakeWithDataset();
    const blank = await transition(R1, { action: "approve", comment: "   " });
    expect(blank.status).toBe(201);
    expect(((await blank.json()) as TransitionBody).entry.comment).toBeNull();
  });

  it.each([
    ["T1 approve R4", T1, R4, "approve"],
    ["P1 escalate R2", P1, R2, "escalate"],
    ["P1 close R1", P1, R1, "close"],
  ])("answers 403 forbidden when the role may never do it (%s)", async (_name, email, id, action) => {
    const before = structuredClone(fakeSupabase.tables);
    const body = action === "escalate" ? { action, comment: ESCALATION_NOTE } : { action };
    await expectError(await transition(id, body, authHeaders(email)), 403, "forbidden");
    expect(fakeSupabase.tables).toEqual(before);
    expect(fakeSupabase.calls.some((c) => c.kind === "rpc")).toBe(false);
  });

  it.each([
    ["P1 approve R2", P1, R2, "approve"],
    ["T1 close R2", T1, R2, "close"],
    ["P2 reopen R4", P2, R4, "reopen"],
  ])("answers 409 invalid_transition from the wrong state (%s)", async (_name, email, id, action) => {
    const before = structuredClone(fakeSupabase.tables);
    await expectError(await transition(id, { action }, authHeaders(email)), 409, "invalid_transition");
    expect(fakeSupabase.tables).toEqual(before);
    expect(fakeSupabase.calls.some((c) => c.kind === "rpc")).toBe(false);
  });

  it("requires a comment naming the organisation on escalation", async () => {
    await expectValidationField(await transition(R4, { action: "escalate" }, authHeaders(T1)), "comment");
    await expectValidationField(await transition(R4, { action: "escalate", comment: null }, authHeaders(T1)), "comment");
    await expectValidationField(await transition(R4, { action: "escalate", comment: "   " }, authHeaders(T1)), "comment");
    const res = await transition(R4, { action: "escalate" }, authHeaders(T1));
    const body = (await res.json()) as ErrorBody;
    expect(body.error.details).toEqual([
      { field: "comment", message: "Przy eskalacji wpisz, do kogo zgłoszono incydent." },
    ]);
    expect(reportRow(R4)?.state).toBe("with_teacher");
  });

  it("rejects a comment over 1000 characters and a non-string comment", async () => {
    const long = await transition(R4, { action: "escalate", comment: "a".repeat(1001) }, authHeaders(T1));
    const body = await expectError(long, 400, "validation_error");
    expect(body.error.details).toEqual([{ field: "comment", message: "Komentarz jest za długi (maks. 1000 znaków)." }]);
    expect((await transition(R4, { action: "escalate", comment: "a".repeat(1000) }, authHeaders(T1))).status).toBe(201);

    seedFakeWithDataset();
    await expectValidationField(await transition(R1, { action: "approve", comment: 42 }), "comment");
  });

  it("rejects an unknown or missing action", async () => {
    const res = await transition(R1, { action: "delete" });
    const body = await expectError(res, 400, "validation_error");
    expect(body.error.details).toEqual([{ field: "action", message: "Nieznana akcja." }]);
    await expectValidationField(await transition(R1, {}), "action");
    await expectValidationField(await transition(R1, { action: "submit" }), "action");
  });

  it("answers 400 invalid_json and 413 before looking at the report", async () => {
    await expectError(await transition(R1, "{"), 400, "invalid_json");
    await expectError(await transition(R1, JSON.stringify({ action: "approve", comment: "x".repeat(40000) })), 413, "payload_too_large");
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("answers 404 when the account cannot see the report", async () => {
    await expectError(await transition(R4, { action: "close" }, authHeaders(T2)), 404, "report_not_found");
    await expectError(await transition(R1, { action: "approve" }, authHeaders(P2)), 404, "report_not_found");
    await expectError(
      await transition("00000000-0000-4000-8000-0000000d0099", { action: "approve" }),
      404,
      "report_not_found",
    );
    expect(fakeSupabase.calls.some((c) => c.kind === "rpc")).toBe(false);
  });

  it("answers 404 for a malformed id without touching storage", async () => {
    await expectError(await transition("abc", { action: "approve" }), 404, "report_not_found");
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("answers 403 to the extension token and 401 without a token", async () => {
    await expectError(await transition(R1, { action: "approve" }, authHeaders(P1, "extension")), 403, "forbidden");
    await expectError(await transition(R1, { action: "approve" }, {}), 401, "unauthorized");
    expect(fakeSupabase.callCount).toBe(0);
    expect(reportRow(R1)?.state).toBe("pending_parent");
  });

  it("hides a report from the teacher again when the parent rejects it (D-15)", async () => {
    const res = await transition(R4, { action: "reject" }, authHeaders(P2));
    expect(res.status).toBe(201);
    const body = (await res.json()) as TransitionBody;
    expect(body.entry).toMatchObject({ from_state: "with_teacher", to_state: "rejected", actor_id: P2_ID });
    expect(await listIds(T1)).not.toContain(R4);
    await expectError(await detail(R4, T1), 404, "report_not_found");
  });

  it("lets only one of two concurrent transitions win (409 for the stale one)", async () => {
    fakeSupabase.beforeNextRpc((fake) => {
      const row = fake.tables.reports.find((r) => r.id === R4);
      if (row) row.state = "escalated";
    });
    const res = await transition(R4, { action: "escalate", comment: ESCALATION_NOTE }, authHeaders(T1));
    await expectError(res, 409, "invalid_transition");
    expect(fakeSupabase.tables.report_history).toHaveLength(13);
    expect(reportRow(R4)?.state).toBe("escalated");
  });

  it.each([
    ["an error", () => fakeSupabase.failNext({ code: "08006", message: "connection failure" })],
    ["a throw", () => fakeSupabase.throwNext(new Error("network down"))],
  ])("answers 503 and changes nothing when the rpc returns %s", async (_name, arm) => {
    fakeSupabase.beforeNextRpc(() => arm());
    const before = structuredClone(fakeSupabase.tables);
    await expectError(await transition(R1, { action: "approve" }), 503, "storage_unavailable");
    expect(fakeSupabase.tables).toEqual(before);
  });

  it("answers 503 when the report lookup fails", async () => {
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    await expectError(await transition(R1, { action: "approve" }), 503, "storage_unavailable");
    expect(reportRow(R1)?.state).toBe("pending_parent");
  });

  it("takes the actor only from the session, never from the body", async () => {
    const res = await transition(R1, {
      action: "approve",
      actor_id: P2_ID,
      actor_role: "teacher",
      from_state: "closed",
      to_state: "escalated",
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as TransitionBody;
    expect(body.entry).toMatchObject({
      actor_id: P1_ID,
      actor_role: "parent",
      from_state: "pending_parent",
      to_state: "with_teacher",
    });
  });
});

describe("transitionReport (repository)", () => {
  it("rejects a tuple outside the matrix with StorageUnavailableError and changes nothing", async () => {
    const before = structuredClone(fakeSupabase.tables);
    await expect(
      transitionReport({
        reportId: R2,
        action: "approve",
        fromState: "closed",
        toState: "with_teacher",
        actorId: P1_ID,
        actorRole: "parent",
        comment: null,
      }),
    ).rejects.toBeInstanceOf(StorageUnavailableError);
    expect(fakeSupabase.tables).toEqual(before);
  });

  it("returns null when the report is no longer in the expected state", async () => {
    const result = await transitionReport({
      reportId: R1,
      action: "close",
      fromState: "with_teacher",
      toState: "closed",
      actorId: T1_ID,
      actorRole: "teacher",
      comment: null,
    });
    expect(result).toBeNull();
    expect(fakeSupabase.tables.report_history).toHaveLength(13);
  });
});
