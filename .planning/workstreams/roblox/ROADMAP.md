# Roadmap: Cyberpomocnik — roblox

## Overview

Najpierw rozpoznanie ograniczeń publikacji i szkielet levelu, potem logika wyborów z pomocnikiem, na końcu wynik, nagroda i przekazanie wyniku. Cel na 8 h: grywalna misja.

## Phases

- [x] **Phase 1: Studio, publikacja i szkielet levelu** - ryzyko publikacji zbadane, mały level z NPC
- [x] **Phase 2: Wybory, konsekwencje i pomocnik** - decyzje, wyjaśnienia, spójny Scamerino 3D, ruch NPC i ponowna próba
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

**Goal**: Decyzje prowadzą do różnych skutków z wyjaśnieniem; scammer podchodzi do gracza, a spójny Scamerino 3D przychodzi po wybraniu pomocy
**Depends on**: Phase 1, `shared/content/` (dialogi i wyjaśnienia)
**Requirements**: MIS-02, MIS-03, MIS-04, MIS-05, MIS-06, MIS-07
**Success Criteria** (what must be TRUE):
  1. Gracz może sprawdzić ofertę, fikcyjnie przekazać kod, odmówić lub poprosić o pomoc
  2. Pomocnik wyjaśnia prośbę o kod, presję czasu i obietnicę nagrody
  3. Po błędzie można spróbować ponownie; misję można odtworzyć od początku
  4. Żadne prawdziwe hasło ani kod nie jest zbierane
  5. Scamerino ma spójny tors, głowę i kończyny; poprawiony model nie rozpada się ani nie deformuje podczas chodzenia
  6. Scammer chodzi po mapie i podchodzi do gracza, zatrzymując się przed nim i respektując przeszkody
  7. Wybranie pomocy w dialogu powoduje podejście Scamerino i uruchomienie jego wskazówek; restart przywraca NPC do stanu początkowego

**Plans**: TBD
**Wave 1**
- [x] 02-01-PLAN.md — audyt, eksport i rigowanie modelu Scamerino R15 z syreną

**Wave 2**
- [x] 02-02-PLAN.md — ruch scammera, podejście z omijaniem przeszkód, symulowany czat i arbitraż

**Wave 3**
- [x] 02-03-PLAN.md — 4 ścieżki decyzyjne, Scamerino quiz, selektywny alarm i atomowy restart

**Zarys kolejności prac:** poprawa i przygotowanie modelu Scamerino do chodzenia → ruch scammera → cztery ścieżki dialogu i wezwanie Scamerino → sprawdzenie całości w Play na komputerze. Ustalenia użytkownika i kryteria odbioru: `phases/02-wybory-konsekwencje-i-pomocnik/02-SCOPE.md`.

### Phase 3: Wynik, nagroda i przekazanie

**Goal**: Misja kończy się wizualną nagrodą 3D za zdany test oraz bezpiecznym przekazaniem zgłoszenia do panelu opiekuna
**Depends on**: Phase 2, `shared/MEASUREMENT.md`, `shared/CONTRACT.md`
**Requirements**: SCR-01, SCR-02, SCR-03
**Success Criteria** (what must be TRUE):
  1. Wynik misji to status zdanego testu (bezpieczna odmowa) lub symulowanego błędu bez punktacji numerycznej
  2. Zdany test przyznaje wizualną kosmetyczną nagrodę 3D: Złotą Tarczę Scamerino (Accessory 3D) ze złotymi cząsteczkami
  3. Zgłoszenie trafia do skrzynki panelu opiekuna w formacie 1:1 zgodnym z panelem rodzica (source: game, attack_type, taken_actions, content)

**Plans**: 2 plans in 2 waves

**Wave 1**
- [ ] 03-01-PLAN.md — wizualna nagroda 3D Accessory za zdany test (SCR-02), format zgłoszenia panelu i ekran podsumowania

**Wave 2** *(blocked on Wave 1 completion)*
- [ ] 03-02-PLAN.md — bezpieczny moduł serwerowy wysyłki do skrzynki panelu (SCR-03), obsługa doręczenia, fallback offline i raport testowy

---
*Roadmap created: 2026-10-03*
