---
phase: 02-cie-ka-sprawdzania
plan: "02"
subsystem: widget
tags: [chrome-extension, deterministic-rules, polish, privacy, vitest, playwright]
requires:
  - phase: 02-cie-ka-sprawdzania
    provides: "02-01 local approval, deliberate questions and keyed result session"
provides:
  - Pure keyed recognition and evaluation for the five D-14 scenario classes
  - Credential discrepancy correction and answer-scoped retention without erasing warnings
  - Honest negatives, reported-request exclusions and defensive empty/Unicode contracts
  - Three accessible Polish result sections with one explained priority action
  - Reviewable working content pack and fictional Google Chrome demo instructions
affects: [widget-02-03, widget-phase-3, shared-content-review]
actuals:
  tokens: 21696
  tasks: 3
  commits: 6
commits: 6
plan_head_before: af77cca91bc06b3fa40496550dd4e5490d2c2b32
plan_head_after: 1e6a24e343e686a12a1a8418dcad7cb0d6b76927
tech-stack:
  added: []
  patterns: [pure-keyed-evaluation, normalized-matching-copy, reported-span-exclusion, answer-scoped-acknowledgment, named-result-regions]
key-files:
  created:
    - projects/widget/src/core/check.js
    - projects/widget/tests/unit/check.test.js
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-02-T1-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-02-T2-RED.json
    - .planning/workstreams/widget/phases/02-cie-ka-sprawdzania/02-02-T3-RED.json
  modified:
    - projects/widget/src/core/draft.js
    - projects/widget/src/content/main.js
    - projects/widget/src/ui/panel.js
    - projects/widget/src/ui/strings.pl.js
    - projects/widget/tests/unit/draft.test.js
    - projects/widget/tests/unit/panel.test.js
    - projects/widget/tests/e2e/check.spec.mjs
    - projects/widget/README.md
key-decisions:
  - "D-04: recognized hints are separately labelled and never become selected answers."
  - "D-15: retention acknowledges the current question choice only; changing that answer invalidates the acknowledgment, while evidence remains intact."
  - "Unknown answers are uncertainty, not a credential denial; concrete contradictory answers receive correction/retention choices."
  - "Only matching copies are normalized; reported spans are excluded without removing separate direct demands."
  - "Standalone payment answers request cautious verification; payment-pressure and prize-link signals require their combined evidence."
  - "All Polish copy, including Task 3 empty-section explanations, remains in strings.pl.js."
requirements-completed: [CHK-01, CHK-02, CHK-03]
coverage:
  - id: D1
    description: "Pure recognition and evaluation produce exact hints, reasons, unknowns and one priority action for all five D-14 classes."
    requirement: CHK-01
    verification:
      - kind: unit
        ref: "npm --prefix projects/widget test -- tests/unit/check.test.js tests/unit/source-scan.test.js"
        status: pass
      - kind: e2e
        ref: "npm --prefix projects/widget run test:e2e -- tests/e2e/check.spec.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "Real controller retention and correction preserve credential warnings, recompute summaries and invalidate retention after answer changes."
    requirement: CHK-02
    verification:
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#credential discrepancy retain preserves the warning through the real controller"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#credential discrepancy correct preserves the warning through the real controller"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/panel.test.js#labelled hints leave controls untouched and mismatch buttons use explicit correction and retention callbacks"
        status: pass
    human_judgment: false
  - id: D3
    description: "Honest negatives, reported requests, empty/malformed input and Unicode variants do not invent automatic alarms or mutate approved content."
    requirement: CHK-03
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/check.test.js (62 rule contracts, including reported/mixed requests and independent child warnings)"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#D-14 ambiguous message renders reasons, missing facts and one explained action locally"
        status: pass
    human_judgment: false
  - id: D4
    description: "Canonical result keys resolve to Polish text in three named regions with exactly one action explanation and no safety verdict."
    requirement: CHK-02
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/panel.test.js#honest result explicitly states absent signals and additional unknowns without guaranteeing safety"
        status: pass
      - kind: unit
        ref: "projects/widget/tests/unit/panel.test.js (seven canonical result-rendering fixtures)"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#D-14 prize with a link renders reasons, missing facts and one explained action locally"
        status: pass
      - kind: e2e
        ref: "projects/widget/tests/e2e/check.spec.mjs#D-14 payment with pressure renders reasons, missing facts and one explained action locally"
        status: pass
    human_judgment: false
  - id: D5
    description: "README locates the working pack, names person 4 review, gives five fictional Chrome demos and distinguishes local approval from future guardian delivery."
    verification:
      - kind: other
        ref: "Node README acceptance assertions: pack paths, reviewer, five messages, Chrome steps, local guardian distinction and Phase 3/old-contract caveat"
        status: pass
    human_judgment: false
  - id: D6
    description: "Child-friendly tone, visual readability and understandable limitations in fictional Google Chrome scenarios."
    verification: []
    human_judgment: true
    rationale: "Person 4 and end-of-phase UAT must judge tone and actual Chrome presentation; automated text assertions do not establish UX adequacy."
duration: 23min
completed: 2026-10-03
status: complete
---

# Phase 2 Plan 02: Five-scenario rules and honest credential discrepancies Summary

**The local checking flow now explains credential demands, linked prize invitations and pressured payments, handles honest or uncertain messages without invented alarms, and preserves warnings when a child retains a contradictory answer.**

## Performance

- First recorded local RED browser validation: 2026-10-03T20:30:58Z; final verification: 2026-10-03T20:53:27Z onward.
- Duration: approximately 23 minutes from first recorded validation through final checks; preparatory reads and the interrupted predecessor's partial edit are not timed.
- Tasks: 3/3; product files created/modified: 10; driver RED records: 3.
- Measured actuals: 86,784 realized diff characters divided by four, rounded up, across the six accepted task commits, including RED records. The SUMMARY commit is subsequent to this measurement.

## Accomplishments

- Extracted `detectHints` and `evaluate` into `check.js`, importing and re-exporting them through `draft.js`. Results and lists are frozen, deduplicated and deterministically ordered; IDs remain ASCII and all display copy remains in the Polish strings module.
- The credential tracer offers correction or retention through the real controller's unchanged `keep` flag. A retained acknowledgment is scoped to its question's answer array, survives navigation and is invalidated by changing that answer. Recognized evidence is never edited away, and corrected answers remove the conflict while preserving the credential warning.
- Five scenario classes have exact signal/summary/unknown/action contracts. Free-prize invitations require link evidence, payment warnings require pressure, textual sender claims remain unverified suggestions, and unknown sender or message-only channels add missing facts rather than accusations.
- Honest messages, cautionary requests and clearly reported requests have no automatic warning. Separate direct demands after reported spans and explicit child code/password answers still warn. Null, whitespace, malformed IDs, one-word inputs, emoji, NFC/NFD, accent/case variants and NBSP are covered without changing approved content or code-point limits.
- Every result has three accessible named sections and one explanation. Empty sections explicitly state absent signals or additional unknowns without certifying identity or safety. README identifies the working pack for person 4 review, supplies five fictional Chrome demos and retains the Phase 3 consent/older-contract caveat.

## Task Commits

Oldest first; the driver performed every git write:

1. Task 1 RED — `ecad016`: credential retention/correction browser contracts, completed from the interrupted partial test.
2. Task 1 GREEN — `905c812`: extracted engine, discrepancy prompt, answer-scoped acknowledgment and controller forwarding.
3. Task 2 RED — `c1f63b3`: five-scenario, honest-negative, reported-request, empty and Unicode rule contracts.
4. Task 2 GREEN — `63d74f4`: narrow normalized rules, defensive canonical evaluation, Polish instructions and legacy test-key migration.
5. Task 3 RED — `1450841`: explicit empty-result text, named-section rendering contracts and three remaining browser scenarios.
6. Task 3 GREEN — `1e6a24e`: accessible result regions, localized empty-section explanations and updated demo documentation.

## Verification

- Final `npm --prefix projects/widget test`: **117 tests pass across 9 files**; no skipped or failing unit tests. This includes the unchanged source-scan, store, controller and local-approval regressions.
- Final `npm --prefix projects/widget run test:e2e -- tests/e2e/check.spec.mjs`: **8 scenarios pass**. All five D-14 classes traverse real local approval and three deliberate questions; credential retention/correction, the unknown path and multiple-answer path also pass.
- Task 1 required browser gate passed 5 scenarios before expansion. Supplementary source-scan/store/panel checks passed 18 tests. The driver's accepted GREEN verification served as the tracer feedback gate.
- Task 2 required rule/source-scan command passed 65 tests. Its supplementary full unit run passed 108 tests after migrating the two legacy summary-key assertions; all five then-existing browser scenarios also passed.
- Acceptance gates pass: hints visible and unchecked; discrepancy choices and forwarding; retained evidence and acknowledgment invalidation; corrected summary; exact five-class contracts; honest reported/negative cases; null/encoding equivalence; stable one-action priority; localized keys; named sections; no safe verdict; README pack/reviewer/demo/consent checks.
- Every browser scenario retains one local service-worker submission and `assertOnlyLocal`; links remain non-navigable text. No dependency, browser permission, persistent content store or network endpoint was introduced.
- All three RED records independently return `RED_EVIDENCE_OK`. `git diff --check` against the plan base passes; all 13 changed files exist and the worktree was clean before authoring this SUMMARY.

## Deviations from Plan

### Auto-fixed regression

**1. [Rule 1 - Bug] Migrate two legacy store-test summary keys**

- **Found during:** Task 2 GREEN supplementary full-unit verification.
- **Issue:** `draft.test.js` expected the earlier `no_signal` and `missing_information` IDs. The plan explicitly requires canonical `no_signals` and `insufficient_information`, producing a demonstrated assertion failure after engine migration.
- **Fix:** Updated those two expected IDs while retaining every original ordering, answer-preservation and unknown-fact assertion.
- **Files modified:** `projects/widget/tests/unit/draft.test.js`, outside the plan's `files_modified` list.
- **Verification:** Full unit suite then passed 108 tests; final suite passes 117 tests.
- **Commit:** `63d74f4`.

**Total deviations:** 1 auto-fixed Rule 1 regression. No architectural, dependency or product-scope expansion. Task 3 also localized its required empty-section copy in `strings.pl.js`, already in the plan's file list, following the mandated copy ownership.

## Issues Encountered

- The predecessor was interrupted before its first commit. Its partial credential browser test was reviewed, retained and strengthened before the accepted Task 1 RED; no implementation was made before that RED commit.
- Vitest's configured JUnit destination does not print XML directly, and the existing evidence parser is sensitive to testcase attribute order. Tasks 2 and 3 reused 02-01's temporary-report technique and printed name-first attributes, preserving failures and exit status. Both records were accepted without protocol rejection. The initial generated project-local report was removed; subsequent reports live only in `/tmp`.
- The one full-unit failure was the canonical-key regression documented above. Final checks have no remaining failures or sandbox limitations; Chromium launched locally.
- No goal-blocking stubs, TODOs, new dependencies or new threat surfaces were found. Existing input `placeholder` properties are functional form hints, not unfinished implementation.

## TDD Gate Compliance

| Task | RED | GREEN | Evidence |
|------|-----|-------|----------|
| 1 | `ecad016`: missing discrepancy prompt advances straight to verification | `905c812`: retain/correct and honest browser paths pass | `02-02-T1-RED.json` |
| 2 | `c1f63b3`: prize invitation returns no prize hint | `63d74f4`: 62 rule contracts and 3 source-scan tests pass | `02-02-T2-RED.json` |
| 3 | `1450841`: empty signal section describes answers only, without the required explicit copy | `1e6a24e`: 117 unit tests and 8 checking browser scenarios pass | `02-02-T3-RED.json` |

The three committed records alongside this SUMMARY each return `RED_EVIDENCE_OK`: each named target failed on its planned assertion before implementation. Filtered RED commands select one test; their non-target tests are skipped only by that filter, while final full verification executes all named suites. Every GREEN follows its accepted RED. No separate refactor commit was needed.

## User Setup Required

None. Existing installed packages and Chromium were sufficient; no external service or new package configuration is needed.

## Next Phase Readiness

- Ready for 02-03 to expand approved-session reopening, new-selection/edit lifecycle and question/result drag coverage on the proven rule and discrepancy path.
- Person 4 can review the working pack and fictional examples. Human tone/visual acceptance remains at phase end; descriptor-less CHK-01/CHK-02 prohibitions and other flagged judgment items are not silently classified as resolved by this implementation.
- Guardian delivery and responses remain for phase 3. README explicitly states that current local approval has not delivered anything to an actual guardian and preserves the consent model and older-contract caveat.
- No blocker for the next plan. Shared artifacts, assets, STATE.md, ROADMAP.md and REQUIREMENTS.md remain owned by their respective owners/orchestrator.

## Self-Check: PASSED

All 10 product deliverables and three RED records exist. The six driver-reported task commits are reachable from HEAD in RED/GREEN order. Final unit/browser verification, all task acceptance gates, the three independent RED-evidence checks and diff whitespace checks pass. No unintended untracked artifact remains, no goal-blocking stub is left, and pending human judgments are explicitly identified rather than claimed as verified.
