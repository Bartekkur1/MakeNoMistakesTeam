---
id: 261003-pc5
slug: okno-dialogowe-scamerino-na-srodku-trwal
description: Trwałe wdrożenie okna dialogowego Scamerino w trybie Edit Roblox Studio
created: 2026-10-03
status: complete
completed_at: 2026-10-03T18:18:20Z
---

# Quick Task Summary: Trwałe wdrożenie dolnego okna dialogowego w trybie Edit

## Przyczyna problemu
Zmiany wstrzyknięte podczas wcześniejszego testu były wprowadzone tylko w trybie `Play` (pamięć tymczasowa). W architekturze Roblox Studio, po wciśnięciu `Stop` DataModel gry jest niszczony i przywracany ze stanu `Edit`. W stanie `Edit` skrypty `StarterGui.ScamerinoDialogueGui.DialogueController` oraz `StarterPlayer.StarterPlayerScripts.MissionController` wciąż zawierały stare, wycentrowane pozycje (680x440px).

## Rozwiązanie
1. **Przejście do trybu Edit**: Zatrzymano działający Playtest (`start_stop_play(is_start=false)`).
2. **Aktualizacja DataModelu Edit**:
   - Zaktualizowano `StarterPlayer.StarterPlayerScripts.MissionController` do wersji responsywnej lower-third (`UDim2.fromScale(0.92, 0.28)`, `UISizeConstraint(820, 220)`).
   - Zaktualizowano `StarterGui.ScamerinoDialogueGui.DialogueController` do wersji lower-third (`UDim2.fromScale(0.92, 0.30)`, `UISizeConstraint(840, 240)`, animacja Tween od dołu do `UDim2.new(0.5, 0, 1, -20)`).
3. **Ponowne uruchomienie Playtestu**: Uruchomiono tryb Play (`start_stop_play(is_start=true)`).
4. **Weryfikacja**:
   - `ScamerinoDialogueGui.MainFrame` startuje ukryte na pozycji `{0.5, 0}, {1.4, 0}` z `AnchorPoint = (0.5, 1)`.
   - Po wywołaniu interakcji wysuwa się do `{0.5, 0}, {1, -20}`.
   - Geometria: pozycja absolutna `(157, 287)`, wysokość 180px, zajmuje tylko 33% dolnej części ekranu, pozostawiając górne 67% widoku kamery w pełni wolne dla postaci gracza i NPC.
   - Zmiana jest trwała w pliku sesji i nie znika po restartach Playtestu.
