---
phase: 03-wynik-nagroda-i-przekazanie
plan: "03"
subsystem: roblox
tags: [roblox, m2m, https, report-export, caregiver-panel]
requires:
  - phase: 03-01
    provides: Authenticated ingest route POST /api/reports/ingest
  - phase: 03-02
    provides: RewardManager and ResultSummaryFrame
provides:
  - Roblox M2M report export to caregiver inbox
  - ServerStorage fail-closed HTTPS configuration
  - Client delivery status indicator on result card
affects: [roblox-client, roblox-server]
tech-stack:
  added: []
  patterns: [server-only configuration, bounded retry, stale-response-safe callback]
key-files:
  created:
    - roblox/src/server/ReportExportConfig.luau
    - roblox/src/server/ReportExportService.luau
    - .planning/workstreams/roblox/phases/03-wynik-nagroda-i-przekazanie/03-PLAYTEST.md
  modified:
    - roblox/src/shared/MissionContent.luau
    - roblox/src/server/MissionService.server.luau
    - roblox/src/client/MissionController.client.luau
    - roblox/README.md
    - projects/web-app/README.md
key-decisions:
  - Fail-closed HTTPS validation: only https:// endpoints are accepted; localhost and non-HTTPS are blocked without leaking credentials.
  - Snapshot delivery fields: deliveryStatus, deliveryRecipientName, deliveryRecipientIsDemo guarded by attempt_id and revision to prevent stale callbacks from overwriting a new replay attempt.
  - Zero numeric scoring: only qualitative outcomes (safe_refusal / compromised_password) with exact hints_used (0 or 1).
requirements-completed: [SCR-01, SCR-03]
duration: 12min
completed: 2026-10-04
status: complete
---

# Phase 3 Plan 3: Roblox Caregiver Panel Report Export Summary

**Automatic, authenticated, server-to-server (M2M) export of mission results from Roblox to the caregiver inbox with live delivery status on the summary card.**

## Accomplishments

1. **Fail-Closed Configuration (`ReportExportConfig.luau`)**:
   - Reads `BackendBaseUrl` and `IngestSecret` from `ServerStorage.ReportExportSettings`.
   - Strictly enforces `https://` prefix and non-empty secret; fails closed otherwise.
   - Prevents replication of credentials to the client.

2. **M2M HTTPS Export Service (`ReportExportService.luau`)**:
   - Builds canonical `ReportExportPayload` with UUID `attempt_id`, player name/id, `attack_type = "data_request"`, `source = "game"`, and `hints_used` (0 or 1).
   - Sends HTTPS `POST /api/reports/ingest` with `x-ingest-secret`.
   - Bounded retries (0s, 1s, 3s) for transport or 5xx HTTP responses.

3. **Mission Server Integration (`MissionService.server.luau`)**:
   - Dispatches report export asynchronously upon reaching `ending_good` or `ending_bad`.
   - Guards callbacks with `current(player, state, capturedRevision)` and `state.deliveryAttemptId == attemptId` so replay attempts are never polluted by stale responses.

4. **Client UI Delivery Indicator (`MissionController.client.luau`)**:
   - `ResultSummaryFrame` shows real-time progress:
     - Sending: `"Wysyłanie zgłoszenia do panelu opiekuna..."`
     - Received: `"Odebrano w panelu opiekuna: Mama Oli (demo)"` (in green)
     - Failure: `"Nie udało się przekazać zgłoszenia do panelu."`

5. **Live Verification & Studio Playtest**:
   - Completed live desktop Playtest in Roblox Studio against production Heroku backend (`https://bezpieczna-aura.pl/api/reports/ingest`).
   - Observed report ingestion (HTTP 201 Created) and verified that the green confirmation badge appeared on the player's screen.
