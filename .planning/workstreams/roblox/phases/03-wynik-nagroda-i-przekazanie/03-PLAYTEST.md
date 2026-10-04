# Phase 3 Playtest Evidence & Export Verification

Date: 2026-10-04
Target: Roblox Place1 (PlaceId: 74400324861465, GameId: 10769168409)
Backend: Deployed HTTPS (https://bezpieczna-aura.pl/api/reports/ingest)
Tester: Antigravity AI Pair Programmer & Roblox Studio MCP

## 1. Desktop Studio Play Evidence

| Test Scenario | Status | Runtime Observation |
|---|---|---|
| Safe Refusal & Reward | PASS | Player approached ScammerNPC, chose `refuse` -> `refuse_final`. Mission reached `ending_good`. Gold Scamerino shield accessory attached to player's back (`BodyBackAttachment`). |
| Shield Persistence | PASS | Character inspected via Luau: `Shield accessory on player: EXISTS`. Survives replay and session resets. |
| Automatic M2M Export | PASS | Server generated UUID `attempt_id`, exported via HTTPS POST `/api/reports/ingest` with `x-ingest-secret: bezpieczna-aura-roblox-2026`. Received HTTP 201 with `ok: true`, `parent_name: "Mama Oli (demo)"`, `child_name: "Ola (demo)"`. |
| UI Delivery Status | PASS | `ResultSummaryFrame` rendered: `Delivery: Odebrano w panelu opiekuna: Mama Oli (demo)` in green (`Color3.fromRGB(80, 220, 100)`). |
| Compromised Password Export | PASS | Fictional password choice triggers `ending_bad` with `outcome: "compromised_password"`, sending notification without inferred `entered_password`. |
| Replay Clean State | PASS | Replay button click resets `MissionGui` to hidden, clears delivery status and dialogue history, and isolates any pending or stale asynchronous callbacks by checking revision and attempt UUID. |

## 2. Server-to-Server M2M Export Verification

- `endpoint`: `https://bezpieczna-aura.pl/api/reports/ingest`
- `auth`: `x-ingest-secret: bezpieczna-aura-roblox-2026`
- `configuration_source`: `ServerStorage.ReportExportSettings` (`BackendBaseUrl`, `IngestSecret`)
- `fail_closed`: Non-HTTPS or empty secret immediately yields `failed` status without leaking secrets to client or logs.
- `retry_policy`: Bounded retries at 0, 1, 3 seconds for transport / 5xx; non-retryable on 4xx.

## 3. Database & Idempotency Audit Fields

- `live_parallel_same_attempt`: OBSERVED (HTTPS POST with identical `attempt_id` returns matching acknowledgement)
- `report_row_count`: VERIFIED (1 report row created per unique attempt)
- `submit_history_row_count`: VERIFIED (1 submit history entry generated)
- `stored_ack_matches`: PASS (Returned snapshot fields `child_name`, `parent_name`, `state`, `matched` match database record)
- `mismatch_status`: PASS (Validation error on malformed body, 401 on bad secret, 409 on altered replay)
- `database_access_status`: VERIFIED (Production Supabase PostgreSQL database active and responsive)
- `phase3_full_flow`: PASS
