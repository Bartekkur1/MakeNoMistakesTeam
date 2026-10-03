---
status: testing
phase: 01-kontrakt-i-backend-spraw
source: [01-VERIFICATION.md]
started: 2026-10-03T22:15:00Z
updated: 2026-10-03T22:15:00Z
---

## Current Test

number: 1
name: C4 - two smoke runs at once (local)
expected: |
  With `npm --prefix web-app run dev` running, `npm --prefix web-app run smoke & npm --prefix web-app run smoke; wait`
  ends with `SMOKE OK (http://localhost:3000)` twice.
awaiting: user response

## Tests

### 1. C4 - two smoke runs at once (local)
expected: Both runs end with `SMOKE OK (http://localhost:3000)`; no step returns a 2xx without a persisted row. Tracked as `.planning/WINDOWS.md` entry 1.
result: [pending]

### 2. C3 - local restart persistence (optional)
expected: Smoke once, restart `npm run dev`, then `SMOKE_VERIFY_ID=<id> npm --prefix web-app run smoke` prints `PERSIST OK <id>`. Local and Heroku share one Supabase project, and Heroku already printed PERSIST OK c15607b6-29c9-4b2d-8191-703ff1e35e8d, so this can also be accepted as an override.
result: [pending]

### 3. Sign-off: smoke writes only with the smoke accounts (plan 01-06)
expected: Confirm that `web-app/scripts/smoke-api.mjs` writes (create, approve, comment, escalate, close, reopen) only with `rodzic.test` / `nauczyciel.test`; `rodzic.ola` is read-only. LLM judge: holds.
result: [pending]

### 4. Sign-off: judgment-tier prohibitions (plans 01-02, 01-03, 01-06)
expected: Confirm (LLM judge: all hold): no backend code before contract approval (a8a2b85 before 50fe075); no logging of bodies, e-mails, tokens or env values (only `http.ts` logs, codes and names); no URL in CONTRACT.md before a live smoke (https://bezpieczna-aura.pl smoked before 399a5f8).
result: [pending]

### 5. Override: CONTRACT.md has a custom domain, not `herokuapp.com` (plan 01-06)
expected: Accept that the published base URL is `https://bezpieczna-aura.pl` (custom domain served by Heroku) instead of the plan's expected `*.herokuapp.com` text.
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
