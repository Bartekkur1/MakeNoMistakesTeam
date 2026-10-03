# Roadmap: Cyberpomocnik — api-ui

## Overview

Od kontraktu i backendu, przez panel opiekuna na danych przykładowych, po test przed–po z wynikami i spięcie z prawdziwymi zapisami. Kamienie milowe zespołu: 2–3 h kontrakt, 8 h panel na wspólnych danych, 12 h pętla dziecko–opiekun, 17 h test i wyniki.

## Phases

- [ ] **Phase 1: Kontrakt i backend spraw** - API spraw i odpowiedzi z trwałym zapisem, dane przykładowe
- [ ] **Phase 2: Panel opiekuna** - lista, szczegóły, odpowiedź i status na danych przykładowych
- [ ] **Phase 3: Test przed–po i wyniki** - ekran testu, wyliczanie wyniku po stronie backendu, panel klasy
- [ ] **Phase 4: Integracja na prawdziwych zapisach** - panel i testy na backendzie, błędy i pełna pętla

## Phase Details

### Phase 1: Kontrakt i backend spraw
**Goal**: Działające API spraw i odpowiedzi z trwałym zapisem oraz przykładowe dane zgodne z `shared/CONTRACT.md`
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02
**Success Criteria** (what must be TRUE):
  1. Sprawę można utworzyć, wylistować i pobrać, a po restarcie i odświeżeniu nadal istnieje
  2. Odpowiedź i zmiana statusu zapisują się i są odczytywalne
  3. Kontrakt jest zatwierdzony przez osobę 2, a przykładowe JSON-y są w `shared/`
**Plans**: TBD

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
