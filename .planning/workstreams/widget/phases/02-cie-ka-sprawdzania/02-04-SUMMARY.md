---
phase: 02-cie-ka-sprawdzania
plan: "04"
subsystem: widget
tags: [chrome-extension, guardian-demo, transactions, privacy, vitest, playwright]
requires:
  - phase: 02-cie-ka-sprawdzania
    provides: "02-03 resumable checking, approved-case ownership, corrections and post-review fixes"
provides:
  - Explicit result action carrying the approved case and current keyed result to a local guardian mock
  - Validated bounded service-worker request memory and reachable demo confirmation
  - Retry, duplicate, interruption and stale-response safeguards without losing the result
  - Keyboard, correction, resume and reload evidence with updated presentation instructions
affects: [widget-phase-2-uat, widget-phase-3, guardian-integration]
actuals:
  tokens: 21881
  tasks: 3
  commits: 6
commits: 6
plan_head_before: 0b3e8ade429d2c060f4e03af478ed70841305cb1
plan_head_after: 8537193a43ab647f8e6eb13aa1c174635fe34bfd
tech-stack:
  added: []
  patterns: [explicit-local-guardian-request, keyed-result-snapshot, transaction-kind-and-generation, volatile-bounded-worker-memory]
key-files:
  created:
    - projects/widget/tests/unit/guardian-request.test.js
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-04-T1-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-04-T2-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-04-T3-RED.json
  modified:
    - projects/widget/src/core/messages.js
    - projects/widget/src/core/integration.js
    - projects/widget/src/background/sw.js
    - projects/widget/src/core/draft.js
    - projects/widget/src/content/main.js
    - projects/widget/src/ui/panel.js
    - projects/widget/src/ui/strings.pl.js
    - projects/widget/tests/unit/draft.test.js
    - projects/widget/tests/unit/panel.test.js
    - projects/widget/tests/e2e/check.spec.mjs
    - projects/widget/README.md
key-decisions:
  - "The plan's UAT decision supersedes the older no-sending decision only for an explicit local Phase 2 demo action; real API and guardian responses remain in Phase 3."
  - "Approval and displaying or correcting a result never request guardian verification automatically."
  - "Only local ok=true completes the current guardian transaction; approval and guardian completion methods cannot finish each other's transactions."
  - "Confirmation explicitly labels the demo and resumes without resending; guardianNotice and howToPrivacy remain byte-identical to the accepted P7 copy."
  - "Document reload clears tab state; the independent worker retains volatile records until its own restart."
requirements-completed: [CHK-02]
gap_ids: [G-02-2]
coverage:
  - id: D1
    description: "Integration sends only the approved case and a copied current keyed result, requiring strict ok=true."
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/guardian-request.test.js#guardian adapter sends only the approved case and current keyed result"
        status: pass
    human_judgment: false
  - id: D2
    description: "The worker validates sender and payload, bounds guardianRequests at 100 and preserves the independent cases collection."
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/guardian-request.test.js#guardian mock bounds requests at 100 independently of approved cases"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/guardian-request.test.js (malformed keys/types, sparse arrays, foreign sender and valid mismatch contracts)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Controller/store preserve the exact result on failure, permit retry, block duplicates and edits, and reject stale replies after reset."
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/guardian-request.test.js (deferred controller failure, retry, close/hide and reset tests)"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/draft.test.js#pending guardian request blocks every check mutation and duplicate transaction"
        status: pass
    human_judgment: false
  - id: D4
    description: "Result retains three sections, one recommendation and correction focus; explicit action reaches focused demo confirmation only after acceptance."
    requirement: CHK-02
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#guardian demo request reaches confirmation"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/panel.test.js (guardian callback, disabled actions, alert, focus and unchanged P7 copy)"
        status: pass
    human_judgment: false
  - id: D5
    description: "Enter/Space deliver corrected keys; confirmation resumes without another request and reload clears UI state with no external traffic."
    requirement: CHK-02
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#guardian demo sends the corrected result using Enter"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#guardian demo sends the corrected result using Space"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#guardian demo confirmation resumes without resending and matches README"
        status: pass
    human_judgment: false
  - id: D6
    description: "README documents the explicit local demo, corrected results, retry, close/resume, volatile worker memory, P7 acceptance and deferred API."
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#guardian demo confirmation resumes without resending and matches README"
        status: pass
    human_judgment: false
  - id: D7
    description: "Demo marking, child-friendly language and control readability in Google Chrome/Discord with fictional content."
    verification: []
    human_judgment: true
    rationale: "End-of-phase human UAT must judge actual Chrome presentation and understandability; string assertions do not establish those judgments."
duration: 22min
completed: 2026-10-04
status: complete
---

# Phase 2 Plan 04: Explicit local guardian demo handoff Summary

**A deliberate button on the completed result now records the approved case and current result in the local guardian mock, opens honest demo confirmation and preserves checking state through retries and interruptions.**

## Performance

- First driver RED timestamp: 2026-10-03T23:58:50.965Z; final full verification completed at 2026-10-04T00:20:24Z.
- Duration: approximately 22 minutes from recorded RED through final verification; preparatory reads and harness interruptions are not timed.
- Tasks: 3/3; product deliverables: 12 files; driver RED records: 3.
- Actual tokens: ceiling of 87,521 task-commit diff characters divided by four, including RED records. Six measured task commits exclude this subsequent SUMMARY commit.

## Accomplishments

- Added `aura/guardian-request` and the integration adapter as the only request send site. It copies the keyed result without consulting drafts or selections and accepts only `ok === true`.
- The real worker validates approved cases, result shapes, localized keys, step/explanation pairs and credential mismatch entries under the existing sender ID/tab gate. `self.__aura.guardianRequests` holds at most 100 requests; the original case collection and message-log semantics remain intact. No network or persistent content store was introduced.
- Store/controller transactions require a ready visible result without a candidate or active request. Generation and transaction-kind checks separate guardian requests from approvals. Waiting blocks answer correction, content editing and new selections while allowing close/hide. Failure retains the same case, answers and result references; retry works; closed windows remain closed and reset replies cannot revive a session.
- The explicit button sits outside the three result sections. Correction remains the initial focus and one explained recommendation remains. Local acceptance opens the reachable confirmation endpoint, closing IN-01, with the exact demo heading/body and focused Close control. A separate result alert explains failed local recording. Accepted P7 privacy strings are unchanged.
- Four new browser scenarios prove the tracer, corrected result keys with Enter and Space, confirmation resume without another message, reload reset and local-only traffic. README supplies the manual demo and distinguishes tab lifetime from independent worker lifetime and real Phase 3 delivery.

## Task Commits

Oldest first; the driver performed every git write:

1. Task 1 RED — `72d4240`: local request contract and real-browser tracer.
2. Task 1 GREEN — `3774521`: adapter, worker, guarded store/controller and demo UI.
3. Task 2 RED — `772a035`: malformed-array validation and deferred/store/panel regressions.
4. Task 2 GREEN — `9b48e4a`: validate sparse positions instead of skipping them.
5. Task 3 RED — `c8fca30`: corrected-key keyboard tests and resume/README contract.
6. Task 3 GREEN — `8537193`: explicit local demo presentation instructions.

## Verification

- Final `npm --prefix projects/widget test`: **264 passed across 10 files**, no failing or skipped tests.
- Final `npm --prefix projects/widget run test:e2e`: **73 passed** in 2.9 minutes: 72 ordinary passes and the single inherited expected capture-phase failure; zero unexpected failures. All 22 checking scenarios execute.
- Task 1 required gates: 16 guardian/source-scan tests and the real-browser tracer pass. Supplemental approval/store/panel checks pass after their respective layers. The accepted driver's Task 1 GREEN verification served as the tracer feedback gate before expansion.
- Task 2 required gate: 150 tests across guardian-request, draft, panel, approve and unchanged source-scan. Acceptance assertions cover retry identity, transaction ownership, mutation/duplicate guards, old tokens, close/hide outcomes, reset and confirmation focus/resume.
- Task 3 and final full suites both pass. The new browser assertions verify exact message types/counts, unchanged approved cases, current result keys, three sections, keyboard activation, focused confirmation, resume and UI reload. Every new browser test ends with `assertOnlyLocal`.
- All three driver RED records independently return `RED_EVIDENCE_OK` from `gsd-tools check tdd-red-evidence`.
- Diff/whitespace checks pass. Dependencies, manifest permissions, source-scan rules, browser fixture, shared materials and assets are unchanged from the plan base. The original expected-failure declaration and legacy message-count assertions were not weakened.

## Deviations from Plan

### Auto-fixed validation defect

**1. [Rule 1 - Bug] Validate sparse result arrays in the worker**

- Found during Task 2 RED: `Array.prototype.every` skipped holes, so malformed signal, unknown and mismatch arrays received `ok: true`.
- Fixed by validating `Array.from` copies, retaining existing bounds and rejecting missing positions without mutating the payload.
- File: `projects/widget/src/background/sw.js`, within the plan's `files_modified` and Task 2's worker-validation action, but omitted from Task 2's file list.
- Verified by the three new rejection tests and all 150 required unit tests; committed in `9b48e4a`.

### Execution and TDD adjustments

- Task 1's layers were implemented and unit-tested sequentially, then committed in one GREEN. The driver requires every task verification command at each GREEN, so partial layer commits could not satisfy the complete browser tracer. This follows the overriding driver protocol.
- Task 3's new browser behaviors were already working after Task 1. Its genuine RED therefore targets the planned README gap after exercising successful confirmation/resume/reload, rather than inventing a browser defect. The driver accepted the assertion evidence; README alone makes the target pass. The Enter/Space scenarios add regression evidence without claiming prior failure.

**Total:** one Rule 1 file-list adjustment and two documented protocol/TDD sequencing adjustments. No architecture, dependency or product-scope expansion; all product changes stay inside the plan's file list.

## Issues Encountered

- Initial required reads were interrupted by harness usage-limit errors; the driver confirmed no commits had occurred, and execution resumed from the clean worktree before Task 1 RED.
- JUnit commands use temporary reports and put testcase names first for the existing evidence parser, preserving assertions and exit status. Runtime artifacts were not staged.
- Chromium launched headlessly inside the sandbox for all browser checks. No checks were omitted, no packages installed and no unrelated process was stopped.
- The inherited capture-phase limitation remains documented. Tone, actual Chrome/Discord appearance and the demo's understandability remain human judgments. No goal-blocking stub, TODO or FIXME remains; the local mock itself is the explicitly intended deliverable.

## TDD Gate Compliance

| Task | RED | GREEN | Evidence |
|------|-----|-------|----------|
| 1 | `72d4240`: worker does not answer the new request with ok=true; browser button absent | `3774521`: 16 required unit tests and browser tracer pass | `02-04-T1-RED.json` |
| 2 | `772a035`: sparse signal array incorrectly receives ok=true | `9b48e4a`: all 150 required tests pass | `02-04-T2-RED.json` |
| 3 | `c8fca30`: README omits the explicit demo action after passing browser lifecycle assertions | `8537193`: README contract and full 264 unit/73 browser results pass | `02-04-T3-RED.json` |

All record files live alongside this SUMMARY and return `RED_EVIDENCE_OK`. Each GREEN follows its accepted RED. Filtered RED runs intentionally select the target; full verification runs every suite. No refactor commit was needed.

## Next Phase Readiness

- G-02-2 and IN-01 have automated closure evidence for result → explicit request → local record → demo confirmation. CHK-02 retains D-05/D-08, and correction/lifetime regressions preserve D-09 through D-12.
- Ready for end-of-phase Google Chrome/Discord UAT on fictional messages, including the clarity of demo marking, retained P7 copy and Close/resume behavior.
- Real guardian API, responses, the Phase 3 immediate-send model and shared contract alignment remain deferred. This plan does not mark HND-01/02/03 or ERR-01 complete.
- No implementation blocker remains. UAT, CONTEXT, UI-SPEC, STATE, ROADMAP and REQUIREMENTS updates remain with the orchestrator and were not edited.

## Self-Check: PASSED

All 12 product deliverables and three RED records exist; all six driver-reported task commits are reachable from HEAD in RED/GREEN order. Final full verification, acceptance assertions, RED evidence checks and whitespace checks pass. The worktree was clean before this SUMMARY write. No unintended runtime artifact, goal-blocking stub, dependency change or undisclosed new threat surface remains.
