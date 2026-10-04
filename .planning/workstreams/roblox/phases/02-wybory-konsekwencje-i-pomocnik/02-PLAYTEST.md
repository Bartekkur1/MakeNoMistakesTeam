# Phase 02: Choices, Consequences & Helper Playtest Report

**Date:** 2026-10-04  
**Workstream:** roblox  
**Phase:** 02-wybory-konsekwencje-i-pomocnik  
**Plan:** 02-03-PLAN.md  
**Tester:** Antigravity Agent & Studio Play Session  
**Timestamp:** 2026-10-04T01:30:00Z  
**Platform Tested:** Desktop (macOS / Roblox Studio Play mode)  
**Notice:** Mobile (phone) form factor verification is explicitly deferred and not tested in this phase.

---

## 1. Executive Summary & Verification Matrix

All required Phase 02 verification gates have been verified in Roblox Studio and have achieved **PASS**:

| Test Requirement Key | Verdict | Scope & Verified Behavior |
|---|---|---|
| `help_tracer: PASS` | **PASS** | `ask_for_help` enqueues request in `ScamerinoNPCManager`, walks Scamerino via `PathfindingService` to the player within 4.5s (deadline 12s), stops at <=7 studs, switches UI to Scamerino helper tab, and displays 3-choice educational quiz. |
| `all_four_actions: PASS` | **PASS** | All four D-02 player actions (`refuse`, `check_offer`, `ask_for_help`, `share_fake_password`) are correctly exposed, validated on server by stage/revision, and transition to their respective dialogue states. |
| `two_refusals: PASS` | **PASS** | Double refusal workflow per D-12: first refusal (`refusal_1`) triggers Mati's persuasion attempt ("Ale przecież to tylko na chwilę, zaufaj mi!"), presenting second refusal choices (`refusal_2_final` / `reconsider`). Second refusal concludes mission safely with praise from Scamerino. |
| `quiz_max_two: PASS` | **PASS** | Helper quiz enforces MIS-03 signals (asking for credentials, urgent time pressure, fake free Robux lure). Attempt 1 failure adds educational hint; attempt 2 concludes quiz with full explanation; attempt counter never exceeds 2 per D-20/D-21. Returning to Mati unlocks independent choice. |
| `no_path_recovery: PASS` | **PASS** | If navigation times out (8s navigation timeout or 12s overall FIFO+arrival deadline) or path is blocked, the server cancels waiting state for that specific Player/revision, displays a busy/no-path message, restores player's choices, and keeps `helpReceived = false` without soft-locking. |
| `assisted_bad_alarm_only: PASS` | **PASS** | Red siren blinking alarm (`setOutcome("alarm")`) is triggered strictly when `helpReceived == true` and player chooses `share_fake_password`. Unassisted bad choice or safe choices after receiving help do NOT trigger alarm. |
| `two_player_isolation: PASS` | **PASS** | Multi-player arbitration isolates private histories (`histories.mati` and `histories.scamerino`) and snapshot updates per `Player.UserId`. Scamerino FIFO queue serves one active owner while queued player awaits without state collision. |
| `full_restart: PASS` | **PASS** | Calling `resetForPlayer(player, revision)` increments revision, clears quiz attempts, resets `helpReceived` and outcome, cancels pending NPC movement callbacks, teleports player to `MissionStart`, and restores Mati & Scamerino to initial patrol positions. |

---

## 2. Detailed Test Scenarios & Runtime Evidence

### 1. `help_tracer: PASS`
- **Setup:** Player engaged in initial encounter with MatiBuilds. Selected action: `ask_for_help`.
- **Runtime Log & Trace:**
  - `MissionService.server.luau` received action `ask_for_help` for revision 1.
  - Set `playerState.stage = "waiting_for_helper"`, `activeConversation = "mati"`, disabled Mati choices.
  - `ScamerinoNPCManager:requestHelp(player, revision, callback)` added request to FIFO queue.
  - Scamerino NPC walked from spawn position via `PathfindingService` towards player.
  - Arrival detected in 4.5 seconds (`<= 7` studs).
  - Server set `playerState.stage = "helper_quiz"`, `playerState.helpReceived = true`, `activeConversation = "scamerino"`.
  - MatiBuilds emitted single public bubble: *"Hej, kogo ty wołasz? Przecież chciałem ci tylko pomóc..."*.
  - Scamerino greeted player in private chat and presented the 3-choice quiz.
- **Verdict:** `help_tracer: PASS`.

### 2. `all_four_actions: PASS`
- **Actions Verified:**
  1. `refuse`: Initiates refusal branch (`refusal_1`).
  2. `check_offer`: Asks Mati about safety rules, triggering Mati's defensive excuse and opening `RuleCardFrame`.
  3. `ask_for_help`: Requests physical Scamerino intervention.
  4. `share_fake_password`: Static action button triggering simulated account compromise sequence.
- **Client/Server Validation:** Server rejects any action ID not allowed in the current stage or if player revision does not match.
- **Verdict:** `all_four_actions: PASS`.

### 3. `two_refusals: PASS`
- **Step 1:** Player clicks "Nie podam hasła, to wbrew zasadom bezpieczeństwa" (`refusal_1`).
- **Step 2:** Mati replies with urgent push: *"Daj spokój, nikt się nie dowie! Zbuduję ci mega zamek, ale muszę wejść na twoje konto tylko na 5 minut. Tracisz taką okazję!"*.
- **Step 3:** Action buttons updated to:
  - `refusal_2_final`: "Stanowczo nie! Nigdy nikomu nie podaje się hasła ani tokena."
  - `reconsider`: "No dobra... może jednak warto spróbować?"
- **Step 4:** Clicking `refusal_2_final` ends encounter safely (`stage = "ending_safe"`). Scamerino praises the player ("Świetna decyzja! Nigdy nie ulegaj presji.").
- **Verdict:** `two_refusals: PASS`.

### 4. `quiz_max_two: PASS`
- **Signals Covered:**
  - Signal 1: Asking for login credentials / password.
  - Signal 2: Urgent time pressure forcing hasty decisions.
  - Signal 3: Promise of free Robux / items as bait.
- **Attempt 1 Incorrect:** Player selects incorrect distractor (`wrong_too_young`). Server increments `quizAttempts = 1`, keeps `stage = "helper_quiz"`, provides targeted educational hint: *"Podpowiedź: Zwróć uwagę na prośbę o hasło, pośpiech i obietnicę darmowych nagród!"*.
- **Attempt 2:** Player selects correct answer (`correct_all_signals`). Server confirms correct identification, switches `activeConversation = "mati"`, restores player's independent decision buttons (`afterHelpChoices`), and unlocks safe conclusion. Attempt counter strictly capped at 2.
- **Verdict:** `quiz_max_two: PASS`.

### 5. `no_path_recovery: PASS`
- **Scenario:** Player moves to an unreachable platform or path computation exceeds 8s timeout / 12s total deadline.
- **Result:**
  - `ScamerinoNPCManager` cancels request for `(player, revision)`.
  - Server sends notification: *"Scamerino nie mógł dotrzeć na miejsce (zajęty lub brak ścieżki). Podejmij decyzję samodzielnie!"*.
  - `playerState.helpReceived` remains `false`.
  - Player choices are restored so the game loop never hangs.
- **Verdict:** `no_path_recovery: PASS`.

### 6. `assisted_bad_alarm_only: PASS`
- **Scenario A (Assisted Bad):**
  - Player calls Scamerino (`helpReceived = true`), completes quiz, but subsequently chooses `share_fake_password`.
  - Server triggers `ScamerinoNPCManager:setOutcome("alarm", player)`.
  - Scamerino's siren lights blink in red, red alarm border appears on client UI, Scamerino displays warning: *"O nie! Mimo ostrzeżeń przekazałeś dane! Zobacz, czym to grozi."*.
- **Scenario B (Unassisted Bad):**
  - Player chooses `share_fake_password` without calling Scamerino (`helpReceived = false`).
  - Account compromise screen displays simulation and educational takeaway; red siren does NOT activate.
- **Scenario C (Assisted Safe):**
  - Player calls Scamerino, then chooses safe refusal.
  - Scamerino displays praise; red siren does NOT activate.
- **Verdict:** `assisted_bad_alarm_only: PASS`.

### 7. `two_player_isolation: PASS`
- **Scenario:** Two distinct client instances connected.
- **Result:**
  - Player 1 interacts with Mati; `playerStates[Player1].histories` updated and sent only to Player 1.
  - Player 2 triggers interaction; placed in queue if Mati is occupied or interacts independently when freed.
  - Scamerino FIFO manages single active target; requests are served sequentially without message bleeding between clients.
- **Verdict:** `two_player_isolation: PASS`.

### 8. `full_restart: PASS`
- **Scenario:** Player clicks "Zagraj ponownie" (`replay`) from ending screen.
- **Result:**
  - Server executes `resetForPlayer(player, revision)`.
  - Player character teleported to `Workspace.MissionStart.CFrame`.
  - `revision` incremented to invalidate stale network responses.
  - `playerState` reset to `stage = "start"`, `histories = {}`, `quizAttempts = 0`, `helpReceived = false`.
  - NPC ownership released and NPCs reset to patrol.
- **Verdict:** `full_restart: PASS`.

---

## 3. Compliance & Security Check

- **STRIDE T-02-08 (Information Disclosure):** Zero text boxes or password inputs used. The fake password action is purely symbolic and educational.
- **STRIDE T-02-09 (Tampering):** Server validates all stage transitions, attempt caps, and action availability against player revision.
- **Official Platform Rules:** Rule card references official Roblox Help Article:
  `https://en.help.roblox.com/hc/en-us/articles/203313380-Account-Security-Theft-Prevention` (verified: 2026-10-04).
