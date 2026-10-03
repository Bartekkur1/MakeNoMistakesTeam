---
phase: "01"
slug: "kontrakt-i-backend-spraw"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
block_on: high
created: "2026-10-03"
deploy_pending: true
---

# Phase 01 - Security

> Per-phase security contract: threat register, accepted risks, and audit trail.
> Verification is code-level (tree at 97f4317, after the review-fix merge 91ad48c). See "Deployment gaps" - three threats are not yet closed in production.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Client -> API | Extension, panel, phone and Roblox server call `/api/...` over https with a Bearer token | Report content (may hold a child's text), demo credentials, tokens |
| Extension scope vs panel scope | The child's device holds an `extension` token (create + list only); history and comments need `panel` | Comments, escalation notes, history |
| Parent vs parent / teacher vs class | `canView` and `listScopeFor` restrict reports to the owning parent and, once visible, the child's teacher | Report detail and lists |
| API server -> Supabase | Only the Next.js server talks to Supabase, with the service_role key from env (D-03) | All stored data, service_role key |
| Repo / docs -> public | Planning docs, README and CONTRACT.md are committed | Variable names only, never values |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-01-01 | Information disclosure | examples, demo dataset, demo accounts | medium | mitigate | `.example` domains enforced by the contract checker | closed |
| T-01-02 | Spoofing | demo login with public code 0000 | low | accept | D-14, see AR-01 | closed |
| T-01-03 | Information disclosure | token transport | medium | mitigate | Authorization header only, no credentials in CORS | closed |
| T-01-04 | Elevation of privilege | transition matrix | high | mitigate | Per-row roles in TRANSITIONS, checker replays history | closed |
| T-01-05 | Information disclosure | comments and history vs the child | high | mitigate | Panel scope required on detail, transitions, comments | closed |
| T-01-06 | Information disclosure | teacher visibility | high | mitigate | canView / expectedList, TEACHER_VISIBLE_STATES | closed |
| T-01-07 | Repudiation | contract approval | medium | mitigate | Blocking-human decision, recorded in CONTRACT.md | closed |
| T-01-08 | Information disclosure | COVERAGE.md and STATE notes | low | mitigate | Key-shaped-string grep clean | closed |
| T-01-09 | Information disclosure | supabase.ts, client bundles | high | mitigate | Single SDK import, unprefixed env names, no secrets in `.next/static` | closed |
| T-01-10 | Information disclosure | error responses | medium | mitigate | Contract-constant messages only | closed |
| T-01-11 | Denial of service | readJsonBody | medium | mitigate | Streaming 32 KB cap (CR-01 fix 9d68cc4) | closed (code) - deploy pending |
| T-01-12 | Spoofing | bearer tokens | high | mitigate | HMAC-SHA256, timingSafeEqual, exp, account and scope checks | closed |
| T-01-13 | Spoofing | brute force / enumeration | low | accept | D-14, identical error bodies, see AR-02 | closed |
| T-01-14 | Elevation of privilege | extension scope for a teacher | medium | mitigate | 403 on login, verifyToken rejects | closed |
| T-01-15 | Information disclosure | server logs | medium | mitigate | Only http.ts logs, codes and names only | closed |
| T-01-16 | Spoofing | CORS `*` | low | accept | No cookies, no Allow-Credentials, see AR-03 | closed |
| T-01-17 | Denial of service | missing or weak DEMO_AUTH_SECRET | medium | mitigate | Fails closed with 500 | closed |
| T-01-18 | Information disclosure | report detail across parents | high | mitigate | canView, invisible = 404 | closed |
| T-01-19 | Information disclosure | teacher list and detail | high | mitigate | listScopeFor + canView (D-15) | closed |
| T-01-20 | Information disclosure | extension reading history/comments | high | mitigate | Panel scope, exact-key list bodies | closed |
| T-01-21 | Tampering | client-supplied ids and state | medium | mitigate | parseNewReport reads 4 keys, parent/child from session | closed |
| T-01-22 | Repudiation / Integrity | false save confirmation | high | mitigate | Only the returned row confirms; otherwise 503 | closed |
| T-01-23 | Elevation of privilege | Supabase REST/RPC via anon key | high | mitigate | RLS without policies, execute revoked from public/anon/authenticated | closed |
| T-01-24 | Tampering | injection via list params / cursor | medium | mitigate | Bound RPC args, strict cursor and limit validation | closed |
| T-01-25 | Denial of service | large lists | low | mitigate | pageMax 100, DB limit guard, indexes | closed |
| T-01-26 | Information disclosure | empty scope returning all rows | high | mitigate | Throws in code and in list_reports | closed |
| T-01-27 | Elevation of privilege | forbidden transitions | high | mitigate | resolveTransition before write, DB CHECK | closed |
| T-01-28 | Tampering | concurrent transitions | medium | mitigate | Conditional update on expected state, 409 | closed |
| T-01-29 | Repudiation | history and comment tampering | medium | mitigate | Insert-only API, update triggers; delete/truncate guards in migration 20261003170200 (WR-03) | closed (code) - migration pending |
| T-01-30 | Spoofing | actor / author identity | high | mitigate | Taken from the session only | closed |
| T-01-31 | Information disclosure | comments thread | high | mitigate | Panel scope + canView | closed |
| T-01-32 | Tampering | seed re-run on shared project | low | mitigate | Single delete limited to 6 dataset ids, generated seed | closed |
| T-01-33 | Information disclosure | free-text may hold a child's personal data | low | accept | Fictional demo data only, see AR-04 | closed |
| T-01-34 | Information disclosure | repo files and docs | high | mitigate | Names only, `.env*` gitignored, key grep clean | closed |
| T-01-35 | Spoofing | weak production DEMO_AUTH_SECRET | high | mitigate | Server refuses < 32 chars; human generated with openssl | closed |
| T-01-36 | Information disclosure | Heroku logs | low | mitigate | Same as T-01-15 | closed |
| T-01-37 | Tampering | demo data during presentation | low | mitigate | Smoke writes with smoke accounts only; seed resets | closed |
| T-01-38 | Denial of service | public endpoint | medium | mitigate | Body cap, page cap, fail-fast validation, 8 s storage timeout (WR-02) | closed (code) - deploy pending |
| T-01-39 | Spoofing / Information disclosure | transport | low | mitigate | https only in CONTRACT.md; live https smoke OK | closed |
| T-01-SC (01-01) | Tampering | package installs | low | accept | No installs, see AR-05 | closed |
| T-01-SC (01-02) | Tampering | npm installs | high | mitigate | Blocking-human legitimacy checkpoint, approved | closed |
| T-01-SC (01-03) | Tampering | npm installs | high | mitigate | Only approved names/versions, lockfile from registry.npmjs.org | closed |
| T-01-SC (01-04) | Tampering | package installs | low | accept | No installs, see AR-05 | closed |
| T-01-SC (01-05) | Tampering | package installs | low | accept | Node built-ins only, see AR-05 | closed |
| T-01-SC (01-06) | Tampering | package installs | low | accept | No imports, global fetch, see AR-05 | closed |

*Status: open · closed · open - below high threshold (non-blocking)*
*Severity: critical > high > medium > low - only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

Evidence (file:line per threat) is in the 2026-10-03 auditor verdict; key files: `web-app/src/lib/server/{auth,access,http,validate,reports,supabase}.ts`, `web-app/src/app/api/**/route.ts`, migrations `20261003170000`, `20261003170100`, `20261003170200`, `web-app/scripts/check-contract-examples.mjs`, tests under `web-app/tests/`.

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-01-02 | Demo login with the public code `0000` for fictional accounts (D-14, API-06; CONTRACT.md "nie jest zabezpieczeniem produkcyjnym", API-V2-03). Consequence on the live site: the extension/panel scope split and the per-account visibility rules are enforced in code but are NOT a security boundary - anyone who knows the public demo e-mails can log in as any account with panel scope and read or transition any report (code review WR-04). No real personal data may go through the demo API. | User decision D-14 (phase 01 discussion) | 2026-10-03 |
| AR-02 | T-01-13 | No rate limiting on login; the code is public anyway (D-14). Unknown e-mail and wrong code return identical bodies. | User decision D-14 | 2026-10-03 |
| AR-03 | T-01-16 | CORS `*` is safe because tokens are Bearer headers, never cookies, and Allow-Credentials is never set. | Plan 01-03 threat model | 2026-10-03 |
| AR-04 | T-01-33 | Comments and escalation notes are free text; demo uses fictional data only; production data handling is out of scope (API-V2-03). | Plan 01-05 threat model | 2026-10-03 |
| AR-05 | T-01-SC (01-01, 01-04, 01-05, 01-06) | These plans install no packages; scripts use Node built-ins and global fetch only. | Plan threat models | 2026-10-03 |

*Accepted risks do not resurface in future audit runs.*

---

## Deployment gaps (human steps pending)

Code-level status is closed for all threats. Production lags on:

1. **T-01-11, T-01-38** - redeploy the branch containing merge `91ad48c` to Heroku (CR-01 streaming body cap, WR-02 storage timeout, WR-01 validation). Until then a chunked body without Content-Length is unbounded on https://bezpieczna-aura.pl.
2. **T-01-29** - apply `web-app/supabase/migrations/20261003170200_append_only_guards.sql` in Supabase. Until then the live DB blocks only UPDATE of history and comments (the originally declared mitigation); DELETE/TRUNCATE guards are missing.

Informational, no threat ID: `npm audit` reports 5 high advisories in the dev-only `eslint-config-next` chain (01-03-SUMMARY); not shipped to production.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-03 | 45 | 45 (3 code-only, deploy pending) | 0 | gsd-security-auditor (ASVS L1, block_on high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-03 (code); production closure pending redeploy and migration 20261003170200
