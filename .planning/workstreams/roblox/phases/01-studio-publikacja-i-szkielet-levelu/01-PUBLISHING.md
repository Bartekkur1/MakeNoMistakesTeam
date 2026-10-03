---
plan: 01-01
status: awaiting-human-evidence
publication_status: UNVERIFIED
asset_moderation_status: UNVERIFIED
message_status: NOT_SENT
interaction_status: UNVERIFIED
team_start_at: UNKNOWN
publishing_deadline_at: UNKNOWN
publishing_checked_at: UNKNOWN
scene_assembly_started_at: UNKNOWN
deadline_status: UNKNOWN
official_sources_checked_at: 2026-10-03T14:46:23Z
source_access_date: 2026-10-03
group_id: UNKNOWN
experience_id: UNKNOWN
place_id: UNKNOWN
public_play_url: UNKNOWN
image_asset_id: UNKNOWN
message_sent_at: UNKNOWN
first_rojo_connection_at: NOT_STARTED
---

# Phase 1 — publikacja i zabezpieczenie Place1

Sprawdzono publiczną dokumentację i oficjalne wydania. Nie sprawdzono zalogowanego konta, Creator Dashboard, publikacji, Play, moderacji ani wysłania wiadomości. `publishing_checked_at` oznacza rzeczywisty audyt publikacji w Studio/Dashboard; data lektury źródeł jest osobnym polem.

## Zegar zespołu i decyzja

- `team_start_at: UNKNOWN — requires human confirmation`. `ideas/defence/taski.md` liczy godziny od rozpoczęcia pracy zespołu, lecz nie podaje godziny. Daty utworzenia planów, sesji GSD i commitów nie stanowią dowodu tego startu.
- `publishing_deadline_at: UNKNOWN`. Po otrzymaniu oryginalnego startu z offsetem strefy czasowej wyliczyć dokładnie `team_start_at + 2 godziny`; zapisać oba znaczniki ISO 8601. Nie rozpoczynać nowego dwugodzinnego okna.
- `deadline_status: UNKNOWN`. Brak startu nie pozwala potwierdzić dotrzymania terminu. Jeżeli oryginalny deadline już upłynął, odnotować rzeczywiste spóźnienie; nie antydatować wiadomości.
- Decyzja operacyjna: wstrzymane składanie sceny i połączenie Rojo do otrzymania dowodów z zadania 2. `publication_status` pozostaje `UNVERIFIED`, a nie domniemane GO lub NO-GO.
- Przy braku dowodu grywalnej publikacji do rzeczywistego deadline: zapisać `NO-GO`, `MISSED_OR_BLOCKED`, dokładny blocker i rzeczywistą godzinę wiadomości wysłanej przez członka zespołu. Awaryjnie Studio Play Solo; po zadaniu 3 z place'a zbudowanego z repo, później nagranie pełnej misji dla presentation. Tego wariantu jeszcze nie przetestowano.

## Oficjalne wymagania — stan odczytany 2026-10-03

Każdy poniższy adres został otwarty lub sprawdzony w oficjalnym źródle tego dnia. To wymagania platformy lub funkcje narzędzi, nie dowody konfiguracji naszego doświadczenia.

| Obszar | Ustalenie ze źródła | Stan projektu / niezbędny dowód |
|---|---|---|
| Właściciel i role | Publikacja pozwala wybrać grupę jako Creator. Role grupy i uprawnienia dla konkretnego doświadczenia rozróżniają edycję, publikację i Playtest. [Publikacja](https://create.roblox.com/docs/production/publishing/publish-games-and-places), [role grupy](https://create.roblox.com/docs/projects/groups), [konfiguracja](https://create.roblox.com/docs/projects/configure-games). | UNKNOWN — requires Studio/Dashboard check: ID grupy, właściciel doświadczenia, Edit i Publish dla używanych kont, współpraca bez udostępniania kont. |
| Public/Limited i konto | Dokument wymaga dobrej kondycji konta, wieku co najmniej 2 dni, age check i ankiety Maturity. Dla wszystkich grup wiekowych dochodzą weryfikacja zależna od wieku, 2FA, 2 miesiące Plus/Premium albo opłata oraz ocena Kids/Select. [Wymagania publikacji](https://create.roblox.com/docs/production/publishing/publish-games-and-places). | UNKNOWN — requires Studio/Dashboard check. Szczególnie sprawdzić dostęp dzieci 10–13, niezależnie od testu dorosłego jurora. Nie wykonywano opłat ani zmian konta. |
| Limity i dostęp | Do 5 wcześniej niepublicznych gier dziennie można ustawić jako publiczne; limit place'a 100 MB. Audience ma Private, Limited i Public; grupa w Limited może wskazać Community Members. Public może wyłączyć rekomendacje. Nie potwierdzono oddzielnego trybu Unlisted. [Publikacja i Audience](https://create.roblox.com/docs/production/publishing/publish-games-and-places). | UNKNOWN — requires Studio/Dashboard check: ustawienie Audience i rzeczywista możliwość wejścia z konta odbiorcy. Link nie dowodzi dostępu. |
| Maturity | Ankieta wynika z rzeczywistej treści. Minimal/Mild mogą kwalifikować się dla Kids/Select, lecz nie zastępują wymagań publikacji. [Content maturity and compliance](https://create.roblox.com/docs/production/promotion/content-maturity). | Cel D-09: Minimal/Mild; faktyczna etykieta UNKNOWN — requires Studio/Dashboard check. Odpowiedzi muszą uwzględniać wszystkie assety i scenariusz. |
| Czat tekstowy | TextChatService rozdziela UI i kanały. Wyłączenie UI samo nie potwierdza blokady komunikacji; `CreateDefaultTextChannels` tworzy RBXGeneral/RBXSystem. [Text chat overview](https://create.roblox.com/docs/chat/in-experience-text-chat), [Chat window](https://create.roblox.com/docs/chat/chat-window). | Cel D-09: brak tekstowej komunikacji graczy. UNKNOWN — requires Studio/Dashboard check: wyłączyć default channels/UI, sprawdzić brak kanałów/custom chat i testować z dwoma klientami. |
| Głos | Dla pojedynczego place'a `VoiceChatService.EnableDefaultVoice = false`, potem publikacja i restart serwerów. [Voice Chat](https://create.roblox.com/docs/chat/voice-chat). | Cel D-09: wyłączony głos. UNKNOWN — requires Studio/Dashboard check: ustawienia całego doświadczenia, właściwość place'a i test. |
| Wielkość serwera | Cel projektu D-09: 1–4 graczy. Dokładnej lokalizacji bieżącej kontrolki limitu nie potwierdzono w otwartych źródłach. [Configure games and places](https://create.roblox.com/docs/projects/configure-games). | UNKNOWN — requires Studio/Dashboard check: zapisany limit, najlepiej 4, i dowód ustawienia. To wymóg projektu, nie domniemany limit Roblox. |
| Zakupy i monetyzacja | D-09 wymaga braku zakupów/monetyzacji. Oficjalne role obejmują zarządzanie monetization products. [Role grupy](https://create.roblox.com/docs/projects/groups). | UNKNOWN — requires Studio/Dashboard check: brak passes, developer products, subscriptions, paid access i skryptów zakupowych. Nie mylić opłaty za publikację z zakupami w grze. |
| Obraz i moderacja | Asset Manager importuje obrazy; zasoby przechodzą moderację, a oczekujący asset nie jest widoczny w opublikowanej grze. Każdy asset ma ID; użycie zależy również od uprawnień. [Assets](https://create.roblox.com/docs/projects/assets), [Asset Manager](https://create.roblox.com/docs/projects/assets/manager). | UNKNOWN — requires Studio/Dashboard check: upload, właściciel, ID obrazu i realny status. `asset_moderation_status: UNVERIFIED`. |

Publiczny dostęp dla dzieci 10–13 jest osobnym ryzykiem. Dokumentacja all-ages opisuje opłaty 1 000 Robux i przyspieszoną ocenę 50 000 Robux jako opcje; nie są zatwierdzonym zakupem zespołu i nie gwarantują natychmiastowego dostępu. Wymagania konkretnej grupy i czas oceny pozostają niezweryfikowane.

## Narzędzia i konfiguracja

| Narzędzie | Przypięta wersja | Oficjalne źródło sprawdzone 2026-10-03 |
|---|---|---|
| Rokit | 1.2.0, bootstrap poza `[tools]` | [Oficjalne wydanie](https://github.com/rojo-rbx/rokit/releases/tag/v1.2.0), [instalacja](https://github.com/rojo-rbx/rokit#installation) |
| Rojo | 7.7.1 | [Wydanie i dokładna składnia wpisu Rokit](https://github.com/rojo-rbx/rojo/releases/tag/v7.7.1), [instalacja Rojo 7](https://rojo.space/docs/v7/getting-started/installation/) |
| Selene | 0.32.0 | [Oficjalne wydanie](https://github.com/Kampfkarren/selene/releases/tag/0.32.0), [Roblox/Luau std](https://kampfkarren.github.io/selene/roblox.html), [CLI](https://kampfkarren.github.io/selene/cli/usage.html) |
| StyLua | 2.5.2 | [Oficjalne wydanie](https://github.com/JohnnyMorganz/StyLua/releases/tag/v2.5.2), [konfiguracja i Luau](https://github.com/JohnnyMorganz/StyLua#configuration) |

`roblox/rokit.toml` zawiera jawne wersje trzech narzędzi. Rokit pobiera je poleceniem `rokit install` uruchomionym w `roblox/` po instalacji oficjalnego Rokit 1.2.0. Selene używa `std = "roblox"` i generuje aktualną bibliotekę Roblox w cache; wersja CLI jest przypięta, biblioteka API aktualizuje się. StyLua jawnie wybiera Luau i lokalny `roblox/stylua.toml`.

Instalacja i uruchomienie binariów: NOT_RUN; wymagany gate instalacji/builda należy do zadania 3. Nie uruchomiono pluginu ani `rojo serve`. Katalog `src/` powstanie w kolejnych zadaniach; wtedy z `roblox/` wykonać `selene src` oraz `stylua --check --config-path stylua.toml src`. Nie sprawdzać ani formatować cudzych skryptów poza `roblox/`.

## Checklista zadania 2 — kolejność i wymagane dowody

1. Podać oryginalny `team_start_at` z offsetem i dowodem/wyjaśnieniem źródła. Wyliczyć prawdziwy deadline, zapisać czas audytu publikacji.
2. Przed pierwszym połączeniem Rojo zapisać obecną scenę do `roblox/backups/Place1-pre-rojo.rbxl`; otworzyć kopię i potwierdzić zachowanie sceny. Wyeksportować `roblox/assets/ScamerinoAlertinio-legacy.rbxm` z billboardem E, lupą i dźwiękami; sprawdzić import do oddzielnej kopii. Obecna interakcja pozostaje UNVERIFIED, dopóki Play jej nie dowiedzie. Nie nadpisywać oryginalnego Place1.
3. W Studio/Dashboard potwierdzić właściciela-grupę, uprawnienia i współpracę. Zanotować ID grupy, doświadczenia i place'a oraz komunikaty blokujące.
4. Wgrać `assets/Scamerino_Alertinio.png` do zasobów właściwej grupy/gry. Zanotować czas uploadu, ID obrazu używanego przez GUI (również ID decal, jeśli oddzielne), właściciela, status i czas sprawdzenia moderacji. Sprawdzić obraz w docelowym doświadczeniu. Brak uploadu nie jest statusem PENDING; nie zgadywać czasu zatwierdzenia.
5. Sprawdzić Audience/odbiorców, ankietę Minimal/Mild, wyłączoną komunikację, serwer 1–4, brak zakupów i monetyzacji. Próba publikacji: zapisać dokładny URL i wynik rzeczywistego wejścia albo dokładny komunikat blokujący. Test dorosłego nie potwierdza dostępu 10–13.
6. Członek zespołu wysyła na czat GO z przetestowanym linkiem albo NO-GO z blokadą i wariantem Studio. Zapisać potwierdzenie wysłania, rzeczywistą datę/godzinę i treść. `message_status: NOT_SENT` do otrzymania dowodu. Agent nie wysyła wiadomości osobom trzecim.
7. Dopiero po audycie i potwierdzonej wiadomości zapisać `scene_assembly_started_at`, zbudować trasę 20–40 studów i wyeksportować `roblox/assets/MarketplaceLobby.rbxm`. Root modelu: MarketplaceLobby; NPC R15: ScammerNPC; Humanoid DisplayName: FreeRobux_Giver; prompt: `Workspace.MarketplaceLobby.ScammerNPC.HumanoidRootPart.ProximityPrompt`. Osobny sibling Workspace: `MissionStart` typu SpawnLocation. Zapisać jego Position, Size, Anchored, Enabled, Neutral, AllowTeamChangeOnTouch, Duration, TeamColor i inne niestandardowe ustawienia potrzebne do odtworzenia.
8. Dostarczyć GetFullName/Explorer z dwoma dokładnymi ścieżkami, dowód odczytu/importu trzech artefaktów i kolejności czasowej. Zachować Scamerino legacy poza aktywnym Workspace; D-14 przewiduje pomocnika tylko w GUI. Używać Parts albo oficjalnych/zweryfikowanych modeli, sprawdzić skrypty ich descendants przed eksportem.

Wzór wiadomości do wysłania przez członka zespołu: „Roblox: [GO + przetestowany link / NO-GO + dokładna blokada]. Dostęp 10–13: [wynik/niepotwierdzony]. Fallback: pokaz Play Solo w Studio, później nagranie. Audyt: [czas]. Oryginalny start/deadline: [czasy].” To szkic; wysłania nie potwierdzono.

## Granica kontynuacji

Zadanie 2 ma `checkpoint:human-action`, `gate="blocking-human"`. Przed wznowieniem potrzebne są rzeczywiste kopie/exporty i dowody konta, publikacji, moderacji oraz wiadomości. Nie utworzono plików udających `.rbxl`/`.rbxm`. Nie utworzono jeszcze projektu live sync ani pełnego builda; `default.project.json` będzie służył wyłącznie do builda, a live sync ma używać `sync.project.json` bez Workspace.

Odchylenie od kryterium zadania 1: oryginalny start i deadline są UNKNOWN, ponieważ repo nie dostarcza wiarygodnego znacznika. Potwierdzenie przez człowieka jest wymagane w checkpoint; bramka tekstowa nie potwierdza dotrzymania dwóch godzin.
