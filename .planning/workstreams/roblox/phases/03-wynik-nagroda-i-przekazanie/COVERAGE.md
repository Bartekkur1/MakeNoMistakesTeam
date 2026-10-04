# API Coverage — Roblox report ingest

> Full coverage by default. Opt-outs are explicit, reasoned decisions. This phase integrates only the first-party report-ingest surface required by SCR-03.

| capability | decision | reason |
|---|---|---|
| POST /api/reports/ingest authentication | INTEGRATE | |
| ingest validation and exercise-safe semantics | INTEGRATE | |
| atomic attempt idempotency and immutable acknowledgement | INTEGRATE | |
| linked-child routing | INTEGRATE | |
| unlinked demo fallback routing | INTEGRATE | |
| bounded Roblox server retries | INTEGRATE | |
| parent report listing/detail UI | OPT-OUT | Existing panel consumes stored reports; Roblox does not call these endpoints. |
| parent workflow transitions/comments | OPT-OUT | Opiekun workflow is outside the game integration. |
| teacher panel/class results | OPT-OUT | Explicitly outside Phase 3. |
| Roblox account-link management | OPT-OUT | Existing panel capability; the game only consumes routing through ingest. |
| report transcript/JSON preview in Roblox | OPT-OUT | D-31 and D-41 restrict the game to final decision, help flag and delivery status. |
| offline upload queue | OPT-OUT | D-37 requires bounded retries followed by a visible final failure. |

## Deterministic edge-probe fallback

The probe returned all phase requirements as unclassified/unresolved. They remain flagged assumptions in the plans and are not reported as resolved:

| requirement | probe status | concrete behavior carried into plans |
|---|---|---|
| SCR-01 | UNRESOLVED / unclassified | Final refusal passes regardless of help/quiz; no numeric score; help is exported as 0/1. |
| SCR-02 | UNRESOLVED / unclassified | One session-scoped back Accessory, restored after respawn, one burst only. |
| SCR-03 | UNRESOLVED / unclassified | Every completed attempt exports automatically with atomic idempotency and safe exercise wording. |

## Multi-Source Coverage Audit

| SOURCE | ID | Feature/Requirement | Plan | Status | Notes |
|---|---|---|---|---|---|
| GOAL | — | Visual 3D reward plus safe caregiver-panel delivery | 03-01, 03-02, 03-03 | COVERED | Backend, reward/UI and live export slices. |
| REQ | SCR-01 | Qualitative outcome and help usage, no points | 03-02, 03-03 | COVERED | |
| REQ | SCR-02 | One cosmetic reward for exercise completion | 03-02 | COVERED | Reward follows final safe refusal, never report count. |
| REQ | SCR-03 | Automatic contract-compliant export | 03-01, 03-03 | COVERED | |
| RESEARCH | — | Research explicitly skipped by user | — | EXCLUDED | No RESEARCH.md source items to plan. |
| CONTEXT | D-30 | Final refusal passes; fictional password fails; no points | 03-02, 03-03 | COVERED | |
| CONTEXT | D-31 | Report decision plus help only | 03-01, 03-03 | COVERED | |
| CONTEXT | D-32 | Same back Accessory for all safe-refusal routes | 03-02 | COVERED | |
| CONTEXT | D-33 | Scamerino colors, gold rim, one burst | 03-02 | COVERED | |
| CONTEXT | D-34 | Session persistence, replay/respawn survival | 03-02 | COVERED | |
| CONTEXT | D-35 | Exact safe ingest fields and no real-leakage label | 03-01, 03-03 | COVERED | |
| CONTEXT | D-36 | Server M2M secret and Player identity | 03-01, 03-03 | COVERED | |
| CONTEXT | D-37 | Bounded retry, final failure, no queue | 03-03 | COVERED | |
| CONTEXT | D-38 | Small summary beside chat | 03-02 | COVERED | |
| CONTEXT | D-39 | Exact safe text and shield wording | 03-02 | COVERED | |
| CONTEXT | D-40 | Exact exercise text after error | 03-02 | COVERED | |
| CONTEXT | D-41 | Delivery status only | 03-02, 03-03 | COVERED | |
| CONTEXT | D-42 | Automatic report for every completed attempt | 03-03 | COVERED | |
| CONTEXT | D-43 | Linked recipient plus visible demo fallback | 03-01, 03-03 | COVERED | |
| CONTEXT | D-44 | Sending then API receipt/error, not read receipt | 03-03 | COVERED | |
| CONTEXT | D-45 | Replay during async and stale-ack guard | 03-03 | COVERED | |

## Descriptorless prohibition fallback

- **P-03-01 — flagged/unverified:** Help, quiz mistakes and earlier failed attempts must not reduce the reward for a final safe refusal.
- **P-03-02 — flagged/unverified:** A fictional password choice must not be presented as a real credential leak.
- **P-03-03 — flagged/unverified:** The Roblox UI must not expose report contents, transcript, JSON or a claim that the caregiver read the report.
