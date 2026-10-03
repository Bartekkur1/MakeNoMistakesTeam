---
phase: 02-cie-ka-sprawdzania
reviewed: 2026-10-03T00:00:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - projects/widget/src/content/main.js
  - projects/widget/src/core/check.js
  - projects/widget/src/core/draft.js
  - projects/widget/src/ui/panel.js
  - projects/widget/src/ui/strings.pl.js
  - projects/widget/src/ui/widget.css
  - projects/widget/README.md
  - projects/widget/tests/e2e/avatar.spec.mjs
  - projects/widget/tests/e2e/check.spec.mjs
  - projects/widget/tests/e2e/draft.spec.mjs
  - projects/widget/tests/e2e/menu.spec.mjs
  - projects/widget/tests/e2e/tracer.spec.mjs
  - projects/widget/tests/unit/approve.test.js
  - projects/widget/tests/unit/check.test.js
  - projects/widget/tests/unit/content.test.js
  - projects/widget/tests/unit/draft.test.js
  - projects/widget/tests/unit/panel.test.js
  - projects/widget/tests/unit/presence.test.js
findings:
  critical: 1
  warning: 7
  info: 6
  total: 14
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-10-03
**Depth:** standard
**Files Reviewed:** 18
**Status:** issues_found

## Summary

I reviewed the Phase 2 checking flow: the rule engine (`check.js`), the session state machine (`draft.js`), the question and result rendering (`panel.js`), the Polish content pack, the controller wiring and the accompanying tests and README.

The security threats from the plans' threat models are handled:
- **T-02-01:** Every new view renders through `textContent` or `.value`. No anchors are created, and `content.test.js` checks hostile markup.
- **T-02-03:** No storage or network calls were added.
- **T-02-02, T-02-11:** The generation-token guards (`beginSubmit`, `approved`, `submitFailed` and the `gen` bump in `resetForNewDocument`) correctly reject late responses after `pagehide`.
- **T-02-09:** Cancelled or failed candidates do not replace `check`.
- **T-02-05:** Retained contradictory answers cannot erase recognized credential warnings.

The main defects are in what the engine tells the child. I confirmed each one by running `evaluate` and `detectHints` in Node:
- When the child's only answer is payment, the result says "Ta wiadomość wymaga ostrożności. Sprawdź, co zwraca uwagę" next to a signals section that says "Nie widzę typowych sygnałów oszustwa". The two parts contradict each other and the second is false reassurance. A unit test locks this behaviour in.
- A prize answer without a link produces `no_signals`.
- Hint-derived urgency and credential signals appear together with "we don't know" statements about the same facts.
- The verify hint badges the unsafe answer "Tylko przez link z tej wiadomości".
- The recognizer misses the most common credential phrasing ("Podaj login i hasło"). A report prefix written by the sender can switch off detection for the rest of the sentence.

Secondary issues:
- Approving an unchanged edit submits a duplicate case.
- A defensive branch in `approved()` can leave the UI stuck in `submitting`.
- The answer-option IDs are defined in three places.

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: A payment-only answer shows a "caution" summary next to "no scam signals" (contradictory, false reassurance)

**File:** `projects/widget/src/core/check.js:51-52,60-63`, `projects/widget/src/ui/panel.js:135`
**Issue:** The `payment` signal is only emitted as `payment_pressure`, which needs urgency as well. When the child chooses "Zapłaty lub przelewu" without urgency, `signals` is `[]`, but `summaryKey` is `'caution'` because of `|| has('payment')`. The panel then renders:
- h2: "Ta wiadomość wymaga ostrożności. Sprawdź, co zwraca uwagę, zanim zrobisz kolejny krok."
- "Co zwraca uwagę": "Nie widzę typowych sygnałów oszustwa w wiadomości ani w Twoich odpowiedziach." (the `none` fallback)
- step: "Sprawdź prośbę, zanim zapłacisz"

The summary sends the child to a section that says there is nothing to look at. In a children's safety tool this is both contradictory and falsely reassuring. The copy `checkSignals.payment` ("Prośba o zapłatę wymaga sprawdzenia poza wiadomością.") already exists but is never emitted. The test `'a standalone payment answer calls for verification without an accusation'` in `tests/unit/check.test.js` locks the defect in by asserting `signals: []` with `caution`.

Reproduced: `evaluate({sender:['known_person'],request:['payment'],verify:['independent_channel']}, null)` gives `{summaryKey:'caution', signals:[], ...}`.
**Fix:** Emit a non-accusatory payment signal whenever payment is present without pressure, and update the test:
```js
const signals = [...credentials.map(id => 'credential_' + id),
  ...(pressure ? ['payment_pressure'] : has('payment') ? ['payment'] : []),
  ...(prizeLink ? ['prize_link'] : []), ...(has('urgency') ? ['urgency'] : [])];
// summaryKey can then drop the `|| has('payment')` special case
```
Also add a panel test asserting that a `caution` summary never appears together with the `checkSignals.none` line.

## Warnings

### WR-01: The child's own "free prize" answer is dropped without a link and can end in `no_signals`

**File:** `projects/widget/src/core/check.js:50,60-63`
**Issue:** `prizeLink` needs a `message_link` from either the answer or the hint. If the child answers `request:['prize']` with `verify:['independent_channel']` and the text has no link, the result is `summaryKey:'no_signals'`, i.e. "Nie widzę typowych sygnałów oszustwa." This happens even though the child stated that the sender wants them to claim a free prize, which is one of the D-14 scam archetypes. With `verify:['no_channel']` the result is only `insufficient_information` with no prize mention. Payment answered alone gets special handling (`has('payment')` gives `caution` and `verify_payment`), but prize does not, so the rules are inconsistent. The copy `checkSignals.prize` and the `verify_prize` step exist but cannot be reached in this case. (Confirmed in Node.)
**Fix:** Treat a child-reported prize like a child-reported payment:
```js
...(prizeLink ? ['prize_link'] : has('prize') ? ['prize'] : []),
// step: ... : prizeLink || has('prize') ? 'verify_prize' : ...
```

### WR-02: The result contradicts itself when a hint-recognized fact sits next to a "Nie wiem" request answer

**File:** `projects/widget/src/core/check.js:47,52,55`
**Issue:** `has()` merges the child's answers with the recognized hints, but the unknowns are computed from the child's answers only. For the text "Kliknij, tylko dziś" with `request:['unknown']`, `signals` is `['urgency']` ("Pośpiech utrudnia sprawdzenie wiadomości") while `unknowns` contains `'urgency'` ("Nie wiemy jeszcze, czy nadawca pogania"). For "Podaj kod do konta" with `request:['unknown']`, the result has `credential_code` and also "Nie wiemy jeszcze, czego nadawca oczekuje". (Both confirmed in Node.) The result tells the child both that the sender is rushing them and that we don't know whether they are.
**Fix:** Suppress an unknown when the engine already has evidence for it:
```js
if (!request.length || request.includes('unknown')) {
  if (!recognized.request.some(id => id !== 'urgency')) unknowns.push('request');
  if (!has('urgency')) unknowns.push('urgency');
}
```

### WR-03: The "Podpowiedź z wiadomości" badge points the child at "Tylko przez link z tej wiadomości"

**File:** `projects/widget/src/core/check.js:40`, `projects/widget/src/ui/panel.js:106`
**Issue:** `detectHints` sets `verify: ['message_link']` whenever the text or the link field contains a URL. The panel puts the hint badge on the Q3 option "Tylko przez link z tej wiadomości" ("only via the link in this message"). A link in the message says nothing about the child's other ways to check, so this badge suggests the answer that goes against both the safety notice ("nie klikaj nieznanego linku") and every recommended step ("bez linku z wiadomości"). Even a neutral link such as `Plan zajęć` + `https://szkola.example` gets the badge. The verify hint is still needed for `prizeLink`, but it should not be shown as a suggested answer.
**Fix:** Keep `verify` hints internal to `evaluate`, and render badges only for `sender` and `request`:
```js
if (question.id !== 'verify' && state.check.hints[question.id].includes(option.id)) row.append(...)
```
Alternatively, give the verify hint a separate neutral fact line ("W wiadomości jest link") instead of badging an answer.

### WR-04: The credential recognizer misses common phishing phrasings, and a sender-written report prefix switches detection off

**File:** `projects/widget/src/core/check.js:15-17,27-28`
**Issue:** T-02-05 (a retained contradiction cannot erase the credential warning) and the discrepancy prompt only work when `detectHints` recognizes the request. All of these return `request: []` (confirmed in Node):
- "Podaj login i hasło do konta" (the most common account-phishing form)
- "Podaj mi hasło"
- "Wpisz kod z SMS"

So a child who answers "Zwykła wiadomość" gets `no_signals` with no mismatch prompt.

Separately, the report span in `withoutReports` falls back to `[^.!?;]*`, which covers everything up to the next full stop. The sender controls this text: "Zgłaszam wiadomość: podaj hasło, inaczej zablokujemy konto" is fully suppressed, threat included. The README lists rule coverage as a known limitation, but the gap affects the scenario the phase exists for.
**Fix:**
- Allow a short gap between the verb and the object, e.g. `\b(?:podaj|wyslij|przeslij|wpisz|napisz)\s+(?:\S+\s+){0,3}?hasl(?:o|a)\b`, with similar handling for `kod`, while keeping the current negative fixtures green.
- Limit the unquoted report fallback to a clause (`[^.!?;,]*`), or only exclude quoted spans.
- Add the three phrasings above as positive fixtures.

### WR-05: Re-approving an unchanged edit submits a duplicate case while the UI keeps the old one

**File:** `projects/widget/src/content/main.js:37-46`, `projects/widget/src/core/draft.js:79-84`
**Issue:** When the child chooses "Edytuj wiadomość" and approves without changing anything, `onApprove` still calls `submitCase(c)`. The service worker stores a second case with a new `created_at`. `approved()` then sees `unchanged` and keeps the old `check` (and the old `check.case`). Under the Phase 3 model fixed in CONTEXT ("zatwierdzenie oznacza natychmiastowe przekazanie sprawy opiekunowi"), this sends a duplicate case to the guardian, and that case is never tied to the result the child sees. This undermines T-02-12 (result attribution).
**Fix:** Compare before submitting and skip the round trip:
```js
// main.js onApprove, before beginSubmit
const s = store.get();
if (s.candidateKind && s.check && normalizeText(s.check.case.content) === c.content
    && normalizeLink(s.check.case.link) === c.link) { store.cancelCheckEdit(); render(); return; }
```
Alternatively, if re-submission is intended, replace `check.case` with the new case so that the stored case and the displayed result stay tied together.

### WR-06: `approved()` can leave the store stuck in `submitting: true`

**File:** `projects/widget/src/core/draft.js:78`, `projects/widget/src/content/main.js:44`
**Issue:** `approved()` returns `false` without changing state when `!isValidCase(approvedCase)`, but `submitting` stays `true`. `main.js` ignores the return value, so the preview stays read-only, the approve and cancel buttons stay disabled, and only a reload recovers. This can't happen today only because the service worker runs the same `isValidCase` first. Once Phase 3 swaps in backend acceptance, or the two validators drift, the child is locked out with no error message.
**Fix:**
```js
try { await submitCase(c); if (!store.approved(token, c)) store.submitFailed(token); }
catch { store.submitFailed(token); }
```

### WR-07: Answer-option IDs are defined in three places with no cross-check

**File:** `projects/widget/src/core/check.js:3-7`, `projects/widget/src/core/draft.js:5-9`, `projects/widget/src/ui/strings.pl.js:33-55`
**Issue:** `OPTIONS` (check.js), `QUESTIONS` (draft.js) and `STRINGS.checkQuestions[].options[].id` each list the IDs separately. The panel renders inputs from the strings, but `store.answer()` checks against `QUESTIONS` and returns early without any feedback. If the person-4 content pack renames an ID (which the README expects), the renamed option will render but clicking it will do nothing, and `evaluate` will silently filter it out. No test asserts that the three lists match.
**Fix:** Export one `QUESTIONS` from `check.js`, import it in `draft.js`, and make the strings map labels by ID. Also add a unit test asserting `STRINGS.checkQuestions.map(q => [q.id, q.options.map(o => o.id)])` equals `Object.entries(QUESTIONS)`.

## Info

### IN-01: The `confirmation` view is now unreachable

**File:** `projects/widget/src/ui/panel.js:47,74-80`, `projects/widget/src/ui/strings.pl.js:19`
**Issue:** `approved()` no longer sets `view: 'confirmation'`, so this branch and the `confirmationHeading/Body/Close` strings are dead.
**Fix:** Remove the branch and the strings, or keep them only if Phase 3 has a planned use.

### IN-02: Alias keys in the content pack are unused, and a test depends on one

**File:** `projects/widget/src/ui/strings.pl.js:58-104`
**Issue:** These keys are never emitted by `evaluate`:
- `checkSummaries.no_signal`, `missing_information`
- `checkSignals.password`, `code`, `payment`, `prize`
- `checkUnknowns.verify`
- `checkSteps.do_not_share(_how)`

`tests/unit/panel.test.js:97` asserts `STRINGS.checkSignals.code`, which only passes because it has the same text as `credential_code`. This hides key drift from the person-4 review. (`payment` and `prize` become live if CR-01 and WR-01 are fixed.)
**Fix:** Delete the aliases that remain unused, and assert canonical keys in the tests.

### IN-03: Unused re-export in `draft.js`

**File:** `projects/widget/src/core/draft.js:3`
**Issue:** `export { detectHints, evaluate } from './check.js';` has no importers. Callers import from `check.js` directly.
**Fix:** Remove it.

### IN-04: Exclusive "Nie wiem" and "Zwykła wiadomość" are rendered as checkboxes

**File:** `projects/widget/src/ui/panel.js:96`, `projects/widget/src/core/draft.js:96-99`
**Issue:** In Q2, checking `unknown` or `ordinary` clears every other checkbox. Screen-reader users get checkbox semantics with no hint that these two options are exclusive.
**Fix:** Add a short visually-hidden note to the legend, or `aria-describedby` on those two inputs, stating that they replace the other choices.

### IN-05: A pending replacement selection is silently lost when entering or cancelling an edit

**File:** `projects/widget/src/core/draft.js:21,54-64`
**Issue:**
- `editCheckContent` keeps `pendingSelection`, but `cancelCheckEdit` sets it to `null`, so "Sprawdź nowe zaznaczenie" disappears after an edit/cancel round trip.
- `onAvatarClick` with an open candidate also drops a newly captured selection without telling the child.

**Fix:** Keep `pendingSelection` in `cancelCheckEdit`, or document this as intended.

### IN-06: Renders not started by the child move focus into the panel

**File:** `projects/widget/src/ui/panel.js:85,125,150`, `projects/widget/src/content/main.js:63`
**Issue:** Each new check view calls `.focus()` on every `render()`, including renders triggered by `resize`. If the child is typing in the page's composer while the panel is open, a window resize moves focus into the panel. This existing pattern from Phase 1 now also applies to the three new views.
**Fix:** Only move focus when the view or step changed since the last render, e.g. track `lastViewKey` in `createPanel`.

---

_Reviewed: 2026-10-03_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
