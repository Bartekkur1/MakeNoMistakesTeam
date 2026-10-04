---
phase: 01-kontrakt-i-backend-spraw
plan: 02
subsystem: api
tags: [contract, approval-gate, package-legitimacy, supabase, api-coverage]

requires:
  - phase: 01-kontrakt-i-backend-spraw (plan 01-01)
    provides: "Contract v2 (CONTRACT.md, types.ts, demo-accounts.ts, 13 example files, checker) sent to osoba 2"
provides:
  - "Contract v2 approved by osoba 2 on 2026-10-03 without edits; CONTRACT.md status line updated"
  - "Package legitimacy cleared for plan 01-03: @supabase/supabase-js@^2.117.2 and vitest@^4.1.11 (with vite)"
  - "Notes from web-app in widget and presentation STATE.md pointing to contract v2 and the examples"
  - "COVERAGE.md v2: Supabase capability matrix (11 rows: 3 INTEGRATE, 8 OPT-OUT); api-coverage gate passes"
affects: [01-03, 01-04, 01-05, 01-06, widget, presentation]

actuals:
  tokens: 623
  tasks: 3
  commits: 2
plan_head_before: aa39977ae35be46df85873510bd4f0df384a9ffb
plan_head_after: 3faded62ea1d948a63fc9624b06a3af75e8ade9f

tech-stack:
  added: []
  patterns:
    - "Supabase writes that change report state go only through Postgres RPCs (create_report, transition_report), so state and history stay atomic"

key-files:
  created: []
  modified:
    - .planning/shared/CONTRACT.md
    - .planning/workstreams/widget/STATE.md
    - .planning/workstreams/presentation/STATE.md
    - .planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/COVERAGE.md

key-decisions:
  - "Osoba 2 approved contract v2 as written (answer: approve, no edits) on 2026-10-03; relayed by the user"
  - "Packages approved for plan 01-03 (answer: approved, 2026-10-03): @supabase/supabase-js@^2.117.2 (dependency) and vitest@^4.1.11 (devDependency, pulls in vite); nothing installed in 01-02"
  - "Supabase surface for v2: INTEGRATE table-select, table-insert, rpc; OPT-OUT table-update, table-upsert, table-delete, auth, storage, realtime, functions, schema switching"

patterns-established:
  - "Contract change notification: a '## Notes from web-app' section appended to the end of each affected workstream's STATE.md, frontmatter untouched"

requirements-completed: [API-01, API-02, API-06]

coverage:
  - id: D1
    description: "Contract v2 approved by osoba 2 and published as approved in the CONTRACT.md status line"
    requirement: API-02
    verification:
      - kind: other
        ref: "grep -q '^\\*\\*Status:\\*\\* wersja 2 — zatwierdzona przez osobę 2' .planning/shared/CONTRACT.md && node web-app/scripts/check-contract-examples.mjs | grep -qx 'contract examples: 13 files OK'"
        status: pass
    human_judgment: true
    rationale: "The approval itself is a human decision (blocking-human checkpoint, answered 'approve' by the user for osoba 2); automation only proves the status line and example consistency"
  - id: D2
    description: "Package legitimacy for @supabase/supabase-js@^2.117.2 and vitest@^4.1.11 (with vite) confirmed by a human"
    verification: []
    human_judgment: true
    rationale: "npm publisher and repository checks were done by the user at a blocking-human checkpoint; no automated proof exists"
  - id: D3
    description: "Widget and presentation STATE.md carry a '## Notes from web-app' entry pointing to contract v2, with frontmatter intact"
    requirement: API-06
    verification:
      - kind: other
        ref: "for f in widget/STATE.md presentation/STATE.md: head -1 is '---', grep '^## Notes from web-app', grep 'shared/CONTRACT.md'"
        status: pass
    human_judgment: false
  - id: D4
    description: "COVERAGE.md rewritten as the v2 Supabase capability matrix; api-coverage seal gate passes"
    requirement: API-01
    verification:
      - kind: other
        ref: "node .claude/gsd-core/bin/gsd-tools.cjs check api-coverage.verify-pre 01 --ws web-app -> passed true, surface 11, integrate 3, optout 8"
        status: pass
      - kind: other
        ref: "grep rpc row INTEGRATE + transition_report present + no sb_secret_/eyJhbGciOi in COVERAGE.md and both STATE.md"
        status: pass
    human_judgment: false

duration: 1min
completed: 2026-10-03
status: complete
---

# Phase 1 Plan 02: Approvals for contract v2 and packages Summary

**Osoba 2 approved contract v2 without edits and the user cleared @supabase/supabase-js@^2.117.2 and vitest@^4.1.11 (with vite) for install, both on 2026-10-03. CONTRACT.md is now marked approved, the widget and presentation tracks are notified, and COVERAGE.md is the v2 Supabase matrix (3 INTEGRATE, 8 OPT-OUT), which passes the api-coverage gate**

## Performance

- **Duration:** 1 min (continuation run for Task 3; the two checkpoints were answered earlier by the user through the orchestrator)
- **Started:** 2026-10-03T16:50:42Z
- **Completed:** 2026-10-03T16:51:43Z
- **Tasks:** 3 (2 blocking-human checkpoints resolved, 1 auto)
- **Files modified:** 4

## Checkpoint Decisions

| Task | Type | Gate | Answer | Date | Who |
|------|------|------|--------|------|-----|
| 1: Osoba 2 approves contract v2 | checkpoint:decision | blocking-human | `approve` (no edits) | 2026-10-03 | Osoba 2, relayed by the user |
| 2: Package legitimacy gate | checkpoint:human-verify | blocking-human | `approved` | 2026-10-03 | The user |

- **Task 1 precheck:** before the question was put to the user, the orchestrator ran `node web-app/scripts/check-contract-examples.mjs`, which printed `contract examples: 13 files OK`. Osoba 2 therefore reviewed a consistent contract. Task 3 re-ran the checker after the status edit and got the same result.
- **Task 1 outcome:** `approve`. No edits were requested, so Task 3 step (1) (apply listed edits) was skipped. Nothing in types.ts, demo-accounts.ts, the checker or the example JSON files changed.
- **Task 2 outcome:** `approved` for exactly these packages and ranges:
  - `@supabase/supabase-js@^2.117.2` (dependency, D-02)
  - `vitest@^4.1.11` (devDependency), together with the `vite` it pulls in (vite 6–8)
- Nothing was installed in this plan. Plan 01-03 installs only these names and ranges, without `--force` or `--legacy-peer-deps`.
- Neither checkpoint was auto-approved. Both were answered by the user, and auto-advance is off in config.

## Accomplishments

- `.planning/shared/CONTRACT.md`: the status line now reads `**Status:** wersja 2 — zatwierdzona przez osobę 2 (2026-10-03)`. Nothing else changed (diff: 1 line).
- `.planning/workstreams/widget/STATE.md` and `.planning/workstreams/presentation/STATE.md`: a `## Notes from web-app` section was appended at the end with the planned bullets, as `shared/README.md` requires for a contract change. Frontmatter and the other sections are untouched. Roblox is not affected, so its STATE.md was left alone.
- `COVERAGE.md` was rewritten for the v2 model with the planned 11 rows. INTEGRATE: table-select, table-insert and rpc (create_report, transition_report, list_reports). OPT-OUT, each with a reason: table-update, table-upsert, table-delete, auth, storage, realtime, functions and schema switching. The scope note says the SDK is imported only by `web-app/src/lib/server/supabase.ts`, and that a human applies the schema (D-06).

## Task Commits

1. **Task 1: Osoba 2 approves contract v2** - no commit (decision checkpoint, no file changes)
2. **Task 2: Package legitimacy gate** - no commit (human-verify checkpoint, nothing installed)
3. **Task 3: Record the approvals**
   - `a8a2b85` docs(shared): kontrakt v2 zatwierdzony przez osobę 2 (01-02) (CONTRACT.md + 2 STATE.md files)
   - `3faded6` docs(01): macierz pokrycia Supabase dla modelu v2 (01-02) (COVERAGE.md)

**Plan metadata:** recorded in the `docs(01-02)` commit that adds this SUMMARY.

## Verification Results

- `grep -q '^\*\*Status:\*\* wersja 2 — zatwierdzona przez osobę 2' .planning/shared/CONTRACT.md && node web-app/scripts/check-contract-examples.mjs | grep -qx 'contract examples: 13 files OK'` -> PASS
- STATE.md loop (frontmatter `---` on line 1, `## Notes from web-app`, `shared/CONTRACT.md`) for widget and presentation -> PASS
- `node .claude/gsd-core/bin/gsd-tools.cjs check api-coverage.verify-pre 01 --ws web-app` -> `"block": false`, `"passed": true`, counts `surface 11 / integrate 3 / optout 8` -> PASS
- rpc row is INTEGRATE, `transition_report` present, and there are no `sb_secret_` / `eyJhbGciOi` strings in COVERAGE.md or either STATE.md -> PASS
- Before editing, `git diff --quiet` confirmed that widget/STATE.md, presentation/STATE.md and CONTRACT.md were clean. Each commit staged only explicit paths (checked with `git diff --cached --name-only`).
- D-06 holds: no SQL, Supabase CLI or Supabase API call was made, and no `.env*` file was read.

## Files Created/Modified

- `.planning/shared/CONTRACT.md` - status line: approved by osoba 2 (2026-10-03)
- `.planning/workstreams/widget/STATE.md` - `## Notes from web-app` with the contract v2 summary for the widget
- `.planning/workstreams/presentation/STATE.md` - `## Notes from web-app` with the demo workflow, accounts and dataset pointers
- `.planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/COVERAGE.md` - v2 Supabase capability matrix. The file was untracked before this plan; this is its first commit.

## Decisions Made

- Contract v2 is approved as written (see Checkpoint Decisions). It is now a one-way door: later changes need contract version 3 and coordinated edits in widget, panel and backend.
- Packages are cleared exactly as listed. `server-only`, `zod` and any JWT library stay out, as the plan states.
- Supabase surface: every state change goes through RPCs, history and comments are append-only, and there is no Supabase auth, storage, realtime or Edge Functions.

## Deviations from Plan

None - plan executed exactly as written. (Task 3 step (1) was skipped because the plan makes it conditional on "approve-with-edits".)

## Issues Encountered

- Node prints `MODULE_TYPELESS_PACKAGE_JSON` warnings on stderr when the checker runs. This is known from 01-01, and the untracked `web-app/package.json` that plan 01-03 commits causes it. Output and exit code are unaffected.
- `requirements.ready-ids` reported 0/3 ready, because sibling plans also declare API-01, API-02 and API-06 and have no SUMMARY yet. REQUIREMENTS.md was not marked.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 01-03 can start. Both preconditions are met: the contract decision is `approve`, and the package decision is `approved` for @supabase/supabase-js@^2.117.2 and vitest@^4.1.11 (with vite).
- COVERAGE.md names the Postgres functions (create_report, transition_report, list_reports) that plans 01-04 and 01-05 create.
- The base URL placeholder in CONTRACT.md stays for plan 01-06, as planned.

---
*Phase: 01-kontrakt-i-backend-spraw*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All four modified files exist on disk.
- Commits a8a2b85 and 3faded6 exist. `git log --grep=01-02` lists both.
