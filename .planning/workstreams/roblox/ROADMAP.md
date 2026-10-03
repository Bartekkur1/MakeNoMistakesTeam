# Roadmap: Cyberpomocnik — roblox

## Overview

Najpierw rozpoznanie ograniczeń publikacji i szkielet levelu, potem logika wyborów z pomocnikiem, na końcu wynik, nagroda i przekazanie wyniku. Cel na 8 h: grywalna misja.

## Phases

- [x] **Phase 1: Studio, publikacja i szkielet levelu** - ryzyko publikacji zbadane, mały level z NPC
- [ ] **Phase 2: Wybory, konsekwencje i pomocnik** - decyzje, wyjaśnienia, ponowna próba
- [ ] **Phase 3: Wynik, nagroda i przekazanie** - punkty, odznaka, eksport zgodny z kontraktem

## Phase Details

### Phase 1: Studio, publikacja i szkielet levelu
**Goal**: Wiadomo, czy gra da się udostępnić, i istnieje przechodzalny szkielet misji
**Depends on**: Nothing (first phase)
**Requirements**: RBX-01, MIS-01
**Success Criteria** (what must be TRUE):
  1. Ograniczenia publikacji zgłoszone zespołowi do 2 h; gotowy wariant pokazu w Studio
  2. Gracz przechodzi start → NPC → podejrzana oferta → decyzja → zakończenie
**Plans**: 2 plans in 2 waves

**Completion scope:** demo w Studio na komputerze. Potwierdzone sync, dialog, oba wybory, powtórka i wysłanie nagrania na Discordzie. Ograniczenia dowodów oraz odłożone testy opisano w `01-02-SUMMARY.md` i `01-PLAYTEST.md`.

**Wave 1**
- [x] 01-01-PLAN.md — publikacja, zachowanie Place1 i bezpieczne granice Rojo

**Wave 2 *(completed for desktop demo; mobile testing deferred by user)***
- [x] 01-02-PLAN.md — ścieżka misji i Play na komputerze potwierdzone przez Roberta; test mobilny odłożony

### Phase 2: Wybory, konsekwencje i pomocnik
**Goal**: Poprawna i błędna decyzja prowadzą do różnych skutków z wyjaśnieniem
**Depends on**: Phase 1, `shared/content/` (dialogi i wyjaśnienia)
**Requirements**: MIS-02, MIS-03, MIS-04
**Success Criteria** (what must be TRUE):
  1. Gracz może sprawdzić ofertę, fikcyjnie przekazać kod, odmówić lub poprosić o pomoc
  2. Pomocnik wyjaśnia prośbę o kod, presję czasu i obietnicę nagrody
  3. Po błędzie można spróbować ponownie; misję można odtworzyć od początku
  4. Żadne prawdziwe hasło ani kod nie jest zbierane
**Plans**: TBD

### Phase 3: Wynik, nagroda i przekazanie
**Goal**: Misja kończy się wynikiem z użyciem podpowiedzi, nagrodą i zapisem zgodnym z kontraktem
**Depends on**: Phase 2, `shared/MEASUREMENT.md`, `shared/CONTRACT.md`
**Requirements**: SCR-01, SCR-02, SCR-03
**Success Criteria** (what must be TRUE):
  1. Punkty liczone według wspólnych zasad, wynik zawiera hints_used
  2. Ukończenie daje jedną kosmetyczną nagrodę; zgłoszenia nie są punktowane
  3. Wynik można wyeksportować w formacie kontraktu; import ręczny jest oznaczony w demo
**Plans**: TBD

---
*Roadmap created: 2026-10-03*
