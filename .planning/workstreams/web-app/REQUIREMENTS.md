# Requirements: Cyberpomocnik — workstream web-app

**Defined:** 2026-10-03
**Core Value:** Sprawa wysłana przez dziecko trafia do opiekuna, odpowiedź wraca, a test przed–po daje policzalne wyniki.
**Scope:** backend (osoba 3, W1) + panel opiekuna i ekran testów (osoba 2, O1–O6). Kontrakt: `.planning/shared/CONTRACT.md`.

## v1 Requirements

### Backend

- [x] **API-01**: Wtyczka (zalogowana kontem rodzica) tworzy zgłoszenie dziecka: rodzaj ataku + checkboxy podjętych działań; rodzic i nauczyciel listują (z paginacją) i pobierają szczegóły zgłoszeń, które mogą widzieć; zapisy przeżywają odświeżenie
- [x] **API-02**: Obieg zgłoszenia: rodzic zatwierdza/odrzuca → zatwierdzone trafia do nauczyciela, który prowadzi sprawę, może ją eskalować (NASK itp.) i zamyka po rozwiązaniu; decyzje można cofać/wznawiać; każda zmiana stanu trafia do historii; rodzic i nauczyciel mają wątek komentarzy niewidoczny dla dziecka
- [ ] **API-03**: Klient może zapisać odpowiedzi testowe; backend liczy wynik według klucza z `shared/content/`, a nie według punktów od klienta
- [ ] **API-04**: Wyniki z oznaczonym pochodzeniem (origin) można zapisać i odczytać; trening i test samodzielności nie mieszają się
- [x] **API-06**: Logowanie demo: na sztywno fikcyjne konta rodziców i nauczycieli, logowanie e-mailem + kod (w demo zawsze `0000`); dziecko się nie loguje
- [ ] **API-05**: Widok wyników testów dla nauczyciela zwraca tylko zagregowane wyniki (zgłoszenia zatwierdzone przez rodzica nauczyciel widzi w pełni — patrz API-02)

### Panel opiekuna

- [x] **PAN-01**: Opiekun widzi listę nowych i zakończonych spraw fikcyjnego dziecka (data, źródło, krótki opis)
- [x] **PAN-02**: Opiekun widzi szczegóły sprawy: treść, sygnały, działanie dziecka i odpowiedź na „Czy już kliknąłeś, podałeś dane lub zapłaciłeś?”
- [ ] **PAN-03**: Opiekun wysyła odpowiedź i zmienia status; odpowiedź pojawia się u dziecka
- [x] **PAN-04**: Demo ma fikcyjne profile dziecka i opiekuna z oznaczonym, demonstracyjnym przełączaniem ról

### Test i wyniki

- [ ] **TST-01**: Uczestnik przechodzi test przed–po na przykładach z `shared/content/`; w trybie testu pomocnik jest wyłączony, wyjaśnienia po zakończeniu
- [ ] **TST-02**: Panel klasy pokazuje liczbę uczestników, trafność przed–po i niepotrzebne alarmy; przy braku odpowiedzi „brak danych”
- [ ] **TST-03**: Wyniki demo są oznaczone jako syntetyczne
- [ ] **TST-04**: Panel i test działają na prawdziwych zapisach backendu (po fazie na danych przykładowych)

> **Rewizja 2026-10-03:** API-01/02/05 przepisane, dodane API-06 (patrz `phases/01-*/01-CONTEXT.md` D-08…D-18). PAN-02/PAN-03/PAN-04 opisują stary model (odpowiedź do dziecka, przełączanie ról) — do przeglądu przed fazą 2.

## v2 Requirements

- **API-V2-01**: Filtrowanie spraw i eksport zagregowanych wyników
- **API-V2-02**: Wizualizacja postępu według typu zagrożenia
- **API-V2-03**: Produkcyjne uwierzytelnianie i przypisanie dziecka do opiekuna

## Out of Scope

| Feature | Reason |
|---------|--------|
| Wspólne logowanie z Roblox | Poza zakresem MVP |
| Zgłoszenia do platform | Odłożone; osobne od przekazania opiekunowi (eskalacja do NASK przez nauczyciela w MVP to tylko zmiana stanu + notatka) |
| Publiczny ranking | Niezgodne z zasadami nagród |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| API-01 | Phase 1 | Complete |
| API-02 | Phase 1 | Complete |
| API-06 | Phase 1 | Complete |
| API-03 | Phase 3 | Pending |
| API-04 | Phase 3 | Pending |
| API-05 | Phase 3 | Pending |
| PAN-01 | Phase 2 | Complete |
| PAN-02 | Phase 2 | Complete |
| PAN-03 | Phase 2 | Pending |
| PAN-04 | Phase 2 | Complete |
| TST-01 | Phase 3 | Pending |
| TST-02 | Phase 3 | Pending |
| TST-03 | Phase 3 | Pending |
| TST-04 | Phase 4 | Pending |

**Coverage:** v1: 13 total, mapped: 13, unmapped: 0 ✓

---
*Requirements defined: 2026-10-03*
