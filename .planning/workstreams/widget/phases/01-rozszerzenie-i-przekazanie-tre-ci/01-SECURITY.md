---
phase: "01"
slug: rozszerzenie-i-przekazanie-tre-ci
status: verified
threats_open: 0
asvs_level: 1
register_authored_at_plan_time: true
created: "2026-10-03T17:22:05.578826+00:00"
---

# Phase 01 Security

L1 audit against all four plan-authored threat registers. Closed means specified mitigation exists or the plan already documents acceptance; it does not mean every page is trustworthy. No new risk acceptance was inferred.

## Trust Boundaries

Page to content script: only deliberate selected text or child-entered paste. Content script to service worker: explicit approval with a validated case and own-extension sender. Page lifecycle resets only in-memory draft. Toolbar restore uses a user gesture and packaged content.js.

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Evidence | Status |
|-----------|----------|-----------|----------|-------------|----------|--------|
| T-01-01 | Information disclosure | content script on all URLs (main.js, capture.js) | high | mitigate | no-background-reading, source-scan, host tests; planted-listener failure | closed |
| T-01-02 | Information disclosure | buildCase / case object | medium | mitigate | case validator, approve/content tests; exact keys, pending guard, token and honest failure | closed |
| T-01-03 | Tampering (XSS) | panel.js rendering of selected/pasted text and link | high | mitigate | source-scan and content tests; no anchors, no remote URL requests | closed |
| T-01-04 | Spoofing | sw.js runtime.onMessage | medium | mitigate | case validator, approve/content tests; exact keys, pending guard, token and honest failure | closed |
| T-01-05 | Information disclosure | keystrokes typed in the preview reaching Discord's composer or hotkeys | high | mitigate | host bubble containment; tracer keylog; approved Discord tracer in 01-01; expected capture failure and documented iframe fallback | closed |
| T-01-06 | Information disclosure | open shadow root readable by the page | medium | accept | Plan-authored accepted risk, README security notes | closed |
| T-01-07 | Repudiation | confirmation UI claiming delivery | medium | mitigate | case validator, approve/content tests; exact keys, pending guard, token and honest failure | closed |
| T-01-08 | Elevation of privilege | manifest permissions / remote code | medium | mitigate | no-background-reading, source-scan, host tests; planted-listener failure | closed |
| T-01-SC | Tampering | npm installs (esbuild, vitest, happy-dom, @playwright/test) | high | mitigate | 01-01 package checkpoint approval and pinned lockfile; no package changes in this execution | closed |
| T-01-24 | Information disclosure | content script on all URLs (main.js, capture.js) | high | mitigate | no-background-reading, source-scan, host tests; planted-listener failure | closed |
| T-01-25 | Information disclosure | keystrokes reaching a page's capture-phase listeners | high | mitigate | host bubble containment; tracer keylog; approved Discord tracer in 01-01; expected capture failure and documented iframe fallback | closed |
| T-01-19 | Tampering | approval handler (main.js, draft.js) | medium | mitigate | case validator, approve/content tests; exact keys, pending guard, token and honest failure | closed |
| T-01-20 | Information disclosure | captureSelection on focused fields | high | mitigate | edges fields tests and content password/iframe zero-read assertions | closed |
| T-01-21 | Repudiation | D-04 and palette proofs passing on nothing | medium | mitigate | no-background-reading, source-scan, host tests; planted-listener failure | closed |
| T-01-09 | Denial of service | avatar covering Discord's composer or page controls | medium | mitigate | presence/avatar/menu tests; threshold, clamp, acknowledged restore and stale host handshake; real toolbar UAT pending | closed |
| T-01-10 | Elevation of privilege | sw.js executeScript fallback | low | mitigate | presence/avatar/menu tests; threshold, clamp, acknowledged restore and stale host handshake; real toolbar UAT pending | closed |
| T-01-11 | Tampering | page overlay or clickjacking above our max z-index (top-layer dialog/popover) | low | accept | Plan-authored accepted risk, README security notes | closed |
| T-01-12 | Tampering (XSS) | paste view rendering pasted text and link | high | mitigate | source-scan and content tests; no anchors, no remote URL requests | closed |
| T-01-22 | Denial of service / Spoofing | stale orphaned host or a page-planted element with our tag blocking the avatar | low | mitigate | presence/avatar/menu tests; threshold, clamp, acknowledged restore and stale host handshake; real toolbar UAT pending | closed |
| T-01-23 | Information disclosure | paste-view text kept between openings | low | mitigate | draft/panel tests; source-scan storage prohibition; genuine persisted bfcache restore | closed |
| T-01-13 | Information disclosure | draft persisted to disk or page storage | high | mitigate | draft/panel tests; source-scan storage prohibition; genuine persisted bfcache restore | closed |
| T-01-14 | Information disclosure | bfcache restoring an old draft after Back | medium | mitigate | draft/panel tests; source-scan storage prohibition; genuine persisted bfcache restore | closed |
| T-01-26 | Tampering | approval answer arriving after the page was left | medium | mitigate | case validator, approve/content tests; exact keys, pending guard, token and honest failure | closed |
| T-01-15 | Tampering | new selection silently overwriting the child's edited draft | low | mitigate | draft/panel tests; source-scan storage prohibition; genuine persisted bfcache restore | closed |
| T-01-16 | Information disclosure / Elevation | suspicious link opened, fetched or previewed | high | mitigate | source-scan and content tests; no anchors, no remote URL requests | closed |
| T-01-17 | Repudiation | send failure shown as success | medium | mitigate | case validator, approve/content tests; exact keys, pending guard, token and honest failure | closed |
| T-01-18 | Tampering | Unicode edge (lone surrogates, NBSP) corrupting the stored case | low | mitigate | case validator, approve/content tests; exact keys, pending guard, token and honest failure | closed |

## Accepted Risks Log

- T-01-06: open shadow root can be read by its page; accepted by phase CONTEXT/PLAN for fictional-data MVP. Closed roots do not isolate composed events.
- T-01-11: page top-layer overlay can cover the helper; accepted in plan 01-03.
- T-01-05/T-01-25 residual: capture-phase page keyboard listeners remain observable; tracer Discord check already passed, known limit is executable and README gives iframe fallback. Final Google Chrome checks remain UAT, not implied approval.

## Audit Trail

2026-10-03T17:22:05.578826+00:00: 27 unique threats reviewed at L1, all specified mitigations or existing acceptances found, 0 blocking threats open. Repeated T-01-SC is one shared supply-chain threat.

## Sign-Off

Mitigations verified against source and passing tests. Final demo behavior and tone await human UAT.
