---
phase: 01-rozszerzenie-i-przekazanie-tre-ci
plan: "04"
subsystem: widget
tags: [chrome-extension, privacy, tests]
requires: ["01-03"]
provides: ["Consentful draft lifecycle and Chrome demo"]
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
  - deliverable: "Consentful draft lifecycle and Chrome demo"
    human_judgment: false
    verification:
      - kind: command
        ref: "npm --prefix widget test"
        status: pass
      - kind: command
        ref: "npm --prefix widget run test:e2e"
        status: pass
  - deliverable: "Google Chrome and Discord end-of-phase walkthrough"
    human_judgment: true
    rationale: "Requires real Chrome UI, authenticated fictional Discord and child-friendly tone judgment; pending UAT"
---

# Phase 1 Plan 04: Consentful draft lifecycle and Chrome demo

Two tasks complete plus two review fixes. Final Vitest: 8 files, 36 tests PASS. Full Playwright: 35 PASS across six specs, including one expected capture-phase failure. Back test observed pageshow.persisted true. Draft reset, SPA retention, explicit replacement, selected-link extraction, Unicode, empty guard, plain-text URL, send failure and late pagehide answers are covered. README supplies the nine-step Google Chrome and Discord walkthrough. Review fixes reject stale top-document selection when an iframe is active and constrain the panel in a 280px viewport.

## Task Commits

4a6c66d fix(01-04): exclude stale iframe selection and fit narrow viewports
f9326a7 test(01-04): reproduce stale frame selection and narrow panel overflow
1425b45 feat(01-04): explain capped content and document Chrome demo
b372aa7 test(01-04): pin Unicode privacy failure and truncation edges
7a4b1da feat(01-04): preserve explicit draft consent and reset on document exit
74e9098 test(01-04): expose pending selection and extracted link behavior

## Deviations from Plan

Direct Codex execution as permitted by the plan. Tests preceded behavior changes, then passed after implementation. No package changes. Rule 1 bug fixes from review: active iframe now excludes stale parent selection; CSS max-width fits narrow viewports. The bfcache test uses waitUntil commit because cached restores have no load event. GSD JUnit parser reports file names in place of test names; filtered real failing reports still validate as RED_EVIDENCE_OK. The Task 1 RED validator was initially run with the full failing suite and rejected; a target-only run against the unchanged baseline proved the intended assertion before final GREEN validation.

## Issues Encountered

Real Google Chrome toolbar and Discord composer checks remain for end-of-phase UAT. The earlier tracer Discord keyboard check is already approved.

## Self-Check: PASSED

Artifacts exist and all automated checks for this plan pass. No dependencies, assets or shared files changed.
