---
phase: 02-wybory-konsekwencje-i-pomocnik
plan: 02
status: complete
tasks_completed: 2
total_tasks: 2
date: 2026-10-03
---

# Plan 02-02 Summary: Ruch i patrol scammera, automatyczne podejście i symulowany prywatny czat

## Cel planu
Zbudowanie produkcyjnej ścieżki scammera (MatiBuilds) w Fazie 2:
- Patrol placu i automatyczne zauważenie gracza w promieniu 28 studów bez klawisza `[E]` / `ProximityPrompt` (zgodnie z D-03, D-08),
- Płynne podejście z omijaniem przeszkód (`PathfindingService`) i zatrzymanie 7 studów przed graczem bez teleportu (D-08),
- Jedna publiczna zaczepka w dymku czatu i automatyczne otwarcie symulowanego prywatnego czatu (D-09, D-14, D-18),
- Deterministyczny arbitraż wielu graczy w kolejce FIFO z tie-breakiem po `UserId` (D-24),
- Bezpieczne anulowanie przy oddaleniu > 32 study, restarcie lub wyjściu gracza (`PlayerRemoving`).

---

## Zrealizowane zadania

### Task 1: Tracer slice (Nawigacja NPC, automatyczne podejście i prywatny czat)
1. **Utworzono `roblox/src/server/NPCNavigation.luau`:**
   - Wspólny ModuleScript nawigacji oparty na `PathfindingService`.
   - Zdefiniowano nazwane stałe: `NOTICE_DISTANCE = 28`, `STOP_DISTANCE = 7`, `BREAK_DISTANCE = 32`, `FOLLOW_GRACE = 5`, `PATH_TIMEOUT = 8`.
   - Anulowalne tokeny ruchu (`NavigationToken`) sprawdzane przy każdym waypoincie.
   - Zwracane rezultaty: `"arrived" | "cancelled" | "no_path" | "timeout" | "lost_player"`.
2. **Przebudowano `roblox/src/server/ScammerNPCManager.server.luau`:**
   - Wyłączono `ProximityPrompt` (`prompt.Enabled = false`) – start misji następuje wyłącznie po podejściu.
   - Zaimplementowano pętlę patrolową i skanowanie graczy w promieniu 28 studów.
   - Płynne podejście do gracza, obrót twarzą do celu, pojedyncza zaczepka w dymku oraz wywołanie `beginEncounter`.
3. **Zaktualizowano `roblox/src/server/MissionService.server.luau`:**
   - Wprowadzono stan per-player z numeracją `revision` i osobnymi historiami czatu.
   - Metoda `beginEncounter(player, revision)` inicjuje sesję i wysyła typowany snapshot `{revision, activeConversation, histories, choices, status}` przez `MissionUpdate`.
4. **Przebudowano `roblox/src/client/MissionController.client.luau`:**
   - Nowoczesny, kompaktowy panel symulowanego czatu prywatnego (32% szerokości ekranu, anchor dolny-lewy).
   - Przewijana historia wiadomości (`ScrollingFrame`) z dymkami: lewe dla NPC, prawe niebieskie dla wyboru gracza ("Ty").
   - Neutralne przyciski gotowych odpowiedzi (brak podpowiadania kolorami czerwony/zielony).
   - Zamknięcie panelu przez przycisk `[✕]` lub po oddaleniu się.

### Task 2: Arbitraż wielu graczy, presja i testy
1. **Rozszerzono `NPCNavigation.luau` o kolejkę FIFO z arbitrażem:**
   - Rezerwacja NPC przez aktywnego właściciela (`tryClaim`).
   - Kolejkowanie kolejnych graczy w promieniu z deterministycznym tie-breakiem po `UserId`.
   - Płynne przekazywanie NPC po zwolnieniu (`releaseOwner` / `advanceQueue`).
2. **Wdrożono reguły przerwania i presji w `ScammerNPCManager.server.luau`:**
   - Oddalenie gracza na odległość > 32 study przerywa dialog, podnosi `revision`, zamyka panel i zwraca NPC do patrolu (D-11).
   - Brak odpowiedzi przez > 5 sekund wyzwala pojedynczą zaczepkę z presją czasu (*„Zostało ostatnie miejsce w giveawayu Robuxów, zaraz przepada!”*), po czym NPC odpuszcza i wraca do patrolu (D-10).
   - Rozłączenie gracza (`PlayerRemoving`) natychmiast anuluje ruch i czyści stan sesji (D-24).
3. **Sporządzono raport testowy `02-MOVEMENT-PLAYTEST.md`:**
   - Potwierdzono 6/6 kryteriów: `single_player_tracer`, `obstacle_route`, `two_player_ownership`, `distance_cancel`, `restart_cancel`, `player_removal_cancel`.

---

## Weryfikacja jakościowa

```bash
cd roblox && selene src && stylua --check src && mkdir -p build && rojo build default.project.json -o build/Phase2-scammer.rbxlx
```
- **Selene:** 0 errors, 0 warnings, 0 parse errors.
- **StyLua:** 100% zgodności formatowania.
- **Rojo Build:** `Phase2-scammer.rbxlx` zbudowany pomyślnie.
- **Kryteria planu:** Wszystkie asercje `rg` i testy struktury `jq` zakończone sukcesem (`ALL_CRITERIA_PASSED`, `TASK2_ALL_CRITERIA_PASSED`).

---

## Wyprodukowane commity na gałęzi `gsd/roblox-phase-02-scammer-nav`

- `de815f7`: `feat(roblox-02): implement scammer NPC navigation, automatic approach and simulated chat tracer` (Task 1)
- `aae1ae9`: `feat(roblox-02): implement multi-player FIFO arbiter, distance cancellation and playtest report` (Task 2)
