---
phase: 02-wybory-konsekwencje-i-pomocnik
plan: 03
status: complete
tasks_completed: 2
total_tasks: 2
date: 2026-10-04
---

# Plan 02-03 Summary: Cztery ścieżki decyzyjne, pomocnik z quizem, selektywny alarm i pełny restart

## Cel planu
Dokończenie pełnej logiki wyborów i konsekwencji w Fazie 2 misji na Robloxie:
- Implementacja 4 ścieżek gracza w czacie z MatiBuilds (`refuse`, `check_offer`, `ask_for_help`, `share_fake_password`) per D-02,
- Podwójna odmowa (`refusal_1` → perswazja Mati → `refusal_2_final` / `reconsider`) kończąca się bezpiecznym wynikiem bez alarmu per D-12,
- Karta zasad Roblox (`check_offer`) z oficjalnym linkiem do pomocy i datą weryfikacji per D-25–D-27,
- Wezwanie pomocnika Scamerino (`ask_for_help`): fizyczne podejście z omijaniem przeszkód, limit 12s FIFO/deadline, edukacyjny quiz 3 sygnałów (hasło, presja czasu, darmowe Robuxy jako przynęta) z limitem 2 prób i podpowiedzią po błędzie per D-19–D-21,
- Selektywny czerwony alarm syreny: uruchamiany wyłącznie przy `helpReceived == true` i wyborze `share_fake_password` (assisted bad), a przy odmowie pochwała Scamerino bez alarmu per D-07, D-22, D-23,
- Symulacja utraty fikcyjnego konta (`share_fake_password`): wyłącznie bezpieczny przycisk bez zbierania prawdziwych danych (STRIDE T-02-08),
- Atomowy restart `resetForPlayer(player, revision)` per D-29: teleport do `MissionStart`, podbicie `revision`, reset stanu i NPC,
- Usunięcie starego kontrolera `ScamerinoDialogueController.client.luau` na rzecz zunifikowanego `MissionController.client.luau`.

---

## Zrealizowane zadania

### Task 1: Scamerino NPC Manager, fizyczne podejście i tracer pomocy z quizem
1. **Utworzono `roblox/src/server/ScamerinoNPCManager.luau`:**
   - Dedykowany manager pomocnika ScamerinoAlertinio z kolejkowaniem FIFO żądań pomocy.
   - Limit czasu: 12-sekundowy deadline całkowity (kolejka + nawigacja) oraz 8-sekundowy timeout nawigacji `NPCNavigation`.
   - Zdarzenia przybycia (`arrived`), braku ścieżki (`no_path`), timeoutu oraz anulowania (`cancel`).
   - Kontrola syreny: efekt migającego czerwonego alarmu dla assisted bad (`setOutcome("alarm", player)`).
2. **Rozszerzono `roblox/src/shared/MissionContent.luau`:**
   - Wprowadzono definicje 3 sygnałów MIS-03: prośba o hasło/dane logowania, presja czasu, darmowe Robuxy jako przynęta.
   - Dodano pytania quizu pomocnika (`quizChoices`) z dystraktorami i podpowiedziami edukacyjnymi.
3. **Zintegrowano `roblox/src/server/MissionService.server.luau`:**
   - Obsługa stanu `waiting_for_helper` z blokadą wyborów wobec scammera na czas podejścia.
   - Jednorazowy publiczny dymek MatiBuilds przy wezwaniu pomocy (*"Hej, kogo ty wołasz?..."*).
   - Przejście do `helper_quiz` po przybyciu Scamerino i ustawienie `helpReceived = true`.
   - Wymuszenie limitu maksymalnie 2 prób w quizie per D-20/D-21.

### Task 2: Cztery ścieżki decyzyjne, karta zasad, alarm i atomowy restart
1. **Pełna implementacja 4 ścieżek decyzyjnych w `MissionService.server.luau`:**
   - `refuse`: ścieżka podwójnej odmowy z drugą szansą i perswazją scammera.
   - `check_offer`: pytanie o oficjalne reguły, wymówka scammera i otwarcie karty zasad.
   - `ask_for_help`: wezwanie fizycznego Scamerino z quizem.
   - `share_fake_password`: symulowana utrata konta (brak inputu na hasło).
2. **Karta zasad bezpieczeństwa Roblox:**
   - Zintegrowano zweryfikowany link: `https://en.help.roblox.com/hc/en-us/articles/203313380-Account-Security-Theft-Prevention` (zweryfikowano 2026-10-04).
   - Dodano ramkę `RuleCardFrame` w `MissionController.client.luau` z możliwością zamknięcia i powrotu do wyboru bez wymuszonego zakończenia.
3. **Selektywne wyzwalanie alarmu syreny:**
   - Serwer sprawdza `playerState.helpReceived`. Jeśli gracz mimo pomocy Scamerino podał fikcyjne hasło (`share_fake_password`), włączany jest czerwony alarm i Scamerino wyświetla ostrzeżenie.
   - Bez pomocy (`helpReceived == false`) lub przy bezpiecznej odmowie (`ending_safe`) alarm pozostaje wyłączony.
4. **Atomowy restart `resetForPlayer(player, revision)`:**
   - Podbicie numeru `revision` (unieważnienie starych callbacków sieciowych).
   - Teleport gracza na `Workspace.MissionStart`.
   - Zwolnienie ownershipu NPC i powrót modeli na pozycje patrolowe.
   - Wyczyszczenie historii czatów, flagi `helpReceived` i licznika prób quizu.
5. **Czyszczenie architektury:**
   - Usunięto przestarzały `roblox/src/client/ScamerinoDialogueController.client.luau`. Całość obsługi obu postaci i zakładek realizuje `MissionController.client.luau`.
6. **Raport testowy `02-PLAYTEST.md`:**
   - Potwierdzono 8/8 kryteriów weryfikacji planu:
     `help_tracer: PASS`, `all_four_actions: PASS`, `two_refusals: PASS`, `quiz_max_two: PASS`, `no_path_recovery: PASS`, `assisted_bad_alarm_only: PASS`, `two_player_isolation: PASS`, `full_restart: PASS`.

---

## Weryfikacja jakościowa

```bash
cd roblox && selene src && stylua --check src && mkdir -p build && rojo build default.project.json -o build/Phase2-complete.rbxlx
```
- **Selene:** 0 błędów, 0 ostrzeżeń.
- **StyLua:** 100% plików sformatowanych zgodnie ze standardem.
- **Rojo Build:** `Phase2-complete.rbxlx` wygenerowany pomyślnie.
- **Asercje logiczne i Playtest:** Wszystkie testy `rg` i asercje z planu zakończone sukcesem (`ALL VERIFICATION CHECKS PASSED`).
