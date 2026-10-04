---
phase: 02-panel-opiekuna
plan: 04
subsystem: ui
tags: [nextjs, react, useReducer, tailwind, report-detail, timeline, comments, vitest, tdd]

# Dependency graph
requires:
  - phase: 02-panel-opiekuna (plan 03)
    provides: "list-state reducer + requestId pattern, keyed-by-token remount, isRiskyAction/riskLabel/RiskBadge, skeleton and alert classes, live region"
  - phase: 02-panel-opiekuna (plan 01)
    provides: "apiCall/errorMessage/isUnauthorized, useCurrentSession, clearSession, guardrail test (route allowlist with panel/[id]/page.tsx), panel-fetch helper"
  - phase: 01-kontrakt-i-backend-spraw
    provides: "GET /api/reports/{id} (history + comments, 404 for unknown/foreign ids), POST /api/reports/{id}/comments (201, not idempotent), demo dataset R1..R6"
provides:
  - "/panel/[id] route (ReportPage) rendering ReportDetailView"
  - "detail-state.ts: pure detail state machine (initialDetailState, detailReducer; DetailState, DetailAction, DetailLoadReason) with load-start/load-done/load-not-found/load-failed/comment-start/comment-added and a requestId guard"
  - "ReportCards.tsx: ReportContentCard (plain-text sky-wash blockquote + dl) and TakenActionsCard (canonical order, crimson 'ryzykowne' items, empty copy, no signals section)"
  - "Timeline.tsx: Timeline and TimelineCard (merged history + comments, '(Ty)', notes, children slot for the comment form)"
  - "CommentForm.tsx: controlled-draft new-comment form (blank block, pending, 201 append, 401/404/400/network handling, no retry)"
  - "api.ts fetchReport()/postComment(); format.ts isReportId(), TimelineItem, mergeTimeline(), actorName(), historyEntryBody(); content.ts DETAIL, TIMELINE, COMMENT"
affects: [02-05 (adds the 'Zmień stan' card into the detail grid and moves an unsent transition note into the lifted comment draft)]

# Actuals (#2632)
actuals:
  tokens: 14945
  tasks: 3
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Detail state as a pure reducer (detail-state.ts) mirroring list-state.ts: every load carries a requestId, responses for another id are ignored"
    - "ReportDetailView keys the stateful page by `${session.token}:${id}`, so a cross-tab login or another report remounts it with fresh state"
    - "A module-level settleLoad(result, requestId, reason, dispatch) turns a detail response into the reducer action (401 → clearSession('expired'), report_not_found → load-not-found, other failure → load-failed); the clock is read in the continuation"
    - "The comment draft is lifted into ReportDetailView (useState) and passed down to a controlled CommentForm"
    - "Comments are append-only, so load-done keeps comments the view already showed for the same report id"

key-files:
  created:
    - web-app/src/app/panel/[id]/page.tsx
    - web-app/src/app/_panel/ReportDetailView.tsx
    - web-app/src/app/_panel/detail-state.ts
    - web-app/src/app/_panel/ReportCards.tsx
    - web-app/src/app/_panel/Timeline.tsx
    - web-app/src/app/_panel/CommentForm.tsx
    - web-app/tests/panel/detail-flow.test.ts
    - web-app/tests/panel/detail-state.test.ts
    - web-app/tests/panel/timeline.test.ts
  modified:
    - web-app/src/app/_panel/api.ts
    - web-app/src/app/_panel/format.ts
    - web-app/src/app/_panel/content.ts

key-decisions:
  - "The detail page is keyed by session token and report id, so a cross-tab login or a different report never shows the previous state"
  - "A comment-start action clears the live region before each send, so a second 'Komentarz dodany.' is announced again (CommentForm gets an optional onSubmitStart prop)"
  - "load-done keeps comments the view already showed for the same report (comments are append-only), so a confirmed comment never vanishes when a refresh that started earlier returns"
  - "The not-found view carries its own 'Wróć do listy zgłoszeń' link under the body; the top back link is shown only for the other states, so the page never has two identical links"
  - "historyEntryBody uses the submit sentence for action 'submit' or a null from_state; every other entry uses 'Zmiana z „…” na „…”.'"

patterns-established:
  - "Detail reducer actions: load-start/load-done/load-failed/load-not-found (reason initial|retry|refresh) plus comment-start/comment-added; plan 02-05 adds its transition actions alongside"
  - "Hook-free cards (ReportCards, Timeline) render under renderToStaticMarkup in vitest; static aria-labelledby ids because there is one detail per page"
  - "Timeline entry meta is built as one text node so 'Mama Oli (Ty)' stays contiguous in the markup"

requirements-completed: [PAN-02, PAN-03]

coverage:
  - id: D1
    description: "Tracer: fetchReport through the real detail route: P1 gets closed R2 with [clicked_link], 4 history entries and 2 comments via GET /api/reports/{id} with the Bearer header; T2 gets 404 report_not_found; a garbage token counts as a session expiry; isReportId accepts upper/lower-case UUIDs and rejects 'abc', '', '../auth/me' and a UUID with a trailing '/x'"
    requirement: "PAN-02"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/detail-flow.test.ts#panel detail flow"
        status: pass
      - kind: unit
        ref: "web-app/tests/panel/detail-flow.test.ts#isReportId"
        status: pass
    human_judgment: false
  - id: D2
    description: "Content card and 'Co dziecko już zrobiło': full content as escaped plain text in the sky-wash blockquote (no <a>, HTML escaped) with Dziecko/Źródło/Rodzaj ataku/Zgłoszono/Ostatnia zmiana; risky actions in crimson with 'ryzykowne', harmless ones plain, canonical order, the empty copy, no signals section"
    requirement: "PAN-02"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/detail-flow.test.ts#report detail cards"
        status: pass
    human_judgment: false
  - id: D3
    description: "detailReducer: first load, not found, failures with and without a report, retry, the superseded-request guard, refresh keeping the view, refreshedAt + 'Zgłoszenie odświeżone.', comment-added (once per id), comment-start, comments kept across a refresh of the same report"
    requirement: "PAN-02"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/detail-state.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "One timeline (D-13): mergeTimeline order e0021, e0022, f0021, e0023, f0022, e0024; history before comment on equal times, then id; inputs not mutated; actorName and historyEntryBody; the rendered Timeline has type words, 'Mama Oli (Ty)', 'Notatka: ' exactly twice, the comment's dateTime, no '(demo)', no link, escaped notes and comments; R1 renders one item"
    requirement: "PAN-02"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/timeline.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "Comment round trip (D-03): T1 postComment on R4 sends POST /api/reports/{R4}/comments with exactly {\"body\":\"Rozmawiałam z Kubą.\"} and gets 201; P2 then sees that comment last on R4; P1 gets 404; a blank body gives validation_error on field body and errorMessage shows that detail; a dropped connection gives kind network, sends once, and maps to the check-the-timeline text"
    requirement: "PAN-03"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/detail-flow.test.ts#panel comments"
        status: pass
    human_judgment: false
  - id: D6
    description: "Build, typecheck, lint and the full suite (including the 02-01 guardrails and the route allowlist) green; the build lists ƒ /panel/[id]; the offline built server answers /panel/{R2} with 200 and only the session-guard text; no setInterval in ReportDetailView; no server secrets in .next/static"
    verification:
      - kind: other
        ref: "npm --prefix web-app test && run build && run typecheck && run lint"
        status: pass
      - kind: other
        ref: "offline npm start on port 3125 with blanked Supabase vars: detail=200 and 'Wczytywanie panelu'"
        status: pass
    human_judgment: false
  - id: D7
    description: "In a browser as the Ola parent and the 5a teacher in two profiles: plain-text message with a non-clickable link, crimson 'Kliknięcie w link' with 'ryzykowne', no signals section, interleaved timeline with '(Ty)', the empty-comment error, a new comment appearing under the timeline, refresh keeping the typed draft, the teacher seeing the parent's comment after refreshing, focus and live-region behavior, no horizontal scroll at 320px"
    requirement: "PAN-03"
    verification: []
    human_judgment: true
    rationale: "Reading order, focus moves, live-region announcements, two separate browser sessions and the 320px layout need a real browser; vitest runs without a DOM (Task 3 human-check)"

# Metrics
duration: 10min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 04: Report Detail, Timeline and Comments Summary

**The /panel/[id] report detail is in place, built on a pure `detailReducer`:**
- **Header:** the attack type as h1, the state badge and the risk badge.
- **"Treść wiadomości":** the scam message in full as escaped plain text. URLs are never clickable.
- **"Co dziecko już zrobiło":** the child's actions with the risky ones in crimson and tagged "ryzykowne". There is no signals section.
- **Timeline:** state changes and comments on one axis, with "(Ty)" on your own entries.
- **"Odśwież zgłoszenie":** reloads by hand and keeps the typed draft.
- **"Nowy komentarz":** a comment appears on the timeline only after the server's 201, and the other party sees it after refreshing.

Changes are uncommitted because this run had no git authorization.

## Performance

- **Duration:** 10 min (9 min 36 s)
- **Started:** 2026-10-03T21:57:59Z
- **Completed:** 2026-10-03T22:07:35Z
- **Tasks:** 3 of 3
- **Files modified:** 12 (9 created, 3 modified)

## Accomplishments

- **Tracer slice proven end to end:** a list row link opens /panel/[id]. `isReportId` is checked, then `fetchReport` calls the real detail route and `detailReducer` renders the cards. The offline built server answers `/panel/{R2}` with 200 and shows only "Wczytywanie panelu…" before the session guard decides.
- **Detail page states:**
  - Not found: a malformed id shows it at once with no request; a 404 also shows it.
  - First load: 3 skeleton cards with `motion-safe:animate-pulse` and the sr-only "Wczytywanie zgłoszenia…".
  - Load errors: the contract message with "Spróbuj ponownie".
  - 401: `clearSession("expired")`.
  - One polite live region.
- **Content and taken-actions cards:**
  - The message is a plain text child of the sky-wash blockquote with `whitespace-pre-wrap [overflow-wrap:anywhere]`.
  - The `dl` lists Dziecko, Źródło, Rodzaj ataku, Zgłoszono and Ostatnia zmiana, with Warsaw times in `<time>`.
  - Actions follow TAKEN_ACTIONS order and reuse `isRiskyAction`. With no actions the card shows "Nic z tych rzeczy: …" and the page has no risk badge.
- **Timeline (D-13):**
  - `mergeTimeline` sorts by time, then puts a history entry before a comment, then sorts by id.
  - `actorName` falls back to session children, then "Dziecko", or to the capitalized role.
  - `historyEntryBody` builds the submit and transition sentences.
  - A "Notatka:" block appears only when a note exists.
  - Each marker sits on the track with `-ml-[31px]`.
- **Refresh (D-14):** "Odśwież zgłoszenie" reads "Odświeżanie…" and is disabled while any load runs. Afterwards it shows "Odświeżono HH:MM" and announces "Zgłoszenie odświeżone.". A failed refresh shows an alert above the grid and keeps the report. Nothing polls.
- **Comments (D-03):**
  - The draft is lifted into the page.
  - A blank comment shows "Wpisz treść komentarza." and moves focus back to the field.
  - While sending, the button reads "Wysyłanie…" and is disabled, `aria-busy` is set, and the field is read-only.
  - A 201 clears the field, appends the comment and announces "Komentarz dodany.".
  - Error handling: 401 ends the session, 404 shows the not-found view, 400 shows the field message, and a network failure shows the check-the-timeline text. The text is kept and nothing is retried.
  - The counter reads `{n}/2000`, with `maxLength` set to `LIMITS.commentMaxChars`.

## Task Commits

1. **Task 1: Tracer, open one report (row link → /panel/[id] → fetchReport → detail route → cards), not-found, loading and error states**: uncommitted (TDD: RED then GREEN, no commits)
2. **Task 2: One timeline of history and comments, and "Odśwież zgłoszenie"**: uncommitted (TDD: RED then GREEN, no commits)
3. **Task 3: New comment under the timeline, visible to the other party**: uncommitted (TDD: RED then GREEN, no commits)

**Plan metadata:** uncommitted

Commits: none. Changes were left uncommitted because this run had no git authorization.

## TDD Gate Compliance

- **Task 1 RED.** I wrote detail-flow.test.ts and detail-state.test.ts first. Signature-only stubs followed: `fetchReport` returning a network failure, `isReportId` returning false, card components returning null and a reducer returning the state, plus the DETAIL copy as data. 15 of 18 tests failed. The tracer test "loads a parent's report…" and "load-done shows the report" both got **RED_EVIDENCE_OK**. Three passed in RED as expected: the initial-state data test, the "rejects anything that is not exactly one UUID" absence test, and the superseded-request guard (the stub's "return state" is the guarded result). **GREEN:** 18/18.
- **Task 2 RED.** timeline.test.ts and the four refresh reducer cases came first, then stubs (`mergeTimeline` returning `[]`, `actorName`/`historyEntryBody` returning `""`, `Timeline`/`TimelineCard` returning null; TIMELINE copy as data). All 11 timeline tests failed on assertions. The merge-order test and the R2 render test got **RED_EVIDENCE_OK**. The four refresh reducer cases passed in RED because the plan places those rules in Task 1 ("task 1 rules"); Task 2 only adds their tests. **GREEN:** 22/22.
- **Task 3 RED.** The new comment cases came first, then stubs (`postComment` returning internal_error, comment-start/comment-added as no-ops; COMMENT copy as data). 9 tests failed on assertions. The T1→P2 round-trip test and "comment-added appends the comment and announces it" got **RED_EVIDENCE_OK**. Two absence tests passed in RED: no report shown, and no comments carried to another report. **GREEN:** 33/33.
- **Mutation probes** for every test that passed in RED. Each mutation failed exactly its test:
  - Dropping the `$` anchor of the UUID pattern.
  - Removing the load-done requestId guard.
  - Making load-start always show the skeleton.
  - Carrying comments across report ids.
  - Accepting comment-added without a report.

  Both mutated files were restored byte for byte (cmp).
- RED/GREEN commits are absent because this run had no git authorization.

## Verification Results (exact)

| Command | Result |
|---|---|
| `npm --prefix web-app test -- tests/panel/detail-flow.test.ts tests/panel/detail-state.test.ts` (Task 1) | exit 0, 2 files, 18 passed |
| `npm --prefix web-app test && run build && run typecheck && run lint` (Task 1) | exit 0; 25 files, 423 passed; build lists `ƒ /panel/[id]` |
| Offline server check, port 3125, blanked SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY, dummy DEMO_AUTH_SECRET (Task 1) | printed `detail=200`, HTML contains "Wczytywanie panelu", exit 0; server killed, port free |
| Tracer feedback gate (interactive, end-of-phase, automated-only verify) | verify re-run green; expanded to Task 2 |
| `npm --prefix web-app test -- tests/panel/timeline.test.ts tests/panel/detail-state.test.ts` (Task 2) | exit 0, 2 files, 22 passed |
| `npm --prefix web-app test && run build && run typecheck && run lint` (Task 2) | exit 0; 26 files, 438 passed |
| `grep -v '^\s*//' web-app/src/app/_panel/ReportDetailView.tsx \| grep -c 'setInterval'` | 0 |
| `npm --prefix web-app test -- tests/panel/detail-flow.test.ts tests/panel/detail-state.test.ts` (Task 3) | exit 0, 2 files, 33 passed |
| `npm --prefix web-app test && run build && run typecheck && run lint` (Task 3, final) | exit 0; 26 files, **449 passed**; lint clean |
| Final re-run: full suite + offline check | 449 passed; `detail=200`, exit 0, port free |
| Acceptance greps | "use client" first line of ReportDetailView.tsx and CommentForm.tsx; `isReportId` gates the effect before `fetchReport`; no "use client" in panel/[id]/page.tsx; one `postComment(` call in CommentForm, no loop or timer; format.ts and Timeline.tsx export the planned names: all PASS |
| `test -d web-app/.next/static && ! grep -rqE 'SUPABASE_SERVICE_ROLE_KEY\|DEMO_AUTH_SECRET' web-app/.next/static` | exit 0 |
| `shasum -c` on web-app/package.json and package-lock.json (taken before any edit) | both OK (unchanged) |

## Files Created/Modified

- `web-app/src/app/panel/[id]/page.tsx` (new): server component `ReportPage`, awaits params and renders `<ReportDetailView id={id} />`.
- `web-app/src/app/_panel/ReportDetailView.tsx` (new, "use client"):
  - `ReportDetailView` keys `ReportDetailPage` by token and id.
  - `ReportDetailPage` holds `useReducer(detailReducer)`, the request-id ref and the ignore-flag initial effect gated by `isReportId`.
  - It also holds `load(retry|refresh)`, the lifted draft, and the page layout (back link, not-found, skeleton, error, header with badges and refresh, refresh alert, the grid of content, taken-actions and timeline cards, the comment form and the live region).
- `web-app/src/app/_panel/detail-state.ts` (new): pure reducer and types.
- `web-app/src/app/_panel/ReportCards.tsx` (new): `ReportContentCard`, `TakenActionsCard`.
- `web-app/src/app/_panel/Timeline.tsx` (new): `Timeline`, `TimelineCard`.
- `web-app/src/app/_panel/CommentForm.tsx` (new, "use client"): `CommentForm`.
- `web-app/src/app/_panel/api.ts`: `fetchReport`, `postComment`.
- `web-app/src/app/_panel/format.ts`: `isReportId`, `TimelineItem`, `mergeTimeline`, `actorName`, `historyEntryBody`.
- `web-app/src/app/_panel/content.ts`: `DETAIL`, `TIMELINE` (plus `separator: " · "`), `COMMENT`.
- `web-app/tests/panel/detail-flow.test.ts` (new): 17 tests (UUID gate, detail flow, cards, comments).
- `web-app/tests/panel/detail-state.test.ts` (new): 17 reducer tests.
- `web-app/tests/panel/timeline.test.ts` (new): 11 tests.

## Decisions Made

- The detail page is keyed by `${session.token}:${id}`, following 02-03's keyed-by-token pattern.
- The not-found view shows only its own "Wróć do listy zgłoszeń" link under the body. The top back link renders for the other states, so the not-found page has no duplicate link.
- `historyEntryBody` uses the submit sentence when `action` is "submit" or `from_state` is null.
- Static `aria-labelledby` ids (`report-content-title`, `report-taken-title`, `report-timeline-title`) keep the cards hook-free. There is one detail per page.
- CommentForm puts a 400 validation message for field `body` (else the first detail) under the field and refocuses it. Every other failure goes to the alert through `errorMessage(result, COMMENT.networkError)`.
- The comment form stays usable during a refresh, because the draft and the comment flow do not depend on the reload. See deviation 2 for the refresh race.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] A repeated "Komentarz dodany." is announced again**
- **Found during:** Task 3
- **Issue:** The plan's `comment-added` sets the live region to "Komentarz dodany.". After the first comment the text stays, so a second comment would not change the live region and a screen reader would hear nothing. 02-03 fixed the same issue for "Wczytano kolejne zgłoszenia." by clearing the announcement on more-start.
- **Fix:** A new reducer action `comment-start` clears the announcement. CommentForm calls an optional `onSubmitStart` prop when a request starts, and ReportDetailView dispatches `comment-start` from it. The required props and behavior of the planned form are unchanged.
- **Files modified:** detail-state.ts, CommentForm.tsx, ReportDetailView.tsx
- **Verification:** detail-state.test.ts "comment-start clears the announcement…" passes (RED then GREEN).
- **Committed in:** uncommitted

**2. [Rule 1 - Bug] A confirmed comment no longer vanishes when an earlier refresh returns**
- **Found during:** Task 3
- **Issue:** Suppose the user clicks "Odśwież zgłoszenie" and then sends a comment. The refresh's GET can be answered before the comment is saved. `load-done` would then replace the report with one that lacks the confirmed comment, so it disappears from the timeline, which invites sending it again (T-02-13, duplicates).
- **Fix:** `load-done` keeps comments the view already showed when the reloaded report has the same id. Comments are append-only in the contract, so such a comment still exists. A different report id never inherits comments.
- **Files modified:** detail-state.ts
- **Verification:** "keeps a confirmed comment that a refresh started earlier does not contain yet" and "does not carry comments over to another report" pass. The second one is covered by a mutation probe.
- **Committed in:** uncommitted

---

**Total deviations:** 2 auto-fixed (1 missing critical, 1 bug).
**Impact on plan:** Both protect the comment flow: screen readers announce every confirmed comment, and no confirmed comment disappears, so nothing invites a duplicate. No scope creep. The planned exports and props are all present.

## Issues Encountered

- During RED, three tests per task passed for the documented reasons (data, absence, or rules the plan puts in an earlier task). The mutation probes show that none of them is vacuous.
- The build still prints `Failed to find font override values for font Atkinson Hyperlegible Next`. This warning predates the plan and is out of scope.

## Known Stubs

None. The RED stubs were all replaced; a scan of src/app/_panel and panel/[id] finds no `void` placeholders, TODO or FIXME.

## Threat Flags

None. There is no surface beyond the plan's threat model:
- **T-02-11:** content, notes and comments are React text children only. Render tests prove escaping and that no `<a ` appears. The prohibition holds.
- **T-02-12:** `isReportId` runs before any request, and `encodeURIComponent` is applied in both `fetchReport` and `postComment`.
- **T-02-13:** there is a single `postComment` call per submit and no retry. The network copy says to check the timeline first. Deviation 2 also stops a confirmed comment from disappearing.
- **T-02-14:** the thread renders only on /panel/[id] inside the panel shell, and the guardrail route allowlist is unchanged.

## User Setup Required

None. No external service configuration is required.

## Human Check (end of phase)

Task 3 carries a `<human-check>` for the verifier's end-of-phase UAT. Use the app with your own `.env.local` or a deployed build.
- **As rodzic.ola@bezpiecznaaura.example:** open the closed phishing report from the list. Check that:
  - The message is plain text and its link is not clickable.
  - "Kliknięcie w link" is crimson with "ryzykowne", and there is no signals section.
  - The timeline interleaves state changes and comments, with "(Ty)" on your own entries.
- **Comment form:** an empty "Dodaj komentarz" shows "Wpisz treść komentarza.". A new comment appears under the timeline. "Odśwież zgłoszenie" keeps a typed draft.
- **Second browser or profile:** log in as nauczyciel.5a@bezpiecznaaura.example, open the same report and click "Odśwież zgłoszenie". The parent's comment is visible.
- **Layout:** repeat at 320px width with no horizontal scroll.

## Next Phase Readiness

Ready for 02-05 ("Zmień stan" card and the transition dialog):
- The grid's right column is free for the card (`lg:col-start-2 lg:row-start-1`).
- `detailReducer` takes new actions next to the existing ones.
- After a transition, use `load("refresh")`-style refetching with a new request id.
- After a 409, move an unsent note into the comment field with `setDraft` in ReportDetailPage.

PAN-02 is complete. PAN-03 is half done (comments); 02-05 adds the state change.

---
*Phase: 02-panel-opiekuna*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 12 source and test files listed above and this SUMMARY exist on disk.
- api.ts exports `fetchReport` and `postComment`, and content.ts exports `DETAIL`, `TIMELINE` and `COMMENT`.
- No RED stubs remain. The mutation-probe copies of format.ts and detail-state.ts were restored byte for byte (cmp).
- The offline server on port 3125 was stopped and the port is free. No other server was started, there was no `npm run dev`, no Supabase call, no `.env*` access and no package install.
- Commits: none. Changes were left uncommitted because this run had no git authorization.
