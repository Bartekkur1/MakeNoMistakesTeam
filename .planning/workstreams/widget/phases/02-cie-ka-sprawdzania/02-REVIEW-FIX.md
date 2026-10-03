---
phase: 02
status: all_fixed
findings_in_scope: 8
fixed: 8
skipped: 0
requirements-completed: []
iteration: 1
---

# Phase 02: Code Review Fix Report

All eight requested findings from `02-REVIEW.md` are fixed. This pass covers CR-01 and WR-01 through WR-07 only. Info findings remain outside scope. The driver performed every git write in the dedicated worktree based on `ad7507a0b0a8c1dad1043ca3f4499202202a2358`.

## Findings

| Finding | Status | Commit | Notes |
|---------|--------|--------|-------|
| CR-01 | fixed | `468f4d9` | Standalone payment answers emit `payment`, resolve the existing Polish reason, and cannot pair caution with the no-signals fallback. Corrected the unit assertion that required empty signals. |
| WR-01 | fixed | `468f4d9` | A child-reported prize emits `prize` without a link and selects `verify_prize`; linked prizes retain their specific signal. |
| WR-02 | fixed | `468f4d9` | Unknown request/urgency statements are omitted when corresponding recognized evidence is present. Engine and rendered-output regressions cover each fact independently. |
| WR-03 | fixed | `9d69799` | Verification answers never receive suggestion badges. Sender/request hints remain unselected; internal link evidence still contributes to prize evaluation. |
| WR-04 | fixed | `c1eba1a` | Explicit verb, pronoun, login-conjunction, and SMS-code patterns cover common demands. Unquoted reporting exclusions stop at clause boundaries and preserve attached loss threats. Quoted reports and honest/negated counterexamples remain unflagged in fixtures. |
| WR-05 | fixed | `631aad0` | Normalized unchanged candidates resume the old check before submission, preserving the original case/result and avoiding duplicate cases. Controller tests assert exactly one initial submission. |
| WR-06 | fixed | `631aad0` | Invalid current approvals enter the failure transition and release the lock; the controller handles false returns. Candidates, old checks, closed-window state, retries, and stale-generation guards are tested. |
| WR-07 | fixed | `1adf38f` | Engine and store use one deeply frozen `QUESTIONS` definition. A test compares every question/option ID in the Polish content pack against that definition. |

## TDD Evidence

| Group | RED commit | Fix commit | Assertion reproduced |
|-------|------------|------------|----------------------|
| 1: CR-01, WR-01, WR-02 | `3ae1a39` | `468f4d9` | Payment rendering contains the forbidden no-signals fallback; additional tests expose dropped prizes and contradictory unknowns. |
| 2: WR-03 | `e211329` | `9d69799` | A neutral link produces one verification suggestion badge instead of zero. |
| 3: WR-04 | `a440506` | `c1eba1a` | A login-and-password demand produces no password hint. Additional cases cover short demands and report-prefix evasions. |
| 4: WR-05, WR-06 | `2616596` | `631aad0` | Unchanged edit approval sends two cases instead of one. Additional cases reproduce locked invalid approvals and ignored rejection results. |
| 5: WR-07 | skipped RED | `1adf38f` | Existing lists already matched, so duplication had no current behavioral mismatch. Consolidation and the equality test prevent future drift. The finding itself is fixed, not skipped. |

The driver recorded `02-REVIEW-FIX-T1-RED.json` through `02-REVIEW-FIX-T4-RED.json`. All four records independently return `RED_EVIDENCE_OK` from `gsd-tools check tdd-red-evidence`. Each target failed on its intended assertion before implementation. Temporary JUnit reports preserve outcomes and exit status and put testcase `name` first for the existing parser limitation.

## Verification

- Final full unit suite: `npm --prefix projects/widget test` — **197 passed across 9 files**, no failing or skipped tests. The review base had 154 tests; this pass adds 43 behavior/contract tests and corrects the existing payment expectation.
- Final targeted browser suite: `npm --prefix projects/widget run test:e2e -- tests/e2e/check.spec.mjs --output=/tmp/widget-review-e2e` — **18 passed**.
- Final full browser suite: `npm --prefix projects/widget run test:e2e -- --output=/tmp/widget-review-full-e2e` — **69 passed** in 2.8 minutes: 68 ordinary passes plus the inherited expected capture-phase failure, **zero unexpected failures**.
- Modified JavaScript syntax checks and `git diff --check` pass. The unchanged source-scan passes within the unit suite.
- Each fix group passed the full unit suite and all 18 checking browser scenarios before its fix request. Final full-browser coverage also includes consent, double approval, privacy, tabs, reload, real bfcache, dragging, keyboard input, and narrow viewports.

## Adjustments and Scope

- The first WR-03 browser run found an existing link-edit assertion requiring the defective verification badge. Updated that single expectation to zero, preserving its reset, case-count, result-attribution, and local-network assertions. This is a directly related Rule 1 regression-test correction.
- The initially generated untracked JUnit file was removed. Subsequent RED reports and browser output use temporary paths; no runtime artifact is part of the fix commits.
- Polish display strings remain in `projects/widget/src/ui/strings.pl.js`; existing payment and prize copy is reused. No dependency, permission, shared material, asset, storage, or external delivery change was introduced. STATE.md, ROADMAP.md, and REQUIREMENTS.md remain unchanged.
- Recognition remains a narrow deterministic rule set, not full semantic analysis or a safety guarantee. Existing human tone/visual UAT and the documented capture-phase limitation remain outside these code fixes; no new expected-failure exemption was added.

## Self-Check: PASSED

All eight in-scope findings have accepted fix commits, with zero skipped findings. The nine task commits are reachable in RED/fix order; group 5's RED exception is documented. All four RED records, modified deliverables, final unit/browser checks, and whitespace checks were verified. The worktree was clean before this report was written. No git write was performed by the fixer, and no out-of-scope implementation or unresolved in-scope blocker remains.
