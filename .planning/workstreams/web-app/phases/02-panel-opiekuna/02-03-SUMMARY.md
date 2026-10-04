---
phase: 02-panel-opiekuna
plan: 03
subsystem: ui
tags: [nextjs, react, useReducer, tailwind, pagination, report-list, vitest, tdd]

# Dependency graph
requires:
  - phase: 02-panel-opiekuna (plan 02)
    provides: "fetchReports(token, { limit, cursor, state }), ReportListView first page, ReportRow, StateBadge, formatClock, fillTemplate, LIST copy, riskBadgeClasses and skeletonBlock styles"
  - phase: 02-panel-opiekuna (plan 01)
    provides: "apiCall/errorMessage/isUnauthorized, useCurrentSession, clearSession, guardrail test, panel-fetch helper"
  - phase: 01-kontrakt-i-backend-spraw
    provides: "GET /api/reports with opaque cursor, ?state= filter, empty filter 200 { reports: [], next_cursor: null }, REPORT_STATES, TEACHER_VISIBLE_STATES, TAKEN_ACTIONS"
provides:
  - "list-state.ts: pure list state machine (initialListState, listReducer, filterStatesFor; ListState, ListAction, ListLoadReason) with a requestId guard against superseded responses"
  - "Finished /panel list: 'Stan' filter, 'Odśwież listę' with 'Odświeżono HH:MM', 'Pokaż więcej zgłoszeń' with focus on the first new row, skeleton, empty states (no filter / filtered), error alerts with 'Spróbuj ponownie', one polite live region"
  - "Risk marker: RISK copy, RISK_CATEGORIES, riskCategories, isRiskyAction, riskLabel (format.ts) and RiskBadge (badges.tsx) on every list row"
affects: [02-04, 02-05, panel detail ("Co dziecko już zrobiło" can reuse isRiskyAction/riskLabel)]

# Actuals (#2632)
actuals:
  tokens: 8300
  tasks: 3
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "List state as a pure reducer (list-state.ts) driven by useReducer; every first-page and 'more' request carries a requestId and the reducer ignores responses for any other id"
    - "Request ids come from a ref incremented only in event handlers; the initial effect uses the initial state's id 1 and dispatches only in the promise continuation behind an ignore flag"
    - "The stateful list is keyed by the session token, so a login in another tab remounts it with a fresh state"
    - "Every list control is disabled while any request is pending; only the triggering control shows its pending label"

key-files:
  created:
    - web-app/src/app/_panel/list-state.ts
    - web-app/tests/panel/list-state.test.ts
  modified:
    - web-app/src/app/_panel/ReportListView.tsx
    - web-app/src/app/_panel/ReportRow.tsx
    - web-app/src/app/_panel/badges.tsx
    - web-app/src/app/_panel/format.ts
    - web-app/src/app/_panel/content.ts
    - web-app/tests/panel/list-flow.test.ts
    - web-app/tests/panel/format.test.ts

key-decisions:
  - "ReportListView keys the stateful ReportList by session.token, so a cross-tab login remounts the list and the requestId guard never keeps the previous account's rows"
  - "Every list control (filter, refresh, 'Pokaż więcej zgłoszeń', retry, 'Pokaż wszystkie stany') is disabled while any request is pending, so a 'more' request never pairs an old cursor with a new filter"
  - "more-start clears the announcement, so a second 'Wczytano kolejne zgłoszenia.' changes the live region text and is announced again"
  - "The filter select sends only a value found in filterStatesFor(role); anything else becomes 'Wszystkie stany' (T-02-08)"

patterns-established:
  - "List reducer actions: load-start/load-done/load-failed for first-page loads (reason initial|retry|filter|refresh), more-start/more-done/more-failed for pagination"
  - "Risk categories are defined once in format.ts (RISK_CATEGORIES) and reused by the list badge; the detail page should reuse them"

requirements-completed: [PAN-01]

coverage:
  - id: D1
    description: "'Pokaż więcej zgłoszeń' end to end: P1's limit-2 pages joined by the verbatim cursor equal the limit-20 page in the same order; the request carries limit=2 and cursor=<encoded cursor>; focusIndex 2 and the 'Wczytano kolejne zgłoszenia.' announcement"
    requirement: "PAN-01"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#pages through P1's reports with the cursor passed verbatim and appends them in API order"
        status: pass
    human_judgment: false
  - id: D2
    description: "listReducer pagination rules: append without duplicate ids, focus on the first new row only when something was appended, more-failed keeps rows, superseded more responses ignored, load-done drops appended pages"
    requirement: "PAN-01"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/list-state.test.ts#listReducer: first page and 'Pokaż więcej zgłoszeń'"
        status: pass
    human_judgment: false
  - id: D3
    description: "listReducer filter/refresh/retry/failure rules: rows stay visible during filter and refresh, refreshedAt and 'Lista odświeżona.' only after a refresh, superseded load responses ignored, error vs ready-with-alert on failure, filterStatesFor per role"
    requirement: "PAN-01"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/list-state.test.ts#listReducer: filter, refresh, retry and failures"
        status: pass
    human_judgment: false
  - id: D4
    description: "State filter through the real route: P1 state=closed gives [d0002]; T1 state=pending_parent gives { reports: [], next_cursor: null }, which the reducer turns into the filtered empty state"
    requirement: "PAN-01"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#filters a parent's list by state through the real route"
        status: pass
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#gives a teacher an empty filtered page that becomes the filtered empty state"
        status: pass
    human_judgment: false
  - id: D5
    description: "Risk marker: riskCategories/riskLabel/isRiskyAction per D-04 and UI-SPEC A5; RiskBadge renders the crimson badge with an aria-hidden dot or nothing; T1 rows keep the order [d0004, d0002] with 'Ryzyko: kliknięcie, podanie danych' and 'Ryzyko: kliknięcie'; T2's R5 (replied only) has no marker"
    requirement: "PAN-01"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/format.test.ts#panel risk marker"
        status: pass
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#marks the risky rows of a teacher's list without changing the API order"
        status: pass
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#shows no risk marker on a row whose child only replied"
        status: pass
    human_judgment: false
  - id: D6
    description: "Build, typecheck, lint and the full suite (including the 02-01 guardrails) green; no setInterval in the list; build output free of server secrets"
    verification:
      - kind: other
        ref: "npm --prefix web-app test && run build && run typecheck && run lint"
        status: pass
      - kind: other
        ref: "test -d web-app/.next/static && ! grep -rqE 'SUPABASE_SERVICE_ROLE_KEY|DEMO_AUTH_SECRET' web-app/.next/static"
        status: pass
    human_judgment: false
  - id: D7
    description: "In a browser: the teacher's filter offers only 'U nauczyciela', 'Eskalowane', 'Zamknięte'; old rows stay visible during a filter change; 'Odświeżono HH:MM' after refresh; the filtered empty state with 'Pokaż wszystkie stany'; skeleton on first load; focus moves to the first new row; crimson risk badges; no horizontal scroll at 375px and 320px"
    requirement: "PAN-01"
    verification: []
    human_judgment: true
    rationale: "Native select behavior, aria-busy transitions, focus moves, live-region announcements and the responsive layout need a real browser; vitest runs without a DOM (Task 2 human-check)"

# Metrics
duration: 6min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 03: Report List (Filter, Refresh, Pagination, Risk Marker) Summary

**The /panel list is now finished, built on a pure `listReducer` (list-state.ts):**
- **"Pokaż więcej zgłoszeń"** appends the next page using the API cursor verbatim and moves focus to the first new row.
- **The "Stan" filter** offers parents all 5 states and teachers only the 3 teacher-visible ones.
- **"Odśwież listę"** reloads by hand and shows "Odświeżono HH:MM"; nothing polls.
- **Other states:** skeletons on first load, role-specific and filtered empty states, and error alerts with "Spróbuj ponownie".
- **Risk badge:** a crimson "Ryzyko: kliknięcie, podanie danych, zapłata" badge on every row where the child clicked, gave data or paid.
- **Request ids:** every request carries one, so a response from a superseded filter, refresh or page is ignored.

Changes are uncommitted because this run had no git authorization.

## Performance

- **Duration:** 6 min (6 min 13 s)
- **Started:** 2026-10-03T21:48:50Z
- **Completed:** 2026-10-03T21:55:03Z
- **Tasks:** 3 of 3
- **Files modified:** 9 (2 created, 7 modified)

## Accomplishments

- **Tracer slice proven end to end:** the button calls `fetchReports` with `state.nextCursor` verbatim, the request goes through the real list route, and `listReducer` appends the page and sets focusIndex. P1's three reports fetched as two limit-2 pages match the single limit-20 page id for id. The second request contains `limit=2` and `cursor=<cursor>`.
- **List state machine:** first page, append without duplicates, filter, refresh, retry, failures with and without rows, and the stale-response guard for both first-page and "more" requests.
- **Finished list view:**
  - Toolbar with the labelled native select and the refresh button plus the "Odświeżono HH:MM" note.
  - `aria-busy` on the list during a filter change or refresh.
  - A 3-row `motion-safe:animate-pulse` skeleton with sr-only "Wczytywanie zgłoszeń…".
  - The no-filter and filtered empty states (with no "Pokaż więcej zgłoszeń").
  - Error alerts with "Spróbuj ponownie"; a failed "more" keeps the rows and shows its alert under the list.
  - A 401 leads to `clearSession("expired")`.
  - One polite live region.
- **Risk marker:** `RISK_CATEGORIES` (click, data, payment; `downloaded_file` and `replied` are not highlighted, UI-SPEC A5) plus `riskCategories`, `isRiskyAction`, `riskLabel` and `RiskBadge`. Each row shows the badge right after its state badge. The order of rows and of the list is unchanged.
- **Windows ledger:** entry #3 (02-02's "empty card / first page only" stub) is resolved and marked fixed.

## Task Commits

1. **Task 1: Tracer, "Pokaż więcej zgłoszeń" end to end**: uncommitted (TDD: RED then GREEN, no commits)
2. **Task 2: State filter, manual refresh, empty, loading and error states, stale-response guard**: uncommitted (TDD: RED then GREEN, no commits)
3. **Task 3: Risk marker on list rows**: uncommitted (TDD: RED then GREEN, no commits)

**Plan metadata:** uncommitted

Commits: none. Changes were left uncommitted because this run had no git authorization.

## TDD Gate Compliance

- **Task 1 RED.** I wrote list-state.test.ts and the tracer case in list-flow.test.ts first, then a signature-only `list-state.ts` stub (types, `initialListState`, and a `listReducer` that returns the state unchanged). This avoids a module-load INVALID_RED. 8 of 14 tests failed on assertions. `check tdd-red-evidence` returned **RED_EVIDENCE_OK** for the tracer test and for "more-done appends only ids that are not listed yet". Two tests passed in RED as expected: the initial-state test (data, not behavior) and the superseded-request test (the stub's "return state" is exactly the guarded result). **GREEN:** 14/14.
- **Task 2 RED.** I wrote the new reducer and end-to-end cases first and added a `filterStatesFor` stub returning `[]`. 8 reducer tests and the filtered-empty end-to-end case failed on assertions. The checker returned **RED_EVIDENCE_OK** for "ignores load-done and load-failed from a superseded filter or refresh" and for the T1 filtered-empty case. The P1 `state=closed` route test passed in RED because `fetchReports` has supported `state` since 02-02; it pins the route contract. **GREEN:** 24/24.
- **Task 3 RED.** I wrote the tests first and added the `RISK` copy plus stubs (`riskCategories` returning `[]`, `riskLabel` returning `null`, `isRiskyAction` returning `false`, `RiskBadge` returning `null`). 5 target tests failed on assertions. The checker returned **RED_EVIDENCE_OK** for the categories test and the T1 risky-rows test. The R5 "no Ryzyko" test passed in RED because it asserts an absence. **GREEN:** 17/17 focused.
- **Mutation probe** for the tests that passed in RED:
  - Removing the requestId guard in more-done and more-failed failed exactly "ignores more-done and more-failed from a superseded request".
  - Making `replied` risky failed exactly "shows no risk marker on a row whose child only replied".
  - Both files were restored byte for byte (cmp), and the panel suite went back to 67/67.
- The RED evidence used the 02-02 approach: vitest `--reporter=tap-flat` with `# tests/# pass/# fail` lines counted from the same TAP output.
- RED/GREEN commits are absent because this run had no git authorization.

## Verification Results (exact)

| Command | Result |
|---|---|
| `npm --prefix web-app test -- tests/panel/list-state.test.ts tests/panel/list-flow.test.ts` (Task 1) | exit 0, 2 files, 14 passed |
| `npm --prefix web-app run build && ... typecheck && ... lint` (Task 1) | exit 0; build lists `○ /login` and `○ /panel` |
| Tracer feedback gate (interactive, end-of-phase, automated-only verify) | verify re-run green plus acceptance greps PASS; expanded to Task 2 |
| `npm --prefix web-app test -- tests/panel/list-state.test.ts tests/panel/list-flow.test.ts` (Task 2) | exit 0, 2 files, 24 passed |
| `npm --prefix web-app test && run build && run typecheck && run lint` (Task 2) | exit 0; full suite 23 files, 399 passed |
| `npm --prefix web-app test -- tests/panel/format.test.ts tests/panel/list-flow.test.ts` (Task 3) | exit 0, 2 files, 17 passed |
| `npm --prefix web-app test && run build && run typecheck && run lint` (Task 3, final) | exit 0; full suite 23 files, **405 passed**; lint has no warnings |
| `npx vitest run tests/panel/guardrails.test.ts` | 8 passed |
| `grep -v '^\s*//' web-app/src/app/_panel/ReportListView.tsx \| grep -c 'setInterval'` | 0 |
| Task 1 acceptance (list-state exports, no `react` import, `useReducer(listReducer`, LIST.more only while nextCursor not null) | all PASS |
| Task 2 acceptance (LIST.emptyTitle, LIST.emptyFilteredTitle, LIST.showAllStates, LIST.refreshPending, skeletonBlock referenced) | all PASS |
| Task 3 acceptance (StateBadge and RiskBadge exported, `<RiskBadge` in ReportRow, guardrails green) | all PASS |
| `test -d web-app/.next/static && ! grep -rqE 'SUPABASE_SERVICE_ROLE_KEY\|DEMO_AUTH_SECRET' web-app/.next/static` | exit 0 |
| `shasum -c` on web-app/package.json and package-lock.json (taken before any edit) | both OK (unchanged) |

This plan's verify block has no offline `npm start` check, so no server was started.

## Files Created/Modified

- `web-app/src/app/_panel/list-state.ts` (new): `ListLoadReason`, `ListState`, `ListAction`, `initialListState`, `listReducer`, `filterStatesFor`. Pure; it imports only contract types, the `ApiFailure` type and `LIST`.
- `web-app/src/app/_panel/ReportListView.tsx`: `ReportListView` (keys the list by session token) and `ReportList`. ReportList runs `useReducer(listReducer, initialListState)` and holds the initial effect, `load(reason, filter)`, `loadMore`, the focus effect, the toolbar, skeleton, alerts, empty states, rows and pagination.
- `web-app/src/app/_panel/ReportRow.tsx`: line 1 renders `<RiskBadge actions={report.taken_actions} />` after the StateBadge.
- `web-app/src/app/_panel/badges.tsx`: `RiskBadge` (badgeBase + riskBadgeClasses + gap-2, aria-hidden crimson dot, label), hook-free.
- `web-app/src/app/_panel/format.ts`: `RISK_CATEGORIES`, `riskCategories`, `isRiskyAction`, `riskLabel`.
- `web-app/src/app/_panel/content.ts`: `RISK` copy (prefix, separator, three category labels).
- `web-app/tests/panel/list-state.test.ts` (new): 17 reducer tests.
- `web-app/tests/panel/list-flow.test.ts`: plus the pagination tracer, the two filter cases and the two risk-marker cases (9 tests total).
- `web-app/tests/panel/format.test.ts`: plus 4 risk-marker tests (8 total).

## Decisions Made

- The stateful list is keyed by `session.token`. See deviation 1.
- Every control is disabled while any request is pending. See deviation 2.
- `more-start` also clears the announcement, so repeated identical announcements still reach screen readers.
- The filter select sends only a value from `filterStatesFor(role)`; any other value is treated as "Wszystkie stany" (T-02-08).
- The error alert's "Spróbuj ponownie" calls `load("retry")` when there are no rows and `load("refresh")` when rows are kept, as the plan specifies.
- The skeleton's "Wczytywanie zgłoszeń…" is a plain sr-only text inside the skeleton card. The page's single `role="status"` region carries only the announcements.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The stateful list remounts when the session token changes**
- **Found during:** Task 1 (view refactor)
- **Issue:** A login in another tab replaces the shared localStorage session (UI-SPEC A7), and the token changes under the mounted list. The plan's initial effect refetches with the initial requestId 1. Once Task 2's guard is in place, that response is ignored if the user has filtered or refreshed (state.requestId > 1). The previous account's rows would then stay on screen under the new account's header.
- **Fix:** `ReportListView` reads the session and renders `<ReportList key={session.token} session={session} />`. A new token remounts the list with a fresh reducer state. `useReducer(listReducer, initialListState)` stays in ReportListView.tsx.
- **Files modified:** web-app/src/app/_panel/ReportListView.tsx
- **Verification:** build, typecheck, lint and the full suite green. The remount itself only happens in a browser, so it is part of the end-of-phase human check.
- **Committed in:** uncommitted

**2. [Rule 2 - Missing critical] "Pokaż więcej zgłoszeń" and every retry are disabled while any request is pending**
- **Found during:** Task 2
- **Issue:** The plan disables the "more" button only while pending is "more". Suppose the user clicks it while a filter change is loading. `load-start` has already set the new filter and request id, but `nextCursor` still belongs to the old filter. The "more" request would then send the old cursor with the new filter, and its matching requestId would let the result through.
- **Fix:** One `busy = state.pending !== null` flag disables the filter, refresh, "Pokaż więcej zgłoszeń", every "Spróbuj ponownie" and "Pokaż wszystkie stany". Pending labels still appear only on the triggering control. This also covers T-02-10.
- **Files modified:** web-app/src/app/_panel/ReportListView.tsx
- **Verification:** full suite, build, typecheck, lint green.
- **Committed in:** uncommitted

---

**Total deviations:** 2 auto-fixed (1 bug, 1 missing critical).
**Impact on plan:** Both are needed so rows of two accounts or two filters never mix. No scope creep.

## Issues Encountered

- During Task 1 the view already dispatched `load-failed`, but the reducer only handled it from Task 2 on. Both tasks ran back to back in this run, so no intermediate state shipped.
- Task 1 initially left an unused `lastRequestId` ref, and lint flagged it. I removed it in Task 1 and reintroduced it in Task 2, where `load()` uses it. The final lint is clean.
- Three tests passed in RED for the documented reasons above. The mutation probe shows the two behavioral ones are not vacuous.
- The build still prints `Failed to find font override values for font Atkinson Hyperlegible Next`. This warning predates the plan and is out of scope.

## Known Stubs

None. Ledger entry #3 (`ReportListView.tsx` empty card and first page only) is resolved by this plan and marked fixed in `.planning/WINDOWS.md`.

## Threat Flags

None. There is no new surface beyond the plan's threat model:
- **T-02-08:** the cursor goes through URLSearchParams verbatim, and only `filterStatesFor` values are sent as `state`.
- **T-02-09:** requestId guard on every first-page and "more" response, covered by the reducer tests.
- **T-02-10:** controls are disabled while any request is pending, and nothing polls.

The prohibition holds: there are no per-child counts and no ordering by risk. The badge describes one report and the API order is kept.

## User Setup Required

None. No external service configuration is required.

## Human Check (end of phase)

Task 2 carries a `<human-check>` for the verifier's end-of-phase UAT. In a browser:
- **As the 5a teacher:** the "Stan" filter lists only "U nauczyciela", "Eskalowane" and "Zamknięte". Picking "Zamknięte" keeps the old rows visible until the new ones arrive. "Odśwież listę" shows "Odświeżono HH:MM". "Wszystkie stany" resets the filter.
- **As the Ola parent:** "Czeka na rodzica" works, and a state with no reports shows "Brak zgłoszeń w stanie „…”" with "Pokaż wszystkie stany".
- **Rows:** colored state badges and crimson risk badges.
- **Layout:** no horizontal scroll at 375px or 320px.

Also check:
- Focus moves to the first new row after "Pokaż więcej zgłoszeń". This needs more than 20 reports, so it is reachable only with extra data.
- Logging in as another account in a second tab of the same profile replaces the list.

## Next Phase Readiness

Ready for 02-04 (report detail). `isRiskyAction` and `riskLabel` can mark "Co dziecko już zrobiło". Reuse the requestId-guard and keyed-by-token patterns for the detail view's refetches. PAN-01 is complete.

---
*Phase: 02-panel-opiekuna*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 9 source and test files listed above and this SUMMARY exist on disk.
- No RED stubs remain in `src/app/_panel`. The mutation-probe copies of list-state.ts and format.ts were restored byte for byte (cmp): all 4 requestId guards are present and `replied` is not a risk category.
- No server was started and no port was used.
- Commits: none. Changes were left uncommitted because this run had no git authorization.
