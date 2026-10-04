---
phase: 01-kontrakt-i-backend-spraw
reviewed: 2026-10-03T21:05:00Z
depth: standard
files_reviewed: 22
files_reviewed_list:
  - web-app/src/app/api/auth/login/route.ts
  - web-app/src/app/api/auth/me/route.ts
  - web-app/src/app/api/health/route.ts
  - web-app/src/app/api/reports/route.ts
  - web-app/src/app/api/reports/[id]/route.ts
  - web-app/src/app/api/reports/[id]/transitions/route.ts
  - web-app/src/app/api/reports/[id]/comments/route.ts
  - web-app/src/lib/contract/workflow.ts
  - web-app/src/lib/server/access.ts
  - web-app/src/lib/server/auth.ts
  - web-app/src/lib/server/errors.ts
  - web-app/src/lib/server/http.ts
  - web-app/src/lib/server/pagination.ts
  - web-app/src/lib/server/reports.ts
  - web-app/src/lib/server/supabase.ts
  - web-app/src/lib/server/validate.ts
  - web-app/supabase/migrations/20261003170000_reports.sql
  - web-app/supabase/migrations/20261003170100_report_transitions.sql
  - web-app/scripts/build-seed.mjs
  - web-app/scripts/smoke-api.mjs
  - web-app/package.json
  - web-app/Procfile
findings:
  critical: 1
  warning: 4
  info: 6
  total: 11
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-10-03T21:05:00Z
**Depth:** standard
**Files Reviewed:** 22
**Status:** issues_found

## Summary

I reviewed the demo backend: the route handlers, the server library (auth tokens, access scoping, validation, pagination, Supabase data access), the two SQL migrations, the seed generator, the smoke script and the Heroku start config. I read `.planning/shared/CONTRACT.md` and the phase CONTEXT for intent. `npm --prefix web-app test` passes (15 files, 318 tests). I did not read any `.env` file, did not hit the live URL and ran no Supabase or Heroku commands.

What holds up well:
- Token signing and verification: HMAC-SHA256, a secret of at least 32 characters, timing-safe comparison of the signature text, and validation of the version, expiry and scope.
- Access scoping: `canView` and `listScopeFor` encode the same rule, and an empty scope never becomes "all reports" (checked in TS and in SQL).
- The actor and author always come from the session.
- The transition write is atomic and race-safe (`where state = p_from_state`).
- Function EXECUTE grants are revoked from `public`, `anon` and `authenticated`.
- Error logging never prints bodies or secrets.
- No SQL injection paths: every value goes through RPC or PostgREST parameters.

The main issue is that the 32 KB body cap does not hold for chunked request bodies. Any unauthenticated client can make the live dyno buffer an unbounded request body in memory. Smaller issues:
- Some client input (NUL characters, unpaired surrogates) is reported as a 503 database outage instead of a 400.
- Supabase calls have no timeout.
- History and comments are protected against UPDATE but not against DELETE or TRUNCATE, although the contract says they cannot be deleted.
- The public demo login means that the extension/panel scope split and per-account visibility are not a security boundary on the live deployment.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: The 32 KB body cap does not apply to chunked requests - unauthenticated memory exhaustion of the live dyno

**File:** `web-app/src/lib/server/http.ts:48-60`

**Issue:** `readJsonBody` enforces `LIMITS.maxBodyBytes` in only two places:
- the declared `Content-Length` header (lines 49-55);
- the decoded text, measured *after* `await request.text()` has buffered the whole body (lines 57-60).

A request sent with `Transfer-Encoding: chunked` has no `Content-Length`, so the first check is skipped. `request.text()` then reads the entire stream into memory before any size check runs. Nothing else in the stack bounds the body:
- Next.js App Router route handlers have no default body limit (that limit applies only to Server Actions and middleware/proxy cloning, and there is no middleware here);
- `next.config.ts` is empty;
- Node's HTTP server has no limit.

`POST /api/auth/login` reads the body before any authentication, so an anonymous client can stream hundreds of MB per request. On a Heroku dyno with 512 MB-1 GB of memory, a few concurrent requests cause R14/R15 memory errors or crash the process. The same happens on the authenticated POST routes, and every demo account is public (see WR-04). The code comments and the contract ("413 payload_too_large, limit 32 KB") claim a guarantee that does not hold.

**Fix:** Read the stream incrementally and stop as soon as the cap is exceeded:
```ts
export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  const declared = request.headers.get("content-length");
  if (declared !== null && declared.trim() !== "") {
    const length = Number(declared);
    if (Number.isFinite(length) && length > LIMITS.maxBodyBytes) {
      return { ok: false, response: apiError("payload_too_large") };
    }
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  if (request.body) {
    const reader = request.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > LIMITS.maxBodyBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, response: apiError("payload_too_large") };
      }
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  const text = new TextDecoder().decode(bytes);
  // ... JSON.parse and the object check as today
}
```
Add a test that posts a `ReadableStream` body larger than 32 KB with no `Content-Length` and expects 413.

## Warnings

### WR-01: NUL characters and unpaired surrogates in user text become 503 storage_unavailable instead of 400

**File:** `web-app/src/lib/server/validate.ts:144-149, 247-253, 275-281` (effect in `web-app/src/lib/server/reports.ts:168-179`)

**Issue:** `parseNewReport`, `parseTransition` and `parseComment` accept any JS string after trimming and length checks. Two kinds of valid JSON input fail inside Postgres:
- **NUL characters.** `{"content":"a\u0000b"}` is valid JSON. When supabase-js forwards it, PostgREST or Postgres rejects it (`22P05 unsupported Unicode escape sequence`, because text cannot hold U+0000).
- **Unpaired surrogates.** `"\ud800"` is likewise rejected as invalid JSON Unicode.

`run()` turns either error into `StorageUnavailableError`, so the client gets 503 with the message "the database is unavailable - nothing was saved, try again". The widget (ERR-01) shows a "no connection" state, and the user is told to retry a request that can never succeed. The server log also records it as a storage outage, which hides the real cause during the demo.

**Fix:** Reject these characters in validation with a field error (400 `validation_error`). Use one shared helper for all three parsers:
```ts
// U+0000 and lone surrogates cannot be stored in Postgres text.
const UNSTORABLE = /\u0000|[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/;
function hasUnstorableChars(value: string): boolean {
  return UNSTORABLE.test(value);
}
// parseNewReport: if (hasUnstorableChars(content)) errors.push({ field: "content", message: "Treść zawiera niedozwolone znaki." });
// same for transition comment and comment body
```

### WR-02: Supabase calls have no timeout - a slow database causes Heroku's HTML 503 instead of the contract's JSON 503

**File:** `web-app/src/lib/server/supabase.ts:24-26` (all callers in `web-app/src/lib/server/reports.ts:168-179` and `supabase.ts:32-42`)

**Issue:** `createClient` uses the default global `fetch` with no `AbortSignal`. If Supabase hangs (paused free-tier project, network stall, lock wait), `run()` never rejects, and the request is held until the Heroku router cuts it at 30 s (H12). Heroku's error has no JSON envelope and no CORS headers. The extension and panel then see an opaque network or CORS failure instead of `503 storage_unavailable`, which breaks the guarantee "503 when the database does not answer". `GET /api/health` hangs the same way instead of answering 503.

**Fix:** Pass a fetch with a timeout below the router limit:
```ts
const STORAGE_TIMEOUT_MS = 8000;
client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  global: {
    fetch: (input, init) =>
      fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(STORAGE_TIMEOUT_MS) }),
  },
});
```
The abort makes the call reject, `run()` wraps the rejection as `StorageUnavailableError`, and the client gets the contract 503.

### WR-03: History and comments are append-only only against UPDATE - DELETE and TRUNCATE are not blocked, despite the contract

**File:** `web-app/supabase/migrations/20261003170000_reports.sql:110-125` (also `44`, `86`: `on delete cascade`)

**Issue:** The contract (section on history and comments) says entries "cannot be edited or deleted", and the migration comment says "Append-only history and comments (D-10, D-11)". Only `before update` triggers exist. A `delete from public.report_history ...`, a `truncate`, or deleting the parent report (which cascades) removes the audit trail silently. Exposure is limited because only the server holds service_role, but the database does not enforce the stated guarantee, and `reports.ts:310-311` claims more protection than exists. The seed's demo reset depends on the cascade, so a fix has to keep cascades working.

**Fix:** Add a new migration (do not edit the applied one) that blocks direct deletes and truncation but still allows the cascade from `reports`:
```sql
create function public.forbid_direct_delete() returns trigger
language plpgsql set search_path = public as $$
begin
  -- depth 1 = a direct DELETE; a cascade from public.reports runs inside the RI trigger (depth >= 2)
  if pg_trigger_depth() < 2 then
    raise exception '% is append-only', tg_table_name;
  end if;
  return old;
end;
$$;
create trigger report_history_no_delete before delete on public.report_history
  for each row execute function public.forbid_direct_delete();
create trigger report_comments_no_delete before delete on public.report_comments
  for each row execute function public.forbid_direct_delete();
create trigger report_history_no_truncate before truncate on public.report_history
  for each statement execute function public.forbid_update();
create trigger report_comments_no_truncate before truncate on public.report_comments
  for each statement execute function public.forbid_update();
```
Alternatively, change the contract wording to "cannot be edited; removed only together with the report (demo reset)".

### WR-04: The public demo login makes scope and visibility rules non-security on the live deployment

**File:** `web-app/src/app/api/auth/login/route.ts:25-29`, `web-app/src/lib/contract/demo-accounts.ts:12`, `web-app/src/app/api/auth/me/route.ts:16`

**Issue:** Every account logs in with the constant code `0000`. The demo e-mails are in the public contract and the repo, and the validation message itself says "(w demo: 0000)". There is no rate limit on any endpoint. On the live deployment (`https://bezpieczna-aura.pl`) this means:
- **The extension/panel scope split does not protect anything.** The extension token sits on the child's device. `GET /api/auth/me` returns the parent's e-mail to that token, so the child, or anyone, can log in with `scope: "panel"` and read history and comments. The route comments present that split as a protection ("the extension token (the child's device) never receives history or comments").
- **Visibility rules do not protect report content.** Anyone on the internet can log in as any parent or teacher and read every report's `content`. That content is a pasted copy of the message the child received, so on a live site it can contain real third-party personal data (names, phone numbers, links) if anyone uses the extension for real.
- **Anyone can write without limit.** Anyone can create unlimited reports and comments (non-idempotent, no rate limit) and run transitions on the shared demo data, including the seed reports the presentation relies on.

This is an accepted demo decision (D-14), but nothing in code or config limits its blast radius, and the scope rules read as security controls.

**Fix:** At minimum:
- Document in the contract and README that scopes are UX separation only.
- Show a "demo only - do not paste real data" notice in the widget and panel.
- Add a simple per-IP rate limit on `POST /api/auth/login` and the POST routes. An in-memory token bucket is enough for one dyno.

Optionally:
- Gate the live login behind an env flag or allowlist (for example, a `DEMO_LOGIN_ENABLED` env check) so it can be turned off after the presentation.
- Run a scheduled reset of the seed rows.

## Info

### IN-01: Table privileges for anon/authenticated are not revoked (RLS is the only barrier)

**File:** `web-app/supabase/migrations/20261003170000_reports.sql:138-140`

**Issue:** Supabase's default privileges grant ALL on new `public` tables to `anon` and `authenticated`. The migration relies only on "RLS enabled, no policies". That holds for SELECT, INSERT, UPDATE and DELETE through PostgREST and GraphQL. However, privileges that RLS does not cover (for example TRUNCATE, REFERENCES and TRIGGER) stay granted, and a policy added later by mistake would open the tables to the public anon key at once.

**Fix:** In a new migration, run `revoke all on table public.reports, public.report_history, public.report_comments from anon, authenticated;` so only `service_role` keeps access.

### IN-02: A blank transition comment is accepted and dropped, while the contract limits table says "non-empty if provided"

**File:** `web-app/src/lib/server/validate.ts:247-253`

**Issue:** `{"action":"approve","comment":"   "}` returns 201 with `comment: null` (tested in `tests/api/transitions.test.ts:203-211`). The contract's limits table (`transitionCommentMaxChars`: "niepusty, jeśli podany", i.e. "non-empty if provided") suggests 400. The behaviour is deliberate, but the contract text and the implementation disagree.

**Fix:** Either change the contract wording to "a blank comment counts as no comment", or return a `comment` field error for a provided blank string.

### IN-03: A storage-shape error after a committed write is reported as "nothing was saved"

**File:** `web-app/src/lib/server/reports.ts:48-50, 189-204, 313-330`

**Issue:** `mapReport` and `mapComment` throw `StorageUnavailableError` when the returned row does not match the contract. In `createReport` and `addComment` the RPC or INSERT has already committed by then. The client gets 503 with the message "nothing was saved or confirmed", retries by hand, and creates a duplicate report or comment. Because the failure is deterministic, every retry does the same. The schema-mirror test makes this unlikely today, but the mapping hides a programming bug as a storage outage.

**Fix:** Throw a distinct `ContractShapeError` that maps to 500 `internal_error` with its own log tag, so drift is visible and the client is not told that nothing was saved.

### IN-04: build-seed renders invalid SQL for an empty report list

**File:** `web-app/scripts/build-seed.mjs:121`

**Issue:** `delete from public.reports where id in ();` is a syntax error when `dataset.reports` is empty. `str()` (line 37-40) also escapes only single quotes, so it relies on `standard_conforming_strings = on` (the default). This is safe for the trusted dataset.

**Fix:** `if (dataset.reports.length === 0) fail("dataset has no reports");` before rendering.

### IN-05: Smoke coverage gaps and a fragile seed-present check

**File:** `web-app/scripts/smoke-api.mjs:219-223, 302-308`

**Issue:**
- The smoke never calls `GET /api/reports` with a teacher token. The teacher list path is the only one that sends `p_child_ids uuid[]` and `p_states text[]` through PostgREST, so it is untested live.
- `seed-present` looks for the seed rows in Ola's first 100 reports, newest first. Ola's account is public (WR-04), so once 98 or more newer reports are filed under it, the check fails falsely.
- Every smoke run leaves a permanent closed report under the smoke parent in production.

**Fix:**
- Add a `list-teacher` step that expects the new report after `approve`.
- Have `seed-present` fetch each seed id via `GET /api/reports/{id}` instead.

### IN-06: `@types/node` major version does not match the Node engine

**File:** `web-app/package.json:6, 28`

**Issue:** `engines.node` is `22.x`, but `@types/node` is `^20`, so type checking cannot see Node 22 APIs and may accept APIs that changed.

**Fix:** Use `"@types/node": "^22"`.

---

_Reviewed: 2026-10-03T21:05:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
