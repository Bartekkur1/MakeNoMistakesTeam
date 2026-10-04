---
phase: 04-pakiet-warsztatowy-dla-nauczyciela
plan: 03
subsystem: presentation-materials
status: complete
tags: [requirements, poradnik, slidev, pdf, edge-headless, warsztaty, integracja]

requires:
  - phase: 04-01
    provides: render-pdf.sh, warsztaty-bezpieczna-aura.pdf (tytuł „Oszustwo czy nie?”)
  - phase: 04-02
    provides: kompletny pakiet (3 lekcje, 38 stron)
provides:
  - WRK-01 zdefiniowane w REQUIREMENTS.md (podsekcja „Materiały dla szkoły”, traceability Phase 4 / Pending, coverage 11)
  - ROADMAP.md: linia wymagań fazy 4 = „**Requirements**: WRK-01”
  - poradnik.html: odsyłacz „Gotowe lekcje” do pakietu w ramce „Profilaktyka w szkole” (bez linku)
  - poradnik-bezpieczna-aura.pdf: przebudowany, 19 stron, odsyłacz na str. 16, umowa rodzinna na str. 17
  - slides.md: punkt o pakiecie warsztatowym na slajdzie o szkole („Szkoła musi to zrobić. My dajemy narzędzie”)
  - scamerino-pitch.pdf: przebudowany, 10 stron, wzmianka na str. 9
affects: [weryfikacja fazy 4 (kryterium 4: slajd o szkole wspomina pakiet)]

actuals:
  tokens: 450      # chars/4 z dopisanych linii (REQUIREMENTS ~1250 zn., poradnik ~230, slides ~120, ROADMAP -37); PDF-y pominięte jako binarne
  tasks: 2
  commits: 0       # zmierzone: HEAD 4079da5 przed i po; użytkownik zakazał commitów, zmiany są niezacommitowane
plan_head_before: 4079da5e6fef7abb202110fdb7ad1ae5c10f104f
plan_head_after: 4079da5e6fef7abb202110fdb7ad1ae5c10f104f

tech-stack:
  added: []
  patterns:
    - "Odsyłacz do osobnego PDF jako nazwa pliku w <code>, bez <a href> (T-04-10)"

key-files:
  created: []
  modified:
    - .planning/workstreams/presentation/REQUIREMENTS.md
    - .planning/workstreams/presentation/ROADMAP.md
    - projects/presentation/poradnik/poradnik.html
    - projects/presentation/poradnik/poradnik-bezpieczna-aura.pdf
    - slides/slides.md
    - slides/scamerino-pitch.pdf

key-decisions:
  - "Wzmianka o pakiecie trafiła jako 5. punkt listy „Co dostaje szkoła” na slajdzie „Szkoła musi to zrobić. My dajemy narzędzie” (str. 9), a nie jako akapit pod listą na slajdzie „Pilotaż w jednej szkole”: użytkownik przebudował talię i slajdu pilotażu już nie ma; jego następca („Plan: zbadać skuteczność”) mówi o przyszłych badaniach, a lista „Co dostaje szkoła” już wymienia gotową lekcję i poradnik PDF, więc pakiet jest tam naturalnym uzupełnieniem"
  - "Odsyłacz w poradniku w pełnej wersji (bez skrótu awaryjnego), bo render zmieścił się w 19 stronach"

patterns-established: []

duration: ~10 min
completed: 2026-10-04
---

# Phase 4 Plan 03: Podpięcie pakietu do REQUIREMENTS, poradnika i talii Summary

**WRK-01 zapisane i śledzone; poradnik odsyła w rozdziale dla nauczyciela do pakietu „Oszustwo czy nie?” (nadal 19 stron, str. 16/17 bez zmian), a slajd o szkole w talii wymienia pakiet warsztatowy dla nauczyciela (nadal 10 slajdów, PDF przebudowany).**

## Performance

- Duration: ~10 min
- Completed: 2026-10-04
- Tasks: 2/2
- Files modified: 6

## Accomplishments

- REQUIREMENTS.md: podsekcja „### Materiały dla szkoły” z WRK-01 (opis z planu), wiersz `| WRK-01 | Phase 4 | Pending |`, coverage „v1: 11 total, mapped: 11, unmapped: 0 ✓”, stopka „*Updated: 2026-10-04 (WRK-01, faza 4)*”. CRLF zachowany.
- ROADMAP.md: usunięty tylko dopisek „(do dopisania w REQUIREMENTS.md)”; linia brzmi „**Requirements**: WRK-01”. Nic innego nie zmieniano.
- poradnik.html: pierwszy punkt ramki „Profilaktyka w szkole”: „**Gotowe lekcje:** pakiet warsztatowy „Oszustwo czy nie?” (osobny PDF `warsztaty-bezpieczna-aura.pdf`): 3 lekcje po 45 min dla klas 4-8, bez komputerów, z kartami pracy i planszami.” Bez linku, bez nowych sekcji (nadal 19 `<section`). CRLF zachowany.
- poradnik-bezpieczna-aura.pdf przebudowany przez `render-pdf.sh`; str. 16 obejrzana jako PNG: punkt widoczny, ramki zielona i pomarańczowa oraz czerwony boks „Czego nie robić” mieszczą się na stronie.
- slides.md: jedna nowa linia `<li><b class="gold">pakiet warsztatowy dla nauczyciela</b>: 3&nbsp;lekcje po 45&nbsp;min bez komputerów</li>` w liście „Co dostaje szkoła”. Pozostałe zmiany w slides/ (slides.md, style.css, scenariusz.md) to praca użytkownika w toku, nietknięta.
- scamerino-pitch.pdf przebudowany (`npm --prefix slides run export`); str. 9 obejrzana jako PNG: lista mieści się w niebieskiej karcie, kafelki statystyk i stopka „GUS 2024/2025” nie nachodzą na siebie.

## Verification

| Bramka | Wynik |
|--------|-------|
| Task 1 automated #1 (render + pypdf: 19 stron, „pakiet warsztatowy” i „Rozdział dla nauczyciela” na str. 16, „Propozycja umowy rodzinnej” na str. 17) | `OK 19`, exit 0 |
| Task 1 automated #2 (19 sekcji, WRK-01 ≥ 2, coverage 11, linia ROADMAP, brak href) | exit 0 |
| Task 1 acceptance (`| WRK-01 | Phase 4 | Pending |`, `### Materiały dla szkoły`) | exit 0 |
| Task 2 precondition (slides/node_modules/@slidev/cli, chrome.exe) | spełniony |
| Task 2 export | „✓ exported to ./scamerino-pitch.pdf”, 10 stron |
| Task 2 pypdf (wzmianka w PDF) | wzmianka na str. 9 (nie 10, patrz odchylenie 1) |
| Task 2 automated #2 (fraza w slides.md, brak półpauz/pauz w całym pliku) | exit 0 |
| git | brak nowych commitów (HEAD 4079da5), wszystko niezacommitowane |

Uwaga: podczas eksportu Slidev wypisuje `[console.error] Failed to patch FloatingVue TypeError ... 'Popper'` z @shikijs/vitepress-twoslash; to ostrzeżenie klienta niezwiązane ze zmianą, eksport kończy się sukcesem.

## Deviations from Plan

**1. [Rule 3 - Blocking] Slajd docelowy D-18 nie istnieje w obecnej talii**
- **Found during:** Task 2
- **Issue:** Plan kotwiczył zmianę na slajdzie „# Pilotaż w jednej szkole” (ostatnia strona) jako akapit `p.text-sm` pod listą `ol`. Użytkownik przebudował talię: ten slajd zastąpił „Plan: zbadać skuteczność” (o przyszłych badaniach, layout image-right), a slajd o szkole to teraz „Szkoła musi to zrobić. My dajemy narzędzie” z kartą „Co dostaje szkoła”.
- **Fix:** Dodany jeden punkt `li` na liście „Co dostaje szkoła” (obok „gotowa lekcja” i „poradnik PDF”), w konwencji listy (`b.gold`, twarde spacje po liczbach, bez półpauz). Render sprawdzony wzrokowo: brak przepełnienia. Kontrola pypdf z planu (ostatnia strona) zastąpiona wyszukaniem wzmianki na wszystkich stronach; wzmianka jest na str. 9, talia ma 10 stron.
- **Files modified:** slides/slides.md, slides/scamerino-pitch.pdf

**2. [Informacyjne] ROADMAP.md ma końce linii LF, nie CRLF**
- Plan zakładał CRLF; plik w kopii roboczej ma LF. Edycja zachowała istniejące końce linii; regex bramki (`.?$`) działa dla obu.

## Known Stubs

Brak.

## Next Phase Readiness

- Kryterium sukcesu 4 fazy spełnione (slajd o szkole wspomina pakiet). Do weryfikacji fazy: status WRK-01 w traceability nadal Pending (zmienia go weryfikacja).
- Human-check z planu: obejrzeć slides/scamerino-pitch.pdf, str. 9 (zamiast 10) – lista „Co dostaje szkoła” z punktem o pakiecie, bez nachodzenia na kafelki i stopkę.
- PDF talii został wyeksportowany z bieżącym stanem pracy użytkownika w slides/ (jego niezacommitowane zmiany są w tym PDF).

## Self-Check: PASSED

- FOUND: .planning/workstreams/presentation/REQUIREMENTS.md (WRK-01 ×2)
- FOUND: projects/presentation/poradnik/poradnik.html (warsztaty-bezpieczna-aura.pdf)
- FOUND: projects/presentation/poradnik/poradnik-bezpieczna-aura.pdf (19 stron)
- FOUND: slides/slides.md (pakiet warsztatowy dla nauczyciela)
- FOUND: slides/scamerino-pitch.pdf (10 stron)
- Commits: 0 zgodnie z regułą użytkownika (HEAD 4079da5 bez zmian)
