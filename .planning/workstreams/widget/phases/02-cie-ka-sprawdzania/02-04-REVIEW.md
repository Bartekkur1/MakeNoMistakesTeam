---
phase: 02-cie-ka-sprawdzania
plan: "04"
gap_ids: [G-02-2]
reviewed: 2026-10-04T00:30:26Z
depth: deep
diff_range: 0b3e8ad..dd289f9
files_reviewed: 12
files_reviewed_list:
  - projects/widget/src/core/messages.js
  - projects/widget/src/core/integration.js
  - projects/widget/src/background/sw.js
  - projects/widget/src/core/draft.js
  - projects/widget/src/content/main.js
  - projects/widget/src/ui/panel.js
  - projects/widget/src/ui/strings.pl.js
  - projects/widget/tests/unit/guardian-request.test.js
  - projects/widget/tests/unit/draft.test.js
  - projects/widget/tests/unit/panel.test.js
  - projects/widget/tests/e2e/check.spec.mjs
  - projects/widget/README.md
findings:
  critical: 1
  warning: 4
  info: 6
  total: 11
status: issues_found
---

# Phase 02 Plan 04: Code Review Report (guardian demo handoff, G-02-2)

**Reviewed:** 2026-10-04T00:30:26Z
**Depth:** deep (cross-file: panel → main → integration → sw, store transitions traced and probed in Node)
**Files Reviewed:** 12
**Status:** issues_found

## Summary

I reviewed the explicit "Poproś opiekuna o sprawdzenie" handoff:
- the new message type and the `requestGuardianVerification` adapter
- the service-worker validator and the 100-record store
- the guarded store transaction (`beginGuardianRequest`, `guardianRequested`, `guardianRequestFailed`)
- the controller handler, the panel rendering and copy, the new unit/e2e tests and the README

The prior 02-REVIEW findings were not re-reported. IN-01 (unreachable confirmation) is now closed, but see CR-01. IN-02 (alias keys) is still open, but it now has a new consequence, covered in WR-02.

**What holds up (verified):**
- **Single send site.** `chrome.runtime.sendMessage` for the request is called only in `src/core/integration.js:12`. `tests/unit/source-scan.test.js:9` enforces that `chrome.runtime.sendMessage` appears only in `core/integration.js`.
- **Sender gate.** The new type sits behind the existing `sender.id !== chrome.runtime.id || !sender.tab` check (`sw.js:28`). A foreign or tab-less sender gets no response, so the adapter's `response?.ok !== true` turns that into a failure.
- **Validator.** It is strict about shape: exact own keys, typed scalars, `Array.from` so holes are rejected, length bounds, no duplicate signals/unknowns, the step/explanation pairing, and the mismatch contract. I enumerated all 196,608 answer-subset × hint combinations of `evaluate()` across six hint profiles. The worker accepts every legitimate result, so a genuine result can never be falsely rejected.
- **Bounded store.** `guardianRequests` is capped at 100 with FIFO eviction and is independent of `cases`.
- **Tokens and transactions.** The token/transaction-kind guards in `draft.js` correctly reject:
  - late replies after `pagehide`/reset
  - cross-completion between the approval and guardian transactions
  - duplicate begins while a request is pending
- **Close/hide during a pending request.** Both leave the window closed. Reopening shows confirmation after success, or the result with an error after failure.
- **Unit suite:** 264/264 pass (`npm --prefix projects/widget test`). E2E was not run, per instruction.

**Key concerns:**
1. **Dead end after a successful request (CR-01).** The child cannot check another message, edit, or return to the result without reloading the page. This is a D-12 regression.
2. **Stale failure alert (WR-01).** After a failed request, the alert survives "Popraw odpowiedzi" and reappears on a recomputed result that was never sent.
3. **Lax validator (WR-02).** The worker validates against the UI copy pack, not the `check.js` vocabulary, so it accepts alias and self-contradictory results.
4. **Demo records may vanish (WR-03).** Chrome stops an idle MV3 worker after about 30 s, so the README's demo step to inspect `self.__aura.guardianRequests` can find an empty array.
5. **Brittle README test (WR-04).** A browser e2e test asserts README substrings. It is brittle and proves nothing about behaviour.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: After a successful guardian request the widget dead-ends on the confirmation view until the page is reloaded (D-12 regression)

**File:** `projects/widget/src/core/draft.js:100-105` (with `:7`, `:28-29`, `:61`, `:148-150`) and `projects/widget/src/ui/panel.js:74-81`
**Issue:** `guardianRequested` sets `check.step = check.resumeStep = 'confirmation'`. From then on, every avatar click with an active `check` resolves to `checkView('confirmation')` (`draft.js:28`), and the confirmation view renders only a heading, body text and "Zamknij" (`panel.js:74-81`). Every exit path is blocked:
- **"Sprawdź nowe zaznaczenie":** `appendReplacement(state)` is never called in the confirmation branch. `onAvatarClick` does compute `pendingSelection` for a newly selected message, but no control exposes it.
- **"Edytuj wiadomość":** not rendered. `editCheckContent` also refuses the view, because it only allows `['safety','question','result']` (`draft.js:61`).
- **"Popraw odpowiedzi" and the result:** unreachable, because `fixAnswers` requires `view === 'result'`.
- **Menu/paste path:** unreachable, because the `state.check` branch takes precedence over it in `onAvatarClick`.

Node probe of the real store:

```
after confirm + new selection: confirmation pending: true
 editCheckContent -> confirmation
 fixAnswers -> confirmation
```

So once a child asks a guardian about one message, the widget can never check a second message in that tab. On Discord, which is an SPA where the README promises that channel changes keep the session, the only way out is a full reload. This breaks D-12 ("Wrócić do trwającego sprawdzania i pokazać Sprawdź nowe zaznaczenie"). It also contradicts the plan's must-have "D-09..D-12 nie mają regresji".

No test exercises a new selection or an edit after confirmation. The e2e resume test calls `clearSelection` before clicking the shark (`check.spec.mjs`, "confirmation resumes without resending"), and README step 4 tells the presenter to do the same, which hides the defect. The store is also internally inconsistent: `checkNewSelection` does work from confirmation (the probe reached `preview`), but the panel never offers it.

**Fix:** Keep confirmation non-resending, but make it a non-terminal endpoint:
```js
// panel.js, confirmation branch
body.append(node('h2', strings.confirmationHeading), node('p', strings.confirmationBody), done);
appendReplacement(state);   // D-12: offer "Sprawdź nowe zaznaczenie" here too
done.focus();
```
Also allow `editCheckContent` from `'confirmation'` (add it to the list at `draft.js:61`) and render the "Edytuj wiadomość" button there.

Alternatively, keep `resumeStep: 'result'` with a `guardianRequested: true` flag. Then show confirmation once and, on resume, show the result with the request button replaced by a "Prośba przekazana (demo)" note. This also keeps "Popraw odpowiedzi" reachable.

Add a unit test and an e2e test in which the page has a new selection after confirmation and "Sprawdź nowe zaznaczenie" opens a preview.

## Warnings

### WR-01: A failed-request alert survives "Popraw odpowiedzi" and is shown on a new, never-sent result

**File:** `projects/widget/src/core/draft.js:107-110, 116-151, 28`, `projects/widget/src/ui/panel.js:155-159`
**Issue:** `guardianRequestFailed` sets `error: 'guardianRequest'`. None of these clear it: `fixAnswers`, `answer`, `nextQuestion`, `previousQuestion` and `startQuestions`. `onAvatarClick` also deliberately preserves it. When the child corrects the answers and reaches the recomputed result, the panel renders `role="alert"` with "Nie udało się zapisać prośby w pokazie. Spróbuj jeszcze raz." for a result that was never submitted. Probe:
```
after fail+fix: view question error guardianRequest
 back at result: view result error guardianRequest summary caution
```
This is misleading in a flow whose whole purpose is honest status, and it re-announces an assertive alert.
**Fix:** Clear the error whenever the result is invalidated or left, and keep it only for an unchanged result:
```js
fixAnswers() { if (...) return;
  state = { ...state, view: 'question', error: null, check: ... }; }
```
Better still, store the failed result reference (`failedResult: state.check.result`) and render the alert only while `state.check.result === state.failedResult`. Add a store test: fail → fixAnswers → next×3 → `error` is `null`.

### WR-02: The worker validates against the UI copy pack, not the `check.js` contract, so it accepts alias and contradictory results; content edits can silently break the demo

**File:** `projects/widget/src/background/sw.js:3, 7-21`
**Issue:** `isValidResult` treats "is a key of `STRINGS.check*`" as valid. Because IN-02 is still open, the copy pack contains aliases that `evaluate()` never emits, and the worker accepts them. Probe: this payload is accepted and stored, `ok: true`:
```js
{ summaryKey: 'no_signal', signals: ['password','code','credential_code'],
  unknowns: ['verify','official_channel'], step: { id: 'do_not_share', explanationKey: 'do_not_share_how' }, mismatches: [] }
```
So are self-contradictory results (`summaryKey: 'no_signals'` with `signals: ['credential_password']`) and duplicate mismatch entries. Plan T-02-13 asks for validation against "istniejącego kontraktu check.js/STRINGS". This also couples a background-trust decision to a localisation file owned by the content-pack author. Renaming or removing a copy key, for example when IN-02 is fixed, changes what the mock accepts. If the rename happens without an `evaluate` change, real results get rejected and the child sees "Nie udało się zapisać prośby" with no diagnostic. Phase 3 will inherit this validator as the shape of the backend contract.
**Fix:** Export the emitted vocabulary from `check.js`, for example:
```js
export const RESULT_KEYS = Object.freeze({
  summaries: ['conflicting_answers','caution','insufficient_information','no_signals'],
  signals: ['credential_password','credential_code','payment_pressure','payment','prize_link','prize','urgency'],
  unknowns: ['sender','request','urgency','official_channel','conflict'],
  steps: ['protect_credentials','verify_payment','verify_prize','pause_and_verify','independent_check'] });
```
Validate against `RESULT_KEYS` in `sw.js` instead of `STRINGS`, and reject duplicate mismatches. Add a unit test asserting that every `RESULT_KEYS` entry has copy in `STRINGS`, so the coupling is checked in one direction only.

### WR-03: README demo relies on worker memory that Chrome discards after about 30 s idle

**File:** `projects/widget/README.md` (section "Lokalne przekazanie opiekunowi — demo", step 5 and the paragraph about `self.__aura.guardianRequests`), `projects/widget/src/background/sw.js:23-25`
**Issue:** The README tells the presenter to show the records in the service-worker console as `self.__aura.guardianRequests`. It mentions "Restart service workera usuwa jego pamięć" as though a restart were a deliberate act. In MV3, Chrome terminates an idle service worker after about 30 s without events. Two things follow during a real demo:
- **Lost records.** The `guardianRequests` record is usually gone by the time someone opens `chrome://extensions` → "service worker" to inspect it.
- **Inconsistent collections.** Approving and then answering three questions often takes longer than 30 s. The approved case can therefore be wiped before the request arrives, so `cases` is `[]` while `guardianRequests` has 1 entry. That contradicts the README's description of two parallel collections.

The e2e suite does not see this because Playwright's `serviceWorker.evaluate` keeps the worker alive. The user is manually testing in Chrome right now, so this is likely to surface as "the record isn't there".
**Fix:** Document the behaviour explicitly in the README: open the service-worker DevTools before starting the demo, because Chrome stops an idle worker after about 30 s and its memory is cleared. Optionally, log each accepted record with `console.info('[aura] guardian request', record)` so it appears in an already-open inspector even after the array is lost.

### WR-04: The e2e test asserts README substrings, which makes it brittle, weak and misplaced

**File:** `projects/widget/tests/e2e/check.spec.mjs` (test "guardian demo confirmation resumes without resending and matches README", the `readFileSync(.../README.md)` block)
**Issue:** A Playwright browser-lifecycle test now also does documentation linting:
- **Brittle.** Any copy edit to the README fails the roughly 3-minute e2e suite, including:
  - typographic quotes (`„Poproś opiekuna o sprawdzenie”`)
  - rewording "Restart service workera usuwa jego pamięć" (which WR-03 itself requires)
  - an English translation

  The failure is reported under a behavioural test name, so it is confusing to diagnose.
- **Weak.** `toContain('P7')` matches any occurrence of "P7". The checks prove the presence of phrases, not that the README matches the behaviour the title claims. The negative assertion on one historical sentence is permanent dead weight.
- **Duplicated copy.** The literals duplicate `STRINGS` instead of deriving from it, so a copy change in `strings.pl.js` will not flag a stale README.
- **Manufactured RED.** The summary admits the browser behaviour already passed. This README assertion was added only to create a RED for Task 3, which is test-shaped documentation rather than a regression guard.

**Fix:** Remove the README block from the e2e test. If a doc contract is wanted, move it to a fast unit test such as `tests/unit/readme.test.js` that derives the phrases from `STRINGS`:
```js
const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8');
for (const key of ['requestGuardianVerification', 'confirmationHeading']) expect(readme).toContain(STRINGS[key]);
expect(readme).toContain('self.__aura.guardianRequests');
```
Drop the `'P7'` and historical-sentence assertions.

## Info

### IN-01: The pending state has no accessible status, and focus jumps to the header ×

**File:** `projects/widget/src/ui/panel.js:154, 160`
**Issue:** While a request is pending, every body button is disabled and focus moves to the header close button, whose accessible name is `closeLabel`. Nothing announces that a request is in progress: there is no `aria-busy` and no `role="status"` text. A screen-reader user who activated "Poproś opiekuna o sprawdzenie" hears only "close" and may press it. After a failure, focus goes to "Popraw odpowiedzi" rather than to the retry action or the alert, so a keyboard user needs 2–3 Tabs to retry.
**Fix:** Set `el.setAttribute('aria-busy', String(Boolean(state.submitting)))` and render a short `role="status"` line, for example `strings.guardianRequestPending`. Consider focusing the retry button after a failure (this is a UI-SPEC decision).

### IN-02: The error alert is recreated on every render

**File:** `projects/widget/src/ui/panel.js:155-159`, `projects/widget/src/content/main.js:77`
**Issue:** `render()` runs on every window `resize`, and each run inserts a fresh `role="alert"` node, so assistive technology re-announces the failure on every resize. This is the same root pattern as the earlier IN-06 focus finding.
**Fix:** Announce only when the error first appears. Track the previous `state.error` in `createPanel`, or keep a persistent live region and update its text only when it changes.

### IN-03: The demo confirmation exposes internal roadmap jargon ("w fazie 3") to children

**File:** `projects/widget/src/ui/strings.pl.js:20`
**Issue:** `confirmationBody` says "Prawdziwa wysyłka do opiekuna będzie dostępna w fazie 3." "Faza 3" is a project-planning term that a child user cannot interpret. The plan mandates this literal text, so this is a copy decision to revisit with the content-pack owner rather than an implementation defect.
**Fix:** Use something like "…Prawdziwe wysyłanie do opiekuna dodamy w kolejnej wersji." and keep "faza 3" in the README only.

### IN-04: A new selection made while a request is pending is silently dropped

**File:** `projects/widget/src/core/draft.js:20-23, 104`
**Issue:** The `state.submitting` branch of `onAvatarClick` ignores `text`, and `guardianRequested` clears `pendingSelection`. A message selected while the request is in flight never becomes a "Sprawdź nowe zaznaczenie" offer. The window is short with a local mock, but it widens with the real Phase 3 API.
**Fix:** Record `pendingSelection` in the submitting branch, compared against `state.check?.case.content`, and keep it on success. This depends on CR-01, so that confirmation can actually offer it.

### IN-05: The mock does not tie a request to an approved case or to the sending tab

**File:** `projects/widget/src/background/sw.js:29-34`
**Issue:** Any well-formed case from any tab of the extension is accepted. The worker does not check that the case was previously recorded in `cases`, or that `case.source` matches `new URL(sender.tab.url).hostname`. The worker cannot cross-check against `cases` anyway (see WR-03), and the sender is the extension's own content script, so this is acceptable for a local demo. It should not carry over to the Phase 3 contract.
**Fix:** Record this in the Phase 3 hand-off notes. Do not add a cross-check against volatile `cases` now.

### IN-06: The retry message is misleading after the extension context is invalidated

**File:** `projects/widget/src/content/main.js:42-43`, `projects/widget/src/ui/strings.pl.js:23`
**Issue:** If the extension is reloaded or updated during the demo, `chrome.runtime.sendMessage` throws "Extension context invalidated", and every retry fails the same way. `guardianRequestError` still says "Spróbuj jeszcze raz", whereas the approval path's `submitError` correctly says to refresh the page.
**Fix:** In the handler, check `isLive()` (already defined in `boot`). When the context is dead, set an error variant whose copy suggests refreshing the page.

---

_Reviewed: 2026-10-04T00:30:26Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: deep_
