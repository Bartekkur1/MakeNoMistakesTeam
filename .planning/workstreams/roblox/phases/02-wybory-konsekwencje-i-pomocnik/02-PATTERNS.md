# Phase 02: Wybory, konsekwencje i pomocnik - Pattern Map

**Mapped:** 2026-10-03
**Files analyzed:** 10 proponowanych miejsc zmian (6 istniejących źródeł, 2 nowe moduły, 2 artefakty modelu)
**Analogs found:** 7 / 10; 3 dokładne, 4 dopasowane rolą, 3 bez bliskiego analogu

## Podstawa i granice dowodów

Obowiązuje `02-CONTEXT.md`, szczególnie D-01..03 zastępujące start przez E, GUI-only i historyczny scenariusz kodu. RESEARCH.md nie powstaje na życzenie użytkownika. Mapa opiera się na kodzie repo; nie przeprowadzono inspekcji aktualnego Place1, Play, zewnętrznego research ani zmian Studio. Ścieżki nowych modułów są propozycją podziału odpowiedzialności dla planera, nie istniejącym kontraktem.

Wszystkie poniżej wskazane źródła analogów potwierdzono przez `git ls-files -- <path>`. Nie używać kopii runtime ani instalowanych mirrorów jako celu implementacji. Brak AGENTS.md w katalogu roboczym. Sprawdzono katalog lokalnych indeksów skills. Nie istnieje wzorzec testów automatycznych Roblox; faza 1 przewiduje Selene/StyLua i Play na komputerze. W tym zadaniu nie uruchamiano tych sprawdzeń.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `roblox/src/shared/MissionContent.luau` | model | transform | ten sam plik | exact |
| `roblox/src/server/MissionService.server.luau` | service | event-driven, request-response | ten sam plik | exact |
| `roblox/src/client/MissionController.client.luau` | controller | event-driven | ten sam plik | exact |
| `roblox/src/client/ScamerinoDialogueController.client.luau` | controller | event-driven | `roblox/src/client/MissionController.client.luau` | role-match |
| `roblox/src/server/ScammerNPCManager.server.luau` | controller | event-driven | ten sam plik; brak analogii chodzenia | role-match |
| `roblox/src/server/NPCNavigation.luau` (propozycja) | service | event-driven | brak nawigacji w istniejącym kodzie Roblox | none |
| `roblox/src/server/ScamerinoNPCManager.luau` (propozycja) | controller | event-driven | `roblox/src/server/ScammerNPCManager.server.luau` | role-match |
| `scripts/build_scamerino_npc.luau` (warunkowo) | utility | transform | ten sam builder; statyczny rig | role-match |
| `roblox/assets/ScamerinoAlertinio-phase2.rbxm` (proponowany eksport) | model | file-I/O | brak zbadanego eksportu ruchomego pomocnika | none |
| `roblox/backups/Place1-phase2-before-scamerino.rbxl` (proponowana kopia) | config | file-I/O | brak kodowego analogu bieżącej sceny | none |

`roblox/sync.project.json` jest istniejącym punktem integracji i nie wymaga zmiany przy dodaniu modułów w aktualnych katalogach. `assets/Scamerino_Alertinio.png` oraz `assets/scamerino_palette.json` są referencjami tylko do odczytu. Pliki Blender/FBX/GLB nie dowodzą stanu modelu w Place1 i nie są automatycznie zakresem edycji.

## Pattern Assignments

### `roblox/src/shared/MissionContent.luau` (model, transform)

**Analog:** ten sam plik, linie 1–7 i 40–47.

```luau
--!strict
export type ChoiceRecord = {
	id: string,
	label: string,
	nextStage: string,
	enabled: boolean,
}
```

```luau
function MissionContent.getChoice(choiceId: string): ChoiceRecord?
	for _, choice in ipairs(MissionContent.choices) do
		if choice.id == choiceId then
			return choice
		end
	end
	return nil
end
```

Zachować typowane rekordy i identyfikatory odpowiedzi. Rozszerzyć dane o krótkie wiadomości, osobne rozmowy MatiBuilds/Scamerino, odmowę pierwszą/drugą, sprawdzenie oferty, pytanie pomocnika i wyjaśnienia. Obecna płaska lista dwóch wyborów (25–38) nie wystarcza do walidacji odpowiedzi zależnie od etapu. Źródło karty zasad musi mieć pole z referencją; aktualny tekst oferty (12–15) jest wypowiedzią scammera, nie zasadami Roblox. Weryfikacja treści D-26 pozostaje zadaniem planowania/implementacji poza tą mapą wzorców.

### `roblox/src/server/MissionService.server.luau` (service, event-driven)

**Imports:** linie 1–6.

```luau
--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Workspace = game:GetService("Workspace")
local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)
```

**Stan per gracz:** linie 30–35.

```luau
type PlayerState = {
	stage: string,
	lastActionTime: number,
}
local playerStates: { [Player]: PlayerState } = {}
```

**Walidacja nadawcy/payloadu i limit:** linie 103–116.

```luau
local actionRemote = requestActionRemote :: RemoteEvent
actionRemote.OnServerEvent:Connect(function(player: Player, actionId: any)
	if typeof(actionId) ~= "string" then
		return
	end
	local now = os.clock()
	local state = getOrCreateState(player)
	-- Rate limiting: ignore rapid requests within 0.25s
	if now - state.lastActionTime < 0.25 then
		return
	end
	state.lastActionTime = now
```

Fragment otwiera handler; dalsza walidacja i zamknięcie są w liniach 118–144. Kopiować zasadę: etap i dozwolone odpowiedzi sprawdza serwer, potem aktualizuje stan i wysyła `FireClient(player, ...)` (49–51, 131–143). Rozszerzyć PlayerState o przebieg pomocy, liczbę prób pytania (maks. 2), odmowy, dwie historie i identyfikator bieżącego przebiegu do unieważniania pracy asynchronicznej. To rekomendowane pola, nie istniejący kod.

**Replay / błędy / lifecycle:** istniejący `teleportToStart` (54–64) sprawdza Character/root/start; `PlayerRemoving` (146–148) usuwa stan. Obecny replay (118–123) resetuje tylko stage i teleportuje. Nie resetuje NPC, alarmu ani historii. Dodać kontrolowane anulowanie ruchu, respawn i utratę gracza; żadna opóźniona odpowiedź starego podejścia nie może zmienić nowej misji. `replay` i `close` obecnie akceptowane przed walidacją etapu wymagają jawnej polityki dozwolonych etapów. Zastąpić `setupPromptListener` (66–100) automatycznym serwerowym rozpoczęciem po podejściu.

### `roblox/src/client/MissionController.client.luau` (controller, event-driven)

**Analog:** ten sam plik. Imports/remotes: 1–11; ScreenGui: 13–18; render i wybory: 169–218.

**Aktywacja gotowej odpowiedzi:** linie 188–190.

```luau
local btn = createChoiceButton(choice.label, color, function()
	requestActionRemote:FireServer(choice.id)
end)
```

**Odbiór stanu serwera:** linie 216–218.

```luau
missionUpdateRemote.OnClientEvent:Connect(function(stage: string)
	renderStage(stage)
end)
```

Kopiować `Activated:Connect(callback)` (163) oraz usuwanie tylko TextButton, z zachowaniem UIListLayout (134–140). Zastąpić duży panel jednym małym czatem, z historiami kluczowanymi rozmówcą, nickiem gracza i gotowymi odpowiedziami. Payload obecnie zawiera wyłącznie string etapu; plan musi zmienić jednocześnie serwer i klienta na typowany snapshot/zdarzenia. Nie tworzyć TextBox na hasło, prawdziwego whisper ani kanału komunikacji graczy. Karta zasad i animacja fikcyjnej utraty konta mogą pozostać w tym kontrolerze; brak osobnego kodowego wzorca tych prezentacji.

### `roblox/src/client/ScamerinoDialogueController.client.luau` (controller, event-driven)

**Analog:** MissionController: remotes 9–11, render 169–218. Własny plik daje wzorzec ponownego użycia GUI (20–34) i animacji TweenService (232–254), ale jego lokalne menu (265–360) nie jest serwerowym przebiegiem pomocy.

```luau
-- ScamerinoDialogueController, 362–368
dialogueEvent.OnClientEvent:Connect(function(action: string)
	if action == "open" then
		showMainMenu()
		openUI()
	end
end)
```

Zastąpić niezależne menu integracją z pojedynczym panelem misji. Planer powinien jawnie zdecydować usunięcie/wyłączenie starego kontrolera lub zmianę jego odpowiedzialności, aby dwa panele nie konkurowały. `WaitForChild("ScamerinoDialogueEvent")` (18) nie ma producenta w analizowanych plikach src/server; może pochodzić ze sceny, czego nie potwierdzono. Tekst w 351 nadal wymienia FreeRobux_Giver, E i kod: nie kopiować tego scenariusza. UI pomocnika nie może samodzielnie ustalać poprawności odpowiedzi ani ukończenia misji.

### `roblox/src/server/ScammerNPCManager.server.luau` (controller, event-driven)

**Analog:** ten sam plik, bootstrap 1–19 i wybór najbliższego gracza 68–81.

```luau
local nearestChar: Model? = nil
local nearestDist = 20
for _, player in ipairs(Players:GetPlayers()) do
	local char = player.Character
	if char and char:FindFirstChild("HumanoidRootPart") and char:FindFirstChild("Head") then
		local charHrp = char.HumanoidRootPart :: BasePart
		local dist = (charHrp.Position - hrp.Position).Magnitude
		if dist < nearestDist then
			nearestDist = dist
			nearestChar = char
		end
	end
end
```

To analog wykrywania odległości, nie rezerwacji NPC ani chodzenia. Skrypt oczekuje R15 UpperTorso/LowerTorso; nie kopiować tych nazw do pomocnika R6 bez inspekcji rig. Obecne losowe publiczne zaczepki (45–53) działają niezależnie od misji i stale; zastąpić zaczepką po zauważeniu, jednym dymkiem presji i powrotem do patrolu według stanu. `Chat:Chat` pod pcall jest historycznym mechanizmem; nie stanowi dowodu poprawnego użycia TextChatService. Publiczne dymki nie mogą ujawniać historii prywatnych rozmów. Heartbeat zmienia C0 (56–95); skoordynować animacje z Animator, aby dwa mechanizmy nie sterowały jednocześnie tym samym złączem.

### `roblox/src/server/ScamerinoNPCManager.luau` i `NPCNavigation.luau` (propozycje)

Pomocnik: kopiować bootstrap i sprawdzanie brakujących instancji ze ScammerNPCManager (6–19), lecz rozwiązać ścieżkę rzeczywistego modelu w Place1. Obecny analog kończy skrypt przez return; misja oczekująca na pomoc musi zamiast tego otrzymać jawny błąd i odblokować decyzje. Współdzielona nawigacja nie ma bliskiego analogu; nie przedstawiać nowej implementacji Pathfinding/MoveTo jako wzorca znalezionego w repo.

Plan ma określić właściciela każdego NPC przy wielu graczach, rezerwację/zajętość, limit oczekiwania, przeszkody, odległość zatrzymania, anulowanie i cleanup callbacków. Dane dialogu pozostają per gracz; pojedynczy fizyczny NPC wymaga osobnej polityki współbieżności. Ponowne wezwanie nie tworzy kolejnego taska. Niepowodzenie ścieżki kończy oczekiwanie, a nie wskazówki zdalnie jako udane dojście.

### `scripts/build_scamerino_npc.luau` i eksport modelu

**Analog rig:** builder, linie 228–244.

```luau
local function addMotor(name, p0, p1)
    local m = Instance.new("Motor6D")
    m.Name = name
    m.Part0 = p0
    m.Part1 = p1
    m.C0 = p0.CFrame:ToObjectSpace(p1.CFrame)
    m.C1 = CFrame.new()
    m.Parent = p0
    return m
end
```

Pozycje początkowe przeliczane w przestrzeni Part0 są użytecznym wzorcem; połączenia RootJoint/Neck/ramiona/biodra są w 239–244. WeldConstraint akcesoriów: 214–224. Kopiować te zasady dopiero po potwierdzeniu części aktualnego modelu.

**Ostrożność:** builder niszczy stary model (25–27), ma `hrp.Anchored = true` (38), tworzy własne mesh IDs (71–134), próbuje CSG torsu (83–95), a światło startuje pomarańczowe i aktywne (247–253). Nie uruchamiać go jako bezwarunkowej naprawy Place1. Brak dowodu, że aktualny kwadratowy tors pochodzi z CSG, konkretnej siatki czy importu. Przed zmianą zaplanować odczyt hierarchii/proporcji/złączy i kopię aktualnego modelu; poprawić całą sylwetkę względem PNG. Chodzenie wymaga oddzielnej konfiguracji rig/kolizji/animacji. Alarm musi być domyślnie wyłączony, czerwony i migający dopiero po share_fake_password po pomocy; wezwanie i błędne odpowiedzi pomocnika nie uruchamiają go.

## Shared Patterns

### Autorytatywny serwer i prywatne aktualizacje

Źródło: MissionService 30–51, 103–148. Wszystkie wybory i etapy weryfikuje serwer; FireClient adresowany do konkretnego Player. Brak tradycyjnego auth HTTP: tożsamość nadawcy pochodzi z OnServerEvent. Nie akceptować od klienta target Player, poprawności odpowiedzi, wyniku ani etapu.

### Błędy i anulowanie

Źródło: MissionService 54–64, ScammerNPCManager 6–19, builder 83–95. Obecne guardy i pcall są lokalne, bez centralnego loggera. Rozszerzyć błędy ruchu o komunikat dla użytkownika i powrót do dozwolonej decyzji. Przebieg/revision oraz anulowanie tasków to nowy wzorzec wymagający projektu, nie istniejący mechanizm repo.

### Importy, typy i GUI

Źródło: MissionController 1–18 i MissionContent 1–7. Luau strict, GetService, WaitForChild i typowane RemoteEvent/ModuleScript; brak aliasów lub barrel imports. `ResetOnSpawn = false` oznacza potrzebę jawnego resetu prezentacji przy respawnie; nie dowodzi resetu misji. Używać neutralnych kolorów odpowiedzi jak MissionController 184–190, bez wizualnego podpowiadania wyniku.

### Granica synchronizacji

Źródło: `roblox/sync.project.json`, linie 5–18.

```json
"ServerScriptService": {
  "$className": "ServerScriptService",
  "$path": "src/server"
},
"ReplicatedStorage": {
  "$className": "ReplicatedStorage",
  "$path": "src/shared"
}
```

Klient mapowany do StarterPlayerScripts (13–18). Nie dodawać Workspace do live-sync. Pełny `default.project.json` ma Workspace (5–21) i nie jest projektem do aktywnego Place1. Nowy model eksportować ze Studio do repo, a kopię wersjonować oddzielnie. Legacy `.rbxm` i `Phase1.rbxlx` są artefaktami historycznymi; ich istnienie nie potwierdza aktualnej sceny.

## No Analog Found

| File / potrzeba | Role | Data Flow | Reason |
|---|---|---|---|
| `roblox/src/server/NPCNavigation.luau` | service | event-driven | Brak PathfindingService/MoveTo w analizowanych źródłach Roblox |
| `roblox/assets/ScamerinoAlertinio-phase2.rbxm` | model | file-I/O | Istniejący legacy model binarny nie został zbadany jako rig ruchomy |
| `roblox/backups/Place1-phase2-before-scamerino.rbxl` | config | file-I/O | Kopia musi pochodzić z bieżącego Place1, nie z historycznego buildera |

Dodatkowe nowe mechanizmy bez konkretnego analogu: dwie historie czatu, arbitraż wspólnych NPC, serwerowe przerwanie rozmowy po oddaleniu, quiz z maksymalnie dwiema próbami i anulowanie asynchronicznych podejść. Ponieważ research został pominięty, planer musi jawnie zaprojektować te mechanizmy i zaplanować wymagane odczyty Studio; nie odsyłać do nieistniejącego RESEARCH.md.

## Integration Risks

1. Stan per Player nie rozwiązuje współdzielenia fizycznych NPC; bez rezerwacji różni gracze mogą nadpisywać cel ruchu.
2. Zmiana payloadu MissionUpdate wymaga spójnej aktualizacji obu stron i wyłączenia starego panelu pomocnika.
3. Opóźnione taski/MoveTo/animacje mogą po replay lub respawnie otworzyć starą rozmowę; potrzebne anulowanie i sprawdzenie bieżącego przebiegu przed każdym skutkiem.
4. R15 scammera i R6 buildera pomocnika wymagają osobnych adapterów rig. Aktualny Place1 pozostaje niezweryfikowany.
5. Stare E, FreeRobux_Giver, kod SMS i GUI-only nie mogą wejść do nowych planów jako decyzje obowiązujące.
6. Brak shared/content nie blokuje planu; nie przypisywać autorstwa/zatwierdzenia tekstów osobie 4. D-26 wymaga późniejszej weryfikacji źródła Roblox.
7. hints_used/stan otrzymania pomocy przygotować na serwerze, lecz punktacja, nagrody i eksport są fazą 3. Test telefonu pozostaje odłożony.

## Metadata

**Analog search scope:** wszystkie 5 plików `roblox/src/`, builder `scripts/build_scamerino_npc.luau`, projekty Rojo, paleta i dokumentacja workstreamu.
**Files scanned:** 9 źródeł/configów z numerowanym odczytem; dodatkowo kontekst i dokumentacja, inwentarz śledzonych assetów oraz wyszukanie mechanizmów ruchu.
**Strong analog families:** 5 (dane, serwer misji, GUI misji, kontroler NPC, builder rig).
**Pattern extraction date:** 2026-10-03
**Bieżący Place1:** nieinspekcjonowany; ta mapa nie potwierdza wyglądu, złączy, lokalizacji ani ruchu modelu.
