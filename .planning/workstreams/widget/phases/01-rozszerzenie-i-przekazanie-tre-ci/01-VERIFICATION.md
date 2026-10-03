---
phase: 01-rozszerzenie-i-przekazanie-tre-ci
verified: "2026-10-03T18:14:22.158811+00:00"
status: human_needed
score: "4/4 current gap-plan truths verified; prior phase proof retained; 4/5 UAT passed"
behavior_unverified: 0
covered_digest: "v2:sha256:c7b73a274bc24156ce2ae18bdde0698fe7b12658a9e344ab82070ac672375538"
covered_files:
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-01-PLAN.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-01-SUMMARY.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-02-PLAN.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-02-SUMMARY.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-03-PLAN.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-03-SUMMARY.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-04-PLAN.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-04-SUMMARY.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-05-PLAN.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-05-SUMMARY.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-06-PLAN.md
  - .planning/workstreams/widget/phases/01-rozszerzenie-i-przekazanie-tre-ci/01-06-SUMMARY.md
  - widget/README.md
  - widget/build.mjs
  - widget/manifest.json
  - widget/package-lock.json
  - widget/package.json
  - widget/playwright.config.mjs
  - widget/src/background/sw.js
  - widget/src/content/avatar.js
  - widget/src/content/capture.js
  - widget/src/content/host.js
  - widget/src/content/main.js
  - widget/src/core/case.js
  - widget/src/core/draft.js
  - widget/src/core/integration.js
  - widget/src/core/messages.js
  - widget/src/ui/panel.js
  - widget/src/ui/strings.pl.js
  - widget/src/ui/widget.css
  - widget/tests/e2e/avatar.spec.mjs
  - widget/tests/e2e/browser.mjs
  - widget/tests/e2e/content.spec.mjs
  - widget/tests/e2e/draft.spec.mjs
  - widget/tests/e2e/edges.spec.mjs
  - widget/tests/e2e/extension.fixture.mjs
  - widget/tests/e2e/fixtures/capture-autofocus.html
  - widget/tests/e2e/fixtures/chat-like.html
  - widget/tests/e2e/fixtures/fields.html
  - widget/tests/e2e/fixtures/other.html
  - widget/tests/e2e/menu.spec.mjs
  - widget/tests/e2e/server.mjs
  - widget/tests/e2e/tracer.spec.mjs
  - widget/tests/unit/approve.test.js
  - widget/tests/unit/content.test.js
  - widget/tests/unit/draft.test.js
  - widget/tests/unit/host.test.js
  - widget/tests/unit/no-background-reading.test.js
  - widget/tests/unit/panel.test.js
  - widget/tests/unit/presence.test.js
  - widget/tests/unit/source-scan.test.js
  - widget/vitest.config.mjs
overrides_applied: 1
overrides:
  - must_have: "Rekin i jego przycisk schowania znikają w formularzach paste i preview, także podczas zatwierdzania i błędu wysyłki. Formularz pozostaje widoczny i obsługiwalny."
    reason: "User explicitly superseded the hiding criterion: visible shark is acceptable when the open window moves together with it. Implemented by 01-06."
    accepted_by: user
    accepted_at: "2026-10-03"
human_verification:
  - test: "G-01-2-drag: otwarte okno podąża za widocznym rekinem"
    expected: "W Google Chrome na Discordzie przeciągnij rekina z otwartym menu, Jak to działa, paste, preview i Gotowe. Okno podąża już podczas ruchu; tekst, link, aktywne pole i szkic zostają. Sprawdź krawędzie, resize, × i Escape według README."
    why_human: "User visual acceptance of revised interaction in their Chrome/Discord environment."

---

# Phase 01 Verification

Goal: Rozszerzenie z awatarem przyjmuje treść do sprawdzenia. All four plans have summaries and matching task commits. The prior tracer Discord keyboard approval is preserved; it does not substitute for newly added toolbar/composer/demo checks.

## Historical Automated Evidence (before 01-06)

Vitest: 8 files, 36 tests PASS. Full Chromium Playwright: 35 PASS (tracer 3, edges 8, avatar 5, menu 8, draft 8, content 3), including one declared expected capture-phase failure. Real bfcache observed pageshow.persisted true. Source scan, planted-listener negative proof, duplicate-send RED, pending-selection RED and truncation RED substantiate the privacy and consent guards. Review warnings fixed, SECURITY has 0 blocking open threats. Build and diff checks pass. Assets, shared files and dependency manifests unchanged.

## Observable Truths

| Plan | Truth | Status | Evidence |
|------|-------|--------|----------|
| 01-01 | D-01/D-04: until the child clicks the avatar the extension reads nothing from the page and sends nothing; selecting text and waiting leaves the service-worker message log (self.__aura.messages) empty | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-05/D-06/D-14: after `npm --prefix widget run build` and loading `widget/dist` unpacked in Chromium (MV3), the Scamerinio avatar (assets/widget-avatar/avatar-128.png drawn at 64x64 CSS px) is visible bottom-right on an ordinary http page with no user action; extension icons come from assets/widget-avatar/icon-16/32/48/128.png | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-08/D-09: with text selected on the page, clicking the avatar opens a small window (320 px wide) next to the avatar that shows exactly the selected text in an editable field | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-02/D-03: the preview shows the editable text, an optional link field, the line „Ze strony: <hostname>” (hostname only, never the full URL) and the notice „Gdy zatwierdzisz, tę wiadomość i wynik sprawdzania zobaczy Twój opiekun.”; showing the avatar, opening the window and previewing create no case | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-03: pressing „Zatwierdzam” sends exactly one 'aura/case-approved' runtime message whose case object has exactly the keys content, link, origin, source, created_at, truncated; content equals the edited text and source equals the page hostname | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-04: a context-level request collector attached right after browser launch (before any navigation) observes only http://127.0.0.1:4173/, chrome-extension:// and data: URLs from launch through the completed select-preview-approve flow plus a 1 s settling period; the collector is proven live because it recorded the fixture page request, and each test reports the observed window (request count and milliseconds) as a Playwright annotation instead of claiming that no traffic exists outside that window | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-03 (Pitfall 7): the confirmation („Gotowe!” + „Sprawa jest przygotowana do sprawdzenia.”) appears only after the service worker answers {ok:true}; on a failed send the draft stays and „Coś poszło nie tak. Odśwież stronę i spróbuj jeszcze raz.” is shown | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-12 (first slice): closing the window keeps the draft, and the next avatar click shows it again | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-15/D-16: the shadow root carries the scamerino palette tokens rebased from :root onto :host with --radius-widget 20px, proven in real Chromium (the „Zatwierdzam” button background computes to rgb(15, 98, 219) and the window's border-radius to 20px), and every UI string lives in src/ui/strings.pl.js, in Polish | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | Build: `?raw` and `?inline` imports keep their mode through esbuild resolution (separate plugin namespaces, paths resolved against the importer's resolveDir), so widget/dist/content.js contains the palette text with 0F62DB and the avatar as a data:image/png;base64 URL | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-02/D-04 capture scope: the click reads a focused textarea or text/search/url input through its own selection range, returns empty for any other focused input type (password included) and for a focused page element hosting its own shadow root, and otherwise reads the document selection; it never traverses the DOM | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | D-18: the Playwright suite launches the local Chromium at /usr/bin/chromium by default; AURA_CHROMIUM=bundled selects Playwright's bundled Chromium even when /usr/bin/chromium exists, and any other AURA_CHROMIUM value is used as the executable path | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | Pitfall 3 (automated proxy): keystrokes typed into the preview field never reach a bubbling keydown listener on the page (fixture #keylog stays empty) | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-01 | Pitfall 3 (mandatory real check): before any expansion plan runs, the user has typed into the preview on discord.com in a real browser and confirmed that Discord's composer stayed empty and unfocused; this blocking gate cannot be deferred, and a failed check stops the phase for the extension-page iframe panel fallback | VERIFIED | tracer E2E, manifest/build; prior 01-01 summary and approvals |
| 01-02 | D-04: a Vitest spy test proves getSelection is called 0 times before the avatar click and exactly once on it, chrome.runtime.sendMessage 0 times before approval and exactly once after, and no window/document listener exists except pagehide/resize | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-02 | D-04: a source-scan test pins getSelection to src/content/capture.js and chrome.runtime.sendMessage to src/core/integration.js, forbids network, storage, observer and HTML-string sinks in src/, and pins the manifest to permissions [activeTab, scripting] with no host_permissions | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-02 | D-15 in unit tests: Vitest runs with css: true, so the real `?raw` CSS imports are not replaced by empty modules; host.test.js asserts that STYLE_TEXT built from those imports contains ':host {', '#0F62DB', '--radius-widget: 20px' and the '.panel' rule, and no ':root {' | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-02 | D-02/D-09 in real Chromium: a selection inside a focused textarea, a focused text input and a contenteditable region shaped like Discord's composer each opens the preview with exactly the selected substring, and nothing is sent before approval | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-02 | D-02/D-04 unsupported contexts: a selection in a password field, inside an iframe, or in an input inside another component's shadow root opens no preview and sends nothing; the child hands such text over through manual paste (menu from plan 01-03) | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-02 | Pitfall 3 residual risk is executable: on capture-autofocus.html, whose capture-phase keydown listener moves focus to its composer whenever document.activeElement is not editable, typing in the preview is a declared expected failure (test.fail); bubble-phase containment stays, and the blocking Discord check from plan 01-01 decides the architecture | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-02 | D-03 approval guard: while an approval is pending, „Zatwierdzam” is disabled and the text and link fields are read-only; a second approval request is rejected, so a double click yields exactly one 'aura/case-approved' message and one case | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-02 | D-03 stale completions: an answer that arrives after the document was reset (resetForNewDocument) is ignored through a generation token; an answer that arrives after the window was closed updates the draft but never reopens the window | VERIFIED | host/source-scan/no-background-reading/approve + edges E2E |
| 01-03 | D-06: the avatar appears on its own on every http(s) page where Chrome runs extensions (chat-like.html and other.html fixtures), with exactly one bezpieczna-aura-widget element per document | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-07: the avatar can be dragged; „Schowaj pomocnika” hides it on the current page only; it comes back after a page reload and after the toolbar icon is clicked; hiding keeps the draft | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-07 restore paths: onActionClicked first sends 'aura/show' and counts it as delivered only on an explicit {ok:true} acknowledgement; without one it injects content.js through chrome.scripting.executeScript, sends 'aura/show' again and waits for the acknowledgement; it returns { ok, via } ('message', 'inject', 'no-ack', 'inject-failed' or 'none') instead of swallowing failures. The E2E test covers the message path only (a direct call grants no activeTab); unit tests cover every injection branch; a manual check covers the real toolbar click on a previously uninjected tab and after an extension reload | HUMAN NEEDED | presence/panel + avatar/menu E2E |
| 01-03 | Stale host recovery: when the content script boots and finds a bezpieczna-aura-widget element, it asks that element's instance whether it is alive through a synchronous cancelable DOM event; a live instance (its captured runtime still has an id) claims it and the new boot stops, while an orphaned instance (extension reloaded) or a foreign element is removed and a fresh avatar mounts | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-08: the window opens next to the avatar (12 px gap), is 320 px wide, stays fully inside the viewport (flips below when there is no room above, clamped 8 px from every edge) and is neither the Chrome side panel nor a modal | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-10: with no selection and no draft, clicking the avatar shows a menu with exactly two buttons, „Sprawdź wiadomość” and „Jak to działa”; „Sprawdź wiadomość” opens a field for text plus an optional link, and „Dalej” leads to the same preview used for selections | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-10 manual paste for unsupported selections: a selection inside an iframe (fields.html #ramka) leads to the menu, and „Sprawdź wiadomość” lets the child paste it by hand | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-12 paste buffer: text and link typed in the paste view are kept in the in-memory store as they are typed; closing the window, hiding the avatar or going back to the menu keeps them, the next avatar click without a selection or draft reopens the paste view with them, and the document reset (reload, navigation, Back) clears them | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-11: „Jak to działa” shows three numbered steps (Zaznacz wiadomość, którą chcesz sprawdzić. / Kliknij mnie. / Sprawdź tekst i zatwierdź.) and the sentence „Widzę tylko to, co mi pokażesz. Zatwierdzoną sprawę zobaczy Twój opiekun.” | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-13: a window opened on tab A is not shown on tab B, and on returning to tab A the window and its text are exactly as they were | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-02/D-03 via paste: an approved pasted message produces exactly one case with origin 'paste' and the typed link, and nothing is sent before „Zatwierdzam” | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | D-15/D-16: the hide badge, menu, paste and how-it-works views use palette tokens and px units, and all their copy comes from STRINGS | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | Edge WID-01 adjacency: a pointer gesture of at most 5 px between pointerdown and pointerup is a click (opens the window and reads the selection once); more than 5 px is a drag (moves the avatar, opens nothing, reads nothing); an avatar dragged onto or past a viewport edge stops 8 px inside it, and the window next to it flips and clamps so it never leaves the viewport | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | Edge WID-01 empty: on a page whose body is empty the avatar still mounts as a child of document.documentElement, and running the content script a second time in the same document (toolbar-icon fallback injection) leaves exactly one bezpieczna-aura-widget element: the same element when the first instance is live, a new one when it is orphaned or foreign | VERIFIED | presence/panel + avatar/menu E2E |
| 01-03 | Edge WID-01 ordering: the menu always renders its two buttons in the fixed order „Sprawdź wiadomość” then „Jak to działa”, and „Jak to działa” always renders its three steps in the order zaznacz, kliknij, sprawdź i zatwierdź, followed by the privacy sentence | VERIFIED | presence/panel + avatar/menu E2E |
| 01-04 | D-12: the draft (unapproved, edited text and link) survives closing the window and hiding the avatar within the same tab and comes back on the next avatar click; reloading the page, navigating to another page in the tab and coming Back each clear it | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | D-12 bfcache proof: the Back test runs with Playwright's default --disable-back-forward-cache switch removed (ignoreDefaultArgs), asserts that the page fired pageshow with persisted === true (a real bfcache restore), and only then asserts that the draft is gone | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | D-03 late answers: an approval answer that arrives after pagehide (document reset) neither shows „Gotowe!” nor changes the new state, because resetForNewDocument bumps the generation token from plan 01-02 | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | D-12: nothing about the draft reaches disk: chrome.storage is undefined in the service worker (no storage permission), and the page's localStorage and sessionStorage stay empty while a draft exists | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | D-17: when a draft exists and the child selects new text and clicks the avatar, the draft returns unchanged and a „Wstaw nowe zaznaczenie” button appears; only that button replaces the draft with the new selection (it is disabled while an approval is pending); a selection identical to the draft shows no button | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | Discretion (SPA): history.pushState navigation within the same document (a Discord channel switch) keeps the draft; only reload or a document change clears it | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | Discretion (link): a selection containing an http(s):// or www. URL pre-fills the link field with the first such URL, taken from the selected text only (never from page hrefs) with trailing punctuation removed; the child can edit or clear it | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | D-03/Pitfall 5: a failed send (e.g. „Extension context invalidated.”) keeps the draft and shows „Coś poszło nie tak. Odśwież stronę i spróbuj jeszcze raz.”, never the confirmation | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | Edge WID-02 empty: an empty, whitespace-only or NBSP-only selection opens the menu instead of a preview; a single visible character opens the preview with that character; buildCase throws Error('empty') for empty or whitespace-only content; „Zatwierdzam” and „Dalej” stay disabled while the text is empty or whitespace-only, so no 'aura/case-approved' message ever carries empty content | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | Edge WID-02 encoding: length is counted in Unicode code points; content longer than 2000 code points is cut to exactly 2000 code points without leaving a lone surrogate, sets truncated: true and shows the „Wiadomość była bardzo długa…” notice; U+00A0 becomes a normal space; Polish diacritics and emoji (fixture #msg2 „Cześć! Jutro o 17:00 gramy w Minecrafta, będziesz? 🙂”) reach case.content unchanged; no NFC/NFD normalization is applied | VERIFIED | draft/content + draft/content E2E and README |
| 01-04 | D-05/D-18: widget/README.md explains how to load widget/dist unpacked in Google Chrome and holds the pre-demo checklist for Discord in the browser (including composer selection, the real toolbar click on an uninjected tab and recovery after an extension reload); the end-of-phase manual walkthrough runs in Google Chrome | HUMAN NEEDED | draft/content + draft/content E2E and README |
| 01-04 | D-04: at phase end the full Vitest suite (including no-background-reading and source-scan) and the full Playwright suite pass | VERIFIED | draft/content + draft/content E2E and README |

## Required Artifacts

28/28 declared artifacts exist and are substantive. No stub UI or network backend is claimed; phase 1 intentionally ends at the service-worker seam.

## Key Links

Avatar click → captureSelection → draft preview; approve → buildCase → beginSubmit token → submitCase → validated worker response; hide/toolbar MSG_SHOW acknowledgement; live-host ping → replace orphan; menu/paste/howto handlers → store transitions; pending button → insertPendingSelection; pagehide → resetForNewDocument; selected text → extractFirstLink. All wired and exercised by the indicated tests.

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| WID-01 | Implemented, final Chrome UAT pending | avatar/presence/menu/tracer |
| WID-02 | Implemented, final Discord UAT pending | capture/draft/paste/approval/source guards |

## Original Human Verification (four prior passes retained)

1. **Google Chrome: wygląd i obecność rekina** — Załaduj widget/dist przez chrome://extensions. Na zwykłej stronie i Discordzie rekin jest ostry, ma poprawne kolory, nieuciętą płetwę, nie zasłania kompozytora; przeciąganie, chowanie i powrót działają.

2. **Discord: podgląd, klawiatura i zaznaczenie kompozytora** — Na fikcyjnym koncie przejdź kroki 4–5 README: tylko zaznaczony fragment i hostname discord.com, informacja dla opiekuna, edycja nie trafia do kompozytora i nie uruchamia skrótów; fragment wpisanego zdania przechodzi dokładnie bez wysłania wiadomości; zatwierdzenie daje neutralne Gotowe!.

3. **Discord: zmiana kanału i przeładowanie** — Szkic zostaje po zmianie kanału, a znika po przeładowaniu dokumentu; menu wraca przy pustym zaznaczeniu.

4. **Prawdziwa ikona: nieziniektowana karta i przeładowanie rozszerzenia** — Przejdź kroki 7–8 README: prawdziwe kliknięcie ikony na karcie otwartej przy wyłączonym rozszerzeniu montuje rekina; po przeładowaniu rozszerzenia bez odświeżenia karty zostaje jeden działający rekin i zatwierdzenie działa.

5. **Język i ton dla dzieci 9–13** — Wszystkie widoki są po polsku, przyjazne, bez straszenia i zawstydzania. Jak to działa zawiera trzy uporządkowane kroki i zdanie o prywatności.

Phase remains pending until 01-UAT.md passes. No phase.complete or next-phase advancement executed.

## Historical re-verification after 01-05 (form hiding superseded)

All five plans and summaries were cross-checked against actual source and the full current test run. Original phase proof and accepted limitations remain valid; previous Chrome/Discord UAT has four user-confirmed passes. Only G-01-2 needs another user visual check. The two older HUMAN NEEDED rows above are supported by the prior UAT and retained as historical automatic-proof limits.

| Gap-plan truth | Status | Current evidence |
|---|---|---|
| Paste/preview hide shark and badge while keeping panel usable, including pending/error | VERIFIED | presence integration lifecycle and deferred submit tests; Chromium form and selected-preview tests |
| Close and Escape restore position and retained draft | VERIFIED | both Chromium close variants, draft E2E and presence integration |
| Menu/howto/confirmation and manual hide/toolbar restore retain behavior | VERIFIED | presence integration, selected-confirmation E2E and existing restore suite |
| Hidden anchor and resize maintain panel bounds | VERIFIED | exact pre-hide anchor equality, panel right-edge alignment and resized viewport checks |

Artifacts: all four 01-05 artifacts exist and are wired. main.render invokes avatar.setFormOpen before panel.render; panel.place continues using avatar.rect. WID-01 and WID-02 are implemented and tested; final requirement completion stays pending the visual retest.

### Test Quality Audit

New presence integration tests exercise main.js and deferred submission. New avatar E2E tests use an actual loaded extension, value/behavior assertions, conserved geometry and twelve Tab steps. No skipped/todo tests or generated circular expectations were found. The old capture-phase focus-stealing test is an explicit expected failure, not proof of full isolation. Full Vitest: 38 pass / 8 files. Full Playwright: 38 pass, including that declared expected failure. Build passes.

### Decision Coverage

18/18 trackable CONTEXT decisions honored; advisory query returned no missing decisions. G-01-2 implements the clarified form-only visibility decision without changing capture or draft persistence.

### Packaging

`/workspace/artifacts/bezpieczna-aura-widget-phase1-gap-01-05.zip`: 7 files; manifest.json at archive root; CRC validation passes. SHA256: 12025ea974c05cf4d336821981a67fc18c20e8235f6a2d2c138f56ca21e73bf8.

Status remains human_needed solely for the updated G-01-2 visual retest; Phase 1 is not marked complete.

## Current re-verification after 01-06

Goal remains accepting selected or pasted content through deliberate interaction. WID-01 and WID-02 are accounted for by all six PLAN/SUMMARY frontmatters and current source/tests; requirements remain pending final human acceptance. Prior four UAT passes are preserved. User's latest instruction replaces form hiding with a visible draggable shark and a panel that follows it. Older visibility-specific rows above are historical; they do not describe the current build. Verification performed inline under Codex skill adapter, not by an independent subagent.

| Current 01-06 truth | Status | Evidence |
|---|---|---|
| Drag moves open window in every view | VERIFIED | Five browser tests assert matching avatar/panel movement at three points before pointerup; menu/howto/paste/preview/confirmation |
| Shark stays visible and interactive in paste/preview | VERIFIED | Updated presence integration covers pending/error/confirmation; browser visibility and Tab reachability |
| Movement retains inputs, text/link, caret and focus; no selection capture or send | VERIFIED | Browser node identity, values, selectionStart/End and activeElement assertions; unit movement/capture counters; edge test with new page selection and worker message count |
| Window and handle remain reachable at edges and resize | VERIFIED | Four-edge browser bounds and shadow-root hit test, resized viewport checks and pointercancel recovery |

### Artifact and wiring verification

All three 01-06 declared artifacts exist and are substantive. avatar.moveTo updates host styles, then calls onMove with live rect. main.placePanel checks open/non-hidden state and calls panel.place without panel.render or draft mutation. The removed setFormOpen API has no remaining source references. Callback cannot fire during avatar construction. Previous capture/consent/privacy paths remain intact and full regression suite passes.

### Test Quality Audit

- Full Vitest: 38 pass in 8 files. Full Playwright: 45 passed (44 ordinary passes plus one existing declared expected capture-phase focus-stealing failure). Build passes.
- New tests assert actual extension geometry, node identity and editing state; expectations use specified movement deltas and fixed viewport bounds, not generated snapshots. No skipped/todo requirement tests found.
- First browser run read old coordinates before resize delivery; test now waits for re-clamping. Isolated retest and final full suite pass.
- Manual visual acceptance in Google Chrome/Discord remains pending; automated tests do not count as that acceptance.

### Decision Coverage

18/18 trackable CONTEXT decisions honored; no missing decisions reported. D-07/D-08/D-12 preserved. The latest user instruction is the explicit override for historical 01-05 hiding.

### Code review and security

Standard inline review found no new critical/warning/info issues. Prior WR-01/WR-02 remain fixed and their disposition ledger is preserved. Existing SECURITY.md has threats_open: 0; no capture, permission, storage, dependency, network or sender-validation change.

### Advisory (New Scope, Unevidenced)

None.

### Packaging

`/workspace/artifacts/bezpieczna-aura-widget-phase1-gap-01-06.zip`: seven files, root manifest, CRC valid and all manifest-referenced scripts/icons present. SHA256: `26d16a44a66b9824a5be4b6d5806a1419655b3f59c02aff27fd394ed1b3bce65`.

Status remains human_needed solely for G-01-2-drag visual retest. Phase completion and advancement have not run.
