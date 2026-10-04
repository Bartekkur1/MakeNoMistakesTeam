# Requirements: Cyberpomocnik — workstream widget

**Defined:** 2026-10-03
**Core Value:** Dziecko przekazuje podejrzaną treść, przechodzi krótkie pytania, dostaje wskazówki i świadomie wysyła sprawę opiekunowi.
**Scope:** rozszerzenie przeglądarkowe + mobilna strona do wklejenia treści (osoba 3, W2–W7). Backend należy do `web-app`; kontrakt: `.planning/shared/CONTRACT.md`. Reguły i treści: `.planning/shared/content/`.

## v1 Requirements

### Rozszerzenie

- [x] **WID-01**: Użytkownik uruchamia awatara w rozszerzeniu na komputerze
- [x] **WID-02**: Użytkownik przekazuje zaznaczoną treść albo wkleja wiadomość/link ręcznie; dostęp do strony tylko na działanie użytkownika

### Ścieżka sprawdzania

- [ ] **CHK-01**: Pomocnik zadaje pytania: kto wysłał, czego żąda, czy jest presja czasu, czy można sprawdzić oficjalnym kanałem (reguły i treści z `shared/content/`)
- [ ] **CHK-02**: Wynik pokazuje sygnały, brakujące informacje i proponowany krok, bez gwarancji bezpieczeństwa lub wiarygodności
- [ ] **CHK-03**: Uczciwa wiadomość i brak pewności pomocnika są obsłużone bez fałszywego alarmu

### Przekazanie opiekunowi

- [ ] **HND-01**: Dziecko widzi podgląd przekazywanych danych przed wysłaniem i potwierdza zapis
- [ ] **HND-02**: „Pokaż opiekunowi” jest oddzielone od instrukcji zgłoszenia na platformie
- [ ] **HND-03**: Dziecko widzi odpowiedź opiekuna

### Mobilna wersja i błędy

- [ ] **MOB-01**: Ta sama ścieżka działa jako mobilna strona do wklejenia tekstu/linku; nie przedstawiana jako natywny widget ani czytnik innych aplikacji
- [ ] **ERR-01**: Pusta treść, niedostępny backend i nieudany zapis mają czytelny komunikat; brak fałszywego potwierdzenia wysłania

## v2 Requirements

- **WID-V2-01**: Zrzuty ekranu z podglądem i usuwaniem danych przed wysłaniem
- **WID-V2-02**: Analiza tekstu wspomagana AI z zachowaniem ustalonych reguł
- **WID-V2-03**: Natywny widget / aplikacje mobilne

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automatyczne czytanie innych aplikacji | Poza zakresem; pomocnik działa na treści przekazanej przez dziecko |
| Automatyczne zgłoszenia do platform | Odłożone |
| AI jako warunek działania | Opcjonalne; reguły ustalone z góry |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| WID-01 | Phase 1 | Complete |
| WID-02 | Phase 1 | Complete |
| CHK-01 | Phase 2 | Pending |
| CHK-02 | Phase 2 | Pending |
| CHK-03 | Phase 2 | Pending |
| HND-01 | Phase 3 | Pending |
| HND-02 | Phase 3 | Pending |
| HND-03 | Phase 3 | Pending |
| ERR-01 | Phase 3 | Pending |
| MOB-01 | Phase 4 | Pending |

**Coverage:** v1: 10 total, mapped: 10, unmapped: 0 ✓

---
*Requirements defined: 2026-10-03*
