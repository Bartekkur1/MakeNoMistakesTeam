---
phase: 01-kontrakt-i-backend-spraw
verified: 2026-10-03T19:45:00Z
status: human_needed
score: 45/47 must-haves verified (4/4 roadmap success criteria)
covered_files:
  - ".planning/shared/CONTRACT.md"
  - ".planning/shared/examples/demo-dataset.json"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/.superseded/01-01-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/.superseded/01-02-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/.superseded/01-03-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/.superseded/01-04-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-01-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-01-SUMMARY.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-02-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-02-SUMMARY.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-03-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-03-SUMMARY.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-04-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-04-SUMMARY.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-05-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-05-SUMMARY.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-06-PLAN.md"
  - ".planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-06-SUMMARY.md"
  - "web-app/Procfile"
  - "web-app/package.json"
  - "web-app/scripts/build-seed.mjs"
  - "web-app/scripts/check-contract-examples.mjs"
  - "web-app/scripts/smoke-api.mjs"
  - "web-app/src/app/api/auth/login/route.ts"
  - "web-app/src/app/api/auth/me/route.ts"
  - "web-app/src/app/api/health/route.ts"
  - "web-app/src/app/api/reports/[id]/comments/route.ts"
  - "web-app/src/app/api/reports/[id]/route.ts"
  - "web-app/src/app/api/reports/[id]/transitions/route.ts"
  - "web-app/src/app/api/reports/route.ts"
  - "web-app/src/lib/contract/demo-accounts.ts"
  - "web-app/src/lib/contract/types.ts"
  - "web-app/src/lib/contract/workflow.ts"
  - "web-app/src/lib/server/access.ts"
  - "web-app/src/lib/server/auth.ts"
  - "web-app/src/lib/server/errors.ts"
  - "web-app/src/lib/server/http.ts"
  - "web-app/src/lib/server/pagination.ts"
  - "web-app/src/lib/server/reports.ts"
  - "web-app/src/lib/server/supabase.ts"
  - "web-app/src/lib/server/validate.ts"
  - "web-app/supabase/migrations/20261003170000_reports.sql"
  - "web-app/supabase/migrations/20261003170100_report_transitions.sql"
  - "web-app/supabase/migrations/20261003170200_append_only_guards.sql"
  - "web-app/supabase/seed.sql"
covered_digest: "v2:sha256:d0841b8ac42d48e1f732bb1c42908bd66f8e81401a36f5c5b43171eecde0a282"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "C4 backstop (plan 01-06): with the local dev server running against the demo Supabase project, run `npm --prefix web-app run smoke & npm --prefix web-app run smoke; wait`"
    expected: "Both runs end with `SMOKE OK (http://localhost:3000)`; no step returns a 2xx without a persisted row"
    why_human: "Truth is tagged verification: backstop (non-inferable). Only an offline fake-storage test exists (transitions.test.ts 'lets only one of two concurrent transitions win'); live DB concurrency needs Supabase, which agents may not touch (D-06). Tracked as .planning/WINDOWS.md entry 1"
  - test: "C3 (plan 01-06 truth 'locally and on Heroku'): `npm --prefix web-app run dev`, run the smoke once, note the created id, restart the dev server, then `SMOKE_VERIFY_ID=<id> npm --prefix web-app run smoke`"
    expected: "`PERSIST OK <id>` locally (Heroku PERSIST OK c15607b6-29c9-4b2d-8191-703ff1e35e8d is already reported)"
    why_human: "Live run against Supabase (D-06). Low risk: local and Heroku share the same Supabase storage, so the roadmap criterion is already met by the Heroku restart; this only closes the plan's literal 'locally' wording. Alternatively accept via override"
  - test: "Sign off the unverified test-tier prohibition (plan 01-06): 'MUST NOT pollute the presentation's demo data: the smoke tool writes only with the smoke accounts'"
    expected: "Reviewer confirms. LLM-judge (non-authoritative): HOLDS - in web-app/scripts/smoke-api.mjs every write (create-report, approve, comment, escalate, close, reopen) uses tokens from rodzic.test / nauczyciel.test; the only other account (rodzic.ola) is used for read-only GET steps (other-parent-hidden, seed-present)"
    why_human: "verification: test, but no automated test enforces it (fail-closed: unverified-prohibition, human review recommended)"
  - test: "Sign off the three judgment-tier prohibitions (plans 01-02, 01-03, 01-06)"
    expected: "Reviewer confirms. LLM-judge (non-authoritative): 01-02 'no backend before approval' HOLDS - approval commit a8a2b85 (18:51:35) precedes the first backend commit 50fe075 (18:54:28); 01-03 'no logging of bodies/e-mails/tokens/env' HOLDS - the only console calls in web-app/src are in http.ts and print an error code or error name; 01-06 'no unsmoked URL in CONTRACT.md' HOLDS - per the user's report, https://bezpieczna-aura.pl passed SMOKE OK and PERSIST OK before commit 399a5f8 published it"
    why_human: "Judgment-tier prohibitions need explicit human resolution; never silently passed"
---

# Phase 1: Kontrakt i backend spraw - Verification Report

**Phase Goal:** Działające API zgłoszeń z obiegiem rodzic -> nauczyciel, historią, komentarzami i logowaniem demo, z trwałym zapisem oraz przykładowymi danymi zgodnymi z `shared/CONTRACT.md`.
**Verified:** 2026-10-03T19:45:00Z
**Status:** human_needed
**Re-verification:** No - initial verification

Live evidence (Supabase, local and Heroku smoke, Heroku restart) is the user's report under D-06 and is taken as given. Everything else was checked offline against the tree at 1696a64.

## Goal Achievement

### Roadmap Success Criteria

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| SC1 | A report can be created, listed and fetched, and it still exists after a restart and a refresh | VERIFIED | Code: `POST/GET /api/reports` and `GET /api/reports/{id}` call `createReport`, `listReports` and `getReport`/`getReportTimeline` in `reports.ts`. These go to Supabase through `rpc("create_report")`, `rpc("list_reports")` and table selects. Tests pass in reports.test.ts and reports-list.test.ts. Live: SMOKE OK locally and on Heroku, and PERSIST OK c15607b6-... after a Heroku restart (user report). The local restart run (C3) was not reported; see human item 2 |
| SC2 | The parent approves/rejects and the teacher escalates and closes; every state change and comment is saved to history and can be read back | VERIFIED | `transitions/route.ts` checks `resolveTransition` first, then calls `transitionReport` -> `rpc("transition_report")`. The SQL does a conditional update and the history insert in one function. `comments/route.ts` calls `addComment` (insert + select). The detail returns `history` and `comments` in seq order. Tests: all 10 matrix tuples, 403/409 split, concurrency 409, and lifecycle.test.ts (submit->approve->escalate->close->reopen->close with the thread). Live smoke covers approve, comment, escalate, close, stale 409, reopen, close and the history chain. Reject is covered offline only (see IN-05) |
| SC3 | Parent and teacher log in through the demo (e-mail + code 0000) and see only the reports they have access to | VERIFIED | `login/route.ts` uses `findDemoAccountByEmail` + `DEMO_LOGIN_CODE` and issues an HMAC token (`auth.ts`, timingSafeEqual, 12 h). Visibility: `canView` and `listScopeFor` in `access.ts` (parent = own reports; teacher = own-class children in with_teacher/escalated/closed). Tests: auth.test.ts, auth-token.test.ts, reports-list visibility, teacher 404 before approval, another class's teacher 404. Live smoke covers login-wrong-code, teacher-hidden and other-parent-hidden |
| SC4 | The contract is approved by osoba 2 and the example JSON files are in shared/ | VERIFIED | The CONTRACT.md status line says version 2 is approved by osoba 2 (2026-10-03). Approval commit a8a2b85. Since then, `git diff a8a2b85 HEAD -- .planning/shared/` shows only the status-line append and the base URL row; types.ts, demo-accounts.ts and the checker are unchanged. `.planning/shared/examples/` has 13 files and the checker prints `contract examples: 13 files OK`. examples-conformance.test.ts reproduces all 11 route examples and 10 error examples from the real handlers |

### Plan Must-Have Truths (merged)

| Plan | Truths | Status | Evidence / notes |
|------|--------|--------|------------------|
| 01-01 | 10 (contract v2 model, 8 endpoints, transition matrix, append-only history, demo login, visibility, cursor pagination, D-03/D-01/D-02/D-04 statements, checker 13 OK + rejects corruption, D-18 commits) | 10/10 VERIFIED | The checker exits 0. I ran 2 corruption runs myself on scratchpad copies and both exited 1: a non-.example e-mail, and a detail example under the extension scope. The endpoint table in CONTRACT.md lists 8 endpoints. TRANSITIONS has 6 rows. Commits dac78b7, f69afd6 and 0a6c7bf exist |
| 01-02 | 4 after dedupe (approval merged into SC4): package gate, STATE notes, COVERAGE.md + api-coverage gate, D-06 | 4/4 VERIFIED | package.json has exactly @supabase/supabase-js ^2.117.2 and vitest ^4.1.11, plus the user-approved vite ^7 override (01-03). The widget and presentation STATE.md files carry the notes. `check api-coverage.verify-pre 01 --ws web-app` gives passed true (11/3/8). D-06 is a process claim with no codebase artifact, accepted on the user-supervised record |
| 01-03 | 8 (route handlers, single SDK import + no secrets in bundle, lazy client, health 200/503 + CORS, login, tokens, fail-closed secret, tests offline) | 8/8 VERIFIED | Only `supabase.ts` imports the SDK. `grep` on `.next/static` for SUPABASE_SERVICE_ROLE_KEY / DEMO_AUTH_SECRET finds nothing. `getAuthSecret` throws when the secret is under 32 chars, which gives a 500. health.test.ts, auth.test.ts and auth-token.test.ts pass |
| 01-04 | 8 (create 201, atomic submit entry, validation 400/413, no false 2xx, detail panel-only + 404s, list scoping + byte-for-byte examples, schema mirror, persistence live) | 8/8 VERIFIED | `create_report` inserts the report and the submit entry in one plpgsql function. schema-mirror.test.ts enforces the mirror with the contract. reports-list.test.ts matches get-reports.json and get-reports-teacher.json byte for byte. Persistence is covered by the user's Heroku PERSIST OK |
| 01-05 | 6 (approve/reject/escalate/close, reversal + 403/409, one history entry per change atomically + append-only, comment thread hidden from extension, concurrency 409 + 503, seed generated + examples reproduced) | 6/6 VERIFIED | `transition_report` uses `where id = p_report_id and state = p_from_state` and returns null, which gives 409. The DB CHECK lists all 11 tuples. Migration 20261003170200 adds delete/truncate guards (the user reports it as applied). `seed:check` says up to date. Conformance tests pass |
| 01-06 | 7 (human schema push, SMOKE OK local+Heroku, restart persistence local+Heroku, $PORT start + 503 fail-closed, URL in CONTRACT.md + STATE notes, no keys in tracked files, parallel smoke backstop) | 5/7 VERIFIED, 1 UNCERTAIN, 1 insufficient_spec | VERIFIED: schema push (user), both SMOKE OK runs (user), `start` = `next start -p ${PORT:-3000}` + Procfile `web: npm start` + the live 503 incident, URL row + STATE bullets, `git grep` for key-shaped strings is clean. UNCERTAIN: restart persistence "locally" (C3 not reported; Heroku is proven). insufficient_spec: parallel smoke (C4, `verification: backstop`, not reported) |

**Score:** 45/47 truths verified (0 present-but-behavior-unverified). All 4 roadmap success criteria are verified.

Behavior-dependent truths (atomic state+history, the concurrency 409, append-only, visibility) are backed by passing named tests in the full suite run (17 files, 338 tests, all green). Those tests run against an in-memory fake of supabase-js. The SQL side is backed by the schema-mirror test, by the user's live smoke on real Supabase, and (for WR-03) by the fixer's throwaway local PostgreSQL run.

### Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| 01-01: types.ts, demo-accounts.ts, check-contract-examples.mjs, CONTRACT.md, demo-dataset.json | VERIFIED (5/5) | `verify.artifacts` 5/5 |
| 01-02: COVERAGE.md, CONTRACT.md | VERIFIED (2/2) | |
| 01-03: supabase.ts, errors.ts, http.ts, auth.ts, validate.ts, login + me routes, fake-supabase.ts | VERIFIED (8/8) | |
| 01-04: migration 20261003170000, reports.ts, access.ts, pagination.ts, reports routes | VERIFIED (6/6) | |
| 01-05: migration 20261003170100, workflow.ts, transitions + comments routes, build-seed.mjs, seed.sql | VERIFIED (6/6) | |
| 01-06: smoke-api.mjs, Procfile, package.json, README.md | VERIFIED (4/4) | |
| 01-06: CONTRACT.md `contains: "herokuapp.com"` | VERIFIED (deviation) | The literal pattern is missing because the published URL is the custom domain `https://bezpieczna-aura.pl`, which Heroku serves. The row is labelled "demo (Heroku, https)" and the user's live smoke covers it. The intent is met; see the override suggestion below |
| Review-fix additions: migration 20261003170200, http-body.test.ts, supabase-timeout.test.ts | VERIFIED | Present and tested; the user reports the migration as applied |

**This looks intentional.** To clear the literal artifact miss, add to the VERIFICATION.md frontmatter:

```yaml
overrides:
  - must_have: "CONTRACT.md contains herokuapp.com (Published demo base URL)"
    reason: "Verified base URL is the custom domain https://bezpieczna-aura.pl served by Heroku; row labelled 'demo (Heroku, https)'; live SMOKE OK and PERSIST OK"
    accepted_by: "{name}"
    accepted_at: "{ISO timestamp}"
```

### Key Link Verification

| Plan | Links | Status |
|------|-------|--------|
| 01-01 | checker -> types.ts, checker -> demo-dataset.json, CONTRACT.md -> examples/ | 3/3 WIRED |
| 01-02 | widget STATE -> CONTRACT.md, COVERAGE.md -> transition_report | 2/2 WIRED |
| 01-03 | login -> DEMO_LOGIN_CODE, http.ts -> API_ERROR_MESSAGES_PL, health -> checkStorage() | 3/3 WIRED |
| 01-04 | reports route -> listScopeFor(), reports.ts -> rpc create_report/list_reports, detail -> canView() | 3/3 WIRED |
| 01-05 | transitions -> resolveTransition(), reports.ts -> rpc transition_report, build-seed -> demo-dataset.json | 3/3 WIRED |
| 01-06 | smoke -> /transitions, package.json -> Procfile ($PORT) | 2/2 WIRED |

### Data-Flow Trace (Level 4)

| Artifact | Data | Source | Real data | Status |
|----------|------|--------|-----------|--------|
| GET /api/reports | `reports`, `next_cursor` | `rpc("list_reports")`: SQL select on public.reports with the scope filters | Yes (live smoke list-parent, seed-present) | FLOWING |
| GET /api/reports/{id} | report + history + comments | `from("reports")`, `from("report_history")`, `from("report_comments")` selects | Yes (live final-detail, persisted-detail) | FLOWING |
| POST transitions | `{report, entry}` | `rpc("transition_report")` returns the jsonb of the updated row and the inserted entry | Yes | FLOWING |
| POST comments | comment | `insert(...).select().single()` | Yes | FLOWING |
| POST /api/reports | report | `rpc("create_report")` returns the inserted row; null -> 503 | Yes | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Full test suite (run once) | `npm --prefix web-app test` | 17 files, 338 tests passed | PASS |
| Contract examples consistent | `node web-app/scripts/check-contract-examples.mjs` | `contract examples: 13 files OK`, exit 0 | PASS |
| Checker is not vacuous (real e-mail) | corrupted copy via CONTRACT_EXAMPLES_DIR | `FAIL post-auth-login.json ... does not end in ".example"`, exit 1 | PASS |
| Checker is not vacuous (extension sees detail) | corrupted copy, get-report.json scope=extension | `FAIL get-report.json: report details need the panel scope`, exit 1 | PASS |
| Seed in sync with dataset | `npm --prefix web-app run seed:check` | `seed.sql is up to date` | PASS |
| Typecheck | `npm --prefix web-app run typecheck` | exit 0 | PASS |
| Lint | `npm --prefix web-app run lint` | exit 0 | PASS |
| api-coverage gate | `gsd-tools check api-coverage.verify-pre 01 --ws web-app` | passed true, 11/3/8 | PASS |
| Live smoke / persistence | (human, D-06) | SMOKE OK local + Heroku; PERSIST OK on Heroku; SMOKE OK after deploying 1696a64 | PASS (user-reported) |

### Probe Execution

Step 7c: no `scripts/*/tests/probe-*.sh` exist and none are declared. The live smoke tool is the phase's probe, and it is human-only (D-06), so I recorded it from the user's report and did not run it.

### Requirements Coverage

| Requirement | Source Plans | Description | Status | Evidence |
|-------------|--------------|-------------|--------|----------|
| API-01 | 01-01, 01-02, 01-04, 01-06 | The extension (parent account) creates a child's report: attack type + taken-action checkboxes. Parent and teacher list (paginated) and fetch the details they may see. Records survive a refresh | SATISFIED | POST/GET /api/reports, GET /api/reports/{id}, cursor pagination, D-15 visibility, Heroku PERSIST OK |
| API-02 | 01-01, 01-02, 01-05, 01-06 | Parent approves/rejects; teacher handles, escalates and closes; decisions can be reversed or reopened; every state change goes to history; a parent+teacher comment thread the child cannot see | SATISFIED | TRANSITIONS (6 rows, including reject from with_teacher, approve from rejected, and reopen), transition_report, append-only triggers, comments route with panel scope only |
| API-06 | 01-01, 01-02, 01-03, 01-06 | Demo login: hardcoded fictional parents and teachers, e-mail + code 0000; the child does not log in | SATISFIED | demo-accounts.ts (.example domain, code "0000"), login route, the child has no account role |

Orphaned requirements: none. REQUIREMENTS.md maps exactly API-01, API-02 and API-06 to Phase 1, and every one is claimed by a plan. The traceability table in REQUIREMENTS.md still shows them as "Pending". That file is user-owned and was not modified.

### Prohibitions

| Plan | Prohibition | Tier | Disposition |
|------|-------------|------|-------------|
| 01-01 | No real personal data (.example only) in examples, dataset, demo-accounts.ts | test | VERIFIED - enforced by the checker (my corruption run fails) and by seed.test.ts (.example hosts) |
| 01-01 | No comments/history to the extension scope in any example or rule | test | VERIFIED - enforced by the checker (my corruption run fails) and by route tests |
| 01-02 | No backend before contract + package approval | judgment | Flagged for human sign-off; LLM-judge: holds (commit order a8a2b85 < 50fe075) |
| 01-03 | No logging of bodies, e-mails, tokens, content or env | judgment | Flagged for human sign-off; LLM-judge: holds (console only in http.ts, prints codes/names) |
| 01-04 | No history/comments for the extension scope | test | VERIFIED - reports.test.ts "refuses the extension scope with 403", list items have exactly the report fields |
| 01-04 | No list_reports call without scope | test | VERIFIED - reports-repo.test.ts "rejects an empty scope without calling storage"; the SQL raises too |
| 01-05 | Actor/author never from the request body | test | VERIFIED - transitions.test.ts and comments.test.ts "takes the ... only from the session" |
| 01-06 | Smoke writes only with the smoke accounts | test | UNVERIFIED (fail-closed: no automated enforcement) - flagged; LLM-judge: holds on code reading |
| 01-06 | No unsmoked URL in CONTRACT.md | judgment | Flagged for human sign-off; LLM-judge: holds per the user's report |

Autonomous verdict: complete with 4 flagged prohibitions.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (phase files) | - | TBD / FIXME / XXX / TODO / placeholder | none found | - |
| web-app/src/lib/server/validate.ts | parseTransition | A blank transition comment is accepted and dropped, while the contract says "non-empty if provided" (REVIEW IN-02) | Info | A harmless leniency |
| web-app/scripts/smoke-api.mjs | - | The live smoke never exercises `reject` or `reopen` from rejected (REVIEW IN-05) | Info | Covered offline by the transitions tests and by the DB CHECK tuples; not proven on real Supabase |
| web-app/supabase/migrations/20261003170000_reports.sql | 138-140 | Table privileges for anon/authenticated are not revoked; RLS without policies is the only barrier (REVIEW IN-01) | Info | Acceptable: clients never get a Supabase key (D-03) |
| web-app/src/app/api/auth/login/route.ts | - | Public code 0000 means visibility is not a security boundary on the live site (REVIEW WR-04) | Info | Accepted risk AR-01 (D-14); fictional data only |
| web-app/package.json | - | `@types/node` ^20 vs engines node 22.x (REVIEW IN-06); 5 high npm audit advisories in the dev-only eslint chain | Info | Not shipped |

Review CR-01, WR-01, WR-02 and WR-03 are fixed in the tree (9d68cc4, 1224259, 7d7e0c3, 81e5c0f) and have tests. Per the user, they are deployed (1696a64) and the 20261003170200 migration is applied.

### Human Verification Required

#### 1. Parallel smoke (C4, backstop)

**Test:** Run `npm --prefix web-app run smoke & npm --prefix web-app run smoke; wait` against the local dev server.
**Expected:** Both runs print `SMOKE OK`.
**Why human:** The truth is tagged `verification: backstop`. Only the offline fake test exists, and live Supabase is human-only (D-06). This is WINDOWS.md entry 1.

#### 2. Local restart persistence (C3)

**Test:** Run the dev server and the smoke once, restart the dev server, then run `SMOKE_VERIFY_ID=<id> npm --prefix web-app run smoke`.
**Expected:** `PERSIST OK <id>`.
**Why human:** This needs live Supabase. The roadmap SC1 is already met by the Heroku restart (same storage), so this only closes the plan's literal "locally" wording. Accepting it with an override is reasonable.

#### 3. Prohibition sign-off

**Test:** Confirm the 4 flagged prohibitions in the table above (one is test-tier with no automated enforcement, three are judgment-tier).
**Expected:** The reviewer agrees with the non-authoritative LLM-judge "holds" verdicts.
**Why human:** Judgment-tier items and unenforced test-tier items are never passed silently.

### Gaps Summary

No blocking gaps. The phase goal is met in the code: the API is substantive, wired to Supabase through RPCs, and covered by 338 passing tests. All 13 published examples are reproduced byte for byte by the real handlers. The user's live evidence shows the full flow and restart persistence on the real database.

What is left is human sign-off:
- The unrun C4 parallel smoke (backstop).
- The optional local C3 restart run.
- The 4 flagged prohibitions.
- An optional override for the literal `herokuapp.com` artifact pattern, which the custom domain replaces.

---

_Verified: 2026-10-03T19:45:00Z_
_Verifier: Claude (gsd-verifier)_
