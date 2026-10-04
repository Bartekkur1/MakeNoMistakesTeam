---
phase: 04-pakiet-warsztatowy-dla-nauczyciela
plan: 02
subsystem: presentation-materials
status: complete
tags: [html, css, print, pdf, edge-headless, warsztaty, nauczyciel, lekcja-2, lekcja-3]

requires:
  - phase: 04-01
    provides: warsztaty.html (kontrakt klas, lekcja 1 jako wzór), render-pdf.sh, check_pakiet.py
provides:
  - projects/presentation/warsztaty/warsztaty.html: źródło pakietu z 3 kompletnymi lekcjami (38 sekcji)
  - projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf: 38 stron A4 (plansze 1.1-3.4 w poziomie)
affects: [04-03 (odsyłacz do pakietu z poradnika, render poradnika)]

actuals:
  tokens: 16700    # chars/4 z dopisanych linii warsztaty.html (66 682 bajtów diffu); PDF pominięty jako plik binarny
  tasks: 2
  commits: 0       # zmierzone: HEAD 4079da5 przed i po; użytkownik zakazał commitów, zmiany są niezacommitowane
plan_head_before: 4079da5e6fef7abb202110fdb7ad1ae5c10f104f
plan_head_after: 4079da5e6fef7abb202110fdb7ad1ae5c10f104f

tech-stack:
  added: []
  patterns:
    - "Karta ról .rola: tytuł + .rl-sides (1 lub 2 kolumny .rl-side) z liniami cięcia; bez data-example, więc nie liczy się do proporcji przykładów"
    - "Plansza zasad (.flag.ok, zielona) i plansza pomocy (.pl-help: drabinka .ladder + boksy 112 i prawa ucznia)"
    - "Modyfikator .ws--quiz.compact dla quizu z 5 pytaniami, żeby zmieścił się na 1 stronie"

key-files:
  created: []
  modified:
    - projects/presentation/warsztaty/warsztaty.html
    - projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf

key-decisions:
  - "Makieta 3.4 (ciocia, BLIK) ma kontekst „Pisze ciocia Ania, ale zwykle dzwoni, a nie pisze.” zamiast „Konto cioci mogło zostać przejęte”: ten drugi podawałby uczniom odpowiedź w ćwiczeniu Detektyw; informacja o przejętym koncie jest w kluczu"
  - "Makieta 3.2 (Ola) dostała kontekst „Ola chodzi do twojej szkoły, znasz ją z przerw.”, bo bez niego uczeń nie ma podstaw, by uznać ją za uczciwą (B13 scenka 7: znasz ją, potwierdzisz w szkole)"
  - "Karty 2B/3B: każda trójka losuje jedną kartę ze swojego kompletu (pogodzenie „komplet na trójkę” z „po jednej karcie na trójkę” w 6 minut)"
  - "Plansza 2.4 „Mój klucz” jako 6 zielonych kafelków zasad i 1 czerwony („Wyłącz antywirusa” = oszust), zamiast czerwonych flag jak w 1.4, bo to zasady, a nie sygnały"
  - "Quiz 3D pyt. 5 ma kilka dobrych odpowiedzi (A, B i C); instrukcja na karcie mówi o tym wprost"

patterns-established:
  - "Lekcje 2 i 3 mają 12 stron: konspekt A, B, klucz, 4 plansze, karty A-E (z ws--scenka jako C)"
  - "Klucz odpowiedzi z kolumną „dobra reakcja” 66 mm, żeby klucz z sekcją scenki mieścił się na 1 stronie"

requirements-completed: [WRK-01]

duration: ~30 min
completed: 2026-10-04
---

# Phase 4 Plan 02: Lekcje 2 i 3 Summary

**Pakiet „Oszustwo czy nie?” ma teraz 38 stron i 3 kompletne lekcje po 45 min. Lekcja 2 „Moje konto, mój klucz” obejmuje kody i hasła, przejęte konto kolegi, wymiany „ty pierwszy” i prośbę o plik z przeglądarki. Lekcja 3 „Obcy, presja i sekrety” obejmuje przejście na inny komunikator, sekrety, prezenty, BLIK i spotkanie oraz drabinkę pomocy z 116 111 i 112. W każdej lekcji jest Detektyw, karty „Co zrobisz?” i scenka odmowy, a 6 z 18 przykładów to uczciwe wiadomości.**

## Performance

- **Duration:** ~30 min
- **Completed:** 2026-10-04T06:04Z
- **Tasks:** 2/2
- **Files modified:** 2 (bez commitów, zgodnie z zasadą użytkownika)

## Accomplishments

- **Lekcja 2 (zadanie 1), strony 14-25:** konspekt A (Warto wiedzieć [2] z uwagą „nie wyjaśniaj, jak plik powstaje”, 5 celów, cele ucznia, umowa, materiały „Bez komputerów i telefonów dla uczniów.”), konspekt B (3+5+14+6+6+6+5 = 45 min, ramka ujawnienia, SPE, karta do domu), klucz, plansze 2.1-2.3 (makiety 2.1-2.6, uczciwe 2.2 i 2.5), plansza 2.4 „Mój klucz”, karty 2A (Detektyw), 2B (6 kart decyzji: cheat z wyłączeniem antywirusa, hasło dla przyjaciela, kod zapasowy, pośrednik, 2FA z rodzicem, kolega z ławki), 2C (scenka „Odmawiam pewnie”: 3 karty ról), 2D (4 pytania), 2E (karta do domu).
- **Lekcja 3 (zadanie 2), strony 26-37:** konspekt A (Warto wiedzieć [1][3][4][8], cele, cele ucznia, umowa, materiały), konspekt B (3+5+12+6+8+6+5 = 45 min; ramka ujawnienia z dodatkowym punktem o procedurze standardów ochrony małoletnich przy obcym dorosłym, spotkaniu, szantażu lub zdjęciach i „nie pytaj klasy, kto pisał z obcymi”; SPE: nikt nie gra osoby skrzywdzonej, bez odgrywania spotkań), klucz (przy szantażu: przerwij kontakt, nic nie usuwaj, powiedz dorosłemu, 116 111), plansze 3.1-3.3 (uczciwe 3.2 i 3.5), plansza 3.4 „Kogo poprosić o pomoc” (drabinka rodzic → inny zaufany dorosły → 116 111, osobno 112, „Masz prawo wyjść z gry, zablokować i zgłosić. Mówiąc dorosłemu, nie dostajesz kary.”), karty 3A, 3B, 3C (role: Nieznajomy z gry, Ty, Zaufany dorosły ze zdaniami z poradnika), 3D (5 pytań), 3E.
- **Spis treści:** 14 wpisów, numery stron zgodne z PDF (test S8); „Źródła” na str. 38.
- **Bezpieczeństwo treści:** scenki mają na górze zasadę „Osoba A czyta tylko zdania z karty”; plik z przeglądarki występuje tylko jako prośba i zasada „nie wysyłam plików, których nie rozumiem; pytam dorosłego”, bez nazwy formatu i bez instrukcji; prośba o zdjęcie bez kontekstu seksualnego; komunikat o spotkaniu: „Nie spotykam się z osobą znaną tylko z internetu. Od razu mówię dorosłemu.”; brak treści FDDS o kamerce lub „bezpiecznym spotkaniu”.

## Task Commits

Brak commitów: użytkownik chce mieć zmiany niezacommitowane (commit tylko na prośbę). HEAD przed i po: `4079da5`.

1. **Zadanie 1: lekcja 2** (niezacommitowane)
2. **Zadanie 2: lekcja 3 i kontrola całego pakietu** (niezacommitowane)

## Verification

| Sprawdzenie | Wynik |
|-------------|-------|
| Zadanie 1: `render-pdf.sh … && check_pakiet.py --lessons 2 --full` | `OK: 26 stron, 26 sekcji, lekcje: 2`, kod 0 |
| Zadanie 2: `render-pdf.sh … && check_pakiet.py --lessons 3 --full` | `OK: 38 stron, 38 sekcji, lekcje: 3`, kod 0 |
| Bramka zakazanych wzorców (F12/save as/devtools/network, `HAR` jako słowo, podstawa programowa), po obu zadaniach | kod 0 |
| `data-lesson="2" data-example="honest"` / `"scam"` | 6 / 12 |
| `data-lesson="3" data-example="honest"` / `"scam"` | 6 / 12 |
| `data-example="honest"` / `"scam"` (cały pakiet) | 18 / 36 (1/3) |
| `data-find=` | 14 |
| `class="rola` | 6 (3 po zadaniu 1) |
| `ramka-ujawnienie` | 3 |
| `Karta pracy 2C` / `dlscord-glosowanie[.]example` | 1 / 2 |
| Półpauzy i pauzy w warsztaty.html | 0 |
| render-pdf.sh i check_pakiet.py | niezmienione (mtime 04-01) |

Podgląd wizualny (PNG z PyMuPDF w katalogu tymczasowym, poza repo): okładka ze spisem (1), konspekty 14, 15, 27, klucze 16 i 28, PLANSZA 2.2 (18), 2.3 (19), 2.4 (20), 3.2 (30), 3.4 (32), karty 2A (21), 2C (23), 2D (24), 2E (25), 3A (33), 3C (35), 3D (36), 3E (37), Źródła (38). Plansze są poziome i kolorowe, karty czarno-białe, linie cięcia widoczne; nic nie jest ucięte w połówkach kart do domu.

## Files Created/Modified

- `projects/presentation/warsztaty/warsztaty.html`: nowe style (`.flag.ok`, `.pl-rule .r.long`, `.pl-help`, `.ladder`, `.help-side`, `.scenka-zasada`, `.rola` z `.rl-*`, `.ws--quiz.compact`), 24 nowe sekcje lekcji 2 i 3, 8 nowych wpisów spisu treści.
- `projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf`: ponowny render, 38 stron (ok. 5,7 MB).

## Decisions Made

Opisane w `key-decisions` powyżej.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Klucz lekcji 2 przelewał się na drugą stronę**
- **Found during:** zadanie 1 (S2: 27 stron PDF na 26 sekcji)
- **Fix:** szersza kolumna „dobra reakcja” (58 → 66 mm), krótsze reakcje do kart 2B i krótszy opis scenki (wzorcowe zdania odmowy są już na karcie 2C). Klucz lekcji 3 od razu w tym układzie.
- **Files modified:** projects/presentation/warsztaty/warsztaty.html

**2. [Rule 1 - Bug] Quiz 3D (5 pytań) przelewał się na drugą stronę**
- **Found during:** zadanie 2 (S2: 39 stron PDF na 38 sekcji)
- **Fix:** klasa `compact` na sekcji 3D z mniejszymi odstępami między pytaniami; quiz 1C i 2D bez zmian.
- **Files modified:** projects/presentation/warsztaty/warsztaty.html

**3. [Rule 2 - Missing critical] Kontekst makiet 3.2 i 3.4**
- **Issue:** plan podawał dla 3.4 kontekst „Konto cioci mogło zostać przejęte”, który zdradza odpowiedź w ćwiczeniu Detektyw; dla 3.2 brakowało informacji, że Olę znasz, więc nie dało się uzasadnić oceny „uczciwa”.
- **Fix:** 3.4: „Pisze ciocia Ania, ale zwykle dzwoni, a nie pisze.” (sygnał jak w 2.4); 3.2: „Ola chodzi do twojej szkoły, znasz ją z przerw.” Przejęte konto cioci opisuje klucz.
- **Files modified:** projects/presentation/warsztaty/warsztaty.html

**4. [Rule 1 - Bug] Plansza 3.4 miała za mały tekst do rzutnika**
- **Fix:** większe kafelki drabinki (21 pt / 14,5 pt), numer 112 w 34 pt. Plansza mieści się w 186 mm (S11 OK).

**Total deviations:** 4 auto-fixed (3 × Rule 1, 1 × Rule 2). **Impact:** bez zmiany zakresu ani kontraktu HTML.

## Issues Encountered

- Jak w 04-01: `Read` nie otwiera PDF, więc strony oglądałem jako PNG (PyMuPDF) w katalogu tymczasowym.
- W drzewie roboczym są niezależne zmiany użytkownika (slides/*, ROADMAP.md, STATE.md, .gsd/…); nie ruszałem ich.

## Known Stubs

- Brak. „Czerwone flagi: …” i puste linie na kartach 2A/2B/3A/3B to miejsca do pisania dla uczniów. Stub z 04-01 (tabela „Lekcje w skrócie” i okładka opisują lekcje 2 i 3, których nie było) jest rozwiązany.

## Human Check (do zrobienia przez użytkownika)

Przejrzeć `projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf` (38 stron), zwłaszcza lekcję 3 (strony 26-37): czy treści pasują do klas 4-8, czy scenki ćwiczą tylko odmowę i proszenie o pomoc, czy wydruk jest czytelny.

## Next Phase Readiness

- Plan 04-03 może odsyłać z poradnika do kompletnego pakietu (3 lekcje, 38 stron) i renderować poradnik przez `render-pdf.sh`.

## Self-Check: PASSED

- FOUND: projects/presentation/warsztaty/warsztaty.html (38 section.page)
- FOUND: projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf (38 stron, nowszy niż HTML: S1 OK)
- Commits: zgodnie z zasadą użytkownika nie ma commitów do sprawdzenia (HEAD nadal 4079da5)
