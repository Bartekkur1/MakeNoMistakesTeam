---
phase: 02-panel-opiekuna
reviewed: 2026-10-04T12:00:00Z
depth: standard
files_reviewed: 34
files_reviewed_list:
  - web-app/src/app/_panel/api.ts
  - web-app/src/app/_panel/badges.tsx
  - web-app/src/app/_panel/CommentForm.tsx
  - web-app/src/app/_panel/content.ts
  - web-app/src/app/_panel/detail-state.ts
  - web-app/src/app/_panel/format.ts
  - web-app/src/app/_panel/list-state.ts
  - web-app/src/app/_panel/LoginScreen.tsx
  - web-app/src/app/_panel/PanelShell.tsx
  - web-app/src/app/_panel/ReportActionsCard.tsx
  - web-app/src/app/_panel/ReportCards.tsx
  - web-app/src/app/_panel/ReportDetailView.tsx
  - web-app/src/app/_panel/ReportListView.tsx
  - web-app/src/app/_panel/ReportRow.tsx
  - web-app/src/app/_panel/session.ts
  - web-app/src/app/_panel/styles.ts
  - web-app/src/app/_panel/Timeline.tsx
  - web-app/src/app/_panel/TransitionDialog.tsx
  - web-app/src/app/layout.tsx
  - web-app/src/app/login/page.tsx
  - web-app/src/app/panel/[id]/page.tsx
  - web-app/src/app/panel/layout.tsx
  - web-app/src/app/panel/page.tsx
  - web-app/tests/helpers/panel-fetch.ts
  - web-app/tests/panel/detail-flow.test.ts
  - web-app/tests/panel/detail-state.test.ts
  - web-app/tests/panel/format.test.ts
  - web-app/tests/panel/guardrails.test.ts
  - web-app/tests/panel/list-flow.test.ts
  - web-app/tests/panel/list-state.test.ts
  - web-app/tests/panel/login-flow.test.ts
  - web-app/tests/panel/session.test.ts
  - web-app/tests/panel/timeline.test.ts
  - web-app/tests/panel/transition-flow.test.ts
findings:
  critical: 1
  warning: 8
  info: 7
  total: 16
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-04T12:00:00Z
**Depth:** standard
**Files Reviewed:** 34
**Status:** issues_found

## Summary

Reviewed the whole phase-02 panel as it is on disk (02-01..02-04 in the WIP commit plus the uncommitted 02-05 transition work): the API client, session store, list/detail reducers, login, shell, list, detail, comment form, transition card and dialog, the route pages and the panel tests.

The basics are solid. Untrusted content is only ever rendered as React text, the token only travels in the Authorization header, request ids drop stale responses, and the 401/404 mapping is consistent. The serious problem is a bundle-level leak. `format.ts` imports `@/lib/contract/demo-accounts`, so the client JavaScript that `/login` and `/panel` serve contains every account e-mail (including the smoke accounts), the "(demo)"/"(smoke)" markers and `DEMO_LOGIN_CODE = "0000"`. I confirmed this in the existing production build output. With that, anyone can enumerate the accounts and log in as any parent or teacher, which defeats D-02 and D-06. The guardrail test only checks identifiers in the source, so it passes anyway.

The remaining findings are logic errors in less common paths:
- a failed filter change mixes rows from two filters
- a retried transition whose first attempt actually saved is reported as a conflict, with a false "note not sent" message
- a stale 401 can wipe a newer session
- a successful comment wipes a transition note that was moved into the draft meanwhile
- a login whose session cannot be stored stays stuck on "Logowanie…"
- the modal can close while its request is still in flight
- no request timeout
- the stored session is not fully validated

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: Client bundle ships every demo account e-mail and the login code "0000" (defeats D-02 / D-06)

**File:** `web-app/src/app/_panel/format.ts:5`, `web-app/src/app/_panel/format.ts:132` (also `web-app/tests/panel/guardrails.test.ts:110-111`)
**Issue:** `format.ts` runs on the client. It does `import { DEMO_CHILDREN, findDemoAccountById } from "@/lib/contract/demo-accounts"`, and Turbopack (Next 16) keeps the whole module export object in the client chunk. The existing build artifact `web-app/.next/static/chunks/28voegczmsauj.js` (referenced from `.next/server/app/login.html` and `panel.html`) contains:
- all 7 account e-mails (`rodzic.ola@…`, `rodzic.kuba@…`, `rodzic.zosia@…`, `rodzic.test@…`, `nauczyciel.5a@…`, `nauczyciel.6b@…`, `nauczyciel.test@…`)
- the "(demo)"/"(smoke)" display names
- literally `"DEMO_LOGIN_CODE",0,"0000"`

The chain is: `LoginScreen` imports `PanelShell` (for `SessionLoading`), `PanelShell` imports `format`, and `format` imports `demo-accounts`. So the unauthenticated `/login` page delivers the full account list and the shared code to every visitor. With those, anyone can log in as any parent or teacher and read children's reports and comments.

This breaks D-02 ("brak podpowiedzi o kodzie 0000, brak listy kont demo") and D-06 ("nie zdradzamy, które konta istnieją"). Step 1 deliberately sends nothing to hide unknown e-mails, but that is pointless when the list is in the JS. Guardrail (e) only greps panel *source* for the identifier `DEMO_LOGIN_CODE`, so it gives false assurance. The 02-01 bundle check (T-02-03) only looks for server env var names.

Aggravating, outside this scope: `src/lib/server/validate.ts:60` returns "Podaj kod z wiadomości (w demo: 0000)." to any client that posts a blank code.
**Fix:** Keep `demo-accounts.ts` out of client code. Put a client-safe name map (ids to already-stripped display names, no e-mails, no code) in its own module, or better, get author names from the API or session. Then add a post-build guardrail that fails on bundle content:
```ts
// src/lib/contract/demo-names.ts  (client-safe; no e-mails, no code, no suffixes)
export const DEMO_PERSON_NAMES: Readonly<Record<string, string>> = {
  "00000000-0000-4000-8000-0000000a0001": "Mama Oli",
  // ...
};
export const DEMO_CHILD_NAMES: Readonly<Record<string, string>> = { /* child id -> name */ };

// format.ts
import { DEMO_CHILD_NAMES, DEMO_PERSON_NAMES } from "@/lib/contract/demo-names";

// guardrail (after `next build`)
const chunks = walk(".next/static").filter((p) => p.endsWith(".js")).map((p) => readFileSync(p, "utf8"));
expect(chunks.filter((c) => c.includes("@bezpiecznaaura.example") || c.includes("DEMO_LOGIN_CODE"))).toEqual([]);
```
Also extend guardrail (a) to forbid importing `@/lib/contract/demo-accounts` from `_panel/`, `login/` and `panel/`.

## Warnings

### WR-01: A failed filter change leaves the old filter's rows and cursor under the new filter, so "Pokaż więcej" mixes two filters

**File:** `web-app/src/app/_panel/list-state.ts:67-78`, `web-app/src/app/_panel/list-state.ts:98-105`; `web-app/src/app/_panel/ReportListView.tsx:90`, `web-app/src/app/_panel/ReportListView.tsx:231-241`
**Issue:** `load-start` sets `filter: action.filter` straight away. If the first page then fails while rows are shown, `load-failed` keeps `status: "ready"`, the old `reports` and the old `nextCursor`, but `filter` now holds the new value. The select shows "u nauczyciela" above rows from "Wszystkie stany". "Pokaż więcej zgłoszeń" is still enabled (`busy` is false again). It calls `fetchReports({ cursor: <old filter's cursor>, state: <new filter> })` and appends the new filter's rows to the old filter's rows. That is exactly what the file header says never happens ("rows of two filters never mix"). No test covers a filter change that fails with rows (list-state.test.ts:252 only covers a refresh).
**Fix:** Commit the filter only when its first page arrives. Keep the requested filter separate while it loads:
```ts
// ListState: add requestedFilter: ReportState | null
case "load-start":
  return { ...state, requestId: action.requestId, requestedFilter: action.filter, /* filter unchanged */ ... };
case "load-done":
  return { ...state, filter: state.requestedFilter, reports: action.page.reports, nextCursor: action.page.next_cursor, ... };
case "load-failed":
  return { ...state, requestedFilter: state.filter, pending: null, failure: action.failure, ... };
```
Bind the select to `state.pending === "filter" ? state.requestedFilter : state.filter`. Alternatively, on a failed filter load set `nextCursor: null` and `status: "error"` so stale rows and the cursor cannot be used.

### WR-02: Retrying a transition whose first attempt was actually saved shows a false conflict and "note not sent", which invites a duplicate comment

**File:** `web-app/src/app/_panel/TransitionDialog.tsx:88-99`, `web-app/src/app/_panel/ReportDetailView.tsx:147-151`, `web-app/src/app/_panel/format.ts:240-241`
**Issue:** UI-SPEC (lines 278, 427) treats retry after a network failure as "safe; a duplicate gets 409". The dialog then handles that 409 like any other conflict:
- it closes
- `onConflict(comment)` moves the note into the comment draft
- the banner says "Sprawa zmieniła się w międzyczasie" and "Twoja notatka jest w polu nowego komentarza. Nie została wysłana."

If the first POST committed and only its response was lost, both sentences are false. The report changed because of this user's own action, and the note *was* saved in the history entry. The user is told to send it, and comments are not idempotent, so the same text ends up in the thread twice.
**Fix:** Remember inside the dialog that an attempt went unconfirmed. If a later 409 follows, check the refetched detail before declaring a conflict:
```ts
const [unconfirmed, setUnconfirmed] = useState(false);
// on outcome "alert" from a network / 5xx failure: setUnconfirmed(true)
case "conflict":
  closeDialog();
  onConflict(comment ?? "", { afterUnconfirmedAttempt: unconfirmed, action });
```
Then, in the page's sync `load-done`, if `afterUnconfirmedAttempt` is set and the newest history entry has `actor_id === session.account.id`, `action === attemptedAction` and `comment === sentNote`, dispatch the success state instead of the conflict and do not move the note.

### WR-03: A late 401 for an old token clears the current (newer) session

**File:** `web-app/src/app/_panel/session.ts:98-112`; callers `web-app/src/app/_panel/ReportDetailView.tsx:48-51,131-136`, `web-app/src/app/_panel/ReportListView.tsx:75-77,92-94`, `web-app/src/app/_panel/CommentForm.tsx:63-66`, `web-app/src/app/_panel/TransitionDialog.tsx:104-107`
**Issue:** `clearSession("expired")` always removes the single shared `localStorage` entry, whatever token produced the 401. Only the two initial-load effects check an `ignore` flag. `load()`, `loadMore()`, the comment POST and the transition POST resolve even after their component was unmounted by a session change (both views are keyed by token).

Scenario: tab A's token expires while a refresh, comment or transition is in flight, and the user logs in again in tab B. Tab A remounts with the new token, then the old request returns 401 and wipes the fresh session in every tab. The panel bounces to /login with "Brak ważnego logowania".
**Fix:** Clear only when the stored token is the one that was rejected:
```ts
export function expireSession(token: string): void {
  if (decodeSession(readStoredSession())?.token !== token) return; // a newer login replaced it
  clearSession("expired");
}
// callers: expireSession(session.token) / expireSession(token)
```

### WR-04: A confirmed comment wipes a transition note that was moved into the draft while the comment was sending

**File:** `web-app/src/app/_panel/CommentForm.tsx:56-61`, `web-app/src/app/_panel/ReportDetailView.tsx:147-149`
**Issue:** While a comment POST is pending, the "Zmień stan" buttons stay usable. If the user confirms a transition that gets a 409, `transitionConflict` runs `setDraft(current => mergeDraft(current, note))`. At that point the draft still holds the comment being sent, so it becomes `comment + "\n\n" + note`. The banner promises "Twoja notatka jest w polu nowego komentarza". When the comment then returns 201, `onDraftChange("")` empties the field and the note is lost, even though the page just told the user it was kept.
**Fix:** On success, remove only the text that was sent and keep anything appended later. This needs a functional updater:
```ts
// CommentFormProps.onDraftChange: Dispatch<SetStateAction<string>>
const sent = draft;
postComment(...).then((result) => {
  if (result.ok) {
    onDraftChange((current) => (current === sent ? "" : current.startsWith(sent) ? current.slice(sent.length).replace(/^\s+/, "") : current));
    ...
```
Alternatively, disable the transition buttons while a comment is pending.

### WR-05: Login success that does not produce an authenticated session leaves the form stuck on "Logowanie…"

**File:** `web-app/src/app/_panel/LoginScreen.tsx:102-107`, `web-app/src/app/_panel/session.ts:88-95,147-152`
**Issue:** After a 200, `submitCode` calls `saveSession()` and returns without resetting `pending`. It relies on the snapshot flipping to authenticated. It does not flip in any of these cases:
- `localStorage.setItem` throws (Safari with "Block all cookies", quota, storage disabled). `saveSession` swallows the error.
- The client clock is ahead of the server's by more than the TTL, so `getSnapshot` judges `expires_at` already expired.
- The response fails `decodeSession`, for example an unknown role.

In each case the button stays disabled on "Logowanie…" with no message and no way forward except reloading the page.
**Fix:** Make `saveSession` report whether a live session is now readable. On failure, unlock the form and show an error:
```ts
export function saveSession(response: LoginResponse): boolean {
  try { window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionFromLogin(response))); } catch { /* fallthrough */ }
  emitChange();
  return getSnapshot() !== "";
}
// LoginScreen
if (result.ok) {
  if (saveSession(result.value)) return;
  setPending(false);
  setFormError(LOGIN.storageBlocked); // new copy: e.g. "Przeglądarka blokuje zapis logowania…"
  return;
}
```

### WR-06: The "cannot close while pending" guarantee does not hold; a second Esc closes the dialog and the error is lost

**File:** `web-app/src/app/_panel/TransitionDialog.tsx:126-130`, `web-app/src/app/_panel/TransitionDialog.tsx:108-114`
**Issue:** `onCancel` calls `preventDefault()` while pending. Under the HTML close-request rules (Chrome 120+ CloseWatcher), `cancel` is only cancelable when the page has history-action user activation. Esc is not an activating input, so the first Esc after clicking confirm uses up the activation and the second Esc closes the dialog anyway. The Android back gesture behaves the same way. `onClose` then unmounts the dialog. When the request settles, the "field" and "alert" outcomes call setters on an unmounted component, so the failure ("Nie udało się potwierdzić zmiany…", 503, 403) is shown nowhere. The user sees an unchanged report and no explanation, which contradicts the file header and UI-SPEC line 236.
**Fix:** Keep the result visible even if the dialog closes. Either reopen it while pending:
```tsx
onClose={() => {
  if (pendingRef.current) { dialogRef.current?.showModal(); return; }
  onClose();
}}
```
or move the "alert" outcome to the page (an `onFailed(message)` prop rendered in the actions card) so it survives the dialog closing.

### WR-07: No request timeout; a hung request locks the page behind the modal

**File:** `web-app/src/app/_panel/api.ts:82`
**Issue:** `fetch` has no `signal`. Browsers wait a long time on a stalled connection, for example on mobile hand-over or a proxy. During a transition the dialog is modal, both buttons are disabled and Esc is suppressed, so the page behind it stays inert until the browser gives up, often after minutes. Comment and list loads likewise sit on "Wysyłanie…" or "Wczytywanie…" indefinitely.
**Fix:**
```ts
response = await fetch(path, { method: options.method, headers, body, cache: "no-store", signal: AbortSignal.timeout(20_000) });
```
The existing `catch` already maps the abort to `{ kind: "network" }`, and the network copy for writes already says the result is unconfirmed.

### WR-08: `decodeSession` accepts malformed `children`, which can crash the panel for the rest of the token lifetime

**File:** `web-app/src/app/_panel/session.ts:53-54`
**Issue:** `children` is only checked with `Array.isArray` and then cast to `ChildInfo[]`. A stored entry whose children lack a string `display_name` passes as "authenticated". This can come from a future contract change, an older build's shape, or a tampered or corrupted value. `childName()` (`format.ts:80-81`) then calls `displayName(child.display_name)`, `.replace` on a non-string throws during render, and with no `error.tsx` under `app/panel` the whole panel fails. The entry stays in `localStorage` for up to 12 h, so every reload crashes the same way. The header's logout button is in the same tree, so the user cannot recover.
**Fix:**
```ts
function isChild(value: unknown): value is ChildInfo {
  return isRecord(value) && typeof value.id === "string" && typeof value.display_name === "string"
    && typeof value.parent_id === "string" && typeof value.class_id === "string";
}
if (!isAccount(account) || !Array.isArray(children) || !children.every(isChild)) return null;
```
Consider also adding `app/panel/error.tsx` that offers "Wyloguj się" (clearSession).

## Info

### IN-01: Transition success is announced twice

**File:** `web-app/src/app/_panel/detail-state.ts:135`, `web-app/src/app/_panel/ReportDetailView.tsx:160-162`, `web-app/src/app/_panel/ReportActionsCard.tsx:54-58`
**Issue:** `transition-done` puts "Zapisano. Obecny stan: …" in the page's `role="status"` announcement, and the card renders the same text inside its own `role="status"` box. Screen readers read it twice.
**Fix:** Drop one of the two. For example, leave `announcement` unchanged on `transition-done` and rely on the card's status region.

### IN-02: Focus is lost after a confirmed transition

**File:** `web-app/src/app/_panel/ReportActionsCard.tsx:64-73`
**Issue:** After a 201 the report state changes, so the button that opened the dialog (for example "Zatwierdź zgłoszenie") is no longer rendered. The native focus return then has no target and focus falls to `<body>`. Keyboard users have to tab back from the top of the page. UI-SPEC line 236 asks for focus to return to the trigger.
**Fix:** After `transition-done`, move focus programmatically to the success status box (`tabIndex={-1}`) or to the card heading.

### IN-03: A moved note can push the draft over the comment limit with no client-side block

**File:** `web-app/src/app/_panel/format.ts:266-270`, `web-app/src/app/_panel/CommentForm.tsx:103,109`
**Issue:** `mergeDraft` can produce up to 2000 + 2 + 1000 characters. `maxLength` does not trim programmatic values, so the counter shows something like "3002/2000" and the user only finds out when the server answers with a validation error.
**Fix:** In `submit`, block client-side when `[...body].length > LIMITS.commentMaxChars` and show a field error, and mark the counter when it is over the limit.

### IN-04: A server date that cannot be parsed crashes rendering or breaks the timeline sort

**File:** `web-app/src/app/_panel/format.ts:49-51`, `web-app/src/app/_panel/format.ts:119-121`
**Issue:** `Intl.DateTimeFormat.format(new Date("bad"))` throws `RangeError`, and `Date.parse` returning NaN makes the `sort` comparator inconsistent. The server is trusted, so this is defensive only.
**Fix:** Guard with `Number.isNaN(date.getTime())` and fall back to the raw string. In the comparator, treat NaN as 0.

### IN-05: Client counts characters differently from the server

**File:** `web-app/src/app/_panel/format.ts:71-75`, `web-app/src/app/_panel/CommentForm.tsx:109`, `web-app/src/app/_panel/TransitionDialog.tsx:156`
**Issue:** `excerpt` slices by UTF-16 units and can split a surrogate pair, leaving a lone surrogate before "…". The counters use `.length` (UTF-16), but the server's `charLength` counts code points (`[...value].length`). Text with emoji shows a higher count and hits `maxLength` earlier than the server limit.
**Fix:** Use `[...text]` (code points) for `excerpt` slicing and for the counters.

### IN-06: `load-not-found` from a write reuses the current request id

**File:** `web-app/src/app/_panel/ReportDetailView.tsx:244`, `web-app/src/app/_panel/ReportDetailView.tsx:254`
**Issue:** `onNotFound` dispatches with `requestId: lastRequestId.current`. If a refresh or sync with that id is still in flight and comes back 200, `load-done` replaces the not-found view with the report again.
**Fix:** Bump `lastRequestId.current += 1` before dispatching `load-not-found`, so every earlier response is discarded.

### IN-07: The interactive wiring has no tests

**File:** `web-app/tests/panel/*.test.ts` (vitest `environment: "node"`, `renderToStaticMarkup` only)
**Issue:** The reducers and helpers are well covered. The component handlers are not exercised at all:
- `ReportDetailView.load/transitionDone/transitionConflict`
- `CommentForm.submit`
- `TransitionDialog.confirm`, close and cancel
- `ReportListView.loadMore`, `changeFilter` and the focus move
- `LoginScreen.submitCode`

WR-01, WR-04, WR-05 and WR-06 all live in that untested layer.
**Fix:** Add a small jsdom/happy-dom suite (`// @vitest-environment jsdom` per file) with @testing-library/react for the dialog and the comment, conflict and filter flows.

---

_Reviewed: 2026-10-04T12:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
