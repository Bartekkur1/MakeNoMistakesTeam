---
phase: 02-panel-opiekuna
plan: 02
subsystem: ui
tags: [nextjs, react, tailwind, intl, report-list, vitest, tdd]

# Dependency graph
requires:
  - phase: 02-panel-opiekuna (plan 01)
    provides: "apiCall/errorMessage/isUnauthorized, useCurrentSession, clearSession, content copy (LIST, NAMES, reportHref), styles (badgeBase, STATE_BADGE_CLASSES, card, alertError), guardrail test, panel-fetch helper"
  - phase: 01-kontrakt-i-backend-spraw
    provides: "GET /api/reports (ReportListResponse, created_at desc then id desc, server-side visibility), contract labels, DEMO_CHILDREN, demo dataset"
provides:
  - "fetchReports(token, { limit, cursor, state }) in _panel/api.ts (Bearer only, default limit LIMITS.pageDefault)"
  - "format.ts row helpers: formatDateTime, formatClock, fillTemplate, excerpt, childName, rowMeta"
  - "StateBadge (badges.tsx), ReportRow (ReportRow.tsx), ReportListView (ReportListView.tsx)"
  - "/panel renders ReportListView: first page of the account's reports with state, Warsaw date, excerpt, child, source and attack type, each row linking to /panel/{id}"
  - "Unbounded 600 weight loaded in the root layout (UI-SPEC A2)"
affects: [02-03, 02-04, 02-05, panel list, panel detail]

# Actuals (#2632)
actuals:
  tokens: 3700
  tasks: 2
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "List fetch in a client effect with an ignore flag; setState only in the promise continuation (react-hooks lint safe)"
    - "401 from any list call -> clearSession(\"expired\") and nothing else; the shell redirects to /login with the banner"
    - "Module-level Intl.DateTimeFormat instances (pl-PL, Europe/Warsaw) for dates and clock times"
    - "Hook-free row components rendered in tests with renderToStaticMarkup on data fetched through the real list route"

key-files:
  created:
    - web-app/src/app/_panel/badges.tsx
    - web-app/src/app/_panel/ReportRow.tsx
    - web-app/src/app/_panel/ReportListView.tsx
    - web-app/tests/panel/list-flow.test.ts
    - web-app/tests/panel/format.test.ts
  modified:
    - web-app/src/app/_panel/api.ts
    - web-app/src/app/_panel/format.ts
    - web-app/src/app/panel/page.tsx
    - web-app/src/app/layout.tsx

key-decisions:
  - "fillTemplate leaves an unknown {key} as written instead of blanking it, so a missing value is visible rather than silently dropped"
  - "childName treats a name that is empty after stripping the demo suffix as unknown and falls back to 'Dziecko', so a row never shows an empty child name"
  - "The sr-only loading text in ReportListView is a role=status paragraph; plan 02-03 replaces it with skeletons plus the page's single live region"

patterns-established:
  - "Every list/detail caller handles isUnauthorized(result) with clearSession(\"expired\") before any other branch"
  - "Report content and meta are rendered only as React text children (T-02-19)"

# PAN-01 is copied verbatim from the plan. This plan delivers the first slice only; REQUIREMENTS.md
# is NOT marked complete because plan 02-03 also declares PAN-01 (shared-ID gate, #2388).
requirements-completed: [PAN-01]

coverage:
  - id: D1
    description: "fetchReports: a parent gets [d0003, d0002, d0001] with next_cursor null via exactly /api/reports?limit=20, Bearer header only, token never in the path; a teacher (T1) gets [d0004, d0002]"
    requirement: "PAN-01"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#gives a parent the first page of their own reports newest first, with the token only in the header"
        status: pass
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#gives a teacher only the teacher-visible reports of their class"
        status: pass
    human_judgment: false
  - id: D2
    description: "A rejected token on the list maps to unauthorized and counts as a session expiry"
    requirement: "PAN-01"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/list-flow.test.ts#maps a rejected token to unauthorized, which counts as a session expiry"
        status: pass
    human_judgment: false
  - id: D3
    description: "ReportRow renders the state label, <time dateTime>, Warsaw date, the meta line with contract labels and the detail link, with no demo marking"
    requirement: "PAN-01"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/list-flow.test.ts#renders a row with the state label, Warsaw date, child, source and attack type, linking to the detail"
        status: pass
    human_judgment: false
  - id: D4
    description: "Row text rules: Warsaw dates across midnight, formatClock, the 140-character excerpt with whitespace collapse, the child-name fallback chain, rowMeta, fillTemplate, reportHref encoding"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/format.test.ts"
        status: pass
    human_judgment: false
  - id: D5
    description: "/panel builds and serves 200 offline with only the guard text on the server; Unbounded 500/600/700 loaded; build, typecheck, lint and the full suite (including the 02-01 guardrails) green"
    verification:
      - kind: e2e
        ref: "offline npm start check on port 3124 (login=200 panel=200, 'Wczytywanie panelu' present)"
        status: pass
      - kind: other
        ref: "npm --prefix web-app test && run build && run typecheck && run lint"
        status: pass
    human_judgment: false
  - id: D6
    description: "In a browser after login: the list renders in the panel shell with colored badges, the 600-weight heading, line-clamped excerpts and working row links; a 401 during the list fetch lands on /login with the session-expired banner; the landing looks unchanged"
    requirement: "PAN-01"
    verification: []
    human_judgment: true
    rationale: "Visual styling, the effect-driven fetch, the redirect after a 401 and the font weight only show in a real browser; vitest runs without a DOM"

# Metrics
duration: 5min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 02: Report List (First Page) Summary

**/panel now lists the logged-in account's own reports, newest first. The list comes from the real `GET /api/reports` through the new `fetchReports` (Bearer only). Each row has the colored state badge, a `<time>` date in Europe/Warsaw Polish format, a whitespace-collapsed 140-character excerpt and the "child · source · attack type" meta line, and links to `/panel/{id}`. A 401 ends the session with the expired banner. The root layout now also loads the Unbounded 600 weight.**

Changes are uncommitted: this run had no git authorization.

## Performance

- **Duration:** 5 min (4 min 43 s)
- **Started:** 2026-10-03T21:41:40Z
- **Completed:** 2026-10-03T21:46:23Z
- **Tasks:** 2 of 2
- **Files modified:** 9 (5 created, 4 modified)

## Accomplishments

- Tracer slice proven end to end. The guarded /panel renders ReportListView, which calls `fetchReports`. That goes through `apiCall` to the real list route on the fake Supabase, and the rows render from the response. Accounts get only their own reports, in the API order: P1 sees R3, R2, R1 and T1 sees R4, R2.
- ReportListView: an sr-only loading text, an error alert with the contract message for non-401 failures, and `clearSession("expired")` on a 401.
- Row text rules are locked by tests: Warsaw time across midnight, the 140-character excerpt, the child-name fallback through the demo children, then the session children, then "Dziecko", and the meta line with contract labels.
- `formatClock` and `fillTemplate` are ready for plan 02-03's "Odświeżono {time}".
- `layout.tsx` loads Unbounded `["500", "600", "700"]`; nothing else in the file changed.

## Task Commits

1. **Task 1: Tracer, the logged-in account sees the first page of its reports**: uncommitted (TDD: RED then GREEN, no commits)
2. **Task 2: Row text rules and the Unbounded 600 heading weight**: uncommitted (TDD: RED then GREEN, no commits)

**Plan metadata:** uncommitted

Commits: none. Changes were left uncommitted because this run had no git authorization.

## TDD Gate Compliance

- **Task 1 RED.** I wrote list-flow.test.ts first, then added signature-only stubs: `fetchReports` returning a network failure and `ReportRow` rendering an empty `<li>`. With the stubs in place all 4 target tests failed on their behavior assertions, with no load errors. `gsd-tools check tdd-red-evidence` returned **RED_EVIDENCE_OK** for the parent-list test and the row-render test. Vitest `tap-flat` output was used, with `# tests/# pass/# fail` summary lines computed from the same TAP. **GREEN:** 4/4 passed after the real implementation.
- **Task 2 RED.** I wrote format.test.ts first and added stubs for `formatClock` and `fillTemplate` that return empty strings. The clock-time and template tests failed on assertions (`expected '' to be '10:05'`, `expected '' to be 'Odświeżono 10:05'`) and the checker returned **RED_EVIDENCE_OK** for both. The excerpt and child-name tests passed already in RED, because Task 1 had implemented those helpers, which the plan anticipated ("adjust only if a bullet fails"). To show those tests are not vacuous, I ran a mutation probe: `max` 140 to 139, the whitespace collapse removed, the "Dziecko" fallback removed, and the session-children lookup skipped. Each mutation failed exactly one test. format.ts was restored byte for byte (cmp) and the panel suite went back to 41/41. **GREEN:** 4/4.
- RED/GREEN commits are absent because this run had no git authorization.

## Verification Results (exact)

| Command | Result |
|---|---|
| `npm --prefix web-app test -- tests/panel/list-flow.test.ts` | exit 0, 1 file, 4 passed |
| `npm --prefix web-app run build && ... typecheck && ... lint` (Task 1) | exit 0 / 0 / 0; build lists `○ /login` and `○ /panel` |
| Offline server check (port 3124, Supabase URL/key blank, dummy secret), after Task 1 | `login=200 panel=200`, guard text present, exit 0; port freed |
| Tracer feedback gate (interactive, end-of-phase, automated-only verify) | all verify commands re-run green, expanded to Task 2 |
| `npm --prefix web-app test -- tests/panel/format.test.ts` | exit 0, 1 file, 4 passed |
| `npm --prefix web-app test` (full suite) | exit 0, 22 files, 379 passed |
| `npm --prefix web-app run build` / `typecheck` / `lint` (Task 2) | exit 0 / 0 / 0 |
| Offline server check re-run on the final build | `login=200 panel=200`, exit 0; port freed |
| `test -d web-app/.next/static && ! grep -rqE 'SUPABASE_SERVICE_ROLE_KEY\|DEMO_AUTH_SECRET' web-app/.next/static` | exit 0 |
| Task 1 acceptance greps (fetchReports export, `/api/reports?`, "use client" placement, `<ReportListView`, StateBadge, `<StateBadge`, `reportHref(`) | all PASS |
| Task 2 acceptance greps (`"500", "600", "700"` exactly one line; six format.ts exports) | all PASS |

The offline server check ran the plan's exact command text from a bash script file (the user shell is zsh). The command was not modified.

## Files Created/Modified

- `web-app/src/app/_panel/api.ts`: adds `FetchReportsOptions` and `fetchReports` (URLSearchParams with limit, cursor verbatim when not null, state when not null; GET through apiCall with the token in the Authorization header only).
- `web-app/src/app/_panel/format.ts`: adds `formatDateTime`, `formatClock`, `fillTemplate`, `excerpt`, `childName` and `rowMeta`; `displayName` and `capitalize` are unchanged.
- `web-app/src/app/_panel/badges.tsx`: `StateBadge` (badgeBase plus the state classes, contract label verbatim).
- `web-app/src/app/_panel/ReportRow.tsx`: `ReportRow`, one `<li>` with one Link covering the row and three lines (badge plus `<time>`, the excerpt, the meta line).
- `web-app/src/app/_panel/ReportListView.tsx`: `ReportListView`, a client component that renders the h1, the role subtitle, the loading text, the error alert and the card list.
- `web-app/src/app/panel/page.tsx`: the server component `PanelPage` now renders `<ReportListView />`.
- `web-app/src/app/layout.tsx`: Unbounded weights `["500", "600", "700"]`.
- `web-app/tests/panel/list-flow.test.ts`: 4 end-to-end tests through the real list route.
- `web-app/tests/panel/format.test.ts`: 4 pure-function tests.

## Decisions Made

- `fillTemplate` leaves an unknown `{key}` as written, so a missing value shows instead of disappearing.
- `childName` treats a name that is empty after stripping the suffix as missing and falls back to "Dziecko".
- The loading text is a `role="status"` sr-only paragraph. Plan 02-03 replaces it with skeletons and the page's single live region.

## Deviations from Plan

None. The plan was executed as written.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** none.

## Issues Encountered

- The GSD RED-evidence checker expects node:test-style TAP summary lines, which vitest's TAP reporters do not print. I used `--reporter=tap-flat` and appended `# tests/# pass/# fail` lines counted from that same TAP output. The checker then classified both RED runs as RED_EVIDENCE_OK.
- The Task 2 excerpt and child-name tests passed already in RED, because Task 1 had implemented those helpers. I proved them non-vacuous with a mutation probe (see TDD Gate Compliance).
- The build still prints `Failed to find font override values for font Atkinson Hyperlegible Next`. That warning predates this plan and is out of scope.

## Known Stubs

| File | Line | Reason |
|---|---|---|
| `web-app/src/app/_panel/ReportListView.tsx` | 63-71 | An account with no reports gets an empty card (no empty-state copy), and only the first page loads (no "Pokaż więcej zgłoszeń", filter or refresh). This is intentional scope: plan 02-03 adds the empty states, skeletons, pagination, filter, refresh and the risk marker. |

Windows ledger: entry #2 (the `/panel` heading-only stub from 02-01) is resolved by this plan and marked fixed. The deferral above is recorded as a new entry so plan 02-03 can close it.

## Threat Flags

None. There is no new surface beyond the plan's threat model. T-02-19 is mitigated: the excerpt and meta line are React text children, the guardrail test passes, and the row render test checks the output. T-02-20 is accepted as planned: list-flow.test.ts shows P1 and T1 each get only their own ids, and the token appears only in the Authorization header.

## User Setup Required

None. No external service configuration is required.

## Human Check (end of phase)

For the verifier's end-of-phase UAT, check in a browser after logging in as the parent demo account:
- /panel shows "Zgłoszenia" in the 600 weight and the parent subtitle.
- There are three rows, newest first, each with a colored state badge, the date, a two-line excerpt and the line "Ola · …".
- Clicking a row goes to `/panel/{id}`.
- The landing page looks unchanged.

## Next Phase Readiness

Ready for 02-03: `fetchReports` already accepts `cursor` and `state`, `formatClock` and `fillTemplate` cover "Odświeżono {time}", and ReportListView has clear loading, error and ready branches to extend. PAN-01 stays open in REQUIREMENTS.md until 02-03 finishes.

---
*Phase: 02-panel-opiekuna*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 9 source/test files listed above and this SUMMARY exist on disk.
- No RED stubs remain in `src/app/_panel` (grep "RED stub" finds none); the mutation-probe copy of format.ts was restored byte for byte (cmp).
- Port 3124 is free after both offline checks.
- Commits: none. Changes were left uncommitted because this run had no git authorization.
