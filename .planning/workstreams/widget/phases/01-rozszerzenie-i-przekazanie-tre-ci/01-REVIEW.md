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

Scope: all widget/src JS and CSS, manifest, build, browser fixture and new tests. Checked event/read/send paths, consent, async completion, lifecycle cleanup, origin validation, UI placement and package changes. Direct review under the Codex skill fallback; no independent reviewer was spawned.

## Warnings

### WR-01: Active iframe can expose stale parent selection

captureSelection previously fell through to document.getSelection with an active IFRAME. A previous parent selection could appear instead of the unsupported-context menu. Added explicit IFRAME exclusion. Regression test first failed returning stale parent text, then passed with zero reads. Fixed in 4a6c66d.

### WR-02: Fixed-width panel overflows narrow viewport

At width 280, the panel right edge was 328 instead of at most 272. Added max-width calc(100vw - 16px). Real Chromium regression now passes. Fixed in 4a6c66d.

## Outcome

Both findings fixed and verified. No open critical or warning findings. Expected capture-phase limitation and readable open shadow DOM are explicit plan-accepted risks, documented in README and SECURITY; they are not claimed fixed.
