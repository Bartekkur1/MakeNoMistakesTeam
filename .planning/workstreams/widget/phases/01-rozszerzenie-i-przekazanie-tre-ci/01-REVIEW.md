---
phase: 01
status: reviewed
depth: standard
critical: 0
warnings: 2
info: 0
findings_total: 2
reviewer: Codex-inline
---

# Phase 01 Code Review

Scope: all projects/widget/src JS and CSS, manifest, build, browser fixture and new tests. Checked event/read/send paths, consent, async completion, lifecycle cleanup, origin validation, UI placement and package changes. Direct review under the Codex skill fallback; no independent reviewer was spawned.

## Warnings

### WR-01: Active iframe can expose stale parent selection

captureSelection previously fell through to document.getSelection with an active IFRAME. A previous parent selection could appear instead of the unsupported-context menu. Added explicit IFRAME exclusion. Regression test first failed returning stale parent text, then passed with zero reads. Fixed in 4a6c66d.

### WR-02: Fixed-width panel overflows narrow viewport

At width 280, the panel right edge was 328 instead of at most 272. Added max-width calc(100vw - 16px). Real Chromium regression now passes. Fixed in 4a6c66d.

## Outcome

Both findings fixed and verified. No open critical or warning findings. Expected capture-phase limitation and readable open shadow DOM are explicit plan-accepted risks, documented in README and SECURITY; they are not claimed fixed.

## Gap closure review 01-05 (2026-10-03T17:51:26.347470+00:00)

Standard inline review of the six files changed by f375978 and bce3760, with cross-checks against panel.js and draft.js. No new critical, warning or info findings. Verified visibility affects only avatar-wrap, inert excludes both buttons, rect preserves geometry, render tracks paste/preview including pending/error, close restores avatar and draft, and no capture/storage/permission/dependency changes occurred. 38 Vitest and 38 Playwright tests pass (one existing expected capture-phase failure). Prior WR-01 and WR-02 remain fixed.

## Gap closure review 01-06

Standard inline review of the five files changed by be470c4/e0aa8de, cross-checked against panel.js, draft.js and widget.css. No new critical, warning or info findings. onMove occurs only after host positioning and not during construction; callback receives rect directly, avoiding avatar initialization dependency. placePanel checks view/hidden state and calls only panel.place. Drag suppression retains capture/consent behavior; native pointer/mousedown flow preserves input focus. Full browser tests exercise DOM identity, values/caret/focus, in-progress movement, all five views, edges/resize and cancel. Prior WR-01 and WR-02 remain fixed.

38 Vitest pass; Playwright reports 45 passed (44 ordinary passes and one pre-existing declared expected capture-phase failure). No permissions, network, storage or dependencies changed. Previous 01-05 visibility findings describe historical behavior now explicitly superseded by the user. Review is inline, not an independent subagent audit.
