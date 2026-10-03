---
phase: 01-rozszerzenie-i-przekazanie-tre-ci
plan: "06"
subsystem: ui
tags: [chrome-extension, dragging, drafts, playwright]
requires:
  - phase: 01-05
    provides: Form lifecycle and avatar anchoring
provides:
  - Visible draggable avatar and open panels following its movement
  - Browser proof of preserved inputs, caret, focus and draft during drag
  - Updated Chrome retest and installable ZIP
affects: [widget-phase-2]
actuals:
  tokens: 4764
  tasks: 2
  commits: 2
commits: 2
plan_head_before: c61e8fafa89892d54ff0d2f70f64ac13789c5d53
plan_head_after: e0aa8de89ca2a28700ef3f78d30806242be38ffa
tech-stack:
  added: []
  patterns: [positioning-only-movement-callback]
key-files:
  created: []
  modified:
    - widget/src/content/avatar.js
    - widget/src/content/main.js
    - widget/tests/unit/presence.test.js
    - widget/tests/e2e/avatar.spec.mjs
    - widget/README.md
key-decisions:
  - "Latest user instruction supersedes 01-05 form hiding: avatar stays visible and open panel follows it."
  - "Drag updates only panel geometry; it never calls panel.render or changes draft state."
requirements-completed: [WID-01, WID-02]
gap_ids: [G-01-2-drag]
coverage:
  - id: G-01-2-drag-behavior
    description: "Open menu, howto, paste, preview and confirmation follow live avatar drag; edits, node identity, selection and focus survive."
    verification:
      - kind: e2e
        ref: "widget/tests/e2e/avatar.spec.mjs#open preview follows avatar throughout drag without rebuilding or submitting"
        status: pass
      - kind: e2e
        ref: "widget/tests/e2e/avatar.spec.mjs#open paste follows avatar throughout drag without rebuilding or submitting"
        status: pass
    human_judgment: false
  - id: G-01-2-drag-edges
    description: "Drag preserves draft and suppresses new page capture, while panel and avatar remain reachable at edges and resize; pointer cancellation recovers."
    verification:
      - kind: e2e
        ref: "widget/tests/e2e/avatar.spec.mjs#open preview stays reachable at edges and after resize without recapturing page selection"
        status: pass
      - kind: e2e
        ref: "widget/tests/e2e/avatar.spec.mjs#pointer cancellation ends drag and allows another gesture with open paste"
        status: pass
      - kind: integration
        ref: "widget/tests/unit/presence.test.js#gesture 130,100"
        status: pass
    human_judgment: false
  - id: G-01-2-drag-package
    description: "Installable updated extension with revised Chrome/Discord retest instructions."
    verification:
      - kind: other
        ref: "npm run build; ZIP CRC and manifest-referenced file validation"
        status: pass
    human_judgment: false
  - id: G-01-2-drag-visual
    description: "User accepts visible shark and moving windows in Google Chrome on Discord."
    verification: []
    human_judgment: true
    rationale: "User-requested visual acceptance of revised behavior needs retest on the updated extension."
duration: 7min
completed: 2026-10-03
status: complete
artifact: /workspace/artifacts/bezpieczna-aura-widget-phase1-gap-01-06.zip
---

# Phase 01 Plan 06: Open panel follows visible avatar

**Dragging the shark moves the current window while retaining its fields, caret and focus.**

## Performance

- First validation started: 2026-10-03T18:05:26Z
- Completed: 2026-10-03T18:12:01.240434+00:00
- Tasks: 2/2
- Product files modified: 5

## Accomplishments

- Avatar movement supplies its current rect to main.placePanel; only panel.place runs during drag. Form hiding and inert toggling are removed.
- Seven added Chromium regressions cover five window views, live movement before pointerup, retained DOM/values/caret/focus, edge and resize reachability, no accidental capture/send, and pointer cancellation recovery.
- README reflects the user's revised requirement; a seven-file ZIP includes manifest at archive root and all manifest-referenced scripts/icons.

## Task Commits

1. Task 1: Movement callback and visible avatar — `be470c4`.
2. Task 2: Browser regressions and retest instructions — `e0aa8de`.

## Verification

- `npm test`: 38 tests pass in 8 files.
- `npm run test:e2e`: Playwright reports 45 passed; 44 ordinary passes and the existing declared expected capture-phase focus-stealing failure. No unexpected failures.
- First full browser run had one resize synchronization failure in the new test (old avatar rect read before resize event). Added bounded polling for resize completion; isolated edge retest and subsequent full suite pass.
- `npm run build`: pass; build also ran before full E2E.
- ZIP CRC and manifest references: valid. SHA256: `26d16a44a66b9824a5be4b6d5806a1419655b3f59c02aff27fd394ed1b3bce65`.
- `git diff --check`: pass.

## Decisions Made

User explicitly superseded previous form-hiding criterion. Visible avatar remains the drag handle in every view; existing viewport clamp/flip behavior remains. No new dependencies, permissions, storage or network behavior.

## Deviations from Plan

No scope deviations. Resize assertions now wait for the browser's resize event. Execution performed inline under Codex skill adapter; no independent executor subagent claimed.

## Issues Encountered

No open implementation issue. Existing expected capture-phase focus-stealing limitation remains documented and unchanged.

## Next Phase Readiness

Automated implementation complete. Four prior human UAT passes retained; only test 2 requires retest of G-01-2-drag. Phase 1 remains pending human acceptance.

## Self-Check: PASSED

Both task commits reachable, product files substantive, full tests pass, ZIP valid.
