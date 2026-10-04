---
phase: 01-kontrakt-i-backend-spraw
plan: 03
subsystem: api
tags: [nextjs, route-handlers, supabase-js, vitest, hmac, bearer-token, cors]

requires:
  - phase: 01-kontrakt-i-backend-spraw (plan 01-01)
    provides: contract v2 types.ts and demo-accounts.ts (error codes, LIMITS, LOGIN_SCOPES, demo accounts/children/classes)
  - phase: 01-kontrakt-i-backend-spraw (plan 01-02)
    provides: contract v2 approval and package clearance (@supabase/supabase-js@^2.117.2, vitest@^4.1.11)
provides:
  - create-next-app scaffold tracked in git (50fe075)
  - vitest harness (node env, .invalid Supabase host, test-only secrets) and npm scripts test/typecheck
  - lazy server-only Supabase client (getSupabase, checkStorage)
  - shared HTTP helpers (CORS_HEADERS, json, apiError, preflight, readJsonBody, handleRouteError)
  - typed infra errors (StorageUnavailableError, AuthNotConfiguredError)
  - demo bearer tokens and session checks (issueToken, verifyToken, readBearer, requireSession, sessionInfo)
  - hand-written validation (ValidationResult, isUuid, parseLogin)
  - GET/OPTIONS /api/health, POST/OPTIONS /api/auth/login, GET/OPTIONS /api/auth/me
  - in-memory supabase-js fake (fakeSupabase) and auth test helpers (tokenFor, authHeaders, apiRequest)
affects: [01-04, 01-05, 01-06, phase-2 panel, widget extension login]

actuals:
  tokens: 12800    # chars/4 over the 15 authored files (51231 chars); generated package-lock.json diff (~73000 by chars/4) and the unedited scaffold excluded
  tasks: 2
  commits: 4
plan_head_before: 3573e293d8502f2203ccc128d314fde392678acd
plan_head_after: db17fa54d843a92624389d68e22e1078280b2027

tech-stack:
  added: ["@supabase/supabase-js 2.117.2", "vitest 4.1.11 (dev)", "vite 7.3.6 (transitive, via override ^7.0.0)"]
  patterns:
    - "Every route: export dynamic = force-dynamic, explicit OPTIONS -> preflight(), try/catch -> handleRouteError"
    - "Error bodies only through apiError(code, details?) with status/message from the contract constants"
    - "Only supabase.ts imports the SDK; only http.ts calls console (grep gates)"
    - "Route tests mock @supabase/supabase-js with createClient -> fakeSupabase.client"

key-files:
  created:
    - web-app/vitest.config.mts
    - web-app/src/lib/server/errors.ts
    - web-app/src/lib/server/supabase.ts
    - web-app/src/lib/server/http.ts
    - web-app/src/lib/server/auth.ts
    - web-app/src/lib/server/validate.ts
    - web-app/src/app/api/health/route.ts
    - web-app/src/app/api/auth/login/route.ts
    - web-app/src/app/api/auth/me/route.ts
    - web-app/tests/helpers/fake-supabase.ts
    - web-app/tests/helpers/auth.ts
    - web-app/tests/api/health.test.ts
    - web-app/tests/api/auth.test.ts
    - web-app/tests/lib/auth-token.test.ts
  modified:
    - web-app/package.json
    - web-app/package-lock.json

key-decisions:
  - "vite pinned via package.json overrides {vite: ^7.0.0} (user-approved 'approve-override'): npm 10.9.8 crashed resolving vitest 4.1.11 against vite 8 optional devtools peers"
  - "verifyToken compares the base64url signature TEXT with timingSafeEqual, not decoded bytes, because base64url decoding ignores trailing padding bits and would accept some altered last characters"
  - "fakeSupabase.reset() clears tables, counters, clock, id queue and armed failures but keeps rpcHandlers (persistent registry for 01-04/01-05)"

patterns-established:
  - "Infrastructure errors are typed classes mapped centrally in handleRouteError (503 storage_unavailable / 500 internal_error)"
  - "Session gate: requireSession(request, { scopes, roles }) -> 401 unauthorized / 403 forbidden; AuthNotConfiguredError propagates to 500"

requirements-completed: [API-06]

coverage:
  - id: D1
    description: "GET /api/health answers 200 {status: ok} through route -> http helpers -> lazy Supabase client -> storage, 503 storage_unavailable on query error, throw, or missing env, without leaking storage error text; OPTIONS 204 with CORS"
    verification:
      - kind: integration
        ref: "web-app/tests/api/health.test.ts (6 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "POST /api/auth/login with demo e-mail + 0000 issues a 12 h HMAC bearer token with panel/extension scope; identical 401 for unknown e-mail and wrong code; 403 teacher+extension; 400/413 body handling; fails closed (500) without a 32+ char secret"
    requirement: API-06
    verification:
      - kind: integration
        ref: "web-app/tests/api/auth.test.ts#POST /api/auth/login (14 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "GET /api/auth/me returns the session for a valid token and 401 for missing, bare, non-Bearer, tampered, expired, unknown-account and teacher-extension tokens"
    requirement: API-06
    verification:
      - kind: integration
        ref: "web-app/tests/api/auth.test.ts#GET /api/auth/me (11 tests)"
        status: pass
      - kind: unit
        ref: "web-app/tests/lib/auth-token.test.ts (16 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Server secrets stay out of the client bundle and the SDK/console are confined to their single modules"
    verification:
      - kind: other
        ref: "npm --prefix web-app run build && ! grep -rlE 'SUPABASE_SERVICE_ROLE_KEY|DEMO_AUTH_SECRET' web-app/.next/static; SDK/console/public-prefix grep gates"
        status: pass
    human_judgment: false

duration: 13min
completed: 2026-10-03
status: complete
---

# Phase 01 Plan 03: Backend foundation and demo login Summary

**Next 16 route handlers for /api/health, /api/auth/login and /api/auth/me, backed by a lazy server-only supabase-js client, shared CORS and error-envelope helpers, and 12 h HMAC-SHA256 bearer tokens with panel/extension scopes. Covered by 47 vitest tests that run against an in-memory supabase-js fake and never touch a real project.**

## Performance

- **Duration:** about 13 min wall clock across two executor runs (16:54Z scaffold commit to 17:08Z), excluding the time the user took to answer the package checkpoint
- **Started:** 2026-10-03T16:54:28Z
- **Completed:** 2026-10-03T17:08:00Z
- **Tasks:** 2 of 2, plus the step (0) scaffold commit
- **Files:** 16 created or modified in Tasks 1 and 2. The step (0) scaffold commit tracked 17 more files without editing them.

## Accomplishments

- Tracer: GET /api/health runs through every layer: route, http helpers, `getSupabase()`/`checkStorage()`, then the (fake) `reports` table. Storage failures, throws and missing env all answer 503 with the fixed Polish message. The env-missing case makes no query at all.
- Shared helpers for every later route. `json()` sets CORS plus `Cache-Control: no-store`. `apiError()` takes the status and message from the contract constants only. `readJsonBody()` enforces the 32 KB cap from both content-length and the measured UTF-8 bytes. `handleRouteError()` logs only an error code or name.
- Demo login (API-06): the e-mail is trimmed and lowercased, the code is 0000, and the scope defaults to panel. Teachers asking for the extension scope get 403. An unknown e-mail and a wrong code return identical response text. A missing or short secret means no token is ever issued (500).
- Bearer tokens: `base64url(payload).base64url(HMAC)`, compared with `timingSafeEqual`. They are rejected when expired, forged with a non-demo sub, or a teacher+extension payload, even when the signature is valid. `requireSession` takes `scopes`/`roles` rules for plans 01-04 and 01-05.
- `fakeSupabase` test double: from/select/eq/in/order/limit/single/maybeSingle/insert, an rpc registry (an unknown rpc returns PGRST202), failNext/throwNext, callCount/calls, setClock/now (+1 ms per call), queueIds, and timestamps stored in PostgREST `+00:00` form.

## Task Commits

0. **Step (0): track create-next-app scaffold** - `50fe075` (chore). Made by the previous executor; exactly 17 paths.
1. **Task 1: Health tracer** - `8360504` (feat). Includes package.json and package-lock.json.
2. **Task 2: Demo login and session (TDD)**
   - RED - `f18cb53` (test): tests, helper and not-implemented skeletons; 35 failed / 6 passed, all failures on assertions
   - GREEN - `db17fa5` (feat): implementation; 41/41 pass
   - REFACTOR - none needed

**Plan metadata:** recorded in the final docs commit for this plan.

## Files Created/Modified

- `web-app/package.json`: dependency `@supabase/supabase-js ^2.117.2`, devDependency `vitest ^4.1.11`, scripts `test` and `typecheck`, `overrides.vite ^7.0.0`
- `web-app/package-lock.json`: lockfile for the installs above (vitest 4.1.11, vite 7.3.6)
- `web-app/vitest.config.mts`: `@` alias, node env, `tests/**/*.test.ts`, test env with an `http://supabase.invalid` URL and test-only secrets
- `web-app/src/lib/server/errors.ts`: `StorageUnavailableError`, `AuthNotConfiguredError`
- `web-app/src/lib/server/supabase.ts`: `getSupabase()` (lazy, env checked on every call), `checkStorage()`
- `web-app/src/lib/server/http.ts`: `CORS_HEADERS`, `json`, `apiError`, `preflight`, `readJsonBody`, `handleRouteError`
- `web-app/src/lib/server/auth.ts`: `getAuthSecret`, `issueToken`, `verifyToken`, `readBearer`, `requireSession`, `sessionInfo`, `Session`
- `web-app/src/lib/server/validate.ts`: `ValidationResult`, `isUuid`, `parseLogin`
- `web-app/src/app/api/health/route.ts`, `web-app/src/app/api/auth/login/route.ts`, `web-app/src/app/api/auth/me/route.ts`: routes, all `force-dynamic` with explicit OPTIONS
- `web-app/tests/helpers/fake-supabase.ts`, `web-app/tests/helpers/auth.ts`: test doubles and helpers
- `web-app/tests/api/health.test.ts` (6), `web-app/tests/api/auth.test.ts` (25), `web-app/tests/lib/auth-token.test.ts` (16): 47 tests

## Decisions Made

- **vite override (user-approved):** see Deviations.
- **Signature compared as text:** `verifyToken` recomputes the base64url signature string and compares the UTF-8 bytes of the two strings with `timingSafeEqual`. Comparing the decoded HMAC bytes would accept a changed last character whenever only the 2 padding bits differ. This is the exact case the plan's "last character changed → 401" test covers.
- **rpcHandlers survive reset():** later plans can register fake RPCs (create_report, transition_report, list_reports) once per test file. A test that registers a temporary handler deletes it afterwards.
- **Extra tests beyond the behavior list:** a non-Bearer scheme, a JSON array body, collecting every field error, a short-secret /me 500, payloads with a bad version, scope or exp, requireSession rules, and isUuid. These only add coverage and change no behavior.

## Deviations from Plan

### User-approved deviation

**1. [Rule 3 - Blocking, user-approved "approve-override"] Pinned vite to ^7 through package.json `overrides`**
- **Found during:** Task 1 step (1), by the previous executor
- **Issue:** `npm --prefix web-app install --save-dev vitest@^4.1.11` crashed in npm 10.9.8 with `Cannot read properties of null (reading 'edgesOut')`. vite 8's optional devtools peers pulled in vitest@5.0.3 during resolution.
- **Fix:** At the blocking-human checkpoint the user chose "approve-override". I added `"overrides": { "vite": "^7.0.0" }` to web-app/package.json and re-ran the same install command. No --force, no --legacy-peer-deps, same npm version.
- **Result (confirmed with `npm ls`):** vitest@4.1.11, vite@7.3.6 (overridden, deduped under @vitest/mocker), @supabase/supabase-js@2.117.2. No `@vitejs/*` devtools packages were installed. No other packages were added by hand.
- **Files modified:** web-app/package.json, web-app/package-lock.json
- **Committed in:** 8360504

### Process note (TDD evidence tooling)

`gsd-tools check tdd-red-evidence` returned `INVALID_RED / zero_tests_discovered` for the vitest TAP output. Its parser needs the node:test trailer lines (`# tests N`, `# pass N`, `# fail N`), and vitest's `tap-flat` reporter does not emit them. The same record lists all 35 failing tests by name, including the target test "logs a parent into the panel with code 0000 and returns a 12 h session" (`expected 500 to be 200`). The plan is `type: execute` with a task-level `tdd="true"`, so the formal plan-level gate does not apply. RED (`f18cb53`) precedes GREEN (`db17fa5`) in git.

**Total deviations:** 1, user-approved (package resolution). **Impact on plan:** Only the vite major version changed. The approved package names and ranges are unchanged and there is no scope creep.

## TDD Gate Compliance

- RED: `f18cb53 test(01-03): ...`. Every target test failed on an assertion against not-implemented skeletons (35 failed, 6 trivially passing negative paths).
- GREEN: `db17fa5 feat(01-03): ...`. 41/41 Task 2 tests pass; the full suite is 47/47.
- REFACTOR: none needed.

## Issues Encountered

- **npm audit:** 5 high-severity advisories, already present in the create-next-app scaffold's `eslint-config-next` dependency chain (dev-only lint tooling). They come from neither @supabase/supabase-js nor vitest. As instructed, I did not run `npm audit fix`. They are left for a deliberate dependency review.
- The production build loads `web-app/.env.local` by itself if that file exists (framework behavior, see the plan's D-06 note). The agent never opened, printed or sourced any `.env*` file, and env-related build output lines were filtered out of the logs.

## Verification Results

- `node -e` scripts gate: PASS (`test` = `vitest run`, `typecheck` = `tsc --noEmit`, lint and build kept)
- `npm --prefix web-app test`: 3 files, 47 tests passed (health 6, auth 25, auth-token 16)
- `npm --prefix web-app run typecheck`: PASS (no `error TS`)
- `npm --prefix web-app run lint`: PASS
- `npm --prefix web-app run build`: PASS. The routes /api/health, /api/auth/login and /api/auth/me are all dynamic (ƒ).
- SDK only in supabase.ts and console only in http.ts: PASS. No public-prefixed env name in web-app/src: PASS.
- `! grep -rlE "SUPABASE_SERVICE_ROLE_KEY|DEMO_AUTH_SECRET" web-app/.next/static`: PASS (checked after the final build too)
- `timingSafeEqual` in auth.ts and `DEMO_LOGIN_CODE` in the login route: PASS
- The Task 2 commits left web-app/package.json unchanged: PASS
- No real Supabase project was contacted and no `.env*` file was read (D-06).

## User Setup Required

None for this plan. Plan 01-06 asks a human to set `DEMO_AUTH_SECRET` (at least 32 characters) next to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on the server.

## Next Phase Readiness

- Ready for 01-04. Routes can use `requireSession(request, { scopes, roles })`, `readJsonBody`, `apiError`, `handleRouteError` and `getSupabase()`. Tests can extend `fakeSupabase` (rpcHandlers, queueIds, setClock) and use `authHeaders()`/`apiRequest()`.
- No blockers.

---
*Phase: 01-kontrakt-i-backend-spraw*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 14 created files exist on disk; package.json and package-lock.json modified.
- Commits found: 50fe075, 8360504, f18cb53, db17fa5.
