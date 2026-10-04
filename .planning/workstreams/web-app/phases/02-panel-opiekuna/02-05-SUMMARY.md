---
phase: 02-panel-opiekuna
plan: 05
subsystem: ui
tags: [nextjs, react, useReducer, native-dialog, tailwind, transitions, workflow, vitest, tdd]

# Dependency graph
requires:
  - phase: 02-panel-opiekuna (plan 04)
    provides: "detailReducer with requestId guard, ReportDetailView grid with a free right column, lifted comment draft, settleLoad, CommentForm"
  - phase: 02-panel-opiekuna (plan 01)
    provides: "apiCall/errorMessage/isUnauthorized, clearSession, guardrail test, panel-fetch helper"
  - phase: 01-kontrakt-i-backend-spraw
    provides: "POST /api/reports/{id}/transitions (201 TransitionResponse, 400/403/404/409), TRANSITIONS matrix, availableActions(), TRANSITION_COMMENT_REQUIRED, demo dataset R1..R6"
provides:
  - "ReportActionsCard.tsx: the 'Zmień stan' card with only the actions availableActions(state, role) allows, approve/close filled and first, the no-actions text and the 'Zapisano. Obecny stan: …' slot"
  - "TransitionDialog.tsx: native modal <dialog> with the action-specific consequence, a {n}/1000 note, 'Zostaw bez zmian', the confirm, the pending lock (Esc blocked) and every result path"
  - "api.ts postTransition(); format.ts isPrimaryAction(), orderedActions(), actionButtonLabel(), dialogCopy(), transitionOutcome(), missingRequiredNote(), transitionComment(), mergeDraft(); content.ts ACTIONS_CARD, DIALOG"
  - "detail-state.ts: reason 'sync', fields success and conflict, actions transition-done and conflict"
  - "ReportDetailView.tsx: change-state card between the taken-actions card and the timeline, the D-15 conflict banner, the unsent note moved into the comment draft"
affects: [phase 02 verification (end-of-phase human check: dialog focus/Esc, two-window demo, 375px/320px layout)]

# Actuals (#2632)
actuals:
  tokens: 12000
  tasks: 2
  commits: 0
plan_head_before: a5f4f15
plan_head_after: a5f4f15

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "The dialog's result handling is a pure mapper (transitionOutcome) from ApiResult to done | expired | conflict | not-found | field | alert, so 'only a 201 is done' is unit-tested without a DOM"
    - "A quiet 'sync' load reason: after a transition the detail refetches without clearing the saved confirmation, the conflict banner or the announcement and without touching 'Odświeżono HH:MM'"
    - "Native <dialog> opened with showModal() from a mount effect through a ref (guarded by dialog.open for StrictMode); the card unmounts it from the dialog's close event"
    - "An always-mounted role=status wrapper for the conflict banner, so its insertion is announced"

key-files:
  created:
    - web-app/src/app/_panel/ReportActionsCard.tsx
    - web-app/src/app/_panel/TransitionDialog.tsx
    - web-app/tests/panel/transition-flow.test.ts
  modified:
    - web-app/src/app/_panel/api.ts
    - web-app/src/app/_panel/format.ts
    - web-app/src/app/_panel/content.ts
    - web-app/src/app/_panel/detail-state.ts
    - web-app/src/app/_panel/ReportDetailView.tsx
    - web-app/tests/panel/detail-state.test.ts

key-decisions:
  - "The dialog maps every response through the pure transitionOutcome(); only an ok result is 'done', so no failure can reach the saved confirmation (prohibition P2, T-02-16)"
  - "A 'sync' load keeps success, conflict and the announcement; 'refresh' and 'retry' clear success and conflict"
  - "transition-done merges response.report into the shown detail, appends response.entry once (by id), keeps comments, and is ignored for another report id"
  - "The textarea is focused explicitly after showModal() in the mount effect instead of relying on React autoFocus, which runs before the dialog is open"
  - "The conflict banner sits in an always-mounted role=status wrapper between the back link and the h1, so screen readers hear it when it appears"

patterns-established:
  - "Detail reducer actions now: load-start/load-done/load-failed/load-not-found (initial|retry|refresh|sync), comment-start/comment-added, transition-done, conflict"

requirements-completed: [PAN-03]

coverage:
  - id: D1
    description: "Tracer: P1 postTransition(R1, approve, null) sends POST /api/reports/{R1}/transitions with exactly {\"action\":\"approve\",\"comment\":null} and the Bearer header, gets 201 with state with_teacher and an approve entry from pending_parent; T1 then lists [R4, R2, R1], R1's history ends with that entry, and the teacher gets close and escalate; before approval R1 is not in T1's list"
    requirement: "PAN-03"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/transition-flow.test.ts#panel transitions"
        status: pass
    human_judgment: false
  - id: D2
    description: "Action helpers: orderedActions for the seven state/role pairs, isPrimaryAction, the five button labels, the reject and reopen consequence by current state, and the note label/required flag (only escalate)"
    requirement: "PAN-03"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/transition-flow.test.ts#action helpers"
        status: pass
    human_judgment: false
  - id: D3
    description: "Zmień stan card and dialog markup: 'Obecny stan:' with the badge, approve filled before the outlined reject, teacher close before escalate, the no-actions text without any button, 'Zapisano. Obecny stan: u nauczyciela.' only with success set; the approve dialog with title, consequence, 'Komentarz (opcjonalnie)', 0/1000, maxLength=1000, 'Zostaw bez zmian' and the confirm; the escalate dialog with the required label and no error at start"
    requirement: "PAN-03"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/transition-flow.test.ts#Zmień stan card"
        status: pass
      - kind: unit
        ref: "web-app/tests/panel/transition-flow.test.ts#transition dialog"
        status: pass
      - kind: unit
        ref: "web-app/tests/panel/transition-flow.test.ts#escalation dialog"
        status: pass
    human_judgment: false
  - id: D4
    description: "Escalation, conflict and failures end to end: escalate without a note gives validation_error on field comment, with 'CERT Polska (NASK)' gives 201 escalated and P2 sees the note; a repeated approve gives 409 (outcome conflict); T1 approve gives 403 with the contract text; after P2 rejects R4, T1 close and T1 detail give 404 (outcome not-found); a dropped connection gives kind network and 'Nie udało się potwierdzić zmiany. Spróbuj ponownie.'"
    requirement: "PAN-03"
    verification:
      - kind: integration
        ref: "web-app/tests/panel/transition-flow.test.ts#panel transitions: escalation, conflicts and failures"
        status: pass
    human_judgment: false
  - id: D5
    description: "Dialog rules and prohibition P2: only the 201 maps to done (503, 500, 403 and network never do), 401 is expiry, a comment-field 400 goes under the note and other details to the alert, the blank escalation note is blocked, the note is sent trimmed or null, mergeDraft keeps both texts"
    requirement: "PAN-03"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/transition-flow.test.ts#transitionOutcome"
        status: pass
      - kind: unit
        ref: "web-app/tests/panel/transition-flow.test.ts#dialog rules"
        status: pass
    human_judgment: false
  - id: D6
    description: "detailReducer: transition-done (state, updated_at, entry once, comments kept, success, announcement), ignored without a report, sync keeps success/announcement/refreshedAt, refresh and retry clear success, conflict sets the banner and clears success, sync keeps it, refresh clears it, a later transition clears it"
    verification:
      - kind: unit
        ref: "web-app/tests/panel/detail-state.test.ts#detailReducer: transitions"
        status: pass
      - kind: unit
        ref: "web-app/tests/panel/detail-state.test.ts#detailReducer: conflicts (D-15)"
        status: pass
    human_judgment: false
  - id: D7
    description: "Full suite (including the guardrails scanning the two new files), build, typecheck and lint green; no server secrets in .next/static; package files unchanged"
    verification:
      - kind: other
        ref: "npm --prefix web-app test && run build && run typecheck && run lint"
        status: pass
    human_judgment: false
  - id: D8
    description: "Two browsers or profiles (rodzic.ola / nauczyciel.5a): Esc and 'Zostaw bez zmian' change nothing and return focus, approve then the teacher sees it after 'Odśwież listę', the empty escalation note error, the parent sees 'eskalowane' and the note, the stale click shows the D-15 banner with the note moved, and the list, detail and dialog fit 375px and 320px"
    requirement: "PAN-03"
    verification: []
    human_judgment: true
    rationale: "Modal focus, Esc handling, two independent sessions and responsive layout need real browsers; vitest runs without a DOM (Task 2 human-check, the two UI-SPEC backstops)"

# Metrics
duration: 9min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 05: "Zmień stan" Card and Transition Dialog Summary

**The state-change half of the guardian's reply is in place:**
- **"Zmień stan" card:** shows the current state and only the actions `availableActions(state, role)` allows. Approve and close are filled and come first; with no action available the card shows the no-actions text and no buttons.
- **Confirmation dialog (D-12):** a native modal dialog with the action's consequence and a note field. Escalation requires the note.
- **Saving:** while saving, the dialog cannot be closed. The new state shows only after the server's 201, followed by a quiet refetch.
- **Concurrent change (D-15):** a 409 closes the dialog, shows the warning banner, refetches, and moves a typed note unsent into the comment field.
- **404:** shows the not-found view.
- **Other failures:** keep the dialog open with the note and an error.

Changes are uncommitted because this run had no git authorization.

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-03T22:54:37Z
- **Completed:** 2026-10-03T23:03:30Z
- **Tasks:** 2 of 2
- **Files modified:** 9 (3 created, 6 modified)

## Accomplishments

- **Tracer proven end to end:** P1's approve goes button → TransitionDialog → `postTransition` → real transitions route → `transition-done` → "sync" refetch. Then T1's list contains R1, R1's history ends with the approve entry, and the teacher gets "Zamknij zgłoszenie" and "Eskaluj zgłoszenie".
- **Card (D-12):** `section` with h2 "Zmień stan", "Obecny stan:" + StateBadge, and the success slot (alertSuccess, role="status"). Buttons are `w-full buttonLarge`, `panelPrimaryButton` for approve/close and `secondaryButton` for the rest. On `lg` it sits in the right column (`lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start lg:sticky lg:top-24`). The DOM and mobile order is content, taken actions, change state, timeline.
- **Dialog:**
  - Native `<dialog>` with the UI-SPEC classes and `aria-labelledby`. `showModal()` runs in a mount effect, then the note textarea gets focus.
  - The note has `maxLength` 1000 and a `{n}/1000` counter. The button row stacks "Zostaw bez zmian" below the confirm on mobile and puts them side by side on `sm`.
  - A blank escalation note shows "Wpisz, do kogo eskalowano zgłoszenie." under the field (aria-invalid, aria-describedby) and refocuses the field, with no request. The confirm is never disabled up front.
  - While pending, the confirm reads "Zapisywanie…" with aria-busy, both buttons are disabled, the textarea is read-only, and `onCancel` calls `preventDefault`.
  - Each result has its own path:
    - 201: close, then `onDone`.
    - 409: close, then `onConflict(trimmed note)`.
    - 404: close, then `onNotFound`.
    - 401: `clearSession("expired")`.
    - 400 with a comment detail: the message goes under the field.
    - 403, 503, 500, network, or other details: shown in the alert.
  - The note always stays and nothing is resent.
- **Detail page:**
  - `transitionDone` dispatches `transition-done`, then `load("sync")`.
  - `transitionConflict` moves a non-blank note with `mergeDraft`, dispatches `conflict`, then `load("sync")`.
  - The conflict banner (alertWarning, plus "Twoja notatka jest w polu nowego komentarza. Nie została wysłana." when a note moved) sits between the back link and the h1.
  - A sync that answers 404 shows the not-found view. Other failures show the existing refresh-failure alert.

## Task Commits

1. **Task 1: Tracer - a parent approves a report in the dialog and the teacher sees it**: uncommitted (TDD: RED then GREEN, no commits)
2. **Task 2: Escalation note, concurrent change (409) and every failure path of the dialog**: uncommitted (TDD: RED then GREEN, no commits)

**Plan metadata:** uncommitted

Commits: none. Changes were left uncommitted because this run had no git authorization. (HEAD stayed at a5f4f15 before and after.)

## TDD Gate Compliance

- **Task 1 RED:**
  - Tests came first: transition-flow.test.ts (helpers, end to end, outcome, card, dialog) plus 6 new detail-state cases.
  - Then signature-only stubs: `postTransition` returning a network failure, the format helpers returning empty values, `ReportActionsCard`/`TransitionDialog` returning null, and `transition-done` returning the state. ACTIONS_CARD/DIALOG copy was added as data.
  - Result: 16 of 38 failed on assertions.
  - `check tdd-red-evidence` gave **RED_EVIDENCE_OK** for the tracer test "a parent approves R1 and the teacher then sees it…" and for "transition-done shows the new state…".
  - **GREEN:** 38/38.
- **Task 2 RED:**
  - New cases first (escalation, 409, 403, 404 after lost access, network, dialog rules, mergeDraft, conflict reducer).
  - Then stubs: `mergeDraft`/`transitionComment`/the note check, and `conflict` as a no-op.
  - Result: 8 of 52 failed on assertions.
  - **RED_EVIDENCE_OK** for the 409 test, the conflict reducer test and the mergeDraft test.
  - **GREEN:** 53/53, including the escalation dialog render test added with the GREEN.
- **The vitest TAP format has no summary lines.** Before running the checker, `# tests/# pass/# fail` lines counted from the TAP `ok`/`not ok` lines were appended to the persisted record.
- **Tests that passed in RED**, each for a stated reason:
  - **Absence tests:** teacher does not see R1 before approval; never "done" for a failure; ignore a transition without a report; refresh/retry clear success; refresh clears the conflict; a later transition clears the conflict.
  - **Behavior already delivered by Task 1** as the plan orders it: the 403, network and 503 alerts, and the server-side escalation rule from phase 1.
- **Mutation probes:** 5 mutations each failed exactly their target tests:
  - Network mapped to done.
  - Refresh keeping success.
  - transition-done without the null-report guard.
  - transition-done keeping the conflict.
  - Refresh keeping the conflict.

  format.ts and detail-state.ts were restored byte for byte (cmp).

## Verification Results (exact)

| Command | Result |
|---|---|
| `npm --prefix web-app test -- tests/panel/transition-flow.test.ts tests/panel/detail-state.test.ts` (Task 1) | exit 0, 2 files, 38 passed |
| `npm --prefix web-app test && run build && run typecheck && run lint` (Task 1) | exit 0; 27 files, 470 passed; build lists `ƒ /panel/[id]` and `ƒ /api/reports/[id]/transitions` |
| Tracer feedback gate (interactive, end-of-phase, automated-only verify) | verify re-run green; expanded to Task 2 |
| `npm --prefix web-app test -- tests/panel/transition-flow.test.ts tests/panel/detail-state.test.ts` (Task 2) | exit 0, 2 files, 53 passed |
| `npm --prefix web-app test` (final) | exit 0; 27 files, **485 passed** (449 before this plan + 36 new: 26 in transition-flow, 10 in detail-state) |
| `npm --prefix web-app run build` / `typecheck` / `lint` (final) | exit 0 / 0 / 0; lint clean |
| `test -d web-app/.next/static && ! grep -rqE 'SUPABASE_SERVICE_ROLE_KEY\|DEMO_AUTH_SECRET' web-app/.next/static` | exit 0 |
| `shasum -c` on web-app/package.json and package-lock.json (taken before any edit) | both OK (unchanged) |
| Acceptance greps | ReportActionsCard has `availableActions(` imported from "@/lib/contract/workflow"; TransitionDialog has `showModal`, `postTransition(`, `preventDefault`, `DIALOG.escalateEmpty`, `DIALOG.networkError`; ReportDetailView renders ReportActionsCard after TakenActionsCard and before TimelineCard and references `ACTIONS_CARD.conflict`, `ACTIONS_CARD.conflictNoteMoved`, `mergeDraft(`: all PASS |

## Files Created/Modified

- `web-app/src/app/_panel/ReportActionsCard.tsx` (new, "use client"): `ReportActionsCard`. It holds the open action in local state and renders `TransitionDialog`.
- `web-app/src/app/_panel/TransitionDialog.tsx` (new, "use client"): `TransitionDialog`.
- `web-app/src/app/_panel/api.ts`: `postTransition(token, id, action, comment)`.
- `web-app/src/app/_panel/format.ts`: `isPrimaryAction`, `orderedActions`, `actionButtonLabel`, `DialogCopy`/`dialogCopy`, `TransitionOutcome`/`transitionOutcome`, `missingRequiredNote`, `transitionComment`, `mergeDraft`.
- `web-app/src/app/_panel/content.ts`: `ACTIONS_CARD`, `DIALOG` (UI-SPEC copy verbatim).
- `web-app/src/app/_panel/detail-state.ts`: reason "sync", `success`, `conflict`, `transition-done`, `conflict`.
- `web-app/src/app/_panel/ReportDetailView.tsx`: the card in the grid, the conflict banner, `transitionDone`/`transitionConflict`.
- `web-app/tests/panel/transition-flow.test.ts` (new): 26 tests.
- `web-app/tests/panel/detail-state.test.ts`: +10 reducer tests (27 total).

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Result handling extracted into a pure, tested mapper**
- **Found during:** Task 1
- **Issue:** The tests run without a DOM, so the dialog's own click handler cannot be exercised. Without another test, nothing would show that prohibition P2 (no saved confirmation before a 2xx) holds in the dialog.
- **Fix:** `transitionOutcome(result, networkMessage)` in format.ts decides done/expired/conflict/not-found/field/alert. The dialog only switches on it. The tests prove that only an ok result is "done".
- **Files modified:** format.ts, TransitionDialog.tsx
- **Committed in:** uncommitted

**2. [Rule 2 - Missing critical] The "sync" refetch keeps the success announcement**
- **Found during:** Task 1
- **Issue:** The plan dispatches `transition-done` and then a "sync" `load-start`. The existing `load-start` clears the announcement. React batches both dispatches, so "Zapisano. Obecny stan: …" would never reach the live region.
- **Fix:** `load-start` and `load-done` with reason "sync" keep the announcement, as the plan's "quiet refetch: no announcement" requires: the sync adds none of its own and does not erase the one just made.
- **Files modified:** detail-state.ts
- **Verification:** "a sync refetch keeps the saved state, the announcement and the refresh time" (RED then GREEN).
- **Committed in:** uncommitted

**3. [Rule 1 - Bug] Initial focus set after showModal() rather than through autoFocus**
- **Found during:** Task 1
- **Issue:** React's `autoFocus` focuses during commit, before the mount effect calls `showModal()`. At that point the textarea sits in a closed dialog and cannot take focus.
- **Fix:** The mount effect calls `textareaRef.current?.focus()` right after `showModal()`. The effect is guarded by `dialog.open` for the StrictMode double run.
- **Files modified:** TransitionDialog.tsx
- **Committed in:** uncommitted

**4. [Rule 2 - Missing critical] The conflict banner's status region is always mounted**
- **Found during:** Task 2
- **Issue:** The plan clears the page announcement on `conflict`, so the banner (role="status") is the only cue. A status region inserted together with its text is often not announced.
- **Fix:** An empty `<div role="status">` is always rendered between the back link and the h1, and the alertWarning is inserted into it.
- **Files modified:** ReportDetailView.tsx
- **Committed in:** uncommitted

**5. [Naming] The escalation check is a predicate**
- **Found during:** Task 2
- **Issue:** The plan has the dialog itself show `DIALOG.escalateEmpty` (acceptance grep).
- **Fix:** The pure check is `missingRequiredNote(action, note): boolean`, and the dialog shows `DIALOG.escalateEmpty`. Likewise, the dialog passes `DIALOG.networkError` to `transitionOutcome`. No behavior change.
- **Committed in:** uncommitted

---

**Total deviations:** 4 auto-fixed (3 missing critical, 1 bug) plus 1 naming choice.
**Impact on plan:** None changes the planned copy, props or exports. They make prohibition P2 testable and keep both the success and conflict messages audible to screen readers. No scope creep.

## Issues Encountered

- **Build warning:** the build still prints `Failed to find font override values for font Atkinson Hyperlegible Next`. It predates this plan and is out of scope.
- **RED-evidence format:** vitest's TAP reporter has no summary lines. I added counts derived from the TAP to the evidence record (see TDD Gate Compliance).

## Known Stubs

None. All RED stubs were replaced. A grep for "RED stub", TODO and FIXME in src/app/_panel finds nothing.

## Threat Flags

None. There is no new surface beyond the plan's threat model:
- **T-02-15:** buttons come only from `availableActions()`, and the 403 path shows the contract text.
- **T-02-16:** success is set only by `transition-done` after a 201, and the dialog cannot close while pending.
- **T-02-17:** a 409 closes the dialog, shows the banner, refetches and moves the note unsent.
- **Escaping:** the escalation note is rendered as React text only, through the existing Timeline.

## User Setup Required

None.

## Human Check (end of phase, pending)

This is Task 2's `<human-check>`, for the end-of-phase UAT. Use two separate browsers or browser profiles: window A as rodzic.ola@bezpiecznaaura.example and window B as nauczyciel.5a@bezpiecznaaura.example, with your own `.env.local` or a deployed build.
1. **Approve with Esc first.** In A, open the pending game report and click "Zatwierdź zgłoszenie". Press Esc, open the dialog again and confirm.
   - Esc and "Zostaw bez zmian" change nothing and focus returns to the button.
   - After confirming, "Zapisano. Obecny stan: u nauczyciela." appears.
2. **Teacher escalates.** In B, click "Odśwież listę" and open the report. It is in the list with only "Eskaluj zgłoszenie" and "Zamknij zgłoszenie".
   - Click "Eskaluj zgłoszenie" and confirm with an empty note: "Wpisz, do kogo eskalowano zgłoszenie." appears.
   - Confirm again with "CERT Polska (NASK)".
3. **Parent sees it.** In A, click "Odśwież zgłoszenie". A sees "eskalowane" and the note.
4. **Stale click.** Leave A showing an outdated state and let B change that state first. Then click the stale action in A with a typed note.
   - "Sprawa zmieniła się w międzyczasie. …" appears.
   - The note is in the comment field, unsent.
5. **Narrow widths.** Repeat the list, the detail and an open dialog at 375px and 320px.
   - Nothing scrolls horizontally.
   - The detail order is content, taken actions, change state, timeline.

## Next Phase Readiness

- All five plans of phase 02 are executed. With this plan, PAN-03 is complete per D-03: a reply is a comment (02-04) plus a state change (02-05), and both are visible to the other party in the panel.
- **D-01..D-15:** each is covered by a plan in 02-01..02-05.
- **Remaining:** the phase verification and the end-of-phase human check above. It also covers the 02-04 human check and the two UI-SPEC backstops.

---
*Phase: 02-panel-opiekuna*
*Completed: 2026-10-03*

## Self-Check: PASSED

- All 9 source and test files listed above and this SUMMARY exist on disk.
- ReportActionsCard.tsx exports `ReportActionsCard`, TransitionDialog.tsx exports `TransitionDialog`, api.ts exports `postTransition`, and format.ts exports `orderedActions`, `isPrimaryAction`, `actionButtonLabel`, `dialogCopy` and `mergeDraft`.
- No RED stubs remain, and the mutation-probe files were restored byte for byte.
- Commits: none. HEAD is unchanged (a5f4f15). The changes are left uncommitted because there was no git authorization.
- No `npm run dev`, no server started, no Supabase call, no `.env*` access and no package install.
