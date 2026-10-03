# Roadmap: Cyberpomocnik — presentation

## Overview

Najpierw treści i zasady pomiaru dla pozostałych torów (to blokuje je w 2–3 h), potem weryfikacja integracyjna, na końcu prezentacja, demo i nagranie. Ten workstream jest producentem artefaktów w `.planning/shared/`.

## Phases

- [ ] **Phase 1: Treści i zasady pomiaru** - pakiet treści, zestawy A/B, klucz oceny, definicje, nagrody
- [ ] **Phase 2: Weryfikacja i test integracyjny** - zrozumiałość, pełna historia demo, lista błędów
- [ ] **Phase 3: Prezentacja, demo i zgłoszenie** - slajdy, scenariusz, nagranie, wymagania Defence

## Phase Details

### Phase 1: Treści i zasady pomiaru
**Goal**: Pozostałe workstreamy mają treści i jednoznaczne zasady oceny w `shared/`
**Depends on**: Nothing (first phase)
**Requirements**: CNT-01, CNT-02, CNT-03, CNT-04
**Success Criteria** (what must be TRUE):
  1. Pakiet treści jest w `shared/content/` do 2 h, zestawy A/B do 3 h
  2. Zestawy A/B mają podobną trudność, różne treści i nie kopiują scenariusza treningowego
  3. Wynik przykładowej odpowiedzi da się ręcznie przeliczyć według klucza
  4. Zasady nagród wykluczają ranking, punkty za zgłoszenia i kary za proszenie o pomoc
**Plans**: TBD

### Phase 2: Weryfikacja i test integracyjny
**Goal**: Cała historia demo przechodzi, a błędy są spisane
**Depends on**: Phase 1, grywalna misja (`roblox`), widget i panel (`widget`, `api-ui`)
**Requirements**: VER-01, VER-02
**Success Criteria** (what must be TRUE):
  1. Pełna historia demo przechodzi od dziecka do opiekuna i z powrotem
  2. Sprawdzone są uczciwa wiadomość i brak pewności pomocnika
  3. Lista błędów trafia do właściwych workstreamów
  4. Testy z dorosłymi opisane jako test obsługi
**Plans**: TBD

### Phase 3: Prezentacja, demo i zgłoszenie
**Goal**: Gotowe zgłoszenie z uczciwym opisem granic walidacji
**Depends on**: Phase 2
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04
**Success Criteria** (what must be TRUE):
  1. Prezentacja ma najwyżej 10 slajdów z wymaganymi sekcjami
  2. Wymagania zgłoszenia Defence sprawdzone, użyte zasoby i AI ujawnione
  3. Istnieją scenariusz demo i zapasowe nagranie z linkami
  4. Wyniki syntetyczne są wyraźnie oznaczone
**Plans**: TBD

---
*Roadmap created: 2026-10-03*
