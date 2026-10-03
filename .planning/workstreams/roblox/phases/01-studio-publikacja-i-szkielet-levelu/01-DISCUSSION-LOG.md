# Phase 1: Studio, publikacja i szkielet levelu - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-03
**Phase:** 01-studio-publikacja-i-szkielet-levelu
**Areas discussed:** Workflow Studio ↔ repo, Cel publikacji, Sceneria i układ levelu, Szkielet interakcji

---

## Workflow Studio ↔ repo

| Option | Description | Selected |
|--------|-------------|----------|
| Rojo + pliki Luau | Skrypty .luau w roblox/src, default.project.json | ✓ |
| Tylko .rbxlx w gicie | Cały place jako XML | |
| Hybryda | .rbxl binarnie + Rojo dla skryptów | |

| Option (geometria) | Description | Selected |
|--------|-------------|----------|
| Rojo z modelami .rbxm | Mapa z Studio eksportowana do .rbxm | ✓ |
| Mapa z kodu | Parts generowane skryptem | |
| Ty zdecyduj | | |

| Option (toolchain) | Description | Selected |
|--------|-------------|----------|
| Rokit/Aftman + Rojo 7 | Wersje przypięte w repo | ✓ |
| Ręczna instalacja | | |
| Ty zdecyduj | | |

| Option (lint) | Description | Selected |
|--------|-------------|----------|
| Selene + StyLua | Lint + formatowanie | ✓ |
| Nic, tylko Studio | | |
| + luau-lsp/typy | --!strict | |

| Option (współpraca) | Description | Selected |
|--------|-------------|----------|
| Jedna osoba | Bez Team Create | |
| Kilka osób + Team Create | | ✓ |

| Option (reguła TC+Rojo) | Description | Selected |
|--------|-------------|----------|
| Skrypty z Rojo, mapa w TC | Jeden właściciel eksportuje .rbxm | ✓ |
| Tylko jedna osoba synchronizuje Rojo | | |
| Ty zdecyduj | | |

**User's choice:** Wszystkie rekomendowane, a do tego Team Create dla kilku osób.

---

## Cel publikacji

| Option | Description | Selected |
|--------|-------------|----------|
| Publiczny link, Studio jako zapas | public/unlisted | ✓ |
| Prywatna gra + testerzy | | |
| Tylko Studio | | |

| Option (konto) | Description | Selected |
|--------|-------------|----------|
| Grupa Roblox zespołu | | ✓ |
| Konto osobiste osoby 1 | | |
| Jeszcze nie wiadomo | | |

| Option (raport R1) | Description | Selected |
|--------|-------------|----------|
| Notatka .md w fazie + wiadomość | | ✓ |
| Tylko czat | | |
| Sekcja w roblox/README.md | | |

| Option (ustawienia) | Description | Selected |
|--------|-------------|----------|
| Bez czatu, małe serwery, Maturity, zero zakupów | | ✓ |
| Domyślne | | |
| Ty zdecyduj | | |

| Option (fallback) | Description | Selected |
|--------|-------------|----------|
| Play Solo z repo + nagranie | | ✓ |
| Tylko Play Solo | | |

**User's choice:** Wszystkie rekomendowane.

---

## Sceneria i układ levelu

| Option | Description | Selected |
|--------|-------------|----------|
| Plac handlowy / lobby | | ✓ |
| Park / plac zabaw | | |
| Baza Scamerino | | |

| Option (układ) | Description | Selected |
|--------|-------------|----------|
| Krótka liniowa ścieżka | | ✓ |
| Mała otwarta arena | | |

| Option (Scamerino w f1) | Description | Selected |
|--------|-------------|----------|
| Placeholder przy spawnie | | |
| Tylko w GUI | | ✓ |
| Dopiero w fazie 2 | | |

| Option (NPC) | Description | Selected |
|--------|-------------|----------|
| Zwykły awatar R15 „gracza” | | ✓ |
| Kreskowy sprzedawca | | |

| Option (assety) | Description | Selected |
|--------|-------------|----------|
| Parts + oficjalne modele | | ✓ |
| Toolbox swobodnie | | |
| Tylko Parts | | |

| Option (upload grafiki) | Description | Selected |
|--------|-------------|----------|
| Tak, od razu | | ✓ |
| Faza 2 | | |

**User's choice:** Wszystkie rekomendowane, z wyjątkiem pomocnika: ma być tylko w GUI, nie w świecie 3D.

---

## Szkielet interakcji

| Option | Description | Selected |
|--------|-------------|----------|
| ProximityPrompt + własne GUI | | ✓ |
| Wbudowany Dialog | | |
| Okno imitujące DM | | |

| Option (teksty) | Description | Selected |
|--------|-------------|----------|
| Moduł danych Luau | | ✓ |
| Hardcode w GUI | | |

| Option (decyzja) | Description | Selected |
|--------|-------------|----------|
| 2 wybory, 2 zakończenia, struktura na 4 | | ✓ |
| 4 przyciski zaślepki | | |
| 1 wybór | | |

| Option (stan) | Description | Selected |
|--------|-------------|----------|
| Serwer steruje etapami | | ✓ |
| Logika po stronie klienta | | |
| Ty zdecyduj | | |

| Option (zakończenie) | Description | Selected |
|--------|-------------|----------|
| Ekran końcowy + „Zagraj ponownie” | | ✓ |
| Strefa końcowa na mapie | | |

| Option (język) | Description | Selected |
|--------|-------------|----------|
| Polski | | ✓ |
| PL + EN | | |

**User's choice:** Wszystkie rekomendowane.

---

## Claude's Discretion

- Nazwy plików i układ `roblox/src`, nazwy RemoteEventów
- Wygląd okna dialogu
- Wymiary i dekoracje placu
- Rokit czy Aftman

## Deferred Ideas

Brak.
