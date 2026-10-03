// The report detail's state machine, pure (no React), so vitest drives it directly. Mirrors
// list-state.ts: every load carries a requestId and a response for any other id is ignored.
// D-14: "Odśwież zgłoszenie" reloads by hand and the current view stays while it runs; nothing
// polls. A 404 replaces the page with the not-found view (the report is gone or no longer visible).

import type { ReportComment, ReportDetail } from "@/lib/contract/types";
import type { ApiFailure } from "./api";
import { COMMENT, DETAIL } from "./content";

export type DetailLoadReason = "initial" | "retry" | "refresh";

export interface DetailState {
  requestId: number;
  status: "loading" | "ready" | "not_found" | "error";
  report: ReportDetail | null;
  pending: DetailLoadReason | null;
  failure: ApiFailure | null;
  refreshedAt: string | null;
  announcement: string;
}

export const initialDetailState: DetailState = {
  requestId: 1,
  status: "loading",
  report: null,
  pending: "initial",
  failure: null,
  refreshedAt: null,
  announcement: "",
};

export type DetailAction =
  | { type: "load-start"; requestId: number; reason: DetailLoadReason }
  | { type: "load-done"; requestId: number; reason: DetailLoadReason; report: ReportDetail; clock: string }
  | { type: "load-not-found"; requestId: number }
  | { type: "load-failed"; requestId: number; failure: ApiFailure }
  | { type: "comment-start" }
  | { type: "comment-added"; comment: ReportComment };

export function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    // A loaded report stays on screen while it reloads; without one the skeleton shows.
    case "load-start":
      return {
        ...state,
        requestId: action.requestId,
        pending: action.reason,
        status: state.report === null ? "loading" : state.status,
        failure: null,
        announcement: "",
      };

    case "load-done": {
      if (action.requestId !== state.requestId) return state;
      const refreshed = action.reason === "refresh";
      return {
        ...state,
        status: "ready",
        report: keepShownComments(state.report, action.report),
        pending: null,
        failure: null,
        refreshedAt: refreshed ? action.clock : state.refreshedAt,
        announcement: refreshed ? DETAIL.refreshedAnnouncement : "",
      };
    }

    case "load-not-found":
      if (action.requestId !== state.requestId) return state;
      return { ...state, status: "not_found", report: null, pending: null, failure: null };

    // Without a report the page shows the error; with one it stays and the alert sits above it.
    case "load-failed":
      if (action.requestId !== state.requestId) return state;
      return {
        ...state,
        pending: null,
        failure: action.failure,
        status: state.report === null ? "error" : "ready",
      };

    // Clears the last announcement, so "Komentarz dodany." is announced again for the next comment.
    case "comment-start":
      return { ...state, announcement: "" };

    // The comment the server confirmed (201) joins the timeline; the same id is added only once.
    case "comment-added": {
      const { report } = state;
      if (report === null) return state;
      if (report.comments.some((comment) => comment.id === action.comment.id)) return state;
      return {
        ...state,
        report: { ...report, comments: [...report.comments, action.comment] },
        announcement: COMMENT.added,
      };
    }
  }
}

// Comments are append-only, so a comment the view already showed still exists. A reload that
// started before that comment was saved does not contain it yet; it is kept instead of vanishing
// (which would invite sending it again).
function keepShownComments(previous: ReportDetail | null, next: ReportDetail): ReportDetail {
  if (previous === null || previous.id !== next.id) return next;
  const known = new Set(next.comments.map((comment) => comment.id));
  const missing = previous.comments.filter((comment) => !known.has(comment.id));
  return missing.length === 0 ? next : { ...next, comments: [...next.comments, ...missing] };
}
