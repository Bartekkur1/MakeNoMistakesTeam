# Phase 3: Wynik, nagroda i przekazanie — Pattern Map

**Mapped:** 2026-10-04  
**Files analyzed:** 11 przewidywanych plików implementacji  
**Analogs found:** 9 / 11 (w tym analogi częściowe)

## Podstawa i granice

Obowiązuje `03-CONTEXT.md`, przede wszystkim `discussion_update` (linie 59–94). Bez punktów; końcowa odmowa zalicza niezależnie od pomocy i błędów quizu. Tarcza pozostaje do końca sesji, wraca po odrodzeniu, rozbłysk występuje raz. Raport zawiera decyzję i pomoc, bez historii rozmowy i liczby prób quizu. UI pokazuje wyłącznie status wysyłki i małą kartę obok czatu.

Nie zamawiano RESEARCH.md. AGENTS.md nie istnieje w katalogu głównym. Przejrzano indeksy lokalnych `.codex/skills/*/SKILL.md`; nie uruchamiano dodatkowego workflow. Źródła Roblox potwierdzono przez `git ls-files`. Źródła web-app są śledzone w drzewie `origin/master`, commit `3f689287b50a603aa1e0e71f2be07b219f6fce85`, odczytane przez `git show`; nie są obecne w working tree. Ich numery linii odnoszą się do tego commitu. Plan musi zapewnić dostępność tej podstawy przed zmianami backendu. Nie wykonano checkout, merge ani testów. Nie dotykano MapBorders ani build/Place1.rbxl.

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `roblox/src/server/RewardManager.luau` (nowy) | service | event-driven | `roblox/src/server/MissionService.server.luau` | partial: cykl życia gracza, brak Accessory |
| `roblox/src/shared/MissionContent.luau` | model | transform | ten sam plik | exact |
| `roblox/src/server/MissionService.server.luau` | controller | event-driven | ten sam plik | exact |
| `roblox/src/client/MissionController.client.luau` | component | event-driven | ten sam plik | exact |
| `roblox/src/server/ReportExportService.luau` (nowy) | service | request-response | `projects/web-app/src/app/api/reports/ingest/route.ts` | partial: odbiorca, brak klienta HTTP Luau |
| `projects/web-app/src/app/api/reports/ingest/route.ts` | route | request-response | ten sam plik w origin/master | exact |
| `projects/web-app/src/lib/server/validate.ts` | utility | transform | ten sam plik w origin/master | exact |
| `projects/web-app/src/lib/server/roblox.ts` | service | CRUD / transform | ten sam plik w origin/master | exact |
| `projects/web-app/src/lib/contract/types.ts` | model | transform | ten sam plik w origin/master | exact |
| `projects/web-app/supabase/migrations/<timestamp>_roblox_ingest_idempotency.sql` (proponowany) | migration | CRUD | brak odczytanego analogu deduplikacji | none |
| `roblox/src/server/ReportExportConfig.luau` (proponowany, jeśli konfiguracja nie jest dostarczana inaczej) | config | transform | brak bezpiecznej konfiguracji sekretu Roblox | none |

Pliki backendu wynikają z konieczności deduplikacji i usunięcia fałszywego oznaczania rzeczywistego ujawnienia hasła. Nazwy nowych migration/config są propozycją dla planisty, nie zamkniętą decyzją. Zmiana panelu nie jest konieczna, jeśli ingest zapisuje działania rzeczywiste jako pustą listę i opisuje fikcyjny wybór wyłącznie w treści. Jeżeli planner wybierze osobne oznaczenie treningu w modelu Report, należy rozszerzyć klasyfikację o ReportCards.tsx, content.ts i migrację Report.

## Pattern Assignments

### `roblox/src/server/RewardManager.luau` (service, event-driven)

**Analog:** `roblox/src/server/MissionService.server.luau` — częściowy. Importy linie 1–6:

```luau
--!strict
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local MissionContent = require(ReplicatedStorage:WaitForChild("MissionContent") :: ModuleScript)
local NPCNavigation = require(script.Parent:WaitForChild("NPCNavigation") :: ModuleScript)
local ScamerinoNPCManager = require(script.Parent:WaitForChild("ScamerinoNPCManager") :: ModuleScript)
```

Cykl życia: linie 454–467 pokazują podpięcie graczy już obecnych i nowych oraz sprzątanie słownika po PlayerRemoving. Stan sesyjny nagrody wzorować na `states: { [Player]: State }` (linia 43), ale trzymać go poza resetowanym State ćwiczenia. Dodać CharacterAdded, idempotentne nakładanie po sprawdzeniu nazwy `ScamerinoShieldAccessory` oraz zachować flagi zdobycia i pierwszego rozbłysku przez replay/respawn. Dostęp wyłącznie przez serwer; klient nie przesyła przyznania nagrody. Nie kopiować `CharacterRemoving -> cancel` jako odebrania nagrody.

Brak istniejącego Accessory/ParticleEmitter w `roblox/src`: geometria, Handle, BodyBackAttachment i przywracanie wymagają nowej implementacji. Kolory z `assets/scamerino_palette.json`: niebieski `#0F62DB`, ciemny niebieski `#0A3B8C`, złoty `#FFB800`. Nie traktować instancji w mapie ani buildów jako źródeł kodu.

### `roblox/src/shared/MissionContent.luau` (model, transform)

**Analog:** ten sam plik, typ snapshotu linie 23–36. Wzorzec pól opcjonalnych:

```luau
title: string?,
interlocutorName: string?,
ruleCard: RuleCardInfo?,
```

Rozszerzyć typ o małe podsumowanie wyniku, sesyjną informację o tarczy i status doręczenia z identyfikatorem próby. Nie wkładać payloadu HTTP/sekretu do tego modułu (ReplicatedStorage). Teksty zakończeń są w `MissionContent.texts`, linie 71–94; zastąpić długie ostrzegające opisy krótkimi D-39/D-40. Zachować wybory danych `ChoiceRecord` i przesyłanie samego choice.id. `getChoicesForStage` (209–222) daje listę dla etapu; `getChoice` (224–247) ma fallback między wszystkimi listami — nie kopiować fallbacku jako autoryzacji. Serwer powinien jawnie sprawdzać przynależność wyboru do aktualnej listy.

### `roblox/src/server/MissionService.server.luau` (controller, event-driven)

**Analog:** ten sam plik. Granica zaufania linie 173–189:

```luau
request.OnServerEvent:Connect(function(player: Player, action: any, revision: any)
    if typeof(action) ~= "string" then
        return
    end
    local state = stateFor(player)
    if action == "ready" then
        send(player, state)
        return
    end
    if typeof(revision) ~= "number" or revision ~= state.revision then
        return
    end
    local now = os.clock()
    if now - state.lastActionTime < 0.25 then
        return
    end
    state.lastActionTime = now
```

Wybór i właściciel spotkania: 236–248; publikacja snapshotu: 64–87. Integracja dokładnie przy końcowych przejściach `ending_good` (331–360) i `ending_bad` (422–450), nigdy przy pierwszej odmowie ani zamknięciu. Każde zakończenie generuje własną immutable próbę i eksport w task.spawn. Pomoc `helpReceived` z serwera, username/UserId z Player. Quiz nie wpływa na zaliczenie ani payload.

Wzorzec ochrony callbacków linie 94–96:

```luau
local function current(player: Player, state: State, revision: number): boolean
    return player.Parent == Players and states[player] == state and state.revision == revision
end
```

Stosować przed publikacją statusu zakończonej wysyłki. Sam eksport starej próby ma zakończyć się w tle mimo replay — nie przerywać go przez current(). Dodać identyfikator konkretnej próby do ochrony statusu; revision/sequence są już używane do ochrony UI. Replay linie 215–234 zeruje historię/pomoc/quiz i podbija revision; nie zerować nagrody sesyjnej. PlayerRemoving: sprzątać referencje, bez offline queue.

### `roblox/src/client/MissionController.client.luau` (component, event-driven)

**Analog:** ten sam plik. UI linie 17–38: ScreenGui.ResetOnSpawn=false, Frame obok krawędzi ekranu, UISizeConstraint. Kopiować Frame, label (51–62), UICorner i TextButton zamiast nowego pełnoekranowego modala. Karta podsumowania obok obecnego czatu; mapa pozostaje widoczna.

Replay linie 376–380:

```luau
elseif snapshot.status == "ending_good" or snapshot.status == "ending_bad" then
    count = 1
    actionButton("Spróbuj ponownie", 1, function()
        submit("replay")
    end)
```

Submit 339–345 przesyła action i revision, nie wynik. Podsumowanie renderować ze snapshotu, status wysyłki nie blokuje replay. `escape` (229–232) chroni RichText; dane tekstowe API muszą korzystać z niego lub TextLabel bez RichText. Render ma wczesny return dla start/closed/none (273–277); jawnie ukrywać wtedy nową kartę. Nie kopiować RuleCard jako centralnego ekranu końca. Bez raportu, JSON, kopiowania i deklaracji przeczytania zgłoszenia.

### `roblox/src/server/ReportExportService.luau` (service, request-response)

**Analogi:** MissionService task.spawn/current oraz odbiorca `projects/web-app/src/app/api/reports/ingest/route.ts` (origin/master). Brak gotowego klienta HttpService w Luau. Wprowadzić osobny serwerowy moduł z pcall wokół JSONEncode/RequestAsync/JSONDecode; błąd transportu, HTTP lub zła koperta odpowiedzi nie są potwierdzeniem. Nie logować sekretu ani payloadów. Kilka ograniczonych ponowień wymaga najpierw idempotentnego ingestu.

Kontrakt `projects/web-app/src/lib/contract/types.ts`, linie 433–455:

```typescript
export interface RobloxIngestRequest {
  roblox_username: string;
  roblox_user_id?: number;
  attack_type: AttackType;
  source?: "game";
  taken_actions?: TakenAction[];
  content: string;
  hints_used?: number;
  score?: number;
  outcome?: RobloxOutcome;
}
export interface RobloxIngestResponse {
  ok: true;
  report_id: string;
  child_name: string;
  parent_name: string;
  state: ReportState;
  matched: boolean;
}
```

`outcome` to `safe_refusal` albo `compromised_password` (427–428), nie passed/failed/test_outcome. score pomijać; helpReceived można odwzorować na hints_used 0/1. Nie wysyłać quizAttempts, checkedOffer, histories. Dodać stabilny identyfikator jednej próby i używać identycznego w każdym ponowieniu; nowa próba ma nowy identyfikator. Dane adresata z parent_name/child_name; matched=false oznacza profil demo, nie faktyczne powiązanie. Sprawdzić 2xx, ok=true oraz wymagane pola odpowiedzi przed statusem wysłano.

### Backend ingest: route.ts, validate.ts, roblox.ts, types.ts

**Analog:** odpowiednie pliki w origin/master. Auth route.ts linie 35–44:

```typescript
const secret = getIngestSecret();
if (secret === null) {
  console.error("[api] ingest_not_configured");
  return ingestError("ingest_not_configured", 500);
}
if (!ingestSecretMatches(request.headers.get("x-ingest-secret"), secret)) {
  return ingestError("invalid_ingest_secret", 401);
}
```

Zachować kolejność auth/body/validation/storage (46–72) i kopertę ingestError (29–33), nie standardową kopertę API. Odpowiedź po zapisie (74–82) zwraca adresata i matched. Error handling (83–85) korzysta z handleRouteError i daje storage_unavailable/internal_error.

Sekret `roblox.ts` linie 96–99:

```typescript
const secret = process.env.ROBLOX_INGEST_SECRET;
if (typeof secret !== "string" || secret.trim().length < MIN_INGEST_SECRET_CHARS) return null;
return secret.trim();
```

Porównanie timingSafeEqual: 103–107. Nie kopiować środowiska Node jako dostawcy konfiguracji Roblox. Tożsamość backend mapuje po nicku case-insensitive (75–85), fallback Ola (115), adresat wyliczany route.ts 56–63. roblox_user_id jest walidowany, ale nie służy obecnie mapowaniu.

Walidacja `validate.ts` 383–435: username format, opcjonalny dodatni integer UserId, source=game, content max 4500 znaków, allowed outcome, hints/score opcjonalne. Krytyczny fragment 424–425:

```typescript
if (outcome === "compromised_password" && !takenActions.includes("entered_password")) {
  takenActions.push("entered_password");
}
```

**Nie kopiować tej semantyki.** Nawet wysłanie taken_actions=[] z tym outcome dopisuje entered_password. D-35 wymaga usunięcia tej implikacji dla ćwiczenia i zdefiniowania rozróżnienia wyniku fikcyjnego od rzeczywistych działań. Zalecana minimalna ścieżka: raport ćwiczenia ma taken_actions=[], a decyzja fikcyjna jest opisana w content; backend zachowuje walidację outcome, ale nie generuje z niego rzeczywistego działania. Uzgodnić tekst wyniku tak, by API i panel nie przedstawiały go jako rzeczywistego wycieku.

`roblox.ts` 118–122 składa nagłówek i content; bez score nie pojawiają się punkty. Nadać jednoznaczny prefiks ćwiczenia/fallback demo, szczególnie dla nieprzypisanych nicków. types.ts rozszerzyć o identyfikator próby zgodnie z walidatorem; nie usuwać punktów innych workstreamów.

### Nowa migracja deduplikacji i konfiguracja serwera

Nie ma analogów rozwiązujących te problemy. Obecne route.ts 65–72 wywołuje createReport przy każdym żądaniu. Zaprojektować atomową deduplikację w bazie i zapis raportu w jednej transakcji, z unikalnością stabilnego identyfikatora próby (o odpowiednio określonym zakresie). Duplikat musi zwracać to samo report_id i adresata, także po zmianie mapowania nicku; równoległe żądania nie mogą tworzyć drugiego raportu. In-memory cache w Next.js nie wystarcza. Sama kolumna bez atomowego powiązania z tworzeniem raportu również nie wystarcza.

Konfiguracja Roblox: serwerowy moduł lub dostawca sekretu wybrany w planie, bez literalnej wartości w kodzie/dokumentacji i bez replikacji do klienta. Nowy plik server/*.luau trafia do ServerScriptService przez istniejący katalogowy mapping Rojo; nie wymaga osobnej zmiany sync.project.json. Zweryfikować to przy wykonaniu planu; nie synchronizować pełnej mapy przez default.project.json.

## Shared Patterns

### Serwer jako źródło prawdy

Źródło: MissionService 173–189, 236–248; applies to wynik, przyznanie tarczy i raport. Player pochodzi z OnServerEvent, a stan z serwerowego słownika. Przynależność choice do etapu sprawdzać jawnie z powodu fallbacku MissionContent.getChoice.

### Ochrona przed starymi odpowiedziami

Źródło: MissionService 94–96 i 219–224; applies to status eksportu i UI. Użyć capturedRevision oraz attemptId, zachować kolejność sequence przy każdej aktualizacji snapshotu. Stara wysyłka kończy się w tle, ale nie publikuje statusu w nowej próbie.

### Potwierdzenie zapisu i adresat

Źródło: ingest route.ts 74–85 oraz types.ts 447–460. Potwierdzenie dotyczy odbioru API, nie odczytu przez opiekuna. parent_name i matched z odpowiedzi; bez stałej „Mama Oli” dla wszystkich graczy. Brak offline preview/queue po porażce.

### Semantyka panelu (odczyt, nie analog nowego UI Roblox)

`projects/web-app/src/app/_panel/ReportCards.tsx` 36–38 renderuje report.content jako zwykły tekst, z whitespace-pre-wrap. TakenActionsCard (63–90) wyświetla rzeczywiste działania i znacznik ryzyka. `types.ts` 96–103 opisuje entered_password jako „wpisanie loginu lub hasła”; `content.ts` 107–110 opisuje pustą listę jako brak rzeczywistych działań. Sam dopisek „symulacja” w content nie naprawia sprzecznej czerwonej etykiety entered_password. `ReportActionsCard.tsx` dotyczy workflow opiekuna, a nie listy działań dziecka — właściwy komponent semantyki ryzyka znajduje się w ReportCards.tsx.

## No Analog Found

| File / część | Role | Data Flow | Reason |
|---|---|---|---|
| migracja idempotency | migration | CRUD | brak istniejącej deduplikacji ingest i odczytanego wzorca transakcji z kluczem próby |
| ReportExportConfig.luau / dostawca sekretu | config | transform | brak konfiguracji sekretów po stronie serwera Roblox |
| RewardManager: Accessory/ParticleEmitter | service | event-driven | istnieje cykl życia graczy, ale brak nagród akcesoriowych |
| ReportExportService: HttpService client | service | request-response | istnieje kontrakt odbiorcy, ale brak klienta HTTP Luau |

## Metadata

**Analog search scope:** roblox/src, roblox/sync.project.json, assets/scamerino_palette.json, śledzone źródła projects/web-app w origin/master.  
**Strong analogs:** MissionService, MissionContent, MissionController, ingest route, validate (pozostałe pliki tylko kontrakt/pomocnicze referencje).  
**Files scanned:** 12 plików źródłowych/konfiguracyjnych plus kontekst i wspólny kontrakt; szersze wyszukiwanie list plików nie było traktowane jako ekstrakcja.  
**Pattern extraction date:** 2026-10-04. Brak wykonywanych testów lub zmian implementacji. Planista może korzystać z powyższych zakresów i excerptów; nowe mechanizmy idempotencji, sekretu i Accessory wymagają konkretnej specyfikacji w planach.
