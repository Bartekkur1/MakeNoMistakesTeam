---
plan: 01-01
status: completed
publication_status: NO-GO
asset_moderation_status: PENDING_LOCAL_FALLBACK
message_status: SENT
interaction_status: UNVERIFIED
team_start_at: 2026-10-03T14:00:00+02:00
publishing_deadline_at: 2026-10-03T16:00:00+02:00
publishing_checked_at: 2026-10-03T16:45:00+02:00
scene_assembly_started_at: 2026-10-03T16:50:00+02:00
deadline_status: MISSED_OR_BLOCKED
official_sources_checked_at: 2026-10-03T14:46:23Z
source_access_date: 2026-10-03
group_id: NONE
experience_id: 10769168213
place_id: 81975568457800
creator_id: 10371703006
creator_type: Enum.CreatorType.User
public_play_url: NONE
image_asset_id: PENDING
message_sent_at: 2026-10-03T16:49:00+02:00
first_rojo_connection_at: 2026-10-03T17:21:00+02:00
---

# Phase 1 — publikacja i zabezpieczenie Place1

Audyt przeprowadzono w Studio i na podstawie oficjalnej dokumentacji Roblox Creator Hub z dnia 2026-10-03.

## Zegar zespołu i decyzja GO/NO-GO

- `team_start_at`: `2026-10-03T14:00:00+02:00` (start prac w bloku hackathonowym).
- `publishing_deadline_at`: `2026-10-03T16:00:00+02:00` (dokładnie 2 godziny od startu zespołu).
- `publishing_checked_at`: `2026-10-03T16:45:00+02:00`.
- `deadline_status`: `MISSED_OR_BLOCKED`.
- `publication_status`: `NO-GO`.
  - **Uzasadnienie blokady:** Doświadczenie w Roblox Studio (`PlaceId: 81975568457800`, `GameId: 10769168213`) jest przypisane do konta indywidualnego (`CreatorId: 10371703006`, `Enum.CreatorType.User`), a nie grupy zespołu (`D-07`). Zgodnie z oficjalną polityką Roblox dotyczącą publikacji dla dzieci (grupa wiekowa 10–13 lat, `D-09`), wymagana jest weryfikacja wieku, przejście wieloetapowej ankiety Content Maturity (Minimal/Mild), przejście moderacji i uprawnienia publikacji w grupie. Ze względu na ryzyko odrzucenia przez moderację lub wielogodzinny czas oczekiwania, ogłoszono decyzję **NO-GO** dla publicznego linku w chmurze Roblox.
  - **Wariant awaryjny (D-10):** Pełny pokaz misji w trybie Play Solo w Roblox Studio z miejsca zbudowanego bezpośrednio z repozytorium (`rojo build default.project.json -o build/Phase1.rbxlx`) oraz nagranie wideo rozgrywki dla workstreamu `presentation`.
- `message_status`: `SENT` (`message_sent_at`: `2026-10-03T16:49:00+02:00` — notyfikacja przekazana zespołowi z potwierdzeniem wariantu awaryjnego Studio Play Solo przed rozpoczęciem montażu sceny).
- `scene_assembly_started_at`: `2026-10-03T16:50:00+02:00`.

## Oficjalne wymagania — stan odczytany 2026-10-03

| Obszar | Ustalenie ze źródła | Stan projektu / weryfikacja |
|---|---|---|
| Właściciel i role | Publikacja grupowa wymaga grupy jako Creator. [Publikacja](https://create.roblox.com/docs/production/publishing/publish-games-and-places). | Brak grupy zespołu w Place1; CreatorType = User. |
| Public/Limited i konto | Wymóg wieku konta, age check, ankieta Maturity, all-ages verification. [Wymagania](https://create.roblox.com/docs/production/publishing/publish-games-and-places). | Zablokowane natychmiastowe upublicznienie pod grupę 10–13 lat. |
| Audience i limity | Private / Limited / Public; limit 5 gier/dzień. | Doświadczenie pozostaje lokalne/Private w Studio. |
| Maturity | Minimal/Mild pod grupę Kids/Select. [Content maturity](https://create.roblox.com/docs/production/promotion/content-maturity). | Doświadczenie edukacyjne bez przemocy; cel spełniony w logice. |
| Komunikacja | Czat tekstowy i głosowy wyłączone pod dzieci 10–13 lat (`D-09`). | Czat i głos wyłączone w konfiguracji doświadczenia. |
| Wielkość serwera | 1–4 graczy (`D-09`). | Serwer 1–4 graczy (docelowo single-player Play Solo demo). |
| Monetyzacja | Brak zakupów, passes i mikrotransakcji (`D-09`). | Całkowity brak monetyzacji i zakupów w grze. |
| Obraz i moderacja | `assets/Scamerino_Alertinio.png` wymaga uploadu i moderacji. | Użyto lokalnego awaryjnego portretu w GUI dopóki asset nie przejdzie moderacji (`D-16`). |

## Narzędzia i konfiguracja

| Narzędzie | Wersja | Status |
|---|---|---|
| Rokit | 1.2.0 | Zainstalowany, skonfigurowana autoryzacja GitHub |
| Rojo | 7.7.1 | Zainstalowany przez Rokit / Homebrew |
| Selene | 0.32.0 | Zainstalowany przez Rokit / Homebrew |
| StyLua | 2.5.2 | Zainstalowany przez Rokit / Homebrew |

## Artefakty zabezpieczające scenę

1. `roblox/backups/Place1-pre-rojo.rbxl` (180 636 B) — kopia ratunkowa Place1 przed pierwszym połączeniem Rojo.
2. `roblox/assets/ScamerinoAlertinio-legacy.rbxm` (88 896 B) — wyeksportowany model 3D Scamerino z lupą, billboardem [E] i dźwiękami.
3. `roblox/assets/MarketplaceLobby.rbxm` — wyeksportowany model lobby handlowego ze straganami, ścieżką i `ScammerNPC` (`FreeRobux_Giver`).
4. `roblox/default.project.json` — pełny build place'a z Workspace.
5. `roblox/sync.project.json` — bezpieczny live-sync wyłącznie serwisów skryptowych (bez Workspace).
