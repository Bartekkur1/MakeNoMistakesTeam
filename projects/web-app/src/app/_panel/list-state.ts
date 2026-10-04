// The report list's state machine, pure (no React), so vitest drives it directly.
// D-11: "Pokaż więcej zgłoszeń" appends the next page, taken with the cursor exactly as the API
// returned it, and moves focus to the first new row. D-14: "Odśwież listę" reloads from the first
// page by hand; nothing polls. Rows keep the API order (created_at desc, then id desc) and are never
// re-sorted here. Every request carries a requestId; a response for an older one is ignored, so rows
// of two filters never mix.

import {
  REPORT_STATES,
  TEACHER_VISIBLE_STATES,
  type AccountRole,
  type Report,
  type ReportListResponse,
  type ReportState,
} from "@/lib/contract/types";
import type { ApiFailure } from "./api";
import { LIST } from "./content";

export type ListLoadReason = "initial" | "retry" | "filter" | "refresh";

export interface ListState {
  requestId: number;
  filter: ReportState | null;
  reports: Report[];
  nextCursor: string | null;
  status: "loading" | "ready" | "error";
  pending: ListLoadReason | "more" | null;
  failure: ApiFailure | null;
  moreFailure: ApiFailure | null;
  refreshedAt: string | null;
  announcement: string;
  focusIndex: number | null;
}

export const initialListState: ListState = {
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
};

export type ListAction =
  | { type: "load-start"; requestId: number; reason: ListLoadReason; filter: ReportState | null }
  | { type: "load-done"; requestId: number; reason: ListLoadReason; page: ReportListResponse; clock: string }
  | { type: "load-failed"; requestId: number; failure: ApiFailure }
  | { type: "more-start" }
  | { type: "more-done"; requestId: number; page: ReportListResponse }
  | { type: "more-failed"; requestId: number; failure: ApiFailure };

// Appends the reports of the next page that are not listed yet, in the page's order.
function appendNew(current: Report[], next: Report[]): Report[] {
  const listed = new Set(current.map((report) => report.id));
  return [...current, ...next.filter((report) => !listed.has(report.id))];
}

export function listReducer(state: ListState, action: ListAction): ListState {
  switch (action.type) {
    // A first-page load (initial, retry, filter change or refresh). Loaded rows stay visible while
    // it runs; without rows the skeleton shows.
    case "load-start":
      return {
        ...state,
        requestId: action.requestId,
        filter: action.filter,
        pending: action.reason,
        status: state.reports.length === 0 ? "loading" : state.status,
        failure: null,
        moreFailure: null,
        announcement: "",
        focusIndex: null,
      };

    // The first page replaces every row, so pages added by "Pokaż więcej zgłoszeń" are dropped.
    case "load-done": {
      if (action.requestId !== state.requestId) return state;
      const refreshed = action.reason === "refresh";
      return {
        ...state,
        reports: action.page.reports,
        nextCursor: action.page.next_cursor,
        status: "ready",
        pending: null,
        failure: null,
        focusIndex: null,
        refreshedAt: refreshed ? action.clock : state.refreshedAt,
        announcement: refreshed ? LIST.refreshedAnnouncement : "",
      };
    }

    // Without rows the page shows the error; with rows they stay and the alert sits above them.
    // A failed filter change is the exception: the shown rows and the cursor belong to the previous
    // filter while the select already shows the new one, so they are dropped and "Spróbuj ponownie"
    // retries the chosen filter. Otherwise "Pokaż więcej zgłoszeń" would mix two filters.
    case "load-failed": {
      if (action.requestId !== state.requestId) return state;
      const filterFailed = state.pending === "filter";
      const reports = filterFailed ? [] : state.reports;
      return {
        ...state,
        reports,
        nextCursor: filterFailed ? null : state.nextCursor,
        pending: null,
        failure: action.failure,
        status: reports.length === 0 ? "error" : "ready",
      };
    }

    // The announcement is cleared so the same message after the next page is announced again.
    case "more-start":
      return { ...state, pending: "more", moreFailure: null, announcement: "" };

    case "more-done": {
      if (action.requestId !== state.requestId) return state;
      const reports = appendNew(state.reports, action.page.reports);
      const appended = reports.length > state.reports.length;
      return {
        ...state,
        reports,
        nextCursor: action.page.next_cursor,
        pending: null,
        focusIndex: appended ? state.reports.length : null,
        announcement: LIST.moreAnnouncement,
      };
    }

    case "more-failed":
      if (action.requestId !== state.requestId) return state;
      return { ...state, pending: null, moreFailure: action.failure };
  }
}

// The states the "Stan" filter offers (D-09): a parent sees every state, a teacher only the states
// a teacher can see, so the filter never offers a choice that is always empty.
export function filterStatesFor(role: AccountRole): readonly ReportState[] {
  return role === "teacher" ? TEACHER_VISIBLE_STATES : REPORT_STATES;
}
