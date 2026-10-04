// Repository call shapes: what reports.ts sends to the Postgres functions and how it treats
// what comes back. Storage is the in-memory fake (D-06).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEMO_ACCOUNTS, DEMO_CHILDREN } from "@/lib/contract/demo-accounts";
import { listScopeFor } from "@/lib/server/access";
import { StorageUnavailableError } from "@/lib/server/errors";
import {
  createReport,
  getReport,
  getReportTimeline,
  listReports,
  mapComment,
  mapHistoryEntry,
  mapReport,
  toIsoUtc,
} from "@/lib/server/reports";
import { seedFakeWithDataset } from "../helpers/dataset";
import { fakeSupabase, type Row } from "../helpers/fake-supabase";

vi.mock("@supabase/supabase-js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@supabase/supabase-js")>();
  const { fakeSupabase: fake } = await import("../helpers/fake-supabase");
  return { ...actual, createClient: () => fake.client };
});

const P1 = DEMO_ACCOUNTS[0];
const T1 = DEMO_ACCOUNTS[4];
const C1_ID = DEMO_CHILDREN[0].id;
const C2_ID = DEMO_CHILDREN[1].id;
const R2 = "00000000-0000-4000-8000-0000000d0002";

const INPUT = {
  parent_id: P1.id,
  child_id: C1_ID,
  attack_type: "phishing" as const,
  taken_actions: ["clicked_link" as const, "entered_password" as const],
  source: "email" as const,
  content: "Fikcyjny mail testowy (demo): zaloguj się na https://szkola.example",
};

const REPORT_ROW = {
  id: R2,
  child_id: C1_ID,
  parent_id: P1.id,
  attack_type: "phishing",
  taken_actions: ["replied", "clicked_link"],
  source: "email",
  content: "Fikcyjna treść (demo).",
  state: "closed",
  created_at: "2026-10-03T08:40:00+00:00",
  updated_at: "2026-10-03T09:40:00.5+00:00",
};

beforeEach(() => {
  fakeSupabase.reset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createReport", () => {
  it("calls create_report with exactly the six p_* arguments", async () => {
    await createReport(INPUT);
    expect(fakeSupabase.calls).toHaveLength(1);
    expect(fakeSupabase.calls[0]).toMatchObject({ kind: "rpc", name: "create_report" });
    expect(fakeSupabase.calls[0].args).toEqual({
      p_parent_id: P1.id,
      p_child_id: C1_ID,
      p_attack_type: "phishing",
      p_taken_actions: ["clicked_link", "entered_password"],
      p_source: "email",
      p_content: INPUT.content,
    });
  });

  it("returns contract Z timestamps although storage holds +00:00", async () => {
    fakeSupabase.setClock("2026-10-03T12:30:00.000Z");
    const report = await createReport(INPUT);
    expect(fakeSupabase.tables.reports[0].created_at).toBe("2026-10-03T12:30:00+00:00");
    expect(report.created_at).toBe("2026-10-03T12:30:00.000Z");
    expect(report.updated_at).toBe("2026-10-03T12:30:00.000Z");
  });

  it("uses the server-assigned id", async () => {
    fakeSupabase.queueIds("00000000-0000-4000-8000-0000000d0007");
    const report = await createReport(INPUT);
    expect(report.id).toBe("00000000-0000-4000-8000-0000000d0007");
  });

  it("throws StorageUnavailableError when the function returns an error", async () => {
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    await expect(createReport(INPUT)).rejects.toBeInstanceOf(StorageUnavailableError);
  });

  it("throws StorageUnavailableError when a check constraint rejects the row", async () => {
    await expect(createReport({ ...INPUT, source: "tiktok" as never })).rejects.toBeInstanceOf(StorageUnavailableError);
    expect(fakeSupabase.tables.reports).toHaveLength(0);
  });

  it("throws StorageUnavailableError when the function returns no row", async () => {
    const original = fakeSupabase.rpcHandlers.create_report;
    fakeSupabase.rpcHandlers.create_report = () => ({ data: null, error: null });
    try {
      await expect(createReport(INPUT)).rejects.toBeInstanceOf(StorageUnavailableError);
    } finally {
      fakeSupabase.rpcHandlers.create_report = original;
    }
  });

  it("throws StorageUnavailableError when the call throws", async () => {
    fakeSupabase.throwNext(new TypeError("fetch failed"));
    await expect(createReport(INPUT)).rejects.toBeInstanceOf(StorageUnavailableError);
  });

  it("throws StorageUnavailableError when the returned row breaks the contract", async () => {
    const original = fakeSupabase.rpcHandlers.create_report;
    fakeSupabase.rpcHandlers.create_report = () => ({ data: { ...REPORT_ROW, state: "archived" }, error: null });
    try {
      await expect(createReport(INPUT)).rejects.toBeInstanceOf(StorageUnavailableError);
    } finally {
      fakeSupabase.rpcHandlers.create_report = original;
    }
  });
});

describe("listReports", () => {
  it("sends a teacher scope as child ids and visible states", async () => {
    seedFakeWithDataset();
    const reports = await listReports({ scope: listScopeFor(T1), state: null, cursor: null, fetchLimit: 21 });
    expect(reports.map((r) => r.id.slice(-2))).toEqual(["04", "02"]);
    expect(fakeSupabase.calls).toHaveLength(1);
    expect(fakeSupabase.calls[0]).toMatchObject({ kind: "rpc", name: "list_reports" });
    expect(fakeSupabase.calls[0].args).toEqual({
      p_parent_id: null,
      p_child_ids: [C1_ID, C2_ID],
      p_states: ["with_teacher", "escalated", "closed"],
      p_state: null,
      p_cursor_created_at: null,
      p_cursor_id: null,
      p_limit: 21,
    });
  });

  it("sends the decoded cursor and the state filter", async () => {
    seedFakeWithDataset();
    await listReports({
      scope: listScopeFor(P1),
      state: "rejected",
      cursor: { createdAt: "2026-10-03T09:15:00.000Z", id: "00000000-0000-4000-8000-0000000d0003" },
      fetchLimit: 3,
    });
    expect(fakeSupabase.calls[0].args).toEqual({
      p_parent_id: P1.id,
      p_child_ids: null,
      p_states: null,
      p_state: "rejected",
      p_cursor_created_at: "2026-10-03T09:15:00.000Z",
      p_cursor_id: "00000000-0000-4000-8000-0000000d0003",
      p_limit: 3,
    });
  });

  it("rejects an empty scope without calling storage (never 'all reports')", async () => {
    await expect(
      listReports({ scope: { parentId: null, childIds: null, states: null }, state: null, cursor: null, fetchLimit: 21 }),
    ).rejects.toThrow("list scope required");
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("returns [] for a teacher without children without calling storage", async () => {
    const reports = await listReports({
      scope: { parentId: null, childIds: [], states: ["with_teacher"] },
      state: null,
      cursor: null,
      fetchLimit: 21,
    });
    expect(reports).toEqual([]);
    expect(fakeSupabase.callCount).toBe(0);
  });

  it("throws StorageUnavailableError on a storage error or a non-list answer", async () => {
    fakeSupabase.failNext({ code: "P0001", message: "list_reports: parent or child scope required" });
    await expect(listReports({ scope: listScopeFor(P1), state: null, cursor: null, fetchLimit: 21 })).rejects.toBeInstanceOf(
      StorageUnavailableError,
    );

    const original = fakeSupabase.rpcHandlers.list_reports;
    fakeSupabase.rpcHandlers.list_reports = () => ({ data: { not: "a list" }, error: null });
    try {
      await expect(
        listReports({ scope: listScopeFor(P1), state: null, cursor: null, fetchLimit: 21 }),
      ).rejects.toBeInstanceOf(StorageUnavailableError);
    } finally {
      fakeSupabase.rpcHandlers.list_reports = original;
    }
  });
});

describe("getReport and getReportTimeline", () => {
  it("reads one report by id and null for an unknown id", async () => {
    seedFakeWithDataset();
    const report = await getReport(R2);
    expect(report?.id).toBe(R2);
    expect(report?.created_at).toBe("2026-10-03T08:40:00.000Z");
    expect(await getReport("00000000-0000-4000-8000-0000000d0099")).toBeNull();
  });

  it("returns history and comments in seq order when stored shuffled", async () => {
    const dataset = seedFakeWithDataset();
    const history = dataset.history.filter((h) => h.report_id === R2).map((h, i): Row => ({ ...h, seq: 10 + i }));
    const comments = dataset.comments.filter((c) => c.report_id === R2).map((c, i): Row => ({ ...c, seq: 10 + i }));
    fakeSupabase.reset({
      reports: dataset.reports,
      report_history: [history[2], history[0], history[3], history[1]],
      report_comments: [comments[1], comments[0]],
    });

    const timeline = await getReportTimeline(R2);
    expect(timeline.history.map((h) => h.id)).toEqual(history.map((h) => h.id));
    expect(timeline.comments.map((c) => c.id)).toEqual(comments.map((c) => c.id));
    for (const entry of timeline.history) expect(entry).not.toHaveProperty("seq");
  });

  it("throws StorageUnavailableError when a timeline read fails", async () => {
    seedFakeWithDataset();
    fakeSupabase.failNext({ code: "08006", message: "connection failure" });
    await expect(getReportTimeline(R2)).rejects.toBeInstanceOf(StorageUnavailableError);
  });
});

describe("mappers", () => {
  it("maps a row to exactly the contract fields, canonical actions and Z timestamps", () => {
    expect(mapReport({ ...REPORT_ROW, seq: 1, extra: "x" })).toEqual({
      id: R2,
      child_id: C1_ID,
      parent_id: P1.id,
      attack_type: "phishing",
      taken_actions: ["clicked_link", "replied"],
      source: "email",
      content: "Fikcyjna treść (demo).",
      state: "closed",
      created_at: "2026-10-03T08:40:00.000Z",
      updated_at: "2026-10-03T09:40:00.500Z",
    });
  });

  it("throws StorageUnavailableError for an unknown state", () => {
    expect(() => mapReport({ ...REPORT_ROW, state: "archived" })).toThrow(StorageUnavailableError);
  });

  it("throws StorageUnavailableError for a missing field, an unknown action or a bad timestamp", () => {
    const { content: _content, ...withoutContent } = REPORT_ROW;
    void _content;
    expect(() => mapReport(withoutContent)).toThrow(StorageUnavailableError);
    expect(() => mapReport({ ...REPORT_ROW, taken_actions: ["hacked"] })).toThrow(StorageUnavailableError);
    expect(() => mapReport({ ...REPORT_ROW, created_at: "yesterday" })).toThrow(StorageUnavailableError);
    expect(() => mapReport(null)).toThrow(StorageUnavailableError);
    expect(() => mapReport([REPORT_ROW])).toThrow(StorageUnavailableError);
  });

  it("validates history entries and comments the same way", () => {
    const entry = {
      id: "00000000-0000-4000-8000-0000000e0021",
      report_id: R2,
      action: "submit",
      from_state: null,
      to_state: "pending_parent",
      actor_id: C1_ID,
      actor_role: "child",
      comment: null,
      created_at: "2026-10-03T08:40:00+00:00",
    };
    expect(mapHistoryEntry(entry).created_at).toBe("2026-10-03T08:40:00.000Z");
    expect(() => mapHistoryEntry({ ...entry, action: "delete" })).toThrow(StorageUnavailableError);
    expect(() => mapHistoryEntry({ ...entry, actor_role: "admin" })).toThrow(StorageUnavailableError);

    const comment = {
      id: "00000000-0000-4000-8000-0000000f0021",
      report_id: R2,
      author_id: T1.id,
      author_role: "teacher",
      body: "Komentarz (demo).",
      created_at: "2026-10-03T09:12:00+00:00",
    };
    expect(mapComment(comment).created_at).toBe("2026-10-03T09:12:00.000Z");
    expect(() => mapComment({ ...comment, author_role: "child" })).toThrow(StorageUnavailableError);
  });

  it("normalizes PostgREST timestamps to the contract format", () => {
    expect(toIsoUtc("2026-10-03T08:40:00+00:00")).toBe("2026-10-03T08:40:00.000Z");
    expect(toIsoUtc("2026-10-03T10:40:00.123+02:00")).toBe("2026-10-03T08:40:00.123Z");
    expect(() => toIsoUtc(42)).toThrow(StorageUnavailableError);
  });
});
