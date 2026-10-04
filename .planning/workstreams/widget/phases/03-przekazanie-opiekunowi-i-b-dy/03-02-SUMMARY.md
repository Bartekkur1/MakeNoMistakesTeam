---
phase: 03-przekazanie-opiekunowi-i-b-dy
plan: "02"
subsystem: widget
tags: [chrome-extension, mv3, report-send, send-preview, honest-outcomes, privacy, demo-retirement]
requires:
  - phase: 03-przekazanie-opiekunowi-i-b-dy
    provides: "03-01 worker-only transport: readSessionStatus, openLogin, submitReport, readReportOutcome, clearReportOutcome, saved-row validation and volatile outcome cache"
  - phase: 02-cie-ka-sprawdzania
    provides: "Approved cases, local checking, result view and lifecycle/stale-operation guards"
provides:
  - Canonical four-field report projection (proposeAttackType, sourceFromCase, buildReportPayload)
  - Case-bound send preview state, send transactions, sent marker and session-status tracking in the draft store
  - Pokaż opiekunowi → Sprawdź, co wyślesz → Wyślij flow with editable attack/actions/source and the exact wire content
  - Saved-object-only confirmation (Wysłano do / Godzina wysłania / Status) and fixed offline/http/unknown/no-account/context alerts
  - Centralized aura/* protocol constants; demo guardian request protocol removed
  - onMyReports navigation contract (placeholder view; list rendering in 03-03)
affects: [widget-03-03, widget-phase-3-uat]
actuals:
  tokens: 22180
  tasks: 3
  commits: 3
plan_head_before: 30a0b05ec870c5349517dee468bab92887afba20
plan_head_after: d87ad1f3ec142f5c6a96562d7278f03fadd8de48
tech-stack:
  added: []
  patterns: [frozen-reviewed-payload, case-id-and-send-generation-guards, recipient-snapshot-revision-check, lazy-session-status-on-visible-result, saved-object-only-confirmation, worker-scoped-fetch-stub-in-e2e]
key-files:
  created: []
  modified:
    - projects/widget/src/core/case.js
    - projects/widget/src/core/draft.js
    - projects/widget/src/core/messages.js
    - projects/widget/src/core/integration.js
    - projects/widget/src/background/sw.js
    - projects/widget/src/content/main.js
    - projects/widget/src/ui/panel.js
    - projects/widget/src/ui/strings.pl.js
    - projects/widget/src/ui/widget.css
    - projects/widget/tests/unit/guardian-request.test.js
    - projects/widget/tests/unit/draft.test.js
    - projects/widget/tests/unit/panel.test.js
    - projects/widget/tests/e2e/check.spec.mjs
    - projects/widget/tests/e2e/avatar.spec.mjs
    - projects/widget/tests/e2e/tracer.spec.mjs
key-decisions:
  - "D-05/D-06: the wire body is exactly attack_type, taken_actions, source, content; content is case.content plus '\\n\\nLink: ' + link, with no second normalization between preview and JSON."
  - "Attack proposal priority: password/code → data_request, prize → fake_prize, payment → purchase_trap, claims_organization → impersonation, message_link → phishing, otherwise other. Unknown answers or a URL alone do not select a category."
  - "Source mapping only for origin=selection with suffix-boundary host matching (discord, roblox→game, listed webmail→email); paste and everything else → other; SMS is manual."
  - "The send button locks before the local session re-read; a changed account/revision fails the send, updates the recipient and requires another explicit Wyślij."
  - "Once submitReport is invoked, a lost runtime reply is reconciled via readReportOutcome and otherwise shown as unknown; it is never resent automatically."
  - "Confirmed send survives unchanged reapproval and answer correction; result then leads back to confirmation, and the same case cannot be sent twice."
  - "Session status is read lazily on entering/reopening result or preview, never on content boot or question renders."
requirements-completed: [HND-01, ERR-01]
coverage:
  - id: D1
    description: "Exact four-field payload, proposal priority and host-boundary source mapping."
    requirement: HND-01
    verification:
      - kind: other
        ref: "Task 1 SEND_TRACER_SOURCE_OK source check; case.js inspection"
        status: pass
      - kind: e2e
        ref: "tests/e2e/check.spec.mjs#guardian demo request reaches confirmation (exact body incl. appended Link)"
        status: pass
    human_judgment: true
    rationale: "No new unit tests for the projection (widget no-new-tests policy); webmail/discord/roblox mapping and caps need a manual check."
  - id: D2
    description: "Preview before send, one Bearer POST, saved-object-only confirmation with recipient and server HH:MM."
    requirement: HND-01
    verification:
      - kind: e2e
        ref: "tests/e2e/check.spec.mjs#guardian demo request reaches confirmation; #guardian demo sends the corrected result using Enter/Space"
        status: verified
      - kind: unit
        ref: "tests/unit/guardian-request.test.js, draft.test.js, panel.test.js (125 tests)"
        status: pass
    human_judgment: true
    rationale: "Enter/Space scenarios had a test timing race (see Issues); fixed by the orchestrator with expect.poll, now 18/18 repeated and 24/24 full."
  - id: D3
    description: "Editable six radios / compatible checkboxes / source select; illegal actions dropped; focus preserved; controls disabled with aria-busy during send."
    verification:
      - kind: unit
        ref: "tests/unit/panel.test.js, tests/unit/draft.test.js"
        status: pass
    human_judgment: true
    rationale: "Focus, 280px layout and drag reachability are visual/keyboard judgments for Chrome."
  - id: D4
    description: "Offline/503, HTTP, unknown, no-account and context outcomes render fixed copy, keep selections and never confirm or auto-retry."
    requirement: ERR-01
    verification:
      - kind: unit
        ref: "tests/unit/guardian-request.test.js, tests/unit/draft.test.js"
        status: pass
    human_judgment: true
    rationale: "Real fault injection (offline, 503, 400/413/500, 15s timeout, malformed 2xx) is a manual worker DevTools check."
  - id: D5
    description: "Demo guardian protocol retired; constants centralized; no handler can acknowledge the old request."
    verification:
      - kind: unit
        ref: "npm --prefix projects/widget test -- tests/unit/guardian-request.test.js tests/unit/source-scan.test.js (Task 3 gate)"
        status: pass
    human_judgment: false
  - id: D6
    description: "Inherited capture/check/tracer browser flows remain local-only (assertOnlyLocal) with no session status on boot."
    verification:
      - kind: e2e
        ref: "npm --prefix projects/widget run test:e2e -- tests/e2e/check.spec.mjs tests/e2e/tracer.spec.mjs (all non-send scenarios)"
        status: pass
    human_judgment: false
duration: 31min
completed: 2026-10-04
status: complete
---

# Phase 3 Plan 02: Reviewed report send with honest outcomes Summary

**The child now goes from result to Pokaż opiekunowi, reviews the exact four-field report and the parent's name in an editable preview, and explicitly clicks Wyślij to send one authenticated POST. A confirmation appears only for a validated saved report. Offline, HTTP, uncertain, no-account and reload failures each show their own fixed Polish alert, keep the child's choices and never retry automatically. The demo guardian protocol is gone.**

## Performance

- Codex driver: 05:09:50 to 05:34:05 local time (+0200) for the three task commits, about 24 minutes. A Claude executor spent another ~7 minutes on verification and this SUMMARY, 05:44 to 05:50.
- Tasks: 3/3. Files: 15 (9 source, 6 existing test files). Diff: +729 / −383 lines.
- Actual estimate: 88,718 changed-line characters / 4 = 22,180 tokens (plan estimate 31,000). This counts diff size, not model usage, and excludes this SUMMARY.

## Accomplishments

- **Projection (`case.js`).** `proposeAttackType` follows the planned priority and looks only at local answers and result signals. `sourceFromCase` matches hostname suffixes on label boundaries (`discord.com.evil.example` → other) and maps only selections. `buildReportPayload` builds a frozen body with exactly `attack_type, taken_actions, source, content`. It imports canonical enums and limits from `web-app/src/lib/contract/types.ts`, keeps actions unique and in `TAKEN_ACTIONS` order, and enforces the code-point cap, unpaired-surrogate/NUL rejection and the UTF-8 body-size limit.
- **Draft store (`draft.js`).** New methods: `openSendPreview`, `setSendAttackType`, `toggleSendAction`, `setReportSource`, `backFromSendPreview`, `showMyReports`, `beginReportSend`, `reportSent`, `reportFailed` and `setSessionStatus`. Each approved changed case gets its own `case_id`. A send token freezes `request_id`, generation, expected account/revision, recipient and payload. `reportSent` checks the saved report again (exact fields, UUIDs, UTC dates, `pending_parent`, matching parent and payload) before writing `sentReport`. The proposal is computed only once, and overrides survive Back, close and errors.
- **Controller (`main.js`).** Nine new handlers replace `onRequestGuardianVerification`. The send locks before the local session re-read. An account or revision mismatch fails the send and updates the recipient. When the runtime reply is lost after dispatch, the controller reconciles through `readReportOutcome` and shows unknown if that fails. Session status is read only when result or preview is entered or reopened. pagehide and replacing the case clear the worker outcome and invalidate in-flight reads.
- **Panel (`panel.js`, `widget.css`, `strings.pl.js`).** The `sendPreview` view shows the heading, Do + display_name, a read-only `.sent-content` box (pre-wrap, max-height 160px, scrolls), six radios in canonical order with a proposal badge, compatible checkboxes, the source select and the privacy sentence. While sending, the view shows Wysyłam… with `aria-busy`, every control disabled except close, and focus on close. Confirmation shows "Wysłano do", "Godzina wysłania" (Intl pl-PL time taken from `report.created_at`), "Status: Czeka, aż rodzic zobaczy", and Zamknij/Sprawdź nową wiadomość. Alerts use crimson or amber tints. The D-11 no-account notice shows Otwórz logowanie. All copy lives in `strings.pl.js`, including the corrected guardianNotice/howTo/privacy texts.
- **Protocol (`messages.js`, `integration.js`, `sw.js`).** The seven `MSG_AUTH_*`/`MSG_SESSION_STATUS`/`MSG_OPEN_LOGIN`/`MSG_REPORT_*` constants keep the 03-01 wire spellings. Removed: `MSG_GUARDIAN_REQUEST`, `requestGuardianVerification`, the demo listener, `guardianRequests` debug memory and the demo-only `isValidResult` validator.
- **Browser scenarios.** The existing handoff scenarios install a worker-scoped `fetch` stub and seed a canonical session. They then check preview-before-send, exactly one Bearer POST with the exact four-field JSON, and saved-object confirmation. `assertOnlyLocal` stays strict for every scenario.

## Task Commits

Codex driver commits, oldest first:

1. **Task 1: Result → exact preview → authenticated POST → confirmation** (`370d645`, feat). Projection, draft send state, controller handlers, read-only preview and confirmation, all final copy.
2. **Task 2: Editable preview, outcome views, focus/layout and affected tests** (`81b658b`, feat). Native radios/checkboxes/select, alert/recovery controls, focus rules, styling, and migration of existing guardian/draft/panel unit cases.
3. **Task 3: Retire the demo protocol and migrate browser handoff checks** (`d87ad1f`, feat). Protocol constants, demo removal, e2e worker stub and focus updates.

## Deviations from Plan

1. **[Process] The SUMMARY was written by a Claude executor, not the Codex executor.** Codex hit its usage limit after the Task 3 commit (driver: "codex gave no valid request 3 turns in a row", 05:34:48). The Claude executor ran the plan-level verification and wrote this SUMMARY. It changed no product code or tests.
2. **[Rule 1 - Bug] `tests/e2e/tracer.spec.mjs` updated outside `files_modified`** (Codex, Task 3). One outdated privacy literal from the old demo copy was replaced; every guard stays. The plan's verification command names this file.
3. **[Rule 3 - Blocking] Result-drag scenario viewport** (Codex, Task 3). The existing result-drag scenario in `check.spec.mjs` starts with a taller viewport because the no-account block is now larger. Exact movement assertions and the separate 280px edge coverage are unchanged.
4. **[Observation] `account-changed` failure kind.** A changed recipient detected at send time is stored as its own failure kind. It has no dedicated copy and shows the generic "Nie wysłano" alert, with the Do line updated to the new account and Wyślij required again. This meets the "no send to an unreviewed parent" truth, but the wording should be checked manually.

## Issues Encountered

- **Intermittent e2e failure: a test timing race, not a product failure.** The plan command `npm --prefix projects/widget run test:e2e -- tests/e2e/check.spec.mjs tests/e2e/tracer.spec.mjs` ran twice and **exited 1 both times, with 23/24 passing**. The failing scenario was "guardian demo sends the corrected result using Space" on the first run and "…using Enter" on the second. In a `--repeat-each 6` run of the three handoff scenarios, 17/18 passed. In isolated reruns of the Space scenario, 2 of 3 passed. Codex reported 24/24 at commit time. **Resolved by the orchestrator:** `expectSavedReport` now waits with `expect.poll` for the single stubbed request before asserting it; afterwards `--repeat-each 6` gave 18/18 and the full plan command 24/24.
  - Cause: `expectSavedReport` in `check.spec.mjs` reads `self.__reportApiStub.requests` once with a plain `expect(...).toHaveLength(1)`, right after the key press. It does not wait for the worker to reach the stubbed `fetch` (content → runtime message → local session re-read → fetch). In both failure traces the last DOM snapshot shows `Wysyłam…` with `aria-busy="true"`, so the key press did start exactly one send that was still in flight.
  - Not fixed, per the orchestrator's instructions not to change tests. A minimal fix would poll before the one-shot checks, e.g. `await expect.poll(() => serviceWorker.evaluate(() => self.__reportApiStub.requests.length)).toBe(1)` at the top of `expectSavedReport`. This needs an orchestrator/user decision.
- Playwright `test-results/` is git-ignored. The worktree stayed clean after the runs.
- No external service was contacted. Every send in the automated tests went to the worker-scoped stub.

## Known Stubs

| File | Line | Reason |
|------|------|--------|
| `projects/widget/src/ui/panel.js` | ~100-102 | The `myReports` view shows only the "Moje zgłoszenia" heading and Wróć. List data and rendering come in **03-03** as planned. The `onMyReports`/`showMyReports` navigation contract is final. |

## Test Policy

No new automated test file, case or scenario was added, and there was no RED/TDD step or package install. Only existing cases broken by the demo replacement were migrated:

| File | Update |
|------|--------|
| `tests/unit/guardian-request.test.js` | Demo sender/controller assertions now check the exact DTO, account/case/request identity and saved-report semantics. Malformed-envelope and foreign-sender coverage is kept. |
| `tests/unit/draft.test.js` | Double-submit, failure/retry, closed/hidden pending, reset and stale-reply cases now go through `sendPreview`/`reportSent`/`reportFailed`. |
| `tests/unit/panel.test.js` | Review fields, and confirmation shown only from a saved object. |
| `tests/e2e/check.spec.mjs` | Scoped worker fetch stub and session seed, exact POST assertions; scenario name "guardian demo request reaches confirmation" kept for `--grep`. |
| `tests/e2e/avatar.spec.mjs`, `tests/e2e/tracer.spec.mjs` | Result focus target now Pokaż opiekunowi / Otwórz logowanie; one privacy literal. |

Paths are relative to `projects/widget/`.

| Command | Result |
|---------|--------|
| `npm --prefix projects/widget run build` | PASS (Tasks 1-2 and final) |
| `npm --prefix projects/widget test -- tests/unit/guardian-request.test.js tests/unit/draft.test.js tests/unit/panel.test.js` | PASS, 3 files, 125 tests (final) |
| `npm --prefix projects/widget run test:e2e -- tests/e2e/check.spec.mjs tests/e2e/tracer.spec.mjs` | PASS 24/24 after orchestrator fix (was 23/24 flaky before it) |
| `… test:e2e -- tests/e2e/check.spec.mjs --grep "guardian demo" --repeat-each 6` | 18/18 after fix (17/18 before) |
| Task 1 `node -e` source check | PASS `SEND_TRACER_SOURCE_OK` (Codex) |
| `npm --prefix projects/widget test -- tests/unit/check.test.js tests/unit/no-background-reading.test.js` | PASS (Codex, Task 1) |
| `… test:e2e -- tests/e2e/check.spec.mjs --grep "guardian demo request reaches confirmation"` | PASS 1/1 (Codex, Task 3) |
| `npm --prefix projects/widget test -- tests/unit/guardian-request.test.js tests/unit/source-scan.test.js` | PASS 50/50 (Codex, Task 3) |
| `… test:e2e -- tests/e2e/avatar.spec.mjs` | PASS 19/19 (Codex, extra affected run) |

## Manual Verification Checklist

Use Google Chrome, fictional content only, and a local backend or worker DevTools overrides. Never send to the live demo backend. Account: **Mama Oli (demo)**, `rodzic.ola@bezpiecznaaura.example`, code `0000`.

1. **Task 1 human-check, happy path.** Reload unpacked `projects/widget/dist` and log in as Mama Oli on the options page. On a test page, paste "Gratulacje! Wygrałeś skina, odbierz nagrodę: https://nagroda-demo.example/odbierz" and click Zatwierdzam. Answer the questions (request: "Odebrania darmowej nagrody"). Open worker DevTools → Network: approval, questions and result make **no** report POST.
2. On the result, Pokaż opiekunowi sits above navigation and has focus. Click it. "Sprawdź, co wyślesz" shows "Do: Mama Oli" and content ending exactly `\n\nLink: https://nagroda-demo.example/odbierz`. The proposed radio is "Fałszywa nagroda lub konkurs" with its badge, no checkbox is selected, and the source select shows "Inne". Still no POST.
3. Choose **other**, tick every action, then choose **phishing**: disallowed checkboxes disappear immediately and focus stays on the phishing radio. Change the source to SMS.
4. Double-click **Wyślij**. Exactly one POST `/api/reports` with a Bearer header and only the four keys, whose values match the preview. During sending: Wysyłam…, `aria-busy`, all controls disabled, close enabled. Then confirmation shows "Wysłano do: Mama Oli", "Godzina wysłania: HH:MM" matching the response's `created_at`, "Status: Czeka, aż rodzic zobaczy", Zamknij focused and Sprawdź nową wiadomość. The parent panel shows the matching record.
5. Close and reopen the helper: confirmation is restored. Use Popraw odpowiedzi to change an answer: the result returns to confirmation and **no** second POST occurs.
6. **While pending.** Delay the response (local backend or a worker `fetch` override), close the panel mid-send and reopen it: Wysyłam… or the final outcome is restored, the panel does not open by itself on completion, and no extra POST occurs.
7. **Failures, one at a time.** Simulate known offline before dispatch, 503 `storage_unavailable`, 400/413/500, a 15 s delay (abort at 15000 ms), 204 and malformed or mismatched 2xx. Expected: "Nie wysłano — brak połączenia" (offline/503), "Nie wysłano" (HTTP), "Nie wiemy, czy dotarło" with Moje zgłoszenia + Wyślij jeszcze raz (timeout/malformed/204). Selections stay, focus is on retry, and there is no background resend. A retry happens only on another click.
8. **Account.** With the preview open, log out in options and return: the no-account notice with Otwórz logowanie appears, and Wyślij is gone. Log in as Tata Kuby: the Do line changes to the new name and nothing is sent until Wyślij is clicked again. Repeat with the account change happening between opening the preview and clicking Wyślij: the send fails with "Nie wysłano", the recipient updates, and no POST goes to the unreviewed parent.
9. **Logged out from the start.** Pokaż opiekunowi is replaced by the exact no-account notice and Otwórz logowanie. Local checking still works.
10. **Layout at 280px.** Paste a 2000-character message with a 2048-character link and a long recipient name. The content box scrolls within 160px, the recipient wraps with no horizontal scroll, radios/checkboxes/select scroll inside the panel, and Wyślij can be reached after dragging the tall preview to every edge.
11. **Extension reload.** Reload the extension from chrome://extensions with the preview open, then click Wyślij: "Nie wysłano" with the reload-page copy and Wróć, and no confirmation.
12. **Moje zgłoszenia.** The button in the unknown alert only opens a placeholder view with Wróć. Checking the list itself is **deferred to 03-03** and is not claimed here.

Also carry over steps 12-13 from the 03-01 checklist (renewal before POST, single 401 replay, shared renewal across tabs, worker restart) now that the child send UI exists.

## Next Phase Readiness

- **03-03 dependency.** The Moje zgłoszenia list (data from `GET /api/reports`, rendering, the two-button menu change, and checking the unknown-delivery item before retrying) is handled by 03-03. `onMyReports`/`showMyReports` and the `myReports` view are ready for it.
- The flaky e2e handoff assertion was resolved by the orchestrator (expect.poll in `expectSavedReport`); no open test issue remains.
- STATE.md, ROADMAP.md and REQUIREMENTS.md were not touched; the orchestrator owns them. The branch stays unmerged for Chrome review.

## Self-Check: PASSED

The three task commits `370d645`, `81b658b` and `d87ad1f` are reachable from HEAD in task order on `worktree-agent-p0302-codex-1791083385`. Every listed modified file exists. Build and the targeted unit suites pass. The plan's e2e verification command exits non-zero intermittently because of the test timing race described above. It is reported openly here and not counted as a pass. This self-check covers the integrity of the artifacts and commits only. It does not mark the flaky e2e gate or any manual Chrome judgment as passed.
