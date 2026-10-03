---
phase: 02-panel-opiekuna
plan: 01
subsystem: ui
tags: [nextjs, react, tailwind, auth, session, localStorage, useSyncExternalStore, vitest]

# Dependency graph
requires:
  - phase: 01-kontrakt-i-backend-spraw
    provides: "POST /api/auth/login (scope panel), GET /api/auth/me, contract types/labels/error messages, demo accounts, fake Supabase + dataset test helpers"
provides:
  - "_panel foundation: styles.ts, content.ts, format.ts (displayName, capitalize), api.ts (apiCall, loginRequest, errorMessage, isUnauthorized), session.ts (localStorage session, notices, useSession)"
  - "Two-step /login screen (LoginScreen) and the guarded /panel shell (PanelShell, PanelHeader, useCurrentSession, SessionLoading)"
  - "Routes /login, /panel (layout + heading page)"
  - "tests/helpers/panel-fetch.ts: panelFetch, fetchLog, installPanelFetch, respondWith, failFetch"
  - "Panel guardrail test (no server imports, no raw HTML/console/cookies, fetch only in api.ts, storage only in session.ts, no token in query, no demo copy, route allowlist)"
affects: [02-02, 02-03, 02-04, 02-05, panel list, panel detail]

# Actuals (#2632)
actuals:
  tokens: 13827
  tasks: 2
  commits: 0

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Panel API client returns ApiResult<T> = { ok: true, value } | ApiFailure; messages always from API_ERROR_MESSAGES_PL, never the server text"
    - "Session as useSyncExternalStore over localStorage: server snapshot null = loading, '' = anonymous, raw string = authenticated"
    - "Session end reason passed to /login through sessionStorage notice, read once with useState(readNotice)"
    - "Panel tests drive the real route handlers through panelFetch on the fake Supabase; hook-free components rendered with renderToStaticMarkup"

key-files:
  created:
    - web-app/src/app/_panel/styles.ts
    - web-app/src/app/_panel/content.ts
    - web-app/src/app/_panel/format.ts
    - web-app/src/app/_panel/api.ts
    - web-app/src/app/_panel/session.ts
    - web-app/src/app/_panel/LoginScreen.tsx
    - web-app/src/app/_panel/PanelShell.tsx
    - web-app/src/app/login/page.tsx
    - web-app/src/app/panel/layout.tsx
    - web-app/src/app/panel/page.tsx
    - web-app/tests/helpers/panel-fetch.ts
    - web-app/tests/panel/login-flow.test.ts
    - web-app/tests/panel/session.test.ts
    - web-app/tests/panel/guardrails.test.ts
  modified: []

key-decisions:
  - "Login 400 validation_error is mapped to the panel's own field copy (email -> step 1 'Wpisz poprawny adres e-mail.', anything else -> 'Wpisz kod logowania.'); server details text is never rendered on /login (D-02)"
  - "errorMessage(validation_error without details) falls back to the internal_error text plus ' Spróbuj ponownie.'"
  - "PanelHeader brand text is sr-only below sm so logo, truncated name and 'Wyloguj się' fit at 320px; the link keeps its accessible name"
  - "SessionLoading is exported from PanelShell.tsx and reused by LoginScreen, so the guard text is defined once"
  - "The code input is readOnly (not disabled) while the login request is pending, so it can be refocused after a 401"

patterns-established:
  - "Guardrail test scans src/app/_panel, src/app/login and src/app/panel with comments stripped; later panel files inherit it"
  - "Every page.tsx outside src/app/api must be page.tsx, login/page.tsx, panel/page.tsx or panel/[id]/page.tsx (D-03)"

requirements-completed: [PAN-04]

coverage:
  - id: D1
    description: "Panel API client: login through the real route with scope panel, identical invalid_credentials result for unknown e-mail and wrong code, Bearer-only token, unauthorized detection"
    requirement: "PAN-04"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/login-flow.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "Session storage rules: decodeSession strictness, expiry at expires_at, save/clear with notice, blocked storage as no session; apiCall error mapping and errorMessage"
    requirement: "PAN-04"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/session.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Panel header shows display name without (demo), capitalized role and 'Wyloguj się'; no demo marking, no code"
    requirement: "PAN-04"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/login-flow.test.ts#renders the header with the account name and role, logout and no demo marking"
        status: pass
    human_judgment: false
  - id: D4
    description: "Guardrails: no server imports, no raw HTML/console/cookies, fetch only in api.ts, storage only in session.ts, no token in query, no demo copy, no child-facing route"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/guardrails.test.ts"
        status: pass
      - kind: other
        ref: "test -d web-app/.next/static && ! grep -rqE 'SUPABASE_SERVICE_ROLE_KEY|DEMO_AUTH_SECRET' web-app/.next/static"
        status: pass
    human_judgment: false
  - id: D5
    description: "Routes /login and /panel build and serve 200 offline; /panel server HTML shows only 'Wczytywanie panelu…'"
    verification:
      - kind: e2e
        ref: "offline npm start check on port 3124 (login=200 panel=200, guard text present)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Browser flow: two-step login with field errors and focus moves, redirect /panel <-> /login without flashing or loops, 'Wylogowano.' and session-expired banners, session survives closing the tab"
    requirement: "PAN-04"
    verification: []
    human_judgment: true
    rationale: "Focus moves, redirects, banners and tab persistence happen in a real browser; the test environment has no DOM (Task 2 human-check)"

# Metrics
duration: 8min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 01: Login and Guarded Panel Shell Summary

**Two-step /login (e-mail, then code) against the real login route, a localStorage session read through useSyncExternalStore, and a guarded /panel shell with the account name, role and "Wyloguj się". The plan also adds a guardrail test that locks out server imports, demo marking and child-facing routes.**

Changes are uncommitted: this run had no git authorization.

## Performance

- **Duration:** 8 min
- **Started:** 2026-10-03T21:31:01Z
- **Completed:** 2026-10-03T21:39:09Z
- **Tasks:** 2 of 2
- **Files modified:** 14 (all created)

## Accomplishments

- Tracer slice proven end to end: LoginScreen calls loginRequest, which goes through the real POST /api/auth/login; saveSession writes localStorage, useSession flips to authenticated, and PanelShell renders the header with the name, role and logout.
- Session lifecycle (D-07). A stored session that has expired or can't be read is dropped without a request and becomes the session-expired banner on /login. Logout clears the session with no API call and shows "Wylogowano.". A 401 `unauthorized` is told apart from a login `invalid_credentials`.
- The API client maps every failure (envelope code, status fallback, non-JSON bodies, network errors) to a contract code and its Polish message. The server's own message is never shown.
- Guardrail test over every panel source file, inherited by plans 02-02..02-05.

## Task Commits

1. **Task 1: Tracer, parent logs in in two steps and lands in the guarded panel**: uncommitted (TDD: RED then GREEN, no commits)
2. **Task 2: Session lifecycle and panel guardrails**: uncommitted (TDD: tests first, no commits)

**Plan metadata:** uncommitted

Commits: none. Changes were left uncommitted because this run had no git authorization.

## TDD Gate Compliance

- **Task 1 RED.** The first run, before any module existed, failed with a module-not-found error. Under tdd.md that is INVALID_RED (a load failure). I then added signature-only stubs, and all 8 target tests failed on their own assertions: a valid RED. **GREEN:** 8/8 passed after the real implementation.
- **Task 2 RED.** The new tests passed before any Task 2 code change (an unexpected GREEN). Cause: Task 1 actions (4) and (5) already specified the full api.ts mapping and the session.ts storage functions, so these tests pin behavior that already existed. The Task 2 code itself (the notice banner and the expired-notice branch in the shell) only runs in a browser and can't be unit-tested without a DOM. To show the tests are not vacuous, I ran a mutation probe. I added temporary violating files (a Supabase import, a lib/server import, DEMO_LOGIN_CODE and FOOTER imports, console, document.cookie, localStorage, fetch, raw HTML, an `src/app/dziecko/page.tsx` route), mutated isSessionExpired (`<=` to `<`), errorMessage (dropped the first detail), the content copy (demo, em dash, 0000), and added a `?access_token=` query in api.ts. Every targeted guard and test failed: 8 failures in the first probe, plus 1 for rule (d). All files were then restored from scratchpad backups and the suite went back to 25/25.
- RED/GREEN commits are absent because this run had no git authorization.

## Verification Results (exact)

| Command | Result |
|---|---|
| `npm --prefix web-app test -- tests/panel/login-flow.test.ts` | exit 0, 1 file, 8 passed |
| `npm --prefix web-app run build && ... typecheck && ... lint` (Task 1) | exit 0; build lists `○ /login` and `○ /panel` |
| Offline server check (port 3124, Supabase URL/key blank, dummy secret) | `login=200 panel=200`, guard text present, exit 0; port freed afterwards (run after Task 1 and again after Task 2) |
| Tracer feedback gate re-run (interactive, end-of-phase, automated-only verify) | passed, expanded to Task 2 |
| `npm --prefix web-app test -- tests/panel/session.test.ts tests/panel/guardrails.test.ts` | exit 0, 2 files, 25 passed |
| `npm --prefix web-app test` (full suite) | exit 0, 20 files, 371 passed |
| `npm --prefix web-app run build` / `typecheck` / `lint` (Task 2) | exit 0 / 0 / 0 |
| `test -d web-app/.next/static && ! grep -rqE 'SUPABASE_SERVICE_ROLE_KEY\|DEMO_AUTH_SECRET' web-app/.next/static` | exit 0 |
| Task 1 acceptance greps (exports, login path, storage key, useSyncExternalStore, "use client" placement) | all PASS |
| Task 2 acceptance grep (the four allowed page paths in guardrails.test.ts) | all PASS |

The offline server check ran the plan's exact command inside `bash -c` (the user shell is zsh), with the inner single quotes swapped for double quotes. Semantics are unchanged.

## Files Created/Modified

- `web-app/src/app/_panel/styles.ts`: panel class strings (secondary/primary-disabled buttons, inputs, select, card, state and risk badges, alerts, field error, skeleton).
- `web-app/src/app/_panel/content.ts`: PANEL_HREF, reportHref, SHELL, LOGIN, LIST, ERRORS and NAMES copy (no em dashes, no demo marking).
- `web-app/src/app/_panel/format.ts`: displayName (strips " (demo)" and " (smoke)"), capitalize.
- `web-app/src/app/_panel/api.ts`: apiCall (Bearer header, no-store, contract error mapping), loginRequest, errorMessage, isUnauthorized.
- `web-app/src/app/_panel/session.ts`: storage keys, decodeSession, isSessionExpired, sessionFromLogin, save/clear/has session, read/clear notice, useSession.
- `web-app/src/app/_panel/LoginScreen.tsx`: LoginScreen (guard plus redirect to /panel), two-step LoginCard, session-end banner.
- `web-app/src/app/_panel/PanelShell.tsx`: PanelShell (guard, expired notice, redirect to /login), PanelHeader, SessionLoading, useCurrentSession.
- `web-app/src/app/login/page.tsx`, `web-app/src/app/panel/layout.tsx`, `web-app/src/app/panel/page.tsx`: thin server route files.
- `web-app/tests/helpers/panel-fetch.ts`: in-process fetch routing to the real handlers, plus respondWith and failFetch stubs.
- `web-app/tests/panel/login-flow.test.ts`, `session.test.ts`, `guardrails.test.ts`.

## Decisions Made

- Login validation_error never shows server text. An e-mail detail sends the user back to step 1 with "Wpisz poprawny adres e-mail.". Any other detail shows "Wpisz kod logowania." under the code field.
- The header brand word is `sr-only` below `sm` (it stays visible from `sm` up). Without that, the logo, brand, truncated name and "Wyloguj się" can't fit at 320px. The link keeps its accessible name.
- SessionLoading is defined once in PanelShell.tsx and reused by LoginScreen.
- The code input is `readOnly` while pending, not `disabled`, so focus can return to it after a 401.
- `session.ts` has no "use client" directive. It is a plain module imported only by client components; tests import it directly.

## Deviations from Plan

### Auto-fixed Issues

None. The plan was executed as written. The only additions are within the plan's discretion: the exported `SessionLoading` helper, the `sr-only sm:not-sr-only` brand text for 320px overflow, and an extra session-storage test block in session.test.ts using a fake window. Every one of them serves a stated must-have.

**Total deviations:** 0 auto-fixed.
**Impact on plan:** none.

## Issues Encountered

- The first Task 1 RED run was a load failure (INVALID_RED). Fixed by adding signature-only stubs before GREEN.
- The Task 2 tests passed before the Task 2 code change. I investigated and documented this under TDD Gate Compliance, and proved the tests non-vacuous with a mutation probe.
- The build logs a warning: `Failed to find font override values for font Atkinson Hyperlegible Next`. It comes from the existing root layout, was not introduced by this plan, and is out of scope.

## Known Stubs

| File | Line | Reason |
|---|---|---|
| `web-app/src/app/panel/page.tsx` | 4-9 | Intentional: the page renders only the "Zgłoszenia" heading inside the guarded shell. Plan 02-02 replaces the body with `<ReportListView />` (PAN-01). |

`LIST`, `NAMES` and `reportHref` in content.ts are not consumed yet. Plan 02-02 uses them; they are defined now so the copy guardrail covers them.

## Threat Flags

None. No new surface beyond the plan's threat model. T-02-01, T-02-02, T-02-03, T-02-05 and T-02-06 are mitigated as planned and covered by guardrails.test.ts, login-flow.test.ts and the .next/static scan.

## User Setup Required

None. No external service configuration is required.

## Human Check (end of phase)

Task 2 carries a `<human-check>` for the verifier's end-of-phase UAT. In a browser: /panel redirects to /login, field errors appear, a wrong code keeps the e-mail, the header shows "Mama Oli" and "Rodzic", logout shows "Wylogowano.", the session survives closing the tab, and nothing mentions demo.

## Next Phase Readiness

Ready for 02-02 (report list): apiCall, useCurrentSession, the content copy, the styles and the guardrails are all in place. Every later API caller should handle a 401 with `clearSession("expired")`.

---
*Phase: 02-panel-opiekuna*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 14 created source/test files and this SUMMARY exist on disk.
- Mutation-probe files (`src/app/_panel/zzProbe.tsx`, `src/app/dziecko/page.tsx`) are removed; mutated files restored (suite back to 25/25, full suite 371/371).
- Commits: none. Changes were left uncommitted because this run had no git authorization.
