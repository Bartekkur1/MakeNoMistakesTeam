---
phase: 02-panel-opiekuna
fixed_at: 2026-10-04T01:30:00Z
review_path: .planning/workstreams/web-app/phases/02-panel-opiekuna/02-REVIEW.md
iteration: 1
findings_in_scope: 9
fixed: 9
skipped: 0
status: all_fixed
---

# Phase 02: Code Review Fix Report

**Fixed at:** 2026-10-04T01:30:00Z
**Source review:** .planning/workstreams/web-app/phases/02-panel-opiekuna/02-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 9 (CR-01, WR-01..WR-08; Info findings out of scope)
- Fixed: 9
- Skipped: 0

**Commits:** none. The user has not authorized git writes, so every fix is uncommitted in the working tree. No worktree was created, nothing was staged, and there was no git rollback. Several of the touched files already had uncommitted 02-05 changes, and the fixes sit on top of them in the same working tree.

**Method:** test first wherever the logic could be reached without a DOM. The vitest environment is `node` and there is no jsdom or testing-library, and no packages were installed. Each such test was run and seen failing before the fix. WR-06 lives only in a native `<dialog>` event handler, so it has no automated test.

## Fixed Issues

### CR-01: Client bundle ships every demo account e-mail and the login code "0000"

**Files modified:** `web-app/src/app/_panel/names.ts` (new), `web-app/src/app/_panel/format.ts`, `web-app/src/app/_landing/links.ts` (new), `web-app/src/app/_landing/content.ts`, `web-app/src/app/_panel/PanelShell.tsx`, `web-app/src/app/_panel/content.ts` (comment only), `web-app/tests/panel/guardrails.test.ts`, `web-app/tests/panel/bundle.test.ts` (new), `web-app/tests/panel/format.test.ts`
**Commit:** uncommitted (no git authorization)
**Applied fix:**
- The new client-safe `_panel/names.ts` maps ids to names only (`PERSON_NAMES`, `CHILD_NAMES`). The names already have the suffix removed, and the module holds no e-mails and no code. `format.ts` (`childName`, `actorName`) now reads from it and no longer imports `@/lib/contract/demo-accounts`. The lookup uses a `Map`, so ids like `constructor` or `__proto__` cannot resolve to inherited properties.
- **There was a second leak path the review missed.** `PanelShell.tsx` imported `LOGIN_HREF` from `@/app/_landing/content`, and that module imports and re-exports `DEMO_ACCOUNTS` and `DEMO_LOGIN_CODE`. So `/login` and `/panel` would have leaked even after the `format.ts` fix. `LOGIN_HREF` now lives in a new import-free `_landing/links.ts`. `_landing/content.ts` re-exports it, so landing imports are unchanged, and `PanelShell` imports it from `links`.
- Guardrails (`guardrails.test.ts`):
  - (a) now forbids direct imports of `contract/demo-accounts` and `_landing/content` from `_panel/`, `login/` and `panel/`.
  - A new transitive check follows every runtime import chain (`@/`, relative, type-only imports skipped) from each panel file. It fails with the full chain when either module is reachable. Before the fix it reported 17 chains, including `PanelShell.tsx -> _landing/content.ts`.
- Post-build check (`tests/panel/bundle.test.ts`): scans every `.js` under `.next/static` for `@bezpiecznaaura.example`, `DEMO_LOGIN_CODE`, `(demo)` and `(smoke)`. It reports only file path and marker name, never the matched text. It is skipped when `.next/static` is absent. It checks whatever build exists, so rebuild before trusting it. It failed against the old build artifact (one chunk, all four markers) and passes after the rebuild.
- `format.test.ts` asserts that the name map exactly equals the demo accounts and children with the suffix removed, so the two cannot drift.

**Out of scope, for the contract owner:** `web-app/src/lib/server/validate.ts:60` still returns "Podaj kod z wiadomości (w demo: 0000)." to any client that posts a blank code. This is a server message owned by the published contract and was deliberately not changed. The panel never shows it (login 400s use the panel's own copy).

### WR-01: A failed filter change mixes rows from two filters

**Files modified:** `web-app/src/app/_panel/list-state.ts`, `web-app/tests/panel/list-state.test.ts`
**Commit:** uncommitted (no git authorization)
**Status:** fixed: requires human verification (logic)
**Applied fix:** this uses the review's second option. When a load with `pending === "filter"` fails, `load-failed` now drops the previous filter's rows and `nextCursor` and goes to `status: "error"`. The select keeps the new filter, "Pokaż więcej zgłoszeń" disappears, and "Spróbuj ponownie" retries the chosen filter. Failed refreshes and retries keep their rows as before. This option was chosen over the `requestedFilter` one because it keeps every existing reducer test and the select binding unchanged. New test: a failed filter change leaves no rows, no cursor, status error and the new filter.

### WR-02: A retried transition whose first attempt was saved shows a false conflict and "note not sent"

**Files modified:** `web-app/src/app/_panel/format.ts`, `web-app/src/app/_panel/detail-state.ts`, `web-app/src/app/_panel/TransitionDialog.tsx`, `web-app/src/app/_panel/ReportActionsCard.tsx`, `web-app/src/app/_panel/ReportDetailView.tsx`, `web-app/tests/panel/transition-flow.test.ts`, `web-app/tests/panel/detail-state.test.ts`
**Commit:** uncommitted (no git authorization)
**Status:** fixed: requires human verification (logic)
**Applied fix:**
- `isUnconfirmedFailure(result)` is true for network or timeout failures, any 5xx and `internal_error`, which are the cases where the server may have saved the change. The dialog records the sent note (trimmed or null) of each such attempt.
- On a later 409 the dialog passes `{ action, fromState, comments }` to `onConflict(note, attempt)`. The parameter is `null` when there were no unconfirmed attempts, and then behavior is unchanged.
- The page takes the history ids it knew before the attempt and refetches before showing anything. `retriedConflict(detail, knownIds, attempt, accountId)` looks for a new history entry by this account with the same action, the same `from_state` and one of the sent notes. The match is checked against new entries only, so an older identical action cannot match.
  - Entry found and still newest (report state equals its `to_state`): new reducer action `transition-confirmed` shows "Zapisano. Obecny stan: …". There is no conflict banner and the note is not moved.
  - Entry found but the other party has since moved the report on: the conflict banner shows without the "note not sent" line.
  - No entry found: the usual D-15 conflict.
- If the user typed a different note for the retry, that note really was not sent, so it is still moved into the comment draft.
- Tests use the real routes on the fake Supabase: a saved first attempt is recognized, a different note or another account counts as a conflict, and a saved attempt later closed by the teacher gives `saved-then-changed`. Plus `isUnconfirmedFailure` cases and the new reducer action.

### WR-03: A late 401 for an old token clears the newer session

**Files modified:** `web-app/src/app/_panel/session.ts`, `web-app/src/app/_panel/ReportDetailView.tsx`, `web-app/src/app/_panel/ReportListView.tsx`, `web-app/src/app/_panel/CommentForm.tsx`, `web-app/src/app/_panel/TransitionDialog.tsx`, `web-app/src/app/_panel/PanelShell.tsx` (comment), `web-app/tests/panel/session.test.ts`
**Commit:** uncommitted (no git authorization)
**Status:** fixed: requires human verification (logic)
**Applied fix:** the new `expireSession(token)` clears the session with the "expired" notice only while that token is still the stored one. All six API 401 handlers now call it with the token that made the request: detail `settleLoad`, which now takes the token, the three list handlers, the comment POST and the transition POST. `PanelShell`'s own check for a locally expired entry still uses `clearSession("expired")`. Tests: a 401 for the stored token clears it and sets the notice. A 401 for an older token leaves the stored session and sets no notice.

### WR-04: A confirmed comment wipes a transition note moved into the draft meanwhile

**Files modified:** `web-app/src/app/_panel/format.ts`, `web-app/src/app/_panel/CommentForm.tsx`, `web-app/tests/panel/transition-flow.test.ts`
**Commit:** uncommitted (no git authorization)
**Status:** fixed: requires human verification (logic)
**Applied fix:**
- New pure helper `draftAfterSent(current, sent)`. If the field still equals what was sent, it is cleared. If it starts with what was sent, only the leftover is kept, with leading whitespace removed. Otherwise the field is left alone.
- `CommentForm` records the field as submitted and on 201 calls `onDraftChange((current) => draftAfterSent(current, sent))`. `onDraftChange` is now typed `Dispatch<SetStateAction<string>>`. The page already passes `setDraft`.
- Test: a note merged in with `mergeDraft` survives a confirmed comment.

### WR-05: A login that does not produce a live session stays stuck on "Logowanie…"

**Files modified:** `web-app/src/app/_panel/session.ts`, `web-app/src/app/_panel/LoginScreen.tsx`, `web-app/src/app/_panel/content.ts`, `web-app/tests/panel/session.test.ts`
**Commit:** uncommitted (no git authorization)
**Status:** fixed: requires human verification (logic, new copy)
**Applied fix:**
- `saveSession` now returns whether a live session is readable afterwards. It returns false when `setItem` throws, when the response fails `decodeSession` (for example an unknown role) and when the device clock already counts it as expired. In the last two cases the unusable entry is removed again.
- On false, `LoginScreen` unlocks the form and shows a new `LOGIN.sessionNotSaved` line in the existing error alert.
- **New user-facing copy (not in UI-SPEC, please confirm):** "Nie udało się zapisać logowania w tej przeglądarce. Zezwól stronie na zapisywanie danych, sprawdź datę w urządzeniu i spróbuj ponownie." It follows the `content.ts` style and passes the panel copy guardrail (no em dash, no " - ", no presentation marking).
- Tests: true for a normal login, false for an unknown role, false for an expired `expires_at` (with no entry left behind) and false for blocked storage.

### WR-06: A second Esc closes the dialog while pending and the error is lost

**Files modified:** `web-app/src/app/_panel/TransitionDialog.tsx`
**Commit:** uncommitted (no git authorization)
**Status:** fixed: requires human verification (browser-only behavior, no automated test)
**Applied fix:**
- A `pendingRef` mirrors the request state.
- `onClose` reopens the dialog with `showModal()` when the browser closed it while a request is running, so the parent's `onClose` is not called and the dialog stays mounted to show the outcome. This covers a repeated Esc or the Android back gesture, where the cancel event may not be cancelable.
- `onCancel` also reads the ref.
- The ref is reset before the outcome is handled, so the dialog's own `close()` on 201, 409 and 404 still unmounts it normally.
- No DOM test is possible in this repo without new dev dependencies (see IN-07). Manual check: Chrome, open a transition, throttle the network to offline or slow, confirm, then press Esc twice. The dialog must stay or reappear and show the outcome.

### WR-07: No request timeout

**Files modified:** `web-app/src/app/_panel/api.ts`, `web-app/tests/panel/session.test.ts`
**Commit:** uncommitted (no git authorization)
**Applied fix:**
- `apiCall` passes `signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)` (20 000 ms, exported). In a browser without `AbortSignal.timeout` it passes no signal and the request simply has no timeout.
- The existing `catch` maps the abort to `{ kind: "network" }`. For writes that is also an unconfirmed failure for WR-02.
- Test: every request carries an `AbortSignal`, and a `TimeoutError` maps to a network failure.

### WR-08: `decodeSession` accepts malformed `children`

**Files modified:** `web-app/src/app/_panel/session.ts`, `web-app/tests/panel/session.test.ts`
**Commit:** uncommitted (no git authorization)
**Applied fix:**
- New `isChild` guard: `id`, `display_name`, `parent_id` and `class_id` must all be strings. `decodeSession` requires `children.every(isChild)`, which also removes the `as ChildInfo[]` cast.
- Test: a non-string `display_name`, a partial child, a `null` entry and a string entry are all rejected. An empty array is accepted.
- The optional `app/panel/error.tsx` the review suggests was not added: it would need new copy and a new route file, and it is not needed once the decode guard is in place.

## Verification

All commands ran in the main checkout (`/Users/bartlomiej/Documents/Projects/MakeNoMistakesTeam`). No worktree was used, so the results can be reproduced from this tree.

| Command | Result |
|---------|--------|
| `npm --prefix web-app test` | exit 0: 28 files, 502 tests passed. It was run once before the final build and again after it, so `bundle.test.ts` checked the fresh `.next/static` and passed. |
| `npm --prefix web-app run build` | exit 0. The only warning is the existing one: no font override values for "Atkinson Hyperlegible Next". |
| `npm --prefix web-app run typecheck` | exit 0 |
| `npm --prefix web-app run lint` | exit 0 |
| `grep -l DEMO_LOGIN_CODE web-app/.next/static/chunks/*.js` | 0 files (11 chunks scanned) |
| grep for `bezpiecznaaura.example` in `web-app/.next/static` (recursive) | 0 files |
| grep for `(demo)` / `(smoke)` in `web-app/.next/static` | 0 files |
| Same domain/code check on `.next/server/app/{login,panel}.{html,rsc}` | 0 matches |

Before the fix, the old build artifact had 1 chunk with each of the four markers.

No Supabase calls were made and no `.env*` file was read. `next build` loads `.env.local` on its own, which is framework behavior.

---

_Fixed: 2026-10-04T01:30:00Z_
_Fixer: Claude (gsd-code-fixer)_
_Iteration: 1_
