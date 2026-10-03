# Roadmap: Cyberpomocnik — widget

## Overview

Od szkieletu rozszerzenia z awatarem, przez ścieżkę sprawdzania opartą na regułach, po przekazanie opiekunowi z obsługą błędów i wersję mobilną. Zależy od kontraktu i backendu z `web-app` oraz treści z `shared/content/`.

## Phases

- [ ] **Phase 1: Rozszerzenie i przekazanie treści** - awatar, zaznaczenie lub wklejenie wiadomości
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
**Plans**: TBD
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
**UI hint**: yes

### Phase 3: Przekazanie opiekunowi i błędy
**Goal**: Dziecko świadomie wysyła sprawę i widzi odpowiedź; awarie nie udają sukcesu
**Depends on**: Phase 2, `web-app` Phase 1 (API spraw)
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
