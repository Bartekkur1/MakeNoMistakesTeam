---
id: 261003-scam-dialogue-research
slug: scam-dialogue-research
description: Realistyczny dialog ze scammerem na bazie research.md bez sugerowania rozwiazania
created: 2026-10-03
status: complete
---

# Quick Task Summary: Realistyczny dialog ze scammerem oparty na research.md

## Co zrobiono

### 1. Przegląd `ideas/defence/research.md` (sekcje A3, B13)
W oparciu o zebrane dane dotyczące profilu graczy w wieku 9–13 lat oraz metod działania oszustów na Robloxie (raporty CERT Orange Polska i NASK „Nastolatki” 2024/2025):
- Najczęstszym atakiem w Robloxie jest przejęcie konta i kradzież dóbr wirtualnych (skinów, Robuxów) poprzez socjotechniczne wyłudzenie danych logowania.
- Oszuści rzadko używają sztucznych formułek; budują relację („fajny skin”), tworzą pozory legalnej akcji grupy/sponsora („wygrałeś giveaway 1500 Robux”) i podają pozornie logiczny pretekst techniczny („muszę się zalogować, żeby zatwierdzić wypłatę w systemie payout”).
- Usypiają czujność („nic nie zmienię, zmienisz hasło zaraz po doładowaniu”) i wywierają presję czasu.

### 2. Wiarygodny dialog bez sugerowania rozwiązania
Zmodyfikowano [MissionContent.luau](file:///Users/robert/Documents/Projects/hackyeah2026/MakeNoMistakesTeam/roblox/src/shared/MissionContent.luau):
- **Dialog w grze (`offer_intro`):**
  > MatiBuilds: *Siemka! Masz super skin, widać że znasz się na grze :)*  
  > MatiBuilds: *Słuchaj, moja grupa robi dzisiaj rozdanie 1500 Robuxów dla aktywnych graczy i wylosowałem ciebie!*  
  > MatiBuilds: *Żeby przelać Robuxy przez system wypłat grupy, muszę się na chwilę zalogować na twoje konto i zatwierdzić transfer.*  
  > MatiBuilds: *Spokojnie, nic nie zmienię, a hasło zmienisz sobie od razu jak skończę. Podasz mi szybko login i hasło?*
- **Pytanie decyzyjne:** *„Co odpowiadasz?”*
- **Wybory gracza (bez dydaktycznego zdradzania odpowiedzi):**
  - Opcja A: *„Jasne, podam hasło – doładuj mi Robuxy!”* (prowadzi do `ending_bad`)
  - Opcja B: *„Nie ma opcji, nikomu nie podaję hasła do konta.”* (prowadzi do `ending_good`)

### 3. Usunięcie podpowiedzi wizualnych z UI
Zmodyfikowano [MissionController.client.luau](file:///Users/robert/Documents/Projects/hackyeah2026/MakeNoMistakesTeam/roblox/src/client/MissionController.client.luau):
- W etapie `decision` wyeliminowano podział na zielony przycisk (dla odmowy) i czerwony przycisk (dla podania hasła), który automatycznie zdradzał prawidłową odpowiedź.
- Oba przyciski wyboru mają identyczny, profesjonalny, neutralny odcień (slate-blue RGB 36, 82, 138), identyczny rozmiar i czytelne zawijanie tekstu.
- Tytuł okna to neutralne `MatiBuilds` zamiast napisu zdradzającego oszustwo (`Podejrzana Oferta`).
- Nad głową postaci w [ScammerNPCManager.server.luau](file:///Users/robert/Documents/Projects/hackyeah2026/MakeNoMistakesTeam/roblox/src/server/ScammerNPCManager.server.luau) zmieniono billboard na `★ MatiBuilds ★` / `Porozmawiaj [E]`.

### 4. Rzetelne wyjaśnienia edukacyjne (Endings)
- **`ending_good` (Świetna decyzja!):** Pochwała za zachowanie bezpieczeństwa, jasne wyjaśnienie reguły gry (nikt uczciwy w Robloxie nie potrzebuje hasła do przekazania Robuxów) oraz wskazanie procedury: ignoruj, użyj oficjalnego [Report Abuse] i powiedz zaufanemu dorosłemu.
- **`ending_bad` (Konto przejęte!):** Realistyczne przedstawienie konsekwencji (utrata dostępu, kradzież rzadkich przedmiotów) bez potępiania gracza, wyjaśnienie mechanizmu oszustwa i wskazówka, jak postąpić w realnej sytuacji (kontakt z dorosłym i supportem Roblox).

### 5. Synchronizacja z Roblox Studio (Edit DataModel) i walidacja
- Zaktualizowano kod w plikach roboczych oraz bezpośrednio w Edit DataModel w Roblox Studio (`ReplicatedStorage.MissionContent`, `StarterPlayer.StarterPlayerScripts.MissionController`, `ServerScriptService.ScammerNPCManager`, `Workspace.MarketplaceLobby.ScammerNPC`).
- Uruchomiono Playtest, zweryfikowano fizyczne wywołanie ProximityPrompt, renderowanie neutralnych przycisków oraz przejścia do obu zakończeń.
- Przetestowano linterem `selene` (0 błędów) oraz zbudowano projekt `rojo build`.
