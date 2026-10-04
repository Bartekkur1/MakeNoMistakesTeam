---
phase: 01-kontrakt-i-backend-spraw
plan: 05
subsystem: api
tags: [nextjs, route-handlers, supabase-js, postgres, plpgsql, workflow, append-only, seed, vitest]

requires:
  - phase: 01-kontrakt-i-backend-spraw (plan 01-01)
    provides: contract v2 types.ts (TRANSITIONS, TRANSITION_COMMENT_REQUIRED, LIMITS, field lists)
  - phase: 01-kontrakt-i-backend-spraw (plan 01-03)
    provides: http helpers, requireSession, isUuid, fakeSupabase with persistent rpcHandlers
  - phase: 01-kontrakt-i-backend-spraw (plan 01-04)
    provides: reports/report_history/report_comments schema with the 11-tuple history CHECK, canView, getReport, mappers, seedFakeWithDataset
provides:
  - migration 20261003170100_report_transitions.sql (transition_report, conditional on the expected state)
  - workflow.ts (resolveTransition, availableActions) shared with the phase-2 panel
  - POST /api/reports/{id}/transitions and POST /api/reports/{id}/comments, OPTIONS on both
  - validate.ts parseTransition and parseComment; reports.ts transitionReport and addComment
  - scripts/build-seed.mjs + generated supabase/seed.sql; npm scripts seed:build and seed:check
  - fake transition_report, beforeNextRpc(), beforeNextInsert(), report_id foreign-key check
affects: [01-06 live schema push, seed load and smoke test, phase-2 panel (workflow buttons, thread), widget]

actuals:
  tokens: 20150    # chars/4 over the added lines of the realized diff (80588 chars, 16 files)
  tasks: 3
  commits: 5
plan_head_before: 75da7ed3648f9da959f71c5495cfb17697b5b14f
plan_head_after: 3dd9d79221d5c19fd93c53011701b36759219c75

tech-stack:
  added: []
  patterns:
    - "Route decides 403 vs 409 with the pure resolveTransition before any write; the database re-checks the tuple"
    - "Optimistic concurrency: transition_report updates only where state = p_from_state and returns null otherwise (API 409)"
    - "Generated artifacts carry a --check mode and a test that runs it (seed.sql cannot drift from the dataset)"
    - "Contract examples are executed against the real handlers on the seeded fake (examples-conformance.test.ts)"

key-files:
  created:
    - web-app/supabase/migrations/20261003170100_report_transitions.sql
    - web-app/src/lib/contract/workflow.ts
    - web-app/src/app/api/reports/[id]/transitions/route.ts
    - web-app/src/app/api/reports/[id]/comments/route.ts
    - web-app/scripts/build-seed.mjs
    - web-app/supabase/seed.sql
    - web-app/tests/api/transitions.test.ts
    - web-app/tests/lib/workflow.test.ts
    - web-app/tests/api/comments.test.ts
    - web-app/tests/api/lifecycle.test.ts
    - web-app/tests/lib/seed.test.ts
    - web-app/tests/api/examples-conformance.test.ts
  modified:
    - web-app/src/lib/server/validate.ts
    - web-app/src/lib/server/reports.ts
    - web-app/tests/helpers/fake-supabase.ts
    - web-app/package.json

key-decisions:
  - "A blank transition comment counts as no comment (null); escalate then fails with the 'Przy eskalacji...' message, a non-string comment is 400 'Komentarz musi być tekstem.'"
  - "The transition route passes report.state (read just before) as p_from_state, so a concurrent change makes transition_report return null and the API answers 409"
  - "seed:check prints 'seed.sql is out of date - run npm run seed:build' (hyphen instead of the plan's em dash, per the user's copy rule)"
  - "fakeSupabase gained beforeNextInsert() next to beforeNextRpc(), so a test can fail the comment insert without failing the preceding report read"

patterns-established:
  - "New Postgres function: revoke-from-public/anon/authenticated + grant-to-service_role on the full signature (schema-mirror.test.ts picked up transition_report automatically)"
  - "New write example: examples-conformance pins the fake clock and id to the example's created_at and id"

requirements-completed: [API-02]

coverage:
  - id: D1
    description: "Parent approves/rejects, teacher escalates (comment required) and closes; reopen from closed (parent or teacher) and from rejected (parent); all 10 matrix transitions write one history entry with actor, role, time, from, to and comment"
    requirement: API-02
    verification:
      - kind: integration
        ref: "web-app/tests/api/transitions.test.ts (36 tests, incl. 10 table-driven matrix cases)"
        status: pass
    human_judgment: false
  - id: D2
    description: "403 forbidden for a role that may never act, 409 invalid_transition from the wrong state, decided before any write; resolver exhaustively checked over 50 combinations against literal allowed strings"
    requirement: API-02
    verification:
      - kind: unit
        ref: "web-app/tests/lib/workflow.test.ts (63 tests: 10 ok, 20 forbidden, 20 invalid_transition)"
        status: pass
      - kind: integration
        ref: "web-app/tests/api/transitions.test.ts#answers 403 forbidden / answers 409 invalid_transition"
        status: pass
    human_judgment: false
  - id: D3
    description: "Concurrency and storage safety: stale transition loses with 409 and no history row; rpc error or throw gives 503 and changes nothing; tuple outside the matrix rejected by the (fake) CHECK"
    requirement: API-02
    verification:
      - kind: integration
        ref: "web-app/tests/api/transitions.test.ts#lets only one of two concurrent transitions win; answers 503 and changes nothing; transitionReport (repository)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Parent+teacher comment thread: panel only (extension 403), canView gate (404), author from session, trimmed body 1-2000 chars, not idempotent, 503 on insert failure, lists never carry comments"
    requirement: API-02
    verification:
      - kind: integration
        ref: "web-app/tests/api/comments.test.ts (15 tests)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Full lifecycle submit -> approve -> comments -> escalate -> close -> reopen -> close readable identically by parent and teacher, closed to the extension token and the other class's teacher at every step"
    requirement: API-02
    verification:
      - kind: integration
        ref: "web-app/tests/api/lifecycle.test.ts"
        status: pass
    human_judgment: false
  - id: D6
    description: "seed.sql generated from demo-dataset.json, re-runnable, deletes only the 6 dataset reports; every published example (11 routes + 10 errors) reproduced byte for byte"
    verification:
      - kind: unit
        ref: "web-app/tests/lib/seed.test.ts (9 tests)"
        status: pass
      - kind: integration
        ref: "web-app/tests/api/examples-conformance.test.ts (23 tests)"
        status: pass
      - kind: other
        ref: "npm --prefix web-app run seed:check -> seed.sql is up to date; check-contract-examples.mjs -> 13 files OK"
        status: pass
    human_judgment: false
  - id: D7
    description: "transition_report and seed.sql actually run on Supabase (append-only triggers, CHECKs, cascade delete on re-run)"
    verification: []
    human_judgment: true
    rationale: "D-06 forbids agents from running SQL or touching a Supabase project; the human applies the migration and seed and runs the live smoke test in plan 01-06"

duration: 10min
completed: 2026-10-03
status: complete
---

# Phase 01 Plan 05: Report workflow, comment thread and demo seed Summary

**Report workflow on a conditional Postgres function: POST /api/reports/{id}/transitions resolves 403/409 with the pure resolveTransition, then transition_report updates the state only while it is unchanged and writes the history entry in the same transaction. POST /api/reports/{id}/comments adds the parent+teacher thread. seed.sql is generated from demo-dataset.json, and every published contract example is reproduced byte for byte by the real handlers.**

## Performance

- **Duration:** about 10 min
- **Started:** 2026-10-03T18:06Z
- **Completed:** 2026-10-03T18:16Z
- **Tasks:** 3
- **Files modified:** 16 (12 created, 4 modified)

## Accomplishments

- Migration `20261003170100_report_transitions.sql` (written, not applied, per D-06): `transition_report` runs `update ... where id = p_report_id and state = p_from_state`. When no row matches it returns null. Otherwise it inserts the history row with the same millisecond timestamp and returns `{report, entry}`. Execute is revoked from public/anon/authenticated and granted to service_role, and schema-mirror enforces this automatically.
- `workflow.ts`: `resolveTransition` and `availableActions`. Pure functions, usable by the phase-2 panel to show only the valid buttons.
- Transitions route, check order: 401 → 403 scope → 413/400 → 400 validation → 404 → 403 role → 409 state → 503/500. The actor always comes from the session; actor fields in the body are dropped.
- Comments route: panel scope only, visibility through canView, author from the session, append-only. reports.ts uses only select, insert and rpc.
- `build-seed.mjs` (Node built-ins only) writes a deterministic `seed.sql`: `begin;`, one delete limited to the 6 dataset ids, 6 + 13 + 3 single-row inserts, `commit;`. `--check` exits 1 on drift.
- `examples-conformance.test.ts` runs all 11 route examples through the real handlers (POST examples get their clock and id pinned) and checks all 10 error bodies.

## Task Commits

1. **Task 1: Tracer - transitions with history**: `e54a37e` (test, RED), `66c8a37` (feat, GREEN)
2. **Task 2: Comment thread and lifecycle**: `fab3698` (test, RED), `5fb5f60` (feat, GREEN)
3. **Task 3: Demo seed and example conformance**: `3dd9d79` (feat)

**Plan metadata:** recorded in the docs commit that adds this SUMMARY

## Files Created/Modified

- `web-app/supabase/migrations/20261003170100_report_transitions.sql`: transition_report + revoke/grant
- `web-app/src/lib/contract/workflow.ts`: resolveTransition, availableActions, TransitionDecision
- `web-app/src/lib/server/validate.ts`: adds parseTransition and parseComment
- `web-app/src/lib/server/reports.ts`: adds transitionReport (rpc) and addComment (insert ... select ... single)
- `web-app/src/app/api/reports/[id]/transitions/route.ts`: POST, OPTIONS, force-dynamic
- `web-app/src/app/api/reports/[id]/comments/route.ts`: POST, OPTIONS, force-dynamic
- `web-app/scripts/build-seed.mjs`, `web-app/supabase/seed.sql` (generated), `web-app/package.json` (seed:build, seed:check, merged with the 75da7ed engines/start changes)
- `web-app/tests/helpers/fake-supabase.ts`: transition_report fake, beforeNextRpc, beforeNextInsert, FK check (23503)
- Tests: transitions (36), workflow (63), comments (15), lifecycle (1), seed (9), examples-conformance (23)

## Decisions Made

- **Blank comment:** a transition comment of only spaces counts as null. Escalation then fails on `comment` with the plan's message. A non-string comment is 400 "Komentarz musi być tekstem." (the plan gave no wording for this case).
- **Repeated transition:** a second identical approve gets 409 from the resolver, before any write. This matches the contract's "safe to retry" rule.
- **Detail id lowercasing:** both new routes lowercase the path id before the lookup, as the detail route already does.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added `fakeSupabase.beforeNextInsert()`**
- **Found during:** Task 2
- **Issue:** `failNext`/`throwNext` hit the next storage call, which is the report lookup, not the comment insert. Without a hook the "503 on insert failure" bullet could not be tested.
- **Fix:** Added a hook that runs just before the next table insert, next to the planned `beforeNextRpc()`.
- **Files modified:** web-app/tests/helpers/fake-supabase.ts
- **Commit:** fab3698

**2. [User copy rule] Hyphen instead of an em dash in the seed:check message**
- **Found during:** Task 3
- **Issue:** The plan's message "seed.sql is out of date — run npm run seed:build" contains an em dash. The user's global rule requires "-" in new copy.
- **Fix:** The script prints "seed.sql is out of date - run npm run seed:build". The verify gate still matches "out of date".
- **Commit:** 3dd9d79

**3. [Ordering only] The fake's report_id foreign-key check went into the Task 1 RED commit**
- The plan lists it under Task 2 step (4). It lives in the same helper and changes no Task 1 behaviour.

---

**Total deviations:** 3 (1 blocking test-infra addition, 1 copy rule, 1 ordering). **Impact:** None on the API. No scope creep and no new packages.

## TDD Gate Compliance

- Task 1: RED `e54a37e` had 72 failures, all assertions (e.g. "lets the parent approve a pending report..." `expected 500 to be 201`, "gives 10 ok, 20 forbidden and 20 invalid_transition results"). The one exception was the repository null-case throwing the stub's "not implemented". GREEN `66c8a37`: 99/99.
- Task 2: RED `fab3698` had 15 failures on assertions (e.g. "adds the teacher's trimmed comment..." `expected 500 to be 201`; lifecycle stopped at the first comment step). GREEN `5fb5f60`: 16/16.
- RED evidence is recorded as failing test names from the vitest output, because `gsd-tools check tdd-red-evidence` cannot parse vitest output (same as 01-03/01-04). RED commits include not-implemented skeletons so failures are assertions, not import errors.
- Task 3 is `type="auto"` without TDD.
- REFACTOR: none needed.

## Verification Results

- `npm --prefix web-app test`: 15 files, 317 tests passed (the earlier 158 + landing tests + 147 new)
- `npm --prefix web-app run typecheck`: 0 errors. `run lint`: clean
- `npm --prefix web-app run build`: PASS. `/api/reports/[id]/transitions` and `/api/reports/[id]/comments` are dynamic (ƒ)
- `npm --prefix web-app run seed:check`: "seed.sql is up to date"; seed.sql has 6 / 13 / 3 inserts (grep -c)
- `node web-app/scripts/check-contract-examples.mjs`: "contract examples: 13 files OK"
- Grep gates: `resolveTransition(` in the route, `rpc("transition_report"` in reports.ts, `and state = p_from_state` in the migration, all 10 literal combinations in workflow.test.ts, `scopes: ["panel"]` in the comments route, no `.update(`/`.delete(`/`.upsert(` in reports.ts: PASS
- No SQL executed, no Supabase CLI/API call, no `.env*` file opened by the agent (D-06). `next build` loads `.env.local` itself if it exists; build output was written to a scratch log and only route lines were shown.

## Known Stubs

None. The RED skeletons were fully replaced in the GREEN commits.

## Threat Flags

None. The new endpoints and the seed are the surfaces in the plan's threat model (T-01-27..T-01-33). Their mitigations are implemented and tested.

## User Setup Required

None for this plan. In plan 01-06 the human applies both migrations (`20261003170000_reports.sql`, then `20261003170100_report_transitions.sql`), then `web-app/supabase/seed.sql`.

## Next Phase Readiness

- Ready for 01-06: the schema, the transition function and the seed exist as files. The resume check can run `npm run seed:check`.
- The phase-2 panel can import `availableActions` from `@/lib/contract/workflow` to render the workflow buttons.
- Still open from 01-04 for the contract owner: align the duplicate-handling wording for taken_actions in CONTRACT.md.

---
*Phase: 01-kontrakt-i-backend-spraw*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 12 created files and 4 modified files exist on disk.
- Commits found: e54a37e, 66c8a37, fab3698, 5fb5f60, 3dd9d79.
