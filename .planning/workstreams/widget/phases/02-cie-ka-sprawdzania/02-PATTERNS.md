# Phase 2: Ścieżka sprawdzania - Pattern Map

**Mapped:** 2026-10-03
**Files analyzed:** 9
**Analogs found:** 8 / 9

## CRITICAL constraint (tests/unit/source-scan.test.js lines 13-19)

```js
const FORBIDDEN = ['fetch(', ..., 'chrome.storage', 'localStorage', 'sessionStorage', 'indexedDB', ..., 'innerHTML', ...];
if (file !== 'ui/strings.pl.js') expect(text, file).not.toMatch(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/);
if (file === 'ui/panel.js') expect(text).not.toContain('chrome.');
```
- Polish text (diacritics) is allowed ONLY in `src/ui/strings.pl.js`. The working content pack (questions, answers, result texts, D-16 notice) must either live in `strings.pl.js` or the planner must explicitly extend the allowlist in source-scan.test.js (e.g. add `content/pack.pl.js`). Rule matchers (keywords like "kod", "hasło") also contain diacritics -> same issue; use `\u` escapes or keep keyword lists in the allowlisted file.
- No storage APIs: question/result state stays in the in-memory store (D-09, carried privacy rule).
- No `innerHTML`; render with `textContent` via `node()` helper.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `projects/widget/src/core/check.js` (new: rules engine, signal detection, result builder) | utility (pure) | transform | `projects/widget/src/core/case.js` | role-match |
| `projects/widget/src/core/checkpack.js` or entries in `strings.pl.js` (new: working content pack D-13/D-14) | config | static data | `projects/widget/src/ui/strings.pl.js` | exact |
| `projects/widget/src/core/draft.js` (modify: question/result state, answers, back/fix, reset on re-approve, pending selection during check) | store | event-driven state | itself | exact |
| `projects/widget/src/ui/panel.js` (modify: views `safety`, `question`, `result`, mismatch prompt) | component | request-response (render) | itself (paste/preview/confirmation views) | exact |
| `projects/widget/src/ui/strings.pl.js` (modify: new UI strings) | config | static | itself | exact |
| `projects/widget/src/ui/widget.css` (modify: options, hint badge, result sections) | config/style | - | itself | exact |
| `projects/widget/src/content/main.js` (modify: wire new handlers, onApprove -> start check) | controller | event-driven | itself lines 20-39 | exact |
| `projects/widget/tests/unit/check.test.js`, extend `draft.test.js`, `panel.test.js` | test | - | `tests/unit/draft.test.js`, `tests/unit/panel.test.js` | exact |
| `projects/widget/tests/e2e/check.spec.mjs` (scenarios D-14) | test e2e | - | `tests/e2e/draft.spec.mjs` + `extension.fixture.mjs` | role-match |

## Pattern Assignments

### `src/core/check.js` (pure transform)
**Analog:** `src/core/case.js` (38 lines) — named exports, pure functions, `Object.freeze` results, defensive `String(raw ?? '')`.
```js
export function normalizeText(raw) {
  return String(raw ?? '').replace(/ /g, ' ').trim();
}
export function buildCase({ text, link, origin, truncated }, now = new Date(), loc = globalThis.location) {
  ...
  return Object.freeze({ content: capped.text, link: normalizeLink(link), origin, ... });
}
export function extractFirstLink(text) {
  const match = String(text ?? '').match(/(?:https?:\/\/|www\.)[^\s<>"'„”«»]+/i);
```
Suggested API: `detectHints(caseOrDraft) -> {questionId: answerId[]}` (D-03/D-04 suggestions, never preselected), `evaluate(answers, hints) -> frozen {summaryKey, signals[], unknowns[], step, mismatches[]}`. Reuse `normalizeText`/`extractFirstLink` from case.js. Return string KEYS, not Polish text (diacritics rule); panel resolves via `strings`.

### `src/core/draft.js` (state store)
**Analog:** itself. Immutable spread updates, `initial()` factory, guard early-returns, `gen` token for stale async.
```js
const initial = () => ({ view: 'closed', draft: null, pendingSelection: null, hidden: false, error: null, submitting: false, gen: 0, paste: { text: '', link: '' } });
...
approved(token) {
  if (!state.submitting || token !== state.gen) return false;
  state = { ...state, view: state.view === 'closed' ? 'closed' : 'confirmation', draft: null, pendingSelection: null, error: null, submitting: false };
  return true;
},
close() { state = { ...state, view: 'closed', pendingSelection: null }; },
resetForNewDocument() { state = { ...initial(), gen: state.gen + 1 }; },
```
- Add `check: null | { case, step, answers, hints, result }` to `initial()`; `approved()` should transition to the first check view (safety notice D-16) instead of `confirmation`, keeping the approved case (currently it nulls `draft`).
- `onAvatarClick` (lines 8-14) currently routes to preview when a draft exists; add branch: if `state.check` active -> return to current question view, set `pendingSelection` (D-12). Progress cleared only on re-approval of new content (D-11/D-12).
- `close()` must keep `check` (D-09); `resetForNewDocument()` already clears all.

### `src/ui/panel.js` (component)
**Analog:** itself, lines 11-75. Helpers `node(tag, text, className)` and `button(text, className, handler)`; `render(state, ctx)` does `body.replaceChildren()` then branch per `state.view`, focus first control, `return`.
```js
el.hidden = !['menu', 'paste', 'howto', 'preview', 'confirmation'].includes(state.view);   // line 40 — add new views here
...
if (state.view === 'paste') {
  ...
  const row = node('div', undefined, 'row'); row.append(button(strings.back, 'btn-secondary', () => handlers.onBack()), next);
  body.append(node('h2', strings.pasteHeading), text, link);
  if (state.error === 'empty') body.append(node('p', strings.emptyHint, 'hint'));
  body.append(row); text.focus(); return;
}
```
- Question view: options as buttons/radio (multi-select for Q2, D-02), "Nie wiem", "Podpowiedź z wiadomości" label on hinted option (class `hint`), `Dalej` disabled until a choice (mirror `next.disabled` pattern), `Wróć` (`btn-secondary`).
- Result view: `h2` summary + three `h3`/`ul` sections, single step, `Popraw odpowiedzi` button.
- Pending selection banner: copy existing `if (state.pendingSelection)` block (line 74+) with new string `Sprawdź nowe zaznaczenie`.
- No `chrome.` in panel.js; all actions via `handlers.*`.

### `src/ui/strings.pl.js` (config)
Frozen flat object; arrays for lists (`howToSteps`). Add keys e.g. `safetyNotice`, `questionNext`, `dontKnow`, `hintBadge`, `resultSections`, `fixAnswers`, `checkNewSelection`, plus per-signal/per-step texts keyed by check.js keys.
```js
export const STRINGS = Object.freeze({
  ...
  howToSteps: ['Zaznacz wiadomość, którą chcesz sprawdzić.', 'Kliknij mnie.', 'Sprawdź tekst i zatwierdź.'],
```
Also update `guardianNotice`/`confirmationBody` wording only if needed; do not implement sending (phase 3).

### `src/content/main.js` (controller)
**Analog:** lines 20-39 — each handler = store mutation + `render()`:
```js
onBack() { store.back(); render(); },
onPasteNext(values) { store.submitPaste(values); render(); },
async onApprove() {
  let c;
  try { c = buildCase({ ...store.get().draft }, new Date(), location); }
  catch { return; }
  const token = store.beginSubmit();
  if (token === null) return;
  render();
  try { await submitCase(c); store.approved(token); }
  catch { store.submitFailed(token); }
  render();
},
```
Add `onAnswer`, `onQuestionNext`, `onQuestionBack`, `onFixAnswers`, `onCheckNewSelection` in the same style. Keep `submitCase` as local acceptance (phase 3 distinguishes guardian send).

### `src/ui/widget.css`
Existing classes to reuse: `.btn-primary`, `.btn-secondary` (lines 9-10), `.notice` (line 14, use for D-16 safety notice), `.hint`/`.source` (line 16). Use palette vars (`--color-shark-blue`, `--color-text-muted`) from `assets/scamerino_palette.css`.

### Tests
**Unit store analog** `tests/unit/draft.test.js`: `createDraftStore()` then call sequence, `expect(s.get()).toMatchObject({...})`.
**Panel analog** `tests/unit/panel.test.js` lines 5:
```js
const setup = () => { const root=document.createElement('div').attachShadow({mode:'open'}); const handlers=Object.fromEntries(['onClose','onCheck',...].map(k=>[k,vi.fn()])); return {root,handlers,panel:panelModule.createPanel({root,strings:STRINGS,handlers})}; };
```
Assert by text from `STRINGS` (e.g. find button by `textContent===STRINGS.next`).
**Integration analog** `tests/unit/approve.test.js` lines 21-40: stub `chrome.runtime`, import main.js, click `.avatar`, click `Zatwierdzam` — extend to assert the safety notice/first question appears after `{ok:true}`.
**check.js unit test**: table-driven like `draft.test.js` line 15 (`for (const [input,out] of [...])`) over the five D-14 fictional scenarios.

## Shared Patterns
- **Rendering safety:** `textContent` only via `node()`; never `innerHTML` (scan-enforced).
- **State:** in-memory store, immutable spreads, no storage APIs (scan-enforced).
- **Text:** all Polish copy in `strings.pl.js` (scan-enforced diacritics rule).
- **Async staleness:** `gen` token pattern in draft.js.

## No Analog Found
| File | Role | Data Flow | Reason |
|---|---|---|---|
| Rule definitions / scoring in check.js | rules engine | transform | No rules logic exists; case.js only gives style. Design per CONTEXT D-05..D-08, D-15. |

## Metadata
**Analog search scope:** projects/widget/src, projects/widget/tests (all git-tracked)
**Files scanned:** 12
**Pattern extraction date:** 2026-10-03
