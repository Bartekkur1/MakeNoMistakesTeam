---
phase: 01-kontrakt-i-backend-spraw
plan: 06
subsystem: infra
tags: [heroku, deploy, smoke-test, supabase, nextjs, contract]

requires:
  - phase: 01-kontrakt-i-backend-spraw (plan 01-05)
    provides: transitions and comments routes, seed.sql, seed:check, examples conformance
  - phase: 01-kontrakt-i-backend-spraw (plan 01-04)
    provides: migration 20261003170000_reports.sql, create/list/detail routes
  - phase: 01-kontrakt-i-backend-spraw (plan 01-03)
    provides: /api/health with 503 storage_unavailable, demo login, CORS helpers
provides:
  - web-app/scripts/smoke-api.mjs (24-step live smoke, SMOKE_BASE_URL, SMOKE_VERIFY_ID persistence mode)
  - npm script smoke; start on ${PORT:-3000}; Procfile web npm start; engines node 22.x
  - Polish web-app/README.md (env var names, schema apply order, scripts, smoke, Heroku deploy)
  - live demo backend at https://bezpieczna-aura.pl (Heroku, Supabase schema + seed applied by the human)
  - CONTRACT.md Bazowy URL demo row and smoke note in the status line
affects: [widget (extension and phone page base URL), presentation (demo flow), roblox server, phase 2 panel]

actuals:
  tokens: 4725    # chars/4 over the added lines of the realized diff b74658b..399a5f8 (18901 chars, 6 files), SUMMARY excluded
  tasks: 3
  commits: 2
plan_head_before: b74658b71b55e2c5827db1a937374898289af407
plan_head_after: 399a5f8dff890bc704763e0ebfbf8309fc0217db

tech-stack:
  added: []
  patterns:
    - "Live smoke tool with Node built-ins and global fetch only; every write uses the smoke accounts; prints PASS/FAIL lines and a single SMOKE OK/FAILED verdict"
    - "Persistence check as a separate mode (SMOKE_VERIFY_ID) so it can run after a server restart"
    - "Base URL published in CONTRACT.md only after a live smoke run against it"

key-files:
  created:
    - web-app/scripts/smoke-api.mjs
  modified:
    - web-app/package.json
    - web-app/README.md
    - .planning/shared/CONTRACT.md
    - .planning/workstreams/widget/STATE.md
    - .planning/workstreams/presentation/STATE.md

key-decisions:
  - "Published demo base URL is the custom domain https://bezpieczna-aura.pl (served by Heroku), not a *.herokuapp.com address; the CONTRACT.md row keeps its 'demo (Heroku, https)' label"
  - "Task 3 ran on the orchestrator's instruction although C3 (local PERSIST OK) and C4 (concurrent smoke) were not reported; the URL itself passed a live smoke run and a PERSIST OK after a Heroku restart"
  - "Notification bullets in widget and presentation STATE.md use '-' instead of the plan's em dash (user copy rule)"

patterns-established:
  - "Shared-file change protocol: CONTRACT.md edit limited to the URL row and the status line; affected workstreams notified under their '## Notes from web-app' section"

requirements-completed: [API-01, API-02, API-06]

coverage:
  - id: D1
    description: "Production start honours $PORT and fails closed: with storage unconfigured GET /api/health answers 503 storage_unavailable instead of crashing"
    requirement: API-01
    verification:
      - kind: integration
        ref: "Task 1 offline verify: build, npm start on PORT=3123 with empty storage vars, smoke prints 'FAIL health: 503 storage_unavailable' and 'SMOKE FAILED'"
        status: pass
      - kind: manual
        ref: "Heroku before the config-var fix: /api/health returned 503 storage_unavailable (human report)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Full live flow on the real database: health, CORS preflight from chrome-extension://, demo login, create, list, detail, visibility 403/404, approve, comment, escalate, close, stale 409, reopen, close, history chain, other parent 404, seed present"
    requirement: API-02
    verification:
      - kind: manual
        ref: "human: SMOKE OK (http://localhost:3000)"
        status: pass
      - kind: manual
        ref: "human: SMOKE OK (https://bezpieczna-aura.pl)"
        status: pass
    human_judgment: true
    rationale: "D-06: only a human runs against the live Supabase project and Heroku"
  - id: D3
    description: "A report created before a restart is still returned with full history and comment (API-01 persistence)"
    requirement: API-01
    verification:
      - kind: manual
        ref: "human, Heroku after restart: PASS health, PASS login-parent, PASS persisted-detail, PERSIST OK c15607b6-29c9-4b2d-8191-703ff1e35e8d"
        status: pass
      - kind: manual
        ref: "human, local after dev-server restart (C3)"
        status: not-reported
    human_judgment: true
    rationale: "Heroku persistence proven; the local C3 run was not reported"
  - id: D4
    description: "Demo login (e-mail + 0000) with extension and panel scopes and visibility rules on the live backend"
    requirement: API-06
    verification:
      - kind: manual
        ref: "smoke steps login-wrong-code, login-extension, login-parent, login-teacher, teacher-hidden, other-parent-hidden inside both SMOKE OK runs"
        status: pass
    human_judgment: true
  - id: D5
    description: "Two parallel smoke runs both end with SMOKE OK (backstop)"
    verification:
      - kind: manual
        ref: "human C4: npm run smoke & npm run smoke; wait"
        status: not-reported
    human_judgment: true
    rationale: "Not reported by the human; recorded in .planning/WINDOWS.md as unrun-verify (id 1)"
  - id: D6
    description: "CONTRACT.md lists the verified https base URL; widget and presentation notified"
    verification:
      - kind: other
        ref: "Task 3 verify gates: Heroku row with https URL, approval kept, smoke note present, contract examples 13 files OK, both STATE.md files keep frontmatter and carry the URL bullet, no key-shaped strings"
        status: pass
    human_judgment: false

duration: 45min
completed: 2026-10-03
status: complete
---

# Phase 01 Plan 06: Heroku deploy, live smoke and published base URL Summary

**The backend is live at https://bezpieczna-aura.pl: a 24-step smoke tool proved the full report flow against the real Supabase database locally and on Heroku, a report survived a Heroku restart (PERSIST OK), and the base URL is now published in the approved CONTRACT.md with widget and presentation notified.**

## Performance

- **Duration:** about 45 min, including the human checkpoint
- **Started:** 2026-10-03T18:17Z
- **Completed:** 2026-10-03T19:02Z
- **Tasks:** 3 (1 tracer, 1 human checkpoint, 1 auto)
- **Files modified:** 6 (1 created, 5 modified)

## Accomplishments

- `web-app/scripts/smoke-api.mjs`: one command (`npm --prefix web-app run smoke`) runs health, CORS preflight from a `chrome-extension://` origin, demo login, create, list, detail, the visibility 403/404 checks, approve, comment, escalate (with and without note), close, stale 409, reopen, close again, the history chain, another parent's 404 and the seed check. `SMOKE_VERIFY_ID` switches to a persistence check after a restart. Writes only with the `*.test` smoke accounts.
- `web-app/README.md`: Polish setup guide with the three server-only variable names (no values), schema apply order, scripts, smoke usage and Heroku deploy of `web-app/` only.
- Live environment (human, D-06): both migrations and `seed.sql` applied in Supabase, `.env.local` and Heroku config vars set, app deployed from the branch.
- `.planning/shared/CONTRACT.md`: demo row = `https://bezpieczna-aura.pl`; status line gained "backend demo wdrożony i sprawdzony testem dymnym (2026-10-03)". No other contract text changed.
- Widget and presentation `STATE.md`: one bullet each under `## Notes from web-app` with the URL, the pointer to "Logowanie demo" and the note that `*.test` accounts are only for the smoke test.

## Task 2 human verification (as reported, 2026-10-03)

| Step | Result |
|---|---|
| A. Migrations `20261003170000_reports.sql`, `20261003170100_report_transitions.sql` and `seed.sql` applied | Done |
| B. `web-app/.env.local` with the three variables | Done |
| C2. Local smoke | `SMOKE OK (http://localhost:3000)` |
| C3. Local restart, `PERSIST OK` | Not reported - not verified |
| C4. Two parallel smoke runs ("concurrent ok") | Not reported - not verified |
| D. Heroku deploy | Deployed from the branch; base URL `https://bezpieczna-aura.pl` |
| D5. Public smoke | First `/api/health` returned 503 `storage_unavailable` (Heroku config vars); after the user fixed them: `SMOKE OK (https://bezpieczna-aura.pl)` |
| D6. After Heroku restart | `PASS health`, `PASS login-parent`, `PASS persisted-detail`, `PERSIST OK c15607b6-29c9-4b2d-8191-703ff1e35e8d` |

The 503 incident is the designed fail-closed behaviour (plan truth: "with storage unconfigured it answers GET /api/health with 503 storage_unavailable instead of crashing"), so it also served as a live confirmation of that path. The cause was the Heroku config vars, fixed by the user; no code change was needed.

After the resume the executor re-ran only the offline gates: `npm --prefix web-app test` (15 files, 317 tests passed), `npm --prefix web-app run seed:check` ("seed.sql is up to date"), `node web-app/scripts/check-contract-examples.mjs` ("contract examples: 13 files OK"). No SQL, Supabase, Heroku or live smoke call was made by the agent, and no `.env*` file was opened.

## Task Commits

1. **Task 1: Tracer - start on $PORT plus live smoke tool**: `68c1585` (feat)
2. **Task 2: Human schema push, secrets, live verification and Heroku deploy**: no commit (human-only, D-06)
3. **Task 3: Publish base URL and notify workstreams**: `399a5f8` (docs)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY

## Files Created/Modified

- `web-app/scripts/smoke-api.mjs`: live smoke and persistence tool (created)
- `web-app/package.json`: `smoke` script (start on `${PORT:-3000}` and engines `22.x` were already in `75da7ed`)
- `web-app/README.md`: replaced the create-next-app README
- `.planning/shared/CONTRACT.md`: Bazowy URL demo row, status line note
- `.planning/workstreams/widget/STATE.md`, `.planning/workstreams/presentation/STATE.md`: URL bullet
- `web-app/Procfile`: unchanged in this plan (`web: npm start`, committed in `75da7ed`)

## Decisions Made

- **Custom domain:** the published URL is `https://bezpieczna-aura.pl`, the verified base URL the user reported. The plan expected a `*.herokuapp.com` address but its resume signal allowed "the app's https URL"; the row label still names Heroku so the Task 3 gate matches.
- **Hyphen in notifications:** the bullets use "-" instead of the plan's em dash (user copy rule). The existing em dash in the CONTRACT.md status line was left as is, because the plan allows only an append there.

## Deviations from Plan

### Auto-fixed Issues

None in code.

### Process deviations

**1. Task 3 precondition partially unmet, run on explicit instruction**
- **Found during:** Task 3 precondition check
- **Issue:** The precondition asks for two `PERSIST OK` lines and "concurrent ok". Only the Heroku `PERSIST OK` was reported; C3 (local restart) and C4 (parallel smoke) were not.
- **Handling:** The orchestrator, relaying the user's report, directed Task 3 to run and C3/C4 to be recorded as not verified. The plan's prohibition "MUST NOT publish a demo base URL that has not passed a live smoke run" still holds: the published URL passed `SMOKE OK` and `PERSIST OK` after a restart.
- **Tracking:** `.planning/WINDOWS.md` entry 1 (unrun-verify).

**2. Artifact `contains: "herokuapp.com"` for CONTRACT.md does not match**
- **Issue:** The verified URL is a custom domain. A literal check for `herokuapp.com` in CONTRACT.md would fail; the Task 3 verify gates (Heroku row with an https URL) pass.
- **Handling:** Kept the user's verified URL; no other contract text changed.

**3. Task 1 files partly pre-existing**
- `web-app/Procfile`, `start` on `${PORT:-3000}` and `engines.node` 22.x were committed earlier in `75da7ed`; Task 1 added only the smoke script, the tool and the README (noted in the `68c1585` message).

## Issues Encountered

- Heroku `/api/health` returned 503 `storage_unavailable` until the user corrected the config vars (see Task 2 table).

## Known Stubs

None.

## Deferred Issues

- C3 and C4 not verified. To close them: `npm --prefix web-app run dev`, create a report with `npm --prefix web-app run smoke`, restart the dev server, then `SMOKE_VERIFY_ID=<id> npm --prefix web-app run smoke`; and run `npm --prefix web-app run smoke & npm --prefix web-app run smoke; wait`. Then mark `.planning/WINDOWS.md` entry 1 fixed.

## User Setup Required

Done by the user (Supabase schema + seed, `.env.local`, Heroku config vars and deploy). Remaining optional step: the C3/C4 checks above.

## Next Phase Readiness

- Phase 1 has all 6 plans executed; the live backend and the published base URL unblock the widget, presentation, Roblox server and the phase 2 panel.
- `.planning/workstreams/web-app/REQUIREMENTS.md` (untracked, user-owned) still shows API-01, API-02 and API-06 unticked; the live smoke supports ticking all three, left to the user.

## Self-Check: PASSED

- FOUND: web-app/scripts/smoke-api.mjs, web-app/README.md, web-app/Procfile, .planning/shared/CONTRACT.md (contains `https://bezpieczna-aura.pl`)
- FOUND commits: 68c1585, 399a5f8
