---
phase: 04-pakiet-warsztatowy-dla-nauczyciela
verified: 2026-10-04T09:00:00Z
status: human_needed
score: 14/14 must-haves verified
covered_files:
  - ".planning/workstreams/presentation/REQUIREMENTS.md"
  - ".planning/workstreams/presentation/ROADMAP.md"
  - ".planning/workstreams/presentation/phases/04-pakiet-warsztatowy-dla-nauczyciela/04-01-PLAN.md"
  - ".planning/workstreams/presentation/phases/04-pakiet-warsztatowy-dla-nauczyciela/04-01-SUMMARY.md"
  - ".planning/workstreams/presentation/phases/04-pakiet-warsztatowy-dla-nauczyciela/04-02-PLAN.md"
  - ".planning/workstreams/presentation/phases/04-pakiet-warsztatowy-dla-nauczyciela/04-02-SUMMARY.md"
  - ".planning/workstreams/presentation/phases/04-pakiet-warsztatowy-dla-nauczyciela/04-03-PLAN.md"
  - ".planning/workstreams/presentation/phases/04-pakiet-warsztatowy-dla-nauczyciela/04-03-SUMMARY.md"
  - "projects/presentation/poradnik/poradnik-bezpieczna-aura.pdf"
  - "projects/presentation/poradnik/poradnik.html"
  - "projects/presentation/render-pdf.sh"
  - "projects/presentation/warsztaty/check_pakiet.py"
  - "projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf"
  - "projects/presentation/warsztaty/warsztaty.html"
  - "slides/scamerino-pitch.pdf"
  - "slides/slides.md"
covered_digest: "v2:sha256:ac308b697be278cad72679a4925275c15695b25e2deed35ad0621eb50591b6c5"
behavior_unverified: 0
overrides_applied: 0
human_verification:
  - test: "Przejrzyj treść trzech lekcji (str. 3-37 pakietu) pod kątem wieku: słownictwo, długość zdań i przykłady (Robuxy, skiny, BLIK, PESEL, legitymacja) dla klas 4-8, zwłaszcza dla 10-latków z klasy 4."
    expected: "Język i scenariusze są zrozumiałe dla klasy 4 i nie są infantylne dla klasy 8; żaden przykład nie straszy ani nie wymaga wiedzy spoza wieku."
    why_human: "Ocena dydaktyczna i wiekowa; skrypt sprawdza strukturę, nie odbiór przez dzieci."
  - test: "Wydrukuj na zwykłej drukarce czarno-białej karty pracy (np. str. 10-13, 21-25, 33-37) i jedną planszę wyświetl na rzutniku szkolnym (np. str. 6, 9, 32)."
    expected: "Karty są czytelne w czerni i bieli (makiety, pola wyboru, linie cięcia widoczne), plansze czytelne z końca sali."
    why_human: "Czytelność wydruku i projekcji zależy od sprzętu; render PNG pokazuje tylko ekran."
  - test: "Przeczytaj karty scenek 2C (str. 23) i 3C (str. 35) oraz opis scenek w konspektach B lekcji 2 i 3."
    expected: "Ton scenek jest bezpieczny: osoba A czyta tylko gotowe zdania, nikt nie ćwiczy oszukiwania, odmowa i prośba o pomoc są na pierwszym planie; scenka z obcym dorosłym (lekcja 3) nie jest dla dzieci zbyt dosłowna ani niepokojąca."
    why_human: "Ocena tonu i bezpieczeństwa emocjonalnego ćwiczeń dramowych."
  - test: "Sprawdź liczby w ramkach „Warto wiedzieć” (np. ok. 150 mln graczy dziennie Roblox, ponad połowa poniżej 16 lat) względem 11 źródeł na str. 38."
    expected: "Każda liczba w pakiecie ma pokrycie w źródle, do którego odsyła numer w nawiasie."
    why_human: "Zgodność faktów ze źródłami zewnętrznymi; nie da się jej sprawdzić grepem."
---

# Phase 4: Pakiet warsztatowy dla nauczyciela Verification Report

**Phase Goal:** Nauczyciel ma gotowe materiały do przeprowadzenia lekcji o bezpiecznym poruszaniu się w sieci, bez potrzeby używania produktu.
**Verified:** 2026-10-04
**Status:** human_needed
**Re-verification:** No, initial verification

## Goal Achievement

Wszystkie kryteria strukturalne sprawdzone na samych plikach (HTML, PDF), a nie na podstawie SUMMARY. Do decyzji człowieka zostaje ocena treści: wiek, czytelność wydruku, ton scenek, zgodność liczb ze źródłami.

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | SC1: osobny PDF z 3 konspektami lekcji po 45 min, kartami pracy, planszami na rzutnik i kluczami odpowiedzi | ✓ VERIFIED | `warsztaty-bezpieczna-aura.pdf`: 38 stron = 38 `section.page`; `check_pakiet.py --lessons 3 --full` → `OK: 38 stron, 38 sekcji, lekcje: 3` (exit 0). Na każdą lekcję: konspekt A+B (str. 3-4, 14-15, 26-27), klucz (5, 16, 28), 4 plansze poziome 842x595 (6-9, 17-20, 29-32), karty pracy (10-13, 21-25, 33-37). Sumy minut w `td.min` policzone niezależnie: 45 / 45 / 45 |
| 2 | SC2: każdą lekcję da się przeprowadzić bez komputerów i bez BezpiecznejAury | ✓ VERIFIED | „Bez komputerów i telefonów dla uczniów” w każdym z 3 konspektów (3 wystąpienia w PDF); na stronach konspektów (3, 4, 14, 15, 26, 27) 0 wystąpień „BezpiecznaAura”; nazwa występuje tylko na str. 2 („Pakiet działa samodzielnie i nie wymaga aplikacji BezpiecznaAura ani gry”), na kartach do domu (odsyłacz do poradnika) i w Źródłach. Materiały to wydruki, rzutnik albo tablica |
| 3 | SC3: wszystkie przykłady są fikcyjne, a około 1/3 to uczciwe wiadomości | ✓ VERIFIED | Niezależne liczenie `data-example`: lekcja 1, 2 i 3 po 6 honest / 12 scam (0,33). 10 `span.dom`, wszystkie z `[.]example`; 0 elementów `<a>`, 0 `http` w treści HTML, 0 adnotacji linków w PDF; brak `img` w makietach (S4); etykieta „przykład fikcyjny · ćwiczenie” na każdej makiecie (S6, widoczna na renderze str. 7). Jedyne numery w PDF to 116 111, 800 100 100 i zmyślony kod logowania 482 913 |
| 4 | SC4: slajd o szkole wspomina pakiet (D-18) | ✓ VERIFIED | `slides/slides.md:289` `<li><b class="gold">pakiet warsztatowy dla nauczyciela</b>: 3 lekcje po 45 min bez komputerów</li>`; `scamerino-pitch.pdf` ma 10 stron, wzmianka na str. 9 („Szkoła musi to zrobić. My dajemy narzędzie”, karta „Co dostaje szkoła”); render PNG: bez przepełnienia. Zob. ocenę odchylenia niżej |
| 5 | D-01/D-02/D-03: osobny plik z HTML obok, paleta i maskotka, A4, render Edge, Nunito osadzony; okładka ze spisem treści zgodnym ze stronami | ✓ VERIFIED | `render-pdf.sh` używa `--headless=new` i `--print-to-pdf`; Nunito w `/FontDescriptor` strony 1 (`AAAAAA+Nunito-ExtraLight-Bold` itd.); maskotka `Scamerino_Alertinio.png` na okładce (render str. 1); spis 14 pozycji, S8 potwierdza każdy numer strony |
| 6 | D-04/D-08: lekcja 1 = 11 stron, lekcje 2 i 3 = po 12 stron w tym samym układzie, każda karta na osobnej stronie, nic się nie przelewa | ✓ VERIFIED | Liczba stron PDF = liczba sekcji (S2), skala 0,75 na każdej stronie (S11), lista stron jak w wierszu 1 |
| 7 | D-06: tematy lekcji (1: Robuxy, fałszywy admin, SMS, e-mail; 2: kody i hasła, przejęte konto, wymiany, pliki z przeglądarki; 3: inny komunikator, sekrety, prezenty, pieniądze i BLIK, kogo prosić o pomoc) | ✓ VERIFIED | W HTML: Robux 8, admin 8, przejęt 6, wymian 20, przeglądark 9, komunikator 33, sekret 34, prezent 7, BLIK 10; tytuły „Lekcja 1/2/3:” w PDF; plansza 3.4 „Kogo poprosić o pomoc” |
| 8 | D-07: jeden poziom, klasy 4-8 (okładka i „Jak korzystać”) | ✓ VERIFIED | „klasy 4-8” 5 razy w PDF, w tym okładka (render) i str. 2 (S10, F1) |
| 9 | D-09: karty do domu 1D, 2E, 3E (po 2 połówki) odsyłają do poradnika i „umowa rodzinna”, podają 116 111 i 800 100 100 | ✓ VERIFIED | L8 dla 3 lekcji; „umowa rodzinna” 6x, „116 111” 10x, „800 100 100” 6x w PDF. Poradnik: umowa rodzinna faktycznie na str. 17, „Rozdział dla nauczyciela” na str. 16 (sprawdzone w PDF poradnika, 19 stron) |
| 10 | D-10/D-14: Detektyw, karty „Co zrobisz?”, scenki w lekcjach 2 i 3; scenki ćwiczą odmowę, osoba A czyta tylko zdania z karty; brak instrukcji oszustwa i ścieżek narzędzi przeglądarki | ✓ VERIFIED | L1/L3 OK; render str. 23 (2C): „Osoba A czyta tylko zdania z karty. Nie wymyślamy nowych sztuczek, ćwiczymy odmowę.”; grep F12 / save as / devtools / HAR = 0 |
| 11 | D-12: quizy bez ocen (1C: 4, 2D: 4, 3D: 5 pytań), odpowiedzi w kluczach | ✓ VERIFIED | Niezależne liczenie `.q`: 4 / 4 / 5, „bez ocen” na każdej stronie quizu |
| 12 | D-13: ramka ujawnienia w każdym konspekcie z „porozmawiaj ze mną po lekcji” i odsyłaczem do „Rozdział dla nauczyciela”; w lekcji 3 natychmiastowa procedura standardów ochrony małoletnich | ✓ VERIFIED | Tekst ramek wyciągnięty z HTML dla L1-L3; L3: „Gdy uczeń mówi o obcym dorosłym, spotkaniu, szantażu lub zdjęciach: po lekcji od razu uruchom procedurę ze szkolnych standardów ochrony małoletnich” |
| 13 | D-16/D-17: brak odwołań do podstawy programowej; „Źródła” z 11 pozycjami i datą dostępu 3.10.2026 | ✓ VERIFIED | grep `podstaw\w* programow` = 0; render str. 38: 11 pozycji, „Data dostępu do wszystkich źródeł internetowych: 3.10.2026.”, nota licencyjna CC BY-NC 4.0 / CC BY-NC-ND 3.0 PL |
| 14 | 04-03: WRK-01 zapisane w REQUIREMENTS.md z traceability; poradnik ma odsyłacz do pakietu i nadal 19 stron | ✓ VERIFIED | `REQUIREMENTS.md:30` definicja, `:57` wiersz `WRK-01 | Phase 4 | Pending`, pokrycie 11/11; `poradnik.html:888` odsyłacz w `<code>` (bez linku), PDF poradnika 19 stron, wzmianka na str. 16 |

**Score:** 14/14 truths verified (0 present, behavior-unverified)

**Odchylenie D-18 (ocena):** Plan 04-03 kotwiczył wzmiankę na slajdzie „Pilotaż w jednej szkole” na str. 10. Tego slajdu już nie ma, bo użytkownik przebudował talię. Sama decyzja D-18 w 04-CONTEXT.md mówi „do slajdu o szkole” i wymienia dwóch kandydatów, więc konkretny slajd nie był wiążący. Kryterium SC4 brzmi „Slajd o szkole wspomina pakiet”. Obecny slajd o szkole (str. 9) wspomina pakiet na liście „Co dostaje szkoła”, obok „gotowa lekcja” i „poradnik PDF”. To miejsce pasuje do treści nawet lepiej niż slajd o pilotażu. Talia nadal ma 10 slajdów. Intencja jest spełniona, nadpisanie (override) nie jest potrzebne. Uwaga: użytkownik równolegle edytuje `slides/`, więc wzmiankę warto sprawdzić jeszcze raz po zakończeniu jego zmian. Przy zmianie `slides.md` lub PDF `covered_digest` się zdezaktualizuje.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `projects/presentation/render-pdf.sh` | Render HTML → PDF A4 przez Edge headless | ✓ VERIFIED | zawiera `--headless=new`, `--print-to-pdf`; używany dla pakietu i poradnika |
| `projects/presentation/warsztaty/check_pakiet.py` | Kontrola S1-S11, L1-L9, F1-F3 | ✓ VERIFIED | 18 KB, prawdziwe testy (m.in. L4: udział honest 0,25-0,42, S9 Nunito); exit 0 na obecnym PDF |
| `projects/presentation/warsztaty/warsztaty.html` | Źródło z 3 lekcjami | ✓ VERIFIED | 122 KB, 38 sekcji, zawiera `data-lesson="3" data-example="honest"` |
| `projects/presentation/warsztaty/warsztaty-bezpieczna-aura.pdf` | 38 stron A4 | ✓ VERIFIED | 38 stron, 12 poziomych plansz, nie starszy niż HTML (S1) |
| `projects/presentation/poradnik/poradnik.html` + PDF | odsyłacz do pakietu, 19 stron | ✓ VERIFIED | l. 888; PDF 19 stron |
| `slides/slides.md` + `slides/scamerino-pitch.pdf` | wzmianka na slajdzie o szkole, 10 slajdów | ✓ VERIFIED | l. 289; PDF 10 stron, wzmianka str. 9 |
| `.planning/workstreams/presentation/REQUIREMENTS.md` | WRK-01 + traceability | ✓ VERIFIED | l. 30, 57 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| warsztaty.html | assets/Scamerino_Alertinio.png | img na okładce | ✓ WIRED | 4 wystąpienia, maskotka widoczna na renderze str. 1; S4 sprawdza istnienie src |
| render-pdf.sh | warsztaty-bezpieczna-aura.pdf | Edge headless | ✓ WIRED | PDF z osadzonym Nunito, mtime = HTML |
| check_pakiet.py | warsztaty-bezpieczna-aura.pdf | pypdf PdfReader | ✓ WIRED | uruchomione: OK |
| ul.toc li[data-find] | strony PDF | S8 | ✓ WIRED | 14 pozycji spisu zgodnych ze stronami |
| karty 1D/2E/3E | poradnik (str. 16, 17) | odsyłacz tekstowy | ✓ WIRED | numery stron zgodne z faktycznym PDF poradnika |
| poradnik.html | warsztaty-bezpieczna-aura.pdf | nazwa pliku w `<code>` | ✓ WIRED | l. 888, str. 16 PDF poradnika |
| slides.md | scamerino-pitch.pdf | slidev export | ✓ WIRED | wzmianka obecna w tekście PDF, str. 9 |

### Data-Flow Trace (Level 4)

Nie dotyczy: statyczne materiały drukowane, bez dynamicznych danych.

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Pełna kontrola pakietu | `python projects/presentation/warsztaty/check_pakiet.py --lessons 3 --full` | `OK: 38 stron, 38 sekcji, lekcje: 3`, exit 0 | ✓ PASS |
| Proporcja uczciwych, minuty, quizy (niezależny skrypt, regex na HTML) | skrypt w scratchpadzie | 6/18 na lekcję; 45/45/45 min; quizy 4/4/5 | ✓ PASS |
| Brak klikalnych linków | PyMuPDF `get_links()` na 38 stronach | 0 | ✓ PASS |
| Orientacja plansz | PyMuPDF `rect` | poziome dokładnie str. 6-9, 17-20, 29-32 | ✓ PASS |
| Zakazane wzorce (D-14, D-16, pauzy) | regex na HTML | 0 trafień | ✓ PASS |
| Wzmianka na slajdzie / odsyłacz w poradniku | PyMuPDF tekst PDF | slajd str. 9; poradnik str. 16 | ✓ PASS |
| Render wizualny | PNG str. 1, 4, 7, 11, 23, 38 pakietu, slajd 9 | układ poprawny, bez przepełnień, karty czarno-białe | ✓ PASS |

### Probe Execution

Nie dotyczy: faza nie deklaruje skryptów `probe-*.sh`. Rolę sondy pełni `check_pakiet.py`, uruchomiony powyżej.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| WRK-01 | 04-01, 04-02, 04-03 | Pakiet warsztatowy: osobny PDF A4, 3 konspekty po 45 min dla klas 4-8, karty pracy, plansze, klucze; bez komputerów i BezpiecznejAury; przykłady fikcyjne, ok. 1/3 uczciwych; slajd o szkole wspomina pakiet | ✓ SATISFIED | prawdy 1-4 i 14. W REQUIREMENTS.md WRK-01 ma nadal `[ ]` i status „Pending”; orkiestrator zaktualizuje to po weryfikacji |

Nie ma osieroconych wymagań: fazie 4 przypisano tylko WRK-01 i deklarują je wszystkie 3 plany.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| (wszystkie zmienione pliki) | - | TBD/FIXME/XXX/TODO | - | brak trafień |
| warsztaty-bezpieczna-aura.pdf | str. 38 | prawdziwe domeny źródeł jako zwykły tekst (nask.pl, cert.orange.pl, gov.pl…) | ℹ️ Info | zgodne z D-17; PDF nie ma adnotacji linków, ale niektóre przeglądarki PDF same zamieniają taki tekst na linki. Strona jest dla nauczyciela, nie na rzutnik |
| warsztaty.html | Źródła, poz. 11 | ścieżki repozytorium `ideas/defence/research.md`, `projects/presentation/poradnik` | ℹ️ Info | nauczyciel nie ma dostępu do repo; kosmetyka, nie blokuje celu |

### Human Verification Required

### 1. Dopasowanie do wieku (klasy 4-8)
**Test:** Przejrzyj treść trzech lekcji (str. 3-37) pod kątem słownictwa i przykładów dla 10-14-latków.
**Expected:** Zrozumiałe dla klasy 4, nie infantylne dla klasy 8, bez straszenia.
**Why human:** Ocena dydaktyczna.

### 2. Czytelność wydruku i projekcji
**Test:** Wydrukuj karty pracy czarno-biało, wyświetl plansze na rzutniku szkolnym.
**Expected:** Czytelne makiety, pola, linie cięcia; plansze widoczne z końca sali.
**Why human:** Zależy od sprzętu.

### 3. Ton scenek (2C, 3C)
**Test:** Przeczytaj karty scenek i ich omówienie w konspektach.
**Expected:** Ćwiczą odmowę i proszenie o pomoc, scenka z obcym dorosłym nie jest niepokojąca.
**Why human:** Bezpieczeństwo emocjonalne ćwiczeń dramowych.

### 4. Liczby a źródła
**Test:** Porównaj liczby w ramkach „Warto wiedzieć” z 11 źródłami.
**Expected:** Każda liczba ma pokrycie w źródle.
**Why human:** Fakty zewnętrzne.

### Gaps Summary

Nie ma luk blokujących. Cel fazy jest osiągnięty w kodzie i w PDF. Pakiet 38 stron A4 zawiera 3 kompletne lekcje po 45 minut, każda z konspektem, kluczem, 4 planszami i kartami pracy. Lekcje nie wymagają komputerów ani produktu. Przykłady są fikcyjne, bez linków, 1/3 z nich to uczciwe wiadomości. Pakiet jest powiązany z poradnikiem i z talią. Odchylenie D-18 (inny slajd niż w planie) spełnia intencję decyzji i kryterium SC4. Status `human_needed` wynika wyłącznie z ocen treści, których nie da się zautomatyzować.

---

_Verified: 2026-10-04_
_Verifier: Claude (gsd-verifier)_
