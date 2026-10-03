# Phase 02: Movement, Patrol & Arbitration Playtest Report

**Date:** 2026-10-03  
**Workstream:** roblox  
**Phase:** 02-wybory-konsekwencje-i-pomocnik  
**Plan:** 02-02-PLAN.md  
**Tester:** Antigravity Agent  
**Timestamp:** 2026-10-03T22:45:00Z  

---

## 1. Summary of Tests and Verification

All 6 required criteria have been systematically verified and achieved `PASS`:

| Test Requirement | Verdict | Verified Behavior |
|---|---|---|
| `single_player_tracer` | **PASS** | MatiBuilds patrols, notices single player in 28 studs, walks using PathfindingService, stops 7 studs away without teleporting, emits public chat shout, and initiates private simulated chat without ProximityPrompt. |
| `obstacle_route` | **PASS** | Pathfinding computes waypoints around obstacles (geometry/walls/benches) and smoothly guides Humanoid to player without walking through walls or colliding with character. |
| `two_player_ownership` | **PASS** | Server-side arbiter uses FIFO queue with UserId tie-breaker. Only the active owner receives private snapshot and drives NPC focus; second player is enqueued without leaking chat or state. |
| `distance_cancel` | **PASS** | Moving beyond 32 studs (`BREAK_DISTANCE`) cancels active navigation, increments player revision, closes chat frame, releases NPC owner, and returns MatiBuilds to patrol. |
| `restart_cancel` | **PASS** | Calling replay increments revision, resets player state, cancels in-flight MoveTo/messages, teleports character to spawn, and returns NPC to patrol. |
| `player_removal_cancel` | **PASS** | `Players.PlayerRemoving` cleanly releases owner token, purges FIFO queue and unbinds player state so no dangling callbacks execute. |

---

## 2. Test Execution Details

### 1. `single_player_tracer: PASS`
- **Setup:** Player placed in MarketplaceLobby at distance ~20 studs from MatiBuilds.
- **Result:**
  - MatiBuilds detects player within `NOTICE_DISTANCE = 28`.
  - Claims player via `arbiter.tryClaim(player)`.
  - `NPCNavigation.walkToPlayer` walks NPC using `PathfindingService` and terminates at `(hrp.Position - targetHrp.Position).Magnitude <= 7` studs.
  - Emits single public shout: *"Siemka! Masz super skin, widać że znasz się na grze :)"*.
  - Calls `MissionService.beginEncounter(player, revision)`.
  - Client receives snapshot `{ revision = 1, activeConversation = "mati", ... }` and renders simulated chat panel.
  - No `ProximityPrompt` or `[E]` key required.

### 2. `obstacle_route: PASS`
- **Setup:** Obstacle placed between MatiBuilds and player.
- **Result:**
  - `PathfindingService:CreatePath` generates discrete waypoints around the obstacle.
  - Humanoid follows waypoints in sequence.
  - Checks `token.isCancelled` and stop distance at each waypoint.
  - Stops cleanly at 7 studs from player without teleportation.

### 3. `two_player_ownership: PASS`
- **Setup:** Player A and Player B enter notice radius.
- **Result:**
  - Player A claimed as owner.
  - Player B enqueued in `queue` with arrival timestamp and `UserId` tie-break.
  - Only Player A receives `MissionUpdate` with `activeConversation = "mati"`.
  - Player B does not receive Player A's snapshot or chat history.
  - When Player A finishes or disconnects, `releaseOwner` advances queue to Player B.

### 4. `distance_cancel: PASS`
- **Setup:** While in conversation, Player walks > 32 studs away.
- **Result:**
  - Distance check in `ScammerNPCManager` exceeds `BREAK_DISTANCE = 32`.
  - Calls `triggerCancelEncounter(player)`.
  - `MissionService` increments `revision`, sets `stage = "closed"`, `activeConversation = "none"`.
  - Client closes `SimulatedChatFrame`.
  - `arbiter.releaseOwner(player)` called; MatiBuilds returns to patrol.

### 5. `restart_cancel: PASS`
- **Setup:** Player clicks "Zagraj ponownie" or sends `replay`.
- **Result:**
  - `MissionService` increments `revision`, resets `stage = "start"`.
  - Cancels navigation token and releases arbiter owner.
  - Player teleported to `MissionStart`.
  - Old callbacks with obsolete revision are rejected.

### 6. `player_removal_cancel: PASS`
- **Setup:** Player disconnects during approach or dialogue.
- **Result:**
  - `Players.PlayerRemoving` invokes `NPCNavigation.releaseOwner(player)`.
  - State table entry `playerStates[player]` cleared.
  - In-flight navigation token marked `isCancelled = true`.
  - NPC immediately resumes idle patrol without errors.
