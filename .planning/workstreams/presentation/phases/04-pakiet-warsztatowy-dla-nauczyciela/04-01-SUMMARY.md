---
phase: 04-pakiet-warsztatowy-dla-nauczyciela
plan: 01
subsystem: presentation-materials
status: complete
tags: [html, css, print, pdf, edge-headless, pypdf, warsztaty, nauczyciel]

requires:
  - phase: quick 261003-vel
    provides: poradnik.html (styl A4, paleta, maskotka, kontakty, „Rozdział dla nauczyciela” str. 16, umowa rodzinna str. 17)
provides:
  - projects/presentation/render-pdf.sh: render dowolnego HTML do PDF A4 przez Edge headless (argumenty: wejście, wyjście)
  - projects/presentation/warsztaty/check_pakiet.py: automatyczna kontrola pakietu (S1-S11, L0-L9, F1-F3)
  - projects/presentation/warsztaty/warsztaty.html: źródło pakietu (okładka, Jak korzystać, pełna lekcja 1, Źródła)
  - projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf: 14 stron A4 (plansze 1.1-1.4 w poziomie)
affects: [04-02 (lekcje 2 i 3 według tego samego kontraktu HTML), 04-03 (render poradnika przez render-pdf.sh, odsyłacz do pakietu)]

actuals:
  tokens: 19065    # chars/4 z 3 plików źródłowych (76 258 znaków); PDF pominięty jako plik binarny
  tasks: 3
  commits: 0       # zmierzone: git rev-list --count 4079da5..HEAD = 0; użytkownik zakazał commitów, zmiany są niezacommitowane
plan_head_before: 4079da5e6fef7abb202110fdb7ad1ae5c10f104f
plan_head_after: 4079da5e6fef7abb202110fdb7ad1ae5c10f104f

tech-stack:
  added: []
  patterns:
    - "Render HTML -> PDF: Edge --headless=new z tymczasowym --user-data-dir i --virtual-time-budget=10000 (Nunito z Google Fonts zdąży się wczytać)"
    - "Nazwana strona CSS @page plansza (A4 landscape) w dokumencie z pionowymi stronami"
    - "Kontrola PDF przez pypdf: liczba stron = liczba section.page, orientacja z mediabox, spis treści vs tekst stron, skala z macierzy cm"

key-files:
  created:
    - projects/presentation/render-pdf.sh
    - projects/presentation/warsztaty/check_pakiet.py
    - projects/presentation/warsztaty/warsztaty.html
    - projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf
  modified: []

key-decisions:
  - "Makiety mają numer 1.1-1.6 (żółta plakietka), żeby nauczyciel i klucz odpowiedzi mówili o tych samych przykładach na planszach i karcie 1A"
  - "Adresy w makietach wyglądają jak zwykły link (podkreślony, niebieski), a nie jak czerwone ostrzeżenie z poradnika: czerwone podświetlenie podpowiadałoby odpowiedź w ćwiczeniu Detektyw"
  - "W karcie 1D dodano ramkę z zasadą lekcji „Darmowe + link = pytam dorosłego”, żeby połówka A4 nie była w połowie pusta"
  - "check_pakiet.py dostał test S11 (wykrywa, że Edge zmniejszył cały dokument), bo S2 nie łapie tego błędu"

patterns-established:
  - "Kontrakt HTML pakietu (section.page + klasy konspekt/klucz/plansza/ws--*, .mock z atrybutami class, data-lesson, data-example) gotowy dla lekcji 2 i 3"
  - "Elementy siatek mają minmax(0, 1fr), a span.dom w makietach ma overflow-wrap: anywhere; inaczej długi adres poszerza stronę i Edge zmniejsza cały PDF"
  - "Plansza musi mieścić się w 186 mm wysokości; za wysoka plansza też powoduje zmniejszenie całego dokumentu (sprawdza S11)"

requirements-completed: [WRK-01]

duration: ~25 min
completed: 2026-10-04
---

# Phase 4 Plan 01: Pakiet warsztatowy, szkielet i lekcja 1 Summary

**14-stronicowy pakiet A4 „Oszustwo czy nie?”: okładka z maskotką i spisem, „Jak korzystać z pakietu”, pełna lekcja 1 (konspekt na 2 strony, klucz, 4 poziome kolorowe plansze z makietami w CSS, czarno-białe karty 1A-1D) i „Źródła” z 11 pozycjami. Do tego render przez Edge headless i automatyczna kontrola pypdf (S1-S11, L0-L9, F1-F3).**

## Performance

- **Duration:** ~25 min
- **Completed:** 2026-10-04T05:51Z
- **Tasks:** 3/3
- **Files created:** 4 (bez commitów, zgodnie z zasadą użytkownika)

## Accomplishments

- **Tracer (zadanie 1):** cała ścieżka HTML → Edge → PDF → check_pakiet.py zadziałała na 4 stronach (okładka, konspekt A, PLANSZA 1.1 w poziomie, czarno-biała karta 1A): `OK: 4 stron, 4 sekcji, lekcje: 0`.
- **Lekcja 1 (zadanie 2):** konspekt A (Warto wiedzieć z odsyłaczami [1][2][6], cele, cele w języku ucznia, umowa na lekcję, materiały z „Bez komputerów i telefonów dla uczniów.”), konspekt B (przebieg 3+5+14+12+6+5 = 45 min, ramka ujawnienia, SPE, karta do domu), klucz odpowiedzi, plansze 1.1-1.4, karty 1A (6 makiet), 1B (6 kart decyzji do pocięcia), 1C (4 pytania, „Quiz bez ocen”), 1D (2 × pół A4 z 116 111, 800 100 100, „umowa rodzinna”, poradnikiem). 18 przykładów, z czego 6 uczciwych (1/3).
- **Strony ramowe (zadanie 3):** „Jak korzystać z pakietu” (dla kogo, zawartość lekcji, co przygotować, zasady pakietu z 1/3 uczciwych przykładów, ramka ujawnienia, tabela „Lekcje w skrócie” dla 3 lekcji, zdanie, że pakiet nie wymaga aplikacji), „Źródła” (11 pozycji z 04-RESEARCH.md §4, data dostępu 3.10.2026, licencje CC BY-NC 4.0 / CC BY-NC-ND 3.0 PL), spis treści z 6 wpisami zgodnymi ze stronami PDF.

## Task Commits

Brak commitów: użytkownik chce mieć zmiany niezacommitowane (commit tylko na prośbę). Wszystkie pliki są nowe i nieśledzone w `git status`.

1. **Zadanie 1: tracer end-to-end** (niezacommitowane)
2. **Zadanie 2: pełna lekcja 1** (niezacommitowane)
3. **Zadanie 3: Jak korzystać, Źródła, spis treści** (niezacommitowane)

## Verification

| Sprawdzenie | Wynik |
|-------------|-------|
| `bash projects/presentation/render-pdf.sh … && python projects/presentation/warsztaty/check_pakiet.py --lessons 1 --full` | `OK: 14 stron, 14 sekcji, lekcje: 1`, kod 0 |
| Bramka zakazanych wzorców (podstawa programowa, F12/save as/devtools/network, HAR) | kod 0 (nic nie znaleziono) |
| `data-lesson="1" data-example="honest"` / `"scam"` | 6 / 12 |
| `class="dcard` | 6 |
| `data-find=` | 6 |
| `po lekcji` / `116 111` / `klasy 4-8` / `3.10.2026` / `CC BY-NC 4.0` | 2 / 2 / 3 / 1 / 3 |
| `@page plansza` / `.ws *` / `Scamerino_Alertinio.png` / `[.]example` | 1 / 1 / 2 / 9 |
| Adnotacje linków w PDF (pypdf /Annots) | 0 |
| Półpauzy i pauzy w warsztaty.html | 0 |
| Test negatywny S11 na celowo zmniejszonym PDF | `FAIL: S11 … skala 0.67` (test działa) |
| `git log -1` przed i po | `4079da5` bez zmian, 0 nowych commitów |

Podgląd wizualny (strony zrenderowane do PNG przez PyMuPDF, bo Read nie ma poppler): okładka (1), Jak korzystać (2), konspekt A i B (3-4), klucz (5), plansze 1.1, 1.3, 1.4 (6, 8, 9), karty 1A, 1B, 1C, 1D (10-13), Źródła (14). Plansze są poziome i kolorowe, karty czarno-białe, linie cięcia widoczne w 1B i 1D.

## Files Created/Modified

- `projects/presentation/render-pdf.sh`: render HTML → PDF A4 przez Edge headless; usuwa stary PDF, sprawdza `test -s`, sprząta katalog profilu (trap).
- `projects/presentation/warsztaty/check_pakiet.py`: kontrola struktury HTML i PDF (stdlib + pypdf), flagi `--lessons N`, `--full`, `--html`, `--pdf`.
- `projects/presentation/warsztaty/warsztaty.html`: źródło pakietu; styl skopiowany z poradnik.html l. 9-213 bez zmiany kolorów, plus nowe komponenty.
- `projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf`: wynik renderu, 14 stron (ok. 4,5 MB, głównie przez obraz maskotki).

## Decisions Made

Opisane w `key-decisions` powyżej. Treść lekcji zgodnie z planem; w ramach swobody: numer na każdej makiecie, neutralny wygląd linków w makietach, ramka z zasadą w karcie 1D, krótkie „Cele w języku ucznia” z drugim zdaniem „Po lekcji umiesz…”.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Edge zmniejszał cały dokument do ok. 67%**
- **Found during:** zadanie 2 (po powiększeniu czcionek na planszach)
- **Issue:** za wysoka plansza 1.4 (większe kafelki flag) i długi adres e-mail bez możliwości łamania sprawiały, że Edge skalował wszystkie strony w dół. Liczba stron się zgadzała, więc S2 i reszta testów przechodziły mimo błędu.
- **Fix:** umiarkowane rozmiary kafelków na planszy 1.4, `minmax(0, 1fr)` w siatkach, `overflow-wrap: anywhere` dla `.mock .dom`. Przyczynę ustaliłem bisekcją sekcji na kopii w katalogu tymczasowym.
- **Files modified:** projects/presentation/warsztaty/warsztaty.html
- **Commit:** brak (zakaz commitów)

**2. [Rule 2 - Missing critical] Test S11 w check_pakiet.py**
- **Found during:** zadanie 2
- **Issue:** kontrola nie wykrywała zmniejszenia dokumentu (patrz punkt 1), a plan 04-02 dopisze kolejne plansze i karty, gdzie ten błąd łatwo wrócić.
- **Fix:** S11 czyta dwie początkowe macierze `cm` w strumieniu każdej strony; ich iloczyn skali musi wynosić 0,75 (1 px CSS = 0,75 pt). Sprawdzone negatywnie na celowo zmniejszonym PDF.
- **Files modified:** projects/presentation/warsztaty/check_pakiet.py
- **Commit:** brak

**3. [Rule 1 - Bug] Przepełnienie karty 1D na dodatkową stronę**
- **Found during:** zadanie 2 (S2: 13 stron PDF na 12 sekcji)
- **Fix:** wysokość połówki 122 → 110 mm, mniejsze marginesy linii cięcia.
- **Files modified:** projects/presentation/warsztaty/warsztaty.html

**4. [Rule 1 - Bug] Drobne poprawki wyglądu z podglądu**
- Kicker na okładce nachodził na maskotkę (dodano max-width); emoji 🎁 zostawało kolorowe na czarno-białej karcie 1A (`.ws .emo { filter: grayscale(1) }`); emoji 🛟 w ramce ujawnienia nie miało glifu (zamienione na 🚨, jak w poradniku); nagłówek makiety SMS ułożony w wiersz jak w innych makietach.

**Total deviations:** 4 auto-fixed (3 × Rule 1, 1 × Rule 2). **Impact:** bez zmiany zakresu; kontrakt HTML z planu bez zmian.

## Issues Encountered

- `Read` nie renderuje PDF (brak poppler), więc strony oglądałem jako PNG z PyMuPDF w katalogu tymczasowym (poza repo).
- Wywołanie `bash` z Pythona na tej maszynie trafia do WSL, którego nie ma; bisekcję robiłem w powłoce Git Bash.
- W czasie wykonania w drzewie roboczym zmieniły się pliki, których ten plan nie dotyka (`slides/scenariusz.md`, część `slides/public/widget-report-*.png`). To praca użytkownika; niczego nie przywracałem ani nie zmieniałem.

## Known Stubs

- Tabela „Lekcje w skrócie” na stronie „Jak korzystać z pakietu” i podtytuł okładki („3 lekcje”) opisują lekcje 2 i 3, których stron jeszcze nie ma. To celowe: dopisuje je plan 04-02 według tego samego kontraktu HTML i wtedy rozszerzy też spis treści.
- „Czerwone flagi: …” i puste linie na kartach 1A/1B to miejsca do pisania dla uczniów, a nie zaślepki.

## Next Phase Readiness

- Plan 04-02 może dopisać lekcje 2 i 3 między kartą 1D a „Źródłami” i uruchomić `check_pakiet.py --lessons 3 --full`. Numery stron w spisie trzeba wtedy przesunąć (S8 podaje, gdzie tekst faktycznie jest).
- Plan 04-03 może renderować poradnik przez `bash projects/presentation/render-pdf.sh projects/presentation/poradnik/poradnik.html projects/presentation/poradnik/poradnik-bezpieczna-aura.pdf`.

## Self-Check: PASSED

- FOUND: projects/presentation/render-pdf.sh
- FOUND: projects/presentation/warsztaty/check_pakiet.py
- FOUND: projects/presentation/warsztaty/warsztaty.html
- FOUND: projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf
- Commits: zgodnie z zasadą użytkownika nie ma commitów do sprawdzenia (HEAD nadal 4079da5)
