---
phase: 01-kontrakt-i-backend-spraw
plan: 04
subsystem: api
tags: [nextjs, route-handlers, supabase-js, postgres, plpgsql, rls, cursor-pagination, vitest]

requires:
  - phase: 01-kontrakt-i-backend-spraw (plan 01-01)
    provides: contract v2 types.ts (enums, TRANSITIONS, LIMITS, field lists) and demo-accounts.ts
  - phase: 01-kontrakt-i-backend-spraw (plan 01-03)
    provides: http helpers, requireSession, getSupabase, isUuid, fakeSupabase, tokenFor/authHeaders/apiRequest
provides:
  - migration 20261003170000_reports.sql (reports, report_history, report_comments, append-only triggers, RLS, create_report, list_reports)
  - POST /api/reports, GET /api/reports (paginated), GET /api/reports/{id}, OPTIONS on both
  - access.ts (canView, childForNewReport, listScopeFor, ListScope)
  - pagination.ts (encodeCursor, decodeCursor, paginate)
  - reports.ts repository (mappers, createReport, getReport, getReportTimeline, listReports)
  - validate.ts parseNewReport and parseListQuery
  - fake create_report/list_reports RPCs with seq counters; tests/helpers/dataset.ts
affects: [01-05 transitions and comments, 01-06 live schema push and smoke test, phase-2 panel, widget extension submit]

actuals:
  tokens: 23200    # chars/4 over the added lines of the realized diff (92886 chars, 13 files)
  tasks: 3
  commits: 5
plan_head_before: dcb975c80a583d98d24b669827106b809680c2ca
plan_head_after: 8145e273e3655f65f6a8f6300f6377bdbd753ecf

tech-stack:
  added: []
  patterns:
    - "Writes go through Postgres functions (rpc) so a row and its history entry commit together"
    - "Repository run() wrapper: thrown call, returned error, null row or contract-breaking row -> StorageUnavailableError (503, no false confirmation)"
    - "Mappers pick exactly the contract fields in contract order and normalize timestamps to .sssZ"
    - "Visibility is one rule in two shapes: canView for details, listScopeFor for list_reports filters"
    - "Fake RPCs in tests/helpers/fake-supabase.ts mirror the SQL functions; schema-mirror.test.ts locks the SQL to types.ts"

key-files:
  created:
    - web-app/supabase/migrations/20261003170000_reports.sql
    - web-app/src/lib/server/access.ts
    - web-app/src/lib/server/pagination.ts
    - web-app/src/lib/server/reports.ts
    - web-app/src/app/api/reports/route.ts
    - web-app/src/app/api/reports/[id]/route.ts
    - web-app/tests/helpers/dataset.ts
    - web-app/tests/api/reports.test.ts
    - web-app/tests/api/reports-list.test.ts
    - web-app/tests/lib/schema-mirror.test.ts
    - web-app/tests/lib/reports-repo.test.ts
  modified:
    - web-app/src/lib/server/validate.ts
    - web-app/tests/helpers/fake-supabase.ts

key-decisions:
  - "taken_actions omitted -> [] (contract, NewReportRequest and checker all say optional); only a present non-list value is a 400. The plan's 'missing taken_actions -> 400' bullet was resolved in favour of the approved contract"
  - "Duplicate taken_actions -> 400 'Działania nie mogą się powtarzać.' as the plan and the checker's request rules require; CONTRACT.md prose still says the server deduplicates (flag for the contract owner)"
  - "decodeCursor accepts only the canonical encoding (re-encodes and compares, like the contract checker); list_reports also raises on a half cursor"
  - "forbid_update() also gets execute revoked from public/anon/authenticated, so the every-function rule in schema-mirror holds without exceptions"

patterns-established:
  - "New Postgres function: add revoke-from-public/anon/authenticated + grant-to-service_role lines with the full signature; schema-mirror.test.ts fails otherwise"
  - "New fake RPC: register on fakeSupabase.rpcHandlers at module level and mirror the SQL guards (P0001 raise, 23514 check violation)"

requirements-completed: [API-01]

coverage:
  - id: D1
    description: "POST /api/reports: a parent (extension or panel) creates a report for their demo child; server sets ids, state pending_parent, canonical taken_actions; spoofed keys ignored; validation details, invalid_json, 413; 403 teacher, 401 no token; 503 on storage error/throw/null row; two identical POSTs make two reports"
    requirement: API-01
    verification:
      - kind: integration
        ref: "web-app/tests/api/reports.test.ts#POST /api/reports (24 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "Creating a report writes the submit history entry (null -> pending_parent, actor = child) through create_report"
    requirement: API-01
    verification:
      - kind: integration
        ref: "web-app/tests/api/reports.test.ts#lets a parent submit through the extension and stores the report with its submit entry"
        status: pass
      - kind: unit
        ref: "web-app/tests/lib/reports-repo.test.ts#createReport"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/reports/{id}: panel-only detail with history and comments in seq order; extension 403; invisible, unknown and malformed ids 404 (malformed without a query); teacher sees only own-class approved reports"
    requirement: API-01
    verification:
      - kind: integration
        ref: "web-app/tests/api/reports.test.ts#GET /api/reports/{id} (11 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "GET /api/reports: visibility-scoped, newest-first cursor pages (limit 1-100, default 20, state filter, next_cursor); demo bodies equal get-reports.json and get-reports-teacher.json byte for byte"
    requirement: API-01
    verification:
      - kind: integration
        ref: "web-app/tests/api/reports-list.test.ts (37 tests)"
        status: pass
      - kind: other
        ref: "node web-app/scripts/check-contract-examples.mjs -> contract examples: 13 files OK"
        status: pass
    human_judgment: false
  - id: D5
    description: "SQL schema mirrors types.ts (enums, 11 history tuples, limits, ms timestamps, append-only triggers, RLS without policies, execute revoked on every function)"
    verification:
      - kind: unit
        ref: "web-app/tests/lib/schema-mirror.test.ts (17 tests; mutation-checked: 3 planted drifts all caught)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The migration actually applies on Supabase and records survive a restart (D-02)"
    verification: []
    human_judgment: true
    rationale: "D-06 forbids agents from running SQL or touching a Supabase project; the human applies the migration and runs the live smoke test in plan 01-06"

duration: 9min
completed: 2026-10-03
status: complete
---

# Phase 01 Plan 04: Report submit, detail and paginated list Summary

**Report API on Postgres functions: POST /api/reports stores the report and its submit history entry in one create_report call; GET /api/reports/{id} returns panel-only detail with seq-ordered history and comments; GET /api/reports pages visibility-scoped lists through list_reports with base64url {c, i} cursors that reproduce the published examples byte for byte.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-03T17:10:32Z
- **Completed:** 2026-10-03T17:19:40Z
- **Tasks:** 3
- **Files modified:** 13 (11 created, 2 modified)

## Accomplishments

- Migration `20261003170000_reports.sql` (written, not applied, per D-06): three tables with CHECKs mirroring the contract, the 11-tuple `report_history_transition_check`, the escalate-comment check, four indexes, append-only triggers, RLS on all three tables with no policies, and `create_report` / `list_reports`. Execute on every function is revoked from public/anon/authenticated and granted to service_role.
- POST /api/reports (parent, both scopes): 401 → 403 → 413/400 → 400 validation with Polish details → 201 with the stored row only. Every storage failure is 503, so there are no false confirmations (widget ERR-01).
- GET /api/reports/{id} (panel only): malformed ids give 404 without touching storage, invisible reports give 404, and history and comments come back oldest first.
- GET /api/reports: parent → own reports; teacher → own-class children in with_teacher/escalated/closed only. `list_reports` raises on an empty scope and the repository refuses one before calling storage.
- Schema-mirror and repository tests lock the SQL and the RPC call shapes to types.ts.

## Task Commits

1. **Task 1: Tracer — submit and detail**: `303a04d` (test, RED), `e9d3f62` (feat, GREEN)
2. **Task 2: Paginated, visibility-scoped list**: `baff5bf` (test, RED), `2ce094b` (feat, GREEN)
3. **Task 3: Schema mirror and repository call shapes**: `8145e27` (test)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY

## Files Created/Modified

- `web-app/supabase/migrations/20261003170000_reports.sql`: schema, triggers, RLS, create_report, list_reports
- `web-app/src/lib/server/validate.ts`: adds parseNewReport and parseListQuery
- `web-app/src/lib/server/access.ts`: canView, childForNewReport, listScopeFor, ListScope
- `web-app/src/lib/server/pagination.ts`: encodeCursor, strict decodeCursor, paginate
- `web-app/src/lib/server/reports.ts`: column lists, toIsoUtc, mappers, createReport, getReport, getReportTimeline, listReports
- `web-app/src/app/api/reports/route.ts`: POST, GET, OPTIONS
- `web-app/src/app/api/reports/[id]/route.ts`: GET, OPTIONS
- `web-app/tests/helpers/fake-supabase.ts`: seq counters, fake create_report and list_reports
- `web-app/tests/helpers/dataset.ts`: loadExample, loadDemoDataset, seedFakeWithDataset
- `web-app/tests/api/reports.test.ts` (36 tests), `web-app/tests/api/reports-list.test.ts` (37), `web-app/tests/lib/schema-mirror.test.ts` (17), `web-app/tests/lib/reports-repo.test.ts` (21)

## Decisions Made

- **Optional taken_actions:** an omitted `taken_actions` means `[]`. `null`, a string or another non-list value gives 400 on the field `taken_actions` (see Deviations).
- **Duplicates rejected:** following the plan and the checker's request rules, duplicates in `taken_actions` give 400. The prose in CONTRACT.md ("serwer usuwa duplikaty") disagrees. The contract owner (osoba 3) should align the wording; the code does not change either way.
- **Strict cursors:** only canonical cursors are accepted (exact keys `c`, `i` in order; `.sssZ` timestamp that round-trips; UUID). This matches the checker's `decodeCursor`.
- **Detail lookup:** the detail route lowercases the path id before the lookup, so an uppercase UUID finds the same report.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Plan contradicts approved contract] An omitted taken_actions is accepted as []**
- **Found during:** Task 1
- **Issue:** The plan's behavior list says "taken_actions missing → field taken_actions" (400). The approved contract v2 disagrees in three places: the CONTRACT.md table says "opcjonalne (domyślnie [])", `NewReportRequest.taken_actions?` is optional, and the checker uses `req.taken_actions ?? []`. The widget may rely on that.
- **Fix:** Absent → `[]`. A present non-list value (`null`, `"paid"`) → 400 `taken_actions` with the planned message. The tests cover both cases.
- **Files modified:** web-app/src/lib/server/validate.ts, web-app/tests/api/reports.test.ts
- **Committed in:** 303a04d / e9d3f62

**2. [Rule 2 - Security consistency] Execute on forbid_update() revoked too**
- **Found during:** Task 1 (because of Task 3's every-function rule)
- **Fix:** Added revoke/grant lines for `public.forbid_update()`. Triggers fire regardless of EXECUTE grants.
- **Committed in:** e9d3f62

**3. [Rule 2 - Hardening] Cursor and list_reports guards stricter than written**
- **Fix:** `decodeCursor` also requires canonical re-encoding. `list_reports` (and its fake) raise when only half of the cursor is given.
- **Committed in:** 2ce094b

**4. [Rule 3 - Blocking] Avoided a validate.ts ↔ pagination.ts import cycle**
- **Issue:** `parseListQuery` (validate.ts) needs `decodeCursor`, and `decodeCursor` needed `isUuid` from validate.ts.
- **Fix:** pagination.ts keeps a local copy of the same UUID regex, with a comment explaining why.
- **Committed in:** 2ce094b

---

**Total deviations:** 4 auto-fixed (1 plan-vs-contract, 2 hardening, 1 blocking). **Impact:** The contract is honoured where the plan disagreed with it. Everything else only tightens checks. No scope creep and no new packages.

## TDD Gate Compliance

- Task 1: RED `303a04d` failed on assertions only. 35 target tests failed, e.g. "lets a parent submit through the extension and stores the report with its submit entry" (`expected 500 to be 201`) and "answers 404 for a malformed id without querying storage" (`expected 500 to be 404`). Only the OPTIONS test passed. GREEN `e9d3f62`: 36/36.
- Task 2: RED `baff5bf`: 29 failed on assertions, e.g. "gives the parent's first page byte for byte as in get-reports.json" (`expected 500 to be 200`) and "encodes {c, i} as base64url JSON exactly like get-reports.json". The 8 decode-rejection cases passed trivially against the null-returning skeleton. GREEN `2ce094b`: 37/37.
- RED evidence is recorded as failing test names from the vitest output, because `gsd-tools check tdd-red-evidence` cannot parse vitest output (see 01-03).
- Task 3 is `type="auto"` without TDD; its tests target code that already exists. A mutation check planted 3 drifts in the migration (a wrong tuple role, a wrong comment limit, a missing revoke). All 3 were caught, and the file was restored byte-identical.
- REFACTOR: none needed.

## Issues Encountered

- First Task 3 build failed TypeScript: spreading a `Record<string, unknown>` row lost its index signature in reports-repo.test.ts. I annotated the mapper return type as `Row` before committing.
- Build note (D-06): `next build` loads `web-app/.env.local` by itself if that file exists. The agent never opened, printed or sourced any `.env*` file, and env lines were filtered out of the build output.

## Verification Results

- `npm --prefix web-app test`: 7 files, 158 tests passed (the earlier 47 plus 111 new)
- `npm --prefix web-app run typecheck`: 0 errors
- `npm --prefix web-app run lint`: clean
- `npm --prefix web-app run build`: PASS. `/api/reports` and `/api/reports/[id]` are dynamic (ƒ)
- `node web-app/scripts/check-contract-examples.mjs`: "contract examples: 13 files OK"
- SDK only in supabase.ts; `rpc("create_report"` in reports.ts; `scopes: ["panel"]` in the detail route: PASS
- Migration acceptance strings (tables, transition check, triggers, RLS ×3, revoke create_report/list_reports, `(created_at, id) <`): PASS
- No secret env names in `web-app/.next/static`: PASS
- No SQL executed, no Supabase CLI/API call, no `.env*` read (D-06)

## Known Stubs

None.

## User Setup Required

None for this plan. Plan 01-06 has the human apply `web-app/supabase/migrations/20261003170000_reports.sql` to the Supabase project.

## Next Phase Readiness

- Ready for 01-05. `transition_report` should follow the create_report pattern: an RPC, revoke/grant lines (schema-mirror enforces them), and a fake handler that mirrors the SQL guards. The history CHECK already lists all 10 transition tuples. `seedFakeWithDataset()` and `loadExample()` are available for the transition and comment examples.
- Open item for the contract owner: align the duplicate-handling wording for taken_actions in CONTRACT.md.

---
*Phase: 01-kontrakt-i-backend-spraw*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 11 created files and 2 modified files exist on disk.
- Commits found: 303a04d, e9d3f62, baff5bf, 2ce094b, 8145e27.
