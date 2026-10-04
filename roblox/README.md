# Cyberpomocnik — Roblox Workstream

Projekt gry edukacyjnej dla dzieci 10–13 lat uświadamiającej zagrożenia oszustwami w Roblox (HackYeah 2026 Defence track).

## Narzędzia i instalacja

Narzędzia developerskie są przypięte w `rokit.toml`:
- **Rojo** 7.7.1
- **Selene** 0.32.0
- **StyLua** 2.5.2

### Instalacja narzędzi
Jednym poleceniem w katalogu `roblox/`:
```bash
rokit install
```

Weryfikacja wersji:
```bash
rojo --version
selene --version
stylua --version
```

### Formatowanie i linter
```bash
selene src
stylua --check src
```

## Workflow Studio ↔ Repo (Zasady D-01 .. D-05)

### 1. Pełny build place'a (`default.project.json`)
Służy do rekonstrukcji całego miejsca (Workspace + skrypty) z poziomu repo:
```bash
mkdir -p build
rojo build default.project.json -o build/Phase1.rbxlx
```
Plik wynikowy `build/Phase1.rbxlx` zawiera wyeksportowaną geometrię `assets/MarketplaceLobby.rbxm`, punkt startowy `Workspace.MissionStart` oraz wszystkie skrypty w serwisach Roblox.

> [!WARNING]
> **Nigdy nie podłączaj `default.project.json` do aktywnej sesji Team Create!**
> `default.project.json` posiada węzeł `Workspace`, co przy live-sync mogłoby nadpisać ręcznie edytowaną geometrię w Studio.

### 2. Live-sync w czasie pracy w Studio (`sync.project.json`)
Do pracy w Roblox Studio z włączonym pluginem Rojo używaj **wyłącznie** projektu synchronizacji skryptów:
```bash
rojo serve sync.project.json
```
Projekt `sync.project.json` mapuje wyłącznie serwisy logiczne (`ServerScriptService`, `ReplicatedStorage`, `StarterPlayer.StarterPlayerScripts`) i celowo **nie zawiera** węzła `Workspace`. Dzięki temu Team Create pozostaje jedynym źródłem prawdy dla ręcznie budowanej geometrii.

### 3. Zapis zmian na GitHub

Rojo oraz Git wykonują osobne operacje. Samo Play, zapis w Studio i połączenie Rojo nie tworzą commitów ani nie wypychają gałęzi na GitHub. Kod synchronizowany przez `sync.project.json` edytuj w `roblox/src/`. Po zmianach wykonaj commit i push na bieżącej gałęzi. Rojo 7.7.1 udostępnia opcjonalne mechanizmy synchronizacji zwrotnej, lecz nie zastępują one Git; nie włączaj ich bez sprawdzenia projektu i kopii sceny.

Zmiany modelu, Workspace i skryptów osadzonych w modelu wymagają osobnego zapisu/eksportu ze Studio, ponieważ aktualny projekt synchronizacji nie mapuje Workspace ani StarterGui. Przed importem/sync porównaj źródła i zabezpiecz wersję Studio; nie zastępuj jej automatycznie starszym prefabem lub pełnym buildem.

#### Aktualna kopia fazy 2 — 2026-10-03

- `backups/Place1-phase2-current-2026-10-03.rbxl`: pełna kopia bieżącego Place1 z zaakceptowaną sylwetką, wysokością i chwytem lupy; pobrana przez File → Download a Copy.
- `backups/Place1-phase2-live-scripts-2026-10-03.json`: dokładne źródła wszystkich 9 skryptów projektu ze Studio, wraz ze ścieżkami instancji.
- `backups/Place1-phase2-current-2026-10-03.manifest.json`: rozmiary i sumy SHA256 obu kopii.
- `scene-scripts/ScamerinoMotion.server.luau`: czytelna kopia skryptu osadzonego w modelu.
- `scene-scripts/LegacyScamerinoDialogueController.client.luau`: zabezpieczona kopia starego kontrolera StarterGui; nie jest nowym panelem MissionController.

Folder `scene-scripts/` służy do zachowania źródeł; nie jest mapowany przez Rojo. Nie dodawaj jego skryptów do ServerScriptService jako drugich kontrolerów.

Odtwarzanie: rozłącz Rojo, otwórz pełną kopię `.rbxl` przez File → Open from File i porównaj ją z potrzebną wersją. Kopia zawiera bieżący kod, ale nie oznacza zaliczenia fazy 2 — znane usterki scammera opisuje `02-SCAMMER-REVIEW.md`. Starszy `assets/ScamerinoAlertinio-phase2.rbxm` poprzedza późniejsze poprawki Roberta; do odzyskania zaakceptowanego modelu użyj tej aktualnej kopii sceny.

## Baseline sceny i inwentarz artefaktów

- **Kopia zapasowa sceny przed Rojo:** `roblox/backups/Place1-pre-rojo.rbxl`
- **Model lobby handlowego:** `roblox/assets/MarketplaceLobby.rbxm`
- **Zachowany model Scamerino (legacy):** `roblox/assets/ScamerinoAlertinio-legacy.rbxm` (zachowuje model 3D, lupę z artem phishingu, billboard GUI z klawiszem [E], kogut alarmowy i dźwięki `GreetSound`, `AlertSound`, `WinSound`, `SnapSound`)
- `interaction_status: UNVERIFIED` (wymaga dowodu z Playtestu)

### Ścieżki w hierarchii Workspace
Zgodnie z kontraktem fazy 1 w Workspace znajdują się obiekty:
- `Workspace.MarketplaceLobby.ScammerNPC.HumanoidRootPart.ProximityPrompt` — punkt wejścia w interakcję z NPC udającym gracza
  - Model wewnętrzny: `ScammerNPC`
  - Nazwa wyświetlana w Humanoid (`DisplayName`): `FreeRobux_Giver`
- `Workspace.MissionStart` — SpawnLocation będący punktem startowym i celem teleportacji po zakończeniu misji

### Pomocnik Scamerino
Zgodnie z decyzją D-14, pomocnik Scamerino w Fazie 1 występuje w interfejsie 2D (GUI dialogu) jako portret/obrazek. W świecie 3D model jest zabezpieczony jako prefab w `ServerStorage.ScamerinoAlertinio_Prefab` oraz `roblox/assets/ScamerinoAlertinio-legacy.rbxm`, a jego pełne włączenie jako aktywnego aktora 3D następuje w kolejnym etapie.

## Eksport zgłoszeń do panelu opiekuna (Faza 3)

Po zakończeniu ćwiczenia (zarówno przy bezpiecznej odmowie, jak i uległości) serwer gry wysyła raport bezpośrednio do backendu (`POST /api/reports/ingest`).

### Wymagania konfiguracyjne:
1. **Game Settings ➔ Security:**
   - Opcja **Allow HTTP Requests** musi być włączona (**ON**).
2. **ServerStorage.ReportExportSettings (instancja Configuration):**
   - Atrybut typu String `BackendBaseUrl`: publiczny adres HTTPS backendu (np. `https://bezpieczna-aura.pl`). Endpointy bez HTTPS lub `localhost` są odrzucane przez mechanizm fail-closed.
   - Atrybut typu String `IngestSecret`: tajny klucz uwierzytelniający M2M zgodny ze zmienną `ROBLOX_INGEST_SECRET` backendu.
   - Wartości te znajdują się wyłącznie w `ServerStorage` (po stronie serwera) i nigdy nie są replikowane do klienta, logowane ani umieszczane w publicznym repozytorium.
