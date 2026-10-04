---
phase: 01-kontrakt-i-backend-spraw
fixed_at: 2026-10-03T19:20:00Z
review_path: .planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-REVIEW.md
iteration: 1
findings_in_scope: 5
fixed: 4
skipped: 1
status: partial
---

# Phase 01: Code Review Fix Report

**Fixed at:** 2026-10-03T19:20:00Z
**Source review:** .planning/workstreams/web-app/phases/01-kontrakt-i-backend-spraw/01-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 5 (CR-01, WR-01..WR-04; Info findings out of scope)
- Fixed: 4
- Skipped: 1 (WR-04, by design)

**Branch state - action needed:** the four fix commits are on the temp branch `gsd-reviewfix/01-34062` (based on `a0e2aa1`). The fast-forward of `gsd/phase-01-kontrakt-i-backend-spraw` failed because two commits landed on it during the run (`9a4da1a`, `8918052`, landing page only: `web-app/src/app/_landing/Schools.tsx`, `content.ts`). The file sets do not overlap, so a merge or rebase of `gsd-reviewfix/01-34062` should be clean. The temp branch was kept for that manual merge.

## Fixed Issues

### CR-01: The 32 KB body cap does not apply to chunked requests

**Files modified:** `web-app/src/lib/server/http.ts`, `web-app/tests/lib/http-body.test.ts` (new)
**Commit:** 9d68cc4
**Applied fix:** `readJsonBody` now reads `request.body` chunk by chunk through a new `readCappedBody` helper. As soon as more than `LIMITS.maxBodyBytes` bytes have arrived, it cancels the stream and answers 413 `payload_too_large`. The declared `Content-Length` pre-check stays. The bytes are decoded with `TextDecoder` (same UTF-8 and BOM handling as `request.text()`).
**Tests:**
- A `ReadableStream` body with no `Content-Length` and no end gets 413, and the stream is cancelled after about 33 KB.
- A body larger than a falsely small `Content-Length` gets 413.
- A chunked body of exactly 32768 bytes is accepted.
- A multi-byte UTF-8 character split across chunks decodes correctly.
- `POST /api/auth/login` with an unbounded stream answers 413 with CORS headers before authentication.

### WR-01: NUL characters and unpaired surrogates become 503 instead of 400

**Files modified:** `web-app/src/lib/server/validate.ts`, `web-app/tests/api/reports.test.ts`, `web-app/tests/api/comments.test.ts`, `web-app/tests/api/transitions.test.ts`
**Commit:** 1224259
**Applied fix:** A shared `hasUnstorableChars` helper (U+0000, or a lone high or low surrogate) is used in `parseNewReport` (`content`), `parseTransition` (`comment`) and `parseComment` (`body`). A match gives a 400 `validation_error` field error with the message "Tekst zawiera niedozwolone znaki.". Emoji (paired surrogates) are still accepted. The checks are covered by tests on all three routes, and the tests assert that nothing is stored.

### WR-02: Supabase calls have no timeout

**Files modified:** `web-app/src/lib/server/supabase.ts`, `web-app/tests/lib/supabase-timeout.test.ts` (new)
**Commit:** 7d7e0c3
**Applied fix:** The server client is created with `db: { timeout: 8000, retry: false }` (exported as `STORAGE_TIMEOUT_MS` / `STORAGE_DB_OPTIONS`). I used the supabase-js `db.timeout` option instead of the review's custom fetch for a reason found while testing. The installed postgrest-js (2.117.2) retries GET requests by default: up to 3 times on network errors and on 503/520 answers, with a 1-4 s backoff or the server's `Retry-After`. A custom fetch that rejects with `TimeoutError` would be retried, so a single call could still pass the 30 s router limit. The library's own timeout aborts with `AbortError`, which is never retried. Turning retries off bounds a call at 8 s, and a route makes at most two storage calls in sequence.

Behaviour change: storage GETs are no longer retried automatically. A transient failure now returns 503 at once. This matches the contract: the client retries a 503 by hand.

**Tests:** these run the real supabase-js client over a stubbed global fetch, with the timeout shortened to 20 ms in the test:
- `/api/health` answers 503 when storage hangs.
- After a network error or a 503 with `Retry-After`, fetch is called exactly once.
- A stalled table read and a stalled RPC write both reject with `StorageUnavailableError`.
- The client options are `{ timeout: 8000, retry: false }`, and two sequential calls fit under 30 s.

I checked that the tests catch a regression: with the options removed, 3 of them fail.

### WR-03: History and comments are append-only only against UPDATE

**Status:** fixed: requires human verification (apply the migration to Supabase)
**Files modified:** `web-app/supabase/migrations/20261003170200_append_only_guards.sql` (new), `web-app/tests/lib/schema-mirror.test.ts`, `web-app/src/lib/server/reports.ts` (comment only), `web-app/README.md` (migration list)
**Commit:** 81e5c0f
**Applied fix:** This is a new migration. The applied migrations 20261003170000 and 20261003170100 are unchanged. It adds `public.forbid_delete()` plus `before delete` (row) and `before truncate` (statement) triggers on `report_history` and `report_comments`. A delete is allowed only when the trigger fires nested (`pg_trigger_depth() > 1`) and the parent report no longer exists. That is exactly the `on delete cascade` from `public.reports`, so the `seed.sql` demo reset keeps working. EXECUTE on the new function is revoked from `public, anon, authenticated` and granted to `service_role`, which satisfies the schema-mirror rule. `seed.sql` is unchanged (`seed:check` passes).

Side effect: `truncate public.reports cascade` is now refused, because it would truncate history too.

**Verification:**
- The schema-mirror test asserts the delete and truncate triggers on both tables, the cascade guard, both `on delete cascade` FKs and the revoke/grant lines.
- I also ran the migrations and the seed against a throwaway local PostgreSQL 17 cluster in the session scratchpad (localhost only, never Supabase). I applied all three migrations and ran the seed three times.
  - Refused: direct DELETE on history and on comments (also as `service_role`), TRUNCATE of either table, `TRUNCATE reports CASCADE`, and a DELETE issued from another trigger while the report exists.
  - Unchanged: the UPDATE guard still raises.
  - Allowed: deleting a report as `service_role` cascades (6/13/3 rows go to 5/9/1).
  - The seed re-run restores 6/13/3.

The cluster was stopped afterwards.

**Human step:** apply `20261003170200_append_only_guards.sql` in the Supabase SQL Editor after the two existing migrations. It was not applied by this run.

## Skipped Issues

### WR-04: The public demo login makes scope and visibility rules non-security on the live deployment

**File:** `web-app/src/app/api/auth/login/route.ts:25-29`
**Reason:** skipped: by design (API-06). The demo login with code `0000` on fictional accounts and fictional demo data is an accepted decision (D-14, contract "Bezpieczeństwo i dane demo"). The extension/panel scopes are UX separation on the demo, not a security boundary. No real personal data should go through the demo API: the widget, panel and presentation must use only fictional content.
**Original issue:** Every account logs in with the public code `0000` and there is no rate limit, so on the live deployment anyone can read every report, log in with `scope: "panel"` from the child's device, and write without limit.

## Verification Environment

- Where the gates ran: the isolated git worktree (`.claude/worktrees/rf-01-34062-*`, branch `gsd-reviewfix/01-34062`, base `a0e2aa1`). `web-app/node_modules` was a symlink to the main checkout's `node_modules`. `.next/types` was generated with `npx next typegen`, which `tsc` needs for `LayoutProps`. The worktree has since been removed.
- After each fix: `npm test` (final: 17 files, 338 tests, all passing), `npm run typecheck` (clean) and `npm run lint` (clean). After WR-03, `npm run seed:check` reported "seed.sql is up to date".
- Not run: the gates on the merged state (temp branch + `9a4da1a`/`8918052`), because the fast-forward failed. Re-run `npm --prefix web-app test`, `typecheck` and `lint` after the manual merge.
- No Supabase, Heroku or live-URL calls were made, and no `.env` file was read.

---

_Fixed: 2026-10-03T19:20:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
