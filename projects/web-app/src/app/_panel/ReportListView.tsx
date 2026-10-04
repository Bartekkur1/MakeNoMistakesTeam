"use client";

// The /panel list page (PAN-01, D-09, D-10, D-11, D-14): the account's own reports in the order
// the API returns them (newest first; the panel never re-sorts). The "Stan" filter and "Odśwież
// listę" reload from the first page and keep the old rows visible until the new page arrives.
// "Pokaż więcej zgłoszeń" appends the next page with the cursor passed back verbatim and moves focus
// to the first new row. Nothing polls (D-14). A 401 ends the session with the session-expired
// banner (D-07); any other failure shows the contract message. The list state lives in listReducer
// (list-state.ts); every request carries a request id so a superseded response is ignored.

import { useEffect, useId, useReducer, useRef, type ChangeEvent } from "react";
import { buttonLarge, buttonSmall } from "@/app/_landing/styles";
import { LIMITS, REPORT_STATE_LABELS_PL, type ReportState } from "@/lib/contract/types";
import { errorMessage, fetchReports, isUnauthorized } from "./api";
import { ERRORS, LIST } from "./content";
import { capitalize, fillTemplate, formatClock } from "./format";
import { filterStatesFor, initialListState, listReducer, type ListLoadReason } from "./list-state";
import { useCurrentSession } from "./PanelShell";
import { ReportRow } from "./ReportRow";
import { RobloxAccountCard } from "./RobloxAccountCard";
import { expireSession, type PanelSession } from "./session";
import { alertError, card, secondaryButton, selectBase, skeletonBlock } from "./styles";

const SKELETON_ROWS = [0, 1, 2];

export function ReportListView() {
  const session = useCurrentSession();
  // A login in another tab replaces the shared session (UI-SPEC A7); a new token starts a fresh
  // list, so rows of the previous account never stay on screen.
  return <ReportList key={session.token} session={session} />;
}

function ReportList({ session }: { session: PanelSession }) {
  const [state, dispatch] = useReducer(listReducer, initialListState);
  // The last request id handed out; handlers take the next one (the first page uses state's 1).
  const lastRequestId = useRef(initialListState.requestId);
  const listRef = useRef<HTMLUListElement>(null);
  const filterId = useId();
  const role = session.account.role;
  const filterStates = filterStatesFor(role);

  useEffect(() => {
    let ignore = false;
    const requestId = initialListState.requestId;
    fetchReports(session.token, { limit: LIMITS.pageDefault }).then((result) => {
      if (ignore) return;
      if (isUnauthorized(result)) {
        // The shell sees the cleared session and sends the visitor to /login with the banner.
        expireSession(session.token);
        return;
      }
      if (!result.ok) {
        dispatch({ type: "load-failed", requestId, failure: result });
        return;
      }
      dispatch({ type: "load-done", requestId, reason: "initial", page: result.value, clock: formatClock(new Date()) });
    });
    return () => {
      ignore = true;
    };
  }, [session.token]);

  // After "Pokaż więcej zgłoszeń" the first newly added row link takes the focus.
  useEffect(() => {
    if (state.focusIndex === null) return;
    const links = listRef.current?.querySelectorAll<HTMLAnchorElement>("a");
    links?.[state.focusIndex]?.focus();
  }, [state.focusIndex]);

  // Every first-page load after the initial one: retry, filter change and refresh.
  function load(reason: ListLoadReason, filter: ReportState | null) {
    lastRequestId.current += 1;
    const requestId = lastRequestId.current;
    dispatch({ type: "load-start", requestId, reason, filter });
    fetchReports(session.token, { limit: LIMITS.pageDefault, state: filter }).then((result) => {
      if (isUnauthorized(result)) {
        expireSession(session.token);
        return;
      }
      if (!result.ok) {
        dispatch({ type: "load-failed", requestId, failure: result });
        return;
      }
      dispatch({ type: "load-done", requestId, reason, page: result.value, clock: formatClock(new Date()) });
    });
  }

  function loadMore() {
    const requestId = state.requestId;
    dispatch({ type: "more-start" });
    fetchReports(session.token, { limit: LIMITS.pageDefault, cursor: state.nextCursor, state: state.filter }).then(
      (result) => {
        if (isUnauthorized(result)) {
          expireSession(session.token);
          return;
        }
        if (!result.ok) {
          dispatch({ type: "more-failed", requestId, failure: result });
          return;
        }
        dispatch({ type: "more-done", requestId, page: result.value });
      },
    );
  }

  function changeFilter(event: ChangeEvent<HTMLSelectElement>) {
    // Only a state the filter offers is ever sent; anything else means "Wszystkie stany".
    const next = filterStates.find((s) => s === event.target.value) ?? null;
    load("filter", next);
  }

  const busy = state.pending !== null;
  const reloading = state.pending === "filter" || state.pending === "refresh";

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 md:py-12">
      <h1 className="font-display text-2xl font-semibold leading-tight">{LIST.title}</h1>
      <p className="mt-2 text-base text-muted-slate">{LIST.subtitle[role]}</p>

      {role === "parent" ? <RobloxAccountCard session={session} /> : null}

      <p role="status" className="sr-only">
        {state.announcement}
      </p>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <label htmlFor={filterId} className="block text-sm font-semibold">
            {LIST.filterLabel}
          </label>
          <select
            id={filterId}
            className={`${selectBase} mt-2`}
            value={state.filter ?? ""}
            onChange={changeFilter}
            disabled={busy}
          >
            <option value="">{LIST.filterAll}</option>
            {filterStates.map((s) => (
              <option key={s} value={s}>
                {capitalize(REPORT_STATE_LABELS_PL[s])}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {state.refreshedAt !== null ? (
            <p className="text-sm text-muted-slate">{fillTemplate(LIST.refreshed, { time: state.refreshedAt })}</p>
          ) : null}
          <button
            type="button"
            className={`${secondaryButton} ${buttonSmall}`}
            onClick={() => load("refresh", state.filter)}
            disabled={busy}
          >
            {state.pending === "refresh" ? LIST.refreshPending : LIST.refresh}
          </button>
        </div>
      </div>

      {state.status === "loading" ? (
        <div className={`${card} mt-4 overflow-hidden`}>
          <p className="sr-only">{LIST.loading}</p>
          <ul aria-hidden="true" className="divide-y divide-shield-silver">
            {SKELETON_ROWS.map((row) => (
              <li key={row} className="px-4 py-4 md:px-6">
                <div className={`${skeletonBlock} h-7 w-32`} />
                <div className={`${skeletonBlock} mt-2 h-5 w-full`} />
                <div className={`${skeletonBlock} mt-2 h-4 w-2/3`} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {state.failure ? (
        <div role="alert" className={`${alertError} mt-4 flex flex-wrap items-center justify-between gap-4`}>
          <p>{errorMessage(state.failure)}</p>
          <button
            type="button"
            className={`${secondaryButton} ${buttonSmall}`}
            onClick={() => load(state.status === "error" ? "retry" : "refresh", state.filter)}
            disabled={busy}
          >
            {ERRORS.retry}
          </button>
        </div>
      ) : null}

      {state.status === "ready" && state.reports.length === 0 ? (
        <div className={`${card} mt-4 p-4 md:p-6`}>
          {state.filter === null ? (
            <>
              <h2 className="font-display text-xl font-semibold leading-tight">{LIST.emptyTitle}</h2>
              <p className="mt-2 text-base text-muted-slate">{LIST.emptyBody[role]}</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl font-semibold leading-tight">
                {fillTemplate(LIST.emptyFilteredTitle, { state: REPORT_STATE_LABELS_PL[state.filter] })}
              </h2>
              <button
                type="button"
                className={`${secondaryButton} ${buttonSmall} mt-4`}
                onClick={() => load("filter", null)}
                disabled={busy}
              >
                {LIST.showAllStates}
              </button>
            </>
          )}
        </div>
      ) : null}

      {state.status === "ready" && state.reports.length > 0 ? (
        <>
          <div className={`${card} mt-4 overflow-hidden`}>
            <ul ref={listRef} aria-busy={reloading} className="divide-y divide-shield-silver">
              {state.reports.map((report) => (
                <ReportRow key={report.id} report={report} sessionChildren={session.children} />
              ))}
            </ul>
          </div>

          {state.moreFailure ? (
            <div role="alert" className={`${alertError} mt-6 flex flex-wrap items-center justify-between gap-4`}>
              <p>{errorMessage(state.moreFailure)}</p>
              <button type="button" className={`${secondaryButton} ${buttonSmall}`} onClick={loadMore} disabled={busy}>
                {ERRORS.retry}
              </button>
            </div>
          ) : null}

          {state.nextCursor !== null ? (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                className={`${secondaryButton} ${buttonLarge} w-full sm:w-auto`}
                onClick={loadMore}
                disabled={busy}
              >
                {state.pending === "more" ? LIST.morePending : LIST.more}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </main>
  );
}
