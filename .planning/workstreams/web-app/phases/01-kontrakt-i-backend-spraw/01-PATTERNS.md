# Phase 1: Kontrakt i backend spraw - Pattern Map

**Mapped:** 2026-10-03
**Files analyzed:** 17 (new or modified)
**Analogs found:** 6 / 17. All analogs are git-tracked. There is no application code yet, so route handlers, Supabase access and SQL have no in-repo analog.

> **Status of the existing analogs.** Commit 8b4ee4d added the v1 contract artifacts. They describe the **superseded** model (replies to the child, no login, `signals`, `selected_action`, single `already_acted`, `listMaxItems: 200`). D-08…D-18 replace that model. **Keep their conventions** (file layout, erasable TS, `*_LABELS_PL` maps, error envelope, checker structure). **Rewrite their content.**

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality | Action |
|---|---|---|---|---|---|
| `.planning/shared/CONTRACT.md` | config/spec | n/a | itself (v1) | exact | REWRITE: keep the section skeleton, replace the model |
| `.planning/shared/examples/*.json` | config/fixtures | n/a | `examples/errors.json`, `get-case.json`, … (v1) | exact | REWRITE: delete `post-case-replies.json`, add transitions, comments, history, login, pagination |
| `web-app/src/lib/contract/types.ts` | model (shared types) | transform | itself (v1) | exact | REWRITE: keep conventions |
| `web-app/scripts/check-contract-examples.mjs` | test/utility | batch, file-I/O | itself (v1) | exact | REWRITE checkers, keep the runner (lines ~340-381) |
| `web-app/src/lib/contract/transitions.ts` (or inside types.ts) | model | transform | `types.ts` const-array pattern | role-match | NEW |
| `web-app/src/lib/demo/accounts.ts` (hardcoded parents/teachers/children/class links, code `0000`) | config/model | n/a | `types.ts` const pattern | partial | NEW |
| `web-app/src/lib/server/supabase.ts` (service_role client, server-only) | service | CRUD | none | none | NEW |
| `web-app/src/lib/server/http.ts` (error envelope, JSON parse, body limit, CORS headers) | utility | request-response | `types.ts` `ApiErrorBody` + `API_ERROR_MESSAGES_PL` | partial | NEW |
| `web-app/src/lib/server/auth.ts` (session token / cookie → actor {role, id}) | middleware | request-response | Next docs route.md "Cookies" | none in repo | NEW |
| `web-app/src/lib/server/validate.ts` | utility | transform | checker helpers `nonBlankString`/`oneOf` (check-contract-examples.mjs lines 53-73) | partial | NEW |
| `web-app/src/lib/server/reports.ts` (data access: create/list/get/transition/comment/history) | service | CRUD | none | none | NEW |
| `web-app/src/app/api/auth/login/route.ts` | controller | request-response | Next docs route.md | none in repo | NEW |
| `web-app/src/app/api/reports/route.ts` (POST, GET with `?limit=&cursor=`) | controller | CRUD | Next docs route.md | none in repo | NEW |
| `web-app/src/app/api/reports/[id]/route.ts` (GET detail) | controller | CRUD | Next docs route.md (`RouteContext`) | none in repo | NEW |
| `web-app/src/app/api/reports/[id]/transitions/route.ts` (approve/reject/escalate/close/reopen) | controller | request-response | none | none | NEW |
| `web-app/src/app/api/reports/[id]/comments/route.ts` | controller | CRUD | none | none | NEW |
| `web-app/src/app/api/health/route.ts` | controller | request-response | `examples/get-health.json` | partial | NEW (kept from v1) |
| `web-app/supabase/migrations/0001_reports.sql` (+ seed) | migration | n/a | none | none | NEW |
| `web-app/package.json` | config | n/a | itself | exact | MODIFY: add `@supabase/supabase-js`, `server-only`, `check:contract` script, `engines.node`; start script must honour `$PORT` (`next start -p ${PORT:-3000}`) |

Resource names (`reports` vs `cases`) are the planner's choice. The table uses `reports`, which follows the D-08 vocabulary.

## Pattern Assignments

### `web-app/src/lib/contract/types.ts` (REWRITE)

**Conventions to keep** (lines 1-6). The header comment and the erasable-TS rule stay, because the checker loads this file through Node type stripping:
```ts
// Erasable TypeScript only (no enum, namespace, parameter properties or imports):
// web-app/scripts/check-contract-examples.mjs loads this file through Node type stripping.
```
**Enum pattern** (lines 8-15). Use a const tuple, a derived type and a Polish label map. Apply it to report states, roles, attack types, taken actions and transition actions:
```ts
export const CASE_STATUSES = ["new", "in_progress", "closed"] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];
export const CASE_STATUS_LABELS_PL: Record<CaseStatus, string> = { new: "nowa", ... };
```
**Error code pattern** (lines 41-59). `API_ERROR_CODES` plus `API_ERROR_MESSAGES_PL`. Keep `invalid_json`, `validation_error`, `payload_too_large`, `storage_unavailable` and `internal_error`. Rename `case_not_found` and add `unauthorized` (401), `forbidden` (403) and `invalid_transition` (409).
**Field list pattern** (lines 60-73). `CASE_FIELDS` and `REPLY_FIELDS` exist so the checker can enforce exact keys with `sameKeys`. Replace them with `REPORT_FIELDS`, `HISTORY_FIELDS` and `COMMENT_FIELDS`.
**LIMITS** (lines 75-84). Keep this object. Remove `listMaxItems: 200` (D-16) and add `pageDefault` / `pageMax`.
**Error envelope** (lines 145-160). Keep `ApiErrorBody { error: { code, message, details?: FieldError[] } }` unchanged.
**Remove:** `signals`, `selected_action`, `ALREADY_ACTED_*` (D-12, D-13), `Reply`, `NewReplyRequest` and `CaseWithReplies` (D-11).
**Add:** `taken_actions: TakenAction[]` with an `ACTIONS_BY_ATTACK_TYPE: Record<AttackType, readonly TakenAction[]>` map (D-12). Add `TRANSITIONS` as a const array of `{ action, from[], to, roles[] }` (D-09) in the same erasable style, so the checker can validate the history examples against it. Add `HistoryEntry { id, report_id, actor_id, actor_role, from_state, to_state, comment, created_at }`, `Comment`, `ReportListResponse { reports, next_cursor: string | null }`, `LoginRequest { email, code }` and `LoginResponse`.

### `web-app/scripts/check-contract-examples.mjs` (REWRITE)

- **Imports** (lines 12-24). Imports constants directly from `../src/lib/contract/types.ts`. Update the import list.
- **Helpers to keep verbatim** (lines ~45-95): `CheckError`, `fail`, `isObject`, `sameKeys`, `nonBlankString`, `oneOf`, `checkTimestamp`, `checkUuid`, plus `UUID_PATTERN` and `TIMESTAMP_PATTERN` (lines 29-31).
- **Delete** `checkSignals`, `checkSelectedAction`, `checkDemoChildId` and `checkReply`.
- **Per-object checker pattern** (`checkCase`, lines ~98-115): `sameKeys`, then a check per field, then the `updated_at >= created_at` rule. Copy it for report, history entry and comment.
- **Dispatch**: each example file has the keys `description, method, route, path, request, response`, and is checked through `routeCheckers[\`${method} ${route}\`]` (lines ~340-350). `ERROR_HTTP_STATUS` (lines 34-41) maps codes to statuses, so extend it with 401/403/409.
- **Runner** (lines ~352-381): readdir, `OK`/`FAIL` per file, exit 1 on failure. Keep it unchanged.

### `.planning/shared/CONTRACT.md` and `examples/*.json` (REWRITE)

Keep the existing heading skeleton: Bazowy URL, Zasady ogólne, Obiekty, Endpointy, Błędy, Limity, CORS, Przykłady, Bezpieczeństwo i dane demo, Reguły. Replace "Odpowiedź" with Historia and Komentarz, add a Logowanie section, and add a transition table with roles per transition.

Example file shape, copied from v1 `errors.json`: a `description` written in Polish, and an `errors[]` array of `{status, code, when, body:{error:{code,message}}}`.

Commit rule from `.planning/shared/README.md`: separate commit `docs(shared): ...`.

### Route handlers (`web-app/src/app/api/**/route.ts`), no in-repo analog

Source: `web-app/node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md`.
- Lines 82-95: in Next 16, **`params` is a Promise**. Use `const { id } = await ctx.params`.
- Lines 107-118: use the typed context helper, which is global and needs no import:
```ts
import type { NextRequest } from 'next/server'
export async function GET(_req: NextRequest, ctx: RouteContext<'/api/reports/[id]'>) {
  const { id } = await ctx.params
  return Response.json({ id })
}
```
- That file also has a "Cookies" section (right after line 118) for the login session cookie. Note: the extension calls cross-origin from `chrome-extension://`, so a `Authorization: Bearer <token>` header is simpler than cookies for CORS. Planner decides.
- Every route exports `OPTIONS` for the CORS preflight and wraps the response with the shared CORS headers from `lib/server/http.ts`.
- Add `export const dynamic = 'force-dynamic'` (or equivalent) so GET lists are not cached.

### `web-app/src/lib/server/supabase.ts`, no analog

Put `import 'server-only'` first. Read env vars `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` lazily, and throw a mapped `storage_unavailable` error when either is missing (D-03). Never import this module from client components. Agents must not read `.env*` (D-06).

### `web-app/supabase/migrations/*.sql`, no analog

Plain SQL, no ORM (D-05). Tables: reports (uuid pk `gen_random_uuid()`, `taken_actions text[]` or a join table, state with a CHECK constraint mirroring `types.ts`), `report_history` (append-only, INSERT only, D-10), `report_comments`. Add an index on `(created_at desc, id)` for cursor pagination. Seed data uses fictional `.example` accounts (D-14). **A human applies the migration** (checkpoint, D-06).

## Shared Patterns

### Error envelope
**Source:** `web-app/src/lib/contract/types.ts` lines 145-160 and `.planning/shared/examples/errors.json`
**Apply to:** every route handler, through a single `jsonError(code, status, details?)` helper in `lib/server/http.ts` that looks up its message in `API_ERROR_MESSAGES_PL`.

No write may answer 2xx unless the Supabase insert actually succeeded (widget ERR-01).

### Validation
**Source:** checker helpers `nonBlankString` and `oneOf` (check-contract-examples.mjs lines 61-73), together with `LIMITS`
**Apply to:** POST and transition bodies. Return `validation_error` with `details: FieldError[]`.

### Enums, labels and the transition matrix
**Source:** `types.ts` const-tuple pattern (lines 8-15)
**Apply to:** server validation, the SQL CHECK constraints, the checker and the phase 2 panel. All of them import from one place.

### Auth and visibility (D-14, D-15)
Resolve the actor in `lib/server/auth.ts`. Then:
- A parent sees only reports linked to their own children.
- A teacher sees only reports that were approved at least once and belong to linked parents.
- The comment thread is never returned to an unauthenticated or child context.

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `src/app/api/**/route.ts` | controller | request-response/CRUD | There are no route handlers yet. Use the Next 16 docs in node_modules. |
| `src/lib/server/supabase.ts`, `reports.ts` | service | CRUD | Supabase is not installed. |
| `src/lib/server/auth.ts`, `api/auth/login` | middleware/controller | request-response | There is no auth code yet. |
| `supabase/migrations/*.sql` | migration | n/a | There is no SQL in the repo. |

Reference only, for conventions: `.superseded/01-PATTERNS.md` and `01-0[1-4]-PLAN.md`. Their file lists are not authoritative.

## Metadata

**Analog search scope:** `web-app/src`, `web-app/scripts`, `.planning/shared`, `web-app/node_modules/next/dist/docs`
**Files scanned:** about 10
**Pattern extraction date:** 2026-10-03
