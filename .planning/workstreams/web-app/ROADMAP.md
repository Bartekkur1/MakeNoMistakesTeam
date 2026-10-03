# Roadmap: Cyberpomocnik — web-app

## Overview

Od kontraktu i backendu, przez panel opiekuna na danych przykładowych, po test przed–po z wynikami i spięcie z prawdziwymi zapisami. Kamienie milowe zespołu: 2–3 h kontrakt, 8 h panel na wspólnych danych, 12 h pętla dziecko–opiekun, 17 h test i wyniki.

## Phases

- [ ] **Phase 1: Kontrakt i backend spraw** - API spraw i odpowiedzi z trwałym zapisem, dane przykładowe
- [ ] **Phase 2: Panel opiekuna** - lista, szczegóły, odpowiedź i status na danych przykładowych
- [ ] **Phase 3: Test przed–po i wyniki** - ekran testu, wyliczanie wyniku po stronie backendu, panel klasy
- [ ] **Phase 4: Integracja na prawdziwych zapisach** - panel i testy na backendzie, błędy i pełna pętla

## Phase Details

### Phase 1: Kontrakt i backend spraw

**Goal**: Działające API zgłoszeń z obiegiem rodzic → nauczyciel, historią, komentarzami i logowaniem demo, z trwałym zapisem oraz przykładowymi danymi zgodnymi z `shared/CONTRACT.md`
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-06
**Success Criteria** (what must be TRUE):
  1. Sprawę można utworzyć, wylistować i pobrać, a po restarcie i odświeżeniu nadal istnieje
  2. Rodzic zatwierdza/odrzuca, nauczyciel eskaluje i zamyka; każda zmiana stanu i komentarz zapisują się w historii i są odczytywalne
  3. Rodzic i nauczyciel logują się demo (e-mail + kod `0000`) i widzą tylko zgłoszenia, do których mają dostęp
  4. Kontrakt jest zatwierdzony przez osobę 2, a przykładowe JSON-y są w `shared/`

**Plans**: 4/6 plans executed

Plans:
**Wave 1**
- [x] 01-01-PLAN.md — Kontrakt v2: types.ts, demo-accounts.ts, CONTRACT.md, 13 przykładów JSON (w tym demo-dataset.json) + checker jako model referencyjny (wave 1)

**Wave 2** *(blocked on Wave 1 completion)*
- [x] 01-02-PLAN.md — Bramki ludzkie: zatwierdzenie kontraktu przez osobę 2, legitymacja pakietów npm; zapis zatwierdzenia, notatki w STATE, COVERAGE.md v2 (wave 2)

**Wave 3** *(blocked on Wave 2 completion)*
- [x] 01-03-PLAN.md — Fundament backendu: tracer /api/health (supabase-js, vitest, helpery HTTP/CORS) + logowanie demo e-mail + 0000, tokeny Bearer (API-06) (wave 3)

**Wave 4** *(blocked on Wave 3 completion)*
- [x] 01-04-PLAN.md — Zgłoszenia: tworzenie, szczegóły z historią, lista z widocznością i paginacją kursorem; migracja reports + test lustra schematu (API-01) (wave 4)

**Wave 5** *(blocked on Wave 4 completion)*
- [ ] 01-05-PLAN.md — Obieg: przejścia z historią (approve/reject/escalate/close/reopen), komentarze rodzic–nauczyciel, seed.sql z datasetu, zgodność z przykładami (API-02) (wave 5)

**Wave 6** *(blocked on Wave 5 completion)*
- [ ] 01-06-PLAN.md — Start na $PORT + smoke test; [BLOCKING] schema push, seed, weryfikacja na żywo i wdrożenie Heroku (człowiek); URL w CONTRACT.md (wave 6)

### Phase 2: Panel opiekuna

**Goal**: Opiekun obsługuje sprawy fikcyjnego dziecka w panelu
**Depends on**: Phase 1
**Requirements**: PAN-01, PAN-02, PAN-03, PAN-04
**Success Criteria** (what must be TRUE):
  1. Lista pokazuje nowe i zakończone sprawy z datą, źródłem i opisem
  2. Szczegóły pokazują treść, sygnały, działanie dziecka i odpowiedź o kliknięciu/danych/płatności
  3. Odpowiedź i zmiana statusu są widoczne po stronie dziecka
  4. Przełączanie ról jest oznaczone jako demonstracyjne

**Plans**: TBD
**UI hint**: yes

### Phase 3: Test przed–po i wyniki

**Goal**: Test bez pomocnika zapisuje odpowiedzi, a wyniki liczy backend według klucza
**Depends on**: Phase 1, `shared/content/` (zestawy A/B i klucz oceny od osoby 4)
**Requirements**: API-03, API-04, API-05, TST-01, TST-02, TST-03
**Success Criteria** (what must be TRUE):
  1. W trybie testu pomocnik jest wyłączony, wyjaśnienia pojawiają się po zakończeniu
  2. Wynik liczony przez backend zgadza się z ręcznym przeliczeniem według klucza
  3. Panel klasy pokazuje liczebność, trafność przed–po i niepotrzebne alarmy lub „brak danych”
  4. Widok nauczyciela nie zawiera prywatnych spraw; wyniki demo oznaczone jako syntetyczne

**Plans**: TBD
**UI hint**: yes

### Phase 4: Integracja na prawdziwych zapisach

**Goal**: Panel i test działają na rzeczywistych zapisach backendu we wspólnej historii demo
**Depends on**: Phase 2, Phase 3
**Requirements**: TST-04
**Success Criteria** (what must be TRUE):
  1. Sprawa wysłana z widgetu pojawia się w panelu, opiekun odpowiada, dziecko widzi odpowiedź
  2. Wyniki z testu i z importu Roblox są rozróżnione po pochodzeniu
  3. Niedostępny backend daje czytelny komunikat w panelu

**Plans**: TBD

---
*Roadmap created: 2026-10-03*
