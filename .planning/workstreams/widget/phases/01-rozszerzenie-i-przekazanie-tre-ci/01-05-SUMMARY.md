---
phase: 01-rozszerzenie-i-przekazanie-tre-ci
plan: "05"
subsystem: ui
tags: [chrome-extension, avatar, accessibility, vitest, playwright]
requires:
  - phase: 01-04
    provides: In-memory draft lifecycle and handover UI
provides:
  - Independent avatar visibility while paste and preview forms are open
  - Browser regressions for anchor geometry, resize, Tab navigation and draft recovery
affects: [widget-phase-2]
tech-stack:
  added: []
  patterns: [visibility-and-inert-with-preserved-anchor]
key-files:
  created: []
  modified:
    - widget/src/content/avatar.js
    - widget/src/content/main.js
    - widget/tests/unit/presence.test.js
    - widget/tests/e2e/avatar.spec.mjs
    - widget/tests/e2e/draft.spec.mjs
    - widget/README.md
key-decisions:
  - "Form visibility is independent of manual whole-widget hiding; avatar geometry stays available to panel.place."
requirements-completed: [WID-01, WID-02]
gap_ids: [G-01-2]
coverage:
  - id: G-01-2-behavior
    description: "Avatar hides in paste/preview, including pending/error; restores on close, Escape and confirmation without losing draft or anchor."
    verification:
      - kind: integration
        ref: "widget/tests/unit/presence.test.js#form hides only avatar, restores it on close and Escape, and retains draft"
        status: pass
      - kind: integration
        ref: "widget/tests/unit/presence.test.js#selection preview stays hidden during pending and failed submit, restores on confirmation"
        status: pass
      - kind: e2e
        ref: "widget/tests/e2e/avatar.spec.mjs#form preserves anchor and draft after button and resize"
        status: pass
      - kind: e2e
        ref: "widget/tests/e2e/avatar.spec.mjs#form preserves anchor and draft after Escape and resize"
        status: pass
    human_judgment: false
  - id: G-01-2-visual
    description: "Visual acceptance of shark disappearance and return in Google Chrome on Discord."
    verification: []
    human_judgment: true
    rationale: "Original UAT issue requires user visual retest on the updated extension."
duration: 5min
completed: 2026-10-03
status: complete
artifact: /workspace/artifacts/bezpieczna-aura-widget-phase1-gap-01-05.zip
---

# Phase 01 Plan 05: Form-aware avatar visibility

**The shark and hide badge disappear while editing, while the usable panel keeps its anchor and draft.**

## Performance

- Started: 2026-10-03T17:45:51Z
- Completed: 2026-10-03T17:50:00Z
- Tasks: 2
- Files modified: 6

## Accomplishments

- `setFormOpen` applies visibility and inert only to avatar-wrap; host display still follows manual hide.
- Main render maps paste/preview to form-open, including pending and failed approval; other views restore the avatar.
- Real Chromium proves editable form, conserved anchor, resize bounds, Tab exclusion, close/Escape recovery and retained draft. README provides the manual G-01-2 retest.
- Installable ZIP contains dist files with manifest.json at its root and passed archive integrity verification.

## Task Commits

1. Task 1: Independent avatar visibility — `f375978`.
2. Task 2: Browser and integration regressions, manual instructions — `bce3760`.

## Verification

- `npm run build`: pass.
- `npm test`: 38 tests in 8 files pass.
- `npm run test:e2e`: 38 pass; one existing declared expected failure for capture-phase focus stealing remains an accepted limitation.
- ZIP: `/workspace/artifacts/bezpieczna-aura-widget-phase1-gap-01-05.zip`; CRC validation passed, manifest at archive root.
- No dependency, permission, storage, capture or network behavior changes.

## Deviations from Plan

**[Rule 1 — regression adaptation] Existing draft E2E tried to click the hide badge while preview was open.** The new intended behavior makes the badge unavailable. Added panel close before manual hide in `widget/tests/e2e/draft.spec.mjs`; the full browser suite passes. This is the sixth modified file beyond the five declared by the plan.

## Issues Encountered

None. The Python executable is `python3` in this environment; packaging used it successfully.

## Next Phase Readiness

Implementation and automated verification are complete. Phase 1 remains pending the user's visual G-01-2 retest; existing UAT results are preserved and not auto-approved.

## Self-Check: PASSED

Both task commits exist; modified files, full test results and integral ZIP are present.
