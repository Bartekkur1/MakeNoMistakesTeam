---
id: 261003-oy2
slug: popraw-po-o-enie-okna-czatu-aby-nie-zas-
description: Poprawienie położenia okna dialogowego/czatu (lower-third) oraz wytyczne UX/UI dla Roblox
created: 2026-10-03
status: complete
completed_at: 2026-10-03T18:03:00Z
---

# Quick Task Summary: Poprawa położenia okna czatu i wytyczne Roblox UX/UI

## Zrealizowane działania
1. **Analiza i opracowanie wytycznych Roblox UX/UI**:
   - Wdrożenie zasady **Lower-Third Dialogue Bar** (dolna 1/3 ekranu).
   - Zachowanie >70% wolnego obszaru ekranu w pionie dla postaci gracza, NPC, animacji i otoczenia 3D.
   - Kotwiczenie: `AnchorPoint = Vector2.new(0.5, 1)`, `Position = UDim2.new(0.5, 0, 1, -20)`.
   - Wprowadzenie `UISizeConstraint` zapobiegającego rozciąganiu na monitorach ultrawide (`MaxSize = Vector2.new(820-840, 220-240)`).
   - Minimalne cele dotykowe (Touch Targets) min 44px wysokości zgodnie z Apple HIG / Roblox Mobile Guidelines.
2. **Refaktoryzacja `roblox/src/client/MissionController.client.luau`**:
   - Zmniejszono wysokość ramki z 45% do 28% ekranu (`UDim2.fromScale(0.92, 0.28)` z ograniczeniem max 220px).
   - Zakotwiczono przy dolnej krawędzi z 20px marginesem bezpieczeństwa od wskaźnika systemowego urządzeń mobilnych.
   - Dostosowano portret Scamerino, nagłówek i przyciski wyboru do kompaktowego paska.
3. **Refaktoryzacja `ScamerinoDialogueController`**:
   - Utworzono plik źródłowy `roblox/src/client/ScamerinoDialogueController.client.luau`.
   - Zastąpiono wielkie centralne okno 680x440px eleganckim dolnym paskiem (`UDim2.fromScale(0.92, 0.30)`, `UISizeConstraint(840, 240)`).
   - Animacja wysuwania od dołu ekranu (`Position` tween z `UDim2.fromScale(0.5, 1.4)` do `UDim2.new(0.5, 0, 1, -20)`).
4. **Wstrzyknięcie i weryfikacja na żywo w Roblox Studio**:
   - Zaktualizowano `PlayerGui.MissionGui` oraz `PlayerGui.ScamerinoDialogueGui` w aktywnym trybie Play.
   - Zaktualizowano `StarterGui.ScamerinoDialogueGui` na serwerze.
   - Pomiary geometrii widoku:
     - Okno Scamerino zajmuje tylko 33.0% dolnej części ekranu (287px od góry wolne dla postaci).
     - Okno misji zajmuje tylko 29.4% dolnej części ekranu (307px od góry wolne dla postaci).
5. **Weryfikacja kodu**:
   - `selene src`: 0 błędów, 0 ostrzeżeń.
   - `stylua roblox/src`: sformatowane.
   - `rojo build default.project.json -o build/Phase1.rbxlx`: pomyślna kompilacja.
