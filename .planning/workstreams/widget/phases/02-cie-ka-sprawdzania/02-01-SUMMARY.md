---
phase: 02-cie-ka-sprawdzania
plan: "01"
subsystem: widget
tags: [chrome-extension, questions, accessibility, privacy, vitest, playwright]
requires:
  - phase: 01-rozszerzenie-i-przekazanie-tre-ci
    provides: Consentful local approval, immutable drafts, Shadow DOM panel and draggable avatar
provides:
  - Approved case retained in an in-memory safety/question/result session
  - Three deliberate Polish questions with explicit unknown answers and unselected hints
  - Limited-confidence honest result, explanatory sections and one main action
  - Consent and drag regressions migrated to safety, with keyboard and defensive-state coverage
affects: [widget-02-02, widget-02-03, widget-phase-3]
actuals:
  tokens: 15740
  tasks: 3
  commits: 6
commits: 6
plan_head_before: 7ff261e6bdce2221f2412c14095fba556f55379d
plan_head_after: 5e02b94d013facbe61081270856356a92acb5630
tech-stack:
  added: []
  patterns: [in-memory-check-session, frozen-answer-arrays, native-labeled-controls, localized-result-keys]
key-files:
  created:
    - projects/widget/tests/e2e/check.spec.mjs
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-01-T1-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-01-T2-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-01-T3-RED.json
  modified:
    - projects/widget/src/core/draft.js
    - projects/widget/src/content/main.js
    - projects/widget/src/ui/panel.js
    - projects/widget/src/ui/strings.pl.js
    - projects/widget/src/ui/widget.css
    - projects/widget/tests/e2e/tracer.spec.mjs
    - projects/widget/tests/e2e/menu.spec.mjs
    - projects/widget/tests/e2e/avatar.spec.mjs
    - projects/widget/tests/unit/approve.test.js
    - projects/widget/tests/unit/presence.test.js
    - projects/widget/tests/unit/panel.test.js
    - projects/widget/tests/unit/content.test.js
    - projects/widget/tests/unit/draft.test.js
key-decisions:
  - "D-04 supersedes D-03: hints never select answers; unknown is an explicit answer."
  - "Sender answers describe child knowledge, without verifying identity or guaranteeing safety."
  - "All Polish copy stays in strings.pl.js; recognition returns keys and uses escaped pattern literals."
  - "Focus follows the chosen native control through rendering; approved-session reopening remains for 02-03."
requirements-completed: [CHK-01, CHK-02, CHK-03]
coverage:
  - id: D1
    description: "Approval shows D-16 safety before exactly three unanswered questions, requiring deliberate choices."
    requirement: CHK-01
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#honest approval reaches three deliberate questions and a limited-confidence result"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/draft.test.js#question ordering requires explicit answers and Back and fix retain choices"
        status: pass
    human_judgment: false
  - id: D2
    description: "Result contains signals, missing information and exactly one explained main action, including explicit credential/payment cautions."
    requirement: CHK-02
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#request choices allow multiple signals without treating hints as answers"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/panel.test.js#safety and result controls invoke handlers and render exactly three sections and one action"
        status: pass
    human_judgment: false
  - id: D3
    description: "Honest message shows the exact D-06 limited-confidence summary; unknown answers explain uncertainty without a false alarm."
    requirement: CHK-03
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#honest approval reaches three deliberate questions and a limited-confidence result"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#explicit unknown answers advance and explain missing information"
        status: pass
    human_judgment: false
  - id: D4
    description: "Safety endpoint retains Phase 1 consent, local-only transmission, stale/duplicate guards and drag geometry evidence."
    verification:
      - kind: integration
        ref: "npm --prefix projects/widget test -- tests/unit/approve.test.js tests/unit/presence.test.js"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/avatar.spec.mjs#open safety follows avatar throughout drag without rebuilding or submitting"
        status: pass
    human_judgment: false
  - id: D5
    description: "Native labeled choices retain keyboard focus, explicit Next and defensive answer state; panel uses existing palette and viewport constraints."
    requirement: CHK-01
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/panel.test.js#answer rendering keeps keyboard focus on the chosen option including unknown"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/draft.test.js#invalid answers and transitions without an active check never mutate state"
        status: pass
      - kind: unit
        ref: "npm --prefix projects/widget test"
        status: pass
    human_judgment: false
  - id: D6
    description: "Child-friendly Polish tone and question/result presentation in Google Chrome on fictional Discord content."
    verification: []
    human_judgment: true
    rationale: "Tone, visual readability and real Chrome/Discord presentation need end-of-phase human judgment."
duration: 18min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 01: Approval to three deliberate questions and an honest result Summary

**Local approval now retains the case, shows the safety notice, asks three explicit questions and explains a limited-confidence result with one next action.**

## Performance

- First browser validation: 2026-10-03T19:57:49Z.
- Tasks: 3/3; product files created/modified: 14; driver RED records: 3.
- Actual token estimate: ceiling of realized diff characters divided by four through the final GREEN, including RED records. Six measured task commits exclude this subsequent SUMMARY commit.

## Accomplishments

- The exact approved case enters a frozen in-memory session only after successful local acceptance. Existing generation guards, duplicate lock and closed-window behavior remain.
- Sender, request/urgency and independent-verification screens each start unanswered. Q2 supports multiple concrete choices; unknown and ordinary are exclusive. Hints do not select answers.
- Honest content shows the exact D-06 summary and the three D-05 sections. Credential/payment answers produce caution; unknown answers explain missing information. Every result has one explained action and no guarantee of safety or identity.
- Back and fix retain answers and recompute results. Native controls have associated labels and retain focus after choosing an answer.
- Existing approval and drag tests now reach safety while retaining their privacy, approved-content, readonly, worker-count, stale-response, focus, caret and geometry assertions.

## Task Commits

Oldest first; the driver performed every git write:

1. Task 1 RED — `f68139e`: deliberate approval-to-result browser tests.
2. Task 1 GREEN — `5e9600a`: session, Polish question pack, controller and result renderer.
3. Task 2 RED — `b3494ea`: safety endpoint drag regression.
4. Task 2 GREEN — `d99683e`: consent and drag fixture/expectation migration.
5. Task 3 RED — `309219c`: keyboard-focus assertion and defensive/rendering tests.
6. Task 3 GREEN — `5e02b94`: focus retention and palette-based question/result styling.

## Verification

- Final `npm --prefix projects/widget test`: 46 tests pass across 8 files, including unchanged source-scan.
- Final `npm --prefix projects/widget run test:e2e -- tests/e2e/check.spec.mjs tests/e2e/tracer.spec.mjs`: 6 tests pass across both named files.
- Task 2 commands: 17 unit tests and 26 browser tests pass across all five required regression files.
- Supplementary real-Chromium keyboard run selects every radio/checkbox, including unknown, then activates Next with Enter. Focus outlines, panel bounds and absence of horizontal overflow pass at 280px width.
- Acceptance gates pass: exact notice/summary, three empty question screens, explicit Next, Q2 multiple choice, one explained action, label associations, no anchors, existing palette/20px radius/viewport constraints, and one local worker submission through the questions.
- Diff audit against the plan base confirms retained privacy/network, worker-count, readonly, stale-token, focus/caret and geometry checks. No source-scan allowlist changes.
- All three committed RED records independently classify as `RED_EVIDENCE_OK`. `git diff --check` passes.

## Deviations from Plan

### Auto-fixed verification blocker

**1. [Rule 3 - Blocking] Deliver parseable Vitest JUnit evidence**

- **Found during:** Task 3 RED.
- **Issue:** Direct `/dev/stdout` reporting could interleave the Vitest completion message with XML. The existing GSD parser also matches `name=` inside `classname=` when classname comes first, misidentifying the failing target.
- **Fix:** The RED command writes to a temporary report, prints it after Vitest exits, and reorders testcase attributes to put name first. Names, assertions, outcomes and process exit status are preserved.
- **Files modified:** No additional repository files; only the verification command changed.
- **Verification:** The corrected report retains the intentional focus assertion failure and the driver accepts `RED_EVIDENCE_OK`.
- **Commit:** `309219c` includes the accepted driver record.

**Total deviations:** 1 verification-only Rule 3 adjustment. No product scope, architectural or dependency deviations; all changes remain inside the plan's product files and protocol artifacts.

## Issues Encountered

- The first Task 3 RED request was rejected because of report formatting/parser behavior; the corrected request was accepted before production edits.
- The first Task 3 full unit run exposed happy-dom focus access during pagehide/reset. Capturing focus only for question views resolved the issue; all late-reset assertions now pass.
- Chromium launched in the sandbox and all required verification commands ran locally. No unrun checks or package changes.

## TDD Gate Compliance

| Task | RED | GREEN | Evidence |
|------|-----|-------|----------|
| 1 | `f68139e`: safety notice absent at the old confirmation endpoint | `5e9600a`: all 3 check scenarios pass | `02-01-T1-RED.json` |
| 2 | `b3494ea`: legacy openView fixture cannot reach safety | `d99683e`: fixture migration, 17 unit and 26 browser passes | `02-01-T2-RED.json` |
| 3 | `309219c`: chosen option loses focus to known_person | `5e02b94`: focus preserved, 46 unit and 3 check browser passes | `02-01-T3-RED.json` |

All records live alongside this SUMMARY and return `RED_EVIDENCE_OK`. Task 2 deliberately tests regression-fixture migration; production safety was already proven in Task 1. The accepted Task 1 GREEN automated run served as the tracer feedback gate before expansion. No refactor commit was needed.

## Next Phase Readiness

- 02-02 can extract `detectHints`/`evaluate` from draft.js and expand recognition, mismatches and demo cases without changing the wire schema.
- 02-03 can add approved-session resume, new-selection/edit lifecycle and question/result drag coverage. Those later lifecycle behaviors are not claimed by this slice.
- Guardian sending remains for phase 3. No external network endpoint, browser permission, persistent content storage or dependency was added.
- Human tone/visual acceptance remains for end-of-phase UAT. No blocker for the next plan.

## Self-Check: PASSED

All 14 product deliverables and three RED records exist; all six task commits are reachable from HEAD. Final unit/browser checks and every task acceptance gate pass. No goal-blocking stubs, TODOs or FIXMEs were found in changed files. Planning state, roadmap and requirements remain owned by the orchestrator.
