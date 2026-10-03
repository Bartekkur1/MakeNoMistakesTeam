---
phase: 01-rozszerzenie-i-przekazanie-tre-ci
plan: "03"
subsystem: widget
tags: [chrome-extension, privacy, tests]
requires: ["01-02"]
provides: ["Movable avatar and manual paste"]
affects: [widget]
tech-stack:
  added: []
  patterns: [in-memory-state, shadow-dom]
key-files:
  modified: [widget/src/core/draft.js, widget/src/content/main.js, widget/src/ui/panel.js]
key-decisions: ["No package changes; direct Codex execution; no push"]
requirements-completed: [WID-02, WID-01]
duration: "session"
completed: 2026-10-03
coverage:
  - deliverable: "Movable avatar and manual paste"
    human_judgment: false
    verification:
      - kind: command
        ref: "npm --prefix widget test"
        status: pass
      - kind: command
        ref: "npm --prefix widget run test:e2e"
        status: pass
  - deliverable: "Real Chrome toolbar activeTab and orphan recovery"
    human_judgment: true
    rationale: "Requires real browser and authenticated fictional Discord; pending final UAT"
---

# Phase 1 Plan 03: Movable avatar and manual paste

Two tasks complete. Vitest: 6 files, 25 tests PASS. Playwright: avatar 5 + menu 7 + tracer 3 PASS. Drag boundary 5px, viewport clamps, per-tab isolation, hide/restore, all toolbar branches, live/orphan/foreign host recovery, ordered Polish copy and paste retention are tested. Real toolbar activeTab checks remain for UAT.

## Task Commits

ca2dd92 feat(01-03): add menu instructions and retained manual paste
fb64808 test(01-03): expose menu paste and panel positioning behavior
b94f3a2 feat(01-03): drag hide and restore a live avatar per tab
0abc28a test(01-03): expose drag and toolbar recovery gaps

## Deviations from Plan

Direct Codex execution as permitted by the plan. Tests preceded behavior changes, then passed after implementation. No package changes. 

## Issues Encountered

Real Google Chrome toolbar and Discord composer checks remain for end-of-phase UAT. The earlier tracer Discord keyboard check is already approved.

## Self-Check: PASSED

Artifacts exist and all automated checks for this plan pass. No dependencies, assets or shared files changed.
