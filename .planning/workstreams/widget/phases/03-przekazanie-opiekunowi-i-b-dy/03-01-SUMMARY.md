---
phase: 03-przekazanie-opiekunowi-i-b-dy
plan: "01"
subsystem: widget
tags: [chrome-extension, mv3, parent-login, trusted-storage, report-transport, privacy]
requires:
  - phase: 02-cie-ka-sprawdzania
    provides: "Approved cases, local checking and the existing guardian demo with lifecycle guards"
provides:
  - Packaged parent login/options page with two local/form steps and a parent-only demo dialog
  - Worker-only authenticated transport and credentials-only trusted storage
  - Local session metadata, revision-guarded login/logout and single-flight renewal
  - Strict report request/saved-row validation and honest delivery outcomes
  - Bounded volatile report outcomes scoped to tab, document and case
  - Preserved local browser fixtures and the D-16 documentation corrections
affects: [widget-03-02, widget-03-03, widget-phase-3-uat]
actuals:
  tokens: 13862
  tasks: 3
  commits: 3
plan_head_before: 3fcd4dc64d1374dbb26d62c4df7e90eb8e68d274
plan_head_after: 848b8b5ebf9ea16b51cc33556641d60dd7a248de
tech-stack:
  added: []
  patterns: [native-options-dom, worker-only-api, trusted-credentials-only-storage, serialized-session-mutations, revision-guards, single-flight-renewal, volatile-document-scoped-outcomes]
key-files:
  created:
    - projects/widget/src/options/login.js
    - projects/widget/src/options/login.css
  modified:
    - projects/widget/build.mjs
    - projects/widget/manifest.json
    - projects/widget/src/background/sw.js
    - projects/widget/src/core/integration.js
    - projects/widget/tests/unit/source-scan.test.js
    - projects/widget/tests/e2e/extension.fixture.mjs
    - projects/widget/tests/e2e/draft.spec.mjs
    - .planning/workstreams/widget/REQUIREMENTS.md
    - .planning/workstreams/web-app/STATE.md
key-decisions:
  - "D-00: import only canonical runtime constants from the frozen types.ts; backend and shared contract remain unchanged."
  - "D-10: retain fictional demo credentials in one trusted auraSession entry; expired local status does not renew the session."
  - "D-04: only confirmed 401 permits one report replay; started fetch rejection and invalid 2xx remain unknown."
  - "Local clear preserves active and confirmed cache entries as duplicate-send guards; unsuccessful outcomes can be cleared, and lifecycle/TTL/capacity remove completed records."
  - "D-16: status from GET /api/reports represents the guardian decision; no child reply is introduced."
requirements-completed: [HND-01, ERR-01]
coverage:
  - id: D1
    description: "Exact MV3 permissions, authorized hosts and options entry retain top-frame injection and exposure guards."
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/source-scan.test.js#manifest keeps the minimal permission and exposure contract"
        status: pass
    human_judgment: false
  - id: D2
    description: "Build packages external login assets and restricts AURA_API to the demo or localhost origin."
    verification:
      - kind: other
        ref: "npm --prefix projects/widget run build; localhost build; unauthorized-path build rejection; copied-asset cmp checks"
        status: pass
    human_judgment: false
  - id: D3
    description: "Two-step Polish parent login, OTP, demo dialog, connected state and logout follow UI-SPEC."
    verification:
      - kind: other
        ref: "Task 1 LOGIN_BOUNDARY_SOURCE_OK command and Task 2 source inspection"
        status: pass
    human_judgment: true
    rationale: "No new UI scenarios were added; Chrome focus, visual parity and real login/save/error behavior need manual verification."
  - id: D4
    description: "Trusted worker credential storage and revision guards expose only safe session metadata."
    verification:
      - kind: other
        ref: "Task 1 acceptance source inspection: trustedStorage, saveSession, clearSession, publicAccount and exact sender/envelope gates"
        status: pass
    human_judgment: true
    rationale: "Storage failures, account races and content-context access were reviewed in source but not exercised by new automated tests."
  - id: D5
    description: "Opening installed options and reading local session status never initiate renewal, including expired saved sessions."
    verification:
      - kind: e2e
        ref: "Required tracer/menu/avatar and draft runs retain assertOnlyLocal with the install tab present"
        status: pass
    human_judgment: true
    rationale: "Existing scenarios cover installation with no saved account; the expired-session branch requires manual Chrome verification."
  - id: D6
    description: "Exact report DTO and saved-row validation distinguish confirmed, offline, HTTP and unknown outcomes."
    requirement: ERR-01
    verification:
      - kind: other
        ref: "Task 3 REPORT_BOUNDARY_SOURCE_OK command and acceptance source inspection"
        status: pass
    human_judgment: true
    rationale: "No transport scenarios were added or live backend contacted; malformed responses, failures and timeouts need controlled manual verification."
  - id: D7
    description: "Explicit API operations share renewal and allow one replay only after confirmed 401, with stale-account guards."
    requirement: ERR-01
    verification:
      - kind: other
        ref: "sw.js refreshSession, reportSession and dispatchReport source inspection"
        status: pass
    human_judgment: true
    rationale: "Single-flight, logout/new-account races and 401 replay behavior have source evidence only under the no-new-tests policy."
  - id: D8
    description: "Volatile outcomes deduplicate active/confirmed cases, cap entries at 100 and clean document/tab namespaces."
    requirement: HND-01
    verification:
      - kind: other
        ref: "sw.js reportOutcomes, pruneCompletedOutcomes, scopeAlive and lifecycle source inspection"
        status: pass
    human_judgment: true
    rationale: "New cache boundaries and worker-restart behavior were not exercised by additional automated scenarios."
  - id: D9
    description: "Inherited local capture, menu, drag, draft and bfcache behavior retains network and content-persistence guards."
    verification:
      - kind: e2e
        ref: "npm --prefix projects/widget run test:e2e -- tests/e2e/tracer.spec.mjs tests/e2e/menu.spec.mjs tests/e2e/avatar.spec.mjs"
        status: pass
      - kind: e2e
        ref: "npm --prefix projects/widget run test:e2e -- tests/e2e/draft.spec.mjs"
        status: pass
      - kind: unit
        ref: "npm --prefix projects/widget test -- tests/unit/presence.test.js tests/unit/guardian-request.test.js tests/unit/source-scan.test.js"
        status: pass
    human_judgment: false
  - id: D10
    description: "Privacy scan exceptions are limited to worker fetch/storage and options copy, preserving all unsafe-sink bans."
    verification:
      - kind: unit
        ref: "projects/widget/tests/unit/source-scan.test.js"
        status: pass
    human_judgment: false
  - id: D11
    description: "D-16 corrects HND-02/HND-03 wording and records the web-app status interpretation without changing progress."
    verification:
      - kind: other
        ref: "git diff and rg inspection of widget REQUIREMENTS.md and web-app STATE.md"
        status: pass
    human_judgment: false
duration: 17min
completed: 2026-10-04
status: complete
---

# Phase 3 Plan 01: Parent connection and authenticated report authority Summary

**The packaged parent page now connects through trusted worker storage, while the worker admits exact report DTOs, renews sessions only for explicit operations and confirms delivery only from a validated saved report.**

## Performance

- Measured verification window: 2026-10-04T02:47:05Z through 2026-10-04T03:04:11Z, approximately 17 minutes; preparatory reads are not timed.
- Tasks: 3/3; implementation/test/documentation files: 11, including two new source files.
- Actual estimate: ceiling of 55,445 accepted task-diff characters divided by four = 13,862 tokens. This is a diff-size metric, not model usage; it excludes this SUMMARY.

## Accomplishments

- `build.mjs` emits a Polish responsive HTML shell with external JS/CSS, copies the unmodified palette/avatar and bundles the native options page. Configuration accepts only the two authorized origins, optionally with a trailing slash; no runtime URL field exists.
- Login validates email locally, then collects four numeric digits with paste/autofill distribution, arrows, Backspace and overwrite. Pending locks submission; connected state waits for confirmed persistence. Exact Polish credential, teacher, network and storage messages are used. The modal exposes only three parent demo accounts and fills email without traffic; logout requires no PIN or confirmation.
- The worker restricts storage to TRUSTED_CONTEXTS, stores only token/expiry/account/email/code and returns public account metadata. Session mutations are serialized and revision guarded. Local status accepts a valid expired saved demo session without fetching. Install opens options only for reason `install`.
- Report payloads have exactly four fields, canonical enums and compatible unique actions, trimmed nonempty content, Unicode/code-point and UTF-8 body limits. Successful rows require exact canonical fields, UUIDs, UTC dates, expected parent, pending state and posted values. Invalid JSON, 204 or malformed/mismatched 2xx never confirm delivery.
- Renewal is shared by account revision, preserves credentials on network failure, and saves before report dispatch. Only a confirmed 401 allows one replay; no health probe, generic retry or backoff exists. The private outcome cache preserves recipient snapshots, bounds records, retains active entries during pruning and cleans namespaces on navigation/tab closure.
- Existing browser fixtures keep the install tab and create a separate content page. Draft checks now enforce credentials-only extension persistence while retaining empty page storage and zero external traffic. D-16 wording was changed without touching checkboxes or traceability.

## Task Commits

Driver-created commits, oldest first:

1. **Task 1: Parent login tracer** — `5b3f21d` (feat): packaged email/code login, trusted session storage and safe RPC adapters.
2. **Task 2: Presentation and privacy exceptions** — `db30d38` (feat): login styling, native parent demo dialog and narrow existing scan updates.
3. **Task 3: Transport, renewal, fixtures and D-16** — `848b8b5` (feat): validated report outcomes, bounded cache, browser fixture compatibility and scoped document edits.

The driver reported each commit accepted. The executor performed no git writes.

## Deviations from Plan

None. Changes stay within `files_modified`; no dependency or architecture change was required. Active/confirmed outcome entries remain duplicate guards when local clear is requested; unsuccessful outcomes can be cleared. Navigation, tab closure, completed-entry TTL and capacity pruning provide the planned bounded lifetime.

## Issues Encountered

- Two initially overlapping Playwright commands shared `test-results`; one run ended with an ENOENT while closing a trace artifact, rather than a product assertion failure. Both required browser commands were then run sequentially and passed: 30/30 and 10/10. No assertion, skip or expected failure was added to work around it.
- Chromium launched successfully in the sandbox. The existing NO_COLOR/FORCE_COLOR warning is informational.
- No external service was contacted and no live smoke write was performed. Existing tests exercise inherited behavior; the new credential/transport fault branches and visual judgments remain manual checks, explicitly classified above.

## Test Policy

No new automated test file, case or scenario was written, and no RED/TDD step occurred. No package was installed or upgraded. Only these existing test files/harnesses changed:

| File | Minimal planned update |
|------|------------------------|
| `tests/unit/source-scan.test.js` | Allow fetch/chrome.storage only in `background/sw.js`, Polish options copy only in `options/login.js`, and assert the exact new permission/host/options contract. Keep capture/RPC sites, unsafe sinks, top-frame and exposure guards. |
| `tests/e2e/extension.fixture.mjs` | Give existing scenarios an explicit content page and identify the install-opened login tab by URL; keep it open and preserve `assertOnlyLocal`. No global API allowance or stub was introduced. |
| `tests/e2e/draft.spec.mjs` | Replace the unavailable-storage assumption in the existing storage case with an exact credentials-only metadata whitelist. Preserve empty page storage, local message counts and network guards. |

Paths in this table are relative to `projects/widget/`. `presence.test.js` and `guardian-request.test.js` were run unchanged. No unrelated tests were deleted, skipped or weakened.

| Command/check | Final result |
|---------------|--------------|
| `npm --prefix projects/widget run build` | PASS, including final plan verification |
| `npm --prefix projects/widget test -- tests/unit/presence.test.js` | PASS, 11 tests |
| Task 1 source-boundary `node -e` command from PLAN.md | PASS, `LOGIN_BOUNDARY_SOURCE_OK` |
| `npm --prefix projects/widget test -- tests/unit/source-scan.test.js` | PASS, 3 tests, including final plan verification |
| Task 3 source-boundary `node -e` command from PLAN.md | PASS, `REPORT_BOUNDARY_SOURCE_OK` |
| `npm --prefix projects/widget run test:e2e -- tests/e2e/tracer.spec.mjs tests/e2e/menu.spec.mjs tests/e2e/avatar.spec.mjs` | PASS, 30 tests on sequential rerun |
| `npm --prefix projects/widget run test:e2e -- tests/e2e/draft.spec.mjs` | PASS, 10 tests on sequential rerun |
| `npm --prefix projects/widget test -- tests/unit/presence.test.js tests/unit/guardian-request.test.js tests/unit/source-scan.test.js` | PASS, 61 existing tests |
| `AURA_API=http://localhost:3000 npm --prefix projects/widget run build` | PASS; default build restored afterward |
| Build with unauthorized `/unapproved` API path | Correctly rejected before building, exit 1 (expected configuration rejection) |
| Copied palette/avatar `cmp`; `git diff --check` | PASS |

Task acceptance gates were reviewed using source/file/CLI evidence: email collection and demo selection remain local; public RPC projections omit secrets; revisions guard saves/dispatch; report validation and the sole 401 replay branch are explicit; cache pruning excludes active entries; D-16 wording is exact. Source markers and inspections do not substitute for behavioral coverage of the new transport.

## Manual Verification Checklist

Use Google Chrome and fictional data only. Presentation account: **Mama Oli (demo)**, `rodzic.ola@bezpiecznaaura.example`, code `0000`. No live report smoke writes are required for this plan.

1. Load unpacked `projects/widget/dist`. Confirm one login tab opens and no API request is made merely by installation/opening it. Reload/update the extension and confirm the install-only handler does not open an extra login tab.
2. Compare the options page beside web-app `/login`: Scamerinio avatar/brand, two-step card, palette, readable Polish copy, 48×56 digit boxes, and visible blue keyboard focus. Resize the page and reach every control by keyboard.
3. Open **Zobacz konta demo**. Confirm only Mama Oli, Tata Kuby and Mama Zosi appear with their canonical `.example` emails; no teacher or smoke account is listed. The code is visible only inside this dialog. Close with Escape and **Zamknij**; focus returns to the opener. Pick **Użyj** beside Mama Oli: email is filled, the dialog closes, and no API call occurs.
4. Submit an empty or malformed email and check the exact field error. Enter a syntactically valid unknown `.example` email: **Dalej** opens code entry without a request. Submit code and compare its error with a wrong code for Mama Oli: both show **Nieprawidłowy e-mail lub kod.**, clear all digits and focus box 1.
5. Enter Mama Oli email, then `0000`. Filling the fourth box or pressing Enter starts exactly one extension-scope login with only email/code/scope in the body. Pending shows **Logowanie…**, disables buttons and makes digits read-only. Success displays the returned Mama Oli name and **Wtyczka połączona** only after storage succeeds.
6. Try paste/autofill of four digits, selected-digit overwrite, arrows and Backspace. Confirm correct distribution despite `maxlength=1`, reachable fields and no duplicate submission.
7. Try the fictional teacher account `nauczyciel.5a@bezpiecznaaura.example` with `0000`. Confirm the exact parent-only teacher message, with no connected screen. Block the login request or use an unavailable local backend to check the network message; simulate a local storage failure to check the distinct save message and absence of false success.
8. Close and reopen options after Mama Oli login. Confirm remembered login and no API request from the local read. In worker DevTools set saved `expires_at` to a valid past UTC date, then reopen options: it still reports connected with no renewal traffic. Renewal waits for an explicit authenticated operation.
9. Inspect extension storage from worker DevTools: only `auraSession` and its five allowed fields, with canonical account metadata. Confirm child/content context cannot read credentials from `chrome.storage.local`, and no case, draft, result or report list is persisted. Use only fictional credentials during inspection.
10. Click **Wyloguj**. Confirm all credentials are removed, the email form returns and the exact logged-out status banner appears without a PIN/confirmation dialog. Simulate failed removal: it must show an error and must not show successful logout.
11. On a child page while logged out, approve a fictional message such as “Podaj kod do konta, aby odebrać nagrodę”. Checking still works locally. Close/reopen, hide/restore and drag the helper; content, choices and focus remain. Reload/navigation clears the document's draft, and no external request occurs.
12. After **03-02** wires explicit sending, repeat on a local backend: expire the session before sending, confirm renewal then POST; corrupt only the saved token while keeping a future expiry, confirm one 401 → renewal → one replay. Initiate sends from two child tabs to inspect shared renewal; log out or select a newer account while renewal is pending and confirm the old operation cannot restore credentials or dispatch under the old account.
13. After **03-02**, use controlled local failure responses for fictional sends: offline before dispatch/503 storage failure must not confirm delivery; other non-2xx remain HTTP failures; lost response/15-second timeout, 204, invalid JSON or a mismatched saved row remain unknown with no automatic POST repeat. Reopen the same case to inspect its recorded recipient/outcome; a confirmed case must not send again. Restart the worker: a lost cache outcome must be missing, never fabricated or automatically replayed.

Steps 1–11 include the plan-level Chrome checklist and Task 1 human-check. Steps 12–13 record manual transport work that depends on the next plan's child UI; they are not claimed completed here. The public demo code must not be presented as production protection or as a request for a child's own credentials.

## Next Phase Readiness

- Ready for **03-02** to consume `readSessionStatus`, `openLogin`, `submitReport`, `readReportOutcome` and `clearReportOutcome` with the planned envelope names. Local `submitCase` and the inherited guardian demo remain unchanged until that plan replaces the child action.
- `isValidSavedReport(report, expectedAccountId, payload = null)` supports canonical states for later report-list reads. Report lists and child handoff screens are outside this plan.
- The scoped HND-02/HND-03 correction and web-app status note are present. No progress checkbox, traceability status, widget STATE/ROADMAP or frozen contract/backend source was changed.
- The required frontmatter requirement IDs describe this plan's contribution; full child preview, explicit-send UI and phase acceptance depend on downstream plans and manual Chrome UAT.
- No implementation blocker remains. Manual login/API/storage judgments and visual parity remain pending; no unverified live-service claim is made.

## Self-Check: PASSED

The two new source files and all modified deliverables exist; the three driver-reported commits are reachable from HEAD in task order. Final build/source-scan gates pass, required browser commands passed sequentially, and whitespace checks pass. The worktree was clean before writing this SUMMARY. Changes use only authorized plan paths, introduce no dependency or new automated test scenario, and leave credentials/report transport outside `self.__aura`. This self-check verifies execution/artifact integrity; it does not mark pending human judgments as passed.
