# Scamerino — audyt modelu fazy 2

model_tracer: PASS
root_cause: OBSERVED
diagnosis_status: OBSERVED
gesture_check: UNVERIFIED
alarm_default_off: UNVERIFIED
alarm_red_blink: UNVERIFIED
human_visual_acceptance: PENDING
tester: Codex, Roblox Studio MCP, desktop Play
timestamp: 2026-10-03T20:50:32Z

## Źródło i kopie przed pierwszą zmianą

Cel potwierdzony przez Roberta: aktualny scalony `Place1-pre-rojo`, placeId `74400324861465`, studio_id `d0ab5489-42ce-4dbe-bba9-337e48f65a90`. Inspekcja wykonywana w Edit na `Workspace.ScamerinoAlertinio`. Kopie pochodzą z tego DataModel, nie z plików legacy.

| Artefakt | Zapis Studio | Bajty | SHA256 |
|---|---|---:|---|
| `roblox/backups/Place1-phase2-before-scamerino.rbxl` | File → Download a Copy, 2026-10-03 20:37 UTC | 1780955 | `587044531a18867c8e4457bed4590097ce1f37a5b05f0a9f05da793597aa3e1b` |
| `roblox/assets/ScamerinoAlertinio-phase2-before.rbxm` | Built-in PromptSaveSelectionAsync + natywny dialog Save As, 20:42 UTC | 88922 | `6181e102c04a006dc454ea7f16740a7de5c5a344c6f2adce3b2e28b75117914e` |
| `roblox/assets/ScamerinoAlertinio-phase2.rbxm` | Ten sam wbudowany eksport po naprawie i Play, 20:50 UTC | 112640 | `c7e0e2eba53612397ee2de45df98a038c64555f458076d5708dd7b5780fbf3bf` |

Pierwsza edycja właściwości nastąpiła dopiero po potwierdzeniu obu niepustych kopii i ich sum. `sync.project.json` nie zawiera Workspace. Historycznych plików nie nadpisano. Próba otwarcia kopii jako osobnego pliku należy do Task 2 i pozostaje UNVERIFIED.

## OBSERVED — zastany model

- Model: 45 descendants; `PrimaryPart = HumanoidRootPart`; `Humanoid.RigType = R6`, `HipHeight = 0`, istniejący `Humanoid.Animator`.
- `HumanoidRootPart`: Part 2×2×1, Anchored=true, CanCollide=false, Massless=false. Pozostałe części niezakotwiczone. Wszystkie zastane części miały Massless=false.
- `Torso`: biały MeshPart 2.118454×2.025135×1.395343, **MeshId pusty**, CanCollide=true. Obraz Edit pokazywał pełny biały prostokąt zasłaniający sylwetkę.
- `Head`: MeshPart `92948738219699`, rozmiar 1.653548×1.992745×1.931507; CanCollide=false.
- `Left Arm` / `Right Arm`: MeshParts `83405766837163` / `134914431095109`, około 1.16×2.29×1.08; CanCollide=false.
- `Left Leg` / `Right Leg`: MeshParts `138544958935097` / `82853907992049`, około 1.00×1.53×1.33; CanCollide=false.
- `DorsalFin`: Part ze SpecialMesh typu Wedge, 0.4×2.2×1.8, niebieski, CanCollide=false; WeldConstraint do Torso.
- `MagnifyingGlass`: Handle, Rim, Lens, Hook, Envelope; wszystkie Parts bez kolizji, połączone WeldConstraint. Handle przyłączony do Left Arm. Lupa była za przednią płaszczyzną ciała; Rim był pełnym cylindrem zasłaniającym Lens.
- Sześć Motor6D: HRP.RootJoint → Torso; Torso.Neck → Head; Left/Right Shoulder → odpowiednie ramiona; Left/Right Hip → nogi. C1 było zerowe, punkty obrotu nie były anatomicznymi zawiasami.
- Cztery WeldConstraint pod Left Arm miały Part0=Left Arm i pusty Part1. Piąty przyłączał Handle.
- Head: `AlertSound`, `GreetSound`, `WinSound`, `SnapSound`, `StatusBadge` z Frame/Title/Subtitle, `SirenLight` PointLight aktywny, pomarańczowy (255,130,20). `Torso.ChatPrompt` ProximityPrompt. Brak skryptu animacji w zastanym modelu.

## Przyczyna i granice diagnozy

**OBSERVED:** bezpośrednią przyczyną kwadratowego torsu jest brak siatki w bieżącym Torso.MeshId. Wbudowane `AssetService:CreateMeshPartAsync(Content.fromUri(...))` i `Torso:ApplyMesh(...)` przywróciły siatkę `130674858699085` oraz teksturę `92517656171626`, obecne już w repo jako identyfikatory Scamerino. Po tej operacji na tej samej instancji Torso biały prostokąt zniknął, ujawniając zbroję z emblematem.

**UNKNOWN:** kiedy i przez jaki konkretny import/CSG utracono siatkę. Historyczny builder nie dowodzi wykonania jego SubtractAsync na tej instancji; nie przypisujemy mu historycznej przyczyny bez logów lub wcześniejszego stanu.

## repair_actions — cały istniejący rekin-robot

- Zachowano model, jego sześć części siatkowych, tekstury głowy i kończyn, dźwięki, syrenę, płetwę i lupę. Nie wstawiono generycznego humanoida i nie uruchomiono destrukcyjnego buildera.
- Torso 2.55×2.25×1.8; Head 2.1×2.25×2.45; ramiona 1.15×2.05×1.1; nogi 1.15×1.65×1.5. Dopasowano położenie wszystkich części, większą głowę, ramiona, biodra i płetwę 0.35×1.65×1.25.
- Przeniesiono lupę przed lewą dłoń; zachowano Hook i Envelope. Rim jest przezroczystym punktem zaczepienia, a 24 złote, połączone segmenty tworzą otwartą obręcz wokół przezroczystej Lens. Przezroczystość Rim jest celowym elementem geometrii, nie stubem.
- Punkty Motor6D C0/C1 ustawiono w szyi, barkach i biodrach, z zachowaniem pozy neutralnej. Podczas przebudowy wyłączono złącza i włączono je po ustawieniu pozycji. Cztery puste WeldConstraint usunięto jako niesprawne złącza modelu.
- Odkotwiczono root i wszystkie części; kolizja pozostaje wyłącznie na torsie; dekoracje, głowa i kończyny są Massless. Humanoid WalkSpeed=5, HipHeight=0.1, AutoRotate=true. Istniejący Animator pozostaje.
- Model zawiera produkcyjny `ScamerinoMotion` Script: serwer jest właścicielem fizyki, łagodny cykl 0.95 s, biodra do ±0.40 rad, ramiona do ±0.14 rad, płynne przejście do neutralnej pozy. Serwer replikuje C0. Nie dodano patrolu ani logiki misji.
- [Rule 1 - Bug] Pierwszy Play wykazał, że serwerowe Humanoid.MoveDirection pozostaje zerowe podczas MoveTo mimo prędkości 5. Warunek animacji poprawiono na zmierzoną prędkość poziomą + kontakt z podłożem. Powtórny rzeczywisty Play potwierdził ruch złączy.

## Desktop Play — dowody tracer

Model wykonuje rzeczywisty `Humanoid:MoveTo` w Play na placu między z=10 i z=24, następnie wraca i ponawia marsz. Polecenia demonstracji były wykonane tylko w runtime; eksport nie zawiera testowego patrolu.

| Obserwacja | Wynik |
|---|---|
| Początek / próbka marszu | root `(0,3.35,10)` → `(0,3.35,14.062538)` przy prędkości `(0,0,5)` |
| Ruch nogi / lekkie ręce | Left Hip około -0.336 rad, Left Shoulder około +0.118 rad w pierwszej próbce; kolejna próbka bioder ±0.174231 rad i ramion ±0.060981 rad |
| Spójność fizyczna | 37 części połączonych z root (38 BaseParts łącznie), zero części poza wspólną assembly |
| Spójność sześciu złączy | maksymalny błąd pozycji Part0*C0 względem Part1*C1: 0.00000190735 studa |
| Podłoże / zdrowie | Cobblestone podczas marszu, Health=100; plateau SpawnLocation ma inne Y i materiał SmoothPlastic |
| Po demonstracji czterech przejść | root około `(-0.000175,3.35,23.041430)`, Health=100; model i akcesoria pozostają połączone |

Widoki z **Play**, zapisane bez edycji obrazów:

- [Przód](evidence/02-01-play-front.jpg)
- [Bok](evidence/02-01-play-side.jpg)
- [Tył](evidence/02-01-play-back.jpg)

`model_tracer: PASS` oznacza obserwację techniczną Codex w rzeczywistym desktopowym Play i powyższe pomiary. Ludzka ocena proporcji, spokojnego kroku i podobieństwa do PNG czeka na checkpoint. Referencja `assets/Scamerino_Alertinio.png` została obejrzana: model zachowuje głowę rekina, mechaniczne kończyny, zbroję, emblemat, płetwę, syrenę, lupę i błękitno-srebrno-złotą paletę; istniejące tekstury są bardziej fioletowe niż brand token #0F62DB. Nie zmieniano całych tekstur ani nie deklarujemy dokładnej zgodności obrazu 2D z siatkami.

## Granica Task 2 i D-22

Gest i bezpieczny czerwony alarm nie zostały jeszcze rozszerzone ani zaliczone. Obecny zastany SirenLight pozostaje aktywny pomarańczowy; naprawa alarmu jest Task 2 po akceptacji tracer. Ten audyt nie dowodzi, że logika misji uruchamia alarm wyłącznie po fikcyjnym przekazaniu hasła mimo pomocy. D-22 należy do późniejszej integracji.

## Istniejące problemy poza zakresem modelu

Play wypisał błędy istniejącego samochodu A-Chassis Tune.Initialize (nil na linii 286, clamped density), odmowę istniejącego dźwięku `201887209` oraz oczekiwanie starych ScamerinoDialogueController na `ScamerinoDialogueEvent`. Nie dotyczą naprawy rigowania. Nie zmieniano tych plików; stare kontrolery dialogu mają zostać uporządkowane przez plany integracji.

## Dokumentacja użytych funkcji Studio

- [Plugin.PromptSaveSelectionAsync](https://create.roblox.com/docs/reference/engine/classes/Plugin) — wbudowany zapis zaznaczenia przez dialog, bez nowego pakietu.
- [PluginManager](https://create.roblox.com/docs/reference/engine/classes/PluginManager) — utworzenie tymczasowego obiektu Plugin do dialogu, niszczonego po zapisie; nie instalowano pluginu.
- [AssetService.CreateMeshPartAsync](https://create.roblox.com/docs/reference/engine/classes/AssetService) i [MeshPart](https://create.roblox.com/docs/reference/engine/classes/MeshPart) — przywrócenie istniejącej siatki przez ApplyMesh.
- [Motor6D](https://create.roblox.com/docs/reference/engine/classes/Motor6D) — C0/C1 i różnica względem niereplikowanego Transform.
