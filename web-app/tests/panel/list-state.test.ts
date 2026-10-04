// The list state machine (D-09, D-11, D-14), pure: the first page replaces the rows, "Pokaż więcej
// zgłoszeń" appends the next page without duplicates and moves focus to the first new row, a failed
// "more" keeps the rows, a filter change or refresh keeps the old rows visible until the new page
// arrives, and a response that belongs to a superseded request is ignored.

import { describe, expect, it } from "vitest";
import type { ApiFailure } from "@/app/_panel/api";
import { LIST } from "@/app/_panel/content";
import { filterStatesFor, initialListState, listReducer, type ListState } from "@/app/_panel/list-state";
import { REPORT_STATES, TEACHER_VISIBLE_STATES, type Report, type ReportListResponse } from "@/lib/contract/types";
import { loadDemoDataset } from "../helpers/dataset";

const dataset = loadDemoDataset().reports as unknown as Report[];

function report(n: number): Report {
  const found = dataset.find((row) => row.id === `00000000-0000-4000-8000-0000000d000${n}`);
  if (!found) throw new Error(`R${n} missing from the demo dataset`);
  return found;
}

function page(numbers: number[], nextCursor: string | null = null): ReportListResponse {
  return { reports: numbers.map(report), next_cursor: nextCursor };
}

function ids(state: ListState): string[] {
  return state.reports.map((row) => row.id);
}

const unavailable: ApiFailure = {
  ok: false,
  kind: "http",
  status: 503,
  code: "storage_unavailable",
  message: "unavailable",
  details: [],
};

// A ready list holding R3 and R2 with a cursor to the next page.
function readyWithTwo(): ListState {
  return listReducer(initialListState, {
    type: "load-done",
    requestId: initialListState.requestId,
    reason: "initial",
    page: page([3, 2], "cursor-after-r2"),
    clock: "10:00",
  });
}

describe("listReducer: first page and 'Pokaż więcej zgłoszeń'", () => {
  it("starts loading the first page with no rows", () => {
    expect(initialListState).toMatchObject({
      requestId: 1,
      filter: null,
      reports: [],
      nextCursor: null,
      status: "loading",
      pending: "initial",
      failure: null,
      moreFailure: null,
      refreshedAt: null,
      announcement: "",
      focusIndex: null,
    });
  });

  it("load-done for the initial load fills the rows and the cursor and leaves focus alone", () => {
    const state = readyWithTwo();

    expect(ids(state)).toEqual([report(3).id, report(2).id]);
    expect(state.nextCursor).toBe("cursor-after-r2");
    expect(state.status).toBe("ready");
    expect(state.pending).toBeNull();
    expect(state.failure).toBeNull();
    expect(state.focusIndex).toBeNull();
  });

  it("more-start sets pending 'more' and clears an earlier more failure", () => {
    const failed: ListState = { ...readyWithTwo(), moreFailure: unavailable };

    const state = listReducer(failed, { type: "more-start" });

    expect(state.pending).toBe("more");
    expect(state.moreFailure).toBeNull();
    expect(ids(state)).toEqual(ids(failed));
  });

  it("more-done appends the next page, takes its cursor, focuses the first new row and announces it", () => {
    const started = listReducer(readyWithTwo(), { type: "more-start" });

    const state = listReducer(started, { type: "more-done", requestId: started.requestId, page: page([1]) });

    expect(ids(state)).toEqual([report(3).id, report(2).id, report(1).id]);
    expect(state.nextCursor).toBeNull();
    expect(state.pending).toBeNull();
    expect(state.focusIndex).toBe(2);
    expect(state.announcement).toBe(LIST.moreAnnouncement);
  });

  it("more-done appends only ids that are not listed yet", () => {
    const started = listReducer(readyWithTwo(), { type: "more-start" });

    const state = listReducer(started, { type: "more-done", requestId: started.requestId, page: page([2, 1]) });

    expect(ids(state)).toEqual([report(3).id, report(2).id, report(1).id]);
    expect(state.focusIndex).toBe(2);
  });

  it("more-done that brings nothing new moves no focus", () => {
    const started = listReducer(readyWithTwo(), { type: "more-start" });

    const state = listReducer(started, { type: "more-done", requestId: started.requestId, page: page([2]) });

    expect(ids(state)).toEqual([report(3).id, report(2).id]);
    expect(state.focusIndex).toBeNull();
    expect(state.pending).toBeNull();
  });

  it("ignores more-done and more-failed from a superseded request", () => {
    const started = listReducer(readyWithTwo(), { type: "more-start" });
    const stale = started.requestId + 1;

    expect(listReducer(started, { type: "more-done", requestId: stale, page: page([1]) })).toBe(started);
    expect(listReducer(started, { type: "more-failed", requestId: stale, failure: unavailable })).toBe(started);
  });

  it("more-failed keeps the loaded rows, stores the failure and clears pending", () => {
    const started = listReducer(readyWithTwo(), { type: "more-start" });

    const state = listReducer(started, { type: "more-failed", requestId: started.requestId, failure: unavailable });

    expect(ids(state)).toEqual([report(3).id, report(2).id]);
    expect(state.moreFailure).toBe(unavailable);
    expect(state.pending).toBeNull();
    expect(state.status).toBe("ready");
    expect(state.nextCursor).toBe("cursor-after-r2");
  });

  it("load-done replaces the rows, dropping pages appended earlier, and clears focus", () => {
    const started = listReducer(readyWithTwo(), { type: "more-start" });
    const appended = listReducer(started, { type: "more-done", requestId: started.requestId, page: page([1]) });
    expect(appended.focusIndex).toBe(2);

    const state = listReducer(appended, {
      type: "load-done",
      requestId: appended.requestId,
      reason: "initial",
      page: page([3], "cursor-after-r3"),
      clock: "10:05",
    });

    expect(ids(state)).toEqual([report(3).id]);
    expect(state.nextCursor).toBe("cursor-after-r3");
    expect(state.focusIndex).toBeNull();
  });
});

describe("listReducer: filter, refresh, retry and failures", () => {
  it("load-start for a filter keeps the rows visible and clears earlier failures", () => {
    const shown: ListState = {
      ...readyWithTwo(),
      failure: unavailable,
      moreFailure: unavailable,
      announcement: LIST.moreAnnouncement,
      focusIndex: 1,
    };

    const state = listReducer(shown, { type: "load-start", requestId: 2, reason: "filter", filter: "closed" });

    expect(ids(state)).toEqual([report(3).id, report(2).id]);
    expect(state.status).toBe("ready");
    expect(state.pending).toBe("filter");
    expect(state.filter).toBe("closed");
    expect(state.requestId).toBe(2);
    expect(state.failure).toBeNull();
    expect(state.moreFailure).toBeNull();
    expect(state.announcement).toBe("");
    expect(state.focusIndex).toBeNull();
  });

  it("load-start for a retry without rows shows the loading state again", () => {
    const failed = listReducer(initialListState, {
      type: "load-failed",
      requestId: initialListState.requestId,
      failure: unavailable,
    });
    expect(failed.status).toBe("error");

    const state = listReducer(failed, { type: "load-start", requestId: 2, reason: "retry", filter: null });

    expect(state.status).toBe("loading");
    expect(state.pending).toBe("retry");
    expect(state.failure).toBeNull();
  });

  it("load-done after a refresh stores the clock time and announces the refresh", () => {
    const started = listReducer(readyWithTwo(), { type: "load-start", requestId: 2, reason: "refresh", filter: null });

    const state = listReducer(started, {
      type: "load-done",
      requestId: 2,
      reason: "refresh",
      page: page([3, 2, 1]),
      clock: "10:05",
    });

    expect(state.refreshedAt).toBe("10:05");
    expect(state.announcement).toBe(LIST.refreshedAnnouncement);
    expect(ids(state)).toEqual([report(3).id, report(2).id, report(1).id]);
    expect(state.pending).toBeNull();
  });

  it("load-done after a filter change keeps the refresh time and announces nothing", () => {
    const refreshed: ListState = { ...readyWithTwo(), refreshedAt: "09:30" };
    const started = listReducer(refreshed, { type: "load-start", requestId: 2, reason: "filter", filter: "closed" });

    const state = listReducer(started, {
      type: "load-done",
      requestId: 2,
      reason: "filter",
      page: page([2]),
      clock: "10:05",
    });

    expect(state.refreshedAt).toBe("09:30");
    expect(state.announcement).toBe("");
    expect(ids(state)).toEqual([report(2).id]);
    expect(state.filter).toBe("closed");
  });

  it("ignores load-done and load-failed from a superseded filter or refresh", () => {
    const first = listReducer(readyWithTwo(), { type: "load-start", requestId: 2, reason: "filter", filter: "closed" });
    const newer = listReducer(first, { type: "load-start", requestId: 3, reason: "filter", filter: "rejected" });

    expect(
      listReducer(newer, { type: "load-done", requestId: 2, reason: "filter", page: page([2]), clock: "10:05" }),
    ).toBe(newer);
    expect(listReducer(newer, { type: "load-failed", requestId: 2, failure: unavailable })).toBe(newer);
  });

  it("load-failed without rows is an error state", () => {
    const state = listReducer(initialListState, {
      type: "load-failed",
      requestId: initialListState.requestId,
      failure: unavailable,
    });

    expect(state.status).toBe("error");
    expect(state.failure).toBe(unavailable);
    expect(state.pending).toBeNull();
  });

  it("load-failed with rows keeps them and stores the failure", () => {
    const started = listReducer(readyWithTwo(), { type: "load-start", requestId: 2, reason: "refresh", filter: null });

    const state = listReducer(started, { type: "load-failed", requestId: 2, failure: unavailable });

    expect(state.status).toBe("ready");
    expect(ids(state)).toEqual([report(3).id, report(2).id]);
    expect(state.failure).toBe(unavailable);
    expect(state.pending).toBeNull();
  });

  it("a failed filter change drops the old filter's rows and cursor, so two filters never mix (WR-01)", () => {
    const started = listReducer(readyWithTwo(), { type: "load-start", requestId: 2, reason: "filter", filter: "closed" });

    const state = listReducer(started, { type: "load-failed", requestId: 2, failure: unavailable });

    expect(state.filter).toBe("closed");
    expect(state.reports).toEqual([]);
    expect(state.nextCursor).toBeNull();
    expect(state.status).toBe("error");
    expect(state.failure).toBe(unavailable);
    expect(state.pending).toBeNull();
  });

  it("offers a parent all states and a teacher only the teacher-visible ones", () => {
    expect(filterStatesFor("parent")).toEqual(REPORT_STATES);
    expect(filterStatesFor("teacher")).toEqual(TEACHER_VISIBLE_STATES);
  });
});
