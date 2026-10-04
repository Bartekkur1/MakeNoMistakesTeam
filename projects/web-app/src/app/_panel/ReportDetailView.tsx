"use client";

// The /panel/[id] report detail (PAN-02 read through D-04): the attack type as the heading, the
// state and risk badges, the full message as plain text with its metadata, what the child already
// did with the risky actions highlighted, and one timeline of state changes and comments (D-13).
// "Odśwież zgłoszenie" reloads by hand (D-14). Under the timeline the parent and the teacher write
// to each other (D-03); a comment appears only after the server confirmed it. The "Zmień stan"
// card (D-12) offers only the actions this role can take now; after a 409 (D-15) a warning banner
// explains that the report changed and an unsent note moves into the comment field. An id that is
// not a UUID shows the not-found view without any request (T-02-12); a 404 shows it too (the
// report is gone or no longer visible). A 401 ends the session with the session-expired banner
// (D-07); any other failure shows the contract message with "Spróbuj ponownie". The state lives in
// detailReducer (detail-state.ts); every request carries a request id so a superseded response is
// ignored.

import Link from "next/link";
import { useEffect, useReducer, useRef, useState, type Dispatch } from "react";
import { buttonSmall, textLink } from "@/app/_landing/styles";
import {
  API_ERROR_MESSAGES_PL,
  ATTACK_TYPE_LABELS_PL,
  type ReportDetail,
  type TransitionResponse,
} from "@/lib/contract/types";
import { errorMessage, fetchReport, isUnauthorized, type ApiResult } from "./api";
import { RiskBadge, StateBadge } from "./badges";
import { CommentForm } from "./CommentForm";
import { ACTIONS_CARD, DETAIL, ERRORS, PANEL_HREF } from "./content";
import { detailReducer, initialDetailState, type DetailAction, type DetailLoadReason } from "./detail-state";
import {
  capitalize,
  childName,
  fillTemplate,
  formatClock,
  isReportId,
  mergeDraft,
  retriedConflict,
  transitionComment,
  type RetriedConflict,
  type UnconfirmedAttempt,
} from "./format";
import { useCurrentSession } from "./PanelShell";
import { ReportActionsCard } from "./ReportActionsCard";
import { ReportContentCard, TakenActionsCard } from "./ReportCards";
import { expireSession, type PanelSession } from "./session";
import { TimelineCard } from "./Timeline";
import { alertError, alertWarning, card, secondaryButton, skeletonBlock } from "./styles";

const SKELETON_CARDS = [0, 1, 2];

// Turns a detail response into the reducer action. Runs in the promise continuation, so reading
// the clock here is not a render-time read.
function settleLoad(
  result: ApiResult<ReportDetail>,
  token: string,
  requestId: number,
  reason: DetailLoadReason,
  dispatch: Dispatch<DetailAction>,
): void {
  if (isUnauthorized(result)) {
    // The shell sees the cleared session and sends the visitor to /login with the banner. Only
    // this token's session ends; a newer login is left alone.
    expireSession(token);
    return;
  }
  if (!result.ok) {
    if (result.kind === "http" && result.code === "report_not_found") {
      dispatch({ type: "load-not-found", requestId });
      return;
    }
    dispatch({ type: "load-failed", requestId, failure: result });
    return;
  }
  dispatch({ type: "load-done", requestId, reason, report: result.value, clock: formatClock(new Date()) });
}

export function ReportDetailView({ id }: { id: string }) {
  const session = useCurrentSession();
  // A login in another tab replaces the shared session (UI-SPEC A7); a new token or another report
  // starts a fresh detail, so nothing of the previous account or report stays on screen.
  return <ReportDetailPage key={`${session.token}:${id}`} id={id} session={session} />;
}

function BackLink() {
  return (
    <Link href={PANEL_HREF} className={textLink}>
      <span aria-hidden="true">←</span> {DETAIL.back}
    </Link>
  );
}

function NotFound() {
  return (
    <>
      <h1 className="font-display text-2xl font-semibold leading-tight">{API_ERROR_MESSAGES_PL.report_not_found}</h1>
      <p className="mt-2 text-base text-muted-slate">{DETAIL.notFoundBody}</p>
      <p className="mt-6">
        <BackLink />
      </p>
    </>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6">
      <p className="sr-only">{DETAIL.loading}</p>
      {SKELETON_CARDS.map((index) => (
        <div key={index} aria-hidden="true" className={`${card} p-6`}>
          <div className={`${skeletonBlock} h-6 w-48`} />
          <div className={`${skeletonBlock} mt-4 h-5 w-full`} />
          <div className={`${skeletonBlock} mt-2 h-5 w-2/3`} />
        </div>
      ))}
    </div>
  );
}

function ReportDetailPage({ id, session }: { id: string; session: PanelSession }) {
  const [state, dispatch] = useReducer(detailReducer, initialDetailState);
  // The last request id handed out; handlers take the next one (the first load uses state's 1).
  const lastRequestId = useRef(initialDetailState.requestId);
  // The unsent comment lives here, not in the form: a refresh never touches it, and an unsent
  // transition note moves into it after a 409.
  const [draft, setDraft] = useState("");
  const validId = isReportId(id);

  useEffect(() => {
    if (!validId) return;
    let ignore = false;
    const requestId = initialDetailState.requestId;
    fetchReport(session.token, id).then((result) => {
      if (ignore) return;
      settleLoad(result, session.token, requestId, "initial", dispatch);
    });
    return () => {
      ignore = true;
    };
  }, [session.token, id, validId]);

  // Every load after the first one: retry after an error, "Odśwież zgłoszenie" (D-14) and the
  // quiet sync after a transition. The current view stays until the new detail arrives; nothing
  // reloads on a timer.
  function load(reason: DetailLoadReason) {
    lastRequestId.current += 1;
    const requestId = lastRequestId.current;
    dispatch({ type: "load-start", requestId, reason });
    fetchReport(session.token, id).then((result) => settleLoad(result, session.token, requestId, reason, dispatch));
  }

  // After a confirmed transition (D-12): show the saved state at once, then quietly refetch so the
  // timeline and the buttons match the server.
  function transitionDone(response: TransitionResponse) {
    dispatch({ type: "transition-done", response });
    load("sync");
  }

  // D-15: the report changed in the meantime (409). A typed note is not lost: it moves, unsent,
  // into the new-comment field. The banner explains it and the refetch brings the current state.
  function showConflict(note: string) {
    const noteMoved = note.trim() !== "";
    if (noteMoved) setDraft((current) => mergeDraft(current, note));
    dispatch({ type: "conflict", noteMoved });
  }

  // A 409 after an attempt whose result stayed unknown may answer the user's own earlier attempt
  // that was saved while its 201 was lost (WR-02). The quiet refetch decides before anything is
  // shown: a saved attempt gets the saved confirmation and its note stays where it is (in the
  // history), so the user is not told to send it again; otherwise it is the usual conflict.
  function transitionConflict(note: string, attempt: UnconfirmedAttempt | null) {
    if (attempt === null) {
      showConflict(note);
      load("sync");
      return;
    }
    const knownEntryIds = new Set(state.report?.history.map((entry) => entry.id) ?? []);
    lastRequestId.current += 1;
    const requestId = lastRequestId.current;
    dispatch({ type: "load-start", requestId, reason: "sync" });
    fetchReport(session.token, id).then((result) => {
      const outcome: RetriedConflict = result.ok
        ? retriedConflict(result.value, knownEntryIds, attempt, session.account.id)
        : { kind: "conflict" };
      if (outcome.kind === "conflict") {
        showConflict(note);
      } else {
        // A different note typed for the retry was never sent: it moves into the comment field.
        const unsent = outcome.entry.comment === transitionComment(note) ? "" : note;
        const noteMoved = unsent.trim() !== "";
        if (noteMoved) setDraft((current) => mergeDraft(current, unsent));
        if (outcome.kind === "saved") {
          dispatch({ type: "transition-confirmed", state: outcome.entry.to_state });
        } else {
          dispatch({ type: "conflict", noteMoved });
        }
      }
      settleLoad(result, session.token, requestId, "sync", dispatch);
    });
  }

  const busy = state.pending !== null;
  const notFound = !validId || state.status === "not_found";
  const report = state.report;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
      <p role="status" className="sr-only">
        {state.announcement}
      </p>

      {notFound ? (
        <NotFound />
      ) : (
        <>
          <p className="mb-6">
            <BackLink />
          </p>

          <div role="status">
            {state.conflict !== null ? (
              <div className={`${alertWarning} mb-6`}>
                <p>{ACTIONS_CARD.conflict}</p>
                {state.conflict.noteMoved ? <p className="mt-2">{ACTIONS_CARD.conflictNoteMoved}</p> : null}
              </div>
            ) : null}
          </div>

          {state.status === "loading" ? <DetailSkeleton /> : null}

          {state.status === "error" && state.failure ? (
            <div role="alert" className={`${alertError} flex flex-wrap items-center justify-between gap-4`}>
              <p>{errorMessage(state.failure)}</p>
              <button
                type="button"
                className={`${secondaryButton} ${buttonSmall}`}
                onClick={() => load("retry")}
                disabled={busy}
              >
                {ERRORS.retry}
              </button>
            </div>
          ) : null}

          {state.status === "ready" && report ? (
            <>
              <h1 className="font-display text-2xl font-semibold leading-tight [overflow-wrap:anywhere]">
                {capitalize(ATTACK_TYPE_LABELS_PL[report.attack_type])}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <StateBadge state={report.state} />
                <RiskBadge actions={report.taken_actions} />
                <div className="flex w-full flex-wrap items-center gap-4 md:ml-auto md:w-auto">
                  {state.refreshedAt !== null ? (
                    <p className="text-sm text-muted-slate">{fillTemplate(DETAIL.refreshed, { time: state.refreshedAt })}</p>
                  ) : null}
                  <button
                    type="button"
                    className={`${secondaryButton} ${buttonSmall}`}
                    onClick={() => load("refresh")}
                    disabled={busy}
                  >
                    {state.pending === "refresh" ? DETAIL.refreshPending : DETAIL.refresh}
                  </button>
                </div>
              </div>

              {state.failure ? (
                <div role="alert" className={`${alertError} mt-6 flex flex-wrap items-center justify-between gap-4`}>
                  <p>{errorMessage(state.failure)}</p>
                  <button
                    type="button"
                    className={`${secondaryButton} ${buttonSmall}`}
                    onClick={() => load("refresh")}
                    disabled={busy}
                  >
                    {ERRORS.retry}
                  </button>
                </div>
              ) : null}

              <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
                <ReportContentCard report={report} childLabel={childName(report.child_id, session.children)} />
                <TakenActionsCard actions={report.taken_actions} />
                <ReportActionsCard
                  report={report}
                  role={session.account.role}
                  token={session.token}
                  success={state.success}
                  onDone={transitionDone}
                  onConflict={transitionConflict}
                  onNotFound={() => dispatch({ type: "load-not-found", requestId: lastRequestId.current })}
                />
                <TimelineCard report={report} sessionChildren={session.children} ownAccountId={session.account.id}>
                  <CommentForm
                    reportId={report.id}
                    token={session.token}
                    draft={draft}
                    onDraftChange={setDraft}
                    onSubmitStart={() => dispatch({ type: "comment-start" })}
                    onAdded={(comment) => dispatch({ type: "comment-added", comment })}
                    onNotFound={() => dispatch({ type: "load-not-found", requestId: lastRequestId.current })}
                  />
                </TimelineCard>
              </div>
            </>
          ) : null}
        </>
      )}
    </main>
  );
}
