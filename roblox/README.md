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
