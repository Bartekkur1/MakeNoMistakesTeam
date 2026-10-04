// The report detail's state machine, pure (no React), so vitest drives it directly. Mirrors
// list-state.ts: every load carries a requestId and a response for any other id is ignored.
// D-14: "Odśwież zgłoszenie" reloads by hand and the current view stays while it runs; nothing
// polls. A 404 replaces the page with the not-found view (the report is gone or no longer visible).
// After a confirmed transition (D-12) a quiet "sync" refetch brings the detail up to date.

import {
  REPORT_STATE_LABELS_PL,
  type ReportComment,
  type ReportDetail,
  type ReportState,
  type TransitionResponse,
} from "@/lib/contract/types";
import type { ApiFailure } from "./api";
import { ACTIONS_CARD, COMMENT, COMMENT_DELETE, DETAIL } from "./content";
import { fillTemplate } from "./format";

export type DetailLoadReason = "initial" | "retry" | "refresh" | "sync";

export interface DetailState {
  requestId: number;
  status: "loading" | "ready" | "not_found" | "error";
  report: ReportDetail | null;
  pending: DetailLoadReason | null;
  failure: ApiFailure | null;
  refreshedAt: string | null;
  announcement: string;
  success: ReportState | null;
  conflict: { noteMoved: boolean } | null;
  // Comments this view added that no reload has returned yet (see keepShownComments).
  unloadedCommentIds: readonly string[];
  // Comments this view deleted; a reload that started before the delete must not bring them back.
  deletedCommentIds: readonly string[];
}

export const initialDetailState: DetailState = {
  requestId: 1,
  status: "loading",
  report: null,
  pending: "initial",
  failure: null,
  refreshedAt: null,
  announcement: "",
  success: null,
  conflict: null,
  unloadedCommentIds: [],
  deletedCommentIds: [],
};

export type DetailAction =
  | { type: "load-start"; requestId: number; reason: DetailLoadReason }
  | { type: "load-done"; requestId: number; reason: DetailLoadReason; report: ReportDetail; clock: string }
  | { type: "load-not-found"; requestId: number }
  | { type: "load-failed"; requestId: number; failure: ApiFailure }
  | { type: "comment-start" }
  | { type: "comment-added"; comment: ReportComment }
  | { type: "comment-deleted"; commentId: string }
  | { type: "transition-done"; response: TransitionResponse }
  | { type: "transition-confirmed"; state: ReportState }
  | { type: "conflict"; noteMoved: boolean };

export function detailReducer(state: DetailState, action: DetailAction): DetailState {
  switch (action.type) {
    // A loaded report stays on screen while it reloads; without one the skeleton shows. A "sync"
    // (the quiet refetch after a transition) keeps the saved confirmation, the conflict banner and
    // the announcement; a refresh or a retry clears them.
    case "load-start": {
      const quiet = action.reason === "sync";
      return {
        ...state,
        requestId: action.requestId,
        pending: action.reason,
        status: state.report === null ? "loading" : state.status,
        failure: null,
        announcement: quiet ? state.announcement : "",
        success: quiet ? state.success : null,
        conflict: quiet ? state.conflict : null,
      };
    }

    case "load-done": {
      if (action.requestId !== state.requestId) return state;
      const refreshed = action.reason === "refresh";
      const quiet = action.reason === "sync";
      const report = keepShownComments(state, action.report);
      const loadedIds = new Set(action.report.comments.map((comment) => comment.id));
      return {
        ...state,
        status: "ready",
        report,
        unloadedCommentIds: report.id === state.report?.id ? state.unloadedCommentIds.filter((id) => !loadedIds.has(id)) : [],
        deletedCommentIds: report.id === state.report?.id ? state.deletedCommentIds : [],
        pending: null,
        failure: null,
        refreshedAt: refreshed ? action.clock : state.refreshedAt,
        announcement: refreshed ? DETAIL.refreshedAnnouncement : quiet ? state.announcement : "",
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
        unloadedCommentIds: [...state.unloadedCommentIds, action.comment.id],
        announcement: COMMENT.added,
      };
    }

    // The server confirmed the delete (204): the comment leaves the timeline and stays gone.
    case "comment-deleted": {
      const { report } = state;
      if (report === null) return state;
      return {
        ...state,
        report: { ...report, comments: report.comments.filter((comment) => comment.id !== action.commentId) },
        unloadedCommentIds: state.unloadedCommentIds.filter((id) => id !== action.commentId),
        deletedCommentIds: [...state.deletedCommentIds, action.commentId],
        announcement: COMMENT_DELETE.deleted,
      };
    }

    // The transition the server confirmed (201): its report fields replace the shown ones, its
    // history entry joins the timeline once, and the card shows "Zapisano. Obecny stan: …".
    case "transition-done": {
      const { report } = state;
      const { response } = action;
      if (report === null || report.id !== response.report.id) return state;
      const known = report.history.some((entry) => entry.id === response.entry.id);
      return {
        ...state,
        report: {
          ...report,
          ...response.report,
          history: known ? report.history : [...report.history, response.entry],
          comments: report.comments,
        },
        success: response.report.state,
        conflict: null,
        announcement: fillTemplate(ACTIONS_CARD.success, { state: REPORT_STATE_LABELS_PL[response.report.state] }),
      };
    }

    // A retry answered 409, but the refetched history shows the user's earlier attempt was saved
    // and only its 201 was lost (WR-02). The sync refetch brings the report; this shows the same
    // confirmation as a 201 would have.
    case "transition-confirmed":
      return {
        ...state,
        success: action.state,
        conflict: null,
        announcement: fillTemplate(ACTIONS_CARD.success, { state: REPORT_STATE_LABELS_PL[action.state] }),
      };

    // D-15: the report changed in the meantime. The banner itself is a status region, so the page
    // announcement is cleared; a sync refetch follows so the buttons match the new state.
    case "conflict":
      return { ...state, conflict: { noteMoved: action.noteMoved }, success: null, announcement: "" };
  }
}

// A reload that started before this view's comment was saved does not contain it yet; that comment
// is kept instead of vanishing (which would invite sending it again). Only comments this view added
// and no reload has returned yet are kept: any other comment missing from a reload was deleted by
// its author. A reload that started before this view's delete may still contain the deleted comment;
// it is dropped.
function keepShownComments(state: DetailState, next: ReportDetail): ReportDetail {
  const previous = state.report;
  if (previous === null || previous.id !== next.id) return next;
  const deleted = new Set(state.deletedCommentIds);
  const unloaded = new Set(state.unloadedCommentIds);
  const known = new Set(next.comments.map((comment) => comment.id));
  const kept = next.comments.filter((comment) => !deleted.has(comment.id));
  const missing = previous.comments.filter((comment) => !known.has(comment.id) && unloaded.has(comment.id));
  if (missing.length === 0 && kept.length === next.comments.length) return next;
  return { ...next, comments: [...kept, ...missing] };
}
