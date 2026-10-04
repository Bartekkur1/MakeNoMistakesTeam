import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OPTIONS as detailOptions, GET as getDetail } from "@/app/api/reports/[id]/route";
import { POST, OPTIONS as reportsOptions } from "@/app/api/reports/route";
import { DEMO_ACCOUNTS, DEMO_CHILDREN } from "@/lib/contract/demo-accounts";
import { API_ERROR_MESSAGES_PL, HISTORY_FIELDS, REPORT_FIELDS } from "@/lib/contract/types";
import { fakeSupabase, type Row } from "../helpers/fake-supabase";
import { apiRequest, authHeaders } from "../helpers/auth";

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
const C1_ID = DEMO_CHILDREN[0].id;
const C2_ID = DEMO_CHILDREN[1].id;
const T1_ID = DEMO_ACCOUNTS[4].id;

const ISO_Z = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

interface ExampleFile {
  request: Record<string, unknown>;
  response: { status: number; body: Record<string, unknown> };
}

const POST_EXAMPLE = JSON.parse(
  readFileSync(new URL("../../../../.planning/shared/examples/post-reports.json", import.meta.url), "utf8"),
) as ExampleFile;

interface ErrorBody {
  error: { code: string; message: string; details?: Array<{ field: string; message: string }> };
}

function postReport(body: unknown, headers: Record<string, string> = authHeaders(P1, "extension")): Promise<Response> {
  return POST(apiRequest("POST", "/api/reports", { body, headers }));
}

function getReportById(id: string, headers: Record<string, string> = authHeaders(P1, "panel")): Promise<Response> {
  return getDetail(apiRequest("GET", `/api/reports/${id}`, { headers }), { params: Promise.resolve({ id }) });
}

function validBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return { ...POST_EXAMPLE.request, ...overrides };
}

async function expectValidationError(res: Response, field: string, message?: string): Promise<void> {
  expect(res.status).toBe(400);
  const body = (await res.json()) as ErrorBody;
  expect(body.error.code).toBe("validation_error");
  expect(body.error.message).toBe(API_ERROR_MESSAGES_PL.validation_error);
  const match = body.error.details?.find((d) => d.field === field);
  expect(match, `details should name field ${field}: ${JSON.stringify(body.error.details)}`).toBeDefined();
  if (message !== undefined) expect(match?.message).toBe(message);
}

function expectNothingStored(): void {
  expect(fakeSupabase.tables.reports).toHaveLength(0);
  expect(fakeSupabase.tables.report_history).toHaveLength(0);
}

const R_WITH_TEACHER = "00000000-0000-4000-8000-0000000d0104";

// A report of child C2 already approved by P2 (state with_teacher), with history rows stored
// out of array order to prove the detail sorts them by seq.
function seedWithTeacherReport(): void {
  fakeSupabase.reset({
    reports: [
      {
        id: R_WITH_TEACHER,
        parent_id: P2_ID,
        child_id: C2_ID,
        attack_type: "fake_prize",
        taken_actions: ["clicked_link", "shared_personal_data"],
        source: "discord",
        content: "Fikcyjna wiadomość testowa (demo): wygrałeś nagrodę, kliknij https://nagroda.example",
        state: "with_teacher",
        created_at: "2026-10-03T10:30:00.000Z",
        updated_at: "2026-10-03T10:41:00.000Z",
      },
    ],
    report_history: [
      {
        id: "00000000-0000-4000-8000-0000000e0142",
        seq: 2,
        report_id: R_WITH_TEACHER,
        action: "approve",
        from_state: "pending_parent",
        to_state: "with_teacher",
        actor_id: P2_ID,
        actor_role: "parent",
        comment: "Proszę o pomoc (demo).",
        created_at: "2026-10-03T10:41:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-0000000e0141",
        seq: 1,
        report_id: R_WITH_TEACHER,
        action: "submit",
        from_state: null,
        to_state: "pending_parent",
        actor_id: C2_ID,
        actor_role: "child",
        comment: null,
        created_at: "2026-10-03T10:30:00.000Z",
      },
    ],
    report_comments: [
      {
        id: "00000000-0000-4000-8000-0000000f0142",
        seq: 2,
        report_id: R_WITH_TEACHER,
        author_id: P2_ID,
        author_role: "parent",
        body: "Dziękuję (demo).",
        created_at: "2026-10-03T10:50:00.000Z",
      },
      {
        id: "00000000-0000-4000-8000-0000000f0141",
        seq: 1,
        report_id: R_WITH_TEACHER,
        author_id: T1_ID,
        author_role: "teacher",
        body: "Porozmawiam z klasą (demo).",
        created_at: "2026-10-03T10:45:00.000Z",
      },
    ],
  });
}

beforeEach(() => {
  fakeSupabase.reset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/reports", () => {
  it("lets a parent submit through the extension and stores the report with its submit entry", async () => {
    const res = await postReport(validBody());
    expect(res.status).toBe(201);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const body = (await res.json()) as Record<string, unknown>;
    expect(Object.keys(body)).toEqual([...REPORT_FIELDS]);
    expect(body.child_id).toBe(C1_ID);
    expect(body.parent_id).toBe(P1_ID);
    expect(body.state).toBe("pending_parent");
    expect(body.attack_type).toBe("fake_prize");
    expect(body.source).toBe("game");
    expect(body.content).toBe(POST_EXAMPLE.request.content);
    expect(body.taken_actions).toEqual(["clicked_link", "paid"]);
    expect(body.created_at).toBe(body.updated_at);
    expect(body.created_at).toMatch(ISO_Z);

    expect(fakeSupabase.tables.reports).toHaveLength(1);
    expect(fakeSupabase.tables.report_history).toHaveLength(1);
    expect(fakeSupabase.tables.report_history[0]).toMatchObject({
      report_id: body.id,
      action: "submit",
      from_state: null,
      to_state: "pending_parent",
      actor_id: C1_ID,
      actor_role: "child",
      comment: null,
    });
  });

  it("goes through the create_report function with the six arguments", async () => {
    await postReport(validBody());
    const rpc = fakeSupabase.calls.find((c) => c.kind === "rpc");
    expect(rpc?.name).toBe("create_report");
    expect(rpc?.args).toEqual({
      p_parent_id: P1_ID,
      p_child_id: C1_ID,
      p_attack_type: "fake_prize",
      p_taken_actions: ["clicked_link", "paid"],
      p_source: "game",
      p_content: POST_EXAMPLE.request.content,
    });
  });

  it("lets a parent submit from the panel too", async () => {
    const res = await postReport(validBody(), authHeaders(P1, "panel"));
    expect(res.status).toBe(201);
  });

  it("ignores client-supplied id, state, parent_id and child_id", async () => {
    const res = await postReport(
      validBody({ id: "x", state: "closed", parent_id: P2_ID, child_id: DEMO_CHILDREN[2].id, created_at: "2020-01-01T00:00:00.000Z" }),
    );
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.id).not.toBe("x");
    expect(body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(body.state).toBe("pending_parent");
    expect(body.parent_id).toBe(P1_ID);
    expect(body.child_id).toBe(C1_ID);
    expect(body.created_at).not.toBe("2020-01-01T00:00:00.000Z");
  });

  it("trims content and stores the trimmed version", async () => {
    const res = await postReport(validBody({ content: "   Fikcyjna treść (demo)  " }));
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.content).toBe("Fikcyjna treść (demo)");
  });

  it("treats an omitted taken_actions as an empty list (contract: optional, default [])", async () => {
    const { taken_actions: omitted, ...rest } = validBody();
    void omitted;
    const res = await postReport(rest);
    expect(res.status).toBe(201);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.taken_actions).toEqual([]);
  });

  it("refuses a teacher with 403 forbidden and stores nothing", async () => {
    const res = await postReport(validBody(), authHeaders(T1, "panel"));
    expect(res.status).toBe(403);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("forbidden");
    expectNothingStored();
  });

  it("answers 401 unauthorized without a token and stores nothing", async () => {
    const res = await postReport(validBody(), {});
    expect(res.status).toBe(401);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("unauthorized");
    expectNothingStored();
  });

  it("rejects blank content", async () => {
    const res = await postReport(validBody({ content: "   " }));
    await expectValidationError(res, "content", "Treść nie może być pusta.");
    expectNothingStored();
  });

  it("rejects content over 5000 characters", async () => {
    const res = await postReport(validBody({ content: "a".repeat(5001) }));
    await expectValidationError(res, "content", "Treść jest za długa (maks. 5000 znaków).");
    expectNothingStored();
  });

  it.each([
    ["a NUL character", "Wiadomość a\u0000b (demo)"],
    ["an unpaired high surrogate", "Wiadomość \ud800 (demo)"],
    ["an unpaired low surrogate", "Wiadomość \udc00 (demo)"],
  ])("rejects content with %s as 400, not a false 503 (WR-01)", async (_label, content) => {
    const res = await postReport(validBody({ content }));
    await expectValidationError(res, "content", "Tekst zawiera niedozwolone znaki.");
    expect(fakeSupabase.callCount).toBe(0);
    expectNothingStored();
  });

  it("accepts content with emoji (paired surrogates)", async () => {
    const res = await postReport(validBody({ content: "Wygrałeś 🎁 nagrodę (demo)" }));
    expect(res.status).toBe(201);
  });

  it("rejects an unknown attack type", async () => {
    const res = await postReport(validBody({ attack_type: "virus" }));
    await expectValidationError(res, "attack_type", "Wybierz rodzaj ataku.");
    expectNothingStored();
  });

  it("rejects taken_actions that is not a list", async () => {
    const res = await postReport(validBody({ taken_actions: null }));
    await expectValidationError(res, "taken_actions", "Zaznacz podjęte działania (pusta lista = nic z tych rzeczy).");
    expectNothingStored();
  });

  it("rejects taken_actions given as a single string", async () => {
    const res = await postReport(validBody({ taken_actions: "paid" }));
    await expectValidationError(res, "taken_actions");
    expectNothingStored();
  });

  it("rejects duplicate taken actions", async () => {
    const res = await postReport(validBody({ taken_actions: ["paid", "paid"] }));
    await expectValidationError(res, "taken_actions", "Działania nie mogą się powtarzać.");
    expectNothingStored();
  });

  it("rejects an unknown taken action by index", async () => {
    const res = await postReport(validBody({ taken_actions: ["paid", "hacked"] }));
    await expectValidationError(res, "taken_actions[1]", "Nieznane działanie.");
    expectNothingStored();
  });

  it("rejects a taken action that does not fit the attack type", async () => {
    const res = await postReport(validBody({ attack_type: "purchase_trap", taken_actions: ["downloaded_file"] }));
    await expectValidationError(res, "taken_actions[0]", "To działanie nie pasuje do wybranego rodzaju ataku.");
    expectNothingStored();
  });

  it("rejects an unknown source", async () => {
    const res = await postReport(validBody({ source: "tiktok" }));
    await expectValidationError(res, "source", "Wybierz źródło wiadomości.");
    expectNothingStored();
  });

  it("collects every field error at once", async () => {
    const res = await postReport({ attack_type: "virus", source: "tiktok", content: "" });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.details?.map((d) => d.field).sort()).toEqual(["attack_type", "content", "source"]);
  });

  it("answers 400 invalid_json for a malformed body", async () => {
    const res = await postReport("{");
    expect(res.status).toBe(400);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("invalid_json");
    expectNothingStored();
  });

  it("answers 413 payload_too_large for a 40000-byte body", async () => {
    const res = await postReport(JSON.stringify(validBody({ content: "a".repeat(40000) })));
    expect(res.status).toBe(413);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("payload_too_large");
    expectNothingStored();
  });

  it("answers 503 storage_unavailable when storage returns an error", async () => {
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    const res = await postReport(validBody());
    expect(res.status).toBe(503);
    const text = await res.text();
    expect((JSON.parse(text) as ErrorBody).error.code).toBe("storage_unavailable");
    expect(text).not.toContain("connection failure");
    expectNothingStored();
  });

  it("answers 503 storage_unavailable when the storage call throws", async () => {
    fakeSupabase.throwNext(new TypeError("fetch failed"));
    const res = await postReport(validBody());
    expect(res.status).toBe(503);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("storage_unavailable");
  });

  it("answers 503 when the function returns no row (never a false confirmation)", async () => {
    const original = fakeSupabase.rpcHandlers.create_report;
    fakeSupabase.rpcHandlers.create_report = () => ({ data: null, error: null });
    try {
      const res = await postReport(validBody());
      expect(res.status).toBe(503);
    } finally {
      fakeSupabase.rpcHandlers.create_report = original;
    }
  });

  it("creates two distinct reports for two identical requests (not idempotent, D-17)", async () => {
    const first = await postReport(validBody());
    const second = await postReport(validBody());
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
    const a = (await first.json()) as { id: string };
    const b = (await second.json()) as { id: string };
    expect(a.id).not.toBe(b.id);
    expect(fakeSupabase.tables.reports).toHaveLength(2);
  });
});

describe("GET /api/reports/{id}", () => {
  it("returns the report the parent just submitted, with its submit entry and no comments", async () => {
    const created = await postReport(validBody());
    const report = (await created.json()) as Record<string, unknown>;

    const res = await getReportById(report.id as string, authHeaders(P1, "panel"));
    expect(res.status).toBe(200);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    const body = (await res.json()) as Record<string, unknown> & { history: Array<Record<string, unknown>> };
    expect(Object.keys(body)).toEqual([...REPORT_FIELDS, "history", "comments"]);
    const { history, comments, ...rest } = body;
    expect(rest).toEqual(report);
    expect(comments).toEqual([]);
    expect(history).toHaveLength(1);
    expect(Object.keys(history[0])).toEqual([...HISTORY_FIELDS]);
    expect(history[0]).toMatchObject({
      report_id: report.id,
      action: "submit",
      from_state: null,
      to_state: "pending_parent",
      actor_id: C1_ID,
      actor_role: "child",
      comment: null,
      created_at: report.created_at,
    });
  });

  it("refuses the extension scope with 403 forbidden (the child never sees history)", async () => {
    const created = await postReport(validBody());
    const report = (await created.json()) as { id: string };
    const before = fakeSupabase.callCount;
    const res = await getReportById(report.id, authHeaders(P1, "extension"));
    expect(res.status).toBe(403);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("forbidden");
    expect(fakeSupabase.callCount).toBe(before);
  });

  it("answers 404 to another parent", async () => {
    const created = await postReport(validBody());
    const report = (await created.json()) as { id: string };
    const res = await getReportById(report.id, authHeaders(P2, "panel"));
    expect(res.status).toBe(404);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("report_not_found");
    expect(body.error.message).toBe(API_ERROR_MESSAGES_PL.report_not_found);
  });

  it("answers 404 to the class teacher while the report waits for the parent", async () => {
    const created = await postReport(validBody());
    const report = (await created.json()) as { id: string };
    const res = await getReportById(report.id, authHeaders(T1, "panel"));
    expect(res.status).toBe(404);
  });

  it("answers 404 for a malformed id without querying storage", async () => {
    const before = fakeSupabase.callCount;
    const res = await getReportById("abc");
    expect(res.status).toBe(404);
    const body = (await res.json()) as ErrorBody;
    expect(body.error.code).toBe("report_not_found");
    expect(fakeSupabase.callCount).toBe(before);
  });

  it("answers 404 for an unknown valid UUID", async () => {
    const res = await getReportById(crypto.randomUUID());
    expect(res.status).toBe(404);
  });

  it("answers 401 without a token", async () => {
    const res = await getReportById(crypto.randomUUID(), {});
    expect(res.status).toBe(401);
  });

  it("shows an approved report to the teacher of the child's class", async () => {
    seedWithTeacherReport();
    const res = await getReportById(R_WITH_TEACHER, authHeaders(T1, "panel"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { id: string; state: string };
    expect(body.id).toBe(R_WITH_TEACHER);
    expect(body.state).toBe("with_teacher");
  });

  it("hides an approved report from a teacher of another class", async () => {
    seedWithTeacherReport();
    const res = await getReportById(R_WITH_TEACHER, authHeaders(T2, "panel"));
    expect(res.status).toBe(404);
  });

  it("returns history and comments in seq order with Z timestamps", async () => {
    seedWithTeacherReport();
    const res = await getReportById(R_WITH_TEACHER, authHeaders(P2, "panel"));
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      created_at: string;
      updated_at: string;
      history: Row[];
      comments: Row[];
    };
    expect(body.history.map((h) => h.action)).toEqual(["submit", "approve"]);
    expect(body.comments.map((c) => c.id)).toEqual([
      "00000000-0000-4000-8000-0000000f0141",
      "00000000-0000-4000-8000-0000000f0142",
    ]);
    expect(body.history[0]).not.toHaveProperty("seq");
    expect(body.comments[0]).not.toHaveProperty("seq");
    const stamps = [
      body.created_at,
      body.updated_at,
      ...body.history.map((h) => h.created_at),
      ...body.comments.map((c) => c.created_at),
    ];
    for (const stamp of stamps) expect(stamp).toMatch(ISO_Z);
    expect(body.updated_at).toBe("2026-10-03T10:41:00.000Z");
  });

  it("answers 503 when storage fails while reading the report", async () => {
    seedWithTeacherReport();
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    const res = await getReportById(R_WITH_TEACHER, authHeaders(P2, "panel"));
    expect(res.status).toBe(503);
  });
});

describe("OPTIONS on the report routes", () => {
  it("answers the preflight with 204 and CORS headers", () => {
    for (const res of [reportsOptions(), detailOptions()]) {
      expect(res.status).toBe(204);
      expect(res.headers.get("access-control-allow-origin")).toBe("*");
    }
  });
});
