# Roadmap: Cyberpomocnik — widget

## Overview

Od szkieletu rozszerzenia z awatarem, przez ścieżkę sprawdzania opartą na regułach, po przekazanie opiekunowi z obsługą błędów i wersję mobilną. Zależy od kontraktu i backendu z `api-ui` oraz treści z `shared/content/`.

## Phases

- [x] **Phase 1: Rozszerzenie i przekazanie treści** - awatar, zaznaczenie lub wklejenie wiadomości (completed 2026-10-03)
- [ ] **Phase 2: Ścieżka sprawdzania** - pytania, sygnały, proponowany krok
- [ ] **Phase 3: Przekazanie opiekunowi i błędy** - podgląd, wysyłka, odpowiedź, obsługa awarii
- [ ] **Phase 4: Wersja mobilna** - ta sama ścieżka jako strona w przeglądarce telefonu

## Phase Details

### Phase 1: Rozszerzenie i przekazanie treści

**Goal**: Rozszerzenie z awatarem przyjmuje treść do sprawdzenia
**Depends on**: Nothing (first phase); wspólny styl awatara z kickoffu
**Requirements**: WID-01, WID-02
**Success Criteria** (what must be TRUE):
  1. Rozszerzenie uruchamia awatara na komputerze
  2. Zaznaczona treść lub wklejona wiadomość/link trafia do pomocnika
  3. Rozszerzenie czyta stronę wyłącznie na działanie użytkownika

**Plans**: 6/6 plans complete; G-01-2-drag visually accepted; UAT 5/5 passed

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Bramka pakietów npm, tracer zaznacz → kliknij rekina → podgląd → zatwierdź → sprawa w service workerze, blokujący test klawiatury na Discordzie

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Strażnik D-04 (test szpiegujący + skan źródeł, Vitest z CSS), zaznaczenie w polach i kompozytorze w prawdziwym Chromium, limit przechwytywania klawiatury, jedno zatwierdzenie = jedna sprawa

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Awatar zawsze pod ręką: przeciąganie, chowanie, przywracanie ikoną (z odzyskiem po przeładowaniu rozszerzenia), menu bez zaznaczenia, wklejanie z buforem, „Jak to działa”, okno na ekranie

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-04-PLAN.md — Szkic na karcie (D-12, D-17, prawdziwy bfcache), link z zaznaczenia, przypadki brzegowe treści, uczciwa awaria i spóźnione odpowiedzi, README z listą kontrolną demo w Google Chrome

**Wave 5 — UAT gap closure**
- [x] 01-05-PLAN.md — G-01-2: chowanie rekina w formularzu widgetu i powrót po zamknięciu

**Wave 6 — revised UAT gap closure**
- [x] 01-06-PLAN.md — G-01-2-drag: otwarty panel podąża za widocznym rekinem

**UI hint**: yes

### Phase 2: Ścieżka sprawdzania

**Goal**: Pomocnik prowadzi przez pytania i wskazuje sygnały zgodnie z regułami osoby 4
**Depends on**: Phase 1, `shared/content/` (pytania, sygnały, wyjaśnienia)
**Requirements**: CHK-01, CHK-02, CHK-03
**Success Criteria** (what must be TRUE):
  1. Pomocnik zadaje pytania o nadawcę, żądanie, presję czasu i oficjalny kanał
  2. Wynik pokazuje sygnały, brakujące informacje i krok, bez obietnicy bezpieczeństwa
  3. Uczciwa fikcyjna wiadomość nie dostaje fałszywego alarmu; przy braku pewności pomocnik to mówi

**Plans**: TBD
- [x] 02-01-PLAN.md
- [x] 02-02-PLAN.md
- [x] 02-03-PLAN.md

**UI hint**: yes

### Phase 3: Przekazanie opiekunowi i błędy

**Goal**: Dziecko świadomie wysyła sprawę i widzi odpowiedź; awarie nie udają sukcesu
**Depends on**: Phase 2, `api-ui` Phase 1 (API spraw)
**Requirements**: HND-01, HND-02, HND-03, ERR-01
**Success Criteria** (what must be TRUE):
  1. Przed wysłaniem dziecko widzi dokładnie, co udostępnia, i potwierdza
  2. „Pokaż opiekunowi” i instrukcja zgłoszenia na platformie to dwie osobne czynności
  3. Odpowiedź opiekuna jest widoczna u dziecka
  4. Pusta treść, brak backendu i nieudany zapis pokazują czytelny komunikat bez fałszywego potwierdzenia

**Plans**: TBD
**UI hint**: yes

### Phase 4: Wersja mobilna

**Goal**: Ta sama ścieżka działa na telefonie jako strona do wklejenia treści
**Depends on**: Phase 3
**Requirements**: MOB-01
**Success Criteria** (what must be TRUE):
  1. W przeglądarce telefonu można wkleić tekst/link i przejść całą ścieżkę do wysłania sprawy
  2. Interfejs nie przedstawia się jako natywny widget ani czytnik innych aplikacji

**Plans**: TBD
**UI hint**: yes

---
*Roadmap created: 2026-10-03*
