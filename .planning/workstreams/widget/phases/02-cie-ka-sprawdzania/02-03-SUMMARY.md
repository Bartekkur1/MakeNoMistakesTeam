---
phase: 02-cie-ka-sprawdzania
plan: "03"
subsystem: widget
tags: [chrome-extension, transactional-editing, session-resume, privacy, vitest, playwright, bfcache]
requires:
  - phase: 02-cie-ka-sprawdzania
    provides: "02-02 approved checking sessions, keyed rules, deliberate questions and credential discrepancies"
provides:
  - Correctable results with retained unrelated choices and recomputed output
  - Transactional content editing and selection replacement committed only after local approval
  - Five-step session resume with candidate preservation and stale-response guards
  - Real-browser tab, document, bfcache and question/result drag evidence
  - Google Chrome lifecycle and correction demo checklist with honest limitations
affects: [widget-phase-2-uat, widget-phase-3, shared-content-review]
actuals:
  tokens: 20550
  tasks: 3
  commits: 6
commits: 6
plan_head_before: eaf004bf73f6c2d8ad9f1f18f2aaf8fa8cb7d41e
plan_head_after: 0143d741f1f277e712c3d84d0a0953be5bc982c7
tech-stack:
  added: []
  patterns: [approved-session-candidate-transaction, normalized-reapproval-comparison, saved-resume-step, geometry-only-drag]
key-files:
  created:
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-03-T1-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-03-T2-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-03-T3-RED.json
  modified:
    - projects/widget/src/core/draft.js
    - projects/widget/src/content/main.js
    - projects/widget/src/ui/panel.js
    - projects/widget/src/ui/strings.pl.js
    - projects/widget/tests/unit/draft.test.js
    - projects/widget/tests/unit/approve.test.js
    - projects/widget/tests/unit/panel.test.js
    - projects/widget/tests/e2e/check.spec.mjs
    - projects/widget/tests/e2e/draft.spec.mjs
    - projects/widget/tests/e2e/avatar.spec.mjs
    - projects/widget/README.md
key-decisions:
  - "The active approved check and optional edit/replacement candidate have separate ownership; only approved(token, case) commits replacement."
  - "Compare normalized content and link, ignoring timestamps: unchanged reapproval resumes the exact old session; either changed field resets it."
  - "An existing candidate takes precedence on reopening and retains its edits and submission error; captures cannot silently replace it."
  - "Approved checks use Sprawdź nowe zaznaczenie; unapproved Phase 1 drafts retain Wstaw nowe zaznaczenie."
  - "Dragging changes geometry only and preserves actual control nodes and focus; resizing may recreate controls."
  - "No packages, permissions, persistence, network sending, shared materials or assets were changed."
requirements-completed: [CHK-01, CHK-02, CHK-03]
coverage:
  - id: D1
    description: "Back and result correction retain choices; edited answers invalidate and recompute signals, unknowns and the main action."
    requirement: CHK-02
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#result correction and text reapproval preserve cancellation and reset the approved session"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#credential discrepancy retain preserves the warning through the real controller"
        status: pass
    human_judgment: false
  - id: D2
    description: "Editing copies approved content; cancellation/failure preserve the old check, changed text or link resets after approval, and unchanged reapproval resumes."
    requirement: CHK-01
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#result correction and link-only reapproval preserve cancellation and reset the approved session"
        status: pass
      - kind: integration
        ref: "npm --prefix projects/widget test -- tests/unit/approve.test.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "Safety, sender, request, verify and result resume after close/hide; captured replacement previews preserve progress until successful approval."
    requirement: CHK-01
    verification:
      - kind: unit
        ref: "npm --prefix projects/widget test -- tests/unit/draft.test.js tests/unit/panel.test.js"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#captured replacement resumes Q2 then cancels without loss and commits only on approval"
        status: pass
    human_judgment: false
  - id: D4
    description: "Tab and same-document navigation preserve choices; reload, new documents and genuinely cached Back navigation clear answers, results and candidates."
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#tab switch and same-document navigation preserve Q2 choices without transferring the panel"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#reload and document navigation clear approved answers and an unfinished edit"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/draft.spec.mjs#Back clears an approved result with edit session in a genuinely cached document"
        status: pass
    human_judgment: false
  - id: D5
    description: "Question/result panels follow the visible shark during drag without rebuilding controls, moving focus, losing choices, recapturing or submitting; controls remain reachable at 280px."
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/avatar.spec.mjs#open question follows avatar throughout drag without rebuilding or submitting"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/avatar.spec.mjs#open result follows avatar throughout drag without rebuilding or submitting"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/avatar.spec.mjs#open result stays reachable at edges and after resize without recapturing or submitting"
        status: pass
    human_judgment: false
  - id: D6
    description: "README covers all five fictional scenarios, correction, link-only edit, selection consent, lifecycle and drag while preserving local-only and capture-limit disclosures."
    requirement: CHK-03
    verification:
      - kind: other
        ref: "Node README acceptance assertions for five scenarios, Q1/Q2/Q3, correction, link-only reapproval, selection consent, tab/bfcache, live drag and guardian/capture limitations"
        status: pass
      - kind: e2e
        ref: "npm --prefix projects/widget run test:e2e"
        status: pass
    human_judgment: false
  - id: D7
    description: "Child-friendly tone, readable controls and understandable limitations in Google Chrome on fictional Discord messages."
    verification: []
    human_judgment: true
    rationale: "Person 4 and phase-end UAT must judge tone, actual Chrome presentation and future-guardian wording; automated matches do not establish UX adequacy."
duration: 26min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 03: Interruptible and correctable checking Summary

**Approved checking now resumes deliberate choices, supports reversible content previews and answer correction, and replaces a session only after successful approval of changed text or link, with real-browser lifecycle and drag evidence.**

## Performance

- First driver RED timestamp: 2026-10-03T21:12:50.207Z; final verification completed by 2026-10-03T21:38:31Z.
- Duration: approximately 26 minutes from the first driver RED through final verification; preparatory reads are not timed.
- Tasks: 3/3; product files modified: 11; driver RED records: 3.
- Measured actuals: 82,199 realized diff characters divided by four, rounded up, across the six accepted task commits including RED records. The subsequent SUMMARY commit is excluded from these measurements.

## Accomplishments

- Result correction preserves unrelated choices, clears the edited question's retained discrepancy acknowledgment and reevaluates the current approved case at completion. Canceled content edits return the exact old result.
- Edit and replacement candidates keep their own content without changing the active check. Successful changed-text and link-only approvals independently reset all answers, hints, acknowledgments and result; normalized unchanged content resumes the original session. Empty, duplicate, failed and stale approvals cannot replace progress.
- Close/hide restore all five saved steps, including safety accepted while closed. New selection first returns to current checking and offers the exact D-12 control; preview and cancellation create no case. Existing Phase 1 draft insertion remains distinct.
- Actual tab switching and same-document navigation preserve choices. Reload, document navigation and real bfcache return clear the session and unfinished candidate. Question/result drag preserves nodes, focus and choices throughout movement, with reachable edges and 280px controls and no extra case or replacement capture.
- README documents complete fictional Chrome demos and the inherited capture, resizing, local-only and human-review limitations.

## Task Commits

Oldest first; the driver performed every git write:

1. Task 1 RED — `e6b397c`: transactional content-reapproval browser assertions.
2. Task 1 GREEN — `ca0fecb`: candidate editing, cancellation, normalized reapproval and Polish controls.
3. Task 2 RED — `c63ac09`: five-step resume, replacement consent, candidate/error and stale-response assertions.
4. Task 2 GREEN — `78cd90b`: approved-session reopening and explicit captured replacement controls.
5. Task 3 RED — `1491c0c`: checking drag, actual capture, tab/document and bfcache regressions.
6. Task 3 GREEN — `0143d74`: question/result helper expansion, toolbar fixture correction and Chrome checklist.

## Verification

- Final `npm --prefix projects/widget test`: **154 tests pass across 9 files**.
- Final `npm --prefix projects/widget run test:e2e`: **69 passed**, comprising 68 ordinary passes plus the single inherited expected capture-phase failure; zero unexpected failures. All 18 checking scenarios execute.
- Task 1 required browser verification: 10 checking scenarios pass. Supplemental approval/store/panel/source-scan verification: 33 unit tests pass.
- Task 2 required commands: 29 draft/privacy/source-scan tests and 42 approval/panel tests pass. Verbose acceptance runs name all five resume steps, conditional controls, candidate/back callbacks, deferred-close outcomes and reset guards.
- Task 1 acceptance assertions additionally prove exact cancellation preservation, correction recomputation, separate text/link resets, unchanged reapproval and failure preservation. Browser case counts increase only after explicit approval.
- Task 3 browser evidence includes `pageshow.persisted === true`, live movement before pointerup, identical controls/focus/choices, zero extra case messages, no replacement capture and reachable 280px bounds. README acceptance assertions pass for every requested demo topic.
- All task acceptance criteria are rerun through the final full suites and README assertions. Every committed RED record independently returns `RED_EVIDENCE_OK`.
- Diff checks pass. Dependencies, source-scan, the original expected-failure declaration, assets and shared materials are byte-identical to the plan base. No new threat surface, persistence, external sending or permission was introduced.

## Deviations from Plan

### Auto-fixed test fixture issue

**1. [Rule 1 - Bug] Use tab IDs instead of unavailable tab URLs in the new toolbar harness**

- **Found during:** Task 3 first full browser run.
- **Issue:** The new resume test filtered `chrome.tabs.query` by URL. With the extension's existing minimal permissions, URLs are withheld; the test passed no tab to the toolbar callback. All five new toolbar variants failed that harness assertion.
- **Fix:** Reuse the established ID-based harness from the existing draft/avatar tests. Require exactly one acknowledged message restoration and retain the same screen, choices and worker-count assertions.
- **Files modified:** `projects/widget/tests/e2e/check.spec.mjs`, already within the planned scope.
- **Verification:** Subsequent complete browser run and final verification each pass all 69 results. No production or permission change.
- **Commit:** `0143d74`.

**Total deviations:** 1 auto-fixed Rule 1 test-fixture assumption. No product-scope, architectural, dependency or file-scope expansion.

## Issues Encountered

- Task 3 intentionally expands a legacy browser helper that only reached views through safety. Its RED fails on Q2 visibility before drag; GREEN adds deliberate approval and question navigation. This is regression-fixture expansion, not evidence of a production drag defect.
- Task 2 JUnit evidence reuses prior plans' temporary-report/name-first technique, preserving assertions and exit status. Non-target tests are filtered only during RED; final full verification executes every test.
- The first Task 3 full browser run exposed the toolbar assumption documented above. All remaining checks passed; the corrected full run and final full run have no unexpected failures.
- The existing capture-phase focus-stealing test remains expected and documented; no new exemption hides Phase 2 behavior. Drag preserves node identity, while resize may recreate controls. Open Shadow DOM and real Chrome/Discord tone/readability remain explicit MVP/UAT considerations.
- Chromium launched locally for every required run. No sandbox limitation, dependency installation, missing verification or open implementation blocker remains.

## TDD Gate Compliance

| Task | RED | GREEN | Evidence |
|------|-----|-------|----------|
| 1 | `e6b397c`: approved-result edit control absent | `ca0fecb`: 10 checking browser scenarios pass | `02-03-T1-RED.json` |
| 2 | `c63ac09`: Q2 reopening returns menu instead of question | `78cd90b`: 29 plus 42 required unit tests pass | `02-03-T2-RED.json` |
| 3 | `1491c0c`: old browser helper cannot reach Q2 for checking drag | `0143d74`: expanded helper, full 154 unit and 69 browser results pass | `02-03-T3-RED.json` |

All three records live alongside this SUMMARY and independently classify as `RED_EVIDENCE_OK`. Each GREEN follows its accepted RED. Task 3 tests the planned browser-fixture expansion; earlier production behavior is not misrepresented as broken. The accepted Task 1 GREEN driver's automated verification served as the tracer feedback gate before expansion. No refactor commit was needed.

## Next Phase Readiness

- Phase 2 implementation is ready for independent phase verification and the end-of-phase Google Chrome/Discord UAT using fictional messages. Person 4 can review the working content pack and complete demo checklist.
- Tone, visual readability, future-guardian notice understandability and descriptor-less prohibitions still require human judgment; automated checks do not silently resolve them.
- Phase 3 can build guardian delivery and responses on the consent boundary. Current approval remains local, with no guardian receipt or delivery claim added. Shared contract decisions remain with their owner.
- STATE.md, ROADMAP.md and REQUIREMENTS.md are unchanged and remain owned by the orchestrator. No next-phase implementation blocker remains.

## Self-Check: PASSED

All 11 product deliverables and three RED records exist. All six driver-reported task commits are reachable from HEAD in RED/GREEN order. Final full verification, every task acceptance gate, three independent RED-evidence checks and diff whitespace checks pass. The worktree was clean before this SUMMARY write; no untracked runtime artifact or goal-blocking stub remains. Pending human judgments and the single carried expected limitation are explicitly documented.
