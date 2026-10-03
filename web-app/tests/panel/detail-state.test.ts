// The report detail's state machine (detail-state.ts), driven directly: first load, not found,
// failures with and without a loaded report, and the request-id guard that ignores a response for
// a superseded request.

import { describe, expect, it } from "vitest";
import type { ApiFailure } from "@/app/_panel/api";
import { detailReducer, initialDetailState, type DetailState } from "@/app/_panel/detail-state";
import type { ReportComment, ReportDetail } from "@/lib/contract/types";

const REPORT: ReportDetail = {
  id: "00000000-0000-4000-8000-0000000d0001",
  child_id: "00000000-0000-4000-8000-0000000c0001",
  parent_id: "00000000-0000-4000-8000-0000000a0001",
  attack_type: "data_request",
  taken_actions: [],
  source: "game",
  content: "Podaj kod z SMS-a.",
  state: "pending_parent",
  created_at: "2026-10-03T08:05:00.000Z",
  updated_at: "2026-10-03T08:05:00.000Z",
  history: [
    {
      id: "00000000-0000-4000-8000-0000000e0011",
      report_id: "00000000-0000-4000-8000-0000000d0001",
      action: "submit",
      from_state: null,
      to_state: "pending_parent",
      actor_id: "00000000-0000-4000-8000-0000000c0001",
      actor_role: "child",
      comment: null,
      created_at: "2026-10-03T08:05:00.000Z",
    },
  ],
  comments: [],
};

const UNAVAILABLE: ApiFailure = {
  ok: false,
  kind: "http",
  status: 503,
  code: "storage_unavailable",
  message: "x",
  details: [],
};

const COMMENT_A: ReportComment = {
  id: "00000000-0000-4000-8000-0000000f0101",
  report_id: REPORT.id,
  author_id: "00000000-0000-4000-8000-0000000a0001",
  author_role: "parent",
  body: "Porozmawiam z Olą.",
  created_at: "2026-10-03T10:00:00.000Z",
};

function loaded(): DetailState {
  return detailReducer(initialDetailState, {
    type: "load-done",
    requestId: initialDetailState.requestId,
    reason: "initial",
    report: REPORT,
    clock: "10:00",
  });
}

describe("detailReducer: first load", () => {
  it("starts loading the report", () => {
    expect(initialDetailState.status).toBe("loading");
    expect(initialDetailState.report).toBeNull();
    expect(initialDetailState.pending).toBe("initial");
    expect(initialDetailState.requestId).toBe(1);
  });

  it("load-done shows the report", () => {
    const state = loaded();

    expect(state.status).toBe("ready");
    expect(state.report).toEqual(REPORT);
    expect(state.pending).toBeNull();
    expect(state.failure).toBeNull();
    expect(state.refreshedAt).toBeNull();
    expect(state.announcement).toBe("");
  });

  it("load-not-found shows the not-found view and drops the report", () => {
    const state = detailReducer(loaded(), { type: "load-not-found", requestId: 1 });

    expect(state.status).toBe("not_found");
    expect(state.report).toBeNull();
    expect(state.pending).toBeNull();
  });

  it("load-failed without a report shows the error", () => {
    const state = detailReducer(initialDetailState, { type: "load-failed", requestId: 1, failure: UNAVAILABLE });

    expect(state.status).toBe("error");
    expect(state.failure).toEqual(UNAVAILABLE);
    expect(state.pending).toBeNull();
  });

  it("load-failed with a report keeps it and sets the failure", () => {
    const state = detailReducer(loaded(), { type: "load-failed", requestId: 1, failure: UNAVAILABLE });

    expect(state.status).toBe("ready");
    expect(state.report).toEqual(REPORT);
    expect(state.failure).toEqual(UNAVAILABLE);
  });

  it("a retry after an error shows the skeleton again", () => {
    const failed = detailReducer(initialDetailState, { type: "load-failed", requestId: 1, failure: UNAVAILABLE });

    const state = detailReducer(failed, { type: "load-start", requestId: 2, reason: "retry" });

    expect(state.status).toBe("loading");
    expect(state.requestId).toBe(2);
    expect(state.pending).toBe("retry");
    expect(state.failure).toBeNull();
  });

  it("ignores every response for a superseded request", () => {
    const started = detailReducer(loaded(), { type: "load-start", requestId: 2, reason: "refresh" });
    const other = { ...REPORT, state: "rejected" as const };

    expect(
      detailReducer(started, { type: "load-done", requestId: 1, reason: "initial", report: other, clock: "10:01" }),
    ).toBe(started);
    expect(detailReducer(started, { type: "load-not-found", requestId: 1 })).toBe(started);
    expect(detailReducer(started, { type: "load-failed", requestId: 1, failure: UNAVAILABLE })).toBe(started);
    expect(detailReducer(initialDetailState, { type: "load-not-found", requestId: 7 })).toBe(initialDetailState);
  });
});

describe("detailReducer: Odśwież zgłoszenie", () => {
  it("load-start for a refresh keeps the report on screen", () => {
    const state = detailReducer(loaded(), { type: "load-start", requestId: 2, reason: "refresh" });

    expect(state.status).toBe("ready");
    expect(state.report).toEqual(REPORT);
    expect(state.pending).toBe("refresh");
    expect(state.requestId).toBe(2);
  });

  it("load-done for a refresh shows the new report, the clock and the announcement", () => {
    const started = detailReducer(loaded(), { type: "load-start", requestId: 2, reason: "refresh" });
    const changed = { ...REPORT, state: "rejected" as const };

    const state = detailReducer(started, {
      type: "load-done",
      requestId: 2,
      reason: "refresh",
      report: changed,
      clock: "10:05",
    });

    expect(state.status).toBe("ready");
    expect(state.report?.state).toBe("rejected");
    expect(state.pending).toBeNull();
    expect(state.refreshedAt).toBe("10:05");
    expect(state.announcement).toBe("Zgłoszenie odświeżone.");
  });

  it("a failed refresh keeps the report and sets the failure", () => {
    const started = detailReducer(loaded(), { type: "load-start", requestId: 2, reason: "refresh" });

    const state = detailReducer(started, { type: "load-failed", requestId: 2, failure: UNAVAILABLE });

    expect(state.status).toBe("ready");
    expect(state.report).toEqual(REPORT);
    expect(state.failure).toEqual(UNAVAILABLE);
    expect(state.pending).toBeNull();
  });

  it("a new refresh clears the previous failure and announcement", () => {
    let state = detailReducer(loaded(), { type: "load-start", requestId: 2, reason: "refresh" });
    state = detailReducer(state, { type: "load-done", requestId: 2, reason: "refresh", report: REPORT, clock: "10:05" });
    state = detailReducer(state, { type: "load-start", requestId: 3, reason: "refresh" });
    state = detailReducer(state, { type: "load-failed", requestId: 3, failure: UNAVAILABLE });

    state = detailReducer(state, { type: "load-start", requestId: 4, reason: "refresh" });

    expect(state.failure).toBeNull();
    expect(state.announcement).toBe("");
    expect(state.refreshedAt).toBe("10:05");
  });
});

describe("detailReducer: comments", () => {
  it("comment-added appends the comment and announces it", () => {
    const state = detailReducer(loaded(), { type: "comment-added", comment: COMMENT_A });

    expect(state.report?.comments).toEqual([COMMENT_A]);
    expect(state.report?.history).toEqual(REPORT.history);
    expect(state.announcement).toBe("Komentarz dodany.");
  });

  it("appends the same comment id only once", () => {
    let state = detailReducer(loaded(), { type: "comment-added", comment: COMMENT_A });
    state = detailReducer(state, { type: "comment-added", comment: COMMENT_A });

    expect(state.report?.comments).toEqual([COMMENT_A]);
  });

  it("comment-start clears the announcement so the next confirmation is announced again", () => {
    let state = detailReducer(loaded(), { type: "comment-added", comment: COMMENT_A });
    state = detailReducer(state, { type: "comment-start" });

    expect(state.announcement).toBe("");
    expect(state.report?.comments).toEqual([COMMENT_A]);
  });

  it("ignores a comment when no report is shown", () => {
    expect(detailReducer(initialDetailState, { type: "comment-added", comment: COMMENT_A })).toBe(initialDetailState);
  });

  it("keeps a confirmed comment that a refresh started earlier does not contain yet", () => {
    let state = detailReducer(loaded(), { type: "load-start", requestId: 2, reason: "refresh" });
    state = detailReducer(state, { type: "comment-added", comment: COMMENT_A });

    state = detailReducer(state, { type: "load-done", requestId: 2, reason: "refresh", report: REPORT, clock: "10:05" });

    expect(state.report?.comments.map((c) => c.id)).toEqual([COMMENT_A.id]);
  });

  it("does not carry comments over to another report", () => {
    let state = detailReducer(loaded(), { type: "comment-added", comment: COMMENT_A });
    state = detailReducer(state, { type: "load-start", requestId: 2, reason: "refresh" });
    const other = { ...REPORT, id: "00000000-0000-4000-8000-0000000d0003", comments: [] };

    state = detailReducer(state, { type: "load-done", requestId: 2, reason: "refresh", report: other, clock: "10:05" });

    expect(state.report?.comments).toEqual([]);
  });
});
